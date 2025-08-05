import { z } from 'zod';
/**
 * Event Schema for Event Sourcing
 *
 * Represents immutable events in the event store with strict validation.
 * Supports flexible payload structures for different event types.
 */
export const EventSchema = z.object({
    /**
     * Event type identifier - must be uppercase letters, numbers, and underscores only
     */
    type: z
        .string()
        .min(1, 'Event type cannot be empty')
        .regex(/^[A-Z0-9_]+$/, 'Event type must contain only uppercase letters, numbers, and underscores')
        .describe('Unique identifier for the event type'),
    /**
     * Event payload - flexible structure supporting any valid JSON value
     */
    payload: z
        .any()
        .refine(val => val !== undefined, {
        message: 'payload is required',
        code: z.ZodIssueCode.invalid_type,
    })
        .describe('Event data payload - can be object, array, string, number, boolean, or null'),
    /**
     * Event timestamp - must be a valid Date object
     */
    timestamp: z
        .date()
        .refine(date => !isNaN(date.getTime()), {
        message: 'Timestamp must be a valid date',
    })
        .describe('When the event occurred'),
    /**
     * Optional event unique identifier
     */
    id: z
        .string()
        .optional()
        .describe('Unique identifier for this event instance'),
    /**
     * Optional user identifier for event attribution
     */
    userId: z.string().optional().describe('User who triggered this event'),
});
