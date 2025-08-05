/**
 * Integration Tests - Events API Schema Validation
 * 
 * These tests verify that our Zod schemas work correctly for integration scenarios.
 * They can pass without a running server, demonstrating schema-driven development.
 * 
 * Test Cases:
 * - IT-SC-01: Request/Response schema validation
 * - IT-SC-02: API contract compliance
 * - IT-SC-03: Type inference validation
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  CreateEventRequestSchema,
  EventResponseSchema,
  ListEventsQuerySchema,
  ListEventsResponseSchema,
  CreateEventResponseSchema,
  GetEventResponseSchema,
  ValidateEventRequestSchema,
  ValidateEventResponseSchema,
} from '../../schemas/api/events'
import {
  ErrorResponseSchema,
  ValidationErrorResponseSchema,
} from '../../schemas/api/common'
import { 
  baseEvent, 
  createEventRequest,
  chainEvents,
  nodeEvents,
} from '../fixtures/schemas'

describe('Events API Schema Integration Tests', () => {
  
  describe('IT-SC-01: Request/Response schema validation', () => {
    it('should validate CreateEventRequest schema with fixture data', () => {
      // Test with createEventRequest fixture
      const result = CreateEventRequestSchema.safeParse(createEventRequest)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('CREATE_CHAIN')
        expect(result.data.payload).toEqual({
          chainId: 'chain-new',
          name: 'New Chain', 
          description: 'Test chain creation',
        })
        expect(result.data.userId).toBe('user-creator')
      }
    })

    it('should validate EventResponse schema with complete event data', () => {
      const eventResponse = {
        ...baseEvent,
        id: 'event-response-test', // Ensure ID is present
      }

      const result = EventResponseSchema.safeParse(eventResponse)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('event-response-test')
        expect(result.data.type).toBe('ADD_NODE')
        expect(result.data.timestamp).toBeInstanceOf(Date)
      }
    })

    it('should validate ListEventsQuery schema with all filter options', () => {
      const queryParams = {
        page: 2,
        limit: 10,
        sortBy: 'timestamp',
        sortOrder: 'desc' as const,
        type: 'ADD_NODE',
        typePrefix: 'CHAIN_',
        userId: 'user-123',
        fromTimestamp: new Date('2024-01-01T00:00:00Z'),
        toTimestamp: new Date('2024-12-31T23:59:59Z'),
        hasPayload: true,
        payloadContains: 'nodeId',
        aggregateId: 'chain-456',
      }

      const result = ListEventsQuerySchema.safeParse(queryParams)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(10)
        expect(result.data.sortOrder).toBe('desc')
        expect(result.data.type).toBe('ADD_NODE')
        expect(result.data.typePrefix).toBe('CHAIN_')
      }
    })

    it('should validate paginated response structure', () => {
      const paginatedResponse = {
        data: [
          { ...baseEvent, id: 'event-1' },
          { ...baseEvent, id: 'event-2', type: 'UPDATE_NODE' },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = ListEventsResponseSchema.safeParse(paginatedResponse)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data).toHaveLength(2)
        expect(result.data.pagination.total).toBe(2)
        expect(result.data.meta.timestamp).toBeDefined()
      }
    })

    it('should validate success response for single event creation', () => {
      const createResponse = {
        data: {
          ...baseEvent,
          id: 'newly-created-event',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = CreateEventResponseSchema.safeParse(createResponse)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.id).toBe('newly-created-event')
        expect(result.data.meta.timestamp).toBeDefined()
      }
    })

    it('should validate get single event response', () => {
      const getResponse = {
        data: {
          ...baseEvent,
          id: 'single-event-id',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = GetEventResponseSchema.safeParse(getResponse)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.id).toBe('single-event-id')
        expect(result.data.data.type).toBe('ADD_NODE')
      }
    })
  })

  describe('IT-SC-02: API contract compliance', () => {
    it('should enforce required fields in CreateEventRequest', () => {
      const invalidRequests = [
        { payload: { test: true } }, // Missing type
        { type: 'TEST_EVENT' }, // Missing payload
        { type: '', payload: { test: true } }, // Empty type
        { type: 'invalid-type', payload: { test: true } }, // Invalid type format
        { type: 'TEST_EVENT', payload: undefined }, // Undefined payload
      ]

      invalidRequests.forEach((request, index) => {
        const result = CreateEventRequestSchema.safeParse(request)
        expect(result.success).toBe(false)
        expect(result.error?.issues.length).toBeGreaterThan(0)
        console.log(`Invalid request ${index + 1} correctly rejected:`, result.error?.issues[0]?.message)
      })
    })

    it('should validate event type format strictly', () => {
      const validTypes = [
        'SIMPLE_TYPE',
        'WITH_NUMBERS_123', 
        'MULTIPLE_UNDERSCORES_ALLOWED',
        'A',
        'TYPE_2024',
        '123STARTS_WITH_NUMBER',
      ]

      const invalidTypes = [
        'lowercase',
        'Mixed_Case',
        'WITH-DASHES',
        'WITH SPACES',
        'WITH.DOTS',
        'SPECIAL!CHARS',
        '',
      ]

      validTypes.forEach(type => {
        const result = CreateEventRequestSchema.safeParse({
          type,
          payload: { test: true },
        })
        expect(result.success).toBe(true)
      })

      invalidTypes.forEach(type => {
        const result = CreateEventRequestSchema.safeParse({
          type,
          payload: { test: true },
        })
        expect(result.success).toBe(false)
      })
    })

    it('should validate pagination parameters', () => {
      const validPagination = [
        { page: 1, limit: 1 },
        { page: 50, limit: 100 },
        { page: 1, limit: 20 }, // defaults
      ]

      const invalidPagination = [
        { page: 0, limit: 20 }, // page < 1
        { page: -1, limit: 20 }, // negative page
        { page: 1, limit: 0 }, // limit < 1
        { page: 1, limit: 101 }, // limit > 100
        { page: 1.5, limit: 20 }, // non-integer page
      ]

      validPagination.forEach(params => {
        const result = ListEventsQuerySchema.safeParse(params)
        expect(result.success).toBe(true)
      })

      invalidPagination.forEach(params => {
        const result = ListEventsQuerySchema.safeParse(params)
        expect(result.success).toBe(false)
      })
    })

    it('should validate error response format', () => {
      const validErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: 'Additional error information',
        },
      }

      const result = ErrorResponseSchema.safeParse(validErrorResponse)
      expect(result.success).toBe(true)
    })

    it('should validate validation error response format', () => {
      const validationErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: [
            {
              field: 'type',
              message: 'Event type is required',
              value: undefined,
            },
            {
              field: 'payload',
              message: 'Payload must be defined',
            },
          ],
        },
      }

      const result = ValidationErrorResponseSchema.safeParse(validationErrorResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.error.details).toHaveLength(2)
        expect(result.data.error.details[0].field).toBe('type')
      }
    })
  })

  describe('IT-SC-03: Type inference validation', () => {
    it('should provide correct TypeScript types for CreateEventRequest', () => {
      // This test validates TypeScript type inference
      const request = {
        type: 'TYPE_INFERENCE_TEST',
        payload: { message: 'testing types' },
        timestamp: new Date(),
        userId: 'user-types',
      }

      // Type inference test - should compile without errors
      const validatedRequest: z.infer<typeof CreateEventRequestSchema> = request
      
      expect(validatedRequest.type).toBe('TYPE_INFERENCE_TEST')
      expect(validatedRequest.payload).toEqual({ message: 'testing types' })
      expect(validatedRequest.timestamp).toBeInstanceOf(Date)
      expect(validatedRequest.userId).toBe('user-types')
    })

    it('should provide correct types for EventResponse', () => {
      const response = {
        id: 'event-123',
        type: 'RESPONSE_TYPE_TEST',
        payload: { data: 'response data' },
        timestamp: new Date(),
        userId: 'response-user',
      }

      // Type inference test
      const validatedResponse: z.infer<typeof EventResponseSchema> = response
      
      expect(validatedResponse.id).toBe('event-123')
      expect(validatedResponse.type).toBe('RESPONSE_TYPE_TEST')
      expect(validatedResponse.payload).toEqual({ data: 'response data' })
    })

    it('should handle various payload types correctly', () => {
      const payloadTypes = [
        { type: 'STRING_PAYLOAD', payload: 'simple string' },
        { type: 'NUMBER_PAYLOAD', payload: 42 },
        { type: 'BOOLEAN_PAYLOAD', payload: true },
        { type: 'ARRAY_PAYLOAD', payload: [1, 'two', { three: 3 }] },
        { type: 'NULL_PAYLOAD', payload: null },
        { type: 'OBJECT_PAYLOAD', payload: { nested: { data: 'value' } } },
      ]

      payloadTypes.forEach((testCase, _index) => {
        const result = CreateEventRequestSchema.safeParse(testCase)
        expect(result.success).toBe(true)
        
        if (result.success) {
          expect(result.data.payload).toEqual(testCase.payload)
        }
      })
    })

    it('should validate complex nested payloads', () => {
      const complexPayload = {
        chainId: 'complex-chain',
        operations: [
          {
            type: 'add_node',
            nodeId: 'node-1',
            data: {
              title: 'Complex Node',
              metadata: {
                author: { name: 'Test User', id: 123 },
                tags: ['important', 'test'],
                settings: {
                  visible: true,
                  editable: false,
                  permissions: ['read', 'write'],
                },
              },
            },
          },
          {
            type: 'add_edge',
            edgeId: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            properties: {
              weight: 0.8,
              bidirectional: false,
            },
          },
        ],
        timestamp: new Date().toISOString(),
        version: 2,
      }

      const result = CreateEventRequestSchema.safeParse({
        type: 'COMPLEX_CHAIN_OPERATION',
        payload: complexPayload,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.payload.operations).toHaveLength(2)
        expect(result.data.payload.operations[0].data.metadata.author.name).toBe('Test User')
      }
    })
  })

  describe('Event validation endpoint schemas', () => {
    it('should validate event validation request', () => {
      const validationRequest = {
        type: 'TEST_VALIDATION',
        payload: { test: 'data' },
        timestamp: new Date(),
        userId: 'validator-user',
      }

      const result = ValidateEventRequestSchema.safeParse(validationRequest)
      expect(result.success).toBe(true)
    })

    it('should validate event validation response', () => {
      const validationResponse = {
        data: {
          valid: true,
          errors: [],
          warnings: [
            {
              field: 'payload.deprecated_field',
              message: 'This field is deprecated and will be removed',
            },
          ],
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }

      const result = ValidateEventResponseSchema.safeParse(validationResponse)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.data.valid).toBe(true)
        expect(result.data.data.warnings).toHaveLength(1)
      }
    })
  })

  describe('Real-world data compatibility', () => {
    it('should handle chain event fixtures', () => {
      chainEvents.forEach((event, index) => {
        const result = EventResponseSchema.safeParse(event)
        expect(result.success).toBe(true)
        console.log(`Chain event ${index + 1} validated successfully: ${event.type}`)
      })
    })

    it('should handle node event fixtures', () => {
      nodeEvents.forEach((event, index) => {
        const result = EventResponseSchema.safeParse(event)
        expect(result.success).toBe(true)
        console.log(`Node event ${index + 1} validated successfully: ${event.type}`)
      })
    })

    it('should create valid API requests from fixtures', () => {
      // Convert event fixture to API request format
      const apiRequest = {
        type: baseEvent.type,
        payload: baseEvent.payload,
        timestamp: baseEvent.timestamp,
        userId: baseEvent.userId,
      }

      const result = CreateEventRequestSchema.safeParse(apiRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe(baseEvent.type)
        expect(result.data.payload).toEqual(baseEvent.payload)
      }
    })
  })
})