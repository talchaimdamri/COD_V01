/**
 * Sidebar API Routes
 * Provides endpoints for fetching and managing sidebar object data (chains, documents, agents)
 */
import { FastifyInstance } from 'fastify'
import { validateRequest } from '../middleware/validation'
import { 
  SidebarObjectItem,
  ChainMetadata,
  DocumentMetadata,
  AgentMetadata,
  SidebarObjectItemSchema,
  ChainMetadataSchema,
  DocumentMetadataSchema,
  AgentMetadataSchema,
  SidebarFactory
} from '../../schemas/api/sidebar'
import { 
  ApiResponseSchema, 
  PaginationRequestSchema, 
  PaginationResponse,
  SearchRequestSchema 
} from '../../schemas/api/common'

// Mock data for development - replace with database queries
const MOCK_CHAINS: SidebarObjectItem[] = [
  {
    id: 'chain-1',
    type: 'chain',
    title: 'Content Analysis Pipeline',
    description: 'Automated content analysis and summarization workflow',
    metadata: {
      nodeCount: 5,
      status: 'active',
      lastRun: new Date('2024-01-15T10:30:00Z').toISOString(),
      runCount: 42,
      successRate: 0.95,
      badges: ['high-performance', 'automated'],
      tags: ['analysis', 'nlp', 'automation'],
      thumbnail: '/api/thumbnails/chain-1.svg'
    },
    createdAt: new Date('2024-01-10T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T10:30:00Z').toISOString(),
    isFavorite: true,
    lastAccessed: new Date('2024-01-15T10:30:00Z').toISOString()
  },
  {
    id: 'chain-2', 
    type: 'chain',
    title: 'Research Workflow',
    description: 'Multi-step research and document generation process',
    metadata: {
      nodeCount: 8,
      status: 'draft',
      lastRun: new Date('2024-01-12T14:20:00Z').toISOString(),
      runCount: 15,
      successRate: 0.87,
      badges: ['research', 'experimental'],
      tags: ['research', 'documentation'],
      thumbnail: '/api/thumbnails/chain-2.svg'
    },
    createdAt: new Date('2024-01-08T11:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-12T14:20:00Z').toISOString(),
    isFavorite: false,
    lastAccessed: new Date('2024-01-14T16:45:00Z').toISOString()
  },
  {
    id: 'chain-3',
    type: 'chain', 
    title: 'Data Processing Chain',
    description: 'ETL pipeline for large dataset processing',
    metadata: {
      nodeCount: 12,
      status: 'paused',
      lastRun: new Date('2024-01-10T08:15:00Z').toISOString(),
      runCount: 128,
      successRate: 0.92,
      badges: ['high-volume', 'reliable'],
      tags: ['etl', 'data-processing', 'batch'],
      thumbnail: '/api/thumbnails/chain-3.svg'
    },
    createdAt: new Date('2024-01-01T12:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-10T08:15:00Z').toISOString(),
    isFavorite: false,
    lastAccessed: new Date('2024-01-13T09:22:00Z').toISOString()
  }
]

const MOCK_DOCUMENTS: SidebarObjectItem[] = [
  {
    id: 'doc-1',
    type: 'document',
    title: 'Product Requirements Document',
    description: 'Comprehensive PRD for the new feature release',
    metadata: {
      type: 'markdown',
      size: 15420,
      version: '2.1.0',
      status: 'published',
      wordCount: 2850,
      readingTime: 12,
      lastEditor: 'john.doe',
      collaborators: ['jane.smith', 'bob.wilson'],
      badges: ['final', 'approved'],
      tags: ['requirements', 'product', 'specification'],
      thumbnail: '/api/thumbnails/doc-1.svg'
    },
    createdAt: new Date('2024-01-05T14:30:00Z').toISOString(),
    updatedAt: new Date('2024-01-14T16:45:00Z').toISOString(),
    isFavorite: true,
    lastAccessed: new Date('2024-01-15T11:20:00Z').toISOString()
  },
  {
    id: 'doc-2',
    type: 'document',
    title: 'API Documentation',
    description: 'Technical documentation for REST API endpoints',
    metadata: {
      type: 'html', 
      size: 45600,
      version: '1.5.2',
      status: 'draft',
      wordCount: 8250,
      readingTime: 33,
      lastEditor: 'alice.johnson',
      collaborators: ['dev.team'],
      badges: ['technical', 'in-progress'],
      tags: ['documentation', 'api', 'technical'],
      thumbnail: '/api/thumbnails/doc-2.svg'
    },
    createdAt: new Date('2024-01-03T10:15:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T09:30:00Z').toISOString(),
    isFavorite: false,
    lastAccessed: new Date('2024-01-15T09:30:00Z').toISOString()
  },
  {
    id: 'doc-3',
    type: 'document',
    title: 'User Research Report',
    description: 'Q4 user research findings and recommendations',
    metadata: {
      type: 'pdf',
      size: 2850000,
      version: '1.0.0',
      status: 'archived',
      wordCount: 5600,
      readingTime: 22,
      lastEditor: 'research.team',
      collaborators: ['ux.team', 'product.manager'],
      badges: ['research', 'archived'],
      tags: ['research', 'user-experience', 'insights'],
      thumbnail: '/api/thumbnails/doc-3.svg'
    },
    createdAt: new Date('2023-12-20T13:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-02T15:45:00Z').toISOString(),
    isFavorite: false,
    lastAccessed: new Date('2024-01-12T14:10:00Z').toISOString()
  }
]

const MOCK_AGENTS: SidebarObjectItem[] = [
  {
    id: 'agent-1',
    type: 'agent',
    title: 'Content Analyzer',
    description: 'Advanced text analysis and sentiment detection agent',
    metadata: {
      model: 'gpt-4-turbo',
      provider: 'openai',
      status: 'active',
      version: '2.1.0',
      capabilities: ['text-analysis', 'sentiment', 'summarization', 'classification'],
      performance: {
        avgResponseTime: 2.3,
        successRate: 0.96,
        totalRuns: 1547
      },
      cost: {
        totalTokens: 2850000,
        estimatedCost: 42.75
      },
      badges: ['high-performance', 'production'],
      tags: ['nlp', 'analysis', 'ai'],
      thumbnail: '/api/thumbnails/agent-1.svg'
    },
    createdAt: new Date('2024-01-01T09:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-14T11:30:00Z').toISOString(),
    isFavorite: true,
    lastAccessed: new Date('2024-01-15T10:45:00Z').toISOString()
  },
  {
    id: 'agent-2',
    type: 'agent',
    title: 'Research Assistant',
    description: 'Intelligent research and information gathering agent',
    metadata: {
      model: 'claude-3-sonnet',
      provider: 'anthropic',
      status: 'idle',
      version: '1.8.5',
      capabilities: ['research', 'web-search', 'fact-checking', 'citation'],
      performance: {
        avgResponseTime: 4.1,
        successRate: 0.89,
        totalRuns: 286
      },
      cost: {
        totalTokens: 850000,
        estimatedCost: 15.30
      },
      badges: ['research', 'reliable'],
      tags: ['research', 'web-search', 'ai'],
      thumbnail: '/api/thumbnails/agent-2.svg'
    },
    createdAt: new Date('2024-01-08T15:30:00Z').toISOString(),
    updatedAt: new Date('2024-01-13T14:20:00Z').toISOString(),
    isFavorite: false,
    lastAccessed: new Date('2024-01-13T14:20:00Z').toISOString()
  },
  {
    id: 'agent-3',
    type: 'agent',
    title: 'Code Reviewer',
    description: 'Automated code review and quality assessment agent',
    metadata: {
      model: 'gpt-4-1106-preview',
      provider: 'openai', 
      status: 'maintenance',
      version: '3.0.1',
      capabilities: ['code-review', 'security-scan', 'quality-metrics', 'suggestions'],
      performance: {
        avgResponseTime: 8.7,
        successRate: 0.92,
        totalRuns: 95
      },
      cost: {
        totalTokens: 650000,
        estimatedCost: 19.50
      },
      badges: ['security', 'beta'],
      tags: ['code-review', 'security', 'quality'],
      thumbnail: '/api/thumbnails/agent-3.svg'
    },
    createdAt: new Date('2024-01-12T16:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-15T08:45:00Z').toISOString(),
    isFavorite: false,
    lastAccessed: new Date('2024-01-14T13:15:00Z').toISOString()
  }
]

// Helper functions
function filterItems(items: SidebarObjectItem[], search?: string): SidebarObjectItem[] {
  if (!search) return items
  
  const searchLower = search.toLowerCase()
  return items.filter(item => 
    item.title.toLowerCase().includes(searchLower) ||
    item.description.toLowerCase().includes(searchLower) ||
    (item.metadata as any).tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
  )
}

function paginateItems<T>(items: T[], page: number = 1, limit: number = 20): { items: T[], pagination: PaginationResponse } {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)
  
  return {
    items: paginatedItems,
    pagination: {
      page,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / limit),
      hasNext: page * limit < items.length,
      hasPrev: page > 1
    }
  }
}

export default async function sidebarRoutes(fastify: FastifyInstance) {
  
  // GET /api/sidebar/chains
  fastify.get('/sidebar/chains', {
    schema: {
      querystring: PaginationRequestSchema.merge(SearchRequestSchema),
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema.array(),
          pagination: PaginationRequestSchema.optional()
        })
      }
    }
  }, async (request) => {
    const { page, limit, search } = request.query as any
    
    const filteredChains = filterItems(MOCK_CHAINS, search)
    const { items, pagination } = paginateItems(filteredChains, page, limit)
    
    return {
      data: items,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        total: filteredChains.length,
        filtered: Boolean(search)
      }
    }
  })
  
  // GET /api/sidebar/documents  
  fastify.get('/sidebar/documents', {
    schema: {
      querystring: PaginationRequestSchema.merge(SearchRequestSchema),
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema.array(),
          pagination: PaginationRequestSchema.optional()
        })
      }
    }
  }, async (request) => {
    const { page, limit, search } = request.query as any
    
    const filteredDocs = filterItems(MOCK_DOCUMENTS, search)
    const { items, pagination } = paginateItems(filteredDocs, page, limit)
    
    return {
      data: items,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        total: filteredDocs.length,
        filtered: Boolean(search)
      }
    }
  })
  
  // GET /api/sidebar/agents
  fastify.get('/sidebar/agents', {
    schema: {
      querystring: PaginationRequestSchema.merge(SearchRequestSchema),
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema.array(),
          pagination: PaginationRequestSchema.optional()
        })
      }
    }
  }, async (request) => {
    const { page, limit, search } = request.query as any
    
    const filteredAgents = filterItems(MOCK_AGENTS, search)
    const { items, pagination } = paginateItems(filteredAgents, page, limit)
    
    return {
      data: items,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        total: filteredAgents.length,
        filtered: Boolean(search)
      }
    }
  })
  
  // GET /api/sidebar/items/:id - Get specific item by ID
  fastify.get<{ Params: { id: string } }>('/sidebar/items/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema
        }),
        404: ApiResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    
    const allItems = [...MOCK_CHAINS, ...MOCK_DOCUMENTS, ...MOCK_AGENTS]
    const item = allItems.find(item => item.id === id)
    
    if (!item) {
      reply.status(404)
      return {
        error: {
          code: 'NOT_FOUND',
          message: `Sidebar item with ID '${id}' not found`
        }
      }
    }
    
    return {
      data: item,
      meta: {
        timestamp: new Date().toISOString()
      }
    }
  })
  
  // POST /api/sidebar/items - Create new sidebar item (chains only for now)
  fastify.post('/sidebar/items', {
    schema: {
      body: SidebarObjectItemSchema.omit({ 
        id: true, 
        createdAt: true, 
        updatedAt: true, 
        lastAccessed: true 
      }),
      response: {
        201: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema
        }),
        400: ApiResponseSchema
      }
    }
  }, async (request, reply) => {
    const itemData = request.body as any
    
    if (itemData.type !== 'chain') {
      reply.status(400)
      return {
        error: {
          code: 'INVALID_ITEM_TYPE',
          message: 'Only chain creation is currently supported'
        }
      }
    }
    
    const newItem: SidebarObjectItem = {
      ...itemData,
      id: `chain-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      isFavorite: false
    }
    
    // In a real app, save to database
    MOCK_CHAINS.push(newItem)
    
    reply.status(201)
    return {
      data: newItem,
      meta: {
        timestamp: new Date().toISOString(),
        created: true
      }
    }
  })
  
  // PUT /api/sidebar/items/:id - Update sidebar item
  fastify.put<{ Params: { id: string } }>('/sidebar/items/:id', {
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: SidebarObjectItemSchema.partial().omit({ 
        id: true, 
        createdAt: true, 
        updatedAt: true 
      }),
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema
        }),
        404: ApiResponseSchema
      }
    }
  }, async (request, reply) => {
    const { id } = request.params
    const updates = request.body as any
    
    let targetCollection: SidebarObjectItem[]
    if (id.startsWith('chain-')) targetCollection = MOCK_CHAINS
    else if (id.startsWith('doc-')) targetCollection = MOCK_DOCUMENTS  
    else if (id.startsWith('agent-')) targetCollection = MOCK_AGENTS
    else {
      reply.status(404)
      return {
        error: {
          code: 'NOT_FOUND',
          message: `Sidebar item with ID '${id}' not found`
        }
      }
    }
    
    const itemIndex = targetCollection.findIndex(item => item.id === id)
    if (itemIndex === -1) {
      reply.status(404)
      return {
        error: {
          code: 'NOT_FOUND',
          message: `Sidebar item with ID '${id}' not found`
        }
      }
    }
    
    const updatedItem: SidebarObjectItem = {
      ...targetCollection[itemIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }
    
    targetCollection[itemIndex] = updatedItem
    
    return {
      data: updatedItem,
      meta: {
        timestamp: new Date().toISOString(),
        updated: true
      }
    }
  })
  
  // GET /api/sidebar/favorites - Get favorite items
  fastify.get('/sidebar/favorites', {
    schema: {
      querystring: PaginationRequestSchema,
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema.array(),
          pagination: PaginationRequestSchema.optional()
        })
      }
    }
  }, async (request) => {
    const { page, limit } = request.query as any
    
    const allItems = [...MOCK_CHAINS, ...MOCK_DOCUMENTS, ...MOCK_AGENTS]
    const favorites = allItems.filter(item => item.isFavorite)
    
    const { items, pagination } = paginateItems(favorites, page, limit)
    
    return {
      data: items,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        total: favorites.length
      }
    }
  })
  
  // GET /api/sidebar/recent - Get recently accessed items
  fastify.get('/sidebar/recent', {
    schema: {
      querystring: PaginationRequestSchema,
      response: {
        200: ApiResponseSchema.extend({
          data: SidebarObjectItemSchema.array(),
          pagination: PaginationRequestSchema.optional()
        })
      }
    }
  }, async (request) => {
    const { page, limit } = request.query as any
    
    const allItems = [...MOCK_CHAINS, ...MOCK_DOCUMENTS, ...MOCK_AGENTS]
    const recentItems = allItems
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    
    const { items, pagination } = paginateItems(recentItems, page, limit)
    
    return {
      data: items,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        total: recentItems.length,
        sortedBy: 'lastAccessed'
      }
    }
  })
}