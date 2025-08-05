import React, { useState, useRef, useCallback, useEffect } from 'react'
import CanvasGrid from './CanvasGrid'
import { 
  CanvasProps, 
  CanvasState, 
  CanvasNode, 
  Position, 
  DEFAULT_VIEW_BOX,
  CANVAS_CONFIG 
} from './types'

const Canvas: React.FC<CanvasProps> = ({
  className = '',
  onNodeCreate,
  onNodeMove,
  onNodeSelect,
  onViewChange,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    nodes: [],
    viewBox: DEFAULT_VIEW_BOX,
    scale: 1,
    isPanning: false,
    selectedNodeId: null,
    dragState: {
      isDragging: false,
      nodeId: null,
      startPosition: null,
      currentPosition: null,
    },
  })

  const [lastMousePosition, setLastMousePosition] = useState<Position | null>(null)

  // Generate unique node ID
  const createNodeId = useCallback(() => {
    return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Convert screen coordinates to SVG coordinates
  const screenToSVG = useCallback((screenX: number, screenY: number): Position => {
    if (!svgRef.current) return { x: screenX, y: screenY }
    
    const svg = svgRef.current
    const rect = svg.getBoundingClientRect()
    const scaleX = canvasState.viewBox.width / rect.width
    const scaleY = canvasState.viewBox.height / rect.height
    
    return {
      x: canvasState.viewBox.x + (screenX - rect.left) * scaleX,
      y: canvasState.viewBox.y + (screenY - rect.top) * scaleY,
    }
  }, [canvasState.viewBox])

  // Create new document node
  const createDocumentNode = useCallback((position?: Position) => {
    const nodePosition: Position = position || { 
      x: canvasState.viewBox.x + canvasState.viewBox.width / 2, 
      y: canvasState.viewBox.y + canvasState.viewBox.height / 2 
    }
    
    // Ensure we have valid coordinates
    const validPosition: Position = {
      x: typeof nodePosition.x === 'number' && !isNaN(nodePosition.x) ? nodePosition.x : 400,
      y: typeof nodePosition.y === 'number' && !isNaN(nodePosition.y) ? nodePosition.y : 300,
    }
    
    const newNode: CanvasNode = {
      id: createNodeId(),
      type: 'document',
      position: validPosition,
      title: `Document ${canvasState.nodes.filter(n => n.type === 'document').length + 1}`,
    }

    console.log('Creating document node:', newNode) // Debug log

    setCanvasState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))

    // Trigger event for event sourcing
    onNodeCreate?.('document', validPosition)
    
    // Send API event (placeholder for event sourcing integration)
    if (typeof window !== 'undefined') {
      // This will be implemented with actual event sourcing
      console.log('ADD_NODE event', { 
        type: 'ADD_NODE', 
        payload: { 
          nodeId: newNode.id,
          nodeType: 'document', 
          position: validPosition 
        } 
      })
    }

    return newNode
  }, [canvasState.nodes, canvasState.viewBox, createNodeId, onNodeCreate])

  // Create new agent node
  const createAgentNode = useCallback((position?: Position) => {
    const nodePosition: Position = position || { 
      x: canvasState.viewBox.x + canvasState.viewBox.width / 2, 
      y: canvasState.viewBox.y + canvasState.viewBox.height / 2 
    }
    
    // Ensure we have valid coordinates
    const validPosition: Position = {
      x: typeof nodePosition.x === 'number' && !isNaN(nodePosition.x) ? nodePosition.x : 500,
      y: typeof nodePosition.y === 'number' && !isNaN(nodePosition.y) ? nodePosition.y : 300,
    }
    
    const newNode: CanvasNode = {
      id: createNodeId(),
      type: 'agent',
      position: validPosition,
      title: `Agent ${canvasState.nodes.filter(n => n.type === 'agent').length + 1}`,
    }

    console.log('Creating agent node:', newNode) // Debug log

    setCanvasState(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }))

    onNodeCreate?.('agent', validPosition)
    
    return newNode
  }, [canvasState.nodes, canvasState.viewBox, createNodeId, onNodeCreate])

  // Handle mouse down events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const target = event.target as Element
    const nodeElement = target.closest('[data-testid="canvas-node"]')
    
    if (nodeElement) {
      // Start node drag
      const nodeId = nodeElement.getAttribute('data-node-id')
      if (nodeId) {
        event.preventDefault()
        const mousePos = screenToSVG(event.clientX, event.clientY)
        
        setCanvasState(prev => ({
          ...prev,
          selectedNodeId: nodeId,
          dragState: {
            isDragging: true,
            nodeId,
            startPosition: mousePos,
            currentPosition: mousePos,
          },
        }))
        
        onNodeSelect?.(nodeId)
      }
    } else {
      // Start canvas pan
      event.preventDefault()
      setLastMousePosition({ x: event.clientX, y: event.clientY })
      setCanvasState(prev => ({
        ...prev,
        isPanning: true,
        selectedNodeId: null,
      }))
      
      onNodeSelect?.(null)
    }
  }, [screenToSVG, onNodeSelect])

  // Handle mouse move events
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (canvasState.dragState.isDragging && canvasState.dragState.nodeId) {
      // Handle node drag
      event.preventDefault()
      const mousePos = screenToSVG(event.clientX, event.clientY)
      
      setCanvasState(prev => ({
        ...prev,
        dragState: {
          ...prev.dragState,
          currentPosition: mousePos,
        },
        nodes: prev.nodes.map(node => 
          node.id === prev.dragState.nodeId
            ? { ...node, position: mousePos, dragging: true }
            : node
        ),
      }))
    } else if (canvasState.isPanning && lastMousePosition) {
      // Handle canvas pan
      event.preventDefault()
      const deltaX = event.clientX - lastMousePosition.x
      const deltaY = event.clientY - lastMousePosition.y
      
      const scaleX = canvasState.viewBox.width / (svgRef.current?.getBoundingClientRect().width || 1)
      const scaleY = canvasState.viewBox.height / (svgRef.current?.getBoundingClientRect().height || 1)
      
      const newViewBox = {
        ...canvasState.viewBox,
        x: canvasState.viewBox.x - deltaX * scaleX,
        y: canvasState.viewBox.y - deltaY * scaleY,
      }
      
      setCanvasState(prev => ({
        ...prev,
        viewBox: newViewBox,
      }))
      
      setLastMousePosition({ x: event.clientX, y: event.clientY })
      onViewChange?.(newViewBox, canvasState.scale)
    }
  }, [canvasState.dragState, canvasState.isPanning, canvasState.viewBox, canvasState.scale, lastMousePosition, screenToSVG, onViewChange])

  // Handle mouse up events
  const handleMouseUp = useCallback((_event: React.MouseEvent) => {
    if (canvasState.dragState.isDragging && canvasState.dragState.nodeId) {
      // Complete node drag
      const nodeId = canvasState.dragState.nodeId
      const finalPosition = canvasState.dragState.currentPosition || canvasState.dragState.startPosition
      
      if (finalPosition) {
        onNodeMove?.(nodeId, finalPosition)
        
        // Send MOVE_NODE event (placeholder for event sourcing)
        console.log('MOVE_NODE event', {
          type: 'MOVE_NODE',
          payload: { nodeId, position: finalPosition }
        })
      }
      
      setCanvasState(prev => ({
        ...prev,
        dragState: {
          isDragging: false,
          nodeId: null,
          startPosition: null,
          currentPosition: null,
        },
        nodes: prev.nodes.map(node => ({ ...node, dragging: false })),
      }))
    } else {
      // Complete canvas pan
      setCanvasState(prev => ({ ...prev, isPanning: false }))
      setLastMousePosition(null)
    }
  }, [canvasState.dragState, onNodeMove])

  // Handle wheel events for zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault()
    
    const zoomDelta = -event.deltaY * 0.001
    const newScale = Math.max(
      CANVAS_CONFIG.MIN_SCALE, 
      Math.min(CANVAS_CONFIG.MAX_SCALE, canvasState.scale * (1 + zoomDelta))
    )
    
    if (newScale !== canvasState.scale) {
      const mousePos = screenToSVG(event.clientX, event.clientY)
      const scaleFactor = newScale / canvasState.scale
      
      const newViewBox = {
        x: mousePos.x - (mousePos.x - canvasState.viewBox.x) * scaleFactor,
        y: mousePos.y - (mousePos.y - canvasState.viewBox.y) * scaleFactor,
        width: canvasState.viewBox.width * scaleFactor,
        height: canvasState.viewBox.height * scaleFactor,
      }
      
      setCanvasState(prev => ({
        ...prev,
        viewBox: newViewBox,
        scale: newScale,
      }))
      
      onViewChange?.(newViewBox, newScale)
    }
  }, [canvasState.scale, canvasState.viewBox, screenToSVG, onViewChange])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        setCanvasState(prev => ({
          ...prev,
          viewBox: { ...prev.viewBox, x: prev.viewBox.x + CANVAS_CONFIG.PAN_STEP },
        }))
        break
      case 'ArrowLeft':
        event.preventDefault()
        setCanvasState(prev => ({
          ...prev,
          viewBox: { ...prev.viewBox, x: prev.viewBox.x - CANVAS_CONFIG.PAN_STEP },
        }))
        break
      case 'ArrowDown':
        event.preventDefault()
        setCanvasState(prev => ({
          ...prev,
          viewBox: { ...prev.viewBox, y: prev.viewBox.y + CANVAS_CONFIG.PAN_STEP },
        }))
        break
      case 'ArrowUp':
        event.preventDefault()
        setCanvasState(prev => ({
          ...prev,
          viewBox: { ...prev.viewBox, y: prev.viewBox.y - CANVAS_CONFIG.PAN_STEP },
        }))
        break
      case 'r':
      case 'R':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          setCanvasState(prev => ({
            ...prev,
            viewBox: DEFAULT_VIEW_BOX,
            scale: 1,
          }))
        }
        break
      case '=':
      case '+':
        event.preventDefault()
        const zoomInScale = Math.min(CANVAS_CONFIG.MAX_SCALE, canvasState.scale * (1 + CANVAS_CONFIG.ZOOM_STEP))
        setCanvasState(prev => ({ ...prev, scale: zoomInScale }))
        break
      case '-':
        event.preventDefault()
        const zoomOutScale = Math.max(CANVAS_CONFIG.MIN_SCALE, canvasState.scale * (1 - CANVAS_CONFIG.ZOOM_STEP))
        setCanvasState(prev => ({ ...prev, scale: zoomOutScale }))
        break
    }
  }, [canvasState.scale])

  // Expose create node functions to parent components (for toolbar buttons)
  useEffect(() => {
    // Make functions available globally for toolbar buttons
    if (typeof window !== 'undefined') {
      (window as any).canvasCreateDocument = createDocumentNode
      (window as any).canvasCreateAgent = createAgentNode
    }
  }, [createDocumentNode, createAgentNode])

  const viewBoxString = `${canvasState.viewBox.x} ${canvasState.viewBox.y} ${canvasState.viewBox.width} ${canvasState.viewBox.height}`

  return (
    <div 
      data-testid="canvas" 
      className={`canvas-container ${className}`}
      aria-label="Interactive canvas for document workflow"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <svg
        ref={svgRef}
        data-testid="canvas-svg"
        className={`canvas-svg ${canvasState.isPanning ? 'panning' : ''}`}
        width="100%"
        height="100%"
        viewBox={viewBoxString}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Canvas workspace"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid */}
        <CanvasGrid 
          viewBox={canvasState.viewBox} 
          scale={canvasState.scale} 
          visible={true} 
        />
        
        {/* Nodes */}
        {canvasState.nodes.map((node) => (
          <g
            key={node.id}
            data-testid="canvas-node"
            data-node-id={node.id}
            data-node-type={node.type}
            className={`canvas-node ${node.dragging ? 'dragging' : ''} ${
              node.id === canvasState.selectedNodeId ? 'selected' : ''
            }`}
            transform={`translate(${node.position.x || 0}, ${node.position.y || 0})`}
          >
            <circle
              cx={0}
              cy={0}
              r={CANVAS_CONFIG.NODE_RADIUS}
              fill={node.type === 'document' ? '#8b5cf6' : '#22c55e'}
              stroke={node.id === canvasState.selectedNodeId ? '#1e40af' : 'transparent'}
              strokeWidth={3}
              className="transition-all duration-200"
            />
            <text
              x={0}
              y={5}
              textAnchor="middle"
              fontSize={12}
              fill="white"
              fontWeight="500"
              pointerEvents="none"
            >
              {node.type === 'document' ? 'Doc' : 'AI'}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export default Canvas