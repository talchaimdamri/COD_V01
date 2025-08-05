/**
 * Unit Tests for Events API Routes and Services
 * 
 * Tests the API logic without requiring database connections.
 * Validates schema compliance, request handling, and error responses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import fastify from 'fastify'
import {
  CreateEventRequestSchema,
  ListEventsQuerySchema,
  EventParamsSchema,
  CreateEventResponseSchema,
  ListEventsResponseSchema,
  GetEventResponseSchema,
} from '../../schemas/api/events'
import {
  baseEvent,
  minimalEvent,
  complexEvent,
} from '../fixtures/schemas'

// Mock the database client to avoid requiring a real database
vi.mock('../../api/db/client', () => ({
  prisma: {
    event: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  },
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
  checkDatabaseHealth: vi.fn().mockResolvedValue(true),
}))

// Mock events service
vi.mock('../../api/services/events', () => ({
  createEvent: vi.fn(),
  getEventById: vi.fn(),
  listEvents: vi.fn(),
  countEventsByType: vi.fn(),
  getLatestEvents: vi.fn(),
}))

describe('Events API Unit Tests', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Create fresh Fastify instance for each test
    app = fastify({ logger: false })
    
    // Register JWT plugin with test secret
    await app.register(import('@fastify/jwt'), {
      secret: 'test-jwt-secret-for-unit-tests',
    })
    
    // Register events routes
    const eventsRoutes = await import('../../api/routes/events')
    await app.register(eventsRoutes.default, { prefix: '/api' })
  })

  describe('Schema Validation', () => {
    it('should validate CreateEventRequest schema correctly', () => {
      // Valid event
      const validEvent = {
        type: 'ADD_NODE',
        payload: { nodeId: 'node-123' },
        userId: 'user-123',
      }

      const result = CreateEventRequestSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('ADD_NODE')
        expect(result.data.payload).toEqual({ nodeId: 'node-123' })
        expect(result.data.userId).toBe('user-123')
      }
    })

    it('should reject invalid event types', () => {
      const invalidEvent = {
        type: 'invalid-type-format', // Should be uppercase with underscores
        payload: { test: true },
      }

      const result = CreateEventRequestSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors).toContainEqual(
          expect.objectContaining({
            path: ['type'],
            message: expect.stringContaining('uppercase letters, numbers, and underscores'),
          })
        )
      }
    })

    it('should validate event fixtures against schema', () => {
      const fixtures = [baseEvent, minimalEvent, complexEvent]

      for (const fixture of fixtures) {
        const createRequest = {
          type: fixture.type,
          payload: fixture.payload,
          timestamp: fixture.timestamp,
          userId: fixture.userId,
        }

        const result = CreateEventRequestSchema.safeParse(createRequest)
        expect(result.success).toBe(true)
      }
    })

    it('should validate ListEventsQuery schema', () => {
      const validQuery = {
        page: '2',
        limit: '10',
        type: 'ADD_NODE',
        userId: 'user-123',
        fromTimestamp: '2024-01-01T00:00:00.000Z',
      }

      const result = ListEventsQuerySchema.safeParse(validQuery)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2) // Should be coerced to number
        expect(result.data.limit).toBe(10)
        expect(result.data.type).toBe('ADD_NODE')
        expect(result.data.fromTimestamp).toBeInstanceOf(Date)
      }
    })

    it('should validate EventParams schema', () => {
      const validParams = { id: 'event-123' }
      const result = EventParamsSchema.safeParse(validParams)
      expect(result.success).toBe(true)

      const invalidParams = { id: '' }
      const invalidResult = EventParamsSchema.safeParse(invalidParams)
      expect(invalidResult.success).toBe(false)
    })
  })

  describe('Response Schema Validation', () => {
    it('should validate CreateEventResponse schema', () => {
      const mockResponse = {
        data: {
          id: '123',
          type: 'ADD_NODE',
          payload: { nodeId: 'node-123' },
          timestamp: new Date(),
          userId: 'user-123',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = CreateEventResponseSchema.safeParse(mockResponse)
      expect(result.success).toBe(true)
    })

    it('should validate ListEventsResponse schema', () => {
      const mockResponse = {
        data: [
          {
            id: '123',
            type: 'ADD_NODE',
            payload: { nodeId: 'node-123' },
            timestamp: new Date(),
            userId: 'user-123',
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = ListEventsResponseSchema.safeParse(mockResponse)
      expect(result.success).toBe(true)
    })

    it('should validate GetEventResponse schema', () => {
      const mockResponse = {
        data: {
          id: '123',
          type: 'ADD_NODE',
          payload: { nodeId: 'node-123' },
          timestamp: new Date(),
          userId: 'user-123',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = GetEventResponseSchema.safeParse(mockResponse)
      expect(result.success).toBe(true)
    })
  })

  describe('API Route Registration', () => {
    it('should register GET /api/events route', async () => {
      const routes = app.printRoutes()
      expect(routes).toContain('api/events (GET')
    })

    it('should register POST /api/events route', async () => {
      const routes = app.printRoutes()
      expect(routes).toContain('POST')
    })

    it('should register GET /api/events/:id route', async () => {
      const routes = app.printRoutes()
      expect(routes).toContain(':id (GET')
    })

    it('should register GET /api/events/stats route', async () => {
      const routes = app.printRoutes()
      expect(routes).toContain('stats (GET')
    })
  })

  describe('Request Processing Logic', () => {
    it('should handle valid event creation request structure', async () => {
      // Mock the service to return a valid response
      const mockService = await import('../../api/services/events')
      vi.mocked(mockService.createEvent).mockResolvedValueOnce({
        id: '123',
        type: 'ADD_NODE',
        payload: { nodeId: 'node-123' },
        timestamp: new Date(),
        userId: 'user-123',
      })

      // Create a valid JWT token for authentication
      const token = app.jwt.sign({ userId: 'user-123' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'ADD_NODE',
          payload: { nodeId: 'node-123' },
        },
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.body)
      expect(body.data).toBeDefined()
      expect(body.data.type).toBe('ADD_NODE')
      expect(body.meta).toBeDefined()
      expect(body.meta.timestamp).toBeDefined()
    })

    it('should handle event listing request structure', async () => {
      // Mock the service to return a valid response
      const mockService = await import('../../api/services/events')
      vi.mocked(mockService.listEvents).mockResolvedValueOnce({
        events: [
          {
            id: '123',
            type: 'ADD_NODE',
            payload: { nodeId: 'node-123' },
            timestamp: new Date(),
            userId: 'user-123',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/events?page=1&limit=20',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeInstanceOf(Array)
      expect(body.pagination).toBeDefined()
      expect(body.pagination.page).toBe(1)
      expect(body.pagination.limit).toBe(20)
    })

    it('should handle single event retrieval', async () => {
      // Mock the service to return a valid response
      const mockService = await import('../../api/services/events')
      vi.mocked(mockService.getEventById).mockResolvedValueOnce({
        id: '123',
        type: 'ADD_NODE',
        payload: { nodeId: 'node-123' },
        timestamp: new Date(),
        userId: 'user-123',
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/events/123',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeDefined()
      expect(body.data.id).toBe('123')
    })

    it('should return 404 for non-existent event', async () => {
      // Mock the service to return null
      const mockService = await import('../../api/services/events')
      vi.mocked(mockService.getEventById).mockResolvedValueOnce(null)

      const response = await app.inject({
        method: 'GET',
        url: '/api/events/non-existent',
      })

      expect(response.statusCode).toBe(404)
      const body = JSON.parse(response.body)
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should require authentication for POST requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        payload: {
          type: 'ADD_NODE',
          payload: { nodeId: 'node-123' },
        },
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.body)
      
      // The JWT plugin returns a different format than our custom error handler
      // It should have either an error field or be a direct error response
      expect(body.code || body.error?.code).toBeDefined()
      expect(body.message || body.error?.message).toBeDefined()
    })

    it('should handle validation errors properly', async () => {
      const token = app.jwt.sign({ userId: 'user-123' })

      const response = await app.inject({
        method: 'POST',
        url: '/api/events',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          type: 'invalid-type',
          payload: { nodeId: 'node-123' },
        },
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('Event Statistics', () => {
    it('should handle stats endpoint request', async () => {
      // Mock the service methods
      const mockService = await import('../../api/services/events')
      vi.mocked(mockService.countEventsByType).mockResolvedValueOnce({
        'ADD_NODE': 5,
        'DELETE_NODE': 2,
      })
      vi.mocked(mockService.getLatestEvents).mockResolvedValueOnce([
        {
          id: '123',
          type: 'ADD_NODE',
          payload: { nodeId: 'node-123' },
          timestamp: new Date(),
          userId: 'user-123',
        },
      ])

      const response = await app.inject({
        method: 'GET',
        url: '/api/events/stats',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data).toBeDefined()
      expect(body.data.totalEventTypes).toBe(2)
      expect(body.data.eventsByType).toEqual({
        'ADD_NODE': 5,
        'DELETE_NODE': 2,
      })
      expect(body.data.latestEvents).toBeInstanceOf(Array)
    })
  })
})