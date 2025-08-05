import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { EventSchema } from '../../../schemas/events/event'

describe('EventSchema', () => {
  describe('Given valid event data', () => {
    const validEvent = {
      type: 'ADD_NODE',
      payload: {
        nodeId: 'node-123',
        nodeType: 'document',
        position: { x: 100, y: 200 },
        data: { title: 'New Document' },
      },
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      id: 'event-123',
      userId: 'user-456',
    }

    it('should validate when all required fields are present', () => {
      const result = EventSchema.safeParse(validEvent)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('ADD_NODE')
        expect(result.data.payload).toEqual(validEvent.payload)
        expect(result.data.timestamp).toEqual(validEvent.timestamp)
      }
    })

    it('should infer correct TypeScript type from schema', () => {
      type EventType = z.infer<typeof EventSchema>
      const event: EventType = validEvent

      // Type assertions to verify inference
      expect(typeof event.type).toBe('string')
      expect(typeof event.payload).toBe('object')
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(typeof event.id).toBe('string')
    })

    it('should validate with minimal required fields', () => {
      const minimalEvent = {
        type: 'SAVE_CHAIN',
        payload: {},
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(minimalEvent)
      expect(result.success).toBe(true)
    })

    it('should validate various event types', () => {
      const eventTypes = [
        'ADD_NODE',
        'DELETE_NODE',
        'MOVE_NODE',
        'UPDATE_NODE',
        'ADD_EDGE',
        'DELETE_EDGE',
        'UPDATE_EDGE',
        'SAVE_CHAIN',
        'LOAD_CHAIN',
        'UNDO',
        'REDO',
        'RUN_AGENT',
        'AGENT_COMPLETE',
        'AGENT_ERROR',
      ]

      eventTypes.forEach(type => {
        const eventWithType = {
          type,
          payload: { data: 'test' },
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
        }

        const result = EventSchema.safeParse(eventWithType)
        expect(result.success).toBe(true)
      })
    })

    it('should validate with empty payload', () => {
      const eventWithEmptyPayload = {
        type: 'SAVE_CHAIN',
        payload: {},
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithEmptyPayload)
      expect(result.success).toBe(true)
    })

    it('should validate with complex nested payload', () => {
      const complexPayload = {
        nodeId: 'node-complex',
        nodeType: 'agent',
        position: { x: 250, y: 350 },
        data: {
          agentConfig: {
            model: 'gpt-4',
            temperature: 0.7,
            tools: ['analyzer', 'summarizer'],
            systemPrompt: 'You are a helpful assistant',
          },
          metadata: {
            created: new Date('2024-01-01T00:00:00.000Z'),
            version: 1,
            tags: ['important', 'processing'],
          },
        },
        previousState: {
          position: { x: 200, y: 300 },
          data: { title: 'Old Title' },
        },
      }

      const eventWithComplexPayload = {
        type: 'UPDATE_NODE',
        payload: complexPayload,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithComplexPayload)
      expect(result.success).toBe(true)
    })

    it('should validate with array payload', () => {
      const arrayPayload = [
        { nodeId: 'node-1', action: 'select' },
        { nodeId: 'node-2', action: 'select' },
        { nodeId: 'node-3', action: 'deselect' },
      ]

      const eventWithArrayPayload = {
        type: 'BULK_SELECT',
        payload: arrayPayload,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithArrayPayload)
      expect(result.success).toBe(true)
    })

    it('should validate with string payload', () => {
      const eventWithStringPayload = {
        type: 'SYSTEM_MESSAGE',
        payload: 'Chain saved successfully',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithStringPayload)
      expect(result.success).toBe(true)
    })

    it('should validate with number payload', () => {
      const eventWithNumberPayload = {
        type: 'SET_ZOOM',
        payload: 1.5,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithNumberPayload)
      expect(result.success).toBe(true)
    })
  })

  describe('Given invalid event data', () => {
    it('should fail when type is missing', () => {
      const invalidEvent = {
        payload: { data: 'test' },
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['type'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when payload is missing', () => {
      const invalidEvent = {
        type: 'ADD_NODE',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['payload'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when timestamp is missing', () => {
      const invalidEvent = {
        type: 'ADD_NODE',
        payload: { data: 'test' },
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['timestamp'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when type is empty string', () => {
      const invalidEvent = {
        type: '',
        payload: { data: 'test' },
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['type'],
              code: 'too_small',
            }),
          ])
        )
      }
    })

    it('should fail when type is not a string', () => {
      const invalidEvent = {
        type: 123,
        payload: { data: 'test' },
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['type'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when timestamp is not a Date', () => {
      const invalidEvent = {
        type: 'ADD_NODE',
        payload: { data: 'test' },
        timestamp: '2024-01-01T00:00:00.000Z',
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['timestamp'],
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should fail when timestamp is invalid date', () => {
      const invalidEvent = {
        type: 'ADD_NODE',
        payload: { data: 'test' },
        timestamp: new Date('invalid-date'),
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['timestamp'],
              code: 'invalid_date',
            }),
          ])
        )
      }
    })

    it('should fail when type contains invalid characters', () => {
      const invalidEvent = {
        type: 'INVALID-TYPE-WITH-SPACES AND SPECIAL CHARS!',
        payload: { data: 'test' },
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['type'],
              code: 'invalid_string',
            }),
          ])
        )
      }
    })

    it('should fail when required fields have wrong types', () => {
      const invalidEvent = {
        type: null,
        payload: undefined,
        timestamp: 'not-a-date',
      }

      const result = EventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('Given edge cases', () => {
    it('should handle very large payloads', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        data: `data-${i}`,
      }))

      const eventWithLargePayload = {
        type: 'BULK_OPERATION',
        payload: largeArray,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithLargePayload)
      expect(result.success).toBe(true)
    })

    it('should handle deeply nested payload objects', () => {
      const deeplyNestedPayload = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: 'deep value',
                  array: [1, 2, 3, { nested: true }],
                },
              },
            },
          },
        },
      }

      const eventWithDeepPayload = {
        type: 'DEEP_UPDATE',
        payload: deeplyNestedPayload,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithDeepPayload)
      expect(result.success).toBe(true)
    })

    it('should handle payload with null values', () => {
      const payloadWithNulls = {
        value1: null,
        value2: 'string',
        value3: null,
        nested: {
          nullValue: null,
          validValue: 42,
        },
      }

      const eventWithNullPayload = {
        type: 'UPDATE_WITH_NULLS',
        payload: payloadWithNulls,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithNullPayload)
      expect(result.success).toBe(true)
    })

    it('should handle timestamps at edge dates', () => {
      const edgeDates = [
        new Date('1970-01-01T00:00:00.000Z'), // Unix epoch
        new Date('2038-01-19T03:14:07.000Z'), // Near 32-bit timestamp limit
        new Date('2100-12-31T23:59:59.999Z'), // Far future
      ]

      edgeDates.forEach(timestamp => {
        const eventWithEdgeDate = {
          type: 'EDGE_DATE_TEST',
          payload: { date: timestamp.toISOString() },
          timestamp,
        }

        const result = EventSchema.safeParse(eventWithEdgeDate)
        expect(result.success).toBe(true)
      })
    })

    it('should handle null input gracefully', () => {
      const result = EventSchema.safeParse(null)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should handle undefined input gracefully', () => {
      const result = EventSchema.safeParse(undefined)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: 'invalid_type',
            }),
          ])
        )
      }
    })

    it('should handle empty object as payload', () => {
      const eventWithEmptyObject = {
        type: 'EMPTY_PAYLOAD',
        payload: {},
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithEmptyObject)
      expect(result.success).toBe(true)
    })

    it('should handle boolean payload', () => {
      const eventWithBooleanPayload = {
        type: 'TOGGLE_FEATURE',
        payload: true,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithBooleanPayload)
      expect(result.success).toBe(true)
    })

    it('should handle null payload', () => {
      const eventWithNullPayload = {
        type: 'RESET_STATE',
        payload: null,
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
      }

      const result = EventSchema.safeParse(eventWithNullPayload)
      expect(result.success).toBe(true)
    })
  })

  describe('Schema exports', () => {
    it('should export EventSchema as Zod schema', () => {
      expect(EventSchema).toBeDefined()
      expect(typeof EventSchema.parse).toBe('function')
      expect(typeof EventSchema.safeParse).toBe('function')
    })

    it('should have correct schema structure', () => {
      expect(EventSchema._def.typeName).toBe('ZodObject')
      expect(EventSchema.shape).toBeDefined()
      expect(EventSchema.shape.type).toBeDefined()
      expect(EventSchema.shape.payload).toBeDefined()
      expect(EventSchema.shape.timestamp).toBeDefined()
    })

    it('should allow type inference for event types', () => {
      type EventType = z.infer<typeof EventSchema>

      // Test that the inferred type has the expected structure
      const testEvent: EventType = {
        type: 'TEST_EVENT',
        payload: { test: true },
        timestamp: new Date(),
      }

      expect(testEvent.type).toBe('TEST_EVENT')
      expect(testEvent.payload).toEqual({ test: true })
      expect(testEvent.timestamp).toBeInstanceOf(Date)
    })
  })
})
