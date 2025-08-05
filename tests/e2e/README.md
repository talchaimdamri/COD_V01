# Canvas Component E2E Test Suite

## Overview

This directory contains comprehensive End-to-End (E2E) tests for the Canvas component using Playwright. The tests follow strict Test-Driven Development (TDD) methodology and will initially fail since the Canvas component doesn't exist yet.

## Test Structure

### Core Test Files

- **`canvas.spec.ts`** - Main comprehensive test suite covering all Canvas functionality
- **`canvas-basic.spec.ts`** - Basic setup tests for configuration validation
- **`helpers/canvas-helpers.ts`** - Reusable helper functions and utilities
- **`types/canvas.types.ts`** - TypeScript type definitions for type safety
- **`../fixtures/canvas.ts`** - Test data fixtures and constants

## Test Coverage

### 🎯 E2E-CV-01: Add Document Node
- **Flow**: Open `/`, click _Doc_ button
- **Outcome**: New circle visible; sidebar lists doc
- **Tests**:
  - Document node creation and visibility
  - Sidebar integration
  - Unique ID generation
  - Default positioning

### 🎯 E2E-CV-02: Drag Node  
- **Flow**: Drag circle to (x,y)
- **Outcome**: Circle renders at new pos; event arrives in `/events` stream
- **Tests**:
  - Mouse drag functionality
  - Position updates
  - Event sourcing integration
  - Visual feedback during drag
  - Boundary constraints

### 🎨 Canvas Initialization
- SVG container rendering
- Grid pattern display
- Viewport configuration
- Proper dimensions and viewBox

### 🔄 Pan and Zoom
- Mouse drag panning on empty space
- Mouse wheel zooming
- Zoom limits and boundaries
- Zoom to cursor position

### ⌨️ Keyboard Shortcuts
- Arrow keys for panning
- `+`/`-` keys for zoom
- `R` key for reset view
- Modifier key combinations

### 📱 Touch and Mouse Interactions
- Touch pan gestures
- Pinch zoom (mobile)
- Double-click zoom to fit
- Proper touch-action CSS

### 📡 Event Sourcing Integration
- ADD_NODE events on creation
- MOVE_NODE events on drag
- Event ordering and timestamps
- User context in events
- Undo/Redo functionality

### ♿ Accessibility and Performance
- ARIA labels and attributes
- Keyboard navigation
- Color contrast validation
- Performance with many nodes
- 60fps animation targets
- Memory usage monitoring

## Test Organization

```
tests/e2e/
├── canvas.spec.ts           # Main comprehensive test suite
├── canvas-basic.spec.ts     # Basic configuration tests
├── helpers/
│   └── canvas-helpers.ts    # Utility functions and classes
├── types/
│   └── canvas.types.ts      # TypeScript type definitions
└── README.md               # This documentation
```

## Helper Classes

### CanvasHelpers
- Canvas initialization and interaction
- Node creation and manipulation
- Pan/zoom operations
- Coordinate calculations

### EventAPIHelpers  
- Event API integration testing
- Event polling and verification
- Event structure validation
- Event filtering and matching

### AnimationHelpers
- Animation performance measurement
- CSS animation waiting
- Frame rate monitoring

### AccessibilityHelpers
- ARIA attribute verification
- Keyboard navigation testing
- Color contrast checking

### PerformanceHelpers
- Operation timing measurement
- Load testing with multiple nodes
- Memory usage monitoring

## Test Fixtures

The `../fixtures/canvas.ts` file provides:

- **CANVAS_CONFIG**: Dimensions, zoom limits, pan settings
- **CANVAS_SELECTORS**: Consistent element selectors
- **mockNodes**: Sample node data for testing
- **mockEvents**: Sample event payloads
- **testPositions**: Standard coordinate test data
- **keyboardShortcuts**: Key mapping definitions
- **testUtils**: Data generation utilities

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific Canvas tests
npx playwright test tests/e2e/canvas.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run in headed mode to see browser
npx playwright test --headed

# Generate test report
npx playwright test --reporter=html
```

## TDD Approach

These tests are designed to **fail initially** as part of the TDD methodology:

1. ✅ **Red Phase**: Tests fail because Canvas component doesn't exist
2. 🟡 **Green Phase**: Implement minimal Canvas to make tests pass
3. 🔵 **Refactor Phase**: Improve implementation while keeping tests green

## Expected Test Failures

Until the Canvas component is implemented, expect these failures:

- ❌ Canvas SVG element not found
- ❌ Document creation buttons not found  
- ❌ Node elements not rendered
- ❌ Event API endpoints not responding
- ❌ Keyboard shortcuts not implemented

## Test Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Web Server**: Starts with `npm run dev`
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI

## Key Testing Patterns

### Event Sourcing Verification
```typescript
// Wait for and verify API events
const event = await eventHelpers.waitForEvent('ADD_NODE')
expect(event.type).toBe('ADD_NODE')
expect(event.payload.nodeId).toBeTruthy()
```

### Canvas Coordinate Testing
```typescript
// Test node positioning
const position = await canvasHelpers.getNodePosition(node)
expect(position.x).toBeGreaterThan(0)
expect(position.y).toBeGreaterThan(0)
```

### Performance Measurement
```typescript
// Measure operation timing
const timing = await performanceHelpers.measureTiming(async () => {
  await canvasHelpers.createDocumentNode()
})
expect(timing).toBeLessThan(500) // Should be fast
```

## Maintenance Notes

- Keep test selectors consistent with actual implementation
- Update fixtures when data models change  
- Maintain helper functions for reusability
- Monitor test performance and stability
- Update type definitions as Canvas evolves

## Related Documentation

- [Comprehensive Test Plan](../../docs/comprehensive_test_plan.md)
- [Canvas Component Specification](../../docs/ui_specification.md)
- [Event Sourcing Architecture](../../docs/technology_stack_specification.md)