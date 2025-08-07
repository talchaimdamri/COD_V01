import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  ListVersionsQuerySchema,
  VersionParamsSchema,
  RestoreVersionRequestSchema,
  DiffParamsSchema,
  DiffQuerySchema,
  CreateVersionSnapshotRequestSchema,
  DeleteVersionParamsSchema,
  CleanupVersionsRequestSchema,
  ListVersionsResponseSchema,
  GetVersionResponseSchema,
  CreateVersionSnapshotResponseSchema,
  RestoreVersionResponseSchema,
  DiffVersionsResponseSchema,
  DeleteVersionResponseSchema,
  DocumentMetricsResponseSchema,
  CleanupVersionsResponseSchema,
  type Version,
  type DiffResult,
} from '../../schemas/api/versions'
import { ErrorResponseSchema } from '../../schemas/api/common'
import { validateRequest } from '../middleware/validation'
import { requireAuth, optionalAuth, getCurrentUserIdOptional } from '../middleware/auth'
import { documentEventSourcingService } from '../services/eventSourcing'
import { diffService } from '../services/diffService'

/**
 * Version Management API Routes
 * Provides comprehensive document version history and diff functionality
 */

export default async function versionsRoutes(fastify: FastifyInstance) {
  
  // GET /api/versions/:documentId - List document versions
  fastify.get(
    '/versions/:documentId',
    {
      preHandler: [
        optionalAuth,
        validateRequest({
          params: VersionParamsSchema.pick({ documentId: true }),
          querystring: ListVersionsQuerySchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId } = request.params as any
        const query = request.query as any

        // Get versions from service
        const versions = await documentEventSourcingService.getVersionHistory(
          documentId,
          {
            limit: query.limit,
            includeContent: query.includeContent,
          }
        )

        // Filter snapshots if requested
        const filteredVersions = query.snapshotsOnly 
          ? versions.filter(v => v.isSnapshot)
          : versions

        // Calculate pagination info
        const total = filteredVersions.length
        const totalPages = Math.ceil(total / query.limit)
        const hasNext = query.page < totalPages
        const hasPrev = query.page > 1

        // Format response
        const response = {
          data: {
            versions: filteredVersions.map(mapVersionToResponse),
            pagination: {
              page: query.page,
              limit: query.limit,
              total,
              totalPages,
              hasNext,
              hasPrev,
            },
            documentId,
            currentVersion: versions[0]?.versionNumber,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = ListVersionsResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error listing versions:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve document versions',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // GET /api/versions/:documentId/:versionId - Get specific version
  fastify.get(
    '/versions/:documentId/:versionId',
    {
      preHandler: [
        optionalAuth,
        validateRequest({
          params: VersionParamsSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId, versionId } = request.params as any

        // Get version from service
        const version = await documentEventSourcingService.getVersion(documentId, versionId!)

        if (!version) {
          const notFoundResponse = ErrorResponseSchema.parse({
            error: {
              code: 'NOT_FOUND',
              message: `Version ${versionId} not found for document ${documentId}`,
            },
          })

          return reply.status(404).send(notFoundResponse)
        }

        // Format response
        const response = {
          data: mapVersionToResponse(version),
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = GetVersionResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error retrieving version:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve version',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // POST /api/versions/:documentId/restore/:versionId - Restore to version
  fastify.post(
    '/versions/:documentId/restore/:versionId',
    {
      preHandler: [
        requireAuth,
        validateRequest({
          params: VersionParamsSchema,
          body: RestoreVersionRequestSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId, versionId } = request.params as any
        const body = request.body as any
        const userId = getCurrentUserIdOptional(request)

        // Restore to version
        const result = await documentEventSourcingService.restoreToVersion(
          documentId,
          versionId!,
          userId
        )

        // Format response
        const response = {
          data: {
            restoredVersion: mapVersionToResponse(result.restoredState as any),
            newVersion: mapVersionToResponse(result.newVersion),
            message: `Successfully restored document to version ${result.restoredState.version}`,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = RestoreVersionResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error restoring version:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to restore version',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // GET /api/versions/:documentId/diff/:fromId/:toId - Get version diff
  fastify.get(
    '/versions/:documentId/diff/:fromId/:toId',
    {
      preHandler: [
        optionalAuth,
        validateRequest({
          params: DiffParamsSchema,
          querystring: DiffQuerySchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId, fromId, toId } = request.params as any
        const query = request.query as any

        // Get both versions
        const [sourceVersion, targetVersion] = await Promise.all([
          documentEventSourcingService.getVersion(documentId, fromId),
          documentEventSourcingService.getVersion(documentId, toId),
        ])

        if (!sourceVersion || !targetVersion) {
          const notFoundResponse = ErrorResponseSchema.parse({
            error: {
              code: 'NOT_FOUND',
              message: 'One or both versions not found',
            },
          })

          return reply.status(404).send(notFoundResponse)
        }

        // Calculate diff based on type
        let diffResult: any

        switch (query.type) {
          case 'word':
            diffResult = diffService.calculateWordDiff(
              sourceVersion.content,
              targetVersion.content,
              {
                contextLines: query.contextLines,
                ignoreWhitespace: query.ignoreWhitespace,
              }
            )
            break
          case 'visual':
            const visualDiff = diffService.generateVisualDiff(
              sourceVersion.content,
              targetVersion.content,
              {
                showContext: query.contextLines,
              }
            )
            diffResult = {
              diffs: [],
              insertions: 0,
              deletions: 0,
              similarity: diffService.calculateSimilarity(sourceVersion.content, targetVersion.content),
              htmlDiff: visualDiff,
            }
            break
          default: // 'text'
            diffResult = diffService.calculateDiff(
              sourceVersion.content,
              targetVersion.content,
              {
                contextLines: query.contextLines,
                ignoreWhitespace: query.ignoreWhitespace,
              }
            )
            break
        }

        // Format diff result
        const formattedDiff: DiffResult = {
          sourceVersion: {
            id: sourceVersion.id,
            versionNumber: sourceVersion.versionNumber,
            title: sourceVersion.title,
            createdAt: sourceVersion.createdAt.toISOString(),
          },
          targetVersion: {
            id: targetVersion.id,
            versionNumber: targetVersion.versionNumber,
            title: targetVersion.title,
            createdAt: targetVersion.createdAt.toISOString(),
          },
          diff: {
            operations: diffResult.diffs.map((diff: any) => ({
              operation: diff.operation,
              text: diff.text,
            })),
            insertions: diffResult.insertions,
            deletions: diffResult.deletions,
            similarity: diffResult.similarity,
            htmlDiff: query.format === 'html' ? diffResult.htmlDiff : undefined,
          },
        }

        // Format response
        const response = {
          data: formattedDiff,
          meta: {
            timestamp: new Date().toISOString(),
            diffType: query.type,
            format: query.format,
          },
        }

        // Handle HTML format response
        if (query.format === 'html') {
          reply.header('Content-Type', 'text/html')
          return reply.send(diffResult.htmlDiff || '<p>No differences found</p>')
        }

        // Validate JSON response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = DiffVersionsResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error calculating diff:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to calculate version diff',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // POST /api/versions/:documentId/snapshot - Create version snapshot
  fastify.post(
    '/versions/:documentId/snapshot',
    {
      preHandler: [
        requireAuth,
        validateRequest({
          params: VersionParamsSchema.pick({ documentId: true }),
          body: CreateVersionSnapshotRequestSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId } = request.params as any
        const body = request.body as any
        const userId = getCurrentUserIdOptional(request)

        // Get current document state by replaying events
        const currentState = await documentEventSourcingService.replayEvents(documentId)

        // Create version snapshot
        const snapshot = await documentEventSourcingService.createVersionSnapshot(
          documentId,
          currentState,
          {
            description: body.description,
            userId,
            forceSnapshot: body.forceSnapshot,
          }
        )

        // Format response
        const response = {
          data: mapVersionToResponse(snapshot),
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = CreateVersionSnapshotResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(201).send(response)
      } catch (error) {
        fastify.log.error('Error creating version snapshot:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create version snapshot',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // DELETE /api/versions/:documentId/:versionId - Delete version
  fastify.delete(
    '/versions/:documentId/:versionId',
    {
      preHandler: [
        requireAuth,
        validateRequest({
          params: DeleteVersionParamsSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId, versionId } = request.params as any

        // Check if version exists first
        const version = await documentEventSourcingService.getVersion(documentId, versionId)
        if (!version) {
          const notFoundResponse = ErrorResponseSchema.parse({
            error: {
              code: 'NOT_FOUND',
              message: `Version ${versionId} not found for document ${documentId}`,
            },
          })

          return reply.status(404).send(notFoundResponse)
        }

        // Delete version (implement in service if needed)
        // For now, we'll return a method not implemented error
        const notImplementedResponse = ErrorResponseSchema.parse({
          error: {
            code: 'METHOD_NOT_IMPLEMENTED',
            message: 'Version deletion not yet implemented. Use cleanup endpoint instead.',
          },
        })

        reply.status(501).send(notImplementedResponse)
      } catch (error) {
        fastify.log.error('Error deleting version:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete version',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // GET /api/versions/:documentId/metrics - Get document metrics
  fastify.get(
    '/versions/:documentId/metrics',
    {
      preHandler: [
        optionalAuth,
        validateRequest({
          params: VersionParamsSchema.pick({ documentId: true }),
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId } = request.params as any

        // Get metrics from service
        const metrics = await documentEventSourcingService.getDocumentMetrics(documentId)

        // Format response
        const response = {
          data: metrics,
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = DocumentMetricsResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error retrieving document metrics:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve document metrics',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // POST /api/versions/:documentId/cleanup - Cleanup old versions
  fastify.post(
    '/versions/:documentId/cleanup',
    {
      preHandler: [
        requireAuth,
        validateRequest({
          params: VersionParamsSchema.pick({ documentId: true }),
          body: CleanupVersionsRequestSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { documentId } = request.params as any
        const body = request.body as any

        // Perform cleanup
        const deletedCount = await documentEventSourcingService.cleanupVersions(
          documentId,
          body.retentionPolicy
        )

        // Get remaining version count
        const versions = await documentEventSourcingService.getVersionHistory(documentId, { limit: 1 })
        const metrics = await documentEventSourcingService.getDocumentMetrics(documentId)

        // Format response
        const response = {
          data: {
            deletedCount,
            remainingCount: metrics.totalVersions,
            message: `Successfully deleted ${deletedCount} old versions. ${metrics.totalVersions} versions remaining.`,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response in development
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = CleanupVersionsResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error cleaning up versions:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to cleanup versions',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )
}

// Helper function to map version snapshot to API response format
function mapVersionToResponse(version: any): Version {
  return {
    id: version.id,
    documentId: version.documentId,
    versionNumber: version.versionNumber,
    title: version.title,
    content: version.content,
    description: version.description,
    wordCount: version.wordCount,
    charCount: version.charCount,
    contentHash: version.contentHash,
    isSnapshot: version.isSnapshot,
    createdBy: version.createdBy,
    createdAt: version.createdAt.toISOString(),
  }
}