import { z } from 'zod'
import { ChainSchema } from '../database/chain'
import {
  CommonQuerySchema,
  SuccessResponseSchema,
  PaginatedResponseSchema,
  EmptyResponseSchema,
} from './common'

/**
 * Chain API schemas for CRUD operations
 * Based on database ChainSchema with API-specific variations
 */

/**
 * Schema for creating a new chain
 * Omits id, createdAt, updatedAt (auto-generated)
 */
export const CreateChainRequestSchema = ChainSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).describe('Request schema for creating a new chain')

/**
 * Schema for updating an existing chain
 * Makes all fields optional except those that should never be updated
 */
export const UpdateChainRequestSchema = ChainSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .describe('Request schema for updating a chain')

/**
 * Schema for partial chain updates (PATCH)
 * All fields are optional for selective updates
 */
export const PatchChainRequestSchema = ChainSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .deepPartial()
  .describe('Request schema for partial chain updates')

/**
 * Chain response schema
 * Full chain data with all fields
 */
export const ChainResponseSchema = ChainSchema.describe('Chain response data')

/**
 * Query parameters for listing chains
 */
export const ListChainsQuerySchema = CommonQuerySchema.extend({
  search: z.string().optional().describe('Search chains by name'),
  hasNodes: z.coerce
    .boolean()
    .optional()
    .describe('Filter chains that have nodes'),
  hasEdges: z.coerce
    .boolean()
    .optional()
    .describe('Filter chains that have edges'),
  nodeCount: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Filter by minimum node count'),
  edgeCount: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Filter by minimum edge count'),
  createdAfter: z.coerce
    .date()
    .optional()
    .describe('Filter chains created after date'),
  createdBefore: z.coerce
    .date()
    .optional()
    .describe('Filter chains created before date'),
}).describe('Query parameters for listing chains')

/**
 * URL parameters for chain operations
 */
export const ChainParamsSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Chain ID is required')
      .describe('Chain ID from URL path'),
  })
  .describe('URL parameters for chain operations')

/**
 * Response schemas for chain endpoints
 */

// GET /chains/:id - Get single chain
export const GetChainResponseSchema = SuccessResponseSchema(
  ChainResponseSchema
).describe('Response for getting a single chain')

// GET /chains - List chains with pagination
export const ListChainsResponseSchema = PaginatedResponseSchema(
  ChainResponseSchema
).describe('Response for listing chains with pagination')

// POST /chains - Create chain
export const CreateChainResponseSchema = SuccessResponseSchema(
  ChainResponseSchema
).describe('Response for creating a chain')

// PUT /chains/:id - Update chain
export const UpdateChainResponseSchema = SuccessResponseSchema(
  ChainResponseSchema
).describe('Response for updating a chain')

// PATCH /chains/:id - Partial update chain
export const PatchChainResponseSchema = SuccessResponseSchema(
  ChainResponseSchema
).describe('Response for partially updating a chain')

// DELETE /chains/:id - Delete chain
export const DeleteChainResponseSchema = EmptyResponseSchema.describe(
  'Response for deleting a chain'
)

/**
 * Chain node-specific operations
 */

/**
 * Schema for adding a node to a chain
 */
export const AddNodeRequestSchema = z
  .object({
    type: z
      .string()
      .min(1, 'Node type is required')
      .describe('Type of node to add'),
    position: z
      .object({
        x: z.number().describe('X coordinate'),
        y: z.number().describe('Y coordinate'),
      })
      .optional()
      .describe('Initial position of the node'),
    data: z.record(z.any()).default({}).describe('Node-specific data'),
  })
  .describe('Request schema for adding a node to a chain')

/**
 * Schema for updating a node in a chain
 */
export const UpdateNodeRequestSchema = z
  .object({
    nodeId: z
      .string()
      .min(1, 'Node ID is required')
      .describe('ID of node to update'),
    type: z.string().optional().describe('Node type'),
    position: z
      .object({
        x: z.number().describe('X coordinate'),
        y: z.number().describe('Y coordinate'),
      })
      .optional()
      .describe('Node position'),
    data: z.record(z.any()).optional().describe('Node data'),
  })
  .describe('Request schema for updating a node in a chain')

/**
 * Schema for adding an edge to a chain
 */
export const AddEdgeRequestSchema = z
  .object({
    source: z
      .string()
      .min(1, 'Source node ID is required')
      .describe('Source node ID'),
    target: z
      .string()
      .min(1, 'Target node ID is required')
      .describe('Target node ID'),
    type: z.string().optional().describe('Edge type'),
  })
  .describe('Request schema for adding an edge to a chain')

/**
 * Schema for removing a node from a chain
 */
export const RemoveNodeRequestSchema = z
  .object({
    nodeId: z
      .string()
      .min(1, 'Node ID is required')
      .describe('ID of node to remove'),
  })
  .describe('Request schema for removing a node from a chain')

/**
 * Schema for removing an edge from a chain
 */
export const RemoveEdgeRequestSchema = z
  .object({
    edgeId: z
      .string()
      .min(1, 'Edge ID is required')
      .describe('ID of edge to remove'),
  })
  .describe('Request schema for removing an edge from a chain')

/**
 * TypeScript types for chain API schemas
 */
export type CreateChainRequest = z.infer<typeof CreateChainRequestSchema>
export type UpdateChainRequest = z.infer<typeof UpdateChainRequestSchema>
export type PatchChainRequest = z.infer<typeof PatchChainRequestSchema>
export type ChainResponse = z.infer<typeof ChainResponseSchema>
export type ListChainsQuery = z.infer<typeof ListChainsQuerySchema>
export type ChainParams = z.infer<typeof ChainParamsSchema>
export type AddNodeRequest = z.infer<typeof AddNodeRequestSchema>
export type UpdateNodeRequest = z.infer<typeof UpdateNodeRequestSchema>
export type AddEdgeRequest = z.infer<typeof AddEdgeRequestSchema>
export type RemoveNodeRequest = z.infer<typeof RemoveNodeRequestSchema>
export type RemoveEdgeRequest = z.infer<typeof RemoveEdgeRequestSchema>
