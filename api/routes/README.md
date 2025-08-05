# API Routes

This directory contains all API route handlers organized by domain.

## Structure

- `events.ts` - Event sourcing endpoints (GET, POST /api/events)
- `documents.ts` - Document CRUD operations
- `agents.ts` - Agent management endpoints
- `chains.ts` - Chain workflow endpoints
- `health.ts` - Health check and monitoring endpoints

## Implementation Status

- [ ] Events API - Pending implementation
- [ ] Documents API - Pending implementation  
- [ ] Agents API - Pending implementation
- [ ] Chains API - Pending implementation
- [x] Health API - Basic implementation in server.ts

## Route Pattern

Each route file should export a function that accepts a FastifyInstance and registers routes:

```typescript
import { FastifyInstance } from 'fastify'

export async function eventsRoutes(fastify: FastifyInstance) {
  // Register event-related routes
  fastify.get('/events', async (request, reply) => {
    // Implementation
  })
}
```

Routes are automatically prefixed with `/api` by the server.