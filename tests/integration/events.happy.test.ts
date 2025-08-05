/**
 * Integration Tests - Events API Happy Path
 * 
 * These tests cover the successful scenarios for the Events API.
 * Following TDD methodology - tests will fail until API is implemented.
 * 
 * Test Cases:
 * - IT-EV-01a: GET /api/events - Basic event listing
 * - IT-EV-02a: POST /api/events - Basic event creation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { FastifyInstance } from 'fastify'
import {
  ListEventsResponseSchema,
  CreateEventResponseSchema,
} from '../../schemas/api/events'
import { 
  chainEvents,
} from '../fixtures/schemas'
import {
  TestDatabaseManager,
  TestServerManager,
  JWTTestHelper,
  type TestDatabaseConfig,
} from './setup'

describe('Events API - Happy Path Integration Tests', () => {
  let dbManager: TestDatabaseManager
  let serverManager: TestServerManager
  let app: FastifyInstance
  let dbConfig: TestDatabaseConfig

  beforeAll(async () => {
    try {
      dbManager = TestDatabaseManager.getInstance()
      serverManager = TestServerManager.getInstance()
      
      console.log('🚀 Starting integration test setup...')
      dbConfig = await dbManager.setup()
      app = await serverManager.start(dbConfig)
      console.log('✅ Integration test setup complete')
    } catch (error) {
      console.error('❌ Integration test setup failed:', error)
      
      // Provide helpful error message for TDD development
      if (error instanceof Error && error.message.includes('not implemented')) {
        console.log(`
🔍 TDD Development Note:
This failure is expected! The integration tests are designed to fail initially.
To make these tests pass, you need to implement:

1. Fastify server with events routes (/api/events)
2. Database connection and event models
3. JWT authentication middleware
4. Event CRUD operations

The tests provide the specification for what needs to be built.
        `)
      }
      
      throw error
    }
  })

  afterAll(async () => {
    try {
      await serverManager.stop()
      await dbManager.cleanup()
      console.log('✅ Integration test cleanup complete')
    } catch (error) {
      console.error('❌ Integration test cleanup failed:', error)
    }
  })

  beforeEach(async () => {
    await dbManager.clearEvents()
  })

  describe('IT-EV-01a: GET /api/events - Basic event listing', () => {
    it('should return empty list when no events exist', async () => {
      try {
        // Act
        const response = await request(app.server)
          .get('/api/events')
          .set('Authorization', `Bearer ${JWTTestHelper.generateValidToken()}`)
          .expect(200)

        // Assert
        expect(response.body).toMatchObject({
          data: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          meta: {
            timestamp: expect.any(String),
          },
        })

        // Validate response against schema
        const validationResult = ListEventsResponseSchema.safeParse(response.body)
        expect(validationResult.success).toBe(true)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not implemented')) {
          console.log('ℹ️  Expected failure: API endpoint not implemented yet')
        }
        throw error
      }
    })

    it('should return list of events when events exist', async () => {
      try {
        // Arrange
        await dbManager.seedEvents(chainEvents)

        // Act
        const response = await request(app.server)
          .get('/api/events')
          .set('Authorization', `Bearer ${JWTTestHelper.generateValidToken()}`)
          .expect(200)

        // Assert
        expect(response.body.data).toHaveLength(3)
        expect(response.body.pagination.total).toBe(3)
        
        // Validate first event structure
        expect(response.body.data[0]).toMatchObject({
          id: expect.any(String),
          type: expect.any(String),
          payload: expect.any(Object),
          timestamp: expect.any(String),
        })

        // Validate response against schema
        const validationResult = ListEventsResponseSchema.safeParse(response.body)
        expect(validationResult.success).toBe(true)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not implemented')) {
          console.log('ℹ️  Expected failure: API endpoint not implemented yet')
        }
        throw error
      }
    })
  })

  describe('IT-EV-02a: POST /api/events - Basic event creation', () => {
    it('should create a new event with valid data', async () => {
      try {
        // Arrange
        const newEvent = {
          type: 'TEST_EVENT_CREATE',
          payload: { message: 'Integration test event' },
          userId: 'test-user-123',
        }

        // Act
        const response = await request(app.server)
          .post('/api/events')
          .set('Authorization', `Bearer ${JWTTestHelper.generateValidToken()}`)
          .send(newEvent)
          .expect(201)

        // Assert
        expect(response.body).toMatchObject({
          data: {
            id: expect.any(String),
            type: 'TEST_EVENT_CREATE',
            payload: { message: 'Integration test event' },
            timestamp: expect.any(String),
            userId: 'test-user-123',
          },
          meta: {
            timestamp: expect.any(String),
          },
        })

        // Validate response against schema
        const validationResult = CreateEventResponseSchema.safeParse(response.body)
        expect(validationResult.success).toBe(true)

        // Ensure timestamp is valid and recent
        const eventTime = new Date(response.body.data.timestamp).getTime()
        const now = Date.now()
        expect(eventTime).toBeLessThanOrEqual(now)
        expect(eventTime).toBeGreaterThan(now - 5000) // Within last 5 seconds
      } catch (error) {
        if (error instanceof Error && error.message.includes('not implemented')) {
          console.log('ℹ️  Expected failure: API endpoint not implemented yet')
        }
        throw error
      }
    })

    it('should auto-generate timestamp when not provided', async () => {
      try {
        // Arrange
        const newEvent = {
          type: 'AUTO_TIMESTAMP_TEST',
          payload: { test: true },
        }

        // Act
        const response = await request(app.server)
          .post('/api/events')
          .set('Authorization', `Bearer ${JWTTestHelper.generateValidToken()}`)
          .send(newEvent)
          .expect(201)

        // Assert
        expect(response.body.data.timestamp).toBeDefined()
        const eventTime = new Date(response.body.data.timestamp).getTime()
        const now = Date.now()
        expect(eventTime).toBeLessThanOrEqual(now)
        expect(eventTime).toBeGreaterThan(now - 5000)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not implemented')) {
          console.log('ℹ️  Expected failure: API endpoint not implemented yet')
        }
        throw error
      }
    })
  })

  describe('Authentication Integration', () => {
    it('should reject unauthenticated requests', async () => {
      try {
        // Act & Assert
        await request(app.server)
          .get('/api/events')
          .expect(401)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not implemented')) {
          console.log('ℹ️  Expected failure: Authentication not implemented yet')
        }
        throw error
      }
    })

    it('should reject invalid JWT tokens', async () => {
      try {
        // Act & Assert
        await request(app.server)
          .get('/api/events')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401)
      } catch (error) {
        if (error instanceof Error && error.message.includes('not implemented')) {
          console.log('ℹ️  Expected failure: Authentication not implemented yet')
        }
        throw error
      }
    })
  })
})