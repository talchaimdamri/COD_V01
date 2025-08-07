# Schema Changelog

## Version 1.4.0 (2025-01-07)

### Added

- **Edge Connection System Schemas** - Complete schema layer for Task 7 edge connection system
  - `events/canvas.ts` - Extended with edge event sourcing (CREATE_EDGE, DELETE_EDGE, UPDATE_EDGE_PATH)
  - `api/edges.ts` - Edge component UI schemas for SVG rendering, drag-and-drop, and selection
  - `database/edge.ts` - Edge entity persistence with connection point management
  - Full integration with existing Canvas event sourcing architecture

### Features

- **Edge Events Integration** - Extended canvas events with edge-specific operations
  - CREATE_EDGE event for establishing node connections with bezier/straight/orthogonal types
  - DELETE_EDGE event with undo support preserving connection and style data
  - UPDATE_EDGE_PATH event for dynamic routing when nodes move or paths are edited manually
  - Edge event factory functions and validation utilities
  - Type-safe discriminated unions for all edge event types
- **Edge Component Props** - Comprehensive UI component validation and configuration
  - BezierEdge, StraightEdge, and OrthogonalEdge component prop schemas
  - Drag handles for control points, midpoints, and waypoint editing
  - Edge selection state management with control point visibility
  - Visual state tracking (selected, hovered, dragging, connecting, animated)
  - Connection point detection with snap distance and visual feedback
- **Edge Database Persistence** - Full database entity support with relationship management
  - EdgeEntity schema with source/target node connections and anchor points
  - Flexible metadata storage for edge-specific data and configuration
  - Edge query filters supporting chain, node, and type-based filtering
  - Edge statistics and analytics schemas for usage reporting
  - Soft delete support and optimistic concurrency control
- **Edge Routing and Styling** - Advanced visual configuration and path calculation
  - EdgePath schema supporting bezier curves, straight lines, and orthogonal routing
  - EdgeStyle schema with stroke, opacity, and SVG marker support
  - EdgeLabel schema for text labels with positioning and styling
  - Connection anchor management with input/output/bidirectional types
  - Edge animation configuration for flow, pulse, and dash effects
- **Drag-and-Drop Edge Creation** - Interactive edge creation workflow support
  - EdgeCreationState schema for managing active edge creation process
  - Connection point validation and compatibility checking
  - Preview edge styling during creation with real-time visual feedback
  - Snap-to-anchor detection with configurable distance thresholds

### Schema Integration

- **Canvas Event Sourcing** - Seamless integration with existing event architecture
  - Extends CanvasEventSchema union with all edge event types
  - Maintains consistency with Position and NodeType schemas from canvas
  - Compatible with existing undo/redo functionality through event sourcing
  - Event factory functions follow established patterns for type safety
- **Database Relationship Support** - Proper foreign key relationships and constraints
  - EdgeEntity integrates with existing chain structure via chainId
  - Source/target node references with cascade delete behavior
  - Connection anchor validation ensuring referential integrity
  - Metadata sanitization preventing invalid data storage
- **UI Component Architecture** - Extends existing node component patterns
  - Reuses PositionSchema and coordinate systems from canvas events
  - Follows same factory pattern as NodePropsFactory for consistency
  - Compatible with existing visual state management patterns
  - Integrates with drag-and-drop system used by nodes

### Edge System Constants

- **CANVAS_LIMITS.EDGE** - Edge-specific validation constants
  - Stroke width limits (1-10px) with 2px default
  - Label font size constraints (8-24px) with 12px default  
  - Control point distance limits and minimum edge length validation
  - Performance optimization thresholds for large edge counts
- **Edge Type Safety** - Runtime validation and compile-time checking
  - EdgeType enum: 'bezier' | 'straight' | 'orthogonal' 
  - Connection type validation: 'input' | 'output' | 'bidirectional'
  - Edge interaction event types with modifier key support
  - Comprehensive error messages for validation failures

### Migration Notes

- Edge schemas extend existing Canvas and NodeType schemas with no breaking changes
- Backward compatible with all existing event sourcing and database operations
- EdgeEntity can be gradually integrated into existing chain operations
- Connection points build on existing node anchor patterns from UI components
- Edge routing algorithms can be enhanced without schema changes

## Version 1.3.0 (2025-01-07)

### Added

- **Node Component Schemas** - Comprehensive UI component validation for DocumentNode and AgentNode
  - `api/nodes.ts` - Complete schema layer for node component props, states, and interactions
  - Visual state management schemas (selection, hover, dragging, focus)
  - Drag behavior state tracking with position and constraint handling
  - Grid snapping and collision detection configuration schemas
  - Color scheme validation for all node visual states
  - Animation configuration for smooth transitions

### Features

- **DocumentNode Props** - Full validation for document node component properties
  - Rounded rectangle dimensions with border radius validation
  - Document-specific data schemas (content, status, word count)
  - Status-based visual indicators (draft, review, published)
  - Selection and hover state management
- **AgentNode Props** - Complete validation for agent node component properties
  - Hexagonal shape with configurable radius
  - Agent-specific data schemas (model, prompt, temperature, status)
  - Processing animation configuration and status indicators
  - CPU/processor icon positioning and styling
- **Interaction Schemas** - Mouse, touch, and keyboard event validation
  - Drag gesture configuration with distance and duration limits
  - Multi-touch and modifier key support
  - Accessibility compliance with focus and keyboard navigation
- **Visual State Management** - Comprehensive state tracking for node appearance
  - Selection state with multi-select support
  - Hover effects with connection point visibility
  - Drag state with smooth position interpolation
  - Focus management for keyboard navigation
- **Grid and Collision Systems** - Positioning and constraint validation
  - Grid snap configuration with size and threshold settings
  - Collision detection with minimum distance and buffer settings
  - Boundary constraints to prevent nodes from leaving viewport
  - Performance optimization settings for large node counts

### Schema Validation

- **Component Props** - Full runtime validation with detailed error reporting
- **Factory Functions** - Utilities for creating well-formed node props with defaults
- **Type Guards** - Runtime type checking for DocumentNode vs AgentNode props
- **Visual State Validation** - Ensures consistent appearance across all node states

### Integration Support

- **Test Fixture Compatibility** - Schemas align with existing test fixture structures
- **Canvas Event Integration** - Works seamlessly with canvas event sourcing system
- **Database Schema Alignment** - Node data schemas extend existing database entities
- **API Layer Support** - Provides validation for API requests involving node operations

### Migration Notes

- Node component schemas extend existing Position and NodeType from canvas events
- Backward compatible with all existing fixture data and test scenarios
- No breaking changes to existing database or event schemas
- Gradual migration path for replacing hardcoded component props with validated schemas

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
