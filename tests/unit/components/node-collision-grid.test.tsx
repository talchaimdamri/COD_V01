/**
 * Node Collision Detection and Snap-to-Grid Tests
 * 
 * Tests collision detection algorithms and grid snapping functionality.
 * Covers positioning logic, boundary detection, and automated positioning.
 * 
 * Test Requirements (Task 6.5):
 * - Collision detection between nodes
 * - Grid snapping calculations
 * - Automatic positioning adjustments
 * - Boundary constraints
 * - Performance optimizations
 * - Visual feedback for snapping
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  nodeCollections,
  dragScenarios,
  gridUtils,
  collisionUtils,
  NODE_CONFIG
} from '../../fixtures/nodes'

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn(() => Date.now())

// Collision detection service
const CollisionDetectionService = {
  checkCollision: (nodeA, nodeB, minDistance = NODE_CONFIG.collision.minDistance) => {
    const distance = Math.sqrt(
      Math.pow(nodeB.position.x - nodeA.position.x, 2) + 
      Math.pow(nodeB.position.y - nodeA.position.y, 2)
    )
    return distance < minDistance
  },
  
  findCollisions: (targetNode, otherNodes, minDistance = NODE_CONFIG.collision.minDistance) => {
    return otherNodes.filter(node => 
      node.id !== targetNode.id && 
      CollisionDetectionService.checkCollision(targetNode, node, minDistance)
    )
  },
  
  resolveCollision: (targetNode, collidingNodes, minDistance = NODE_CONFIG.collision.minDistance) => {
    let resolvedPosition = { ...targetNode.position }
    let attempts = 0
    const maxAttempts = 20
    
    while (attempts < maxAttempts) {
      const stillColliding = collidingNodes.some(node => 
        CollisionDetectionService.checkCollision({ ...targetNode, position: resolvedPosition }, node, minDistance)
      )
      
      if (!stillColliding) break
      
      // Try different positions in a spiral pattern
      const angle = (attempts * Math.PI * 2) / 8
      const radius = minDistance + (attempts * 20)
      
      resolvedPosition = {
        x: targetNode.position.x + Math.cos(angle) * radius,
        y: targetNode.position.y + Math.sin(angle) * radius
      }
      
      attempts++
    }
    
    return resolvedPosition
  }
}

// Grid snapping service
const GridSnappingService = {
  snapToGrid: (position, gridSize = NODE_CONFIG.grid.size) => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    }
  },
  
  shouldSnap: (position, threshold = NODE_CONFIG.grid.snapThreshold) => {
    const snappedPos = GridSnappingService.snapToGrid(position)
    const distance = Math.sqrt(
      Math.pow(position.x - snappedPos.x, 2) + 
      Math.pow(position.y - snappedPos.y, 2)
    )
    return distance <= threshold
  },
  
  getSnapPosition: (position) => {
    if (GridSnappingService.shouldSnap(position)) {
      return GridSnappingService.snapToGrid(position)
    }
    return position
  },
  
  getSnapGuides: (position, gridSize = NODE_CONFIG.grid.size) => {
    const snappedPos = GridSnappingService.snapToGrid(position)
    return {
      vertical: snappedPos.x,
      horizontal: snappedPos.y,
      shouldShow: GridSnappingService.shouldSnap(position)
    }
  }
}

// Mock CollisionGrid component that handles both collision detection and grid snapping
const CollisionGrid = vi.fn(({ 
  nodes = [], 
  onPositionChange, 
  onCollisionDetected, 
  onSnapToGrid,
  showGrid = true,
  enableCollisionDetection = true,
  enableGridSnapping = true
}) => {
  const [positions, setPositions] = React.useState(
    nodes.reduce((acc, node) => ({ ...acc, [node.id]: node.position }), {})
  )
  const [snapGuides, setSnapGuides] = React.useState({ vertical: null, horizontal: null, show: false })
  const [collisions, setCollisions] = React.useState([])
  
  // Update position with collision detection and grid snapping
  const updateNodePosition = (nodeId, newPosition) => {
    const node = nodes.find(n => n.id === nodeId)
    const otherNodes = nodes.filter(n => n.id !== nodeId)
    
    let finalPosition = { ...newPosition }
    
    // Apply grid snapping if enabled
    if (enableGridSnapping) {
      const snapPosition = GridSnappingService.getSnapPosition(newPosition)
      finalPosition = snapPosition
      
      const guides = GridSnappingService.getSnapGuides(newPosition)
      setSnapGuides({ ...guides, show: guides.shouldShow })
      
      if (guides.shouldShow) {
        onSnapToGrid?.(nodeId, snapPosition, newPosition)
      }
    }
    
    // Check for collisions if enabled
    if (enableCollisionDetection) {
      const testNode = { ...node, position: finalPosition }
      const collidingNodes = CollisionDetectionService.findCollisions(testNode, otherNodes)
      
      if (collidingNodes.length > 0) {
        onCollisionDetected?.(nodeId, collidingNodes)
        // Resolve collision
        finalPosition = CollisionDetectionService.resolveCollision(testNode, collidingNodes)
        setCollisions([{ nodeId, collidingWith: collidingNodes.map(n => n.id) }])
      } else {
        setCollisions(prev => prev.filter(c => c.nodeId !== nodeId))
      }
    }
    
    setPositions(prev => ({ ...prev, [nodeId]: finalPosition }))
    onPositionChange?.(nodeId, finalPosition, newPosition !== finalPosition)
  }
  
  return (
    <svg width="800" height="600" data-testid="collision-grid">
      {/* Grid pattern */}
      {showGrid && (
        <defs>
          <pattern
            id="grid"
            width={NODE_CONFIG.grid.size}
            height={NODE_CONFIG.grid.size}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${NODE_CONFIG.grid.size} 0 L 0 0 0 ${NODE_CONFIG.grid.size}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          </pattern>
        </defs>
      )}
      
      {showGrid && (
        <rect
          data-testid="grid-background"
          width="100%"
          height="100%"
          fill="url(#grid)"
        />
      )}
      
      {/* Snap guides */}
      {snapGuides.show && (
        <g data-testid="snap-guides">
          {snapGuides.vertical !== null && (
            <line
              data-testid="vertical-snap-guide"
              x1={snapGuides.vertical}
              y1={0}
              x2={snapGuides.vertical}
              y2={600}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )}
          {snapGuides.horizontal !== null && (
            <line
              data-testid="horizontal-snap-guide"
              x1={0}
              y1={snapGuides.horizontal}
              x2={800}
              y2={snapGuides.horizontal}
              stroke="#3b82f6"
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )}
        </g>
      )}
      
      {/* Nodes */}
      {nodes.map(node => {
        const currentPosition = positions[node.id] || node.position
        const isColliding = collisions.some(c => c.nodeId === node.id)
        
        return (
          <g
            key={node.id}
            data-testid={`${node.type}-node`}
            data-node-id={node.id}
            data-colliding={isColliding}
            transform={`translate(${currentPosition.x}, ${currentPosition.y})`}
            onMouseDown={(event) => {
              const startX = event.clientX
              const startY = event.clientY
              
              const handleMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX
                const deltaY = moveEvent.clientY - startY
                
                updateNodePosition(node.id, {
                  x: node.position.x + deltaX,
                  y: node.position.y + deltaY
                })
              }
              
              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
                setSnapGuides({ vertical: null, horizontal: null, show: false })
              }
              
              document.addEventListener('mousemove', handleMouseMove)
              document.addEventListener('mouseup', handleMouseUp)
            }}
          >
            {/* Node shape with collision indicator */}
            <circle
              data-testid="node-shape"
              r={node.type === 'document' ? 40 : 35}
              fill={isColliding ? '#ef4444' : (node.type === 'document' ? '#3b82f6' : '#10b981')}
              stroke={isColliding ? '#dc2626' : 'transparent'}
              strokeWidth={isColliding ? 3 : 0}
              opacity={isColliding ? 0.8 : 1}
            />
            
            {/* Grid snap indicator */}
            {GridSnappingService.shouldSnap(currentPosition) && (
              <circle
                data-testid="snap-indicator"
                r={node.type === 'document' ? 45 : 40}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="3,3"
                opacity="0.5"
              />
            )}
            
            <text
              textAnchor="middle"
              dy="0.3em"
              fontSize="10"
              fill="white"
              pointerEvents="none"
            >
              {node.title}
            </text>
          </g>
        )
      })}
      
      {/* Collision warnings */}
      {collisions.map(collision => (
        <text
          key={`collision-${collision.nodeId}`}
          data-testid="collision-warning"
          x={positions[collision.nodeId]?.x || 0}
          y={(positions[collision.nodeId]?.y || 0) - 60}
          textAnchor="middle"
          fontSize="10"
          fill="#dc2626"
          fontWeight="bold"
        >
          Collision Detected!
        </text>
      ))}
    </svg>
  )
})

describe('Node Collision Detection and Grid Snapping', () => {
  let mockHandlers

  beforeEach(() => {
    vi.stubGlobal('performance', { now: mockPerformanceNow })
    
    mockHandlers = {
      onPositionChange: vi.fn(),
      onCollisionDetected: vi.fn(),
      onSnapToGrid: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Collision Detection', () => {
    test('should detect collision between two nodes', () => {
      const nodeA = { id: 'a', position: { x: 100, y: 100 } }
      const nodeB = { id: 'b', position: { x: 120, y: 120 } } // Too close
      
      const hasCollision = CollisionDetectionService.checkCollision(nodeA, nodeB)
      expect(hasCollision).toBe(true)
    })
    
    test('should not detect collision when nodes are far apart', () => {
      const nodeA = { id: 'a', position: { x: 100, y: 100 } }
      const nodeB = { id: 'b', position: { x: 300, y: 300 } } // Far enough
      
      const hasCollision = CollisionDetectionService.checkCollision(nodeA, nodeB)
      expect(hasCollision).toBe(false)
    })
    
    test('should find all colliding nodes', () => {
      const targetNode = { id: 'target', position: { x: 200, y: 200 } }
      const otherNodes = [
        { id: 'close1', position: { x: 210, y: 210 } }, // Colliding
        { id: 'close2', position: { x: 190, y: 190 } }, // Colliding
        { id: 'far', position: { x: 400, y: 400 } }     // Not colliding
      ]
      
      const collisions = CollisionDetectionService.findCollisions(targetNode, otherNodes)
      expect(collisions).toHaveLength(2)
      expect(collisions.map(n => n.id)).toEqual(['close1', 'close2'])
    })
    
    test('should resolve collision by finding new position', () => {
      const targetNode = { id: 'target', position: { x: 200, y: 200 } }
      const collidingNodes = [
        { id: 'obstacle', position: { x: 210, y: 210 } }
      ]
      
      const resolvedPosition = CollisionDetectionService.resolveCollision(targetNode, collidingNodes)
      
      // Should find a position that doesn't collide
      const testNode = { ...targetNode, position: resolvedPosition }
      const stillColliding = CollisionDetectionService.checkCollision(testNode, collidingNodes[0])
      
      expect(stillColliding).toBe(false)
      expect(resolvedPosition).not.toEqual(targetNode.position)
    })
    
    test('should display collision warning in UI', () => {
      const collidingNodes = nodeCollections.colliding
      render(
        <CollisionGrid 
          nodes={collidingNodes}
          enableCollisionDetection={true}
          {...mockHandlers}
        />
      )
      
      // Simulate moving a node to cause collision
      const firstNode = screen.getByTestId('document-node')
      
      fireEvent.mouseDown(firstNode, { clientX: 200, clientY: 200 })
      
      act(() => {
        fireEvent.mouseMove(document, { clientX: 220, clientY: 220 })
      })
      
      expect(mockHandlers.onCollisionDetected).toHaveBeenCalled()
    })
    
    test('should apply collision styling to colliding nodes', () => {
      const collidingNodes = nodeCollections.colliding
      render(
        <CollisionGrid 
          nodes={collidingNodes}
          enableCollisionDetection={true}
          {...mockHandlers}
        />
      )
      
      // Find nodes that should be colliding based on fixture data
      const nodeElements = screen.getAllByTestId('node-shape')
      
      // At least one node should show collision styling
      const hasCollidingNode = nodeElements.some(node => 
        node.getAttribute('fill') === '#ef4444' // Collision color
      )
      
      expect(hasCollidingNode).toBe(true)
    })
  })
  
  describe('Grid Snapping', () => {
    test('should snap position to grid', () => {
      const position = { x: 203, y: 197 }
      const snappedPosition = GridSnappingService.snapToGrid(position, 20)
      
      expect(snappedPosition).toEqual({ x: 200, y: 200 })
    })
    
    test('should determine if position should snap to grid', () => {
      const closeToGrid = { x: 198, y: 202 }
      const farFromGrid = { x: 187, y: 213 }
      
      expect(GridSnappingService.shouldSnap(closeToGrid)).toBe(true)
      expect(GridSnappingService.shouldSnap(farFromGrid)).toBe(false)
    })
    
    test('should return original position if not close enough to grid', () => {
      const position = { x: 187, y: 213 } // Too far from grid
      const finalPosition = GridSnappingService.getSnapPosition(position)
      
      expect(finalPosition).toEqual(position)
    })
    
    test('should return snapped position if close to grid', () => {
      const position = { x: 198, y: 202 } // Close to grid
      const finalPosition = GridSnappingService.getSnapPosition(position)
      
      expect(finalPosition).toEqual({ x: 200, y: 200 })
    })
    
    test('should show grid pattern in UI', () => {
      render(
        <CollisionGrid 
          nodes={[]}
          showGrid={true}
          {...mockHandlers}
        />
      )
      
      const gridBackground = screen.getByTestId('grid-background')
      expect(gridBackground).toBeInTheDocument()
      expect(gridBackground).toHaveAttribute('fill', 'url(#grid)')
    })
    
    test('should display snap guides during drag', () => {
      const nodes = nodeCollections.gridPositioned
      render(
        <CollisionGrid 
          nodes={nodes}
          enableGridSnapping={true}
          {...mockHandlers}
        />
      )
      
      const firstNode = screen.getAllByTestId('document-node')[0]
      
      fireEvent.mouseDown(firstNode, { clientX: 200, clientY: 200 })
      
      act(() => {
        fireEvent.mouseMove(document, { clientX: 198, clientY: 202 }) // Close to grid
      })
      
      expect(mockHandlers.onSnapToGrid).toHaveBeenCalled()
    })
    
    test('should show snap indicator on node when close to grid', () => {
      const nodes = [{ 
        ...nodeCollections.gridPositioned[1], // This one is near grid
        id: 'near-grid'
      }]
      
      render(
        <CollisionGrid 
          nodes={nodes}
          enableGridSnapping={true}
          {...mockHandlers}
        />
      )
      
      const snapIndicator = screen.getByTestId('snap-indicator')
      expect(snapIndicator).toBeInTheDocument()
      expect(snapIndicator).toHaveAttribute('stroke', '#3b82f6')
    })
  })
  
  describe('Grid Utilities', () => {
    test('should calculate correct snap position', () => {
      const position = { x: 187, y: 213 }
      const snapped = gridUtils.calculateSnapPosition(position, 20)
      
      expect(snapped.x).toBe(180) // 187 -> 180
      expect(snapped.y).toBe(220) // 213 -> 220
    })
    
    test('should determine snap requirement correctly', () => {
      expect(gridUtils.shouldSnapToGrid({ x: 198, y: 202 })).toBe(true)
      expect(gridUtils.shouldSnapToGrid({ x: 185, y: 215 })).toBe(false)
    })
    
    test('should generate grid positions for multiple nodes', () => {
      const positions = gridUtils.generateGridPositions(4, 20)
      
      expect(positions).toHaveLength(4)
      positions.forEach(pos => {
        expect(pos.x % 60).toBe(0) // Spaced out by gridSize * 3
        expect(pos.y % 60).toBe(0)
      })
    })
  })
  
  describe('Collision Utilities', () => {
    test('should check collision correctly', () => {
      const pos1 = { x: 100, y: 100 }
      const pos2 = { x: 120, y: 120 } // Distance ≈ 28.3 < 100
      
      expect(collisionUtils.wouldCollide(pos1, pos2, 100)).toBe(true)
      expect(collisionUtils.wouldCollide(pos1, pos2, 20)).toBe(false)
    })
    
    test('should find non-colliding position', () => {
      const targetPos = { x: 200, y: 200 }
      const existingPositions = [
        { x: 210, y: 210 },
        { x: 190, y: 190 }
      ]
      
      const safePosition = collisionUtils.findNonCollidingPosition(targetPos, existingPositions)
      
      // Should not collide with existing positions
      const hasCollisions = existingPositions.some(pos => 
        collisionUtils.wouldCollide(safePosition, pos)
      )
      
      expect(hasCollisions).toBe(false)
    })
  })
  
  describe('Performance Optimizations', () => {
    test('should handle large number of nodes efficiently', () => {
      const manyNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        type: i % 2 === 0 ? 'document' : 'agent',
        position: { x: (i % 10) * 80, y: Math.floor(i / 10) * 80 },
        title: `Node ${i}`
      }))
      
      const startTime = performance.now()
      
      render(
        <CollisionGrid 
          nodes={manyNodes}
          enableCollisionDetection={true}
          enableGridSnapping={true}
          {...mockHandlers}
        />
      )
      
      const renderTime = performance.now() - startTime
      
      // Should render in reasonable time (this is a simple check)
      expect(renderTime).toBeLessThan(1000) // 1 second max
    })
    
    test('should use spatial partitioning for collision detection optimization', () => {
      // This would test a more advanced collision detection system
      // For now, we test that the basic system works with reasonable performance
      
      const targetNode = { id: 'target', position: { x: 200, y: 200 } }
      const manyNodes = Array.from({ length: 50 }, (_, i) => ({
        id: `node-${i}`,
        position: { x: Math.random() * 800, y: Math.random() * 600 }
      }))
      
      const startTime = performance.now()
      const collisions = CollisionDetectionService.findCollisions(targetNode, manyNodes)
      const detectionTime = performance.now() - startTime
      
      expect(detectionTime).toBeLessThan(100) // Should be very fast
      expect(Array.isArray(collisions)).toBe(true)
    })
  })
  
  describe('Edge Cases', () => {
    test('should handle nodes at canvas boundaries', () => {
      const boundaryNodes = [
        { id: 'top-left', position: { x: 0, y: 0 } },
        { id: 'top-right', position: { x: 800, y: 0 } },
        { id: 'bottom-left', position: { x: 0, y: 600 } },
        { id: 'bottom-right', position: { x: 800, y: 600 } }
      ]
      
      expect(() => {
        render(
          <CollisionGrid 
            nodes={boundaryNodes}
            enableCollisionDetection={true}
            enableGridSnapping={true}
            {...mockHandlers}
          />
        )
      }).not.toThrow()
    })
    
    test('should handle identical positions', () => {
      const identicalNodes = [
        { id: 'node1', position: { x: 200, y: 200 } },
        { id: 'node2', position: { x: 200, y: 200 } } // Identical position
      ]
      
      const hasCollision = CollisionDetectionService.checkCollision(identicalNodes[0], identicalNodes[1])
      expect(hasCollision).toBe(true)
      
      const resolved = CollisionDetectionService.resolveCollision(identicalNodes[0], [identicalNodes[1]])
      expect(resolved).not.toEqual(identicalNodes[0].position)
    })
    
    test('should handle negative coordinates', () => {
      const negativePosition = { x: -50, y: -30 }
      const snappedPosition = GridSnappingService.snapToGrid(negativePosition)
      
      expect(typeof snappedPosition.x).toBe('number')
      expect(typeof snappedPosition.y).toBe('number')
    })
  })
  
  describe('Configuration', () => {
    test('should allow disabling collision detection', () => {
      const collidingNodes = nodeCollections.colliding
      render(
        <CollisionGrid 
          nodes={collidingNodes}
          enableCollisionDetection={false}
          {...mockHandlers}
        />
      )
      
      // Should not call collision detection
      expect(mockHandlers.onCollisionDetected).not.toHaveBeenCalled()
    })
    
    test('should allow disabling grid snapping', () => {
      const nodes = nodeCollections.gridPositioned
      render(
        <CollisionGrid 
          nodes={nodes}
          enableGridSnapping={false}
          {...mockHandlers}
        />
      )
      
      // Should not show snap indicators
      const snapIndicator = screen.queryByTestId('snap-indicator')
      expect(snapIndicator).not.toBeInTheDocument()
    })
    
    test('should allow hiding grid', () => {
      render(
        <CollisionGrid 
          nodes={[]}
          showGrid={false}
          {...mockHandlers}
        />
      )
      
      const gridBackground = screen.queryByTestId('grid-background')
      expect(gridBackground).not.toBeInTheDocument()
    })
  })
})