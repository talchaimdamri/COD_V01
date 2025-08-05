import { z } from 'zod'
import { AgentSchema } from '../database/agent'
import {
  CommonQuerySchema,
  SuccessResponseSchema,
  PaginatedResponseSchema,
  EmptyResponseSchema,
} from './common'

/**
 * Agent API schemas for CRUD operations
 * Based on database AgentSchema with API-specific variations
 */

/**
 * Schema for creating a new agent
 * Omits id, createdAt, updatedAt (auto-generated)
 */
export const CreateAgentRequestSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).describe('Request schema for creating a new agent')

/**
 * Schema for updating an existing agent
 * Makes all fields optional except those that should never be updated
 */
export const UpdateAgentRequestSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .describe('Request schema for updating an agent')

/**
 * Schema for partial agent updates (PATCH)
 * All fields are optional for selective updates
 */
export const PatchAgentRequestSchema = AgentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .deepPartial()
  .describe('Request schema for partial agent updates')

/**
 * Agent response schema
 * Full agent data with all fields
 */
export const AgentResponseSchema = AgentSchema.describe('Agent response data')

/**
 * Lightweight agent schema for list views
 * Excludes large prompt field for performance
 */
export const AgentSummarySchema = AgentSchema.omit({
  prompt: true,
  config: true,
})
  .extend({
    promptLength: z
      .number()
      .int()
      .min(0)
      .describe('Length of agent prompt in characters'),
    promptPreview: z
      .string()
      .max(100)
      .optional()
      .describe('First 100 characters of prompt'),
    toolCount: z
      .number()
      .int()
      .min(0)
      .describe('Number of tools configured for agent'),
    hasConfig: z.boolean().describe('Whether agent has configuration'),
  })
  .describe('Agent summary for list views')

/**
 * Query parameters for listing agents
 */
export const ListAgentsQuerySchema = CommonQuerySchema.extend({
  search: z.string().optional().describe('Search agents by name or prompt'),
  name: z.string().optional().describe('Filter by exact name match'),
  nameContains: z.string().optional().describe('Filter by partial name match'),
  model: z.string().optional().describe('Filter by AI model'),
  status: z.string().optional().describe('Filter by agent status'),
  hasTool: z
    .string()
    .optional()
    .describe('Filter agents that have specific tool'),
  toolCount: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Filter by minimum tool count'),
  hasConfig: z.coerce
    .boolean()
    .optional()
    .describe('Filter agents that have configuration'),
  createdAfter: z.coerce
    .date()
    .optional()
    .describe('Filter agents created after date'),
  createdBefore: z.coerce
    .date()
    .optional()
    .describe('Filter agents created before date'),
  summary: z.coerce
    .boolean()
    .default(true)
    .describe('Return agent summaries instead of full data'),
}).describe('Query parameters for listing agents')

/**
 * URL parameters for agent operations
 */
export const AgentParamsSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Agent ID is required')
      .describe('Agent ID from URL path'),
  })
  .describe('URL parameters for agent operations')

/**
 * Response schemas for agent endpoints
 */

// GET /agents/:id - Get single agent
export const GetAgentResponseSchema = SuccessResponseSchema(
  AgentResponseSchema
).describe('Response for getting a single agent')

// GET /agents - List agents with pagination
export const ListAgentsResponseSchema = PaginatedResponseSchema(
  AgentSummarySchema
).describe('Response for listing agents with pagination')

// GET /agents?summary=false - List full agents with pagination
export const ListFullAgentsResponseSchema = PaginatedResponseSchema(
  AgentResponseSchema
).describe('Response for listing full agents with pagination')

// POST /agents - Create agent
export const CreateAgentResponseSchema = SuccessResponseSchema(
  AgentResponseSchema
).describe('Response for creating an agent')

// PUT /agents/:id - Update agent
export const UpdateAgentResponseSchema = SuccessResponseSchema(
  AgentResponseSchema
).describe('Response for updating an agent')

// PATCH /agents/:id - Partial update agent
export const PatchAgentResponseSchema = SuccessResponseSchema(
  AgentResponseSchema
).describe('Response for partially updating an agent')

// DELETE /agents/:id - Delete agent
export const DeleteAgentResponseSchema = EmptyResponseSchema.describe(
  'Response for deleting an agent'
)

/**
 * Agent-specific operations
 */

/**
 * Schema for updating agent status
 */
export const UpdateAgentStatusRequestSchema = z
  .object({
    status: z
      .string()
      .min(1, 'Status is required')
      .describe('New agent status'),
  })
  .describe('Request schema for updating agent status')

/**
 * Schema for updating agent configuration
 */
export const UpdateAgentConfigRequestSchema = z
  .object({
    config: z.record(z.any()).describe('New agent configuration'),
  })
  .describe('Request schema for updating agent configuration')

/**
 * Schema for updating agent tools
 */
export const UpdateAgentToolsRequestSchema = z
  .object({
    tools: z.array(z.string()).describe('New list of agent tools'),
  })
  .describe('Request schema for updating agent tools')

/**
 * Schema for adding a tool to an agent
 */
export const AddAgentToolRequestSchema = z
  .object({
    tool: z
      .string()
      .min(1, 'Tool name is required')
      .describe('Tool name to add'),
  })
  .describe('Request schema for adding a tool to an agent')

/**
 * Schema for removing a tool from an agent
 */
export const RemoveAgentToolRequestSchema = z
  .object({
    tool: z
      .string()
      .min(1, 'Tool name is required')
      .describe('Tool name to remove'),
  })
  .describe('Request schema for removing a tool from an agent')

/**
 * Response for status-only update
 */
export const UpdateAgentStatusResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.string().describe('Agent ID'),
    status: z.string().describe('Updated status'),
    updatedAt: z.date().optional().describe('Update timestamp'),
  })
).describe('Response for updating agent status')

/**
 * Response for config-only update
 */
export const UpdateAgentConfigResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.string().describe('Agent ID'),
    config: z.record(z.any()).describe('Updated configuration'),
    updatedAt: z.date().optional().describe('Update timestamp'),
  })
).describe('Response for updating agent configuration')

/**
 * Response for tools-only update
 */
export const UpdateAgentToolsResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.string().describe('Agent ID'),
    tools: z.array(z.string()).describe('Updated tools list'),
    updatedAt: z.date().optional().describe('Update timestamp'),
  })
).describe('Response for updating agent tools')

/**
 * Agent validation and testing
 */

/**
 * Schema for validating agent configuration
 */
export const ValidateAgentRequestSchema = z
  .object({
    name: z.string().min(1).max(255).describe('Agent name to validate'),
    prompt: z.string().min(1).max(5000).describe('Agent prompt to validate'),
    model: z.string().min(1).describe('AI model to validate'),
    tools: z.array(z.string()).describe('Tools to validate'),
    config: z.record(z.any()).optional().describe('Configuration to validate'),
  })
  .describe('Request schema for validating agent configuration')

/**
 * Response for agent validation
 */
export const ValidateAgentResponseSchema = SuccessResponseSchema(
  z.object({
    valid: z.boolean().describe('Whether the agent configuration is valid'),
    errors: z
      .array(
        z.object({
          field: z.string().describe('Field with validation error'),
          message: z.string().describe('Validation error message'),
        })
      )
      .describe('Validation errors if any'),
    warnings: z
      .array(
        z.object({
          field: z.string().describe('Field with validation warning'),
          message: z.string().describe('Validation warning message'),
        })
      )
      .describe('Validation warnings if any'),
  })
).describe('Response for agent validation')

/**
 * Schema for testing agent functionality
 */
export const TestAgentRequestSchema = z
  .object({
    testInput: z.string().describe('Test input to send to agent'),
    timeout: z
      .number()
      .int()
      .min(1)
      .max(300)
      .default(30)
      .describe('Test timeout in seconds'),
  })
  .describe('Request schema for testing agent functionality')

/**
 * Response for agent testing
 */
export const TestAgentResponseSchema = SuccessResponseSchema(
  z.object({
    success: z.boolean().describe('Whether the test was successful'),
    output: z.string().optional().describe('Agent response output'),
    error: z.string().optional().describe('Error message if test failed'),
    duration: z.number().describe('Test duration in milliseconds'),
    tokensUsed: z.number().optional().describe('Number of tokens used in test'),
  })
).describe('Response for agent testing')

/**
 * TypeScript types for agent API schemas
 */
export type CreateAgentRequest = z.infer<typeof CreateAgentRequestSchema>
export type UpdateAgentRequest = z.infer<typeof UpdateAgentRequestSchema>
export type PatchAgentRequest = z.infer<typeof PatchAgentRequestSchema>
export type AgentResponse = z.infer<typeof AgentResponseSchema>
export type AgentSummary = z.infer<typeof AgentSummarySchema>
export type ListAgentsQuery = z.infer<typeof ListAgentsQuerySchema>
export type AgentParams = z.infer<typeof AgentParamsSchema>
export type UpdateAgentStatusRequest = z.infer<
  typeof UpdateAgentStatusRequestSchema
>
export type UpdateAgentConfigRequest = z.infer<
  typeof UpdateAgentConfigRequestSchema
>
export type UpdateAgentToolsRequest = z.infer<
  typeof UpdateAgentToolsRequestSchema
>
export type AddAgentToolRequest = z.infer<typeof AddAgentToolRequestSchema>
export type RemoveAgentToolRequest = z.infer<
  typeof RemoveAgentToolRequestSchema
>
export type ValidateAgentRequest = z.infer<typeof ValidateAgentRequestSchema>
export type TestAgentRequest = z.infer<typeof TestAgentRequestSchema>
