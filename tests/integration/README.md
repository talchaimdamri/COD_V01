# Integration Tests

This directory contains integration tests for the Chain Workspace API using the TDD methodology.

## Overview

Integration tests verify that different components of the system work together correctly, including:

- **API endpoints** (Fastify routes)
- **Database operations** (PostgreSQL with Prisma)
- **Authentication** (JWT middleware)
- **Schema validation** (Zod schemas)
- **CORS configuration**

## Test Organization

### File Structure

```
tests/integration/
├── README.md              # This file
├── setup.ts              # Test utilities and setup helpers
├── events.test.ts        # Comprehensive events API tests
├── events.happy.test.ts  # Happy path scenarios only
└── events.errors.test.ts # Error scenarios (to be created)
```

### Test Case IDs

- **IT-EV-01**: GET /api/events - Event listing with pagination and filtering
- **IT-EV-02**: POST /api/events - Event creation with proper validation
- **IT-EV-03**: Event validation - Zod schema validation edge cases
- **IT-AU-01**: JWT authentication - Protected routes authentication

## TDD Development Workflow

### Expected Failures

These tests are designed to **fail initially** until the corresponding API endpoints are implemented. This is intentional and follows TDD principles:

1. **Red**: Write failing tests that specify the desired behavior
2. **Green**: Implement minimal code to make tests pass
3. **Refactor**: Improve code while keeping tests passing

### Current Implementation Status

- ❌ **Fastify Server**: Not implemented
- ❌ **Events API Routes**: Not implemented
- ❌ **Database Layer**: Not implemented
- ❌ **JWT Authentication**: Not implemented
- ✅ **Zod Schemas**: Implemented
- ✅ **Test Infrastructure**: Implemented

## Running Tests

### Prerequisites

```bash
# Start test database (requires Docker)
docker-compose -f docker-compose.dev.yml up -d postgres

# Install dependencies
npm install
```

### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npx vitest tests/integration/events.happy.test.ts

# Run tests in watch mode
npx vitest tests/integration --watch

# Run with coverage
npx vitest tests/integration --coverage
```

### Expected Output

Since the API is not implemented yet, you should see failures like:

```
❌ Fastify server not implemented yet - this is expected in TDD
ℹ️  Expected failure: API endpoint not implemented yet
```

This is **normal and expected** during TDD development.

## Test Infrastructure

### TestDatabaseManager

Manages PostgreSQL test database using Testcontainers:

```typescript
const dbManager = TestDatabaseManager.getInstance()
await dbManager.setup()          // Start test database
await dbManager.clearEvents()    // Clear test data
await dbManager.seedEvents([])   // Add test data
await dbManager.cleanup()        // Stop test database
```

### TestServerManager

Manages Fastify server for testing:

```typescript
const serverManager = TestServerManager.getInstance()
const app = await serverManager.start(dbConfig)
await serverManager.stop()
```

### JWTTestHelper

Provides JWT tokens for authentication testing:

```typescript
const validToken = JWTTestHelper.generateValidToken()
const expiredToken = JWTTestHelper.generateExpiredToken()
const invalidToken = JWTTestHelper.generateInvalidToken()
```

## Implementation Guide

To make these tests pass, implement the following components:

### 1. Fastify Server (`api/server.ts`)

```typescript
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

export async function createServer(options = {}) {
  const app = Fastify({ logger: true })
  
  // Register plugins
  await app.register(cors, { origin: true })
  await app.register(jwt, { secret: process.env.JWT_SECRET })
  
  // Register routes
  await app.register(eventsRoutes, { prefix: '/api' })
  
  return app
}
```

### 2. Events Routes (`api/routes/events.ts`)

```typescript
import { FastifyPluginAsync } from 'fastify'
import { 
  ListEventsQuerySchema,
  CreateEventRequestSchema 
} from '../../schemas/api/events'

export const eventsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /events
  fastify.get('/events', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: ListEventsQuerySchema,
      response: {
        200: ListEventsResponseSchema
      }
    }
  }, async (request, reply) => {
    // Implementation here
  })

  // POST /events
  fastify.post('/events', {
    preHandler: [fastify.authenticate],
    schema: {
      body: CreateEventRequestSchema,
      response: {
        201: CreateEventResponseSchema
      }
    }
  }, async (request, reply) => {
    // Implementation here
  })
}
```

### 3. Database Models

Set up Prisma schema and event models to match the Zod schemas.

### 4. Authentication Middleware

Implement JWT authentication using `@fastify/jwt`.

## Test Data

### Fixtures

Test data is provided in `../fixtures/schemas.ts`:

- `baseEvent`: Basic event structure
- `createEventRequest`: Event creation payload
- `chainEvents`: Array of chain-related events
- `nodeEvents`: Array of node-related events

### Custom Test Data

Create custom test data using utilities:

```typescript
import { TestUtils } from './setup'

const testEvent = TestUtils.createTestEvent({
  type: 'CUSTOM_EVENT',
  payload: { custom: 'data' }
})
```

## Schema Validation

All tests validate responses against Zod schemas:

```typescript
import { ListEventsResponseSchema } from '../../schemas/api/events'

const validationResult = ListEventsResponseSchema.safeParse(response.body)
expect(validationResult.success).toBe(true)
```

## Error Handling

Tests verify proper error responses:

- **400**: Validation errors
- **401**: Authentication errors
- **404**: Not found errors
- **500**: Server errors

## CORS Testing

Tests verify CORS headers for frontend integration:

```typescript
expect(response.headers['access-control-allow-origin']).toBeDefined()
expect(response.headers['access-control-allow-methods']).toContain('POST')
```

## Performance Considerations

- Tests use isolated database transactions
- Database is reset between test cases
- Testcontainers provides consistent environment
- Tests run in parallel where possible

## Debugging

### Database Inspection

```bash
# Connect to test database
docker exec -it chainworkspace_postgres_test psql -U test_user -d chainworkspace_test

# View events table
SELECT * FROM events ORDER BY timestamp DESC;
```

### Server Logs

Enable debug logging in test environment:

```typescript
const app = Fastify({ 
  logger: { level: 'debug' }
})
```

## Contributing

When adding new integration tests:

1. Follow the existing test organization patterns
2. Use descriptive test case IDs (IT-XX-XX format)
3. Include both happy path and error scenarios
4. Validate responses against Zod schemas
5. Use test fixtures from `../fixtures/schemas.ts`
6. Add proper cleanup in `afterEach` hooks

## Next Steps

1. Implement Fastify server with events routes
2. Set up database connection and migrations
3. Add JWT authentication middleware
4. Implement event CRUD operations
5. Add error handling and validation
6. Run tests to verify implementation