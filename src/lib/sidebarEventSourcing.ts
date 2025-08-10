/**
 * Sidebar Event Sourcing Hook
 * Integrates sidebar state management with the event sourcing system
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  SidebarEvent,
  SidebarEventFactory,
  SidebarEventUtils,
  SidebarLayoutChangeEvent,
  SidebarCollapseEvent,
  SidebarResizeEvent,
  SidebarSectionToggleEvent,
  SidebarSearchEvent,
  SidebarItemSelectEvent,
  SidebarItemDragStartEvent,
  SidebarItemDragEndEvent,
  SidebarStateUpdateEvent
} from '../../schemas/events/sidebar'
import { 
  SidebarState, 
  SidebarLayout, 
  SidebarSectionState,
  SidebarFactory,
  SidebarObjectItem
} from '../../schemas/api/sidebar'
import { Position } from '../../schemas/events/common'

/**
 * Sidebar Event Sourcing State Interface
 */
export interface SidebarEventSourcingState {
  // Current sidebar state derived from events
  sidebarState: SidebarState
  sidebarLayout: SidebarLayout
  
  // Event history for undo/redo
  eventHistory: SidebarEvent[]
  currentEventIndex: number
  
  // Loading and error states
  isLoading: boolean
  error: string | null
  
  // Undo/redo capabilities
  canUndo: boolean
  canRedo: boolean
  
  // Data loading states
  itemsLoading: Record<string, boolean>
  itemsError: Record<string, string | null>
}

/**
 * Sidebar Event Sourcing Actions Interface
 */
export interface SidebarEventSourcingActions {
  // Layout operations
  updateLayout: (newLayout: SidebarLayout, trigger?: 'user' | 'resize' | 'collapse' | 'auto') => Promise<void>
  toggleCollapse: (trigger?: 'toggle' | 'keyboard' | 'auto') => Promise<void>
  resizeSidebar: (fromWidth: number, toWidth: number, startPos: Position, endPos: Position, method?: 'drag' | 'keyboard' | 'programmatic') => Promise<void>
  
  // Section operations
  toggleSection: (sectionId: string, sectionType: 'chains' | 'documents' | 'agents') => Promise<void>
  searchSection: (searchTerm: string, sectionId?: string, searchType?: 'local' | 'global') => Promise<void>
  filterSection: (sectionId: string, filterId: string, filterValue: any) => Promise<void>
  
  // Item operations
  selectItem: (itemId: string, itemType: 'chain' | 'document' | 'agent', sectionId: string, method?: 'click' | 'keyboard' | 'programmatic') => Promise<void>
  toggleItemFavorite: (itemId: string, itemType: 'chain' | 'document' | 'agent') => Promise<void>
  startItemDrag: (itemId: string, itemType: 'chain' | 'document' | 'agent', sectionId: string, startPos: Position, dragData: Record<string, any>) => Promise<void>
  endItemDrag: (itemId: string, itemType: 'chain' | 'document' | 'agent', startPos: Position, success: boolean, endPos?: Position, dropTarget?: string, dropAction?: 'copy' | 'move' | 'link') => Promise<void>
  
  // Data operations
  loadSectionData: (sectionId: string, refresh?: boolean) => Promise<void>
  updateSectionData: (sectionId: string, items: SidebarObjectItem[]) => Promise<void>
  
  // State operations
  updateGlobalState: (stateUpdates: Partial<SidebarState>, source?: 'user' | 'api' | 'sync' | 'restore') => Promise<void>
  
  // Undo/redo operations
  undo: () => Promise<void>
  redo: () => Promise<void>
  
  // Event replay and recovery
  replayEvents: (events: SidebarEvent[]) => void
  clearHistory: () => void
}

// Sidebar Event API Service
class SidebarEventAPIService {
  private baseUrl: string

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
  }

  async createSidebarEvent(event: SidebarEvent): Promise<SidebarEvent> {
    const response = await fetch(`${this.baseUrl}/events/sidebar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp?.toISOString(),
        meta: event.meta,
        userId: event.userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }))
      throw new Error(`Failed to create sidebar event: ${errorData.error?.message || response.statusText}`)
    }

    const result = await response.json()
    return {
      ...result.data,
      timestamp: new Date(result.data.timestamp),
    }
  }

  async getSidebarEvents(filters?: {
    type?: string
    typePrefix?: string
    fromTimestamp?: Date
    limit?: number
  }): Promise<SidebarEvent[]> {
    const params = new URLSearchParams()
    
    if (filters?.type) params.append('type', filters.type)
    if (filters?.typePrefix) params.append('typePrefix', filters.typePrefix)
    if (filters?.fromTimestamp) params.append('fromTimestamp', filters.fromTimestamp.toISOString())
    if (filters?.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${this.baseUrl}/events/sidebar?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sidebar events: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data.map((event: any) => ({
      ...event,
      timestamp: new Date(event.timestamp),
    }))
  }

  async loadSectionItems(sectionType: 'chains' | 'documents' | 'agents', options?: {
    page?: number
    limit?: number
    search?: string
  }): Promise<{ items: SidebarObjectItem[], pagination?: any }> {
    const params = new URLSearchParams()
    
    if (options?.page) params.append('page', options.page.toString())
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.search) params.append('search', options.search)

    const response = await fetch(`${this.baseUrl}/sidebar/${sectionType}?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to load ${sectionType}: ${response.statusText}`)
    }

    const result = await response.json()
    return {
      items: result.data,
      pagination: result.pagination
    }
  }
}

// Event reducer - applies events to derive sidebar state
function reduceSidebarEvents(events: SidebarEvent[], initialLayout: SidebarLayout): { state: SidebarState, layout: SidebarLayout } {
  let currentLayout = { ...initialLayout }
  let currentState: SidebarState = SidebarFactory.createDefaultState()

  return events.reduce((acc, event) => {
    switch (event.type) {
      case 'SIDEBAR_LAYOUT_CHANGE': {
        const { toLayout } = (event as SidebarLayoutChangeEvent).payload
        return {
          ...acc,
          layout: { ...toLayout }
        }
      }

      case 'SIDEBAR_COLLAPSE': {
        const { isCollapsed, savedWidth } = (event as SidebarCollapseEvent).payload
        return {
          ...acc,
          layout: {
            ...acc.layout,
            isCollapsed,
            width: isCollapsed ? acc.layout.collapsedWidth : savedWidth
          }
        }
      }

      case 'SIDEBAR_RESIZE': {
        const { toWidth } = (event as SidebarResizeEvent).payload
        return {
          ...acc,
          layout: {
            ...acc.layout,
            width: toWidth,
            isResizing: false
          }
        }
      }

      case 'SIDEBAR_SECTION_TOGGLE': {
        const { sectionId, isCollapsed } = (event as SidebarSectionToggleEvent).payload
        return {
          ...acc,
          state: {
            ...acc.state,
            sections: {
              ...acc.state.sections,
              [sectionId]: {
                ...acc.state.sections[sectionId],
                isCollapsed
              }
            }
          }
        }
      }

      case 'SIDEBAR_SEARCH': {
        const { sectionId, searchTerm, searchType } = (event as SidebarSearchEvent).payload
        if (searchType === 'global') {
          return {
            ...acc,
            state: {
              ...acc.state,
              globalSearch: {
                ...acc.state.globalSearch,
                term: searchTerm
              }
            }
          }
        } else if (sectionId) {
          return {
            ...acc,
            state: {
              ...acc.state,
              sections: {
                ...acc.state.sections,
                [sectionId]: {
                  ...acc.state.sections[sectionId],
                  search: {
                    ...acc.state.sections[sectionId]?.search,
                    term: searchTerm
                  }
                }
              }
            }
          }
        }
        return acc
      }

      case 'SIDEBAR_ITEM_SELECT': {
        const { itemId, sectionId } = (event as SidebarItemSelectEvent).payload
        return {
          ...acc,
          state: {
            ...acc.state,
            sections: {
              ...acc.state.sections,
              [sectionId]: {
                ...acc.state.sections[sectionId],
                selectedItemId: itemId
              }
            }
          }
        }
      }

      case 'SIDEBAR_STATE_UPDATE': {
        const { toState } = (event as SidebarStateUpdateEvent).payload
        return {
          ...acc,
          state: {
            ...acc.state,
            ...toState
          }
        }
      }

      default:
        return acc
    }
  }, { state: currentState, layout: currentLayout })
}

/**
 * Sidebar Event Sourcing Hook
 */
export function useSidebarEventSourcing(initialLayout?: SidebarLayout): SidebarEventSourcingState & SidebarEventSourcingActions {
  const defaultLayout = useMemo(() => initialLayout || SidebarFactory.createDefaultConfig().layout!, [initialLayout])
  
  const [eventHistory, setEventHistory] = useState<SidebarEvent[]>([])
  const [currentEventIndex, setCurrentEventIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itemsLoading, setItemsLoading] = useState<Record<string, boolean>>({})
  const [itemsError, setItemsError] = useState<Record<string, string | null>>({})
  
  const eventService = useRef(new SidebarEventAPIService())
  const eventBuffer = useRef<SidebarEvent[]>([])
  const flushTimeout = useRef<NodeJS.Timeout | null>(null)

  // Derive sidebar state from events
  const { state: sidebarState, layout: sidebarLayout } = useMemo(() => {
    const eventsToApply = eventHistory.slice(0, currentEventIndex + 1)
    return reduceSidebarEvents(eventsToApply, defaultLayout)
  }, [eventHistory, currentEventIndex, defaultLayout])
  
  // Undo/redo capabilities
  const canUndo = currentEventIndex >= 0
  const canRedo = currentEventIndex < eventHistory.length - 1

  // Load initial events on mount
  useEffect(() => {
    const loadInitialEvents = async () => {
      setIsLoading(true)
      try {
        const events = await eventService.current.getSidebarEvents({
          typePrefix: 'SIDEBAR_',
          limit: 100,
        })
        
        if (events.length > 0) {
          setEventHistory(events)
          setCurrentEventIndex(events.length - 1)
        }
      } catch (err) {
        console.warn('Failed to load initial sidebar events (API may not be available):', err)
        if (process.env.NODE_ENV === 'production') {
          setError(err instanceof Error ? err.message : 'Failed to load sidebar events')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialEvents()
  }, [])

  // Batch event flushing for performance
  const flushEvents = useCallback(async () => {
    if (eventBuffer.current.length === 0) return

    const eventsToFlush = [...eventBuffer.current]
    eventBuffer.current = []

    try {
      // Process high-priority events first
      const sortedEvents = eventsToFlush.sort((a, b) => {
        const aPriority = SidebarEventUtils.getEventPriority(a)
        const bPriority = SidebarEventUtils.getEventPriority(b)
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[bPriority] - priorityOrder[aPriority]
      })

      // Send events to API
      const persistedEvents = await Promise.all(
        sortedEvents.map(event => eventService.current.createSidebarEvent(event))
      )

      // Update local state
      setEventHistory(prev => {
        const newHistory = currentEventIndex < prev.length - 1 
          ? prev.slice(0, currentEventIndex + 1)
          : prev
        return [...newHistory, ...persistedEvents]
      })
      
      setCurrentEventIndex(prev => prev + persistedEvents.length)
      
    } catch (err) {
      console.error('Failed to flush sidebar events:', err)
      // Re-add events to buffer for retry
      eventBuffer.current.unshift(...eventsToFlush)
      
      if (process.env.NODE_ENV === 'production') {
        setError(err instanceof Error ? err.message : 'Failed to persist sidebar events')
      }
    }
  }, [currentEventIndex])

  // Helper function to dispatch event
  const dispatchEvent = useCallback(async (event: SidebarEvent, immediate: boolean = false) => {
    try {
      if (immediate || !SidebarEventUtils.shouldBatch(event)) {
        // Handle immediately for critical events
        const persistedEvent = await eventService.current.createSidebarEvent(event)
        
        setEventHistory(prev => {
          const newHistory = currentEventIndex < prev.length - 1 
            ? prev.slice(0, currentEventIndex + 1)
            : prev
          return [...newHistory, persistedEvent]
        })
        
        setCurrentEventIndex(prev => prev + 1)
      } else {
        // Add to buffer for batch processing
        eventBuffer.current.push(event)
        
        // Immediate local state update for responsive UI
        setEventHistory(prev => {
          const newHistory = currentEventIndex < prev.length - 1 
            ? prev.slice(0, currentEventIndex + 1)
            : prev
          return [...newHistory, event]
        })
        
        setCurrentEventIndex(prev => prev + 1)
        
        // Schedule batch flush
        if (flushTimeout.current) {
          clearTimeout(flushTimeout.current)
        }
        
        flushTimeout.current = setTimeout(flushEvents, 500)
      }
    } catch (err) {
      console.error('Failed to dispatch sidebar event:', err)
      setError(err instanceof Error ? err.message : 'Failed to save sidebar event')
      throw err
    }
  }, [currentEventIndex, flushEvents])

  // Layout operations
  const updateLayout = useCallback(async (newLayout: SidebarLayout, trigger: 'user' | 'resize' | 'collapse' | 'auto' = 'user') => {
    const event = SidebarEventFactory.createLayoutChangeEvent(sidebarLayout, newLayout, trigger)
    await dispatchEvent(event, true)
  }, [sidebarLayout, dispatchEvent])

  const toggleCollapse = useCallback(async (trigger: 'toggle' | 'keyboard' | 'auto' = 'toggle') => {
    const event = SidebarEventFactory.createCollapseEvent(
      sidebarLayout.isCollapsed,
      !sidebarLayout.isCollapsed,
      sidebarLayout.width,
      trigger
    )
    await dispatchEvent(event, true)
  }, [sidebarLayout, dispatchEvent])

  const resizeSidebar = useCallback(async (
    fromWidth: number,
    toWidth: number,
    startPos: Position,
    endPos: Position,
    method: 'drag' | 'keyboard' | 'programmatic' = 'drag'
  ) => {
    const event = SidebarEventFactory.createResizeEvent(fromWidth, toWidth, startPos, endPos, method)
    await dispatchEvent(event)
  }, [dispatchEvent])

  // Section operations
  const toggleSection = useCallback(async (sectionId: string, sectionType: 'chains' | 'documents' | 'agents') => {
    const currentSection = sidebarState.sections[sectionId]
    const wasCollapsed = currentSection?.isCollapsed ?? false
    const event = SidebarEventFactory.createSectionToggleEvent(sectionId, wasCollapsed, !wasCollapsed, sectionType)
    await dispatchEvent(event)
  }, [sidebarState.sections, dispatchEvent])

  const searchSection = useCallback(async (searchTerm: string, sectionId?: string, searchType: 'local' | 'global' = 'local') => {
    const previousTerm = searchType === 'global' 
      ? sidebarState.globalSearch?.term || ''
      : sidebarState.sections[sectionId || '']?.search?.term || ''
    
    const event = SidebarEventFactory.createSearchEvent(searchTerm, previousTerm, searchType, sectionId)
    await dispatchEvent(event)
  }, [sidebarState, dispatchEvent])

  const filterSection = useCallback(async (sectionId: string, filterId: string, filterValue: any) => {
    // This would be implemented based on specific filter requirements
    console.log('Filter section:', sectionId, filterId, filterValue)
  }, [])

  // Item operations
  const selectItem = useCallback(async (
    itemId: string,
    itemType: 'chain' | 'document' | 'agent',
    sectionId: string,
    method: 'click' | 'keyboard' | 'programmatic' = 'click'
  ) => {
    const previousSelection = sidebarState.sections[sectionId]?.selectedItemId
    const event = SidebarEventFactory.createItemSelectEvent(itemId, itemType, sectionId, method, previousSelection)
    await dispatchEvent(event)
  }, [sidebarState.sections, dispatchEvent])

  const toggleItemFavorite = useCallback(async (itemId: string, itemType: 'chain' | 'document' | 'agent') => {
    // This would need to integrate with the item data management
    console.log('Toggle favorite:', itemId, itemType)
  }, [])

  const startItemDrag = useCallback(async (
    itemId: string,
    itemType: 'chain' | 'document' | 'agent',
    sectionId: string,
    startPos: Position,
    dragData: Record<string, any>
  ) => {
    const event = SidebarEventFactory.createItemDragStartEvent(itemId, itemType, sectionId, startPos, dragData)
    await dispatchEvent(event, false) // Don't persist drag start events
  }, [dispatchEvent])

  const endItemDrag = useCallback(async (
    itemId: string,
    itemType: 'chain' | 'document' | 'agent',
    startPos: Position,
    success: boolean,
    endPos?: Position,
    dropTarget?: string,
    dropAction?: 'copy' | 'move' | 'link'
  ) => {
    const event = SidebarEventFactory.createItemDragEndEvent(
      itemId, itemType, startPos, success, endPos, dropTarget, dropAction
    )
    await dispatchEvent(event, success) // Persist successful drops immediately
  }, [dispatchEvent])

  // Data operations
  const loadSectionData = useCallback(async (sectionId: string, refresh: boolean = false) => {
    setItemsLoading(prev => ({ ...prev, [sectionId]: true }))
    setItemsError(prev => ({ ...prev, [sectionId]: null }))

    try {
      const sectionType = sectionId as 'chains' | 'documents' | 'agents'
      const searchTerm = sidebarState.sections[sectionId]?.search?.term
      
      const result = await eventService.current.loadSectionItems(sectionType, {
        search: searchTerm,
        limit: 50
      })

      // Update section data in state
      await updateSectionData(sectionId, result.items)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to load ${sectionId}`
      setItemsError(prev => ({ ...prev, [sectionId]: errorMessage }))
      console.error(`Failed to load section data for ${sectionId}:`, err)
    } finally {
      setItemsLoading(prev => ({ ...prev, [sectionId]: false }))
    }
  }, [sidebarState.sections])

  const updateSectionData = useCallback(async (sectionId: string, items: SidebarObjectItem[]) => {
    const fromState = { sections: { [sectionId]: sidebarState.sections[sectionId] } }
    const toState = {
      sections: {
        [sectionId]: {
          ...sidebarState.sections[sectionId],
          items,
          lastUpdated: new Date().toISOString()
        }
      }
    }

    const event = SidebarEventFactory.createStateUpdateEvent(fromState, toState, 'api', [sectionId])
    await dispatchEvent(event)
  }, [sidebarState.sections, dispatchEvent])

  const updateGlobalState = useCallback(async (
    stateUpdates: Partial<SidebarState>,
    source: 'user' | 'api' | 'sync' | 'restore' = 'user'
  ) => {
    const affectedSections = Object.keys(stateUpdates.sections || {})
    const event = SidebarEventFactory.createStateUpdateEvent(
      sidebarState, stateUpdates, source, affectedSections
    )
    await dispatchEvent(event, source === 'api')
  }, [sidebarState, dispatchEvent])

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
  const replayEvents = useCallback((events: SidebarEvent[]) => {
    setEventHistory(events)
    setCurrentEventIndex(events.length - 1)
  }, [])

  const clearHistory = useCallback(() => {
    setEventHistory([])
    setCurrentEventIndex(-1)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flushTimeout.current) {
        clearTimeout(flushTimeout.current)
        flushEvents()
      }
    }
  }, [flushEvents])

  return {
    // State
    sidebarState,
    sidebarLayout,
    eventHistory,
    currentEventIndex,
    isLoading,
    error,
    canUndo,
    canRedo,
    itemsLoading,
    itemsError,
    
    // Actions
    updateLayout,
    toggleCollapse,
    resizeSidebar,
    toggleSection,
    searchSection,
    filterSection,
    selectItem,
    toggleItemFavorite,
    startItemDrag,
    endItemDrag,
    loadSectionData,
    updateSectionData,
    updateGlobalState,
    undo,
    redo,
    replayEvents,
    clearHistory,
  }
}