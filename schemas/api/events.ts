import { z } from 'zod'
import { EventSchema } from '../events/event'
import {
  CommonQuerySchema,
  SuccessResponseSchema,
  PaginatedResponseSchema,
} from './common'

/**
 * Event API schemas for event sourcing operations
 * Based on database EventSchema with API-specific variations
 * Events are immutable - no update or delete operations
 */

/**
 * Schema for creating a new event
 * Omits id (auto-generated) but requires all other fields
 */
export const CreateEventRequestSchema = EventSchema.omit({
  id: true,
})
  .extend({
    // Override timestamp to be optional - server can set current time if not provided
    timestamp: z.coerce
      .date()
      .optional()
      .describe('Event timestamp - defaults to current time if not provided'),
  })
  .describe('Request schema for creating a new event')

/**
 * Event response schema
 * Full event data with all fields including generated ID
 */
export const EventResponseSchema = EventSchema.extend({
  id: z
    .string()
    .min(1, 'Event ID cannot be empty')
    .describe('Unique event identifier'),
}).describe('Event response data')

/**
 * Query parameters for listing events
 */
export const ListEventsQuerySchema = CommonQuerySchema.extend({
  type: z.string().optional().describe('Filter by event type'),
  typePrefix: z
    .string()
    .optional()
    .describe(
      'Filter by event type prefix (e.g., "CHAIN_" for all chain events)'
    ),
  userId: z.string().optional().describe('Filter by user ID'),
  fromTimestamp: z.coerce
    .date()
    .optional()
    .describe('Filter events from this timestamp'),
  toTimestamp: z.coerce
    .date()
    .optional()
    .describe('Filter events up to this timestamp'),
  hasPayload: z.coerce
    .boolean()
    .optional()
    .describe('Filter events that have payload data'),
  payloadContains: z
    .string()
    .optional()
    .describe(
      'Filter events where payload contains specific text (JSON search)'
    ),
  aggregateId: z
    .string()
    .optional()
    .describe('Filter events by aggregate ID (from payload)'),
}).describe('Query parameters for listing events')

/**
 * URL parameters for event operations
 */
export const EventParamsSchema = z
  .object({
    id: z
      .string()
      .min(1, 'Event ID is required')
      .describe('Event ID from URL path'),
  })
  .describe('URL parameters for event operations')

/**
 * Response schemas for event endpoints
 */

// GET /events/:id - Get single event
export const GetEventResponseSchema = SuccessResponseSchema(
  EventResponseSchema
).describe('Response for getting a single event')

// GET /events - List events with pagination
export const ListEventsResponseSchema = PaginatedResponseSchema(
  EventResponseSchema
).describe('Response for listing events with pagination')

// POST /events - Create event
export const CreateEventResponseSchema = SuccessResponseSchema(
  EventResponseSchema
).describe('Response for creating an event')

/**
 * Event streaming and real-time operations
 */

/**
 * Schema for event stream subscription
 */
export const EventStreamQuerySchema = z
  .object({
    types: z
      .array(z.string())
      .optional()
      .describe('Array of event types to subscribe to'),
    userId: z.string().optional().describe('Filter events by user ID'),
    fromTimestamp: z.coerce
      .date()
      .optional()
      .describe('Start streaming from this timestamp'),
    aggregateId: z
      .string()
      .optional()
      .describe('Filter events by aggregate ID'),
  })
  .describe('Query parameters for event stream subscription')

/**
 * Event batch operations
 */

/**
 * Schema for creating multiple events in a batch
 */
export const CreateEventsBatchRequestSchema = z
  .object({
    events: z
      .array(CreateEventRequestSchema)
      .min(1)
      .max(100)
      .describe('Array of events to create (max 100)'),
  })
  .describe('Request schema for creating multiple events')

/**
 * Response for batch event creation
 */
export const CreateEventsBatchResponseSchema = SuccessResponseSchema(
  z.object({
    created: z
      .array(EventResponseSchema)
      .describe('Successfully created events'),
    failed: z
      .array(
        z.object({
          index: z.number().describe('Index of failed event in original array'),
          error: z.string().describe('Error message for failed event'),
        })
      )
      .describe('Failed event creations'),
  })
).describe('Response for batch event creation')

/**
 * Event aggregation and analytics
 */

/**
 * Schema for event statistics query
 */
export const EventStatsQuerySchema = z
  .object({
    groupBy: z
      .enum(['type', 'userId', 'hour', 'day', 'week', 'month'])
      .describe('How to group the statistics'),
    fromTimestamp: z.coerce
      .date()
      .optional()
      .describe('Start date for statistics'),
    toTimestamp: z.coerce.date().optional().describe('End date for statistics'),
    types: z
      .array(z.string())
      .optional()
      .describe('Filter by specific event types'),
    userId: z.string().optional().describe('Filter by specific user ID'),
  })
  .describe('Query parameters for event statistics')

/**
 * Event statistics response
 */
export const EventStatsResponseSchema = SuccessResponseSchema(
  z.object({
    total: z.number().int().min(0).describe('Total number of events'),
    groups: z
      .array(
        z.object({
          key: z.string().describe('Group key (type, user, date, etc.)'),
          count: z
            .number()
            .int()
            .min(0)
            .describe('Number of events in this group'),
          percentage: z
            .number()
            .min(0)
            .max(100)
            .describe('Percentage of total events'),
        })
      )
      .describe('Grouped statistics'),
    period: z
      .object({
        from: z.date().describe('Start of statistics period'),
        to: z.date().describe('End of statistics period'),
      })
      .describe('Time period for statistics'),
  })
).describe('Response for event statistics')

/**
 * Event replay and history operations
 */

/**
 * Schema for replaying events to reconstruct state
 */
export const ReplayEventsQuerySchema = z
  .object({
    aggregateId: z
      .string()
      .min(1, 'Aggregate ID is required')
      .describe('ID of aggregate to replay'),
    upToTimestamp: z.coerce
      .date()
      .optional()
      .describe('Replay events up to this timestamp'),
    upToEventId: z
      .string()
      .optional()
      .describe('Replay events up to this event ID'),
    eventTypes: z
      .array(z.string())
      .optional()
      .describe('Only replay specific event types'),
  })
  .describe('Query parameters for event replay')

/**
 * Response for event replay
 */
export const ReplayEventsResponseSchema = SuccessResponseSchema(
  z.object({
    aggregateId: z.string().describe('ID of replayed aggregate'),
    eventsReplayed: z
      .number()
      .int()
      .min(0)
      .describe('Number of events replayed'),
    finalState: z.any().describe('Final state after replay'),
    replayTimestamp: z.date().describe('When the replay was performed'),
  })
).describe('Response for event replay')

/**
 * Event validation schemas
 */

/**
 * Schema for validating event structure
 */
export const ValidateEventRequestSchema = z
  .object({
    type: z.string().min(1).describe('Event type to validate'),
    payload: z.any().describe('Event payload to validate'),
    timestamp: z.coerce
      .date()
      .optional()
      .describe('Event timestamp to validate'),
    userId: z.string().optional().describe('User ID to validate'),
  })
  .describe('Request schema for validating event structure')

/**
 * Response for event validation
 */
export const ValidateEventResponseSchema = SuccessResponseSchema(
  z.object({
    valid: z.boolean().describe('Whether the event is valid'),
    errors: z
      .array(
        z.object({
          field: z.string().describe('Field with validation error'),
          message: z.string().describe('Validation error message'),
        })
      )
      .describe('Validation errors if any'),
    warnings: z
      .array(
        z.object({
          field: z.string().describe('Field with validation warning'),
          message: z.string().describe('Validation warning message'),
        })
      )
      .describe('Validation warnings if any'),
  })
).describe('Response for event validation')

/**
 * TypeScript types for event API schemas
 */
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>
export type EventResponse = z.infer<typeof EventResponseSchema>
export type ListEventsQuery = z.infer<typeof ListEventsQuerySchema>
export type EventParams = z.infer<typeof EventParamsSchema>
export type EventStreamQuery = z.infer<typeof EventStreamQuerySchema>
export type CreateEventsBatchRequest = z.infer<
  typeof CreateEventsBatchRequestSchema
>
export type EventStatsQuery = z.infer<typeof EventStatsQuerySchema>
export type ReplayEventsQuery = z.infer<typeof ReplayEventsQuerySchema>
export type ValidateEventRequest = z.infer<typeof ValidateEventRequestSchema>
