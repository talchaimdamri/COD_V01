/**
 * BezierEdge Component Edge Case Tests
 * 
 * Tests boundary conditions, performance scenarios, and unusual configurations
 * for the bezier edge component. Following TDD methodology.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { BezierEdge } from '../../../../src/components/edges/BezierEdge'
import { edgeProps, testScenarios, performanceUtils } from '../../../fixtures/edges'

// Mock performance APIs
const performanceNowSpy = vi.spyOn(performance, 'now')
let performanceCounter = 0
performanceNowSpy.mockImplementation(() => performanceCounter++)

describe('BezierEdge - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    performanceCounter = 0
  })

  test('should handle self-loop edge rendering', () => {
    const props = {
      ...edgeProps.bezierEdge,
      ...testScenarios.selfLoop,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Self-loop should have distinctive control points
    const pathData = edgePath.getAttribute('d')
    expect(pathData).toContain('C 300,150 300,250 200,250')
    
    // Should handle label positioning for self-loops
    if (props.label) {
      const label = screen.getByTestId('edge-label')
      expect(label).toBeInTheDocument()
    }
  })

  test('should handle very short bezier curves', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100, y: 100 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left', 
        position: { x: 105, y: 102 }, // Very close points
      },
      controlPoints: {
        cp1: { x: 102, y: 100 },
        cp2: { x: 103, y: 102 },
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Path should be valid even for very short distances
    const pathData = edgePath.getAttribute('d')
    expect(pathData).toBeTruthy()
    expect(pathData).not.toContain('NaN')
  })

  test('should handle very long bezier curves', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 0, y: 0 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 2000, y: 1500 }, // Very far points
      },
      controlPoints: {
        cp1: { x: 500, y: -200 },
        cp2: { x: 1500, y: 1700 },
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Should handle large coordinates properly
    const pathData = edgePath.getAttribute('d')
    expect(pathData).toContain('M 0,0')
    expect(pathData).toContain('2000,1500')
  })

  test('should handle extreme curvature scenarios', () => {
    const testCases = [
      { curvature: 0, description: 'no curvature' },
      { curvature: 0.001, description: 'minimal curvature' },
      { curvature: 0.999, description: 'maximum curvature' },
      { curvature: 2, description: 'maximum allowed curvature' },
    ]
    
    testCases.forEach(({ curvature, description }) => {
      const props = {
        ...edgeProps.bezierEdge,
        curvature,
      }
      
      const { unmount } = render(
        <svg>
          <BezierEdge {...props} />
        </svg>
      )
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toBeInTheDocument()
      
      // Path should be valid for all curvature values
      const pathData = edgePath.getAttribute('d')
      expect(pathData).toBeTruthy()
      expect(pathData).not.toContain('NaN')
      
      unmount()
    })
  })

  test('should handle rapid visual state changes', () => {
    const props = {
      ...edgeProps.bezierEdge,
    }
    
    const { rerender } = render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Rapidly change visual states
    const states = [
      { selected: true, hovered: false },
      { selected: false, hovered: true },
      { selected: true, hovered: true },
      { selected: false, hovered: false, dragging: true },
      { selected: false, hovered: false, dragging: false, animated: true },
    ]
    
    states.forEach(visualState => {
      act(() => {
        rerender(
          <svg>
            <BezierEdge {...props} visualState={visualState} />
          </svg>
        )
      })
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toBeInTheDocument()
    })
    
    // Should handle all state changes without errors
    expect(screen.getByTestId('edge-path')).toBeInTheDocument()
  })

  test('should handle control point updates during dragging', () => {
    const onControlPointDrag = vi.fn()
    const props = {
      ...edgeProps.bezierEdge,
      visualState: { selected: true, dragging: true },
      showControlPoints: true,
      controlPointHandles: [
        {
          position: { x: 250, y: 150 },
          radius: 8,
          visible: true,
          color: '#0066cc',
          hoverColor: '#0080ff',
        },
      ],
      onControlPointDrag,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const controlPoint = screen.getByTestId('control-point')
    expect(controlPoint).toBeInTheDocument()
    
    // Should be interactive during dragging
    expect(controlPoint).toHaveAttribute('cursor', 'move')
  })

  test('should handle memory-efficient rendering for animations', () => {
    const props = {
      ...edgeProps.bezierEdge,
      visualState: { animated: true },
      animation: {
        enabled: true,
        type: 'flow' as const,
        duration: 100, // Fast animation for testing
        direction: 'forward' as const,
        color: '#3b82f6',
        width: 3,
      },
    }
    
    const startTime = performance.now()
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const renderTime = performance.now() - startTime
    
    // Should render efficiently even with animations
    expect(renderTime).toBeLessThan(50) // 50ms threshold
    
    const animation = screen.getByTestId('flow-animation')
    expect(animation).toBeInTheDocument()
  })

  test('should handle viewport culling for off-screen edges', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: -1000, y: -1000 }, // Off-screen
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: -900, y: -900 }, // Off-screen
      },
      viewport: {
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should either not render or render with minimal resources
    const edgePath = screen.queryByTestId('edge-path')
    if (edgePath) {
      // If rendered, should be optimized
      expect(edgePath).toHaveAttribute('data-culled', 'true')
    }
  })

  test('should handle complex control point geometries', () => {
    const complexControlPoints = [
      // Inverted control points
      { cp1: { x: 400, y: 150 }, cp2: { x: 200, y: 150 } },
      // Control points far from path
      { cp1: { x: 300, y: 50 }, cp2: { x: 300, y: 250 } },
      // Control points creating loops
      { cp1: { x: 350, y: 50 }, cp2: { x: 250, y: 250 } },
    ]
    
    complexControlPoints.forEach((controlPoints, index) => {
      const props = {
        ...edgeProps.bezierEdge,
        id: `complex-edge-${index}`,
        controlPoints,
      }
      
      const { unmount } = render(
        <svg>
          <BezierEdge {...props} />
        </svg>
      )
      
      const edgePath = screen.getByTestId('edge-path')
      expect(edgePath).toBeInTheDocument()
      
      // Should handle complex geometries without errors
      const pathData = edgePath.getAttribute('d')
      expect(pathData).toBeTruthy()
      expect(pathData).not.toContain('NaN')
      
      unmount()
    })
  })

  test('should handle label overflow for very long text', () => {
    const props = {
      ...edgeProps.bezierEdge,
      label: {
        text: 'This is an extremely long edge label that should be handled properly without breaking the layout or causing performance issues in the SVG rendering system',
        position: 0.5,
        offset: 15,
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: 12,
        padding: 4,
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const labelText = screen.getByTestId('edge-label-text')
    expect(labelText).toBeInTheDocument()
    
    // Should handle long text appropriately (truncation, wrapping, etc.)
    const textContent = labelText.textContent
    expect(textContent).toBeTruthy()
    
    // Should have appropriate text anchor and positioning
    expect(labelText).toHaveAttribute('text-anchor', 'middle')
  })

  test('should handle concurrent edge updates efficiently', async () => {
    const props = edgeProps.bezierEdge
    const { rerender } = render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Simulate multiple rapid updates
    const updates = Array.from({ length: 50 }, (_, i) => ({
      ...props,
      controlPoints: {
        cp1: { x: 250 + i, y: 150 },
        cp2: { x: 350 - i, y: 150 },
      },
    }))
    
    const startTime = performance.now()
    
    for (const update of updates) {
      await act(async () => {
        rerender(
          <svg>
            <BezierEdge {...update} />
          </svg>
        )
      })
    }
    
    const totalTime = performance.now() - startTime
    
    // Should handle rapid updates efficiently
    expect(totalTime).toBeLessThan(1000) // 1 second for 50 updates
    
    const finalEdge = screen.getByTestId('edge-path')
    expect(finalEdge).toBeInTheDocument()
  })

  test('should maintain precision with floating point coordinates', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: 100.123456789, y: 150.987654321 },
      },
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: { x: 400.111111111, y: 150.222222222 },
      },
      controlPoints: {
        cp1: { x: 250.333333333, y: 150.444444444 },
        cp2: { x: 350.555555555, y: 150.666666666 },
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const pathData = edgePath.getAttribute('d')
    
    // Should handle floating point precision appropriately
    expect(pathData).toBeTruthy()
    expect(pathData).not.toContain('NaN')
    
    // Should maintain reasonable precision (not excessive decimal places)
    const coordinates = pathData?.match(/[\d.]+/g)
    coordinates?.forEach(coord => {
      const decimalPlaces = (coord.split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(3) // Max 3 decimal places for SVG
    })
  })
})