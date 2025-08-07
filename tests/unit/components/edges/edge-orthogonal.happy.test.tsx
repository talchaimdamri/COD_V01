/**
 * OrthogonalEdge Component Happy Path Tests
 * 
 * Tests successful orthogonal edge rendering, waypoints, and routing.
 * Following TDD methodology - these tests define expected behavior before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OrthogonalEdge } from '../../../../src/components/edges/OrthogonalEdge'
import { edgeProps, edgeStyles, visualStates, dragHandles } from '../../../fixtures/edges'

// Mock SVG path calculations for predictable testing
vi.mock('../../../../src/lib/svgPaths', () => ({
  calculateOrthogonalPath: vi.fn((start, end, waypoints, cornerRadius) => {
    const waypointString = waypoints?.map(p => `L ${p.x},${p.y}`).join(' ') || ''
    return `M ${start.x},${start.y} ${waypointString} L ${end.x},${end.y}`
  }),
  calculatePathLength: vi.fn(() => 450),
  getPointAtDistance: vi.fn(() => ({ x: 350, y: 250 })),
  generateWaypoints: vi.fn(() => [
    { x: 200, y: 250 },
    { x: 600, y: 250 },
  ]),
}))

describe('OrthogonalEdge - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render basic orthogonal edge with waypoints', () => {
    const props = edgeProps.orthogonalEdge
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    // Should render edge path element
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    expect(edgePath).toHaveAttribute('data-edge-id', props.id)
    
    // Should have correct orthogonal path with waypoints
    expect(edgePath).toHaveAttribute('d', 'M 200,150 L 100,250 L 600,250 L 400,150')
    
    // Should apply default styling
    expect(edgePath).toHaveAttribute('stroke', '#3b82f6')
    expect(edgePath).toHaveAttribute('stroke-width', '3')
    expect(edgePath).toHaveAttribute('opacity', '1')
  })

  test('should render orthogonal edge with rounded corners', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      cornerRadius: 10,
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    // Should contain arc commands for rounded corners
    expect(path).toContain('Q') // Quadratic curve for rounded corners
  })

  test('should show waypoint handles when selected', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      visualState: visualStates.selected,
      showWaypoints: true,
      waypointHandles: [
        {
          position: { x: 100, y: 250 },
          radius: 6,
          visible: true,
          color: '#f59e0b',
          hoverColor: '#fbbf24',
        },
        {
          position: { x: 600, y: 250 },
          radius: 6,
          visible: true,
          color: '#f59e0b',
          hoverColor: '#fbbf24',
        },
      ],
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    // Should render waypoint handles
    const waypointHandles = screen.getAllByTestId('waypoint-handle')
    expect(waypointHandles).toHaveLength(2)
    
    waypointHandles.forEach(handle => {
      expect(handle).toHaveAttribute('r', '6')
      expect(handle).toHaveAttribute('fill', '#f59e0b')
    })
  })

  test('should hide waypoint handles when not selected', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      visualState: visualStates.default,
      showWaypoints: false,
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    // Should not render waypoint handles
    expect(screen.queryByTestId('waypoint-handle')).not.toBeInTheDocument()
  })

  test('should handle hover state correctly', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      visualState: visualStates.hovered,
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveClass('edge-hovered')
    expect(edgePath).toHaveAttribute('stroke-width', '5') // Increased on hover
  })

  test('should handle selection state correctly', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      visualState: visualStates.selected,
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveClass('edge-selected')
    
    // Should render selection highlight
    const highlight = screen.getByTestId('selection-highlight')
    expect(highlight).toBeInTheDocument()
    expect(highlight).toHaveAttribute('stroke-width', '7')
  })

  test('should calculate horizontal-first orthogonal path', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 150, y: 200 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 450, y: 300 },
      },
      waypoints: [
        { x: 300, y: 200 }, // Horizontal first
        { x: 300, y: 300 }, // Then vertical
      ],
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 150,200 L 300,200 L 300,300 L 450,300')
  })

  test('should calculate vertical-first orthogonal path', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'bottom',
        position: { x: 200, y: 150 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'top',
        position: { x: 400, y: 350 },
      },
      waypoints: [
        { x: 200, y: 250 }, // Vertical first
        { x: 400, y: 250 }, // Then horizontal
      ],
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    expect(path).toBe('M 200,150 L 200,250 L 400,250 L 400,350')
  })

  test('should handle waypoint drag events', () => {
    const onWaypointDrag = vi.fn()
    const props = {
      ...edgeProps.orthogonalEdge,
      visualState: visualStates.selected,
      showWaypoints: true,
      waypointHandles: [
        {
          position: { x: 100, y: 250 },
          radius: 6,
          visible: true,
          color: '#f59e0b',
          hoverColor: '#fbbf24',
        },
      ],
      onWaypointDrag,
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const waypointHandle = screen.getByTestId('waypoint-handle')
    
    // Simulate drag
    fireEvent.mouseDown(waypointHandle, { clientX: 100, clientY: 250 })
    fireEvent.mouseMove(waypointHandle, { clientX: 150, clientY: 250 })
    
    expect(onWaypointDrag).toHaveBeenCalledWith({
      edgeId: props.id,
      waypointIndex: 0,
      oldPosition: { x: 100, y: 250 },
      newPosition: { x: 150, y: 250 },
      event: expect.any(Object),
    })
  })

  test('should emit click event with segment information', () => {
    const onEdgeClick = vi.fn()
    const props = {
      ...edgeProps.orthogonalEdge,
      onEdgeClick,
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
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
      segmentIndex: expect.any(Number),
      distanceFromStart: expect.any(Number),
      event: expect.any(Object),
    })
  })

  test('should render with different corner radius values', () => {
    const cornerRadii = [0, 5, 10, 15]
    
    cornerRadii.forEach(radius => {
      const props = {
        ...edgeProps.orthogonalEdge,
        id: `orthogonal-${radius}`,
        cornerRadius: radius,
      }
      
      const { unmount } = render(
        <svg>
          <OrthogonalEdge {...props} />
        </svg>
      )
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toBeInTheDocument()
      
      const path = edgePath.getAttribute('d')
      if (radius > 0) {
        expect(path).toContain('Q') // Should have curves for rounded corners
      } else {
        expect(path).not.toContain('Q') // No curves for sharp corners
      }
      
      unmount()
    })
  })

  test('should handle complex multi-segment paths', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      waypoints: [
        { x: 150, y: 200 },
        { x: 300, y: 200 },
        { x: 300, y: 100 },
        { x: 500, y: 100 },
        { x: 500, y: 250 },
      ],
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    // Should contain all waypoints
    expect(path).toContain('L 150,200')
    expect(path).toContain('L 300,200')
    expect(path).toContain('L 300,100')
    expect(path).toContain('L 500,100')
    expect(path).toContain('L 500,250')
  })

  test('should render edge label at calculated midpoint', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      label: {
        text: 'Orthogonal Route',
        position: 0.5,
        offset: 12,
        backgroundColor: '#ffffff',
        textColor: '#333333',
        fontSize: 11,
        padding: 4,
      },
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    // Should render label group
    const labelGroup = screen.getByTestId('edge-label')
    expect(labelGroup).toBeInTheDocument()
    
    // Should render label text at calculated position
    const labelText = screen.getByTestId('edge-label-text')
    expect(labelText).toHaveTextContent('Orthogonal Route')
    expect(labelText).toHaveAttribute('font-size', '11')
  })

  test('should auto-generate waypoints when none provided', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      waypoints: undefined, // No waypoints provided
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    // Should still render a valid orthogonal path
    expect(path).toMatch(/M \d+,\d+/)
    expect(path).toMatch(/L \d+,\d+/)
    expect(edgePath).toBeInTheDocument()
  })

  test('should handle self-loop orthogonal routing', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 250, y: 200 },
      },
      target: {
        nodeId: 'node-1', // Same node
        anchorId: 'bottom',
        position: { x: 200, y: 250 },
      },
      waypoints: [
        { x: 300, y: 200 },
        { x: 300, y: 300 },
        { x: 150, y: 300 },
        { x: 150, y: 250 },
        { x: 200, y: 250 },
      ],
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const path = edgePath.getAttribute('d')
    
    // Should create a valid self-loop path
    expect(path).toContain('M 250,200') // Start
    expect(path).toContain('L 200,250') // End back at same node
    expect(edgePath).toBeInTheDocument()
  })

  test('should support accessibility features', () => {
    const props = {
      ...edgeProps.orthogonalEdge,
      ariaLabel: 'Orthogonal connection from document to agent',
    }
    
    render(
      <svg>
        <OrthogonalEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toHaveAttribute('role', 'img')
    expect(edgePath).toHaveAttribute('aria-label', 'Orthogonal connection from document to agent')
  })

  test('should validate TypeScript types correctly', () => {
    // Type inference test for OrthogonalEdgeProps
    const validProps: typeof edgeProps.orthogonalEdge = {
      id: 'test-orthogonal',
      type: 'orthogonal',
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 200, y: 150 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 400, y: 150 },
      },
      path: {
        type: 'orthogonal',
        start: { x: 200, y: 150 },
        end: { x: 400, y: 150 },
        waypoints: [
          { x: 100, y: 250 },
          { x: 600, y: 250 },
        ],
      },
      cornerRadius: 5,
      waypoints: [
        { x: 100, y: 250 },
        { x: 600, y: 250 },
      ],
      showWaypoints: false,
    }
    
    expect(validProps.type).toBe('orthogonal')
    expect(typeof validProps.cornerRadius).toBe('number')
    expect(typeof validProps.showWaypoints).toBe('boolean')
    expect(Array.isArray(validProps.waypoints)).toBe(true)
  })
})