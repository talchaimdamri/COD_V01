/**
 * Sidebar Event Schemas for Event Sourcing Integration
 * Defines events for sidebar operations to enable undo/redo functionality
 */

import { z } from 'zod'
import { BaseEventSchema, EventMetaSchema, PositionSchema } from './common'
import { SidebarLayoutSchema, SidebarStateSchema, SidebarSectionStateSchema } from '../api/sidebar'

// Sidebar Layout Events
export const SidebarLayoutChangeEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_LAYOUT_CHANGE'),
  payload: z.object({
    fromLayout: SidebarLayoutSchema,
    toLayout: SidebarLayoutSchema,
    trigger: z.enum(['user', 'resize', 'collapse', 'auto'])
  })
})

export const SidebarCollapseEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_COLLAPSE'),
  payload: z.object({
    wasCollapsed: z.boolean(),
    isCollapsed: z.boolean(),
    savedWidth: z.number(),
    trigger: z.enum(['toggle', 'keyboard', 'auto'])
  })
})

export const SidebarResizeEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_RESIZE'),
  payload: z.object({
    fromWidth: z.number(),
    toWidth: z.number(),
    startPosition: PositionSchema,
    endPosition: PositionSchema,
    resizeMethod: z.enum(['drag', 'keyboard', 'programmatic'])
  })
})

// Sidebar Section Events
export const SidebarSectionToggleEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_SECTION_TOGGLE'),
  payload: z.object({
    sectionId: z.string(),
    wasCollapsed: z.boolean(),
    isCollapsed: z.boolean(),
    sectionType: z.enum(['chains', 'documents', 'agents'])
  })
})

export const SidebarSearchEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_SEARCH'),
  payload: z.object({
    sectionId: z.string().optional(),
    searchTerm: z.string(),
    previousSearchTerm: z.string(),
    searchType: z.enum(['local', 'global']),
    resultsCount: z.number().optional()
  })
})

export const SidebarFilterEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_FILTER'),
  payload: z.object({
    sectionId: z.string(),
    filterId: z.string(),
    filterValue: z.any(),
    previousFilterValue: z.any().optional(),
    filterType: z.enum(['status', 'type', 'date', 'tag', 'custom'])
  })
})

// Item Interaction Events
export const SidebarItemSelectEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_ITEM_SELECT'),
  payload: z.object({
    itemId: z.string(),
    itemType: z.enum(['chain', 'document', 'agent']),
    sectionId: z.string(),
    previousSelection: z.string().optional(),
    selectionMethod: z.enum(['click', 'keyboard', 'programmatic'])
  })
})

export const SidebarItemFavoriteEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_ITEM_FAVORITE'),
  payload: z.object({
    itemId: z.string(),
    itemType: z.enum(['chain', 'document', 'agent']),
    isFavorite: z.boolean(),
    wasFavorite: z.boolean()
  })
})

export const SidebarItemDragStartEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_ITEM_DRAG_START'),
  payload: z.object({
    itemId: z.string(),
    itemType: z.enum(['chain', 'document', 'agent']),
    sectionId: z.string(),
    startPosition: PositionSchema,
    dragData: z.record(z.any())
  })
})

export const SidebarItemDragEndEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_ITEM_DRAG_END'),
  payload: z.object({
    itemId: z.string(),
    itemType: z.enum(['chain', 'document', 'agent']),
    startPosition: PositionSchema,
    endPosition: PositionSchema.optional(),
    dropTarget: z.string().optional(),
    dragSuccess: z.boolean(),
    dropAction: z.enum(['copy', 'move', 'link']).optional()
  })
})

// Virtual List Events (for performance)
export const SidebarVirtualScrollEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_VIRTUAL_SCROLL'),
  payload: z.object({
    sectionId: z.string(),
    scrollTop: z.number(),
    visibleRange: z.object({
      start: z.number(),
      end: z.number()
    }),
    totalItems: z.number(),
    itemHeight: z.number()
  })
})

// Global State Events
export const SidebarStateUpdateEventSchema = BaseEventSchema.extend({
  type: z.literal('SIDEBAR_STATE_UPDATE'),
  payload: z.object({
    fromState: SidebarStateSchema.partial(),
    toState: SidebarStateSchema.partial(),
    updateSource: z.enum(['user', 'api', 'sync', 'restore']),
    affectedSections: z.array(z.string())
  })
})

// Union type for all sidebar events
export const SidebarEventSchema = z.discriminatedUnion('type', [
  SidebarLayoutChangeEventSchema,
  SidebarCollapseEventSchema,
  SidebarResizeEventSchema,
  SidebarSectionToggleEventSchema,
  SidebarSearchEventSchema,
  SidebarFilterEventSchema,
  SidebarItemSelectEventSchema,
  SidebarItemFavoriteEventSchema,
  SidebarItemDragStartEventSchema,
  SidebarItemDragEndEventSchema,
  SidebarVirtualScrollEventSchema,
  SidebarStateUpdateEventSchema
])

// TypeScript types
export type SidebarEvent = z.infer<typeof SidebarEventSchema>
export type SidebarLayoutChangeEvent = z.infer<typeof SidebarLayoutChangeEventSchema>
export type SidebarCollapseEvent = z.infer<typeof SidebarCollapseEventSchema>
export type SidebarResizeEvent = z.infer<typeof SidebarResizeEventSchema>
export type SidebarSectionToggleEvent = z.infer<typeof SidebarSectionToggleEventSchema>
export type SidebarSearchEvent = z.infer<typeof SidebarSearchEventSchema>
export type SidebarFilterEvent = z.infer<typeof SidebarFilterEventSchema>
export type SidebarItemSelectEvent = z.infer<typeof SidebarItemSelectEventSchema>
export type SidebarItemFavoriteEvent = z.infer<typeof SidebarItemFavoriteEventSchema>
export type SidebarItemDragStartEvent = z.infer<typeof SidebarItemDragStartEventSchema>
export type SidebarItemDragEndEvent = z.infer<typeof SidebarItemDragEndEventSchema>
export type SidebarVirtualScrollEvent = z.infer<typeof SidebarVirtualScrollEventSchema>
export type SidebarStateUpdateEvent = z.infer<typeof SidebarStateUpdateEventSchema>

// Event factory functions
export class SidebarEventFactory {
  static createLayoutChangeEvent(
    fromLayout: z.infer<typeof SidebarLayoutSchema>,
    toLayout: z.infer<typeof SidebarLayoutSchema>,
    trigger: 'user' | 'resize' | 'collapse' | 'auto'
  ): SidebarLayoutChangeEvent {
    return {
      type: 'SIDEBAR_LAYOUT_CHANGE',
      payload: { fromLayout, toLayout, trigger },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }

  static createCollapseEvent(
    wasCollapsed: boolean,
    isCollapsed: boolean,
    savedWidth: number,
    trigger: 'toggle' | 'keyboard' | 'auto' = 'toggle'
  ): SidebarCollapseEvent {
    return {
      type: 'SIDEBAR_COLLAPSE',
      payload: { wasCollapsed, isCollapsed, savedWidth, trigger },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }

  static createResizeEvent(
    fromWidth: number,
    toWidth: number,
    startPosition: z.infer<typeof PositionSchema>,
    endPosition: z.infer<typeof PositionSchema>,
    resizeMethod: 'drag' | 'keyboard' | 'programmatic' = 'drag'
  ): SidebarResizeEvent {
    return {
      type: 'SIDEBAR_RESIZE',
      payload: { fromWidth, toWidth, startPosition, endPosition, resizeMethod },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }

  static createSectionToggleEvent(
    sectionId: string,
    wasCollapsed: boolean,
    isCollapsed: boolean,
    sectionType: 'chains' | 'documents' | 'agents'
  ): SidebarSectionToggleEvent {
    return {
      type: 'SIDEBAR_SECTION_TOGGLE',
      payload: { sectionId, wasCollapsed, isCollapsed, sectionType },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }

  static createSearchEvent(
    searchTerm: string,
    previousSearchTerm: string,
    searchType: 'local' | 'global',
    sectionId?: string,
    resultsCount?: number
  ): SidebarSearchEvent {
    return {
      type: 'SIDEBAR_SEARCH',
      payload: { sectionId, searchTerm, previousSearchTerm, searchType, resultsCount },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }

  static createItemSelectEvent(
    itemId: string,
    itemType: 'chain' | 'document' | 'agent',
    sectionId: string,
    selectionMethod: 'click' | 'keyboard' | 'programmatic' = 'click',
    previousSelection?: string
  ): SidebarItemSelectEvent {
    return {
      type: 'SIDEBAR_ITEM_SELECT',
      payload: { itemId, itemType, sectionId, previousSelection, selectionMethod },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }

  static createItemDragStartEvent(
    itemId: string,
    itemType: 'chain' | 'document' | 'agent',
    sectionId: string,
    startPosition: z.infer<typeof PositionSchema>,
    dragData: Record<string, any>
  ): SidebarItemDragStartEvent {
    return {
      type: 'SIDEBAR_ITEM_DRAG_START',
      payload: { itemId, itemType, sectionId, startPosition, dragData },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: false
      })
    }
  }

  static createItemDragEndEvent(
    itemId: string,
    itemType: 'chain' | 'document' | 'agent',
    startPosition: z.infer<typeof PositionSchema>,
    dragSuccess: boolean,
    endPosition?: z.infer<typeof PositionSchema>,
    dropTarget?: string,
    dropAction?: 'copy' | 'move' | 'link'
  ): SidebarItemDragEndEvent {
    return {
      type: 'SIDEBAR_ITEM_DRAG_END',
      payload: { itemId, itemType, startPosition, endPosition, dropTarget, dragSuccess, dropAction },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: 'ui',
        category: 'sidebar',
        reversible: false
      })
    }
  }

  static createStateUpdateEvent(
    fromState: Partial<z.infer<typeof SidebarStateSchema>>,
    toState: Partial<z.infer<typeof SidebarStateSchema>>,
    updateSource: 'user' | 'api' | 'sync' | 'restore',
    affectedSections: string[]
  ): SidebarStateUpdateEvent {
    return {
      type: 'SIDEBAR_STATE_UPDATE',
      payload: { fromState, toState, updateSource, affectedSections },
      timestamp: new Date(),
      meta: EventMetaSchema.parse({
        source: updateSource === 'api' ? 'api' : 'ui',
        category: 'sidebar',
        reversible: true
      })
    }
  }
}

// Event utility functions
export class SidebarEventUtils {
  static isLayoutEvent(event: SidebarEvent): event is SidebarLayoutChangeEvent | SidebarCollapseEvent | SidebarResizeEvent {
    return ['SIDEBAR_LAYOUT_CHANGE', 'SIDEBAR_COLLAPSE', 'SIDEBAR_RESIZE'].includes(event.type)
  }

  static isSectionEvent(event: SidebarEvent): event is SidebarSectionToggleEvent | SidebarSearchEvent | SidebarFilterEvent {
    return ['SIDEBAR_SECTION_TOGGLE', 'SIDEBAR_SEARCH', 'SIDEBAR_FILTER'].includes(event.type)
  }

  static isItemEvent(event: SidebarEvent): event is SidebarItemSelectEvent | SidebarItemFavoriteEvent | SidebarItemDragStartEvent | SidebarItemDragEndEvent {
    return ['SIDEBAR_ITEM_SELECT', 'SIDEBAR_ITEM_FAVORITE', 'SIDEBAR_ITEM_DRAG_START', 'SIDEBAR_ITEM_DRAG_END'].includes(event.type)
  }

  static isPerformanceEvent(event: SidebarEvent): event is SidebarVirtualScrollEvent {
    return event.type === 'SIDEBAR_VIRTUAL_SCROLL'
  }

  static isReversible(event: SidebarEvent): boolean {
    return event.meta?.reversible === true
  }

  static getEventPriority(event: SidebarEvent): 'high' | 'medium' | 'low' {
    if (this.isItemEvent(event)) return 'high'
    if (this.isLayoutEvent(event)) return 'medium'
    return 'low'
  }

  static shouldBatch(event: SidebarEvent): boolean {
    return this.isPerformanceEvent(event) || event.type === 'SIDEBAR_SEARCH'
  }
}