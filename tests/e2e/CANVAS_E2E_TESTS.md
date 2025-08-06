# Canvas Component E2E Tests - Task 5.1

## Overview

This document describes the comprehensive End-to-End test suite for the SVG Canvas component, following Test-Driven Development (TDD) principles. The tests are designed to **FAIL INITIALLY** as the Canvas component implementation is not yet complete.

## Test Organization

### File Structure
```
tests/e2e/
├── canvas-rendering.spec.ts        # Basic rendering and initialization
├── canvas-pan-zoom.spec.ts         # Pan/zoom functionality
├── canvas-keyboard.spec.ts         # Keyboard navigation
├── canvas-events.spec.ts           # Event sourcing integration
├── canvas-errors.spec.ts           # Error handling scenarios
├── canvas-edge-cases.spec.ts       # Edge cases and boundaries
├── canvas-comprehensive.spec.ts    # Integration and smoke tests
├── helpers/
│   └── canvas-helpers.ts           # Reusable test utilities
├── types/
│   └── canvas.types.ts             # Type definitions
└── fixtures/
    └── canvas.ts                   # Test data and configurations
```

## Test Categories

### 1. Canvas Rendering Tests (`canvas-rendering.spec.ts`)
**Test ID Range: E2E-CV-RENDER-01 to E2E-CV-RENDER-06**

- **Canvas Component Rendering**
  - SVG container setup and display
  - Background grid pattern (8px) rendering
  - Proper viewport configuration
  - Initial state verification
  - Responsive dimensions
  - Error-free rendering

**Key Test Cases:**
- `E2E-CV-RENDER-01`: SVG container with proper attributes
- `E2E-CV-RENDER-02`: 8px grid pattern rendering
- `E2E-CV-RENDER-03`: Proper canvas viewport setup
- `E2E-CV-RENDER-04`: Default view state initialization
- `E2E-CV-RENDER-05`: Error-free browser console
- `E2E-CV-RENDER-06`: Responsive canvas dimensions

### 2. Pan/Zoom Functionality Tests (`canvas-pan-zoom.spec.ts`)
**Test ID Range: E2E-CV-PAN-01 to E2E-CV-TOUCH-04**

- **Pan Functionality**
  - Mouse drag panning on empty space
  - Visual feedback during pan operations
  - Pan boundary constraints
  - Performance during rapid panning

- **Zoom Functionality** 
  - Mouse wheel zoom in/out
  - Zoom to cursor position
  - Zoom limit enforcement
  - Aspect ratio maintenance
  - Smooth zoom performance

- **Touch Gestures**
  - Single-finger pan gestures
  - Browser zoom prevention
  - Pinch-to-zoom handling
  - Touch performance optimization

**Key Test Cases:**
- `E2E-CV-PAN-01`: Mouse drag panning
- `E2E-CV-ZOOM-01`: Mouse wheel zoom
- `E2E-CV-ZOOM-02`: Zoom to cursor position
- `E2E-CV-TOUCH-01`: Touch pan gestures
- `E2E-CV-TOUCH-02`: Browser zoom prevention

### 3. Keyboard Navigation Tests (`canvas-keyboard.spec.ts`)
**Test ID Range: E2E-CV-KEY-PAN-01 to E2E-CV-KEY-A11Y-04**

- **Keyboard Pan Navigation**
  - Arrow keys for directional panning
  - Consistent pan step sizes
  - Rapid keyboard input handling
  - Pan boundary respect

- **Keyboard Zoom Controls**
  - +/- keys for zoom in/out
  - Zoom center maintenance
  - Zoom limit enforcement
  - Modifier key combinations

- **Reset and View Controls**
  - R key for view reset
  - Ctrl+0 alternative reset
  - No interference with form inputs

- **Accessibility Features**
  - Keyboard focusability
  - Shortcut help availability
  - Focus maintenance
  - Error-free keyboard operations

**Key Test Cases:**
- `E2E-CV-KEY-PAN-01`: Arrow key panning
- `E2E-CV-KEY-ZOOM-01`: +/- key zooming
- `E2E-CV-KEY-RESET-01`: R key view reset
- `E2E-CV-KEY-A11Y-01`: Keyboard accessibility

### 4. Event Sourcing Integration Tests (`canvas-events.spec.ts`)
**Test ID Range: E2E-CV-EVENT-01 to E2E-CV-UNDO-05**

- **Event Recording**
  - PAN_CANVAS event generation
  - ZOOM_CANVAS event generation
  - RESET_VIEW event generation
  - User context inclusion
  - Event ordering maintenance
  - Rapid event handling

- **State Persistence**
  - State persistence across page reloads
  - Event log reconstruction
  - State conflict resolution

- **Undo/Redo Functionality**
  - Undo operations (Ctrl+Z)
  - Redo operations (Ctrl+Y)
  - Multiple undo/redo sequences
  - UI availability indicators
  - Undo/redo stack limits

**Key Test Cases:**
- `E2E-CV-EVENT-01`: PAN_CANVAS event recording
- `E2E-CV-PERSIST-01`: State persistence across reloads
- `E2E-CV-UNDO-01`: Undo operations
- `E2E-CV-UNDO-02`: Redo operations

### 5. Error Handling Tests (`canvas-errors.spec.ts`)
**Test ID Range: E2E-CV-ERROR-01 to E2E-CV-ERROR-13**

- **Network and API Errors**
  - API unavailability handling
  - Error message display
  - Operation retry mechanisms
  - Malformed response handling

- **Input Validation**
  - Invalid coordinate inputs
  - Extreme zoom value prevention
  - Memory leak prevention
  - Recovery from temporary hangs

- **Browser Compatibility**
  - Viewport resize handling
  - Focus loss recovery
  - JavaScript degradation
  - Concurrent session handling
  - Malicious input protection

**Key Test Cases:**
- `E2E-CV-ERROR-01`: API unavailability graceful handling
- `E2E-CV-ERROR-05`: Invalid coordinate input validation
- `E2E-CV-ERROR-07`: Memory leak prevention
- `E2E-CV-ERROR-09`: Viewport resize handling

### 6. Edge Cases Tests (`canvas-edge-cases.spec.ts`) 
**Test ID Range: E2E-CV-EDGE-01 to E2E-CV-EDGE-16**

- **Extreme Zoom and Coordinates**
  - Maximum zoom level handling
  - Minimum zoom level handling
  - Extreme coordinate values
  - Fractional coordinate precision

- **Performance and Stress**
  - Rapid successive operations
  - Long interaction sessions
  - Simultaneous pan/zoom operations
  - Page transition handling

- **Viewport and Responsive**
  - Very small viewport sizes
  - Very large viewport sizes
  - Rapid viewport size changes
  - Extreme aspect ratios

- **Interaction Edge Cases**
  - Mouse events at canvas boundaries
  - Interrupted drag operations
  - Zero-distance drag operations
  - Rapid click sequences

**Key Test Cases:**
- `E2E-CV-EDGE-01`: Maximum zoom levels
- `E2E-CV-EDGE-05`: Rapid successive operations
- `E2E-CV-EDGE-09`: Very small viewport sizes
- `E2E-CV-EDGE-13`: Canvas boundary interactions

### 7. Comprehensive Integration Tests (`canvas-comprehensive.spec.ts`)
**Test ID Range: E2E-CV-SETUP-01 to E2E-CV-ENV-01**

- **Test Suite Setup**
  - Canvas test environment verification
  - Test fixture availability
  - Basic smoke tests
  - Architecture validation
  - Performance baseline

- **Test Integration**
  - State isolation between test suites
  - Concurrent test execution
  - Test data integrity
  - Environment requirement validation

## Test Infrastructure

### Helper Classes

#### CanvasHelpers
```typescript
class CanvasHelpers {
  async initializeCanvas(): Promise<void>
  getCanvas(): Locator
  async getCanvasBounds(): Promise<Bounds>
  async getViewBox(): Promise<ViewBox>
  async createDocumentNode(position?: Position): Promise<Locator>
  async panCanvas(offset: Position): Promise<void>
  async zoomCanvas(direction: 'in' | 'out', steps?: number): Promise<void>
  async resetView(): Promise<void>
  async focusCanvas(): Promise<void>
}
```

#### EventAPIHelpers
```typescript
class EventAPIHelpers {
  async getAllEvents(): Promise<any[]>
  async getEventsByType(eventType: string): Promise<any[]>
  async waitForEvent(eventType: string, timeout?: number): Promise<any>
  verifyEventStructure(event: any): void
}
```

#### Performance and Accessibility Helpers
- `PerformanceHelpers`: Memory and timing measurements
- `AccessibilityHelpers`: ARIA validation and keyboard navigation
- `AnimationHelpers`: Animation performance and completion

### Test Fixtures

#### CANVAS_SELECTORS
```typescript
const CANVAS_SELECTORS = {
  canvas: '[data-testid=\"canvas\"]',
  canvasSvg: '[data-testid=\"canvas-svg\"]',
  grid: '[data-testid=\"canvas-grid\"]',
  canvasNode: '[data-testid=\"canvas-node\"]',
  // ... additional selectors
}
```

#### CANVAS_CONFIG
```typescript
const CANVAS_CONFIG = {
  dimensions: { width: 800, height: 600, centerX: 400, centerY: 300 },
  zoom: { min: 0.1, max: 10.0, default: 1.0, step: 0.1 },
  pan: { step: 50, boundary: 10000 },
  grid: { size: 20, majorEvery: 5 },
  // ... additional configuration
}
```

## Running the Tests

### Prerequisites
- Node.js 20+
- Playwright installed and configured
- Development server running on http://localhost:3000
- API server running on http://localhost:3001

### Execution Commands

```bash
# Run all Canvas E2E tests
npx playwright test tests/e2e/canvas-*.spec.ts

# Run specific test suite
npx playwright test tests/e2e/canvas-rendering.spec.ts

# Run tests with headed browser (for debugging)
npx playwright test tests/e2e/canvas-*.spec.ts --headed

# Run tests in specific browser
npx playwright test tests/e2e/canvas-*.spec.ts --project=chromium

# Generate test report
npx playwright test tests/e2e/canvas-*.spec.ts --reporter=html
```

### Test Configuration

Tests are configured in `playwright.config.ts` with:
- Base URL: http://localhost:3000
- Retry policy: 2 retries on CI, 0 locally
- Parallel execution enabled
- Multiple browser support (Chromium, Firefox, WebKit)
- Trace collection on retry

## Expected Initial Results

### ❌ All Tests Should FAIL Initially

Since this follows TDD methodology:

1. **Rendering Tests**: Fail because Canvas component doesn't exist yet
2. **Pan/Zoom Tests**: Fail because interaction handlers are not implemented
3. **Keyboard Tests**: Fail because keyboard event listeners are not set up
4. **Event Tests**: Fail because event sourcing integration is not complete
5. **Error Tests**: Fail because error handling is not implemented
6. **Edge Case Tests**: Fail because boundary conditions are not handled

### Test Development Cycle

1. **Red Phase**: All tests fail (current state)
2. **Green Phase**: Implement Canvas component to make tests pass
3. **Refactor Phase**: Optimize and improve implementation while keeping tests passing

## Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: ≥90% line coverage for business logic
- **Integration Tests**: All API endpoints with happy/error paths
- **E2E Tests**: Critical user journeys covered
- **Schema Validation**: Every Zod schema with type inference tests

### Test Quality Standards
- Files ≤200 LOC for maintainability
- Separated concerns (happy path, errors, edge cases)
- Parameterized testing with test.each()
- Centralized fixtures in `tests/fixtures/`
- Clear naming: \"should <verb> when <condition>\"
- Deterministic execution (no flaky tests)

## Integration with CI/CD

### Test Pipeline
1. **Lint and Type Check**: ESLint + TypeScript validation
2. **Unit Tests**: Vitest execution with coverage
3. **Integration Tests**: API tests with test database
4. **E2E Tests**: Playwright execution across browsers
5. **Coverage Gate**: Fail if coverage below thresholds

### Artifacts
- Test reports (HTML format)
- Coverage reports
- Screenshots/videos for failed E2E tests
- Performance metrics
- Accessibility audit results

## Maintenance and Updates

### Regular Updates Required
- Update selectors when UI changes
- Adjust performance thresholds based on metrics
- Add new test cases for new features
- Update fixtures when data structures change
- Review and update error scenarios

### Test Health Monitoring
- Track test execution time trends
- Monitor flaky test incidents
- Review coverage trends
- Update browser compatibility matrix
- Performance regression detection

## Contributing

### Adding New Tests
1. Follow established naming conventions
2. Use appropriate test ID format (E2E-CV-CATEGORY-NN)
3. Reference PRD requirements in comments
4. Keep tests ≤200 LOC
5. Use centralized fixtures and helpers
6. Include both positive and negative scenarios

### Test Debugging
1. Run tests with `--headed` flag for visual debugging
2. Use `page.pause()` for interactive debugging
3. Check browser console for errors
4. Verify selectors with `page.locator().highlight()`
5. Use trace viewer for detailed execution analysis

---

*This test suite is part of Task 5.1: Canvas component E2E testing implementation following TDD methodology. All tests are expected to fail initially and should guide the Canvas component implementation.*"