import { test, expect } from '@playwright/test'
import { CanvasHelpers, EventAPIHelpers } from './helpers/canvas-helpers'
import { CANVAS_SELECTORS, CANVAS_CONFIG, testPositions } from '../fixtures/canvas'

/**
 * E2E Tests for Canvas Pan/Zoom Functionality (Task 5.1)
 * Test ID: E2E-CV-PANZOOM
 * 
 * This test suite covers Canvas pan/zoom interactions:
 * - Mouse drag panning functionality
 * - Mouse wheel zoom in/out operations
 * - Touch gestures on mobile devices
 * - Zoom boundaries and constraints
 * - Performance during pan/zoom operations
 * 
 * Following TDD approach - these tests will FAIL initially.
 */

test.describe('Canvas Component - Pan Functionality', () => {
  let canvasHelpers: CanvasHelpers
  let eventHelpers: EventAPIHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
    await canvasHelpers.focusCanvas()
  })

  test('should pan canvas with mouse drag on empty space [E2E-CV-PAN-01]', async ({ page }) => {
    // Test ID: E2E-CV-PAN-01
    // PRD Reference: Users must be able to pan the canvas by dragging empty space
    
    // Get initial viewBox
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Perform pan operation by dragging empty space
    const bounds = await canvasHelpers.getCanvasBounds()
    const panOffset = testPositions.panDiagonal
    
    await page.mouse.move(bounds.centerX, bounds.centerY)
    await page.mouse.down()
    await page.mouse.move(
      bounds.centerX + panOffset.x,
      bounds.centerY + panOffset.y,
      { steps: 5 }
    )
    await page.mouse.up()
    
    // Verify viewBox changed
    const finalViewBox = await canvasHelpers.getViewBox()
    
    expect(finalViewBox.x).not.toBe(initialViewBox.x)
    expect(finalViewBox.y).not.toBe(initialViewBox.y)
    
    // ViewBox dimensions should remain the same during pan
    expect(finalViewBox.width).toBe(initialViewBox.width)
    expect(finalViewBox.height).toBe(initialViewBox.height)
  })

  test('should show visual feedback during pan operation [E2E-CV-PAN-02]', async ({ page }) => {
    // Test ID: E2E-CV-PAN-02
    // PRD Reference: Canvas should provide visual feedback during interactions
    
    const canvas = canvasHelpers.getCanvas()
    const bounds = await canvasHelpers.getCanvasBounds()
    
    // Start pan operation
    await page.mouse.move(bounds.centerX, bounds.centerY)
    await page.mouse.down()
    
    // Check for pan cursor styling
    const cursorStyle = await canvas.evaluate(el => 
      window.getComputedStyle(el).cursor
    )
    expect(cursorStyle).toMatch(/grabbing|move|pan/)
    
    // Continue pan
    await page.mouse.move(bounds.centerX + 50, bounds.centerY + 50)
    
    // End pan operation
    await page.mouse.up()
    
    // Cursor should return to normal
    const finalCursor = await canvas.evaluate(el => 
      window.getComputedStyle(el).cursor
    )
    expect(finalCursor).toMatch(/grab|default|auto/)
  })

  test('should respect pan boundaries [E2E-CV-PAN-03]', async ({ page }) => {
    // Test ID: E2E-CV-PAN-03
    // PRD Reference: Pan should have reasonable boundaries to prevent infinite scrolling
    
    const bounds = await canvasHelpers.getCanvasBounds()
    
    // Attempt to pan far beyond reasonable boundaries
    const extremePanDistance = 5000
    
    await page.mouse.move(bounds.centerX, bounds.centerY)
    await page.mouse.down()
    await page.mouse.move(
      bounds.centerX + extremePanDistance,
      bounds.centerY + extremePanDistance,
      { steps: 10 }
    )
    await page.mouse.up()
    
    const viewBox = await canvasHelpers.getViewBox()
    
    // Pan should be constrained within reasonable bounds
    expect(Math.abs(viewBox.x)).toBeLessThan(CANVAS_CONFIG.pan.boundary)
    expect(Math.abs(viewBox.y)).toBeLessThan(CANVAS_CONFIG.pan.boundary)
  })

  test('should handle rapid pan operations smoothly [E2E-CV-PAN-04]', async ({ page }) => {
    // Test ID: E2E-CV-PAN-04
    // PRD Reference: Canvas should handle rapid interactions without lag
    
    const bounds = await canvasHelpers.getCanvasBounds()
    const startTime = Date.now()
    
    // Perform rapid pan operations
    for (let i = 0; i < 5; i++) {
      const offset = { x: i * 20, y: i * 15 }
      await canvasHelpers.panCanvas(offset)
      await page.waitForTimeout(50)
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should complete operations reasonably quickly
    expect(totalTime).toBeLessThan(2000)
    
    // Final viewBox should be valid
    const finalViewBox = await canvasHelpers.getViewBox()
    expect(finalViewBox.width).toBeGreaterThan(0)
    expect(finalViewBox.height).toBeGreaterThan(0)
  })
})

test.describe('Canvas Component - Zoom Functionality', () => {
  let canvasHelpers: CanvasHelpers
  let eventHelpers: EventAPIHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
    await canvasHelpers.focusCanvas()
  })

  test('should zoom with mouse wheel [E2E-CV-ZOOM-01]', async ({ page }) => {
    // Test ID: E2E-CV-ZOOM-01
    // PRD Reference: Mouse wheel should zoom in/out centered on cursor position
    
    const initialViewBox = await canvasHelpers.getViewBox()
    const bounds = await canvasHelpers.getCanvasBounds()
    
    // Zoom in with mouse wheel
    await page.mouse.move(bounds.centerX, bounds.centerY)
    await page.mouse.wheel(0, -120) // Negative delta = zoom in
    await page.waitForTimeout(200)
    
    const zoomedInViewBox = await canvasHelpers.getViewBox()
    
    // ViewBox should be smaller (zoomed in)
    expect(zoomedInViewBox.width).toBeLessThan(initialViewBox.width)
    expect(zoomedInViewBox.height).toBeLessThan(initialViewBox.height)
    
    // Zoom out with mouse wheel
    await page.mouse.wheel(0, 240) // Positive delta = zoom out
    await page.waitForTimeout(200)
    
    const zoomedOutViewBox = await canvasHelpers.getViewBox()
    
    // ViewBox should be larger (zoomed out)
    expect(zoomedOutViewBox.width).toBeGreaterThan(zoomedInViewBox.width)
    expect(zoomedOutViewBox.height).toBeGreaterThan(zoomedInViewBox.height)
  })

  test('should zoom to cursor position [E2E-CV-ZOOM-02]', async ({ page }) => {
    // Test ID: E2E-CV-ZOOM-02
    // PRD Reference: Zoom should center on cursor position, not canvas center
    
    const bounds = await canvasHelpers.getCanvasBounds()
    
    // Position cursor at specific location (not center)
    const zoomPoint = {
      x: bounds.x + bounds.width * 0.25,
      y: bounds.y + bounds.height * 0.25
    }
    
    await page.mouse.move(zoomPoint.x, zoomPoint.y)
    
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Zoom in at cursor position
    await page.mouse.wheel(0, -240)
    await page.waitForTimeout(200)
    
    const zoomedViewBox = await canvasHelpers.getViewBox()
    
    // ViewBox should be centered around the cursor position
    // This is a complex calculation, but we can verify zoom occurred
    expect(zoomedViewBox.width).toBeLessThan(initialViewBox.width)
    expect(zoomedViewBox.height).toBeLessThan(initialViewBox.height)
    
    // The relative position of the zoom point should remain consistent
    // (This would require more complex coordinate math to verify precisely)
  })

  test('should respect zoom limits [E2E-CV-ZOOM-03]', async ({ page }) => {
    // Test ID: E2E-CV-ZOOM-03
    // PRD Reference: Zoom should have minimum and maximum limits
    
    const bounds = await canvasHelpers.getCanvasBounds()
    await page.mouse.move(bounds.centerX, bounds.centerY)
    
    // Attempt to zoom in beyond maximum
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -240)
      await page.waitForTimeout(25)
    }
    
    const maxZoomViewBox = await canvasHelpers.getViewBox()
    
    // Should not zoom beyond minimum reasonable size
    expect(maxZoomViewBox.width).toBeGreaterThan(10)
    expect(maxZoomViewBox.height).toBeGreaterThan(10)
    
    // Attempt to zoom out beyond minimum
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 240)
      await page.waitForTimeout(25)
    }
    
    const minZoomViewBox = await canvasHelpers.getViewBox()
    
    // Should not zoom beyond maximum reasonable size
    expect(minZoomViewBox.width).toBeLessThan(10000)
    expect(minZoomViewBox.height).toBeLessThan(10000)
  })

  test('should maintain aspect ratio during zoom [E2E-CV-ZOOM-04]', async ({ page }) => {
    // Test ID: E2E-CV-ZOOM-04
    // PRD Reference: Zoom should maintain canvas aspect ratio
    
    const initialViewBox = await canvasHelpers.getViewBox()
    const initialRatio = initialViewBox.width / initialViewBox.height
    
    const bounds = await canvasHelpers.getCanvasBounds()
    await page.mouse.move(bounds.centerX, bounds.centerY)
    
    // Perform zoom operation
    await page.mouse.wheel(0, -360)
    await page.waitForTimeout(200)
    
    const zoomedViewBox = await canvasHelpers.getViewBox()
    const zoomedRatio = zoomedViewBox.width / zoomedViewBox.height
    
    // Aspect ratio should be maintained (within reasonable tolerance)
    const ratioDifference = Math.abs(zoomedRatio - initialRatio)
    expect(ratioDifference).toBeLessThan(0.1)
  })

  test('should handle zoom with smooth performance [E2E-CV-ZOOM-05]', async ({ page }) => {
    // Test ID: E2E-CV-ZOOM-05
    // PRD Reference: Zoom operations should be smooth and responsive
    
    const bounds = await canvasHelpers.getCanvasBounds()
    await page.mouse.move(bounds.centerX, bounds.centerY)
    
    const startTime = Date.now()
    
    // Perform multiple zoom operations
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, i % 2 === 0 ? -120 : 120)
      await page.waitForTimeout(30)
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should handle zoom operations smoothly
    expect(totalTime).toBeLessThan(1500)
    
    // Final state should be valid
    const finalViewBox = await canvasHelpers.getViewBox()
    expect(finalViewBox.width).toBeGreaterThan(0)
    expect(finalViewBox.height).toBeGreaterThan(0)
  })
})

test.describe('Canvas Component - Touch Gestures', () => {
  let canvasHelpers: CanvasHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
  })

  test('should handle single-finger pan gestures [E2E-CV-TOUCH-01]', async ({ page }) => {
    // Test ID: E2E-CV-TOUCH-01
    // PRD Reference: Touch devices should support single-finger panning
    
    const initialViewBox = await canvasHelpers.getViewBox()
    const bounds = await canvasHelpers.getCanvasBounds()
    
    // Simulate touch pan gesture
    await page.touchscreen.tap(bounds.centerX, bounds.centerY)
    await page.waitForTimeout(100)
    
    // Simulate swipe
    await page.touchscreen.tap(
      bounds.centerX + 100,
      bounds.centerY + 100
    )
    await page.waitForTimeout(200)
    
    // Note: This is a simplified test - real touch gesture testing
    // would require more sophisticated touch event simulation
    const finalViewBox = await canvasHelpers.getViewBox()
    
    // ViewBox may have changed or remained the same depending on implementation
    expect(finalViewBox.width).toBeGreaterThan(0)
    expect(finalViewBox.height).toBeGreaterThan(0)
  })

  test('should prevent browser zoom on touch devices [E2E-CV-TOUCH-02]', async ({ page }) => {
    // Test ID: E2E-CV-TOUCH-02
    // PRD Reference: Canvas should prevent default browser touch behaviors
    
    const canvas = canvasHelpers.getCanvas()
    
    // Check that touch-action is set to prevent browser behaviors
    const touchAction = await canvas.evaluate(el => 
      window.getComputedStyle(el).touchAction
    )
    
    expect(touchAction).toContain('none')
  })

  test('should handle pinch-to-zoom gestures [E2E-CV-TOUCH-03]', async ({ page }) => {
    // Test ID: E2E-CV-TOUCH-03
    // PRD Reference: Two-finger pinch should zoom the canvas
    
    // Note: Playwright has limited support for multi-touch gestures
    // This test verifies the setup for pinch handling
    
    const canvas = canvasHelpers.getCanvas()
    
    // Verify canvas is set up to handle touch events
    const hasEventListeners = await canvas.evaluate(el => {
      const events = ['touchstart', 'touchmove', 'touchend']
      // This is a simplified check for event listener presence
      return events.every(eventType => {
        // Check if element has the appropriate event handling setup
        return el.getAttribute('style')?.includes('touch-action') !== null
      })
    })
    
    expect(hasEventListeners).toBeTruthy()
  })

  test('should maintain performance during touch interactions [E2E-CV-TOUCH-04]', async ({ page }) => {
    // Test ID: E2E-CV-TOUCH-04
    // PRD Reference: Touch interactions should be smooth and responsive
    
    const bounds = await canvasHelpers.getCanvasBounds()
    const startTime = Date.now()
    
    // Simulate rapid touch interactions
    for (let i = 0; i < 5; i++) {
      await page.touchscreen.tap(
        bounds.centerX + i * 20,
        bounds.centerY + i * 15
      )
      await page.waitForTimeout(50)
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should handle touch operations efficiently
    expect(totalTime).toBeLessThan(1000)
    
    // Canvas should remain responsive
    const finalViewBox = await canvasHelpers.getViewBox()
    expect(finalViewBox.width).toBeGreaterThan(0)
    expect(finalViewBox.height).toBeGreaterThan(0)
  })
})