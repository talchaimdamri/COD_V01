import { z } from 'zod'
import { DocumentSchema } from '../database/document'
import {
  CommonQuerySchema,
  SuccessResponseSchema,
  PaginatedResponseSchema,
  EmptyResponseSchema,
} from './common'

/**
 * Document API schemas for CRUD operations
 * Based on database DocumentSchema with API-specific variations
 */

/**
 * Schema for creating a new document
 * Omits id, createdAt, updatedAt (auto-generated)
 */
export const CreateDocumentRequestSchema = DocumentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).describe('Request schema for creating a new document')

/**
 * Schema for updating an existing document
 * Makes all fields optional except those that should never be updated
 */
export const UpdateDocumentRequestSchema = DocumentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .partial()
  .describe('Request schema for updating a document')

/**
 * Schema for partial document updates (PATCH)
 * All fields are optional for selective updates
 */
export const PatchDocumentRequestSchema = DocumentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
  .deepPartial()
  .describe('Request schema for partial document updates')

/**
 * Document response schema
 * Full document data with all fields
 */
export const DocumentResponseSchema = DocumentSchema.describe(
  'Document response data'
)

/**
 * Lightweight document schema for list views
 * Excludes large content field for performance
 */
export const DocumentSummarySchema = DocumentSchema.omit({
  content: true,
})
  .extend({
    contentLength: z
      .number()
      .int()
      .min(0)
      .describe('Length of document content in characters'),
    contentPreview: z
      .string()
      .max(200)
      .optional()
      .describe('First 200 characters of content'),
  })
  .describe('Document summary for list views')

/**
 * Query parameters for listing documents
 */
export const ListDocumentsQuerySchema = CommonQuerySchema.extend({
  search: z
    .string()
    .optional()
    .describe('Search documents by title or content'),
  title: z.string().optional().describe('Filter by exact title match'),
  titleContains: z
    .string()
    .optional()
    .describe('Filter by partial title match'),
  hasContent: z.coerce
    .boolean()
    .optional()
    .describe('Filter documents that have content'),
  contentLength: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Filter by minimum content length'),
  metadataKey: z
    .string()
    .optional()
    .describe('Filter documents that have specific metadata key'),
  metadataValue: z
    .string()
    .optional()
    .describe('Filter by metadata key-value pair (requires metadataKey)'),
  createdAfter: z.coerce
    .date()
    .optional()
    .describe('Filter documents created after date'),
  createdBefore: z.coerce
    .date()
    .optional()
    .describe('Filter documents created before date'),
  summary: z.coerce
    .boolean()
    .default(true)
    .describe('Return document summaries instead of full content'),
}).describe('Query parameters for listing documents')

/**
 * URL parameters for document operations
 */
export const DocumentParamsSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Document ID is required')
      .describe('Document ID from URL path'),
  })
  .describe('URL parameters for document operations')

/**
 * Response schemas for document endpoints
 */

// GET /documents/:id - Get single document
export const GetDocumentResponseSchema = SuccessResponseSchema(
  DocumentResponseSchema
).describe('Response for getting a single document')

// GET /documents - List documents with pagination
export const ListDocumentsResponseSchema = PaginatedResponseSchema(
  DocumentSummarySchema
).describe('Response for listing documents with pagination')

// GET /documents?summary=false - List full documents with pagination
export const ListFullDocumentsResponseSchema = PaginatedResponseSchema(
  DocumentResponseSchema
).describe('Response for listing full documents with pagination')

// POST /documents - Create document
export const CreateDocumentResponseSchema = SuccessResponseSchema(
  DocumentResponseSchema
).describe('Response for creating a document')

// PUT /documents/:id - Update document
export const UpdateDocumentResponseSchema = SuccessResponseSchema(
  DocumentResponseSchema
).describe('Response for updating a document')

// PATCH /documents/:id - Partial update document
export const PatchDocumentResponseSchema = SuccessResponseSchema(
  DocumentResponseSchema
).describe('Response for partially updating a document')

// DELETE /documents/:id - Delete document
export const DeleteDocumentResponseSchema = EmptyResponseSchema.describe(
  'Response for deleting a document'
)

/**
 * Document content-specific operations
 */

/**
 * Schema for updating only document content
 */
export const UpdateContentRequestSchema = z
  .object({
    content: z.string().describe('New document content'),
  })
  .describe('Request schema for updating document content only')

/**
 * Schema for updating only document metadata
 */
export const UpdateMetadataRequestSchema = z
  .object({
    metadata: z.record(z.any()).describe('New document metadata'),
  })
  .describe('Request schema for updating document metadata only')

/**
 * Response for content-only update
 */
export const UpdateContentResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.string().describe('Document ID'),
    content: z.string().describe('Updated content'),
    updatedAt: z.date().optional().describe('Update timestamp'),
  })
).describe('Response for updating document content')

/**
 * Response for metadata-only update
 */
export const UpdateMetadataResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.string().describe('Document ID'),
    metadata: z.record(z.any()).describe('Updated metadata'),
    updatedAt: z.date().optional().describe('Update timestamp'),
  })
).describe('Response for updating document metadata')

/**
 * Document search and filtering
 */

/**
 * Advanced search request schema
 */
export const SearchDocumentsRequestSchema = z
  .object({
    query: z
      .string()
      .min(1, 'Search query is required')
      .describe('Search query string'),
    fields: z
      .array(z.enum(['title', 'content', 'metadata']))
      .default(['title', 'content'])
      .describe('Fields to search in'),
    filters: z
      .object({
        createdAfter: z.coerce
          .date()
          .optional()
          .describe('Filter by creation date'),
        createdBefore: z.coerce
          .date()
          .optional()
          .describe('Filter by creation date'),
        hasMetadataKey: z
          .string()
          .optional()
          .describe('Filter by metadata key existence'),
        metadataFilters: z
          .record(z.any())
          .optional()
          .describe('Key-value metadata filters'),
      })
      .optional()
      .describe('Additional search filters'),
    highlight: z
      .boolean()
      .default(false)
      .describe('Include search term highlighting'),
  })
  .describe('Advanced document search request')

/**
 * Search results schema with highlighting
 */
export const SearchResultSchema = DocumentSummarySchema.extend({
  highlights: z
    .object({
      title: z
        .array(z.string())
        .optional()
        .describe('Highlighted title matches'),
      content: z
        .array(z.string())
        .optional()
        .describe('Highlighted content matches'),
    })
    .optional()
    .describe('Search term highlights'),
}).describe('Document search result with highlights')

/**
 * Response for document search
 */
export const SearchDocumentsResponseSchema = PaginatedResponseSchema(
  SearchResultSchema
).describe('Response for document search with pagination')

/**
 * TypeScript types for document API schemas
 */
export type CreateDocumentRequest = z.infer<typeof CreateDocumentRequestSchema>
export type UpdateDocumentRequest = z.infer<typeof UpdateDocumentRequestSchema>
export type PatchDocumentRequest = z.infer<typeof PatchDocumentRequestSchema>
export type DocumentResponse = z.infer<typeof DocumentResponseSchema>
export type DocumentSummary = z.infer<typeof DocumentSummarySchema>
export type ListDocumentsQuery = z.infer<typeof ListDocumentsQuerySchema>
export type DocumentParams = z.infer<typeof DocumentParamsSchema>
export type UpdateContentRequest = z.infer<typeof UpdateContentRequestSchema>
export type UpdateMetadataRequest = z.infer<typeof UpdateMetadataRequestSchema>
export type SearchDocumentsRequest = z.infer<
  typeof SearchDocumentsRequestSchema
>
export type SearchResult = z.infer<typeof SearchResultSchema>
