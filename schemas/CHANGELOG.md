# Schema Changelog

## Version 1.2.0 (2025-01-05)

### Added

- **Canvas Event Schemas** - Complete event sourcing integration for canvas interactions
  - `events/canvas.ts` - Canvas-specific events that extend base EventSchema
  - Seven event types: ADD_NODE, MOVE_NODE, DELETE_NODE, SELECT_ELEMENT, PAN_CANVAS, ZOOM_CANVAS, RESET_VIEW
  - Type-safe payloads with comprehensive validation rules
  - Event factory functions for creating well-formed events
  - Utility functions for validation and transformation

### Features

- **Position Validation** - Finite number validation for x/y coordinates with bounds checking
- **Zoom Constraints** - Zoom levels constrained to 0.1x-5.0x range with clamping utilities
- **ViewBox Management** - Canvas viewport state with dimension constraints
- **Node Type Safety** - Strict "document" | "agent" enum validation
- **Event Sourcing Support** - Full undo/redo capability through immutable events
- **Canvas Limits** - Configurable constants for zoom, pan, and viewport constraints

### Canvas Events Covered

- **ADD_NODE** - Node creation with position, type, and optional metadata
- **MOVE_NODE** - Node position updates with from/to coordinates
- **DELETE_NODE** - Node removal with data preservation for undo
- **SELECT_ELEMENT** - Element selection state with multi-select support
- **PAN_CANVAS** - Viewport panning with delta tracking
- **ZOOM_CANVAS** - Zoom level changes with center point tracking
- **RESET_VIEW** - Canvas reset to default state with trigger source

### Integration

- Extends existing EventSchema maintaining consistency
- Compatible with current Canvas component interfaces
- Supports Canvas test fixtures and E2E test scenarios
- Provides foundation for replacing React hooks with event sourcing

### Migration Notes

- Canvas schemas extend base EventSchema with no breaking changes
- Backward compatible with existing event sourcing architecture
- Canvas component can gradually migrate to use these validated events
- Test fixtures already aligned with new schema structures

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
