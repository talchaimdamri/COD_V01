import { z } from 'zod'
import { 
  EdgeTypeSchema, 
  EdgeStyleSchema, 
  EdgeLabelSchema,
  ConnectionPointSchema,
  EdgePathSchema 
} from '../events/canvas'

/**
 * Database Edge Schema
 * 
 * Defines the structure for edge entities stored in the database.
 * Supports flexible metadata and integrates with the existing chain structure.
 */

export const EdgeEntitySchema = z.object({
  /**
   * Unique identifier for the edge
   */
  id: z.string()
    .min(1, 'Edge ID cannot be empty')
    .describe('Unique edge identifier'),

  /**
   * ID of the chain this edge belongs to
   */
  chainId: z.string()
    .min(1, 'Chain ID is required')
    .describe('Parent chain identifier'),

  /**
   * Source node connection information
   */
  sourceNodeId: z.string()
    .min(1, 'Source node ID is required')
    .describe('Source node identifier'),

  sourceAnchorId: z.string()
    .min(1, 'Source anchor ID is required')
    .describe('Source connection point identifier'),

  /**
   * Target node connection information
   */
  targetNodeId: z.string()
    .min(1, 'Target node ID is required')
    .describe('Target node identifier'),

  targetAnchorId: z.string()
    .min(1, 'Target anchor ID is required')
    .describe('Target connection point identifier'),

  /**
   * Edge type and rendering information
   */
  type: EdgeTypeSchema.describe('Edge rendering type'),

  /**
   * Visual styling configuration
   */
  style: EdgeStyleSchema.optional().describe('Edge visual styling'),

  /**
   * Optional text label
   */
  label: EdgeLabelSchema.optional().describe('Edge text label'),

  /**
   * Current edge path for rendering
   */
  path: EdgePathSchema.optional().describe('Computed edge path'),

  /**
   * Edge ordering within the chain
   */
  order: z.number()
    .int()
    .min(0)
    .describe('Display order within the chain'),

  /**
   * Flexible metadata for edge-specific data
   */
  metadata: z.record(z.any())
    .default({})
    .describe('Additional edge metadata and configuration'),

  /**
   * Timestamps
   */
  createdAt: z.date().describe('When the edge was created'),
  updatedAt: z.date().describe('When the edge was last updated'),

  /**
   * Soft delete support
   */
  deletedAt: z.date()
    .nullable()
    .default(null)
    .describe('When the edge was soft deleted'),

  /**
   * User who created the edge
   */
  createdBy: z.string()
    .optional()
    .describe('User ID who created the edge'),

  /**
   * Version for optimistic concurrency control
   */
  version: z.number()
    .int()
    .min(0)
    .default(0)
    .describe('Version number for optimistic locking'),
}).describe('Database entity for canvas edges')

/**
 * Edge creation schema (omits auto-generated fields)
 */
export const CreateEdgeSchema = EdgeEntitySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  version: true,
}).describe('Schema for creating new edges')

/**
 * Edge update schema (omits immutable fields)
 */
export const UpdateEdgeSchema = EdgeEntitySchema.partial().omit({
  id: true,
  chainId: true,
  createdAt: true,
  createdBy: true,
  version: true,
}).describe('Schema for updating existing edges')

/**
 * Edge query filters for database operations
 */
export const EdgeQueryFiltersSchema = z.object({
  chainId: z.string().optional().describe('Filter by chain ID'),
  sourceNodeId: z.string().optional().describe('Filter by source node ID'),
  targetNodeId: z.string().optional().describe('Filter by target node ID'),
  type: z.array(EdgeTypeSchema).optional().describe('Filter by edge types'),
  includeDeleted: z.boolean()
    .default(false)
    .describe('Include soft-deleted edges'),
  createdAfter: z.date().optional().describe('Filter edges created after date'),
  createdBefore: z.date().optional().describe('Filter edges created before date'),
  hasLabel: z.boolean().optional().describe('Filter edges with/without labels'),
}).describe('Query filters for edge database operations')

/**
 * Edge summary for list views (excludes heavy fields)
 */
export const EdgeSummarySchema = EdgeEntitySchema.omit({
  path: true,
  metadata: true,
}).describe('Lightweight edge summary for list views')

/**
 * Edge with related node information
 */
export const EdgeWithNodesSchema = EdgeEntitySchema.extend({
  sourceNode: z.object({
    id: z.string(),
    type: z.enum(['document', 'agent']),
    title: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }).optional().describe('Source node information'),
  
  targetNode: z.object({
    id: z.string(),
    type: z.enum(['document', 'agent']),
    title: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
  }).optional().describe('Target node information'),
}).describe('Edge with populated node references')

/**
 * Edge statistics for analytics
 */
export const EdgeStatsSchema = z.object({
  totalEdges: z.number().int().min(0).describe('Total number of edges'),
  edgesByType: z.record(z.number().int().min(0)).describe('Count by edge type'),
  edgesWithLabels: z.number().int().min(0).describe('Number of edges with labels'),
  averageEdgesPerChain: z.number().min(0).describe('Average edges per chain'),
  orphanedEdges: z.number().int().min(0).describe('Edges with missing nodes'),
}).describe('Edge usage statistics')

/**
 * TypeScript types
 */
export type EdgeEntity = z.infer<typeof EdgeEntitySchema>
export type CreateEdge = z.infer<typeof CreateEdgeSchema>
export type UpdateEdge = z.infer<typeof UpdateEdgeSchema>
export type EdgeQueryFilters = z.infer<typeof EdgeQueryFiltersSchema>
export type EdgeSummary = z.infer<typeof EdgeSummarySchema>
export type EdgeWithNodes = z.infer<typeof EdgeWithNodesSchema>
export type EdgeStats = z.infer<typeof EdgeStatsSchema>

/**
 * Edge validation utilities
 */
export const EdgeValidationUtils = {
  /**
   * Validates that an edge doesn't create a self-loop
   */
  validateNoSelfLoop: (edge: CreateEdge | UpdateEdge): boolean => {
    const sourceId = 'sourceNodeId' in edge ? edge.sourceNodeId : undefined
    const targetId = 'targetNodeId' in edge ? edge.targetNodeId : undefined
    return sourceId !== targetId
  },

  /**
   * Validates edge metadata structure
   */
  validateMetadata: (metadata: Record<string, any>): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Check for reserved keys
    const reservedKeys = ['__type', '__version', '__system']
    for (const key of reservedKeys) {
      if (key in metadata) {
        errors.push(`Reserved metadata key '${key}' is not allowed`)
      }
    }

    // Validate metadata size (approximate)
    const metadataStr = JSON.stringify(metadata)
    if (metadataStr.length > 10000) {
      errors.push('Metadata size exceeds 10KB limit')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  },

  /**
   * Validates edge connection points exist
   */
  validateConnectionPoints: (edge: CreateEdge): boolean => {
    return edge.sourceAnchorId !== undefined && edge.sourceAnchorId.length > 0 && 
           edge.targetAnchorId !== undefined && edge.targetAnchorId.length > 0 &&
           edge.sourceNodeId !== undefined && edge.sourceNodeId.length > 0 && 
           edge.targetNodeId !== undefined && edge.targetNodeId.length > 0
  },

  /**
   * Sanitizes edge metadata by removing invalid values
   */
  sanitizeMetadata: (metadata: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(metadata)) {
      // Skip reserved keys
      if (key.startsWith('__')) {
        continue
      }

      // Skip functions and undefined values
      if (typeof value === 'function' || value === undefined) {
        continue
      }

      // Try to serialize/deserialize to check validity
      try {
        JSON.parse(JSON.stringify(value))
        sanitized[key] = value
      } catch {
        // Skip invalid values that can't be serialized
        continue
      }
    }

    return sanitized
  },
}

/**
 * Default values and constants
 */
export const EDGE_DEFAULTS = {
  TYPE: 'bezier' as const,
  STYLE: {
    stroke: '#666666',
    strokeWidth: 2,
    opacity: 1,
  },
  ORDER: 0,
  METADATA: {},
} as const

/**
 * Edge entity factory
 */
export const EdgeEntityFactory = {
  /**
   * Creates a new edge entity with defaults
   */
  createEdge: (
    chainId: string,
    sourceNodeId: string,
    sourceAnchorId: string,
    targetNodeId: string,
    targetAnchorId: string,
    overrides: Partial<CreateEdge> = {}
  ): CreateEdge => {
    return CreateEdgeSchema.parse({
      chainId,
      sourceNodeId,
      sourceAnchorId,
      targetNodeId,
      targetAnchorId,
      type: EDGE_DEFAULTS.TYPE,
      style: EDGE_DEFAULTS.STYLE,
      order: EDGE_DEFAULTS.ORDER,
      metadata: EDGE_DEFAULTS.METADATA,
      ...overrides,
    })
  },

  /**
   * Creates an edge summary from a full edge entity
   */
  createSummary: (edge: EdgeEntity): EdgeSummary => {
    const { path, metadata, ...summary } = edge
    return summary
  },
}