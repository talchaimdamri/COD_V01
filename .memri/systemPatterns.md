# System Architecture Patterns

## Core Patterns Established

### 1. Event-Sourced State Management

**Pattern**: Immutable event log with derived state
**Implementation**: Event sourcing throughout the application
**Benefits**: 
- Complete audit trail
- Undo/redo capabilities
- State reconstruction
- Time-travel debugging

**Usage**: Applied to Canvas interactions, sidebar state, and document editing

### 2. Schema-Driven Development  

**Pattern**: Zod schemas as single source of truth for data contracts
**Implementation**: Comprehensive schema validation
**Benefits**:
- Type safety at runtime
- Consistent API contracts
- Automatic validation
- Self-documenting data structures

**Key Schemas**:
- `schemas/api/sidebar.ts` - Sidebar data structures
- `schemas/events/sidebar.ts` - Event sourcing schemas
- Component prop validation throughout

### 3. Performance-First Component Design

**Pattern**: Optimization built into component architecture
**Implementation**: 
- Virtualized rendering for large datasets
- Viewport culling for canvas operations
- Frame monitoring for performance tracking
- Memory optimization strategies

**Examples**:
- `VirtualizedSidebarList` with @tanstack/react-virtual
- Canvas performance optimizations in `canvasPerformance.ts`
- Event batching for high-frequency operations

### 4. TDD-Driven Component Development

**Pattern**: Test-first development with comprehensive coverage
**Implementation**:
- Happy path tests define expected behavior
- Edge case tests handle error conditions
- Integration tests validate component interactions
- Performance tests ensure optimization targets

**Test Categories**:
- Unit tests for individual components
- Integration tests for system interactions
- Performance benchmarks for optimization validation
- Accessibility tests for compliance

### 5. Modular Integration Architecture

**Pattern**: Loosely coupled components with clear interfaces
**Implementation**:
- Component composition over inheritance
- Props-based configuration
- Event-driven communication
- Dependency injection for services

**Examples**:
- Sidebar sections as composable components
- Canvas node types as pluggable modules
- Event sourcing as injectable service

## Task 8 Specific Patterns Introduced

### 6. Virtualized List Performance Pattern

**Pattern**: High-performance list rendering for large datasets
**Implementation**: @tanstack/react-virtual integration
**Key Features**:
- Dynamic height calculation
- Item recycling for memory efficiency
- Smooth scrolling with large datasets
- Performance monitoring integration

**Application**: Sidebar sections with 1000+ items

### 7. Drag-and-Drop Integration Pattern

**Pattern**: Native HTML5 drag-and-drop with visual feedback
**Implementation**: 
- Drag source components with data transfer
- Drop target validation and feedback
- Visual indicators during drag operations
- Integration with event sourcing for state updates

**Usage**: Sidebar to Canvas item transfer

### 8. Sidebar State Management Pattern

**Pattern**: Centralized sidebar state with event sourcing integration
**Implementation**:
- State derivation from event streams
- Optimistic updates with rollback capability
- Batch operations for performance
- Persistent user preferences

**Features**:
- Collapse/expand state persistence
- Search and filter state management
- Selection and focus management
- Resize behavior with constraints

### 9. API Integration Pattern

**Pattern**: Schema-validated RESTful API with event sourcing
**Implementation**:
- CRUD operations with validation
- Event emission for state changes
- Error handling with rollback
- Performance optimization with caching

**Endpoints**: Complete sidebar data management API

### 10. Canvas-Sidebar Integration Pattern

**Pattern**: Bidirectional communication between major UI components
**Implementation**:
- Event-driven state synchronization
- Performance optimization during interactions
- Consistent data flow patterns
- Undo/redo integration across components

**Features**:
- Drag-and-drop item creation
- Canvas performance monitoring during sidebar operations
- State synchronization through event sourcing

## Architecture Decision Records

### ADR-001: Virtualization Library Selection
**Decision**: @tanstack/react-virtual over react-window
**Reasoning**: Better TypeScript support, more flexible API, active maintenance
**Impact**: Superior performance with large datasets, better developer experience

### ADR-002: Drag-and-Drop Implementation
**Decision**: HTML5 Drag-and-Drop API over custom implementation
**Reasoning**: Native performance, accessibility support, standard browser behavior
**Impact**: Better performance, reduced bundle size, improved accessibility

### ADR-003: Event Sourcing Integration
**Decision**: Full integration with existing event sourcing system
**Reasoning**: Consistency with application architecture, undo/redo support
**Impact**: Unified state management, comprehensive audit trail

### ADR-004: Schema Validation Strategy  
**Decision**: Runtime Zod validation throughout the stack
**Reasoning**: Type safety, self-documenting APIs, runtime validation
**Impact**: Reduced bugs, better API contracts, improved developer experience

---

**Established**: August 10, 2025  
**Last Updated**: August 10, 2025
**Review Frequency**: Before major architectural changes
EOF < /dev/null