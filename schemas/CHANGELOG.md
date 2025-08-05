# Schema Changelog

## Version 1.1.0 (2025-01-05)

### Added

- **API Request/Response Schemas** - Complete API schema layer for MVP endpoints
  - `api/common.ts` - Common response wrappers, pagination, error handling schemas
  - `api/chains.ts` - Chain CRUD operations with node/edge management
  - `api/documents.ts` - Document CRUD with content/metadata operations and search
  - `api/agents.ts` - Agent CRUD with tool management, validation, and testing
  - `api/events.ts` - Event sourcing with batch operations, streaming, and replay
  - All schemas follow RESTful patterns with consistent response formats

### Features

- **Pagination Support** - Standardized pagination across all list endpoints
- **Response Wrappers** - Consistent success/error response formats
- **Query Parameters** - Comprehensive filtering and sorting for all entities
- **Validation** - Runtime validation with detailed error messages
- **Type Safety** - Full TypeScript type generation from Zod schemas

### API Endpoints Covered

- **Chains**: CREATE, READ, UPDATE, DELETE + node/edge operations
- **Documents**: CREATE, READ, UPDATE, DELETE + content/metadata operations + search
- **Agents**: CREATE, READ, UPDATE, DELETE + tool management + validation/testing
- **Events**: CREATE, READ + batch operations + streaming + analytics

### Schema Patterns

- Request schemas omit auto-generated fields (id, timestamps)
- Response schemas include all fields with proper typing
- Summary schemas for list views exclude large fields for performance
- Partial update schemas support selective field updates
- Common query schemas with pagination, sorting, and filtering

### Migration Notes

- API schemas reuse existing database schemas as base
- No breaking changes to existing database or event schemas
- Backward compatible with all existing schema exports

## Version 1.0.0 (2025-01-04)

### Added

- **Database Schemas** - Core entity validation for Chain Workspace
  - `database/chain.ts` - Chain structure with nodes and edges
  - `database/document.ts` - Document entities with flexible metadata
  - `database/agent.ts` - AI agent configuration and tools
- **Event Schemas** - Event sourcing validation
  - `events/event.ts` - Immutable event structure for event store
- **Schema Organization** - Modular exports with index files
- **Type Safety** - Full TypeScript type inference from Zod schemas
- **Validation** - Runtime validation with detailed error messages

### Initial Features

- Strict schema validation for all core entities
- Flexible metadata support for extensibility
- Event sourcing patterns for state management
- Comprehensive TypeScript type definitions
