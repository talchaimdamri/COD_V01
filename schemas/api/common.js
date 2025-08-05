import { z } from 'zod';
/**
 * Common API response and error schemas
 * Used across all API endpoints for consistent response format
 */
/**
 * Standard HTTP error response schema
 */
export const ErrorResponseSchema = z
    .object({
    error: z
        .object({
        code: z.string().describe('Error code identifier'),
        message: z.string().describe('Human-readable error message'),
        details: z.any().optional().describe('Additional error details'),
    })
        .describe('Error information'),
})
    .strict()
    .describe('Standard error response format');
/**
 * Success response wrapper for single items
 */
export const SuccessResponseSchema = (dataSchema) => z
    .object({
    data: dataSchema.describe('Response data'),
    meta: z
        .object({
        timestamp: z.string().datetime().describe('Response timestamp'),
    })
        .optional()
        .describe('Response metadata'),
})
    .strict()
    .describe('Success response wrapper');
/**
 * Pagination metadata schema
 */
export const PaginationMetaSchema = z
    .object({
    page: z.number().int().min(1).describe('Current page number'),
    limit: z.number().int().min(1).max(100).describe('Items per page'),
    total: z.number().int().min(0).describe('Total number of items'),
    totalPages: z.number().int().min(0).describe('Total number of pages'),
    hasNext: z.boolean().describe('Whether there are more pages'),
    hasPrev: z.boolean().describe('Whether there are previous pages'),
})
    .strict()
    .describe('Pagination metadata');
/**
 * Paginated response wrapper
 */
export const PaginatedResponseSchema = (itemSchema) => z
    .object({
    data: z.array(itemSchema).describe('Array of items'),
    pagination: PaginationMetaSchema.describe('Pagination information'),
    meta: z
        .object({
        timestamp: z.string().datetime().describe('Response timestamp'),
    })
        .optional()
        .describe('Response metadata'),
})
    .strict()
    .describe('Paginated response wrapper');
/**
 * Query parameters for pagination
 */
export const PaginationQuerySchema = z
    .object({
    page: z.coerce.number().int().min(1).default(1).describe('Page number'),
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe('Items per page'),
})
    .describe('Pagination query parameters');
/**
 * Query parameters for sorting
 */
export const SortQuerySchema = z
    .object({
    sortBy: z.string().optional().describe('Field to sort by'),
    sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
})
    .describe('Sort query parameters');
/**
 * Common query parameters combining pagination and sorting
 */
export const CommonQuerySchema = PaginationQuerySchema.merge(SortQuerySchema).describe('Common query parameters for list endpoints');
/**
 * Empty response schema for successful operations with no data
 */
export const EmptyResponseSchema = z
    .object({
    meta: z
        .object({
        timestamp: z.string().datetime().describe('Response timestamp'),
        message: z.string().optional().describe('Success message'),
    })
        .describe('Response metadata'),
})
    .strict()
    .describe('Empty success response');
/**
 * Validation error details schema
 */
export const ValidationErrorSchema = z
    .object({
    field: z.string().describe('Field that failed validation'),
    message: z.string().describe('Validation error message'),
    value: z.any().optional().describe('Invalid value that was provided'),
})
    .strict()
    .describe('Validation error details');
/**
 * Validation error response schema
 */
export const ValidationErrorResponseSchema = z
    .object({
    error: z
        .object({
        code: z.literal('VALIDATION_ERROR').describe('Error code'),
        message: z.string().describe('General validation error message'),
        details: z
            .array(ValidationErrorSchema)
            .describe('Array of validation errors'),
    })
        .describe('Validation error information'),
})
    .strict()
    .describe('Validation error response');
