/**
 * StraightEdge Component Happy Path Tests
 * 
 * Tests successful straight edge rendering, midpoint handles, and interactions.
 * Following TDD methodology - these tests define expected behavior before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StraightEdge } from '../../../../src/components/edges/StraightEdge'
import { edgeProps, edgeStyles, visualStates, dragHandles } from '../../../fixtures/edges'

// Mock SVG path calculations for predictable testing
vi.mock('../../../../src/lib/svgPaths', () => ({
  calculateStraightPath: vi.fn((start, end) => 
    `M ${start.x},${start.y} L ${end.x},${end.y}`
  ),
  calculatePathLength: vi.fn(() => 200),
  getPointAtDistance: vi.fn(() => ({ x: 300, y: 180 })),
  getMidpoint: vi.fn(() => ({ x: 300, y: 180 })),
}))

describe('StraightEdge - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render basic straight edge with default props', () => {
    const props = edgeProps.straightEdge
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    // Should render edge path element
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    expect(edgePath).toHaveAttribute('data-edge-id', props.id)
    
    // Should have correct straight path
    expect(edgePath).toHaveAttribute('d', 'M 300,180 L 300,180')
    
    // Should apply default styling
    expect(edgePath).toHaveAttribute('stroke', '#333333')
    expect(edgePath).toHaveAttribute('stroke-width', '4')
    expect(edgePath).toHaveAttribute('opacity', '1')
  })

  test('should render straight edge with custom styling', () => {
    const props = {
      ...edgeProps.straightEdge,
      style: edgeStyles.colored,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveAttribute('stroke', '#3b82f6')
    expect(edgePath).toHaveAttribute('stroke-width', '3')
  })

  test('should calculate correct straight line path', () => {
    const props = {
      ...edgeProps.straightEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100, y: 150 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 400, y: 200 },
      },
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 100,150 L 400,200')
  })

  test('should show midpoint handle when selected', () => {
    const props = {
      ...edgeProps.straightEdge,
      visualState: visualStates.selected,
      showMidpointHandle: true,
      midpointHandle: dragHandles.visible,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    // Should render midpoint handle
    const midpointHandle = screen.getByTestId('midpoint-handle')
    expect(midpointHandle).toBeInTheDocument()
    expect(midpointHandle).toHaveAttribute('cx', '350')
    expect(midpointHandle).toHaveAttribute('cy', '150')
    expect(midpointHandle).toHaveAttribute('r', '8')
    expect(midpointHandle).toHaveAttribute('fill', '#10b981')
  })

  test('should hide midpoint handle when not selected', () => {
    const props = {
      ...edgeProps.straightEdge,
      visualState: visualStates.default,
      showMidpointHandle: false,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    // Should not render midpoint handle
    expect(screen.queryByTestId('midpoint-handle')).not.toBeInTheDocument()
  })

  test('should handle hover state correctly', () => {
    const props = {
      ...edgeProps.straightEdge,
      visualState: visualStates.hovered,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveClass('edge-hovered')
    expect(edgePath).toHaveAttribute('stroke-width', '6') // Increased on hover
  })

  test('should handle selection state correctly', () => {
    const props = {
      ...edgeProps.straightEdge,
      visualState: visualStates.selected,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveClass('edge-selected')
    
    // Should render selection highlight
    const highlight = screen.getByTestId('selection-highlight')
    expect(highlight).toBeInTheDocument()
    expect(highlight).toHaveAttribute('stroke-width', '8')
  })

  test('should emit click event with correct data', () => {
    const onEdgeClick = vi.fn()
    const props = {
      ...edgeProps.straightEdge,
      onEdgeClick,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    fireEvent.click(edgePath)
    
    expect(onEdgeClick).toHaveBeenCalledWith({
      edgeId: props.id,
      position: expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }),
      distanceFromStart: expect.any(Number),
      event: expect.any(Object),
    })
  })

  test('should handle midpoint drag events', () => {
    const onMidpointDrag = vi.fn()
    const props = {
      ...edgeProps.straightEdge,
      visualState: visualStates.selected,
      showMidpointHandle: true,
      midpointHandle: dragHandles.visible,
      onMidpointDrag,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const midpointHandle = screen.getByTestId('midpoint-handle')
    
    // Simulate drag start
    fireEvent.mouseDown(midpointHandle, { clientX: 350, clientY: 150 })
    
    expect(onMidpointDrag).toHaveBeenCalledWith({
      edgeId: props.id,
      startPosition: { x: 350, y: 150 },
      midpointPosition: { x: 350, y: 150 },
      event: expect.any(Object),
    })
  })

  test('should render edge with markers', () => {
    const props = {
      ...edgeProps.straightEdge,
      style: edgeStyles.withMarkers,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveAttribute('marker-start', 'url(#arrow-start)')
    expect(edgePath).toHaveAttribute('marker-end', 'url(#arrow-end)')
  })

  test('should render edge label when provided', () => {
    const props = {
      ...edgeProps.straightEdge,
      label: {
        text: 'Straight Connection',
        position: 0.5,
        offset: 15,
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontSize: 12,
        padding: 4,
      },
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    // Should render label group
    const labelGroup = screen.getByTestId('edge-label')
    expect(labelGroup).toBeInTheDocument()
    
    // Should render label text at midpoint
    const labelText = screen.getByTestId('edge-label-text')
    expect(labelText).toHaveTextContent('Straight Connection')
    expect(labelText).toHaveAttribute('x', '300') // Midpoint x
    expect(labelText).toHaveAttribute('y', '165') // Midpoint y - offset
  })

  test('should handle vertical straight lines', () => {
    const props = {
      ...edgeProps.straightEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'bottom',
        position: { x: 200, y: 100 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'top',
        position: { x: 200, y: 300 },
      },
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 200,100 L 200,300')
  })

  test('should handle horizontal straight lines', () => {
    const props = {
      ...edgeProps.straightEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100, y: 200 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 400, y: 200 },
      },
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 100,200 L 400,200')
  })

  test('should calculate correct distance along path', () => {
    const onEdgeClick = vi.fn()
    const props = {
      ...edgeProps.straightEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100, y: 200 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 400, y: 200 },
      },
      onEdgeClick,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    
    // Click at quarter point
    fireEvent.click(edgePath, { clientX: 175, clientY: 200 })
    
    expect(onEdgeClick).toHaveBeenCalledWith({
      edgeId: props.id,
      position: { x: 175, y: 200 },
      distanceFromStart: 0.25, // 25% along the path
      event: expect.any(Object),
    })
  })

  test('should handle very short straight edges', () => {
    const props = {
      ...edgeProps.straightEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100, y: 100 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 105, y: 102 },
      },
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 100,100 L 105,102')
    expect(edgePath).toBeInTheDocument()
  })

  test('should handle context menu events', () => {
    const onEdgeContextMenu = vi.fn()
    const props = {
      ...edgeProps.straightEdge,
      onEdgeContextMenu,
    }
    
    render(
      <svg>
        <StraightEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    fireEvent.contextMenu(edgePath)
    
    expect(onEdgeContextMenu).toHaveBeenCalledWith({
      edgeId: props.id,
      position: expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
      }),
      event: expect.any(Object),
    })
  })

  test('should validate TypeScript types correctly', () => {
    // Type inference test for StraightEdgeProps
    const validProps: typeof edgeProps.straightEdge = {
      id: 'test-straight',
      type: 'straight',
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100, y: 150 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 300, y: 150 },
      },
      path: {
        type: 'straight',
        start: { x: 100, y: 150 },
        end: { x: 300, y: 150 },
      },
      showMidpointHandle: false,
    }
    
    expect(validProps.type).toBe('straight')
    expect(typeof validProps.showMidpointHandle).toBe('boolean')
    expect(validProps.path.type).toBe('straight')
  })
})