import React, { useRef, useCallback, useEffect, useState } from 'react'
import CanvasGrid from './CanvasGrid'
import { 
  CanvasProps, 
  Position, 
  CanvasNode,
  CANVAS_CONFIG 
} from './types'
import { useCanvasEventSourcing } from '../../lib/eventSourcing'
import { CanvasEventUtils, CANVAS_LIMITS, ViewBox } from '../../../schemas/events/canvas'

const Canvas: React.FC<CanvasProps> = ({
  className = '',
  onNodeCreate,
  onNodeMove,
  onNodeSelect,
  onViewChange,
  onGridToggle,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  // Use event sourcing instead of local state
  const {
    canvasState,
    isLoading,
    error,
    canUndo,
    canRedo,
    addNode,
    moveNode,
    selectElement,
    panCanvas,
    zoomCanvas,
    resetView,
    undo,
    redo,
  } = useCanvasEventSourcing()

  // Local UI state for smooth interactions
  const [lastMousePosition, setLastMousePosition] = useState<Position | null>(null)
  const [localDragState, setLocalDragState] = useState({
    isDragging: false,
    nodeId: null as string | null,
    startPosition: null as Position | null,
    currentPosition: null as Position | null,
  })
  const [isPanning, setIsPanning] = useState(false)
  const [touchState, setTouchState] = useState({
    initialDistance: 0,
    initialZoom: 1,
    lastTouches: [] as React.Touch[],
  })

  // Local state for temporary pan mode (space bar)
  const [isSpacePanning, setIsSpacePanning] = useState(false)
  const [spaceKeyDown, setSpaceKeyDown] = useState(false)
  
  // Local optimistic state for keyboard interactions
  const [optimisticViewBox, setOptimisticViewBox] = useState<ViewBox | null>(null)
  const [optimisticScale, setOptimisticScale] = useState<number | null>(null)

  // Handle global keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])

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

  // Create new document node using event sourcing
  const createDocumentNode = useCallback(async (position?: Position) => {
    const nodePosition: Position = position || { 
      x: canvasState.viewBox.x + canvasState.viewBox.width / 2, 
      y: canvasState.viewBox.y + canvasState.viewBox.height / 2 
    }
    
    // Ensure we have valid coordinates
    const validPosition: Position = {
      x: typeof nodePosition.x === 'number' && !isNaN(nodePosition.x) ? nodePosition.x : 400,
      y: typeof nodePosition.y === 'number' && !isNaN(nodePosition.y) ? nodePosition.y : 300,
    }

    const title = `Document ${canvasState.nodes.filter(n => n.type === 'document').length + 1}`
    
    try {
      await addNode('document', validPosition, title)
      onNodeCreate?.('document', validPosition)
    } catch (error) {
      console.error('Failed to create document node:', error)
    }
  }, [canvasState.nodes, canvasState.viewBox, addNode, onNodeCreate])

  // Create new agent node using event sourcing
  const createAgentNode = useCallback(async (position?: Position) => {
    const nodePosition: Position = position || { 
      x: canvasState.viewBox.x + canvasState.viewBox.width / 2, 
      y: canvasState.viewBox.y + canvasState.viewBox.height / 2 
    }
    
    // Ensure we have valid coordinates
    const validPosition: Position = {
      x: typeof nodePosition.x === 'number' && !isNaN(nodePosition.x) ? nodePosition.x : 500,
      y: typeof nodePosition.y === 'number' && !isNaN(nodePosition.y) ? nodePosition.y : 300,
    }
    
    const title = `Agent ${canvasState.nodes.filter(n => n.type === 'agent').length + 1}`
    
    try {
      await addNode('agent', validPosition, title)
      onNodeCreate?.('agent', validPosition)
    } catch (error) {
      console.error('Failed to create agent node:', error)
    }
  }, [canvasState.nodes, canvasState.viewBox, addNode, onNodeCreate])

  // Calculate pan boundaries based on current zoom and content
  const getPanBoundaries = useCallback(() => {
    const contentMargin = 200 // Allow some padding around content
    const minX = -contentMargin
    const minY = -contentMargin
    const maxX = CANVAS_LIMITS.PAN.MAX_DISTANCE
    const maxY = CANVAS_LIMITS.PAN.MAX_DISTANCE
    
    return { minX, minY, maxX, maxY }
  }, [])

  // Constrain viewBox to boundaries with spring-back effect
  const constrainViewBox = useCallback((viewBox: ViewBox): ViewBox => {
    const boundaries = getPanBoundaries()
    
    return CanvasEventUtils.createViewBox(
      Math.max(boundaries.minX, Math.min(boundaries.maxX - viewBox.width, viewBox.x)),
      Math.max(boundaries.minY, Math.min(boundaries.maxY - viewBox.height, viewBox.y)),
      viewBox.width,
      viewBox.height
    )
  }, [getPanBoundaries])

  // Handle mouse down events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    const target = event.target as Element
    const nodeElement = target.closest('[data-testid="canvas-node"]')
    
    if (nodeElement && !isSpacePanning) {
      // Start node drag (only if not in space pan mode)
      const nodeId = nodeElement.getAttribute('data-node-id')
      if (nodeId) {
        event.preventDefault()
        const mousePos = screenToSVG(event.clientX, event.clientY)
        
        setLocalDragState({
          isDragging: true,
          nodeId,
          startPosition: mousePos,
          currentPosition: mousePos,
        })
        
        selectElement(nodeId)
        onNodeSelect?.(nodeId)
      }
    } else {
      // Start canvas pan (either normal pan or space pan mode)
      event.preventDefault()
      setLastMousePosition({ x: event.clientX, y: event.clientY })
      setIsPanning(true)
      
      if (!isSpacePanning) {
        selectElement(null)
        onNodeSelect?.(null)
      }
    }
  }, [screenToSVG, onNodeSelect, selectElement, isSpacePanning])

  // Handle mouse move events
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (localDragState.isDragging && localDragState.nodeId) {
      // Handle node drag
      event.preventDefault()
      const mousePos = screenToSVG(event.clientX, event.clientY)
      
      setLocalDragState(prev => ({
        ...prev,
        currentPosition: mousePos,
      }))
    } else if (isPanning && lastMousePosition) {
      // Handle canvas pan
      event.preventDefault()
      const deltaX = event.clientX - lastMousePosition.x
      const deltaY = event.clientY - lastMousePosition.y
      
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const scaleX = canvasState.viewBox.width / rect.width
      const scaleY = canvasState.viewBox.height / rect.height
      
      const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
        canvasState.viewBox.x - deltaX * scaleX,
        canvasState.viewBox.y - deltaY * scaleY,
        canvasState.viewBox.width,
        canvasState.viewBox.height
      ))
      
      // Update immediately via event sourcing
      panCanvas(canvasState.viewBox, newViewBox, deltaX * scaleX, deltaY * scaleY)
      
      setLastMousePosition({ x: event.clientX, y: event.clientY })
      onViewChange?.(newViewBox, canvasState.scale)
    }
  }, [localDragState, isPanning, lastMousePosition, canvasState.viewBox, canvasState.scale, screenToSVG, onViewChange, constrainViewBox, panCanvas])

  // Handle mouse up events
  const handleMouseUp = useCallback(async (_event: React.MouseEvent) => {
    if (localDragState.isDragging && localDragState.nodeId) {
      // Complete node drag
      const nodeId = localDragState.nodeId
      const startPosition = localDragState.startPosition
      const finalPosition = localDragState.currentPosition || startPosition
      
      if (finalPosition && startPosition) {
        try {
          await moveNode(nodeId, startPosition, finalPosition)
          onNodeMove?.(nodeId, finalPosition)
        } catch (error) {
          console.error('Failed to move node:', error)
        }
      }
      
      setLocalDragState({
        isDragging: false,
        nodeId: null,
        startPosition: null,
        currentPosition: null,
      })
    }
    
    if (isPanning) {
      setIsPanning(false)
      setLastMousePosition(null)
    }
  }, [localDragState, onNodeMove, moveNode, isPanning])

  // Debounced wheel handler to prevent excessive zoom events
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Handle wheel events for zoom
  const handleWheel = useCallback(async (event: React.WheelEvent) => {
    event.preventDefault()
    
    // Clear previous timeout to debounce
    if (wheelTimeoutRef.current) {
      clearTimeout(wheelTimeoutRef.current)
    }
    
    // Smooth zoom factor based on delta
    const zoomSensitivity = 0.001
    const zoomDelta = -event.deltaY * zoomSensitivity
    const newScale = CanvasEventUtils.clampZoom(canvasState.scale * (1 + zoomDelta))
    
    if (Math.abs(newScale - canvasState.scale) > 0.01) { // Minimum zoom change threshold
      const mousePos = screenToSVG(event.clientX, event.clientY)
      const scaleFactor = newScale / canvasState.scale
      
      // Calculate new viewBox centered on mouse position
      const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
        mousePos.x - (mousePos.x - canvasState.viewBox.x) / scaleFactor,
        mousePos.y - (mousePos.y - canvasState.viewBox.y) / scaleFactor,
        canvasState.viewBox.width / scaleFactor,
        canvasState.viewBox.height / scaleFactor
      ))
      
      // Debounce the event sourcing call to avoid overwhelming the API
      wheelTimeoutRef.current = setTimeout(async () => {
        try {
          await zoomCanvas(canvasState.scale, newScale, canvasState.viewBox, newViewBox, mousePos)
          onViewChange?.(newViewBox, newScale)
        } catch (error) {
          console.error('Failed to zoom canvas:', error)
        }
      }, 50) // 50ms debounce
    }
  }, [canvasState.scale, canvasState.viewBox, screenToSVG, onViewChange, zoomCanvas, constrainViewBox])

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    // Since we don't have a toggleGrid function in event sourcing yet,
    // we can notify the parent component through onGridToggle
    onGridToggle?.(!canvasState.showGrid)
  }, [canvasState.showGrid, onGridToggle])

  // Helper function to perform zoom operations
  const performZoom = useCallback(async (direction: 'in' | 'out') => {
    const currentScale = optimisticScale || canvasState.scale
    const currentViewBox = optimisticViewBox || canvasState.viewBox
    const zoomMultiplier = direction === 'in' ? (1 + CANVAS_CONFIG.ZOOM_STEP) : (1 - CANVAS_CONFIG.ZOOM_STEP)
    const newScale = CanvasEventUtils.clampZoom(currentScale * zoomMultiplier)
    
    if (Math.abs(newScale - currentScale) < 0.01) return // Skip if zoom change is too small
    
    const centerPos = {
      x: currentViewBox.x + currentViewBox.width / 2,
      y: currentViewBox.y + currentViewBox.height / 2,
    }
    const scaleFactor = newScale / currentScale
    const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
      centerPos.x - (centerPos.x - currentViewBox.x) / scaleFactor,
      centerPos.y - (centerPos.y - currentViewBox.y) / scaleFactor,
      currentViewBox.width / scaleFactor,
      currentViewBox.height / scaleFactor
    ))
    
    // Optimistic updates
    setOptimisticScale(newScale)
    setOptimisticViewBox(newViewBox)
    
    // Fire and forget for persistence
    zoomCanvas(canvasState.scale, newScale, canvasState.viewBox, newViewBox, centerPos).catch(console.error)
    onViewChange?.(newViewBox, newScale)
  }, [canvasState.scale, canvasState.viewBox, optimisticScale, optimisticViewBox, zoomCanvas, onViewChange, constrainViewBox])

  // Helper function to zoom to a specific level
  const performZoomToLevel = useCallback(async (targetZoom: number) => {
    const currentScale = optimisticScale || canvasState.scale
    const currentViewBox = optimisticViewBox || canvasState.viewBox
    const newScale = CanvasEventUtils.clampZoom(targetZoom)
    
    if (Math.abs(newScale - currentScale) < 0.01) return // Skip if zoom change is too small
    
    const centerPos = {
      x: currentViewBox.x + currentViewBox.width / 2,
      y: currentViewBox.y + currentViewBox.height / 2,
    }
    const scaleFactor = newScale / currentScale
    const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
      centerPos.x - (centerPos.x - currentViewBox.x) / scaleFactor,
      centerPos.y - (centerPos.y - currentViewBox.y) / scaleFactor,
      currentViewBox.width / scaleFactor,
      currentViewBox.height / scaleFactor
    ))
    
    // Optimistic updates
    setOptimisticScale(newScale)
    setOptimisticViewBox(newViewBox)
    
    // Fire and forget for persistence
    zoomCanvas(canvasState.scale, newScale, canvasState.viewBox, newViewBox, centerPos).catch(console.error)
    onViewChange?.(newViewBox, newScale)
  }, [canvasState.scale, canvasState.viewBox, optimisticScale, optimisticViewBox, zoomCanvas, onViewChange, constrainViewBox])

  // Helper function to fit content to view
  const fitToContent = useCallback(async () => {
    if (canvasState.nodes.length === 0) {
      // If no nodes, reset to default view
      await resetView(canvasState.viewBox, canvasState.scale, 'keyboard')
      onViewChange?.(canvasState.viewBox, canvasState.scale)
      return
    }

    // Calculate bounding box of all nodes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    
    canvasState.nodes.forEach(node => {
      const nodeRadius = CANVAS_CONFIG.NODE_RADIUS
      minX = Math.min(minX, node.position.x - nodeRadius)
      minY = Math.min(minY, node.position.y - nodeRadius)
      maxX = Math.max(maxX, node.position.x + nodeRadius)
      maxY = Math.max(maxY, node.position.y + nodeRadius)
    })

    // Add padding around content
    const padding = 100
    minX -= padding
    minY -= padding
    maxX += padding
    maxY += padding

    // Calculate new viewBox to fit content
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    
    const newViewBox = CanvasEventUtils.createViewBox(minX, minY, contentWidth, contentHeight)
    const newScale = Math.min(
      canvasState.viewBox.width / contentWidth,
      canvasState.viewBox.height / contentHeight
    )
    const clampedScale = CanvasEventUtils.clampZoom(newScale)

    await zoomCanvas(canvasState.scale, clampedScale, canvasState.viewBox, newViewBox, { x: (minX + maxX) / 2, y: (minY + maxY) / 2 })
    onViewChange?.(newViewBox, clampedScale)
  }, [canvasState.nodes, canvasState.viewBox, canvasState.scale, resetView, zoomCanvas, onViewChange])

  // Helper function for tab navigation through nodes
  const navigateNodes = useCallback((direction: 'next' | 'previous') => {
    if (canvasState.nodes.length === 0) return

    const currentIndex = canvasState.selectedNodeId 
      ? canvasState.nodes.findIndex(node => node.id === canvasState.selectedNodeId)
      : -1

    let newIndex: number
    if (direction === 'next') {
      newIndex = currentIndex < canvasState.nodes.length - 1 ? currentIndex + 1 : 0
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : canvasState.nodes.length - 1
    }

    const newSelectedNode = canvasState.nodes[newIndex]
    if (newSelectedNode) {
      selectElement(newSelectedNode.id)
      onNodeSelect?.(newSelectedNode.id)

      // Pan to show the selected node if it's not visible
      panToNode(newSelectedNode)
    }
  }, [canvasState.nodes, canvasState.selectedNodeId, selectElement, onNodeSelect])

  // Helper function to pan to show a specific node
  const panToNode = useCallback(async (node: CanvasNode) => {
    const nodeX = node.position.x
    const nodeY = node.position.y
    
    // Check if node is already visible
    const margin = 50
    const isVisible = (
      nodeX >= canvasState.viewBox.x + margin &&
      nodeX <= canvasState.viewBox.x + canvasState.viewBox.width - margin &&
      nodeY >= canvasState.viewBox.y + margin &&
      nodeY <= canvasState.viewBox.y + canvasState.viewBox.height - margin
    )

    if (!isVisible) {
      // Center the viewBox on the node
      const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
        nodeX - canvasState.viewBox.width / 2,
        nodeY - canvasState.viewBox.height / 2,
        canvasState.viewBox.width,
        canvasState.viewBox.height
      ))
      
      const deltaX = newViewBox.x - canvasState.viewBox.x
      const deltaY = newViewBox.y - canvasState.viewBox.y
      
      await panCanvas(canvasState.viewBox, newViewBox, deltaX, deltaY)
      onViewChange?.(newViewBox, canvasState.scale)
    }
  }, [canvasState.viewBox, canvasState.scale, panCanvas, onViewChange, constrainViewBox])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    try {
      // Handle space bar for temporary pan mode
      if (event.code === 'Space' && !spaceKeyDown && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        setSpaceKeyDown(true)
        setIsSpacePanning(true)
        return
      }

      // Use event.code for more reliable key detection and allow key repeats for smooth panning
      switch (event.code) {
        // Pan navigation with arrow keys - allow repeats for smooth continuous panning
        case 'ArrowRight':
          event.preventDefault()
          const currentViewBox = optimisticViewBox || canvasState.viewBox
          const rightViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
            currentViewBox.x + CANVAS_CONFIG.PAN_STEP,
            currentViewBox.y,
            currentViewBox.width,
            currentViewBox.height
          ))
          // Immediate optimistic update
          setOptimisticViewBox(rightViewBox)
          // Notify parent immediately
          onViewChange?.(rightViewBox, canvasState.scale)
          // Persist via event sourcing (fire and forget)
          panCanvas(canvasState.viewBox, rightViewBox, CANVAS_CONFIG.PAN_STEP, 0).catch(console.error)
          break
        case 'ArrowLeft':
          event.preventDefault()
          const currentViewBox2 = optimisticViewBox || canvasState.viewBox
          const leftViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
            currentViewBox2.x - CANVAS_CONFIG.PAN_STEP,
            currentViewBox2.y,
            currentViewBox2.width,
            currentViewBox2.height
          ))
          // Immediate optimistic update
          setOptimisticViewBox(leftViewBox)
          // Notify parent immediately
          onViewChange?.(leftViewBox, canvasState.scale)
          // Persist via event sourcing (fire and forget)
          panCanvas(canvasState.viewBox, leftViewBox, -CANVAS_CONFIG.PAN_STEP, 0).catch(console.error)
          break
        case 'ArrowDown':
          event.preventDefault()
          const currentViewBox3 = optimisticViewBox || canvasState.viewBox
          const downViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
            currentViewBox3.x,
            currentViewBox3.y + CANVAS_CONFIG.PAN_STEP,
            currentViewBox3.width,
            currentViewBox3.height
          ))
          // Immediate optimistic update
          setOptimisticViewBox(downViewBox)
          // Notify parent immediately
          onViewChange?.(downViewBox, canvasState.scale)
          // Persist via event sourcing (fire and forget)
          panCanvas(canvasState.viewBox, downViewBox, 0, CANVAS_CONFIG.PAN_STEP).catch(console.error)
          break
        case 'ArrowUp':
          event.preventDefault()
          const currentViewBox4 = optimisticViewBox || canvasState.viewBox
          const upViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
            currentViewBox4.x,
            currentViewBox4.y - CANVAS_CONFIG.PAN_STEP,
            currentViewBox4.width,
            currentViewBox4.height
          ))
          // Immediate optimistic update
          setOptimisticViewBox(upViewBox)
          // Notify parent immediately
          onViewChange?.(upViewBox, canvasState.scale)
          // Persist via event sourcing (fire and forget)
          panCanvas(canvasState.viewBox, upViewBox, 0, -CANVAS_CONFIG.PAN_STEP).catch(console.error)
          break

        // Zoom controls - support both with and without Ctrl modifier
        case 'Equal': // + key on US keyboard
          if (!event.repeat) {
            event.preventDefault()
            performZoom('in').catch(console.error)
          }
          break
        case 'Minus': // - key
          if (!event.repeat) {
            event.preventDefault()
            performZoom('out').catch(console.error)
          }
          break

        // View reset controls
        case 'KeyR':
          if (!event.ctrlKey && !event.metaKey && !event.repeat) {
            event.preventDefault()
            resetView(canvasState.viewBox, canvasState.scale, 'keyboard').catch(console.error)
            onViewChange?.(canvasState.viewBox, canvasState.scale)
          }
          break
        case 'Digit0':
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && !event.repeat) {
            event.preventDefault()
            resetView(canvasState.viewBox, canvasState.scale, 'keyboard').catch(console.error)
            onViewChange?.(canvasState.viewBox, canvasState.scale)
          }
          break

        // Preset zoom levels (1-9)
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
          if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat) {
            event.preventDefault()
            const zoomLevel = parseInt(event.code.slice(-1)) * 0.5 // 1=0.5x, 2=1.0x, 3=1.5x, etc.
            performZoomToLevel(zoomLevel).catch(console.error)
          }
          break

        // Grid toggle
        case 'KeyG':
          if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat) {
            event.preventDefault()
            toggleGrid()
          }
          break

        // Home key for fit-to-content
        case 'Home':
          if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat) {
            event.preventDefault()
            fitToContent().catch(console.error)
          }
          break

        // Escape key for clearing selections
        case 'Escape':
          if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && !event.repeat) {
            event.preventDefault()
            selectElement(null)
            onNodeSelect?.(null)
          }
          break

        // Tab navigation for accessibility
        case 'Tab':
          if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat) {
            event.preventDefault()
            navigateNodes(event.shiftKey ? 'previous' : 'next')
          }
          break
      }
    } catch (error) {
      console.error('Failed to handle keyboard shortcut:', error)
    }
  }, [canvasState.viewBox, canvasState.scale, canvasState.nodes, canvasState.selectedNodeId, spaceKeyDown, panCanvas, resetView, zoomCanvas, toggleGrid, selectElement, onNodeSelect, onViewChange, constrainViewBox, performZoom, performZoomToLevel, fitToContent, navigateNodes])

  // Handle key up events
  const handleKeyUp = useCallback((event: React.KeyboardEvent) => {
    if (event.code === 'Space' && spaceKeyDown) {
      event.preventDefault()
      setSpaceKeyDown(false)
      setIsSpacePanning(false)
    }
  }, [spaceKeyDown])

  // Handle touch start events
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault()
    
    const touches = Array.from(event.touches)
    const target = event.target as Element
    const nodeElement = target.closest('[data-testid="canvas-node"]')
    
    if (touches.length === 1) {
      const touch = touches[0]
      
      if (nodeElement) {
        // Start node drag with touch
        const nodeId = nodeElement.getAttribute('data-node-id')
        if (nodeId) {
          const touchPos = screenToSVG(touch.clientX, touch.clientY)
          
          setLocalDragState({
            isDragging: true,
            nodeId,
            startPosition: touchPos,
            currentPosition: touchPos,
          })
          
          selectElement(nodeId)
          onNodeSelect?.(nodeId)
        }
      } else {
        // Start touch pan
        setLastMousePosition({ x: touch.clientX, y: touch.clientY })
        setIsPanning(true)
        
        selectElement(null)
        onNodeSelect?.(null)
      }
    } else if (touches.length === 2) {
      // Start pinch-to-zoom
      const touch1 = touches[0]
      const touch2 = touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      setTouchState({
        initialDistance: distance,
        initialZoom: canvasState.scale,
        lastTouches: touches,
      })
      setIsPanning(false)
      setLocalDragState({
        isDragging: false,
        nodeId: null,
        startPosition: null,
        currentPosition: null,
      })
    }
  }, [screenToSVG, selectElement, onNodeSelect, canvasState.scale])

  // Handle touch move events
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault()
    
    const touches = Array.from(event.touches)
    
    if (touches.length === 1 && (localDragState.isDragging || isPanning)) {
      const touch = touches[0]
      
      if (localDragState.isDragging && localDragState.nodeId) {
        // Handle touch drag for node
        const touchPos = screenToSVG(touch.clientX, touch.clientY)
        setLocalDragState(prev => ({
          ...prev,
          currentPosition: touchPos,
        }))
      } else if (isPanning && lastMousePosition) {
        // Handle touch pan
        const deltaX = touch.clientX - lastMousePosition.x
        const deltaY = touch.clientY - lastMousePosition.y
        
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return
        
        const scaleX = canvasState.viewBox.width / rect.width
        const scaleY = canvasState.viewBox.height / rect.height
        
        const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
          canvasState.viewBox.x - deltaX * scaleX,
          canvasState.viewBox.y - deltaY * scaleY,
          canvasState.viewBox.width,
          canvasState.viewBox.height
        ))
        
        panCanvas(canvasState.viewBox, newViewBox, deltaX * scaleX, deltaY * scaleY)
        
        setLastMousePosition({ x: touch.clientX, y: touch.clientY })
        onViewChange?.(newViewBox, canvasState.scale)
      }
    } else if (touches.length === 2 && touchState.initialDistance > 0) {
      // Handle pinch-to-zoom
      const touch1 = touches[0]
      const touch2 = touches[1]
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const zoomFactor = currentDistance / touchState.initialDistance
      const newScale = CanvasEventUtils.clampZoom(touchState.initialZoom * zoomFactor)
      
      if (Math.abs(newScale - canvasState.scale) > 0.01) {
        // Calculate center point between touches
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2
        const centerPos = screenToSVG(centerX, centerY)
        
        const scaleFactor = newScale / canvasState.scale
        const newViewBox = constrainViewBox(CanvasEventUtils.createViewBox(
          centerPos.x - (centerPos.x - canvasState.viewBox.x) / scaleFactor,
          centerPos.y - (centerPos.y - canvasState.viewBox.y) / scaleFactor,
          canvasState.viewBox.width / scaleFactor,
          canvasState.viewBox.height / scaleFactor
        ))
        
        zoomCanvas(canvasState.scale, newScale, canvasState.viewBox, newViewBox, centerPos)
        onViewChange?.(newViewBox, newScale)
      }
    }
  }, [localDragState, isPanning, lastMousePosition, touchState, canvasState.viewBox, canvasState.scale, screenToSVG, constrainViewBox, panCanvas, zoomCanvas, onViewChange])

  // Handle touch end events
  const handleTouchEnd = useCallback(async (event: React.TouchEvent) => {
    event.preventDefault()
    
    if (localDragState.isDragging && localDragState.nodeId) {
      // Complete touch drag
      const nodeId = localDragState.nodeId
      const startPosition = localDragState.startPosition
      const finalPosition = localDragState.currentPosition || startPosition
      
      if (finalPosition && startPosition) {
        try {
          await moveNode(nodeId, startPosition, finalPosition)
          onNodeMove?.(nodeId, finalPosition)
        } catch (error) {
          console.error('Failed to move node:', error)
        }
      }
      
      setLocalDragState({
        isDragging: false,
        nodeId: null,
        startPosition: null,
        currentPosition: null,
      })
    }
    
    if (isPanning) {
      setIsPanning(false)
      setLastMousePosition(null)
    }
    
    if (event.touches.length === 0) {
      // All touches ended, reset touch state
      setTouchState({
        initialDistance: 0,
        initialZoom: 1,
        lastTouches: [],
      })
    }
  }, [localDragState, isPanning, onNodeMove, moveNode])

  // Expose create node functions to parent components (for backward compatibility)
  useEffect(() => {
    // Make functions available globally for any remaining toolbar buttons
    if (typeof window !== 'undefined') {
      ;(window as any).canvasCreateDocument = createDocumentNode
      ;(window as any).canvasCreateAgent = createAgentNode
    }
  }, [createDocumentNode, createAgentNode])

  // Use optimistic viewBox if available, otherwise use canvasState
  const displayViewBox = optimisticViewBox || canvasState.viewBox
  const displayScale = optimisticScale || canvasState.scale
  const viewBoxString = `${displayViewBox.x} ${displayViewBox.y} ${displayViewBox.width} ${displayViewBox.height}`
  
  // Clear optimistic state when canvasState updates
  useEffect(() => {
    if (optimisticViewBox && (
      Math.abs(canvasState.viewBox.x - optimisticViewBox.x) < 1 &&
      Math.abs(canvasState.viewBox.y - optimisticViewBox.y) < 1
    )) {
      setOptimisticViewBox(null)
    }
  }, [canvasState.viewBox, optimisticViewBox])
  
  useEffect(() => {
    if (optimisticScale && Math.abs(canvasState.scale - optimisticScale) < 0.01) {
      setOptimisticScale(null)
    }
  }, [canvasState.scale, optimisticScale])

  // Show loading overlay if event sourcing is loading
  if (isLoading && canvasState.nodes.length === 0) {
    return (
      <div 
        data-testid="canvas" 
        className={`canvas-container ${className} flex items-center justify-center`}
        aria-label="Loading canvas..."
      >
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    )
  }

  return (
    <div 
      data-testid="canvas" 
      className={`canvas-container ${className} ${isLoading ? 'opacity-75' : ''}`}
      aria-label="Interactive canvas for document workflow"
      aria-describedby="canvas-keyboard-shortcuts"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      style={{
        outline: 'none', // Remove default focus outline, we'll handle focus visually
      }}
    >
      {/* Error display */}
      {error && (
        <div className="absolute top-2 left-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm z-10">
          Error: {error}
        </div>
      )}
      
      {/* Undo/Redo indicators */}
      {(canUndo || canRedo) && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {canUndo && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-2 py-1 rounded text-xs">
              Ctrl+Z to undo
            </div>
          )}
          {canRedo && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-2 py-1 rounded text-xs">
              Ctrl+Y to redo
            </div>
          )}
        </div>
      )}
      <svg
        ref={svgRef}
        data-testid="canvas-svg"
        className={`canvas-svg ${isPanning ? 'panning' : ''} ${isLoading ? 'pointer-events-none' : ''} transition-all duration-75`}
        width="100%"
        height="100%"
        viewBox={viewBoxString}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Canvas workspace"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'none', // Prevent browser touch behaviors
          cursor: isPanning || isSpacePanning || localDragState.isDragging ? 'grabbing' : 'grab'
        }}
      >
        {/* Grid - using showGrid from canvas state */}
        <CanvasGrid 
          viewBox={displayViewBox} 
          scale={displayScale} 
          visible={canvasState.showGrid} 
        />
        
        {/* Nodes */}
        {canvasState.nodes.map((node) => {
          // Handle local drag preview
          const isDraggedNode = localDragState.isDragging && localDragState.nodeId === node.id
          const displayPosition = isDraggedNode && localDragState.currentPosition 
            ? localDragState.currentPosition 
            : node.position
            
          return (
            <g
              key={node.id}
              data-testid="canvas-node"
              data-node-id={node.id}
              data-node-type={node.type}
              className={`canvas-node ${isDraggedNode ? 'dragging' : ''} ${
                node.id === canvasState.selectedNodeId ? 'selected' : ''
              } transition-all duration-200`}
              transform={`translate(${displayPosition.x || 0}, ${displayPosition.y || 0})`}
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
          )
        })}
      </svg>
      
      {/* Hidden accessibility information for keyboard shortcuts */}
      <div id="canvas-keyboard-shortcuts" className="sr-only">
        Keyboard shortcuts: Arrow keys to pan, +/- to zoom, R to reset view, Escape to clear selection, 
        Tab/Shift+Tab to navigate nodes, Space bar for temporary pan mode, Home key to fit content, 
        Number keys 1-9 for preset zoom levels, G to toggle grid, Ctrl+Z/Y for undo/redo.
      </div>
    </div>
  )
}

export default Canvas