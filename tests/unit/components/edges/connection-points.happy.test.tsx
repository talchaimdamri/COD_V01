/**
 * Connection Points and Node Anchors Happy Path Tests
 * 
 * Tests successful anchor positioning, hover states, click detection, and connection validation.
 * Following TDD methodology - these tests define expected behavior before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NodeAnchor } from '../../../../src/components/edges/NodeAnchor'
import { ConnectionPoint } from '../../../../src/components/edges/ConnectionPoint'
import { nodeAnchors, baseConnectionPoints, EDGE_SELECTORS } from '../../../fixtures/edges'

describe('Connection Points - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render node anchor with correct positioning', () => {
    const props = {
      ...nodeAnchors.bidirectional,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toBeInTheDocument()
    expect(anchor).toHaveAttribute('data-anchor-id', props.id)
    expect(anchor).toHaveAttribute('data-connection-type', 'bidirectional')
    
    // Should position anchor correctly based on node position and anchor position
    expect(anchor).toHaveAttribute('cx', '250') // Right side of node
    expect(anchor).toHaveAttribute('cy', '180') // Center height
  })

  test('should render input-only anchor with correct styling', () => {
    const props = {
      ...nodeAnchors.inputOnly,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toHaveAttribute('data-connection-type', 'input')
    expect(anchor).toHaveClass('anchor-input')
    
    // Input anchors should have distinctive styling
    expect(anchor).toHaveAttribute('fill', '#10b981') // Input color
    expect(anchor).toHaveAttribute('stroke', '#047857')
  })

  test('should render output-only anchor with correct styling', () => {
    const props = {
      ...nodeAnchors.outputOnly,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toHaveAttribute('data-connection-type', 'output')
    expect(anchor).toHaveClass('anchor-output')
    
    // Output anchors should have distinctive styling
    expect(anchor).toHaveAttribute('fill', '#3b82f6') // Output color
    expect(anchor).toHaveAttribute('stroke', '#1d4ed8')
  })

  test('should handle anchor with position offset', () => {
    const props = {
      ...nodeAnchors.withOffset,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    
    // Should apply offset to base position
    // Top position with offset: x: center + offset.x, y: top + offset.y
    expect(anchor).toHaveAttribute('cx', '260') // 250 + 10
    expect(anchor).toHaveAttribute('cy', '145') // 150 - 5
  })

  test('should show anchor when visible is true', () => {
    const props = {
      ...nodeAnchors.bidirectional,
      visible: true,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toHaveAttribute('opacity', '1')
    expect(anchor).toHaveClass('anchor-visible')
  })

  test('should hide anchor when visible is false', () => {
    const props = {
      ...nodeAnchors.bidirectional,
      visible: false,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toHaveAttribute('opacity', '0')
    expect(anchor).toHaveClass('anchor-hidden')
  })

  test('should handle hover state correctly', async () => {
    const onAnchorHover = vi.fn()
    const props = {
      ...nodeAnchors.bidirectional,
      visible: true,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
      onAnchorHover,
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    
    // Hover over anchor
    fireEvent.mouseEnter(anchor)
    
    await waitFor(() => {
      expect(anchor).toHaveClass('anchor-hovered')
      expect(anchor).toHaveAttribute('r', '8') // Increased radius on hover
    })
    
    expect(onAnchorHover).toHaveBeenCalledWith({
      anchorId: props.id,
      nodeId: props.nodeId,
      hovered: true,
      position: { x: 250, y: 180 },
    })
    
    // Mouse leave
    fireEvent.mouseLeave(anchor)
    
    await waitFor(() => {
      expect(anchor).not.toHaveClass('anchor-hovered')
      expect(anchor).toHaveAttribute('r', '6') // Default radius
    })
    
    expect(onAnchorHover).toHaveBeenLastCalledWith({
      anchorId: props.id,
      nodeId: props.nodeId,
      hovered: false,
      position: { x: 250, y: 180 },
    })
  })

  test('should handle click events for connection initiation', () => {
    const onConnectionStart = vi.fn()
    const props = {
      ...nodeAnchors.outputOnly,
      visible: true,
      connectable: true,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
      onConnectionStart,
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    fireEvent.click(anchor)
    
    expect(onConnectionStart).toHaveBeenCalledWith({
      sourceConnection: {
        nodeId: 'test-node',
        anchorId: props.id,
        position: { x: 250, y: 180 },
      },
      event: expect.any(Object),
    })
  })

  test('should disable interaction when not connectable', () => {
    const onConnectionStart = vi.fn()
    const props = {
      ...nodeAnchors.notConnectable,
      nodeId: 'test-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
      onConnectionStart,
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toHaveClass('anchor-disabled')
    expect(anchor).toHaveAttribute('cursor', 'not-allowed')
    
    // Click should not trigger connection
    fireEvent.click(anchor)
    expect(onConnectionStart).not.toHaveBeenCalled()
  })

  test('should render connection point with correct properties', () => {
    const props = {
      ...baseConnectionPoints.documentNode,
      highlighted: false,
      valid: true,
    }
    
    render(
      <svg>
        <ConnectionPoint {...props} />
      </svg>
    )
    
    const connectionPoint = screen.getByTestId('connection-point')
    expect(connectionPoint).toBeInTheDocument()
    expect(connectionPoint).toHaveAttribute('cx', '200')
    expect(connectionPoint).toHaveAttribute('cy', '150')
    expect(connectionPoint).toHaveAttribute('data-node-id', 'doc-1')
    expect(connectionPoint).toHaveAttribute('data-anchor-id', 'right')
  })

  test('should highlight valid connection points during drag', () => {
    const props = {
      ...baseConnectionPoints.agentNode,
      highlighted: true,
      valid: true,
    }
    
    render(
      <svg>
        <ConnectionPoint {...props} />
      </svg>
    )
    
    const connectionPoint = screen.getByTestId('connection-point')
    expect(connectionPoint).toHaveClass('connection-valid')
    expect(connectionPoint).toHaveAttribute('fill', '#10b981') // Valid color
    expect(connectionPoint).toHaveAttribute('r', '10') // Larger radius when highlighted
  })

  test('should show invalid state for incompatible connections', () => {
    const props = {
      ...baseConnectionPoints.agentNode,
      highlighted: true,
      valid: false,
    }
    
    render(
      <svg>
        <ConnectionPoint {...props} />
      </svg>
    )
    
    const connectionPoint = screen.getByTestId('connection-point')
    expect(connectionPoint).toHaveClass('connection-invalid')
    expect(connectionPoint).toHaveAttribute('fill', '#ef4444') // Invalid color
    expect(connectionPoint).toHaveAttribute('stroke', '#dc2626')
  })

  test('should calculate anchor positions for all anchor types', () => {
    const nodePosition = { x: 200, y: 150 }
    const nodeSize = { width: 100, height: 60 }
    
    const anchorPositions = [
      { position: 'top', expected: { x: 250, y: 150 } },
      { position: 'right', expected: { x: 300, y: 180 } },
      { position: 'bottom', expected: { x: 250, y: 210 } },
      { position: 'left', expected: { x: 200, y: 180 } },
      { position: 'center', expected: { x: 250, y: 180 } },
    ] as const
    
    anchorPositions.forEach(({ position, expected }) => {
      const props = {
        id: `anchor-${position}`,
        position,
        connectionType: 'bidirectional' as const,
        connectable: true,
        visible: true,
        nodeId: 'test-node',
        nodePosition,
        nodeSize,
      }
      
      const { unmount } = render(
        <svg>
          <NodeAnchor {...props} />
        </svg>
      )
      
      const anchor = screen.getByTestId('node-anchor')
      expect(anchor).toHaveAttribute('cx', expected.x.toString())
      expect(anchor).toHaveAttribute('cy', expected.y.toString())
      
      unmount()
    })
  })

  test('should emit drag start event with correct connection data', () => {
    const onDragStart = vi.fn()
    const props = {
      ...nodeAnchors.outputOnly,
      visible: true,
      nodeId: 'source-node',
      nodePosition: { x: 100, y: 100 },
      nodeSize: { width: 80, height: 50 },
      onDragStart,
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    fireEvent.mouseDown(anchor, { button: 0 })
    
    expect(onDragStart).toHaveBeenCalledWith({
      sourceConnection: {
        nodeId: 'source-node',
        anchorId: props.id,
        position: { x: 180, y: 125 }, // Right side of node
      },
      startPosition: { x: 180, y: 125 },
      event: expect.any(Object),
    })
  })

  test('should validate connection compatibility correctly', () => {
    // Test connection validation function
    const { validateConnection } = require('../../../../schemas/api/edges')
    
    // Valid connections
    expect(
      validateConnection(nodeAnchors.outputOnly, nodeAnchors.inputOnly)
    ).toEqual({ valid: true })
    
    expect(
      validateConnection(nodeAnchors.bidirectional, nodeAnchors.inputOnly)
    ).toEqual({ valid: true })
    
    expect(
      validateConnection(nodeAnchors.outputOnly, nodeAnchors.bidirectional)
    ).toEqual({ valid: true })
    
    // Invalid connections
    expect(
      validateConnection(nodeAnchors.inputOnly, nodeAnchors.inputOnly)
    ).toEqual({ 
      valid: false, 
      reason: 'Cannot connect two input anchors' 
    })
    
    expect(
      validateConnection(nodeAnchors.outputOnly, nodeAnchors.outputOnly)
    ).toEqual({ 
      valid: false, 
      reason: 'Cannot connect two output anchors' 
    })
    
    expect(
      validateConnection(nodeAnchors.notConnectable, nodeAnchors.inputOnly)
    ).toEqual({ 
      valid: false, 
      reason: 'One or both anchor points are not connectable' 
    })
  })

  test('should provide accessibility attributes', () => {
    const props = {
      ...nodeAnchors.bidirectional,
      visible: true,
      nodeId: 'accessible-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    expect(anchor).toHaveAttribute('role', 'button')
    expect(anchor).toHaveAttribute('aria-label', 
      `Connection anchor: ${props.position}, type: ${props.connectionType}`
    )
    expect(anchor).toHaveAttribute('tabindex', '0')
  })

  test('should support keyboard interaction', () => {
    const onConnectionStart = vi.fn()
    const props = {
      ...nodeAnchors.outputOnly,
      visible: true,
      nodeId: 'keyboard-node',
      nodePosition: { x: 200, y: 150 },
      nodeSize: { width: 100, height: 60 },
      onConnectionStart,
    }
    
    render(
      <svg>
        <NodeAnchor {...props} />
      </svg>
    )
    
    const anchor = screen.getByTestId('node-anchor')
    
    // Should respond to Enter key
    fireEvent.keyDown(anchor, { key: 'Enter' })
    expect(onConnectionStart).toHaveBeenCalled()
    
    // Should respond to Space key
    onConnectionStart.mockClear()
    fireEvent.keyDown(anchor, { key: ' ' })
    expect(onConnectionStart).toHaveBeenCalled()
  })
})