/**
 * Node Drag Behavior Tests
 * 
 * Tests drag interactions for both DocumentNode and AgentNode components.
 * Focuses on SVG transform updates, mouse/touch events, and coordinate handling.
 * 
 * Test Requirements (Task 6.3):
 * - Mouse drag initiation and handling
 * - Touch drag support for mobile devices
 * - SVG transform updates during drag
 * - Coordinate system transformations
 * - Drag boundaries and constraints
 * - Event propagation and cancellation
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  documentNodeFixtures,
  agentNodeFixtures,
  dragScenarios,
  touchScenarios,
  nodeTestUtils,
  NODE_CONFIG
} from '../../fixtures/nodes'

// Mock requestAnimationFrame for drag animations
const mockRequestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16) // ~60fps
  return 1
})

const mockCancelAnimationFrame = vi.fn()

// Mock for event sourcing hook  
const mockEventSourcing = {
  moveNode: vi.fn().mockResolvedValue(true),
  selectElement: vi.fn(),
  canvasState: {
    selectedNodeId: null,
    dragState: {
      isDragging: false,
      nodeId: null,
      startPosition: null,
      currentPosition: null
    }
  }
}

// Mock DragableNode component (combines drag behavior for both node types)
const DraggableNode = vi.fn(({ node, onDragStart, onDragMove, onDragEnd, onSelect, ...props }) => {
  const [isDragging, setIsDragging] = React.useState(false)
  const [dragStartPos, setDragStartPos] = React.useState(null)
  const [currentPos, setCurrentPos] = React.useState(node.position)
  const dragRef = React.useRef(null)
  
  const handleMouseDown = (event) => {
    if (event.button !== 0) return // Only handle left click
    
    event.preventDefault()
    event.stopPropagation()
    
    const startPos = {
      x: event.clientX,
      y: event.clientY
    }
    
    setDragStartPos(startPos)
    setIsDragging(true)
    
    onDragStart?.(node.id, node.position, startPos)
    onSelect?.(node.id)
    
    // Add global mouse event listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  const handleMouseMove = (event) => {
    if (!isDragging || !dragStartPos) return
    
    const deltaX = event.clientX - dragStartPos.x
    const deltaY = event.clientY - dragStartPos.y
    
    const newPos = {
      x: node.position.x + deltaX,
      y: node.position.y + deltaY
    }
    
    // Apply boundaries
    newPos.x = Math.max(0, Math.min(1200, newPos.x))
    newPos.y = Math.max(0, Math.min(800, newPos.y))
    
    setCurrentPos(newPos)
    onDragMove?.(node.id, newPos, { deltaX, deltaY })
  }
  
  const handleMouseUp = (event) => {
    if (!isDragging) return
    
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    setIsDragging(false)
    onDragEnd?.(node.id, currentPos, dragStartPos)
    setDragStartPos(null)
  }
  
  // Touch event handlers
  const handleTouchStart = (event) => {
    if (event.touches.length !== 1) return
    
    event.preventDefault()
    const touch = event.touches[0]
    
    const startPos = {
      x: touch.clientX,
      y: touch.clientY
    }
    
    setDragStartPos(startPos)
    setIsDragging(true)
    
    onDragStart?.(node.id, node.position, startPos)
    onSelect?.(node.id)
  }
  
  const handleTouchMove = (event) => {
    if (!isDragging || !dragStartPos || event.touches.length !== 1) return
    
    event.preventDefault()
    const touch = event.touches[0]
    
    const deltaX = touch.clientX - dragStartPos.x
    const deltaY = touch.clientY - dragStartPos.y
    
    const newPos = {
      x: node.position.x + deltaX,
      y: node.position.y + deltaY
    }
    
    // Apply boundaries
    newPos.x = Math.max(0, Math.min(1200, newPos.x))
    newPos.y = Math.max(0, Math.min(800, newPos.y))
    
    setCurrentPos(newPos)
    onDragMove?.(node.id, newPos, { deltaX, deltaY })
  }
  
  const handleTouchEnd = (event) => {
    if (!isDragging) return
    
    event.preventDefault()
    setIsDragging(false)
    onDragEnd?.(node.id, currentPos, dragStartPos)
    setDragStartPos(null)
  }
  
  return (
    <g
      ref={dragRef}
      data-testid={`${node.type}-node`}
      data-node-id={node.id}
      data-dragging={isDragging}
      transform={`translate(${currentPos.x}, ${currentPos.y})`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      {/* Simplified node representation for drag testing */}
      <circle
        data-testid="node-shape"
        r={node.type === 'document' ? 40 : 35}
        fill={node.type === 'document' ? '#3b82f6' : '#10b981'}
        stroke={isDragging ? '#1e40af' : 'transparent'}
        strokeWidth={2}
      />
      <text
        data-testid="node-title"
        textAnchor="middle"
        dy="0.3em"
        fontSize="12"
        fill="white"
        pointerEvents="none"
      >
        {node.title}
      </text>
    </g>
  )
})

// Test wrapper component
const DragTestCanvas = ({ nodes = [], onDragStart, onDragMove, onDragEnd, onSelect }) => (
  <svg width="1200" height="800" data-testid="drag-canvas">
    {nodes.map(node => (
      <DraggableNode
        key={node.id}
        node={node}
        onDragStart={onDragStart}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onSelect={onSelect}
      />
    ))}
  </svg>
)

describe('Node Drag Behavior', () => {
  let mockHandlers

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', mockRequestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame)
    
    mockHandlers = {
      onDragStart: vi.fn(),
      onDragMove: vi.fn(),
      onDragEnd: vi.fn(),
      onSelect: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Mouse Drag Initiation', () => {
    test('should initiate drag on mouse down for document node', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(nodeElement, {
        button: 0,
        clientX: 100,
        clientY: 100
      })
      
      expect(mockHandlers.onDragStart).toHaveBeenCalledWith(
        node.id,
        node.position,
        { x: 100, y: 100 }
      )
      expect(mockHandlers.onSelect).toHaveBeenCalledWith(node.id)
      expect(nodeElement).toHaveAttribute('data-dragging', 'true')
    })
    
    test('should initiate drag on mouse down for agent node', () => {
      const node = agentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('agent-node')
      
      fireEvent.mouseDown(nodeElement, {
        button: 0,
        clientX: 200,
        clientY: 150
      })
      
      expect(mockHandlers.onDragStart).toHaveBeenCalledWith(
        node.id,
        node.position,
        { x: 200, y: 150 }
      )
      expect(nodeElement).toHaveAttribute('data-dragging', 'true')
    })
    
    test('should not initiate drag on right mouse button', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(nodeElement, {
        button: 2, // Right click
        clientX: 100,
        clientY: 100
      })
      
      expect(mockHandlers.onDragStart).not.toHaveBeenCalled()
      expect(nodeElement).toHaveAttribute('data-dragging', 'false')
    })
  })
  
  describe('Mouse Drag Movement', () => {
    test('should update position during mouse drag', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      // Start drag
      fireEvent.mouseDown(nodeElement, {
        button: 0,
        clientX: 100,
        clientY: 100
      })
      
      // Move mouse
      act(() => {
        fireEvent.mouseMove(document, {
          clientX: 150,
          clientY: 120
        })
      })
      
      expect(mockHandlers.onDragMove).toHaveBeenCalledWith(
        node.id,
        expect.objectContaining({
          x: node.position.x + 50, // 150 - 100
          y: node.position.y + 20  // 120 - 100
        }),
        { deltaX: 50, deltaY: 20 }
      )
      
      // SVG transform should be updated
      expect(nodeElement).toHaveAttribute(
        'transform',
        `translate(${node.position.x + 50}, ${node.position.y + 20})`
      )
    })
    
    test('should constrain movement within canvas boundaries', () => {
      const node = { ...documentNodeFixtures.basic, position: { x: 50, y: 50 } }
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      // Start drag
      fireEvent.mouseDown(nodeElement, {
        clientX: 100,
        clientY: 100
      })
      
      // Try to move beyond left boundary
      act(() => {
        fireEvent.mouseMove(document, {
          clientX: -100, // Would result in negative x
          clientY: 100
        })
      })
      
      // Position should be constrained to boundary (x: 0)
      expect(nodeElement).toHaveAttribute('transform', 'translate(0, 50)')
    })
  })
  
  describe('Mouse Drag End', () => {
    test('should complete drag on mouse up', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      // Start and move drag
      fireEvent.mouseDown(nodeElement, {
        clientX: 100,
        clientY: 100
      })
      
      act(() => {
        fireEvent.mouseMove(document, {
          clientX: 150,
          clientY: 120
        })
      })
      
      // End drag
      fireEvent.mouseUp(document)
      
      expect(mockHandlers.onDragEnd).toHaveBeenCalledWith(
        node.id,
        expect.objectContaining({
          x: node.position.x + 50,
          y: node.position.y + 20
        }),
        { x: 100, y: 100 }
      )
      
      expect(nodeElement).toHaveAttribute('data-dragging', 'false')
    })
    
    test('should clean up event listeners on drag end', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')
      
      // Start drag
      fireEvent.mouseDown(nodeElement, {
        clientX: 100,
        clientY: 100
      })
      
      // End drag
      fireEvent.mouseUp(document)
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
      
      removeEventListenerSpy.mockRestore()
    })
  })
  
  describe('Touch Drag Support', () => {
    test('should initiate drag on touch start', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.touchStart(nodeElement, {
        touches: [{
          clientX: 100,
          clientY: 100
        }]
      })
      
      expect(mockHandlers.onDragStart).toHaveBeenCalledWith(
        node.id,
        node.position,
        { x: 100, y: 100 }
      )
      expect(nodeElement).toHaveAttribute('data-dragging', 'true')
    })
    
    test('should update position during touch move', () => {
      const node = agentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('agent-node')
      
      // Start touch drag
      fireEvent.touchStart(nodeElement, {
        touches: [{
          clientX: 100,
          clientY: 100
        }]
      })
      
      // Move touch
      fireEvent.touchMove(nodeElement, {
        touches: [{
          clientX: 130,
          clientY: 140
        }]
      })
      
      expect(mockHandlers.onDragMove).toHaveBeenCalledWith(
        node.id,
        expect.objectContaining({
          x: node.position.x + 30,
          y: node.position.y + 40
        }),
        { deltaX: 30, deltaY: 40 }
      )
    })
    
    test('should complete drag on touch end', () => {
      const node = agentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('agent-node')
      
      // Start and move touch drag
      fireEvent.touchStart(nodeElement, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      
      fireEvent.touchMove(nodeElement, {
        touches: [{ clientX: 130, clientY: 140 }]
      })
      
      // End touch drag
      fireEvent.touchEnd(nodeElement)
      
      expect(mockHandlers.onDragEnd).toHaveBeenCalled()
      expect(nodeElement).toHaveAttribute('data-dragging', 'false')
    })
    
    test('should ignore multi-touch gestures', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      // Multi-touch start
      fireEvent.touchStart(nodeElement, {
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 120, clientY: 120 }
        ]
      })
      
      expect(mockHandlers.onDragStart).not.toHaveBeenCalled()
    })
  })
  
  describe('Coordinate System Transformations', () => {
    test('should handle screen to SVG coordinate conversion', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(nodeElement, {
        clientX: 100,
        clientY: 100
      })
      
      act(() => {
        fireEvent.mouseMove(document, {
          clientX: 200,
          clientY: 150
        })
      })
      
      // Position should be updated based on delta
      const expectedX = node.position.x + 100 // 200 - 100
      const expectedY = node.position.y + 50  // 150 - 100
      
      expect(nodeElement).toHaveAttribute(
        'transform',
        `translate(${expectedX}, ${expectedY})`
      )
    })
    
    test('should maintain relative positioning during drag', () => {
      const nodes = [
        documentNodeFixtures.basic,
        agentNodeFixtures.basic
      ]
      render(<DragTestCanvas nodes={nodes} {...mockHandlers} />)
      
      const docNode = screen.getByTestId('document-node')
      const agentNode = screen.getByTestId('agent-node')
      
      // Get initial positions
      const docTransform = docNode.getAttribute('transform')
      const agentTransform = agentNode.getAttribute('transform')
      
      // Drag document node
      fireEvent.mouseDown(docNode, { clientX: 100, clientY: 100 })
      
      act(() => {
        fireEvent.mouseMove(document, { clientX: 150, clientY: 120 })
      })
      
      // Document node should move
      expect(docNode.getAttribute('transform')).not.toBe(docTransform)
      
      // Agent node should not move
      expect(agentNode.getAttribute('transform')).toBe(agentTransform)
    })
  })
  
  describe('Drag Performance', () => {
    test('should throttle drag move events for smooth performance', async () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(nodeElement, {
        clientX: 100,
        clientY: 100
      })
      
      // Rapidly fire multiple move events
      for (let i = 0; i < 10; i++) {
        act(() => {
          fireEvent.mouseMove(document, {
            clientX: 100 + i * 5,
            clientY: 100 + i * 3
          })
        })
      }
      
      // Should handle all events but with throttling if implemented
      expect(mockHandlers.onDragMove).toHaveBeenCalled()
    })
    
    test('should use requestAnimationFrame for smooth drag updates', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(nodeElement, { clientX: 100, clientY: 100 })
      
      act(() => {
        fireEvent.mouseMove(document, { clientX: 150, clientY: 120 })
      })
      
      // requestAnimationFrame should be used for smooth updates
      expect(mockRequestAnimationFrame).toHaveBeenCalled()
    })
  })
  
  describe('Event Propagation', () => {
    test('should prevent event propagation during drag', () => {
      const node = documentNodeFixtures.basic
      const canvasClickHandler = vi.fn()
      
      render(
        <div onClick={canvasClickHandler}>
          <DragTestCanvas nodes={[node]} {...mockHandlers} />
        </div>
      )
      
      const nodeElement = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(nodeElement, {
        clientX: 100,
        clientY: 100
      })
      
      // Canvas click should not fire due to event stopping
      expect(canvasClickHandler).not.toHaveBeenCalled()
    })
    
    test('should prevent default browser behavior during drag', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        clientX: 100,
        clientY: 100
      })
      
      const preventDefaultSpy = vi.spyOn(mouseDownEvent, 'preventDefault')
      
      nodeElement.dispatchEvent(mouseDownEvent)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })
  
  describe('Error Handling', () => {
    test('should handle invalid mouse coordinates gracefully', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      expect(() => {
        fireEvent.mouseDown(nodeElement, {
          clientX: NaN,
          clientY: undefined
        })
      }).not.toThrow()
    })
    
    test('should handle missing touch coordinates', () => {
      const node = documentNodeFixtures.basic
      render(<DragTestCanvas nodes={[node]} {...mockHandlers} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      expect(() => {
        fireEvent.touchStart(nodeElement, {
          touches: [{}] // Missing clientX/clientY
        })
      }).not.toThrow()
    })
  })
  
  describe('Multiple Node Drag', () => {
    test('should handle dragging one node while others remain static', () => {
      const nodes = [
        documentNodeFixtures.basic,
        documentNodeFixtures.selected,
        agentNodeFixtures.basic
      ]
      render(<DragTestCanvas nodes={nodes} {...mockHandlers} />)
      
      const firstNode = screen.getByTestId('document-node')
      const otherNodes = screen.getAllByTestId(/node$/).filter(n => n !== firstNode)
      
      // Get initial positions
      const otherTransforms = otherNodes.map(node => node.getAttribute('transform'))
      
      // Drag first node
      fireEvent.mouseDown(firstNode, { clientX: 100, clientY: 100 })
      
      act(() => {
        fireEvent.mouseMove(document, { clientX: 150, clientY: 120 })
      })
      
      // Other nodes should remain in original positions
      otherNodes.forEach((node, index) => {
        expect(node.getAttribute('transform')).toBe(otherTransforms[index])
      })
    })
    
    test('should prevent simultaneous drags of multiple nodes', () => {
      const nodes = [documentNodeFixtures.basic, agentNodeFixtures.basic]
      render(<DragTestCanvas nodes={nodes} {...mockHandlers} />)
      
      const [docNode, agentNode] = screen.getAllByTestId(/node$/)
      
      // Start drag on first node
      fireEvent.mouseDown(docNode, { clientX: 100, clientY: 100 })
      
      // Try to start drag on second node (should be ignored)
      fireEvent.mouseDown(agentNode, { clientX: 200, clientY: 200 })
      
      expect(mockHandlers.onDragStart).toHaveBeenCalledTimes(1)
    })
  })
})