import { FastifyRequest, FastifyReply } from 'fastify'
import { ZodSchema, z } from 'zod'
import { ValidationErrorResponseSchema } from '../../schemas/api/common'

/**
 * Validation middleware utilities for Fastify with Zod schemas
 */

export interface ValidationSchemas {
  body?: ZodSchema
  querystring?: ZodSchema
  params?: ZodSchema
  headers?: ZodSchema
}

/**
 * Create a Fastify preHandler that validates request data against Zod schemas
 */
export function validateRequest(schemas: ValidationSchemas) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const errors: Array<{ field: string; message: string; value?: unknown }> = []

    // Validate request body
    if (schemas.body) {
      const result = schemas.body.safeParse(request.body)
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          field: `body.${err.path.join('.')}`,
          message: err.message,
          value: err.input,
        })))
      } else {
        // Replace request body with validated/transformed data
        request.body = result.data
      }
    }

    // Validate query parameters
    if (schemas.querystring) {
      const result = schemas.querystring.safeParse(request.query)
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          field: `query.${err.path.join('.')}`,
          message: err.message,
          value: err.input,
        })))
      } else {
        // Replace query with validated/transformed data
        request.query = result.data
      }
    }

    // Validate URL parameters
    if (schemas.params) {
      const result = schemas.params.safeParse(request.params)
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          field: `params.${err.path.join('.')}`,
          message: err.message,
          value: err.input,
        })))
      } else {
        // Replace params with validated/transformed data
        request.params = result.data
      }
    }

    // Validate headers
    if (schemas.headers) {
      const result = schemas.headers.safeParse(request.headers)
      if (!result.success) {
        errors.push(...result.error.errors.map(err => ({
          field: `headers.${err.path.join('.')}`,
          message: err.message,
          value: err.input,
        })))
      }
    }

    // If there are validation errors, return 400 response
    if (errors.length > 0) {
      const validationError = ValidationErrorResponseSchema.parse({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      })

      reply.status(400).send(validationError)
      return
    }
  }
}

/**
 * Validate response data against a Zod schema (for development/testing)
 * This is useful to ensure API responses match their schemas
 */
export function validateResponse<T>(schema: ZodSchema<T>) {
  return (data: unknown): T => {
    const result = schema.safeParse(data)
    
    if (!result.success) {
      // Log validation errors in development
      console.error('Response validation failed:', result.error.errors)
      throw new Error(`Response validation failed: ${result.error.message}`)
    }
    
    return result.data
  }
}

/**
 * Common validation schemas for reuse
 */
export const CommonValidationSchemas = {
  // Standard pagination parameters
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // Standard sorting parameters
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Standard ID parameter
  idParam: z.object({
    id: z.string().min(1, 'ID cannot be empty'),
  }),

  // Date range filters
  dateRange: z.object({
    fromTimestamp: z.coerce.date().optional(),
    toTimestamp: z.coerce.date().optional(),
  }),

  // Common headers
  authHeaders: z.object({
    authorization: z.string().regex(/^Bearer .+/, 'Invalid authorization header format'),
  }),
}

/**
 * Helper to create combined validation schemas
 */
export const createValidationSchema = {
  /**
   * Combine pagination and sorting for list endpoints
   */
  listQuery: (additional?: ZodSchema) => {
    const base = CommonValidationSchemas.pagination.merge(CommonValidationSchemas.sorting)
    return additional ? base.merge(additional) : base
  },

  /**
   * Combine date range with other filters
   */
  dateFilters: (additional?: ZodSchema) => {
    const base = CommonValidationSchemas.dateRange
    return additional ? base.merge(additional) : base
  },
}