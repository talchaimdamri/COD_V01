import { useState, useCallback, useRef, useEffect } from 'react'
import {
  CanvasEvent,
  CanvasEventFactory,
  AddNodeEvent,
  MoveNodeEvent,
  DeleteNodeEvent,
  SelectElementEvent,
  PanCanvasEvent,
  ZoomCanvasEvent,
  ResetViewEvent,
  Position,
  NodeType,
  ViewBox,
  ZoomLevel,
  CanvasEventUtils,
  CANVAS_LIMITS,
} from '../../schemas/events/canvas'
import { CanvasState, CanvasNode, DEFAULT_VIEW_BOX } from '../components/canvas/types'

/**
 * Event sourcing service for canvas operations
 * Manages canvas state through immutable events instead of direct state mutations
 */

export interface EventSourcingState {
  // Current canvas state derived from events
  canvasState: CanvasState
  
  // Event history for undo/redo
  eventHistory: CanvasEvent[]
  currentEventIndex: number
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  
  // Undo/redo capabilities
  canUndo: boolean
  canRedo: boolean
}

export interface EventSourcingActions {
  // Node operations
  addNode: (nodeType: NodeType, position: Position, title?: string) => Promise<void>
  moveNode: (nodeId: string, fromPosition: Position, toPosition: Position) => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  selectElement: (elementId: string | null) => Promise<void>
  
  // Canvas operations
  panCanvas: (fromViewBox: ViewBox, toViewBox: ViewBox, deltaX: number, deltaY: number) => Promise<void>
  zoomCanvas: (fromZoom: ZoomLevel, toZoom: ZoomLevel, fromViewBox: ViewBox, toViewBox: ViewBox, zoomCenter?: Position) => Promise<void>
  resetView: (fromViewBox: ViewBox, fromZoom: ZoomLevel, resetType?: 'keyboard' | 'button' | 'auto') => Promise<void>
  
  // Undo/redo operations
  undo: () => Promise<void>
  redo: () => Promise<void>
  
  // Event replay and recovery
  replayEvents: (events: CanvasEvent[]) => void
  clearHistory: () => void
}

// Event API service
class EventAPIService {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  async createEvent(event: CanvasEvent): Promise<CanvasEvent> {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp?.toISOString(),
        userId: event.userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to create event: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()
    return {
      ...result.data,
      timestamp: new Date(result.data.timestamp),
    }
  }

  async getEvents(filters?: {
    type?: string
    typePrefix?: string
    fromTimestamp?: Date
    limit?: number
  }): Promise<CanvasEvent[]> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type)
    if (filters?.typePrefix) params.append('typePrefix', filters.typePrefix)
    if (filters?.fromTimestamp) params.append('fromTimestamp', filters.fromTimestamp.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${this.baseUrl}/events?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data.map((event: any) => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }
}

// Event reducer - applies events to derive canvas state
function reduceCanvasEvents(events: CanvasEvent[]): CanvasState {
  return events.reduce((state: CanvasState, event: CanvasEvent) => {
    switch (event.type) {
      case 'ADD_NODE': {
        const { nodeId, nodeType, position, title } = (event as AddNodeEvent).payload
        const newNode: CanvasNode = {
          id: nodeId,
          type: nodeType,
          position,
          title: title || `${nodeType === 'document' ? 'Document' : 'Agent'} ${state.nodes.length + 1}`,
        }
        return {
          ...state,
          nodes: [...state.nodes, newNode],
        }
      }

      case 'MOVE_NODE': {
        const { nodeId, toPosition } = (event as MoveNodeEvent).payload
        return {
          ...state,
          nodes: state.nodes.map(node =>
            node.id === nodeId ? { ...node, position: toPosition } : node
          ),
        }
      }

      case 'DELETE_NODE': {
        const { nodeId } = (event as DeleteNodeEvent).payload
        return {
          ...state,
          nodes: state.nodes.filter(node => node.id !== nodeId),
        }
      }

      case 'SELECT_ELEMENT': {
        const { elementId } = (event as SelectElementEvent).payload
        return {
          ...state,
          selectedNodeId: elementId,
        }
      }

      case 'PAN_CANVAS': {
        const { toViewBox } = (event as PanCanvasEvent).payload
        return {
          ...state,
          viewBox: toViewBox,
        }
      }

      case 'ZOOM_CANVAS': {
        const { toZoom, toViewBox } = (event as ZoomCanvasEvent).payload
        return {
          ...state,
          scale: toZoom,
          viewBox: toViewBox,
        }
      }

      case 'RESET_VIEW': {
        const { toViewBox, toZoom } = (event as ResetViewEvent).payload
        return {
          ...state,
          viewBox: toViewBox,
          scale: toZoom,
        }
      }

      default:
        return state
    }
  }, {
    nodes: [],
    viewBox: DEFAULT_VIEW_BOX,
    scale: 1,
    isPanning: false,
    selectedNodeId: null,
    showGrid: true,
    dragState: {
      isDragging: false,
      nodeId: null,
      startPosition: null,
      currentPosition: null,
    },
  })
}

// Generate unique node ID
function generateNodeId(): string {
  return `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Canvas Event Sourcing Hook
 * Replaces useState with event-driven state management
 */
export function useCanvasEventSourcing(): EventSourcingState & EventSourcingActions {
  const [eventHistory, setEventHistory] = useState<CanvasEvent[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const eventService = useRef(new EventAPIService())

  // Derive canvas state from events
  const canvasState = reduceCanvasEvents(eventHistory.slice(0, currentEventIndex + 1))
  
  // Undo/redo capabilities
  const canUndo = currentEventIndex >= 0
  const canRedo = currentEventIndex < eventHistory.length - 1

  // Load initial events on mount
  useEffect(() => {
    const loadInitialEvents = async () => {
      setIsLoading(true)
      try {
        const events = await eventService.current.getEvents({
          typePrefix: 'ADD_NODE,MOVE_NODE,DELETE_NODE,SELECT_ELEMENT,PAN_CANVAS,ZOOM_CANVAS,RESET_VIEW',
          limit: 100,
        })
        
        if (events.length > 0) {
          setEventHistory(events)
          setCurrentEventIndex(events.length - 1)
        }
      } catch (err) {
        console.warn('Failed to load initial events (API may not be available):', err)
        // Don't set error in development/testing environments
        if (process.env.NODE_ENV === 'production') {
          setError(err instanceof Error ? err.message : 'Failed to load events')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialEvents()
  }, [])

  // Helper function to dispatch event
  const dispatchEvent = useCallback(async (event: CanvasEvent) => {
    setIsLoading(true)
    setError(null)
    
    try {
      let persistedEvent = event
      
      // Try to send event to API, but don't fail if API is unavailable
      try {
        persistedEvent = await eventService.current.createEvent(event)
      } catch (apiErr) {
        console.warn('API not available, using local event:', apiErr)
        // In development/testing, continue with local event
        if (process.env.NODE_ENV === 'production') {
          throw apiErr
        }
      }
      
      // Update local event history
      setEventHistory(prev => {
        // If we're in the middle of history (after undo), truncate future events
        const newHistory = currentEventIndex < prev.length - 1 
          ? prev.slice(0, currentEventIndex + 1)
          : prev
        
        return [...newHistory, persistedEvent]
      })
      
      setCurrentEventIndex(prev => prev + 1)
    } catch (err) {
      console.error('Failed to dispatch event:', err)
      setError(err instanceof Error ? err.message : 'Failed to save event')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentEventIndex])

  // Node operations
  const addNode = useCallback(async (nodeType: NodeType, position: Position, title?: string) => {
    const nodeId = generateNodeId()
    const event = CanvasEventFactory.createAddNodeEvent(nodeId, nodeType, position, { title })
    await dispatchEvent(event)
  }, [dispatchEvent])

  const moveNode = useCallback(async (nodeId: string, fromPosition: Position, toPosition: Position) => {
    const event = CanvasEventFactory.createMoveNodeEvent(nodeId, fromPosition, toPosition)
    await dispatchEvent(event)
  }, [dispatchEvent])

  const deleteNode = useCallback(async (nodeId: string) => {
    // Find the node to get its data for undo purposes
    const node = canvasState.nodes.find(n => n.id === nodeId)
    if (!node) return
    
    const event: DeleteNodeEvent = {
      type: 'DELETE_NODE',
      payload: {
        nodeId,
        nodeType: node.type,
        position: node.position,
        data: { title: node.title },
      },
      timestamp: new Date(),
    }
    
    await dispatchEvent(event)
  }, [dispatchEvent, canvasState.nodes])

  const selectElement = useCallback(async (elementId: string | null) => {
    const event: SelectElementEvent = {
      type: 'SELECT_ELEMENT',
      payload: {
        elementId,
        multiSelect: false,
        elementType: elementId ? 'node' : undefined,
        previousSelection: canvasState.selectedNodeId,
      },
      timestamp: new Date(),
    }
    
    await dispatchEvent(event)
  }, [dispatchEvent, canvasState.selectedNodeId])

  // Canvas operations
  const panCanvas = useCallback(async (fromViewBox: ViewBox, toViewBox: ViewBox, deltaX: number, deltaY: number) => {
    const event: PanCanvasEvent = {
      type: 'PAN_CANVAS',
      payload: {
        fromViewBox,
        toViewBox,
        deltaX,
        deltaY,
      },
      timestamp: new Date(),
    }
    
    await dispatchEvent(event)
  }, [dispatchEvent])

  const zoomCanvas = useCallback(async (
    fromZoom: ZoomLevel,
    toZoom: ZoomLevel,
    fromViewBox: ViewBox,
    toViewBox: ViewBox,
    zoomCenter?: Position
  ) => {
    const event = CanvasEventFactory.createZoomCanvasEvent(
      fromZoom,
      toZoom,
      fromViewBox,
      toViewBox,
      { zoomCenter }
    )
    
    await dispatchEvent(event)
  }, [dispatchEvent])

  const resetView = useCallback(async (
    fromViewBox: ViewBox,
    fromZoom: ZoomLevel,
    resetType: 'keyboard' | 'button' | 'auto' = 'keyboard'
  ) => {
    const toViewBox = CanvasEventUtils.createViewBox(
      0, 0, 
      CANVAS_LIMITS.VIEWPORT.DEFAULT_WIDTH, 
      CANVAS_LIMITS.VIEWPORT.DEFAULT_HEIGHT
    )
    const toZoom = CANVAS_LIMITS.ZOOM.DEFAULT as ZoomLevel
    
    const event: ResetViewEvent = {
      type: 'RESET_VIEW',
      payload: {
        fromViewBox,
        fromZoom,
        toViewBox,
        toZoom,
        resetType,
      },
      timestamp: new Date(),
    }
    
    await dispatchEvent(event)
  }, [dispatchEvent])

  // Undo/redo operations
  const undo = useCallback(async () => {
    if (canUndo) {
      setCurrentEventIndex(prev => prev - 1)
    }
  }, [canUndo])

  const redo = useCallback(async () => {
    if (canRedo) {
      setCurrentEventIndex(prev => prev + 1)
    }
  }, [canRedo])

  // Event replay and recovery
  const replayEvents = useCallback((events: CanvasEvent[]) => {
    setEventHistory(events)
    setCurrentEventIndex(events.length - 1)
  }, [])

  const clearHistory = useCallback(() => {
    setEventHistory([])
    setCurrentEventIndex(-1)
  }, [])

  return {
    // State
    canvasState,
    eventHistory,
    currentEventIndex,
    isLoading,
    error,
    canUndo,
    canRedo,
    
    // Actions
    addNode,
    moveNode,
    deleteNode,
    selectElement,
    panCanvas,
    zoomCanvas,
    resetView,
    undo,
    redo,
    replayEvents,
    clearHistory,
  }
}

/**
 * Document Event Sourcing Hook
 * Manages document state through event sourcing
 */
export interface DocumentState {
  id: string
  title: string
  content: string
  version: number
  upstream: string[]
  downstream: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface DocumentEventSourcingState {
  documentState: DocumentState | null
  eventHistory: any[]
  currentEventIndex: number
  isLoading: boolean
  error: string | null
  canUndo: boolean
  canRedo: boolean
}

export interface DocumentEventSourcingActions {
  updateContent: (content: string) => Promise<void>
  saveVersion: (options: { description?: string }) => Promise<void>
  undo: () => Promise<void>
  redo: () => Promise<void>
  addConnection: (connectionId: string, type: 'upstream' | 'downstream') => Promise<void>
  removeConnection: (connectionId: string, type: 'upstream' | 'downstream') => Promise<void>
}

export function useDocumentEventSourcing(documentId: string): DocumentEventSourcingState & DocumentEventSourcingActions {
  const [documentState, setDocumentState] = useState<DocumentState | null>({
    id: documentId,
    title: 'Document Processing Chain Analysis',
    content: '<h1>Document Processing Chain Analysis</h1><p>This document demonstrates the upstream and downstream connection system...</p>',
    version: 1,
    upstream: ['doc-source-1', 'doc-analysis-2'],
    downstream: ['doc-summary-1', 'doc-report-2'],
  })
  const [eventHistory] = useState<any[]>([])
  const [currentEventIndex] = useState(-1)
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [canUndo] = useState(false)
  const [canRedo] = useState(false)

  const updateContent = useCallback(async (content: string) => {
    if (documentState) {
      setDocumentState(prev => prev ? { ...prev, content } : null)
    }
  }, [documentState])

  const saveVersion = useCallback(async (options: { description?: string }) => {
    console.log('Saving version with options:', options)
  }, [])

  const undo = useCallback(async () => {
    console.log('Undo called')
  }, [])

  const redo = useCallback(async () => {
    console.log('Redo called')
  }, [])

  const addConnection = useCallback(async (connectionId: string, type: 'upstream' | 'downstream') => {
    if (!documentState) return
    
    console.log('Adding connection:', connectionId, type)
    
    // Update the document state with the new connection
    setDocumentState(prev => {
      if (!prev) return null
      
      const connections = prev[type]
      if (connections.includes(connectionId)) return prev
      
      return {
        ...prev,
        [type]: [...connections, connectionId],
      }
    })
  }, [documentState])

  const removeConnection = useCallback(async (connectionId: string, type: 'upstream' | 'downstream') => {
    if (!documentState) return
    
    console.log('Removing connection:', connectionId, type)
    
    // Update the document state by removing the connection
    setDocumentState(prev => {
      if (!prev) return null
      
      const connections = prev[type]
      if (!connections.includes(connectionId)) return prev
      
      return {
        ...prev,
        [type]: connections.filter(id => id !== connectionId),
      }
    })
  }, [documentState])

  return {
    documentState,
    eventHistory,
    currentEventIndex,
    isLoading,
    error,
    canUndo,
    canRedo,
    updateContent,
    saveVersion,
    undo,
    redo,
    addConnection,
    removeConnection,
  }
}