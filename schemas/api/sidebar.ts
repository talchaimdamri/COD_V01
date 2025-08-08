import { z } from 'zod'
import { PositionSchema, NodeTypeSchema } from '../events/canvas'

/**
 * Sidebar Object Library Schemas for Task 8
 * 
 * Comprehensive schemas for enhanced sidebar functionality including:
 * - Collapsible sidebar with resize and persistence
 * - Virtualized lists for performance optimization
 * - Sidebar sections for Chains, Documents, and Agents
 * - Drag-and-drop functionality with visual feedback
 * - Search, filtering, and rich metadata display
 */

// === SIDEBAR LAYOUT AND STATE ===

/**
 * Sidebar configuration and persistent state
 */
export const SidebarLayoutSchema = z.object({
  width: z.number()
    .min(200, 'Sidebar width cannot be less than 200px')
    .max(800, 'Sidebar width cannot exceed 800px')
    .default(300)
    .describe('Current width of the sidebar in pixels'),
  
  minWidth: z.number()
    .min(150, 'Minimum width cannot be less than 150px')
    .max(400, 'Minimum width cannot exceed 400px')  
    .default(200)
    .describe('Minimum allowed width for resizing'),
    
  maxWidth: z.number()
    .min(400, 'Maximum width cannot be less than 400px')
    .max(1200, 'Maximum width cannot exceed 1200px')
    .default(600)
    .describe('Maximum allowed width for resizing'),
    
  isCollapsed: z.boolean()
    .default(false)
    .describe('Whether the sidebar is in collapsed state'),
    
  collapsedWidth: z.number()
    .min(40, 'Collapsed width cannot be less than 40px')
    .max(80, 'Collapsed width cannot exceed 80px')
    .default(60)
    .describe('Width when sidebar is collapsed'),
    
  isResizing: z.boolean()
    .default(false)
    .describe('Whether the sidebar is currently being resized'),
    
  persistState: z.boolean()
    .default(true)
    .describe('Whether to persist sidebar state to localStorage'),
}).describe('Sidebar layout configuration and state')

/**
 * Sidebar section configuration
 */
export const SidebarSectionConfigSchema = z.object({
  id: z.string().min(1, 'Section ID is required').describe('Unique section identifier'),
  
  title: z.string().min(1, 'Section title is required').describe('Display title for the section'),
  
  icon: z.string().optional().describe('Icon name or SVG path for section header'),
  
  isCollapsed: z.boolean()
    .default(false)
    .describe('Whether this section is collapsed'),
    
  isVisible: z.boolean()
    .default(true)
    .describe('Whether this section is visible'),
    
  order: z.number()
    .int()
    .min(0)
    .default(0)
    .describe('Display order among sections (lower numbers first)'),
    
  enableVirtualization: z.boolean()
    .default(true)
    .describe('Whether to use virtual scrolling for large lists'),
    
  enableSearch: z.boolean()
    .default(true)
    .describe('Whether to show search input for this section'),
    
  enableFilters: z.boolean()
    .default(true)
    .describe('Whether to show filter controls for this section'),
}).describe('Configuration for a sidebar section')

/**
 * Complete sidebar configuration
 */
export const SidebarConfigSchema = z.object({
  layout: SidebarLayoutSchema.optional(),
  
  sections: z.array(SidebarSectionConfigSchema)
    .min(1, 'At least one section must be configured')
    .describe('Configuration for all sidebar sections'),
    
  theme: z.object({
    headerBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#f8f9fa'),
    sectionBackgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
    borderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#e5e7eb'),
    textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#374151'),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3b82f6'),
  }).optional().describe('Theme colors for sidebar components'),
  
  globalSearch: z.object({
    enabled: z.boolean().default(true),
    placeholder: z.string().default('Search...'),
    minSearchLength: z.number().int().min(1).max(10).default(2),
    debounceMs: z.number().int().min(100).max(2000).default(300),
    maxResults: z.number().int().min(10).max(1000).default(100),
  }).optional().describe('Global search configuration'),
}).describe('Complete sidebar configuration')

// === OBJECT METADATA SCHEMAS ===

/**
 * Rich metadata for chain objects
 */
export const ChainMetadataSchema = z.object({
  id: z.string().min(1, 'Chain ID is required').describe('Unique chain identifier'),
  
  name: z.string().min(1, 'Chain name is required').describe('Display name for the chain'),
  
  description: z.string().optional().describe('Brief description of the chain'),
  
  thumbnail: z.string().url().optional().describe('URL to chain thumbnail image'),
  
  nodeCount: z.number().int().min(0).describe('Number of nodes in this chain'),
  
  edgeCount: z.number().int().min(0).describe('Number of edges in this chain'),
  
  status: z.enum(['draft', 'active', 'paused', 'completed', 'error'])
    .default('draft')
    .describe('Current execution status of the chain'),
    
  lastModified: z.date().optional().describe('When the chain was last modified'),
  
  createdAt: z.date().optional().describe('When the chain was created'),
  
  tags: z.array(z.string()).default([]).describe('Array of tags for categorization'),
  
  isTemplate: z.boolean().default(false).describe('Whether this is a template chain'),
  
  badges: z.array(z.object({
    text: z.string().min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })).default([]).describe('Visual badges to display on chain items'),
}).describe('Rich metadata for chain objects in sidebar')

/**
 * Rich metadata for document objects
 */
export const DocumentMetadataSchema = z.object({
  id: z.string().min(1, 'Document ID is required').describe('Unique document identifier'),
  
  name: z.string().min(1, 'Document name is required').describe('Display name for the document'),
  
  description: z.string().optional().describe('Brief description of the document'),
  
  thumbnail: z.string().url().optional().describe('URL to document thumbnail/preview'),
  
  type: z.enum(['text', 'markdown', 'pdf', 'image', 'json', 'csv', 'other'])
    .default('text')
    .describe('Type of document for appropriate icon/handling'),
    
  size: z.number().int().min(0).optional().describe('Document size in bytes'),
  
  wordCount: z.number().int().min(0).optional().describe('Word count for text documents'),
  
  pageCount: z.number().int().min(1).optional().describe('Page count for paginated documents'),
  
  status: z.enum(['draft', 'review', 'published', 'archived'])
    .default('draft')
    .describe('Document status'),
    
  lastModified: z.date().optional().describe('When the document was last modified'),
  
  createdAt: z.date().optional().describe('When the document was created'),
  
  author: z.string().optional().describe('Document author name'),
  
  version: z.string().optional().describe('Document version identifier'),
  
  tags: z.array(z.string()).default([]).describe('Array of tags for categorization'),
  
  isReadOnly: z.boolean().default(false).describe('Whether the document is read-only'),
  
  badges: z.array(z.object({
    text: z.string().min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })).default([]).describe('Visual badges to display on document items'),
}).describe('Rich metadata for document objects in sidebar')

/**
 * Rich metadata for agent objects
 */
export const AgentMetadataSchema = z.object({
  id: z.string().min(1, 'Agent ID is required').describe('Unique agent identifier'),
  
  name: z.string().min(1, 'Agent name is required').describe('Display name for the agent'),
  
  description: z.string().optional().describe('Brief description of the agent\'s purpose'),
  
  thumbnail: z.string().url().optional().describe('URL to agent avatar/icon'),
  
  model: z.string().min(1, 'AI model is required').describe('AI model identifier (e.g., gpt-4)'),
  
  provider: z.string().optional().describe('AI provider (e.g., openai, anthropic)'),
  
  capabilities: z.array(z.string()).default([]).describe('List of agent capabilities/tools'),
  
  status: z.enum(['idle', 'processing', 'error', 'offline'])
    .default('idle')
    .describe('Current agent status'),
    
  performance: z.object({
    successRate: z.number().min(0).max(1).optional(),
    averageResponseTime: z.number().min(0).optional(),
    totalExecutions: z.number().int().min(0).optional(),
  }).optional().describe('Agent performance metrics'),
  
  lastUsed: z.date().optional().describe('When the agent was last used'),
  
  createdAt: z.date().optional().describe('When the agent was created'),
  
  owner: z.string().optional().describe('Agent owner/creator'),
  
  version: z.string().optional().describe('Agent version identifier'),
  
  tags: z.array(z.string()).default([]).describe('Array of tags for categorization'),
  
  isShared: z.boolean().default(false).describe('Whether the agent is shared with others'),
  
  isTemplate: z.boolean().default(false).describe('Whether this is a template agent'),
  
  badges: z.array(z.object({
    text: z.string().min(1),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  })).default([]).describe('Visual badges to display on agent items'),
}).describe('Rich metadata for agent objects in sidebar')

/**
 * Union of all object metadata types
 */
export const ObjectMetadataSchema = z.union([
  ChainMetadataSchema,
  DocumentMetadataSchema, 
  AgentMetadataSchema,
]).describe('Metadata for any sidebar object type')

// === VIRTUALIZATION CONFIGURATION ===

/**
 * Virtual list configuration for performance optimization
 */
export const VirtualListConfigSchema = z.object({
  enabled: z.boolean()
    .default(true)
    .describe('Whether virtualization is enabled'),
    
  itemHeight: z.number()
    .int()
    .min(20, 'Item height cannot be less than 20px')
    .max(200, 'Item height cannot exceed 200px')
    .default(60)
    .describe('Fixed height for each list item in pixels'),
    
  overscan: z.number()
    .int()
    .min(1, 'Overscan cannot be less than 1')
    .max(50, 'Overscan cannot exceed 50')
    .default(5)
    .describe('Number of items to render outside visible area'),
    
  scrollOffsetThreshold: z.number()
    .int()
    .min(50, 'Scroll offset threshold cannot be less than 50px')
    .max(500, 'Scroll offset threshold cannot exceed 500px')
    .default(100)
    .describe('Threshold for triggering scroll-based loading'),
    
  enableSmoothScroll: z.boolean()
    .default(true)
    .describe('Whether to enable smooth scrolling'),
    
  enableScrollToIndex: z.boolean()
    .default(true)
    .describe('Whether to support scrolling to specific index'),
    
  batchSize: z.number()
    .int()
    .min(10, 'Batch size cannot be less than 10')
    .max(1000, 'Batch size cannot exceed 1000')
    .default(50)
    .describe('Number of items to load in each batch'),
    
  maxCacheSize: z.number()
    .int()
    .min(100, 'Max cache size cannot be less than 100')
    .max(10000, 'Max cache size cannot exceed 10000')
    .default(1000)
    .describe('Maximum number of items to keep in cache'),
}).describe('Configuration for virtualized list rendering')

/**
 * Virtual list state management
 */
export const VirtualListStateSchema = z.object({
  scrollTop: z.number().min(0).default(0).describe('Current scroll position'),
  
  visibleRange: z.object({
    start: z.number().int().min(0).describe('First visible item index'),
    end: z.number().int().min(0).describe('Last visible item index'),
  }).describe('Currently visible item range'),
  
  totalItems: z.number().int().min(0).describe('Total number of items in list'),
  
  loadedItems: z.number().int().min(0).describe('Number of items currently loaded'),
  
  isLoading: z.boolean().default(false).describe('Whether more items are being loaded'),
  
  hasMore: z.boolean().default(true).describe('Whether there are more items to load'),
  
  cacheHitRate: z.number().min(0).max(1).optional().describe('Cache performance metric'),
}).describe('Current state of virtual list')

// === SEARCH AND FILTERING ===

/**
 * Search configuration
 */
export const SearchConfigSchema = z.object({
  enabled: z.boolean().default(true).describe('Whether search is enabled'),
  
  placeholder: z.string().default('Search...').describe('Placeholder text for search input'),
  
  minLength: z.number().int().min(1).max(10).default(2).describe('Minimum search term length'),
  
  debounceMs: z.number().int().min(100).max(2000).default(300).describe('Debounce delay in milliseconds'),
  
  searchFields: z.array(z.enum(['name', 'description', 'tags', 'author', 'content']))
    .min(1, 'At least one search field must be specified')
    .default(['name', 'description'])
    .describe('Fields to search within objects'),
    
  caseSensitive: z.boolean().default(false).describe('Whether search is case sensitive'),
  
  fuzzySearch: z.boolean().default(false).describe('Whether to enable fuzzy/approximate matching'),
  
  maxResults: z.number().int().min(10).max(1000).default(100).describe('Maximum search results to return'),
  
  highlightMatches: z.boolean().default(true).describe('Whether to highlight search term matches'),
}).describe('Search functionality configuration')

/**
 * Filter option definition
 */
export const FilterOptionSchema = z.object({
  key: z.string().min(1, 'Filter key is required').describe('Unique identifier for this filter'),
  
  label: z.string().min(1, 'Filter label is required').describe('Display label for the filter'),
  
  type: z.enum(['select', 'multiselect', 'date', 'daterange', 'number', 'boolean'])
    .describe('Type of filter control to display'),
    
  options: z.array(z.object({
    value: z.any().describe('Filter option value'),
    label: z.string().min(1, 'Option label is required').describe('Display label for option'),
    count: z.number().int().min(0).optional().describe('Number of items with this option'),
  })).optional().describe('Available options for select-type filters'),
  
  defaultValue: z.any().optional().describe('Default filter value'),
  
  isVisible: z.boolean().default(true).describe('Whether this filter is visible'),
  
  isRequired: z.boolean().default(false).describe('Whether this filter must have a value'),
  
  order: z.number().int().min(0).default(0).describe('Display order among filters'),
}).describe('Configuration for a single filter option')

/**
 * Filter state management  
 */
export const FilterStateSchema = z.object({
  searchTerm: z.string().default('').describe('Current search term'),
  
  activeFilters: z.record(z.any()).default({}).describe('Currently applied filter values'),
  
  availableFilters: z.array(FilterOptionSchema).describe('All available filter options'),
  
  isFiltering: z.boolean().default(false).describe('Whether filters are currently being applied'),
  
  resultCount: z.number().int().min(0).default(0).describe('Number of items matching current filters'),
  
  totalCount: z.number().int().min(0).default(0).describe('Total number of items before filtering'),
}).describe('Current search and filter state')

// === DRAG AND DROP ===

/**
 * Drag and drop data transfer format
 */
export const DragDataSchema = z.object({
  objectType: z.enum(['chain', 'document', 'agent'])
    .describe('Type of object being dragged'),
    
  objectId: z.string().min(1, 'Object ID is required').describe('Unique identifier of dragged object'),
  
  metadata: ObjectMetadataSchema.describe('Full metadata of dragged object'),
  
  sourceSection: z.string().min(1, 'Source section is required').describe('ID of section object was dragged from'),
  
  canvasNodeType: NodeTypeSchema.optional().describe('Node type to create on canvas drop'),
  
  dragStartPosition: PositionSchema.describe('Initial drag position relative to sidebar'),
  
  dragStartTime: z.number().int().describe('Timestamp when drag started'),
  
  dragPreviewUrl: z.string().url().optional().describe('URL for custom drag preview image'),
}).describe('Data structure for drag and drop operations')

/**
 * Drag visual feedback configuration
 */
export const DragFeedbackSchema = z.object({
  showDragPreview: z.boolean().default(true).describe('Whether to show custom drag preview'),
  
  dragPreviewScale: z.number().min(0.1).max(2.0).default(0.8).describe('Scale factor for drag preview'),
  
  dragPreviewOpacity: z.number().min(0.1).max(1.0).default(0.7).describe('Opacity for drag preview'),
  
  showDropZones: z.boolean().default(true).describe('Whether to highlight valid drop zones'),
  
  dropZoneColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3b82f6').describe('Color for drop zone highlights'),
  
  invalidDropColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ef4444').describe('Color for invalid drop zones'),
  
  dragCursor: z.enum(['grabbing', 'move', 'copy', 'not-allowed']).default('grabbing').describe('Cursor during drag'),
  
  snapDistance: z.number().int().min(5).max(50).default(20).describe('Distance for snap-to-grid or snap-to-element'),
}).describe('Visual feedback configuration for drag operations')

/**
 * Drop target configuration
 */
export const DropTargetSchema = z.object({
  canvasArea: z.boolean().default(true).describe('Whether canvas accepts drops'),
  
  sidebarSections: z.array(z.string()).default([]).describe('IDs of sidebar sections that accept drops'),
  
  acceptedTypes: z.array(z.enum(['chain', 'document', 'agent']))
    .default(['document', 'agent'])
    .describe('Object types that can be dropped on canvas'),
    
  dropBehavior: z.enum(['create_node', 'open_detail', 'add_to_selection'])
    .default('create_node')
    .describe('What happens when object is dropped'),
    
  dropPosition: z.enum(['cursor', 'center', 'auto'])
    .default('cursor')
    .describe('How to determine drop position on canvas'),
    
  preventDuplicates: z.boolean().default(true).describe('Whether to prevent duplicate nodes from same object'),
}).describe('Configuration for drop target behavior')

/**
 * Complete drag and drop configuration
 */
export const DragDropConfigSchema = z.object({
  enabled: z.boolean().default(true).describe('Whether drag and drop is enabled globally'),
  
  dataTransfer: z.object({
    useDataTransfer: z.boolean().default(true).describe('Whether to use HTML5 DataTransfer API'),
    mimeType: z.string().default('application/json').describe('MIME type for drag data'),
    includeMetadata: z.boolean().default(true).describe('Whether to include full metadata in drag data'),
  }).describe('Data transfer configuration'),
  
  feedback: DragFeedbackSchema.describe('Visual feedback configuration'),
  
  dropTarget: DropTargetSchema.describe('Drop target configuration'),
  
  performance: z.object({
    throttleMs: z.number().int().min(16).max(200).default(33).describe('Throttle drag events (ms)'),
    enableGpuAcceleration: z.boolean().default(true).describe('Use GPU acceleration for drag animations'),
    maxPreviewSize: z.number().int().min(50).max(500).default(200).describe('Max size for drag preview (px)'),
  }).describe('Performance optimization settings'),
}).describe('Complete drag and drop configuration')

// === SIDEBAR OBJECT ITEMS ===

/**
 * Common properties for all sidebar object items
 */
const BaseObjectItemSchema = z.object({
  isSelected: z.boolean().default(false).describe('Whether this item is currently selected'),
  
  isHovered: z.boolean().default(false).describe('Whether this item is being hovered'),
  
  isDragging: z.boolean().default(false).describe('Whether this item is being dragged'),
  
  isVisible: z.boolean().default(true).describe('Whether this item matches current filters'),
  
  highlightedFields: z.array(z.string()).default([]).describe('Fields with highlighted search matches'),
})

/**
 * Chain item for sidebar display
 */
export const ChainItemSchema = BaseObjectItemSchema.extend({
  type: z.literal('chain'),
  metadata: ChainMetadataSchema,
}).describe('Chain item for sidebar list display')

/**
 * Document item for sidebar display
 */
export const DocumentItemSchema = BaseObjectItemSchema.extend({
  type: z.literal('document'),
  metadata: DocumentMetadataSchema,
}).describe('Document item for sidebar list display')

/**
 * Agent item for sidebar display
 */
export const AgentItemSchema = BaseObjectItemSchema.extend({
  type: z.literal('agent'),
  metadata: AgentMetadataSchema,
}).describe('Agent item for sidebar list display')

/**
 * Union of all sidebar object item types
 */
export const SidebarObjectItemSchema = z.union([
  ChainItemSchema,
  DocumentItemSchema,
  AgentItemSchema,
]).describe('Any sidebar object item type')

// === SIDEBAR STATE MANAGEMENT ===

/**
 * Complete sidebar state
 */
export const SidebarStateSchema = z.object({
  config: SidebarConfigSchema.describe('Sidebar configuration'),
  
  layout: SidebarLayoutSchema.describe('Current layout state'),
  
  sections: z.record(z.object({
    items: z.array(SidebarObjectItemSchema).describe('Items in this section'),
    virtualList: VirtualListStateSchema.optional().describe('Virtual list state if enabled'),
    filter: FilterStateSchema.describe('Search and filter state for this section'),
    isLoading: z.boolean().default(false).describe('Whether section is loading data'),
    error: z.string().nullable().default(null).describe('Error message if section failed to load'),
  })).describe('State for each sidebar section'),
  
  dragDrop: z.object({
    isDragging: z.boolean().default(false).describe('Whether any item is being dragged'),
    dragData: DragDataSchema.nullable().default(null).describe('Data for current drag operation'),
    validDropTargets: z.array(z.string()).default([]).describe('IDs of currently valid drop targets'),
  }).describe('Current drag and drop state'),
  
  selection: z.object({
    selectedItems: z.array(z.string()).default([]).describe('IDs of currently selected items'),
    multiSelectMode: z.boolean().default(false).describe('Whether multi-selection is active'),
    lastSelectedId: z.string().nullable().default(null).describe('ID of most recently selected item'),
  }).describe('Current selection state'),
  
  performance: z.object({
    renderTime: z.number().min(0).optional().describe('Last render time in milliseconds'),
    itemCount: z.number().int().min(0).default(0).describe('Total number of items across all sections'),
    memoryUsage: z.number().min(0).optional().describe('Estimated memory usage in MB'),
  }).optional().describe('Performance metrics'),
}).describe('Complete sidebar state')

// === TYPE EXPORTS ===

export type SidebarLayout = z.infer<typeof SidebarLayoutSchema>
export type SidebarSectionConfig = z.infer<typeof SidebarSectionConfigSchema>
export type SidebarConfig = z.infer<typeof SidebarConfigSchema>
export type ChainMetadata = z.infer<typeof ChainMetadataSchema>
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>
export type ObjectMetadata = z.infer<typeof ObjectMetadataSchema>
export type VirtualListConfig = z.infer<typeof VirtualListConfigSchema>
export type VirtualListState = z.infer<typeof VirtualListStateSchema>
export type SearchConfig = z.infer<typeof SearchConfigSchema>
export type FilterOption = z.infer<typeof FilterOptionSchema>
export type FilterState = z.infer<typeof FilterStateSchema>
export type DragData = z.infer<typeof DragDataSchema>
export type DragFeedback = z.infer<typeof DragFeedbackSchema>
export type DropTarget = z.infer<typeof DropTargetSchema>
export type DragDropConfig = z.infer<typeof DragDropConfigSchema>
export type ChainItem = z.infer<typeof ChainItemSchema>
export type DocumentItem = z.infer<typeof DocumentItemSchema>
export type AgentItem = z.infer<typeof AgentItemSchema>
export type SidebarObjectItem = z.infer<typeof SidebarObjectItemSchema>
export type SidebarState = z.infer<typeof SidebarStateSchema>

// === FACTORY FUNCTIONS ===

/**
 * Factory functions for creating well-formed sidebar objects
 */
export const SidebarFactory = {
  /**
   * Creates default sidebar configuration
   */
  createDefaultConfig: (): SidebarConfig => {
    return SidebarConfigSchema.parse({
      layout: {
        width: 300,
        isCollapsed: false,
      },
      sections: [
        {
          id: 'chains',
          title: 'Chains',
          icon: 'list',
          order: 0,
        },
        {
          id: 'documents', 
          title: 'Documents',
          icon: 'file-text',
          order: 1,
        },
        {
          id: 'agents',
          title: 'Agents', 
          icon: 'bot',
          order: 2,
        },
      ],
    })
  },

  /**
   * Creates default virtual list configuration
   */
  createVirtualListConfig: (overrides: Partial<VirtualListConfig> = {}): VirtualListConfig => {
    return VirtualListConfigSchema.parse({
      enabled: true,
      itemHeight: 60,
      overscan: 5,
      batchSize: 50,
      ...overrides,
    })
  },

  /**
   * Creates default search configuration
   */
  createSearchConfig: (overrides: Partial<SearchConfig> = {}): SearchConfig => {
    return SearchConfigSchema.parse({
      enabled: true,
      placeholder: 'Search...',
      searchFields: ['name', 'description'],
      ...overrides,
    })
  },

  /**
   * Creates default drag drop configuration
   */
  createDragDropConfig: (overrides: Partial<DragDropConfig> = {}): DragDropConfig => {
    return DragDropConfigSchema.parse({
      enabled: true,
      dataTransfer: {
        useDataTransfer: true,
        mimeType: 'application/json',
      },
      feedback: {},
      dropTarget: {},
      performance: {},
      ...overrides,
    })
  },

  /**
   * Creates chain metadata with defaults
   */
  createChainMetadata: (overrides: Partial<ChainMetadata> = {}): ChainMetadata => {
    return ChainMetadataSchema.parse({
      id: `chain-${Date.now()}`,
      name: 'New Chain',
      nodeCount: 0,
      edgeCount: 0,
      status: 'draft',
      ...overrides,
    })
  },

  /**
   * Creates document metadata with defaults
   */
  createDocumentMetadata: (overrides: Partial<DocumentMetadata> = {}): DocumentMetadata => {
    return DocumentMetadataSchema.parse({
      id: `doc-${Date.now()}`,
      name: 'New Document',
      type: 'text',
      status: 'draft',
      ...overrides,
    })
  },

  /**
   * Creates agent metadata with defaults
   */
  createAgentMetadata: (overrides: Partial<AgentMetadata> = {}): AgentMetadata => {
    return AgentMetadataSchema.parse({
      id: `agent-${Date.now()}`,
      name: 'New Agent',
      model: 'gpt-4',
      status: 'idle',
      ...overrides,
    })
  },
}

/**
 * Validation utilities for sidebar schemas
 */
export const SidebarValidation = {
  /**
   * Validates sidebar configuration and returns detailed error information
   */
  validateConfig: (config: unknown): { valid: boolean; errors: string[]; warnings: string[] } => {
    const result = SidebarConfigSchema.safeParse(config)
    
    if (result.success) {
      const warnings: string[] = []
      
      // Check for potential performance issues
      const totalSections = result.data.sections.length
      if (totalSections > 10) {
        warnings.push(`Large number of sections (${totalSections}) may impact performance`)
      }
      
      // Check for duplicate section IDs
      const sectionIds = result.data.sections.map(s => s.id)
      const duplicateIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index)
      if (duplicateIds.length > 0) {
        warnings.push(`Duplicate section IDs found: ${duplicateIds.join(', ')}`)
      }

      return {
        valid: true,
        errors: [],
        warnings,
      }
    }

    const errors = result.error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    )

    return {
      valid: false,
      errors,
      warnings: [],
    }
  },

  /**
   * Type guard to check if object is valid drag data
   */
  isDragData: (data: unknown): data is DragData => {
    return DragDataSchema.safeParse(data).success
  },

  /**
   * Type guard to check if object is valid sidebar object item
   */
  isSidebarObjectItem: (item: unknown): item is SidebarObjectItem => {
    return SidebarObjectItemSchema.safeParse(item).success
  },

  /**
   * Validates virtual list configuration for performance
   */
  validateVirtualListPerformance: (config: VirtualListConfig, itemCount: number): string[] => {
    const warnings: string[] = []
    
    if (itemCount > 1000 && !config.enabled) {
      warnings.push('Consider enabling virtualization for large item counts (1000+)')
    }
    
    if (config.itemHeight < 40 && itemCount > 500) {
      warnings.push('Small item heights with large lists may cause performance issues')
    }
    
    if (config.batchSize > itemCount / 2) {
      warnings.push('Batch size is large relative to total items - consider reducing')
    }
    
    return warnings
  },
}