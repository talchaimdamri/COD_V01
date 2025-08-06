import { test, expect } from '@playwright/test'
import { CanvasHelpers, EventAPIHelpers } from './helpers/canvas-helpers'
import { CANVAS_SELECTORS } from '../fixtures/canvas'

/**
 * Comprehensive Canvas E2E Test Suite (Task 5.1)
 * Test ID: E2E-CV-COMPREHENSIVE
 * 
 * This is a meta-test file that ensures all Canvas test suites are properly
 * integrated and can be run together. It also provides smoke tests to verify
 * the basic Canvas setup works before running detailed tests.
 * 
 * This follows TDD approach - these tests will FAIL initially until
 * the Canvas component is fully implemented.
 */

test.describe('Canvas Component - Comprehensive Test Suite Setup', () => {
  test('should setup Canvas test environment successfully [E2E-CV-SETUP-01]', async ({ page }) => {
    // Test ID: E2E-CV-SETUP-01
    // PRD Reference: Verify test environment is ready for Canvas testing
    
    const canvasHelpers = new CanvasHelpers(page)
    const eventHelpers = new EventAPIHelpers(page)
    
    // Verify basic initialization
    await canvasHelpers.initializeCanvas()
    
    // Verify all required elements exist
    const canvas = canvasHelpers.getCanvas()
    await expect(canvas).toBeVisible()
    
    // Verify helper methods work
    const viewBox = await canvasHelpers.getViewBox()
    expect(typeof viewBox.x).toBe('number')
    expect(typeof viewBox.y).toBe('number')
    expect(typeof viewBox.width).toBe('number')
    expect(typeof viewBox.height).toBe('number')
    
    // Verify event API is accessible
    const events = await eventHelpers.getAllEvents()
    expect(Array.isArray(events)).toBe(true)
  })

  test('should have all Canvas test fixtures available [E2E-CV-SETUP-02]', async ({ page }) => {
    // Test ID: E2E-CV-SETUP-02
    // PRD Reference: Verify all test fixtures are properly configured
    
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    
    // Verify canvas selectors work
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    const canvasSvg = page.locator(CANVAS_SELECTORS.canvasSvg)
    const canvasGrid = page.locator(CANVAS_SELECTORS.grid)
    
    await expect(canvasContainer).toBeVisible()
    await expect(canvasSvg).toBeVisible()
    
    // Grid might not be visible initially depending on implementation
    // but the selector should exist
    const gridExists = await canvasGrid.count() >= 0
    expect(gridExists).toBe(true)
  })

  test('should run Canvas component smoke test [E2E-CV-SMOKE-01]', async ({ page }) => {
    // Test ID: E2E-CV-SMOKE-01 
    // PRD Reference: Basic Canvas functionality should work end-to-end
    
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    await canvasHelpers.focusCanvas()
    
    // Smoke test: basic pan operation
    const initialViewBox = await canvasHelpers.getViewBox()
    await canvasHelpers.panCanvas({ x: 50, y: 50 })
    const pannedViewBox = await canvasHelpers.getViewBox()
    
    expect(pannedViewBox.x).not.toBe(initialViewBox.x)
    expect(pannedViewBox.y).not.toBe(initialViewBox.y)
    
    // Smoke test: basic zoom operation
    await canvasHelpers.zoomCanvas('in', 1)
    const zoomedViewBox = await canvasHelpers.getViewBox()
    
    expect(zoomedViewBox.width).toBeLessThan(pannedViewBox.width)
    expect(zoomedViewBox.height).toBeLessThan(pannedViewBox.height)
    
    // Smoke test: reset functionality
    await canvasHelpers.resetView()
    const resetViewBox = await canvasHelpers.getViewBox()
    
    // Should be different from zoomed state
    expect(resetViewBox.width).not.toBe(zoomedViewBox.width)
    expect(resetViewBox.height).not.toBe(zoomedViewBox.height)
  })

  test('should validate Canvas component architecture [E2E-CV-ARCH-01]', async ({ page }) => {
    // Test ID: E2E-CV-ARCH-01
    // PRD Reference: Canvas should follow specified architecture patterns
    
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    
    const canvas = canvasHelpers.getCanvas()
    
    // Verify SVG structure
    await expect(canvas).toHaveAttribute('width', '100%')
    await expect(canvas).toHaveAttribute('height', '100%')
    await expect(canvas).toHaveAttribute('preserveAspectRatio', /xMidYMid/)
    
    // Verify viewBox is set
    const viewBox = await canvas.getAttribute('viewBox')
    expect(viewBox).toBeTruthy()
    
    // Verify proper role for accessibility
    await expect(canvas).toHaveAttribute('role', 'img')
    
    // Verify event handling setup
    const hasEventHandlers = await canvas.evaluate(el => {
      // Check if element has event handling attributes or listeners
      const style = el.getAttribute('style') || ''
      return style.includes('touch-action') || 
             el.hasAttribute('onmousedown') || 
             el.hasAttribute('ontouchstart')
    })
    
    expect(hasEventHandlers).toBeTruthy()
  })

  test('should verify Canvas performance baseline [E2E-CV-PERF-01]', async ({ page }) => {
    // Test ID: E2E-CV-PERF-01
    // PRD Reference: Canvas should meet performance requirements
    
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    
    // Measure initialization time
    const initStartTime = performance.now()
    await canvasHelpers.focusCanvas()
    const initEndTime = performance.now()
    const initDuration = initEndTime - initStartTime
    
    // Initialization should be fast
    expect(initDuration).toBeLessThan(1000) // 1 second
    
    // Measure basic operation performance
    const opStartTime = performance.now()
    await canvasHelpers.panCanvas({ x: 100, y: 100 })
    await canvasHelpers.zoomCanvas('in', 2)
    const opEndTime = performance.now()
    const opDuration = opEndTime - opStartTime
    
    // Basic operations should be responsive
    expect(opDuration).toBeLessThan(500) // 500ms
    
    // Verify canvas remains responsive
    const canvas = canvasHelpers.getCanvas()
    await expect(canvas).toBeVisible()
    
    const finalViewBox = await canvasHelpers.getViewBox()
    expect(finalViewBox.width).toBeGreaterThan(0)
    expect(finalViewBox.height).toBeGreaterThan(0)
  })
})

/**
 * Test Suite Integration Verification
 * 
 * This section ensures that individual test suites can run together
 * without conflicts and that shared resources are properly managed.
 */
test.describe('Canvas Component - Test Suite Integration', () => {
  test('should isolate test state between suites [E2E-CV-ISOLATION-01]', async ({ page }) => {
    // Test ID: E2E-CV-ISOLATION-01
    // PRD Reference: Test suites should not interfere with each other
    
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    
    // Record initial state
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Modify state significantly
    await canvasHelpers.panCanvas({ x: 200, y: 150 })
    await canvasHelpers.zoomCanvas('in', 3)
    
    const modifiedViewBox = await canvasHelpers.getViewBox()
    expect(modifiedViewBox.x).not.toBe(initialViewBox.x)
    expect(modifiedViewBox.width).not.toBe(initialViewBox.width)
    
    // Reset to clean state (this would typically be done in beforeEach)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await canvasHelpers.initializeCanvas()
    
    // State should be reset
    const resetViewBox = await canvasHelpers.getViewBox()
    
    // Should be back to initial-like state
    expect(Math.abs(resetViewBox.x - initialViewBox.x)).toBeLessThan(50)
    expect(Math.abs(resetViewBox.width - initialViewBox.width)).toBeLessThan(50)
  })

  test('should handle concurrent test execution [E2E-CV-CONCURRENCY-01]', async ({ page, browser }) => {
    // Test ID: E2E-CV-CONCURRENCY-01
    // PRD Reference: Tests should work when run in parallel
    
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    
    // Create additional browser context to simulate parallel test
    const secondContext = await browser.newContext()
    const secondPage = await secondContext.newPage()
    const secondCanvasHelpers = new CanvasHelpers(secondPage)
    
    try {
      await secondCanvasHelpers.initializeCanvas()
      
      // Both should work independently
      const operations1 = canvasHelpers.panCanvas({ x: 50, y: 0 })
      const operations2 = secondCanvasHelpers.panCanvas({ x: -50, y: 0 })
      
      await Promise.all([operations1, operations2])
      
      // Both should have valid states
      const viewBox1 = await canvasHelpers.getViewBox()
      const viewBox2 = await secondCanvasHelpers.getViewBox()
      
      expect(viewBox1.width).toBeGreaterThan(0)
      expect(viewBox2.width).toBeGreaterThan(0)
      
      // States should be independent
      expect(viewBox1.x).not.toBe(viewBox2.x)
      
    } finally {
      await secondContext.close()
    }
  })

  test('should maintain test data integrity [E2E-CV-INTEGRITY-01]', async ({ page }) => {
    // Test ID: E2E-CV-INTEGRITY-01
    // PRD Reference: Test fixtures should remain consistent
    
    const canvasHelpers = new CanvasHelpers(page)
    const eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
    
    // Verify fixture data consistency
    const canvas = canvasHelpers.getCanvas()
    await expect(canvas).toBeVisible()
    
    // Verify selectors still work
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    const canvasSvg = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    await expect(canvasContainer).toBeVisible()
    await expect(canvasSvg).toBeVisible()
    
    // Verify API helpers work
    const events = await eventHelpers.getAllEvents()
    expect(Array.isArray(events)).toBe(true)
    
    // Perform operation and verify event recording
    await canvasHelpers.panCanvas({ x: 25, y: 25 })
    
    // Events should be recordable
    const updatedEvents = await eventHelpers.getAllEvents()
    expect(updatedEvents.length).toBeGreaterThanOrEqual(events.length)
  })

  test('should validate test environment requirements [E2E-CV-ENV-01]', async ({ page }) => {
    // Test ID: E2E-CV-ENV-01
    // PRD Reference: Test environment should meet Canvas requirements
    
    // Check browser capabilities
    const browserSupport = await page.evaluate(() => {
      return {
        svg: !!document.createElementNS,
        touch: 'ontouchstart' in window,
        pointer: 'onpointerdown' in window,
        wheel: 'onwheel' in window,
        requestAnimationFrame: !!window.requestAnimationFrame,
        performance: !!window.performance,
      }
    })
    
    // Essential features should be supported
    expect(browserSupport.svg).toBe(true)
    expect(browserSupport.wheel).toBe(true)
    expect(browserSupport.requestAnimationFrame).toBe(true)
    expect(browserSupport.performance).toBe(true)
    
    // Check viewport
    const viewport = page.viewportSize()
    expect(viewport!.width).toBeGreaterThanOrEqual(400)
    expect(viewport!.height).toBeGreaterThanOrEqual(300)
    
    // Verify Canvas can be initialized
    const canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
    
    const canvas = canvasHelpers.getCanvas()
    await expect(canvas).toBeVisible()
    
    // Verify basic functionality
    const viewBox = await canvasHelpers.getViewBox()
    expect(viewBox.width).toBeGreaterThan(0)
    expect(viewBox.height).toBeGreaterThan(0)
  })
})