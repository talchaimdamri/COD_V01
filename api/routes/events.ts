import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  CreateEventRequestSchema,
  ListEventsQuerySchema,
  EventParamsSchema,
  CreateEventResponseSchema,
  ListEventsResponseSchema,
  GetEventResponseSchema,
  EventResponse,
} from '../../schemas/api/events'
import {
  ErrorResponseSchema,
  SuccessResponseSchema,
} from '../../schemas/api/common'
import { validateRequest } from '../middleware/validation'
import { requireAuth, optionalAuth, getCurrentUserIdOptional } from '../middleware/auth'
import * as eventsService from '../services/events'

/**
 * Events API routes for event sourcing operations
 * Provides REST endpoints for creating and querying events
 */

export default async function eventsRoutes(fastify: FastifyInstance) {
  // GET /api/events - List events with pagination and filtering
  fastify.get(
    '/events',
    {
      preHandler: [
        optionalAuth, // Authentication is optional for reading events
        validateRequest({
          querystring: ListEventsQuerySchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as any

        // Extract pagination parameters
        const page = query.page || 1
        const limit = query.limit || 20

        // Extract filter parameters
        const filters: eventsService.EventFilters = {}
        
        if (query.type) filters.type = query.type
        if (query.typePrefix) filters.typePrefix = query.typePrefix
        if (query.userId) filters.userId = query.userId
        if (query.fromTimestamp) filters.fromTimestamp = new Date(query.fromTimestamp)
        if (query.toTimestamp) filters.toTimestamp = new Date(query.toTimestamp)
        if (query.hasPayload !== undefined) filters.hasPayload = query.hasPayload
        if (query.payloadContains) filters.payloadContains = query.payloadContains
        if (query.aggregateId) filters.aggregateId = query.aggregateId

        // Get events from service
        const result = await eventsService.listEvents(filters, { page, limit })

        // Format response according to schema
        const response = {
          data: result.events,
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response against schema (in development)
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = ListEventsResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error listing events:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve events',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // POST /api/events - Create new event
  fastify.post(
    '/events',
    {
      preHandler: [
        requireAuth, // Authentication required for creating events
        validateRequest({
          body: CreateEventRequestSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const body = request.body as any
        const userId = getCurrentUserIdOptional(request)

        // Prepare event data
        const eventData: eventsService.CreateEventData = {
          type: body.type,
          payload: body.payload,
          timestamp: body.timestamp ? new Date(body.timestamp) : undefined,
          userId: body.userId || userId, // Use provided userId or authenticated user
        }

        // Create event via service
        const event = await eventsService.createEvent(eventData)

        // Format response according to schema
        const response = {
          data: event,
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response against schema (in development)
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = CreateEventResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(201).send(response)
      } catch (error) {
        fastify.log.error('Error creating event:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create event',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // GET /api/events/:id - Get single event
  fastify.get(
    '/events/:id',
    {
      preHandler: [
        optionalAuth, // Authentication is optional for reading events
        validateRequest({
          params: EventParamsSchema,
        }),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const params = request.params as any
        const eventId = params.id

        // Get event from service
        const event = await eventsService.getEventById(eventId)

        if (!event) {
          const notFoundResponse = ErrorResponseSchema.parse({
            error: {
              code: 'NOT_FOUND',
              message: `Event with ID ${eventId} not found`,
            },
          })

          return reply.status(404).send(notFoundResponse)
        }

        // Format response according to schema
        const response = {
          data: event,
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        // Validate response against schema (in development)
        if (process.env.NODE_ENV !== 'production') {
          const validationResult = GetEventResponseSchema.safeParse(response)
          if (!validationResult.success) {
            fastify.log.error('Response validation failed:', validationResult.error)
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error retrieving event:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve event',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )

  // Additional utility endpoints for event management

  // GET /api/events/stats - Get event statistics (optional endpoint)
  fastify.get(
    '/events/stats',
    {
      preHandler: [optionalAuth],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const stats = await eventsService.countEventsByType()
        const latest = await eventsService.getLatestEvents(5)

        const response = {
          data: {
            totalEventTypes: Object.keys(stats).length,
            eventsByType: stats,
            latestEvents: latest,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        }

        reply.status(200).send(response)
      } catch (error) {
        fastify.log.error('Error retrieving event stats:', error)
        
        const errorResponse = ErrorResponseSchema.parse({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to retrieve event statistics',
          },
        })

        reply.status(500).send(errorResponse)
      }
    }
  )
}