import { z } from 'zod';
import { SuccessResponseSchema, PaginationSchema } from './common';
/**
 * Version Management API Schemas
 * Defines request/response schemas for document version history endpoints
 */
// Base Version Schema
export const VersionSchema = z.object({
    id: z.string().describe('Version ID'),
    documentId: z.string().describe('Document ID this version belongs to'),
    versionNumber: z.number().int().min(1).describe('Sequential version number'),
    title: z.string().describe('Document title at this version'),
    content: z.string().optional().describe('Document content (optional in list responses)'),
    description: z.string().optional().describe('Version description or commit message'),
    wordCount: z.number().int().min(0).describe('Word count at this version'),
    charCount: z.number().int().min(0).describe('Character count at this version'),
    contentHash: z.string().describe('Content hash for deduplication'),
    isSnapshot: z.boolean().describe('Whether this is a major snapshot version'),
    createdBy: z.string().optional().describe('User ID who created this version'),
    createdAt: z.string().datetime().describe('Version creation timestamp'),
});
// Version List Query Parameters
export const ListVersionsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1).describe('Page number'),
    limit: z.coerce.number().int().min(1).max(100).default(20).describe('Items per page'),
    includeContent: z.coerce.boolean().default(false).describe('Include full content in response'),
    snapshotsOnly: z.coerce.boolean().default(false).describe('Only return snapshot versions'),
});
// Version Parameters
export const VersionParamsSchema = z.object({
    documentId: z.string().min(1).describe('Document ID'),
    versionId: z.string().min(1).optional().describe('Version ID'),
    versionNumber: z.coerce.number().int().min(1).optional().describe('Version number'),
});
// Restore Version Request
export const RestoreVersionRequestSchema = z.object({
    description: z.string().max(1000).optional().describe('Description for the restore operation'),
});
// Diff Request Parameters
export const DiffParamsSchema = z.object({
    documentId: z.string().min(1).describe('Document ID'),
    fromId: z.string().min(1).describe('Source version ID'),
    toId: z.string().min(1).describe('Target version ID'),
});
// Diff Request Query Parameters
export const DiffQuerySchema = z.object({
    type: z.enum(['text', 'word', 'visual']).default('text').describe('Type of diff to generate'),
    format: z.enum(['json', 'html']).default('json').describe('Response format'),
    contextLines: z.coerce.number().int().min(0).max(50).optional().describe('Number of context lines'),
    ignoreWhitespace: z.coerce.boolean().default(false).describe('Ignore whitespace differences'),
});
// Create Version Snapshot Request
export const CreateVersionSnapshotRequestSchema = z.object({
    description: z.string().max(1000).optional().describe('Version description'),
    forceSnapshot: z.boolean().default(false).describe('Force creation even if content is duplicate'),
});
// Delete Version Request Parameters  
export const DeleteVersionParamsSchema = z.object({
    documentId: z.string().min(1).describe('Document ID'),
    versionId: z.string().min(1).describe('Version ID to delete'),
});
// Document Metrics Response
export const DocumentMetricsSchema = z.object({
    totalEvents: z.number().int().min(0).describe('Total number of events'),
    totalVersions: z.number().int().min(0).describe('Total number of versions'),
    totalSnapshots: z.number().int().min(0).describe('Total number of snapshot versions'),
    eventsByType: z.record(z.number().int().min(0)).describe('Event count by type'),
    avgTimeBetweenVersions: z.number().min(0).describe('Average time between versions in ms'),
    storageSize: z.number().int().min(0).describe('Estimated storage size in bytes'),
});
// Diff Result Response
export const DiffResultSchema = z.object({
    sourceVersion: VersionSchema.pick({ id: true, versionNumber: true, title: true, createdAt: true }),
    targetVersion: VersionSchema.pick({ id: true, versionNumber: true, title: true, createdAt: true }),
    diff: z.object({
        operations: z.array(z.object({
            operation: z.enum(['equal', 'delete', 'insert']).describe('Type of diff operation'),
            text: z.string().describe('Text content for this operation'),
        })).describe('Diff operations'),
        insertions: z.number().int().min(0).describe('Number of character insertions'),
        deletions: z.number().int().min(0).describe('Number of character deletions'),
        similarity: z.number().min(0).max(1).describe('Similarity score between versions'),
        htmlDiff: z.string().optional().describe('HTML-formatted diff (if requested)'),
    }).describe('Calculated diff between versions'),
});
// Version History Response
export const VersionHistorySchema = z.object({
    documentId: z.string().describe('Document ID'),
    currentVersion: z.number().int().min(1).describe('Current version number'),
    versions: z.array(VersionSchema).describe('List of document versions'),
    totalVersions: z.number().int().min(0).describe('Total number of versions'),
    hasMore: z.boolean().describe('Whether there are more versions available'),
});
// Response Schemas
export const ListVersionsResponseSchema = SuccessResponseSchema.extend({
    data: z.object({
        versions: z.array(VersionSchema),
        pagination: PaginationSchema,
        documentId: z.string(),
        currentVersion: z.number().int().optional(),
    }),
});
export const GetVersionResponseSchema = SuccessResponseSchema.extend({
    data: VersionSchema,
});
export const CreateVersionSnapshotResponseSchema = SuccessResponseSchema.extend({
    data: VersionSchema,
});
export const RestoreVersionResponseSchema = SuccessResponseSchema.extend({
    data: z.object({
        restoredVersion: VersionSchema,
        newVersion: VersionSchema,
        message: z.string().describe('Success message'),
    }),
});
export const DiffVersionsResponseSchema = SuccessResponseSchema.extend({
    data: DiffResultSchema,
});
export const DeleteVersionResponseSchema = SuccessResponseSchema.extend({
    data: z.object({
        deletedVersionId: z.string(),
        message: z.string(),
    }),
});
export const DocumentMetricsResponseSchema = SuccessResponseSchema.extend({
    data: DocumentMetricsSchema,
});
export const VersionHistoryResponseSchema = SuccessResponseSchema.extend({
    data: VersionHistorySchema,
});
// Cleanup Request Schema
export const CleanupVersionsRequestSchema = z.object({
    retentionPolicy: z.object({
        keepSnapshots: z.number().int().min(1).max(100).describe('Number of snapshots to keep'),
        keepRecentVersions: z.number().int().min(1).max(1000).describe('Number of recent versions to keep'),
        olderThanDays: z.number().int().min(1).max(365).optional().describe('Delete versions older than N days'),
    }).describe('Version retention policy'),
});
export const CleanupVersionsResponseSchema = SuccessResponseSchema.extend({
    data: z.object({
        deletedCount: z.number().int().min(0).describe('Number of versions deleted'),
        remainingCount: z.number().int().min(0).describe('Number of versions remaining'),
        message: z.string().describe('Cleanup summary message'),
    }),
});
