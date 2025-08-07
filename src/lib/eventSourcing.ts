import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
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
import {
  DocumentEvent,
  DocumentEventFactory,
  DocumentEventUtils,
} from '../../schemas/events/document'
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
  updateTitle: (title: string) => Promise<void>
  saveVersion: (options?: { description?: string }) => Promise<void>
  undo: () => Promise<void>
  redo: () => Promise<void>
  addConnection: (connectionId: string, type: 'upstream' | 'downstream') => Promise<void>
  removeConnection: (connectionId: string, type: 'upstream' | 'downstream') => Promise<void>
}

// Document event API service
class DocumentEventAPIService {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  async createDocumentEvent(event: DocumentEvent): Promise<DocumentEvent> {
    const response = await fetch(`${this.baseUrl}/events/document`, {
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
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`Failed to create document event: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()
    return {
      ...result.data,
      timestamp: new Date(result.data.timestamp),
    }
  }

  async getDocumentEvents(documentId: string, filters?: {
    type?: string
    typePrefix?: string
    fromTimestamp?: Date
    limit?: number
  }): Promise<DocumentEvent[]> {
    const params = new URLSearchParams()
    params.append('documentId', documentId)
    
    if (filters?.type) params.append('type', filters.type)
    if (filters?.typePrefix) params.append('typePrefix', filters.typePrefix)
    if (filters?.fromTimestamp) params.append('fromTimestamp', filters.fromTimestamp.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${this.baseUrl}/events/document?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch document events: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data.map((event: any) => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }
}

// Document state reducer - applies events to derive document state
function reduceDocumentEvents(events: DocumentEvent[], initialState?: Partial<DocumentState>): DocumentState {
  const defaultState: DocumentState = {
    id: initialState?.id || '',
    title: initialState?.title || 'New Document',
    content: initialState?.content || '',
    version: 1,
    upstream: initialState?.upstream || [],
    downstream: initialState?.downstream || [],
    createdAt: initialState?.createdAt,
    updatedAt: new Date(),
  }

  return events.reduce((state: DocumentState, event: DocumentEvent) => {
    switch (event.type) {
      case 'DOCUMENT_CONTENT_CHANGE': {
        const { newContent } = event.payload
        return {
          ...state,
          content: newContent,
          updatedAt: event.timestamp,
        }
      }

      case 'DOCUMENT_TITLE_CHANGE': {
        const { newTitle } = event.payload
        return {
          ...state,
          title: newTitle,
          updatedAt: event.timestamp,
        }
      }

      case 'DOCUMENT_VERSION_SAVE': {
        const { versionNumber } = event.payload
        return {
          ...state,
          version: Math.max(state.version, versionNumber),
          updatedAt: event.timestamp,
        }
      }

      case 'DOCUMENT_CONNECTION_CHANGE': {
        const { connectionId, connectionType, action } = event.payload
        const connections = state[connectionType]
        
        if (action === 'add' && !connections.includes(connectionId)) {
          return {
            ...state,
            [connectionType]: [...connections, connectionId],
            updatedAt: event.timestamp,
          }
        } else if (action === 'remove' && connections.includes(connectionId)) {
          return {
            ...state,
            [connectionType]: connections.filter(id => id !== connectionId),
            updatedAt: event.timestamp,
          }
        }
        return state
      }

      default:
        return state
    }
  }, defaultState)
}

// Performance optimizations
interface EventBuffer {
  events: DocumentEvent[]
  lastFlushTime: number
  pendingChanges: boolean
}

class DocumentEventBuffer {
  private buffer: EventBuffer = {
    events: [],
    lastFlushTime: Date.now(),
    pendingChanges: false,
  }
  private flushInterval: number = 1000 // 1 second
  private maxBufferSize: number = 50
  private onFlush: (events: DocumentEvent[]) => Promise<void>

  constructor(onFlush: (events: DocumentEvent[]) => Promise<void>) {
    this.onFlush = onFlush
  }

  addEvent(event: DocumentEvent): void {
    this.buffer.events.push(event)
    this.buffer.pendingChanges = true

    // Flush immediately for critical events
    if (DocumentEventUtils.isVersionEvent(event)) {
      this.flush()
      return
    }

    // Flush if buffer is full
    if (this.buffer.events.length >= this.maxBufferSize) {
      this.flush()
      return
    }

    // Schedule flush if none pending
    if (this.buffer.events.length === 1) {
      setTimeout(() => this.flush(), this.flushInterval)
    }
  }

  async flush(): Promise<void> {
    if (!this.buffer.pendingChanges || this.buffer.events.length === 0) {
      return
    }

    const eventsToFlush = [...this.buffer.events]
    this.buffer.events = []
    this.buffer.pendingChanges = false
    this.buffer.lastFlushTime = Date.now()

    try {
      await this.onFlush(eventsToFlush)
    } catch (error) {
      console.error('Failed to flush document events:', error)
      // Re-add events to buffer for retry
      this.buffer.events.unshift(...eventsToFlush)
      this.buffer.pendingChanges = true
    }
  }

  destroy(): void {
    if (this.buffer.pendingChanges) {
      this.flush()
    }
  }
}

export function useDocumentEventSourcing(documentId: string): DocumentEventSourcingState & DocumentEventSourcingActions {
  const [eventHistory, setEventHistory] = useState<DocumentEvent[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  
  const eventService = useRef(new DocumentEventAPIService())
  const eventBuffer = useRef<DocumentEventBuffer | null>(null)
  const lastContentRef = useRef('')
  const versionCounter = useRef(1)

  // Derive document state from events
  const documentState = useMemo(() => {
    const eventsToApply = eventHistory.slice(0, currentEventIndex + 1)
    const initialState = {
      id: documentId,
      title: 'Document Processing Chain Analysis',
      content: '<h1>Document Processing Chain Analysis</h1><p>This document demonstrates the upstream and downstream connection system...</p>',
      upstream: ['doc-source-1', 'doc-analysis-2'],
      downstream: ['doc-summary-1', 'doc-report-2'],
    }
    return reduceDocumentEvents(eventsToApply, initialState)
  }, [eventHistory, currentEventIndex, documentId])
  
  // Undo/redo capabilities
  const canUndo = currentEventIndex >= 0
  const canRedo = currentEventIndex < eventHistory.length - 1

  // Initialize event buffer
  useEffect(() => {
    const handleFlush = async (events: DocumentEvent[]) => {
      try {
        // Batch create events
        const promises = events.map(event => eventService.current.createDocumentEvent(event))
        await Promise.all(promises)
      } catch (error) {
        console.error('Failed to persist document events:', error)
        throw error
      }
    }

    eventBuffer.current = new DocumentEventBuffer(handleFlush)

    return () => {
      if (eventBuffer.current) {
        eventBuffer.current.destroy()
      }
    }
  }, [])

  // Load initial events and start session
  useEffect(() => {
    const loadInitialEvents = async () => {
      setIsLoading(true)
      try {
        const events = await eventService.current.getDocumentEvents(documentId, {
          limit: 1000, // Load recent events
        })
        
        if (events.length > 0) {
          setEventHistory(events)
          setCurrentEventIndex(events.length - 1)
          
          // Set initial content reference
          const latestContent = reduceDocumentEvents(events, { id: documentId }).content
          lastContentRef.current = latestContent
        }

        // Create session start event
        const sessionEvent = DocumentEventFactory.createSessionEvent(
          documentId,
          'start',
          {
            sessionId,
            initialContent: documentState?.content || '',
          }
        )
        
        if (eventBuffer.current) {
          eventBuffer.current.addEvent(sessionEvent)
        }
        
      } catch (err) {
        console.warn('Failed to load initial document events (API may not be available):', err)
        // Don't set error in development/testing environments
        if (process.env.NODE_ENV === 'production') {
          setError(err instanceof Error ? err.message : 'Failed to load document events')
        }

        // Initialize with minimal content
        lastContentRef.current = documentState?.content || ''
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialEvents()

    // Cleanup on unmount - end session
    return () => {
      if (eventBuffer.current) {
        const sessionEvent = DocumentEventFactory.createSessionEvent(
          documentId,
          'end',
          {
            sessionId,
            finalContent: documentState?.content || '',
          }
        )
        eventBuffer.current.addEvent(sessionEvent)
        eventBuffer.current.destroy()
      }
    }
  }, [documentId])

  // Helper function to dispatch event
  const dispatchEvent = useCallback(async (event: DocumentEvent, immediate: boolean = false) => {
    try {
      // Update local event history immediately for responsive UI
      setEventHistory(prev => {
        // If we're in the middle of history (after undo), truncate future events
        const newHistory = currentEventIndex < prev.length - 1 
          ? prev.slice(0, currentEventIndex + 1)
          : prev
        
        return [...newHistory, event]
      })
      
      setCurrentEventIndex(prev => prev + 1)

      // Add to buffer for persistence
      if (eventBuffer.current) {
        eventBuffer.current.addEvent(event)
        
        // Flush immediately for critical events
        if (immediate || DocumentEventUtils.isVersionEvent(event)) {
          await eventBuffer.current.flush()
        }
      }
    } catch (err) {
      console.error('Failed to dispatch document event:', err)
      setError(err instanceof Error ? err.message : 'Failed to save document event')
      throw err
    }
  }, [currentEventIndex])

  // Content update with change detection
  const updateContent = useCallback(async (content: string) => {
    const previousContent = lastContentRef.current
    
    // Skip if content hasn't actually changed
    if (previousContent === content) {
      return
    }

    // Detect change type
    let changeType: 'insert' | 'delete' | 'replace' = 'replace'
    if (content.length > previousContent.length) {
      changeType = 'insert'
    } else if (content.length < previousContent.length) {
      changeType = 'delete'
    }

    const event = DocumentEventFactory.createContentChangeEvent(
      documentId,
      previousContent,
      content,
      changeType
    )
    
    lastContentRef.current = content
    await dispatchEvent(event)
  }, [documentId, dispatchEvent])

  // Title update
  const updateTitle = useCallback(async (title: string) => {
    const previousTitle = documentState?.title || ''
    
    if (previousTitle === title) {
      return
    }

    const event = DocumentEventFactory.createTitleChangeEvent(
      documentId,
      previousTitle,
      title
    )
    
    await dispatchEvent(event)
  }, [documentId, documentState?.title, dispatchEvent])

  // Save version with snapshot
  const saveVersion = useCallback(async (options: { description?: string } = {}) => {
    const currentContent = documentState?.content || ''
    const versionNumber = versionCounter.current++
    
    const event = DocumentEventFactory.createVersionSaveEvent(
      documentId,
      versionNumber,
      currentContent,
      {
        description: options.description || `Version ${versionNumber}`,
      }
    )
    
    await dispatchEvent(event, true) // Immediate flush for versions
  }, [documentId, documentState?.content, dispatchEvent])

  // Undo operation
  const undo = useCallback(async () => {
    if (!canUndo) return
    
    const contentBefore = documentState?.content || ''
    
    // Move to previous state
    const newIndex = currentEventIndex - 1
    setCurrentEventIndex(newIndex)
    
    // Get content after undo
    const eventsAfterUndo = eventHistory.slice(0, newIndex + 1)
    const stateAfterUndo = reduceDocumentEvents(eventsAfterUndo, { id: documentId })
    const contentAfter = stateAfterUndo.content
    
    // Create undo event for tracking
    const undoEvent = DocumentEventFactory.createUndoRedoEvent(
      documentId,
      'undo',
      contentBefore,
      contentAfter
    )
    
    // Add undo event without affecting the main timeline
    if (eventBuffer.current) {
      eventBuffer.current.addEvent(undoEvent)
    }
    
    lastContentRef.current = contentAfter
  }, [canUndo, currentEventIndex, documentState?.content, eventHistory, documentId])

  // Redo operation
  const redo = useCallback(async () => {
    if (!canRedo) return
    
    const contentBefore = documentState?.content || ''
    
    // Move to next state
    const newIndex = currentEventIndex + 1
    setCurrentEventIndex(newIndex)
    
    // Get content after redo
    const eventsAfterRedo = eventHistory.slice(0, newIndex + 1)
    const stateAfterRedo = reduceDocumentEvents(eventsAfterRedo, { id: documentId })
    const contentAfter = stateAfterRedo.content
    
    // Create redo event for tracking
    const redoEvent = DocumentEventFactory.createUndoRedoEvent(
      documentId,
      'redo',
      contentBefore,
      contentAfter
    )
    
    // Add redo event without affecting the main timeline
    if (eventBuffer.current) {
      eventBuffer.current.addEvent(redoEvent)
    }
    
    lastContentRef.current = contentAfter
  }, [canRedo, currentEventIndex, documentState?.content, eventHistory, documentId])

  // Connection management
  const addConnection = useCallback(async (connectionId: string, type: 'upstream' | 'downstream') => {
    const event = DocumentEventFactory.createConnectionChangeEvent(
      documentId,
      connectionId,
      type,
      'add'
    )
    
    await dispatchEvent(event)
  }, [documentId, dispatchEvent])

  const removeConnection = useCallback(async (connectionId: string, type: 'upstream' | 'downstream') => {
    const event = DocumentEventFactory.createConnectionChangeEvent(
      documentId,
      connectionId,
      type,
      'remove'
    )
    
    await dispatchEvent(event)
  }, [documentId, dispatchEvent])

  return {
    documentState,
    eventHistory,
    currentEventIndex,
    isLoading,
    error,
    canUndo,
    canRedo,
    updateContent,
    updateTitle,
    saveVersion,
    undo,
    redo,
    addConnection,
    removeConnection,
  }
}