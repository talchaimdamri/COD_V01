import { z } from 'zod'

/**
 * Agent schema for database entities
 * Validates agent configuration with AI model settings and tool specifications
 */
export const AgentSchema = z
  .object({
    /**
     * Unique agent identifier
     * Must be a non-empty string
     */
    id: z
      .string()
      .min(1, 'Agent ID cannot be empty')
      .describe('Unique agent identifier'),

    /**
     * Agent name
     * Must be between 1 and 255 characters
     */
    name: z
      .string()
      .min(1, 'Agent name cannot be empty')
      .max(255, 'Agent name cannot exceed 255 characters')
      .describe('Agent name'),

    /**
     * Agent prompt/instructions
     * Must be non-empty string, supports large text content up to 5000 characters
     */
    prompt: z
      .string()
      .min(1, 'Agent prompt cannot be empty')
      .max(5000, 'Agent prompt cannot exceed 5000 characters')
      .describe('Agent prompt and instructions'),

    /**
     * AI model identifier
     * Must be a non-empty string specifying which AI model to use
     */
    model: z
      .string()
      .min(1, 'Model identifier cannot be empty')
      .describe('AI model identifier'),

    /**
     * Array of tool names/identifiers
     * Each tool must be a string, array can be empty
     */
    tools: z.array(z.string()).describe('Array of tool names and identifiers'),

    /**
     * Optional agent configuration object
     * Supports nested objects, arrays, primitives, and null values
     */
    config: z
      .record(z.any())
      .optional()
      .describe('Agent configuration settings'),

    /**
     * Optional agent status
     */
    status: z.string().optional().describe('Agent status'),

    /**
     * Optional creation timestamp
     */
    createdAt: z.date().optional().describe('Agent creation timestamp'),

    /**
     * Optional last update timestamp
     */
    updatedAt: z.date().optional().describe('Agent last update timestamp'),
  })
  .strict()

/**
 * TypeScript type inferred from AgentSchema
 */
export type Agent = z.infer<typeof AgentSchema>
