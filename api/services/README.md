# API Services

This directory contains business logic services and data access layers.

## Structure

- `event-store.ts` - Event persistence and retrieval service
- `agent-runner.ts` - AI agent execution service
- `cache.ts` - In-memory caching service
- `database.ts` - Database connection and utilities

## Implementation Status

- [ ] Event Store Service - Pending implementation
- [ ] Agent Runner Service - Pending implementation
- [ ] Cache Service - Pending implementation
- [ ] Database Service - Pending implementation

## Service Pattern

Services should encapsulate business logic and provide clean interfaces:

```typescript
export class EventStoreService {
  async createEvent(eventData: CreateEventRequest): Promise<Event> {
    // Business logic for event creation
  }

  async getEvents(filters: EventFilters): Promise<PaginatedEvents> {
    // Business logic for event retrieval
  }
}
```

Services should be dependency-injected into route handlers for testability.