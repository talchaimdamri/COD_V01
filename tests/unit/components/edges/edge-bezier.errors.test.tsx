/**
 * BezierEdge Component Error Handling Tests
 * 
 * Tests error scenarios, invalid props, and edge cases for bezier edge component.
 * Following TDD methodology - defines expected error handling before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BezierEdge } from '../../../../src/components/edges/BezierEdge'
import { edgeProps, errorScenarios } from '../../../fixtures/edges'

// Mock console to capture error messages
const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('BezierEdge - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockClear()
    consoleWarnSpy.mockClear()
  })

  test('should handle invalid position coordinates gracefully', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: errorScenarios.invalidPositions.nanCoordinates,
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render fallback path or handle gracefully
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Should log warning about invalid coordinates
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid position coordinates'),
      expect.any(Object)
    )
  })

  test('should handle infinite coordinates', () => {
    const props = {
      ...edgeProps.bezierEdge,
      target: {
        nodeId: 'node-2',
        anchorId: 'left',
        position: errorScenarios.invalidPositions.infiniteCoordinates,
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Path should not contain infinite values
    const pathData = edgePath.getAttribute('d')
    expect(pathData).not.toContain('Infinity')
    expect(pathData).not.toContain('NaN')
  })

  test('should handle missing control points', () => {
    const props = {
      ...edgeProps.bezierEdge,
      controlPoints: undefined,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Should generate default control points
    const pathData = edgePath.getAttribute('d')
    expect(pathData).toContain('C') // Should still be a bezier curve
  })

  test('should handle invalid curvature values', () => {
    const props = {
      ...edgeProps.bezierEdge,
      curvature: -1, // Invalid negative curvature
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid curvature value'),
      expect.objectContaining({ curvature: -1 })
    )
    
    // Should clamp to valid range
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
  })

  test('should handle excessive curvature values', () => {
    const props = {
      ...edgeProps.bezierEdge,
      curvature: 5, // Excessive curvature
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Curvature value clamped'),
      expect.objectContaining({ original: 5, clamped: 2 })
    )
  })

  test('should handle invalid edge style properties', () => {
    const props = {
      ...edgeProps.bezierEdge,
      style: {
        stroke: 'invalid-color',
        strokeWidth: -5,
        opacity: 2,
      } as any,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    
    // Should fallback to default values
    expect(edgePath).toHaveAttribute('stroke', '#666666') // Default color
    expect(edgePath).toHaveAttribute('stroke-width', '1') // Min width
    expect(edgePath).toHaveAttribute('opacity', '1') // Max opacity
  })

  test('should handle missing required props', () => {
    const props = {
      id: 'test-edge',
      // Missing required props
    } as any
    
    expect(() => {
      render(
        <svg>
          <BezierEdge {...props} />
        </svg>
      )
    }).toThrow(/Missing required props/)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('BezierEdge: Missing required props'),
      expect.any(Object)
    )
  })

  test('should handle null or undefined source/target', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: null,
      target: undefined,
    } as any
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render error state or placeholder
    const errorElement = screen.queryByTestId('edge-error-state')
    expect(errorElement).toBeInTheDocument()
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid connection points'),
      expect.any(Object)
    )
  })

  test('should handle circular references in control points', () => {
    const circularControlPoints = {
      cp1: { x: 100, y: 100 },
      cp2: { x: 100, y: 100 },
    }
    // Create circular reference
    ;(circularControlPoints as any).cp1.ref = circularControlPoints

    const props = {
      ...edgeProps.bezierEdge,
      controlPoints: circularControlPoints,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should handle gracefully without infinite loops
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
  })

  test('should handle malformed label configuration', () => {
    const props = {
      ...edgeProps.bezierEdge,
      label: {
        text: '', // Empty text
        position: -1, // Invalid position
        offset: NaN, // Invalid offset
        backgroundColor: 'not-a-color',
        fontSize: 0, // Invalid font size
      } as any,
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should not render label with invalid configuration
    const label = screen.queryByTestId('edge-label')
    expect(label).not.toBeInTheDocument()
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid label configuration'),
      expect.any(Object)
    )
  })

  test('should handle invalid animation configuration', () => {
    const props = {
      ...edgeProps.bezierEdge,
      animation: {
        enabled: true,
        type: 'invalid-type' as any,
        duration: -1000, // Invalid duration
        direction: 'invalid-direction' as any,
        color: 'not-a-color',
        width: -5, // Invalid width
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should not render animation with invalid config
    const animation = screen.queryByTestId('flow-animation')
    expect(animation).not.toBeInTheDocument()
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid animation configuration'),
      expect.any(Object)
    )
  })

  test('should handle edge cases with zero-length paths', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'center',
        position: { x: 200, y: 200 },
      },
      target: {
        nodeId: 'node-1', // Same node
        anchorId: 'center',
        position: { x: 200, y: 200 }, // Same position
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Should render as a small circle or handle zero-length case
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Zero-length edge path detected'),
      expect.any(Object)
    )
  })

  test('should handle extremely large coordinates', () => {
    const props = {
      ...edgeProps.bezierEdge,
      source: {
        nodeId: 'node-1',
        anchorId: 'right',
        position: { x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER },
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    const pathData = edgePath.getAttribute('d')
    
    // Should clamp or handle large coordinates gracefully
    expect(pathData).not.toContain(String(Number.MAX_SAFE_INTEGER))
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Large coordinate values detected')
    )
  })

  test('should handle invalid visual state properties', () => {
    const props = {
      ...edgeProps.bezierEdge,
      visualState: {
        selected: 'not-boolean' as any,
        hovered: null as any,
        dragging: undefined as any,
        connecting: 123 as any,
        animated: 'yes' as any,
      },
    }
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    const edgePath = screen.getByTestId('edge-path')
    expect(edgePath).toBeInTheDocument()
    
    // Should normalize invalid boolean values
    expect(edgePath).not.toHaveClass('edge-selected')
    expect(edgePath).not.toHaveClass('edge-hovered')
  })

  test('should handle SVG rendering failures gracefully', () => {
    // Mock SVG path calculation to throw error
    vi.doMock('../../../../src/lib/svgPaths', () => ({
      calculateBezierPath: vi.fn(() => {
        throw new Error('SVG calculation failed')
      }),
    }))
    
    const props = edgeProps.bezierEdge
    
    render(
      <svg>
        <BezierEdge {...props} />
      </svg>
    )
    
    // Should render fallback path or error state
    const errorState = screen.queryByTestId('edge-render-error')
    expect(errorState).toBeInTheDocument()
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to render bezier edge'),
      expect.any(Error)
    )
  })

  test('should validate schema compliance', () => {
    // Test that invalid props are caught by schema validation
    const invalidProps = {
      id: '', // Empty ID
      type: 'invalid-type',
      source: {
        nodeId: '',
        anchorId: '',
        position: { x: 'not-number', y: 'not-number' },
      },
    } as any
    
    expect(() => {
      render(
        <svg>
          <BezierEdge {...invalidProps} />
        </svg>
      )
    }).toThrow()
  })
})