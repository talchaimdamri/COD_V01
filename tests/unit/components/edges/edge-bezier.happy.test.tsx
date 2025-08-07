/**
 * BezierEdge Component Happy Path Tests
 * 
 * Tests successful bezier edge rendering, path calculations, and user interactions.
 * Following TDD methodology - these tests define expected behavior before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BezierEdge } from '../../../../src/components/edges/BezierEdge'
import { edgeProps, bezierControlPoints, edgeStyles, visualStates } from '../../../fixtures/edges'

// Mock SVG path calculations for predictable testing
vi.mock('../../../../src/lib/svgPaths', () => ({
  calculateBezierPath: vi.fn((start, end, cp1, cp2) => 
    `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`
  ),
  calculatePathLength: vi.fn(() => 350),
  getPointAtDistance: vi.fn(() => ({ x: 250, y: 150 })),
}))

describe('BezierEdge - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render basic bezier edge with default props', () => {
    const props = edgeProps.bezierEdge
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render edge path element
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    expect(edgePath).toHaveAttribute('data-edge-id', props.id)
    
    // Should have correct bezier path
    expect(edgePath).toHaveAttribute('d', expect.stringContaining('M 200,150 C'))
    
    // Should apply default styling
    expect(edgePath).toHaveAttribute('stroke', '#666666')
    expect(edgePath).toHaveAttribute('stroke-width', '2')
    expect(edgePath).toHaveAttribute('opacity', '1')
  })

  test('should render bezier edge with custom styling', () => {
    const props = {
      ...edgeProps.bezierEdge,
      style: edgeStyles.colored,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveAttribute('stroke', '#3b82f6')
    expect(edgePath).toHaveAttribute('stroke-width', '3')
  })

  test('should render bezier edge with markers', () => {
    const props = {
      ...edgeProps.bezierEdge,
      style: edgeStyles.withMarkers,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveAttribute('marker-start', 'url(#arrow-start)')
    expect(edgePath).toHaveAttribute('marker-end', 'url(#arrow-end)')
  })

  test('should calculate correct bezier path with control points', () => {
    const props = {
      ...edgeProps.bezierEdge,
      controlPoints: bezierControlPoints.dramatic,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 200,150 C 200,50 400,250 400,150')
  })

  test('should render edge label when provided', () => {
    const props = {
      ...edgeProps.bezierEdge,
      label: {
        text: 'Test Label',
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
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render label group
    const labelGroup = screen.getByTestId('edge-label')
    expect(labelGroup).toBeInTheDocument()
    
    // Should render label background
    const labelBg = screen.getByTestId('edge-label-background')
    expect(labelBg).toHaveAttribute('fill', '#ffffff')
    
    // Should render label text
    const labelText = screen.getByTestId('edge-label-text')
    expect(labelText).toHaveTextContent('Test Label')
    expect(labelText).toHaveAttribute('fill', '#333333')
    expect(labelText).toHaveAttribute('font-size', '12')
  })

  test('should show control points when selected', () => {
    const props = {
      ...edgeProps.bezierEdge,
      visualState: visualStates.selected,
      showControlPoints: true,
      controlPointHandles: [
        {
          position: { x: 250, y: 150 },
          radius: 6,
          visible: true,
          color: '#0066cc',
          hoverColor: '#0080ff',
        },
        {
          position: { x: 350, y: 150 },
          radius: 6,
          visible: true,
          color: '#0066cc', 
          hoverColor: '#0080ff',
        },
      ],
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render control point handles
    const controlPoints = screen.getAllByTestId('control-point')
    expect(controlPoints).toHaveLength(2)
    
    controlPoints.forEach(cp => {
      expect(cp).toHaveAttribute('r', '6')
      expect(cp).toHaveAttribute('fill', '#0066cc')
    })
  })

  test('should handle hover state correctly', () => {
    const props = {
      ...edgeProps.bezierEdge,
      visualState: visualStates.hovered,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveClass('edge-hovered')
    expect(edgePath).toHaveAttribute('stroke-width', '3') // Increased on hover
  })

  test('should handle selection state correctly', () => {
    const props = {
      ...edgeProps.bezierEdge,
      visualState: visualStates.selected,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveClass('edge-selected')
    
    // Should render selection highlight
    const highlight = screen.getByTestId('selection-highlight')
    expect(highlight).toBeInTheDocument()
    expect(highlight).toHaveAttribute('stroke-width', '6')
  })

  test('should emit click event with correct data', () => {
    const onEdgeClick = vi.fn()
    const props = {
      ...edgeProps.bezierEdge,
      onEdgeClick,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
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
      event: expect.any(Object),
    })
  })

  test('should emit context menu event', () => {
    const onEdgeContextMenu = vi.fn()
    const props = {
      ...edgeProps.bezierEdge,
      onEdgeContextMenu,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
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

  test('should adjust curvature parameter correctly', () => {
    const props = {
      ...edgeProps.bezierEdge,
      curvature: 0.8, // High curvature
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    // With higher curvature, control points should be further from the line
    expect(path).toContain('C')
    expect(path).not.toBe('M 200,150 L 400,150') // Should not be straight
  })

  test('should handle animation state', () => {
    const props = {
      ...edgeProps.bezierEdge,
      visualState: visualStates.animated,
      animation: {
        enabled: true,
        type: 'flow' as const,
        duration: 2000,
        direction: 'forward' as const,
        color: '#3b82f6',
        width: 3,
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render animation element
    const animation = screen.getByTestId('flow-animation')
    expect(animation).toBeInTheDocument()
    expect(animation).toHaveAttribute('stroke', '#3b82f6')
    expect(animation).toHaveAttribute('stroke-width', '3')
  })

  test('should validate TypeScript types correctly', () => {
    // Type inference test for BezierEdgeProps
    const validProps: typeof edgeProps.bezierEdge = {
      id: 'test-bezier',
      type: 'bezier',
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
        type: 'bezier',
        start: { x: 100, y: 150 },
        end: { x: 300, y: 150 },
      },
      controlPoints: {
        cp1: { x: 150, y: 150 },
        cp2: { x: 250, y: 150 },
      },
      curvature: 0.5,
      showControlPoints: false,
    }
    
    expect(validProps.type).toBe('bezier')
    expect(typeof validProps.curvature).toBe('number')
    expect(typeof validProps.showControlPoints).toBe('boolean')
  })
})