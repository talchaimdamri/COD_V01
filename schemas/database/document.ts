import { z } from 'zod'

/**
 * Document schema for database entities
 * Validates document structure with flexible metadata support
 */
export const DocumentSchema = z
  .object({
    /**
     * Unique document identifier
     * Must be a non-empty string
     */
    id: z
      .string()
      .min(1, 'Document ID cannot be empty')
      .describe('Unique document identifier'),

    /**
     * Document title
     * Must be between 1 and 255 characters
     */
    title: z
      .string()
      .min(1, 'Document title cannot be empty')
      .max(255, 'Document title cannot exceed 255 characters')
      .describe('Document title'),

    /**
     * Document content
     * Can be any string including empty strings and large text content
     */
    content: z
      .string()
      .describe('Document content - can be large text content'),

    /**
     * Flexible metadata object
     * Supports nested objects, arrays, primitives, and null values
     */
    metadata: z.record(z.any()).describe('Flexible metadata properties'),

    /**
     * Optional creation timestamp
     */
    createdAt: z.date().optional().describe('Document creation timestamp'),

    /**
     * Optional last update timestamp
     */
    updatedAt: z.date().optional().describe('Document last update timestamp'),
  })
  .strict()

/**
 * TypeScript type inferred from DocumentSchema
 */
export type Document = z.infer<typeof DocumentSchema>
