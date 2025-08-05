import { prisma } from '../db/client'
import { Event as PrismaEvent } from '@prisma/client'
import { EventResponse, ListEventsQuery } from '../../schemas/api/events'

/**
 * Events service for database operations
 * Handles CRUD operations for the event sourcing system
 */

export interface CreateEventData {
  type: string
  payload: unknown
  timestamp?: Date
  userId?: string
}

export interface EventFilters {
  type?: string
  typePrefix?: string
  userId?: string
  fromTimestamp?: Date
  toTimestamp?: Date
  hasPayload?: boolean
  payloadContains?: string
  aggregateId?: string
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface EventListResult {
  events: EventResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Convert Prisma Event to API EventResponse format
 */
function mapPrismaEventToResponse(prismaEvent: PrismaEvent): EventResponse {
  return {
    id: prismaEvent.seq.toString(),
    type: prismaEvent.eventType,
    payload: prismaEvent.payload,
    timestamp: prismaEvent.timestamp,
    userId: prismaEvent.actorId || undefined,
  }
}

/**
 * Create a new event in the database
 */
export async function createEvent(data: CreateEventData): Promise<EventResponse> {
  const event = await prisma.event.create({
    data: {
      eventType: data.type,
      payload: data.payload,
      timestamp: data.timestamp || new Date(),
      actorId: data.userId || 'anonymous',
    },
  })

  return mapPrismaEventToResponse(event)
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<EventResponse | null> {
  const eventId = parseInt(id, 10)
  if (isNaN(eventId)) {
    return null
  }

  const event = await prisma.event.findUnique({
    where: { seq: eventId },
  })

  if (!event) {
    return null
  }

  return mapPrismaEventToResponse(event)
}

/**
 * List events with filtering and pagination
 */
export async function listEvents(
  filters: EventFilters = {},
  pagination: PaginationOptions = { page: 1, limit: 20 }
): Promise<EventListResult> {
  const { page, limit } = pagination
  const offset = (page - 1) * limit

  // Build where clause based on filters
  const where: any = {}

  if (filters.type) {
    where.eventType = filters.type
  }

  if (filters.typePrefix) {
    where.eventType = {
      startsWith: filters.typePrefix,
    }
  }

  if (filters.userId) {
    where.actorId = filters.userId
  }

  if (filters.fromTimestamp || filters.toTimestamp) {
    where.timestamp = {}
    if (filters.fromTimestamp) {
      where.timestamp.gte = filters.fromTimestamp
    }
    if (filters.toTimestamp) {
      where.timestamp.lte = filters.toTimestamp
    }
  }

  if (filters.hasPayload !== undefined) {
    if (filters.hasPayload) {
      where.payload = {
        not: null,
      }
    } else {
      where.payload = null
    }
  }

  if (filters.payloadContains) {
    // PostgreSQL JSONB text search
    where.payload = {
      string_contains: filters.payloadContains,
    }
  }

  if (filters.aggregateId) {
    // Search for aggregateId in the payload using JSON path
    where.payload = {
      path: ['aggregateId'],
      equals: filters.aggregateId,
    }
  }

  // Get total count for pagination
  const total = await prisma.event.count({ where })

  // Get events with pagination, ordered by timestamp descending (newest first)
  const events = await prisma.event.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    skip: offset,
    take: limit,
  })

  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    events: events.map(mapPrismaEventToResponse),
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
  }
}

/**
 * Get events by type
 */
export async function getEventsByType(
  eventType: string,
  pagination: PaginationOptions = { page: 1, limit: 20 }
): Promise<EventListResult> {
  return listEvents({ type: eventType }, pagination)
}

/**
 * Get events by user ID
 */
export async function getEventsByUserId(
  userId: string,
  pagination: PaginationOptions = { page: 1, limit: 20 }
): Promise<EventListResult> {
  return listEvents({ userId }, pagination)
}

/**
 * Get events within a time range
 */
export async function getEventsInTimeRange(
  fromTimestamp: Date,
  toTimestamp: Date,
  pagination: PaginationOptions = { page: 1, limit: 20 }
): Promise<EventListResult> {
  return listEvents({ fromTimestamp, toTimestamp }, pagination)
}

/**
 * Get the latest events (most recent first)
 */
export async function getLatestEvents(
  limit: number = 10
): Promise<EventResponse[]> {
  const events = await prisma.event.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  return events.map(mapPrismaEventToResponse)
}

/**
 * Count events by type
 */
export async function countEventsByType(): Promise<Record<string, number>> {
  const results = await prisma.event.groupBy({
    by: ['eventType'],
    _count: {
      eventType: true,
    },
  })

  const counts: Record<string, number> = {}
  for (const result of results) {
    counts[result.eventType] = result._count.eventType
  }

  return counts
}

/**
 * Delete all events (for testing only)
 */
export async function deleteAllEvents(): Promise<number> {
  const result = await prisma.event.deleteMany({})
  return result.count
}