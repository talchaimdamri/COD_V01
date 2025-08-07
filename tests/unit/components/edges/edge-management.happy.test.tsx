/**
 * Edge Management and Canvas Integration Happy Path Tests
 * 
 * Tests edge routing algorithms, Canvas integration, and event sourcing.
 * Following TDD methodology - these tests define expected behavior before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EdgeManager } from '../../../../src/components/edges/EdgeManager'
import { Canvas } from '../../../../src/components/canvas/Canvas'
import { edgeProps, routingConfigs, testScenarios, performanceUtils } from '../../../fixtures/edges'
import { mockNodes } from '../../../fixtures/canvas'

// Mock event sourcing hook
vi.mock('../../../../src/lib/eventSourcing', () => ({
  useCanvasEventSourcing: vi.fn(() => ({
    canvasState: {
      nodes: [mockNodes.document, mockNodes.agent],
      edges: [edgeProps.bezierEdge, edgeProps.straightEdge],
      viewBox: { x: 0, y: 0, width: 1200, height: 800 },
      scale: 1,
    },
    createEdge: vi.fn(),
    deleteEdge: vi.fn(),
    updateEdgePath: vi.fn(),
    selectElement: vi.fn(),
  })),
}))

describe('Edge Management - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should manage multiple edges efficiently', () => {
    const edges = [
      edgeProps.bezierEdge,
      edgeProps.straightEdge,
      edgeProps.orthogonalEdge,
    ]
    
    const props = {
      edges,
      routing: routingConfigs.default,
      onEdgeSelect: vi.fn(),
      onEdgeDelete: vi.fn(),
      onEdgeUpdate: vi.fn(),
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    // Should render all edges
    const renderedEdges = screen.getAllByTestId('canvas-edge')
    expect(renderedEdges).toHaveLength(3)
    
    // Each edge should have correct type
    expect(renderedEdges[0]).toHaveAttribute('data-edge-type', 'bezier')
    expect(renderedEdges[1]).toHaveAttribute('data-edge-type', 'straight')
    expect(renderedEdges[2]).toHaveAttribute('data-edge-type', 'orthogonal')
  })

  test('should handle edge routing with node avoidance', () => {
    const obstacles = [
      { position: { x: 250, y: 150 }, width: 100, height: 60 },
      { position: { x: 350, y: 100 }, width: 80, height: 50 },
    ]
    
    const props = {
      edges: [edgeProps.bezierEdge],
      routing: routingConfigs.smart,
      obstacles,
      onRouteCalculated: vi.fn(),
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    expect(props.onRouteCalculated).toHaveBeenCalledWith({
      edgeId: edgeProps.bezierEdge.id,
      originalPath: edgeProps.bezierEdge.path,
      routedPath: expect.objectContaining({
        type: 'bezier',
        start: expect.any(Object),
        end: expect.any(Object),
      }),
      avoidedObstacles: expect.arrayContaining([
        expect.objectContaining({ position: { x: 250, y: 150 } }),
      ]),
    })
  })

  test('should handle orthogonal routing with waypoints', () => {
    const props = {
      edges: [edgeProps.orthogonalEdge],
      routing: routingConfigs.orthogonal,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    const orthogonalEdge = screen.getByTestId('canvas-edge')
    const pathData = orthogonalEdge.querySelector('[data-testid="edge-path"]')?.getAttribute('d')
    
    // Should create orthogonal path with waypoints
    expect(pathData).toMatch(/M \d+,\d+ L \d+,\d+ L \d+,\d+ L \d+,\d+/)
    expect(pathData).toContain('L 100,250 L 600,250') // Waypoint coordinates
  })

  test('should handle straight line routing', () => {
    const props = {
      edges: [edgeProps.straightEdge],
      routing: routingConfigs.straight,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    const straightEdge = screen.getByTestId('canvas-edge')
    const pathData = straightEdge.querySelector('[data-testid="edge-path"]')?.getAttribute('d')
    
    // Should create direct line path
    expect(pathData).toMatch(/M \d+,\d+ L \d+,\d+/)
    expect(pathData).not.toContain('C') // No bezier curves
  })

  test('should update edge paths when nodes move', async () => {
    const onEdgeUpdate = vi.fn()
    const props = {
      edges: [edgeProps.bezierEdge],
      routing: routingConfigs.default,
      onEdgeUpdate,
    }
    
    const { rerender } = render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    // Move source node
    const updatedEdge = {
      ...edgeProps.bezierEdge,
      source: {
        ...edgeProps.bezierEdge.source,
        position: { x: 250, y: 200 }, // Moved position
      },
    }
    
    rerender(
      <svg>
        <EdgeManager {...props} edges={[updatedEdge]} />
      </svg>
    )
    
    await waitFor(() => {
      expect(onEdgeUpdate).toHaveBeenCalledWith({
        edgeId: updatedEdge.id,
        reason: 'node_moved',
        oldPath: expect.any(Object),
        newPath: expect.objectContaining({
          start: { x: 250, y: 200 },
        }),
      })
    })
  })

  test('should handle edge selection and highlighting', () => {
    const onEdgeSelect = vi.fn()
    const props = {
      edges: [edgeProps.bezierEdge],
      routing: routingConfigs.default,
      selectedEdgeId: null,
      onEdgeSelect,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    const edge = screen.getByTestId('canvas-edge')
    fireEvent.click(edge)
    
    expect(onEdgeSelect).toHaveBeenCalledWith({
      edgeId: edgeProps.bezierEdge.id,
      selected: true,
      event: expect.any(Object),
    })
  })

  test('should show selection highlights for selected edges', () => {
    const props = {
      edges: [edgeProps.bezierEdge],
      routing: routingConfigs.default,
      selectedEdgeId: edgeProps.bezierEdge.id,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    const edge = screen.getByTestId('canvas-edge')
    expect(edge).toHaveClass('edge-selected')
    
    // Should show selection highlight
    const highlight = screen.getByTestId('selection-highlight')
    expect(highlight).toBeInTheDocument()
    expect(highlight).toHaveAttribute('stroke-width', '6')
  })

  test('should handle edge deletion', () => {
    const onEdgeDelete = vi.fn()
    const props = {
      edges: [edgeProps.bezierEdge],
      routing: routingConfigs.default,
      selectedEdgeId: edgeProps.bezierEdge.id,
      onEdgeDelete,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    // Should show delete handle for selected edge
    const deleteHandle = screen.getByTestId('delete-handle')
    expect(deleteHandle).toBeInTheDocument()
    
    fireEvent.click(deleteHandle)
    
    expect(onEdgeDelete).toHaveBeenCalledWith({
      edgeId: edgeProps.bezierEdge.id,
      event: expect.any(Object),
    })
  })

  test('should integrate with Canvas event sourcing', () => {
    const mockEventSourcing = require('../../../../src/lib/eventSourcing')
    
    render(<Canvas />)
    
    // Should use event sourcing for edge operations
    expect(mockEventSourcing.useCanvasEventSourcing).toHaveBeenCalled()
    
    // Should render edges from event sourcing state
    const edges = screen.getAllByTestId('canvas-edge')
    expect(edges).toHaveLength(2) // From mocked state
  })

  test('should emit CREATE_EDGE events through event sourcing', () => {
    const mockEventSourcing = require('../../../../src/lib/eventSourcing')
    const mockCreateEdge = mockEventSourcing.useCanvasEventSourcing().createEdge
    
    const props = {
      edges: [],
      routing: routingConfigs.default,
      onEdgeCreate: vi.fn(),
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    // Simulate edge creation
    const manager = screen.getByTestId('edge-manager')
    fireEvent(manager, new CustomEvent('edgeCreated', {
      detail: {
        sourceConnection: edgeProps.bezierEdge.source,
        targetConnection: edgeProps.bezierEdge.target,
        edgeType: 'bezier',
      },
    }))
    
    expect(mockCreateEdge).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceConnection: edgeProps.bezierEdge.source,
        targetConnection: edgeProps.bezierEdge.target,
        edgeType: 'bezier',
      })
    )
  })

  test('should support undo/redo for edge operations', async () => {
    const mockEventSourcing = require('../../../../src/lib/eventSourcing')
    const mockUndo = mockEventSourcing.useCanvasEventSourcing().undo
    const mockRedo = mockEventSourcing.useCanvasEventSourcing().redo
    
    render(<Canvas />)
    
    // Simulate undo
    fireEvent.keyDown(document, { key: 'z', ctrlKey: true })
    expect(mockUndo).toHaveBeenCalled()
    
    // Simulate redo
    fireEvent.keyDown(document, { key: 'y', ctrlKey: true })
    expect(mockRedo).toHaveBeenCalled()
  })

  test('should handle bulk edge operations', () => {
    const edges = performanceUtils.generateEdges(5)
    const onBulkOperation = vi.fn()
    
    const props = {
      edges,
      routing: routingConfigs.default,
      selectedEdgeIds: [edges[0].id, edges[2].id, edges[4].id],
      onBulkOperation,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    // Should handle bulk selection
    const selectedEdges = screen.getAllByTestId('canvas-edge')
      .filter(edge => edge.classList.contains('edge-selected'))
    
    expect(selectedEdges).toHaveLength(3)
    
    // Simulate bulk delete
    fireEvent.keyDown(document, { key: 'Delete' })
    
    expect(onBulkOperation).toHaveBeenCalledWith({
      operation: 'delete',
      edgeIds: [edges[0].id, edges[2].id, edges[4].id],
      event: expect.any(Object),
    })
  })

  test('should optimize rendering for many edges', () => {
    const manyEdges = performanceUtils.generateEdges(100)
    
    const startTime = performance.now()
    
    const props = {
      edges: manyEdges,
      routing: routingConfigs.default,
      optimizeRendering: true,
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    const renderTime = performance.now() - startTime
    
    // Should render efficiently with many edges
    expect(renderTime).toBeLessThan(500) // 500ms threshold
    
    // Should implement virtualization or culling
    const renderedEdges = screen.getAllByTestId('canvas-edge')
    expect(renderedEdges.length).toBeLessThanOrEqual(50) // Culled for performance
  })

  test('should handle edge intersection detection', () => {
    const intersectingEdges = testScenarios.crossingEdges
    
    const props = {
      edges: intersectingEdges,
      routing: routingConfigs.default,
      detectIntersections: true,
      onIntersectionDetected: vi.fn(),
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    expect(props.onIntersectionDetected).toHaveBeenCalledWith({
      edge1: intersectingEdges[0].id,
      edge2: intersectingEdges[1].id,
      intersectionPoint: { x: 250, y: 200 },
    })
  })

  test('should provide edge analytics and metrics', () => {
    const props = {
      edges: [edgeProps.bezierEdge, edgeProps.straightEdge],
      routing: routingConfigs.default,
      collectMetrics: true,
      onMetricsCollected: vi.fn(),
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    expect(props.onMetricsCollected).toHaveBeenCalledWith({
      totalEdges: 2,
      edgeTypes: {
        bezier: 1,
        straight: 1,
        orthogonal: 0,
      },
      averagePathLength: expect.any(Number),
      routingPerformance: {
        averageCalculationTime: expect.any(Number),
        cacheHitRate: expect.any(Number),
      },
    })
  })

  test('should handle edge grouping and layers', () => {
    const layeredEdges = [
      { ...edgeProps.bezierEdge, layer: 1, group: 'data-flow' },
      { ...edgeProps.straightEdge, layer: 2, group: 'control-flow' },
    ]
    
    const props = {
      edges: layeredEdges,
      routing: routingConfigs.default,
      layerOrder: ['data-flow', 'control-flow'],
    }
    
    render(
      <svg>
        <EdgeManager {...props} />
      </svg>
    )
    
    const edges = screen.getAllByTestId('canvas-edge')
    
    // Should respect layer ordering
    expect(edges[0]).toHaveAttribute('data-layer', '1')
    expect(edges[1]).toHaveAttribute('data-layer', '2')
    
    // Should group edges by type
    expect(edges[0]).toHaveAttribute('data-group', 'data-flow')
    expect(edges[1]).toHaveAttribute('data-group', 'control-flow')
  })

  test('should validate TypeScript integration types', () => {
    // Type inference test for edge management
    const validManagerProps = {
      edges: [edgeProps.bezierEdge],
      routing: routingConfigs.default,
      selectedEdgeId: null,
      onEdgeSelect: (data: { edgeId: string; selected: boolean; event: Event }) => {
        expect(typeof data.edgeId).toBe('string')
        expect(typeof data.selected).toBe('boolean')
        expect(data.event).toBeInstanceOf(Event)
      },
    }
    
    expect(validManagerProps.edges).toHaveLength(1)
    expect(validManagerProps.routing.algorithm).toBe('bezier')
    expect(typeof validManagerProps.onEdgeSelect).toBe('function')
  })
})