import { z } from 'zod'

/**
 * Schema for validating node position coordinates
 */
const PositionSchema = z
  .object({
    x: z.number().describe('X coordinate of the node position'),
    y: z.number().describe('Y coordinate of the node position'),
  })
  .strict()
  .describe('Position coordinates for a node')

/**
 * Schema for validating chain nodes
 */
const NodeSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Node ID cannot be empty')
      .describe('Unique identifier for the node'),
    type: z
      .string()
      .min(1, 'Node type cannot be empty')
      .describe('Type of the node (e.g., document, agent)'),
    position: PositionSchema.optional().describe(
      'Visual position of the node on canvas'
    ),
    data: z.record(z.any()).describe('Node-specific data and configuration'),
  })
  .strict()
  .describe('A node in the processing chain')

/**
 * Schema for validating chain edges
 */
const EdgeSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Edge ID cannot be empty')
      .describe('Unique identifier for the edge'),
    source: z
      .string()
      .min(1, 'Source node ID cannot be empty')
      .describe('ID of the source node'),
    target: z
      .string()
      .min(1, 'Target node ID cannot be empty')
      .describe('ID of the target node'),
    type: z.string().optional().describe('Type of the edge connection'),
  })
  .strict()
  .describe('A connection between two nodes in the chain')

/**
 * Main schema for validating chain documents in the database
 */
export const ChainSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Chain ID cannot be empty')
      .describe('Unique identifier for the chain'),

    name: z
      .string()
      .min(1, 'Chain name cannot be empty')
      .max(255, 'Chain name cannot exceed 255 characters')
      .describe('Human-readable name for the chain'),

    nodes: z
      .array(NodeSchema)
      .describe('Array of nodes in the processing chain'),

    edges: z
      .array(EdgeSchema)
      .describe('Array of edges connecting nodes in the chain'),

    createdAt: z
      .date()
      .optional()
      .describe('Timestamp when the chain was created'),

    updatedAt: z
      .date()
      .optional()
      .describe('Timestamp when the chain was last updated'),
  })
  .strict()
  .describe('A document processing chain with nodes and connections')

/**
 * TypeScript type inferred from the ChainSchema
 */
export type Chain = z.infer<typeof ChainSchema>
