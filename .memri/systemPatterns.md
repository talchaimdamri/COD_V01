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

## Task 9 Specific Patterns Introduced

### 11. React Hook Form Integration Pattern

**Pattern**: Comprehensive form management with Zod validation and optimal timing
**Implementation**: React Hook Form + @hookform/resolvers/zod integration
**Key Features**:
- Form state management with `data-valid`, `data-dirty`, `data-validating` attributes
- Optimal validation timing with `mode: 'onSubmit'` and `reValidateMode: 'onChange'`
- Real-time validation feedback with debounced input handling
- Zod schema integration for runtime type safety

**Application**: AgentConfigForm component for agent property editing

### 12. Inspector Panel Animation Pattern

**Pattern**: Context-sensitive slide panel with CSS transition animations
**Implementation**: CSS-based slide-in/slide-out animations from right side
**Key Features**:
- Smooth slide animations with backdrop overlay
- Proper z-index layering and click-outside-to-close functionality
- Responsive design with state management
- Integration with form components

**Usage**: Inspector panel for agent configuration interface

### 13. Form Validation Timing Pattern

**Pattern**: Solved complex React Hook Form validation timing for immediate feedback
**Implementation**: Strategic validation mode configuration and trigger patterns
**Technical Breakthrough**: 
- `mode: 'onSubmit'` prevents premature validation errors
- `reValidateMode: 'onChange'` provides real-time feedback after initial interaction
- Manual `trigger()` calls for forms with valid default values
- Debounced validation for optimal performance

**Achievement**: Form Initialization tests 4/5 passing (major improvement from 0/5)

### 14. Component Integration Pattern

**Pattern**: Seamless integration between panel and form components
**Implementation**: Props-based configuration with event-driven communication
**Key Features**:
- InspectorPanel + AgentConfigForm data flow integration
- Form state propagation through component hierarchy
- Event-driven form submission and state updates
- Consistent error handling and validation messaging

**Benefits**: Modular, testable, and maintainable component architecture

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

### ADR-005: React Hook Form Library Selection (Task 9)
**Decision**: React Hook Form over Formik for form management
**Reasoning**: Superior TypeScript support, better performance, smaller bundle size, more flexible validation
**Impact**: Improved developer experience, better form validation performance, easier maintenance

### ADR-006: Form Validation Timing Strategy (Task 9)
**Decision**: `mode: 'onSubmit'` with `reValidateMode: 'onChange'` configuration
**Reasoning**: Prevents premature validation errors while providing real-time feedback after interaction
**Impact**: Optimal user experience, solved complex timing issues, 4/5 Form Initialization tests passing

### ADR-007: Inspector Panel Animation Implementation (Task 9)
**Decision**: CSS transitions over Framer Motion for slide animations
**Reasoning**: Simpler implementation, better performance, no additional dependencies, sufficient for requirements
**Impact**: Reduced bundle size, smoother animations, easier maintenance

### ADR-008: Component Integration Architecture (Task 9)
**Decision**: Props-based configuration with event-driven form state communication
**Reasoning**: Consistent with existing patterns, testable, maintainable, clear data flow
**Impact**: Seamless component integration, easier testing, better maintainability

---

**Established**: August 10, 2025  
**Last Updated**: August 10, 2025 - Task 9.2 React Hook Form Integration Patterns Added
**Review Frequency**: Before major architectural changes
**Recent Additions**: Task 9 Inspector Panel and Form Management patterns (ADR-005 through ADR-008)