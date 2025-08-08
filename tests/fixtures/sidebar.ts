/**
 * Test fixtures for Sidebar Object Library (Task 8)
 * 
 * Comprehensive test data for sidebar components, virtualization,
 * drag-and-drop, search/filter functionality, and metadata display.
 */

import { vi } from 'vitest'
import {
  ChainMetadata,
  DocumentMetadata,
  AgentMetadata,
  SidebarLayout,
  SidebarConfig,
  VirtualListConfig,
  SearchConfig,
  FilterOption,
  DragData,
  ChainItem,
  DocumentItem,
  AgentItem,
  SidebarFactory,
} from '../../schemas/api/sidebar'

// === SIDEBAR LAYOUT FIXTURES ===

export const baseSidebarLayout: SidebarLayout = {
  width: 320,
  minWidth: 200,
  maxWidth: 600,
  isCollapsed: false,
  collapsedWidth: 60,
  isResizing: false,
  persistState: true,
}

export const collapsedSidebarLayout: SidebarLayout = {
  ...baseSidebarLayout,
  isCollapsed: true,
  width: 60,
}

export const resizingSidebarLayout: SidebarLayout = {
  ...baseSidebarLayout,
  width: 450,
  isResizing: true,
}

export const minimumWidthSidebarLayout: SidebarLayout = {
  ...baseSidebarLayout,
  width: 200,
}

export const maximumWidthSidebarLayout: SidebarLayout = {
  ...baseSidebarLayout,
  width: 600,
}

// === SIDEBAR CONFIGURATION FIXTURES ===

export const baseSidebarConfig = SidebarFactory.createDefaultConfig()

export const customSidebarConfig: SidebarConfig = {
  layout: baseSidebarLayout,
  sections: [
    {
      id: 'chains',
      title: 'Chains',
      icon: 'list',
      isCollapsed: false,
      isVisible: true,
      order: 0,
      enableVirtualization: true,
      enableSearch: true,
      enableFilters: true,
    },
    {
      id: 'documents',
      title: 'Documents', 
      icon: 'file-text',
      isCollapsed: false,
      isVisible: true,
      order: 1,
      enableVirtualization: true,
      enableSearch: true,
      enableFilters: true,
    },
    {
      id: 'agents',
      title: 'Agents',
      icon: 'bot',
      isCollapsed: false,
      isVisible: true,
      order: 2,
      enableVirtualization: true,
      enableSearch: true,
      enableFilters: true,
    },
  ],
  theme: {
    headerBackgroundColor: '#f8f9fa',
    sectionBackgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    textColor: '#374151',
    accentColor: '#3b82f6',
  },
  globalSearch: {
    enabled: true,
    placeholder: 'Search all objects...',
    minSearchLength: 2,
    debounceMs: 300,
    maxResults: 100,
  },
}

// === METADATA FIXTURES ===

export const baseChainMetadata: ChainMetadata = {
  id: 'chain-test-001',
  name: 'Test Chain',
  description: 'A test chain for unit testing',
  nodeCount: 5,
  edgeCount: 4,
  status: 'draft',
  lastModified: new Date('2024-08-08T10:00:00.000Z'),
  createdAt: new Date('2024-08-01T08:00:00.000Z'),
  tags: ['test', 'draft'],
  isTemplate: false,
  badges: [
    {
      text: 'New',
      color: '#ffffff',
      backgroundColor: '#10b981',
    },
  ],
}

export const activeChainMetadata: ChainMetadata = {
  ...baseChainMetadata,
  id: 'chain-active-002',
  name: 'Active Processing Chain',
  status: 'active',
  nodeCount: 12,
  edgeCount: 15,
  badges: [
    {
      text: 'Running',
      color: '#ffffff', 
      backgroundColor: '#f59e0b',
    },
  ],
}

export const templateChainMetadata: ChainMetadata = {
  ...baseChainMetadata,
  id: 'chain-template-003',
  name: 'Document Processing Template',
  isTemplate: true,
  status: 'completed',
  badges: [
    {
      text: 'Template',
      color: '#ffffff',
      backgroundColor: '#8b5cf6',
    },
  ],
}

export const baseDocumentMetadata: DocumentMetadata = {
  id: 'doc-test-001',
  name: 'Test Document.txt',
  description: 'A test document for unit testing',
  type: 'text',
  size: 2048,
  wordCount: 350,
  status: 'draft',
  lastModified: new Date('2024-08-08T10:00:00.000Z'),
  createdAt: new Date('2024-08-01T08:00:00.000Z'),
  author: 'Test User',
  version: '1.0',
  tags: ['test', 'document'],
  isReadOnly: false,
  badges: [
    {
      text: 'Text',
      color: '#374151',
      backgroundColor: '#f3f4f6',
    },
  ],
}

export const pdfDocumentMetadata: DocumentMetadata = {
  ...baseDocumentMetadata,
  id: 'doc-pdf-002',
  name: 'Research Paper.pdf',
  type: 'pdf',
  size: 1048576, // 1MB
  pageCount: 25,
  status: 'published',
  badges: [
    {
      text: 'PDF',
      color: '#ffffff',
      backgroundColor: '#dc2626',
    },
  ],
}

export const largeDocumentMetadata: DocumentMetadata = {
  ...baseDocumentMetadata,
  id: 'doc-large-003',
  name: 'Large Dataset.csv',
  type: 'csv',
  size: 10485760, // 10MB
  wordCount: 50000,
  status: 'review',
  badges: [
    {
      text: 'Large',
      color: '#ffffff',
      backgroundColor: '#f59e0b',
    },
    {
      text: 'CSV',
      color: '#ffffff',
      backgroundColor: '#059669',
    },
  ],
}

export const baseAgentMetadata: AgentMetadata = {
  id: 'agent-test-001',
  name: 'Test Agent',
  description: 'A test agent for unit testing',
  model: 'gpt-4',
  provider: 'openai',
  capabilities: ['text-processing', 'summarization'],
  status: 'idle',
  performance: {
    successRate: 0.95,
    averageResponseTime: 2500,
    totalExecutions: 150,
  },
  lastUsed: new Date('2024-08-08T09:30:00.000Z'),
  createdAt: new Date('2024-08-01T08:00:00.000Z'),
  owner: 'Test User',
  version: '1.2',
  tags: ['test', 'gpt-4'],
  isShared: false,
  isTemplate: false,
  badges: [
    {
      text: 'GPT-4',
      color: '#ffffff',
      backgroundColor: '#3b82f6',
    },
  ],
}

export const processingAgentMetadata: AgentMetadata = {
  ...baseAgentMetadata,
  id: 'agent-processing-002',
  name: 'Document Processor',
  status: 'processing',
  capabilities: ['document-analysis', 'data-extraction', 'classification'],
  badges: [
    {
      text: 'Processing',
      color: '#ffffff',
      backgroundColor: '#f59e0b',
    },
    {
      text: 'GPT-4',
      color: '#ffffff',
      backgroundColor: '#3b82f6',
    },
  ],
}

export const templateAgentMetadata: AgentMetadata = {
  ...baseAgentMetadata,
  id: 'agent-template-003',
  name: 'Document Analysis Template',
  isTemplate: true,
  isShared: true,
  capabilities: ['nlp', 'sentiment-analysis', 'keyword-extraction'],
  badges: [
    {
      text: 'Template',
      color: '#ffffff',
      backgroundColor: '#8b5cf6',
    },
    {
      text: 'Shared',
      color: '#ffffff',
      backgroundColor: '#059669',
    },
  ],
}

// === SIDEBAR ITEM FIXTURES ===

export const baseChainItem: ChainItem = {
  type: 'chain',
  metadata: baseChainMetadata,
  isSelected: false,
  isHovered: false,
  isDragging: false,
  isVisible: true,
  highlightedFields: [],
}

export const selectedChainItem: ChainItem = {
  ...baseChainItem,
  isSelected: true,
  highlightedFields: ['name'],
}

export const baseDocumentItem: DocumentItem = {
  type: 'document',
  metadata: baseDocumentMetadata,
  isSelected: false,
  isHovered: false,
  isDragging: false,
  isVisible: true,
  highlightedFields: [],
}

export const hoveredDocumentItem: DocumentItem = {
  ...baseDocumentItem,
  isHovered: true,
}

export const draggingDocumentItem: DocumentItem = {
  ...baseDocumentItem,
  isDragging: true,
}

export const baseAgentItem: AgentItem = {
  type: 'agent',
  metadata: baseAgentMetadata,
  isSelected: false,
  isHovered: false,
  isDragging: false,
  isVisible: true,
  highlightedFields: [],
}

export const selectedAgentItem: AgentItem = {
  ...baseAgentItem,
  isSelected: true,
  highlightedFields: ['name', 'model'],
}

// === VIRTUALIZATION FIXTURES ===

export const baseVirtualListConfig: VirtualListConfig = {
  enabled: true,
  itemHeight: 60,
  overscan: 5,
  scrollOffsetThreshold: 100,
  enableSmoothScroll: true,
  enableScrollToIndex: true,
  batchSize: 50,
  maxCacheSize: 1000,
}

export const performanceVirtualListConfig: VirtualListConfig = {
  ...baseVirtualListConfig,
  itemHeight: 40,
  overscan: 10,
  batchSize: 100,
  maxCacheSize: 2000,
}

export const disabledVirtualListConfig: VirtualListConfig = {
  ...baseVirtualListConfig,
  enabled: false,
}

// === SEARCH AND FILTER FIXTURES ===

export const baseSearchConfig: SearchConfig = {
  enabled: true,
  placeholder: 'Search...',
  minLength: 2,
  debounceMs: 300,
  searchFields: ['name', 'description'],
  caseSensitive: false,
  fuzzySearch: false,
  maxResults: 100,
  highlightMatches: true,
}

export const fuzzySearchConfig: SearchConfig = {
  ...baseSearchConfig,
  fuzzySearch: true,
  searchFields: ['name', 'description', 'tags', 'author'],
}

export const statusFilterOption: FilterOption = {
  key: 'status',
  label: 'Status',
  type: 'multiselect',
  options: [
    { value: 'draft', label: 'Draft', count: 15 },
    { value: 'active', label: 'Active', count: 8 },
    { value: 'completed', label: 'Completed', count: 23 },
    { value: 'paused', label: 'Paused', count: 3 },
  ],
  defaultValue: [],
  isVisible: true,
  isRequired: false,
  order: 0,
}

export const typeFilterOption: FilterOption = {
  key: 'type',
  label: 'Type',
  type: 'select',
  options: [
    { value: 'text', label: 'Text', count: 45 },
    { value: 'pdf', label: 'PDF', count: 12 },
    { value: 'csv', label: 'CSV', count: 8 },
    { value: 'json', label: 'JSON', count: 5 },
  ],
  defaultValue: null,
  isVisible: true,
  isRequired: false,
  order: 1,
}

export const dateRangeFilterOption: FilterOption = {
  key: 'dateRange',
  label: 'Last Modified',
  type: 'daterange',
  defaultValue: null,
  isVisible: true,
  isRequired: false,
  order: 2,
}

// === DRAG AND DROP FIXTURES ===

export const baseDragData: DragData = {
  objectType: 'document',
  objectId: 'doc-test-001',
  metadata: baseDocumentMetadata,
  sourceSection: 'documents',
  canvasNodeType: 'document',
  dragStartPosition: { x: 150, y: 200 },
  dragStartTime: Date.now(),
}

export const chainDragData: DragData = {
  objectType: 'chain',
  objectId: 'chain-test-001',
  metadata: baseChainMetadata,
  sourceSection: 'chains',
  dragStartPosition: { x: 100, y: 150 },
  dragStartTime: Date.now(),
}

export const agentDragData: DragData = {
  objectType: 'agent',
  objectId: 'agent-test-001',
  metadata: baseAgentMetadata,
  sourceSection: 'agents',
  canvasNodeType: 'agent',
  dragStartPosition: { x: 200, y: 300 },
  dragStartTime: Date.now(),
  dragPreviewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
}

// === LARGE DATASET FIXTURES FOR PERFORMANCE TESTING ===

export const generateLargeChainList = (count: number = 1000): ChainItem[] =>
  Array.from({ length: count }, (_, index) => ({
    type: 'chain',
    metadata: {
      ...baseChainMetadata,
      id: `chain-perf-${index + 1}`,
      name: `Performance Test Chain ${index + 1}`,
      nodeCount: Math.floor(Math.random() * 20) + 1,
      edgeCount: Math.floor(Math.random() * 25),
      status: ['draft', 'active', 'completed', 'paused'][Math.floor(Math.random() * 4)] as any,
      tags: [`tag-${index % 10}`, `category-${index % 5}`],
    },
    isSelected: false,
    isHovered: false,
    isDragging: false,
    isVisible: true,
    highlightedFields: [],
  }))

export const generateLargeDocumentList = (count: number = 1500): DocumentItem[] =>
  Array.from({ length: count }, (_, index) => ({
    type: 'document',
    metadata: {
      ...baseDocumentMetadata,
      id: `doc-perf-${index + 1}`,
      name: `Performance Test Document ${index + 1}.${['txt', 'pdf', 'csv', 'json'][index % 4]}`,
      type: ['text', 'pdf', 'csv', 'json'][index % 4] as any,
      size: Math.floor(Math.random() * 1000000) + 1024,
      wordCount: Math.floor(Math.random() * 5000) + 100,
      status: ['draft', 'review', 'published', 'archived'][Math.floor(Math.random() * 4)] as any,
      tags: [`doc-tag-${index % 8}`, `category-${index % 3}`],
    },
    isSelected: false,
    isHovered: false,
    isDragging: false,
    isVisible: true,
    highlightedFields: [],
  }))

export const generateLargeAgentList = (count: number = 500): AgentItem[] =>
  Array.from({ length: count }, (_, index) => ({
    type: 'agent',
    metadata: {
      ...baseAgentMetadata,
      id: `agent-perf-${index + 1}`,
      name: `Performance Test Agent ${index + 1}`,
      model: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'gemini-pro'][index % 4],
      provider: ['openai', 'anthropic', 'google'][index % 3],
      status: ['idle', 'processing', 'error', 'offline'][Math.floor(Math.random() * 4)] as any,
      capabilities: [
        'text-processing',
        'summarization', 
        'translation',
        'analysis',
      ].slice(0, (index % 4) + 1),
      tags: [`agent-tag-${index % 6}`, `model-${index % 4}`],
    },
    isSelected: false,
    isHovered: false,
    isDragging: false,
    isVisible: true,
    highlightedFields: [],
  }))

// === SEARCH RESULT FIXTURES ===

export const searchResults = {
  empty: {
    searchTerm: 'nonexistent',
    chains: [],
    documents: [],
    agents: [],
    totalCount: 0,
  },
  partial: {
    searchTerm: 'test',
    chains: [baseChainItem],
    documents: [baseDocumentItem],
    agents: [baseAgentItem],
    totalCount: 3,
  },
  filtered: {
    searchTerm: 'processing',
    chains: [{ ...baseChainItem, metadata: { ...baseChainMetadata, name: 'Processing Chain' } }],
    documents: [],
    agents: [{ ...baseAgentItem, metadata: processingAgentMetadata }],
    totalCount: 2,
  },
}

// === INVALID DATA FIXTURES FOR ERROR TESTING ===

export const invalidSidebarData = {
  invalidLayout: {
    width: -100, // Invalid negative width
    minWidth: 50,  // Below minimum constraint
    maxWidth: 2000, // Above maximum constraint
    isCollapsed: 'not-boolean', // Wrong type
  },
  invalidMetadata: {
    missingId: {
      name: 'Test without ID',
      nodeCount: 5,
    },
    emptyName: {
      id: 'test-id',
      name: '', // Empty required field
      nodeCount: 5,
    },
    negativeCount: {
      id: 'test-id',
      name: 'Test',
      nodeCount: -5, // Invalid negative count
    },
  },
  invalidDragData: {
    missingObjectType: {
      objectId: 'test-id',
      metadata: baseDocumentMetadata,
    },
    invalidObjectType: {
      objectType: 'invalid-type',
      objectId: 'test-id',
      metadata: baseDocumentMetadata,
    },
  },
}

// === MOCK FUNCTIONS FOR TESTING ===

export const mockSidebarCallbacks = {
  onResize: vi.fn(),
  onCollapse: vi.fn(),
  onExpand: vi.fn(),
  onSearch: vi.fn(),
  onFilter: vi.fn(),
  onDragStart: vi.fn(),
  onDragEnd: vi.fn(),
  onDrop: vi.fn(),
  onItemSelect: vi.fn(),
  onItemHover: vi.fn(),
  onSectionCollapse: vi.fn(),
  onScrollToIndex: vi.fn(),
}

// === PERFORMANCE BENCHMARKS ===

export const performanceBenchmarks = {
  virtualListRendering: {
    smallList: { itemCount: 100, expectedRenderTime: 50 }, // 50ms
    mediumList: { itemCount: 1000, expectedRenderTime: 100 }, // 100ms
    largeList: { itemCount: 5000, expectedRenderTime: 200 }, // 200ms
  },
  searchPerformance: {
    smallDataset: { itemCount: 100, expectedSearchTime: 10 },
    mediumDataset: { itemCount: 1000, expectedSearchTime: 30 },
    largeDataset: { itemCount: 5000, expectedSearchTime: 100 },
  },
  dragDropPerformance: {
    expectedDragStartTime: 5, // 5ms to initiate drag
    expectedDropTime: 10, // 10ms to complete drop
  },
}