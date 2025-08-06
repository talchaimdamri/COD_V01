import { test, expect } from '@playwright/test'
import { CanvasHelpers, EventAPIHelpers } from './helpers/canvas-helpers'
import { CANVAS_SELECTORS, CANVAS_CONFIG, keyboardShortcuts } from '../fixtures/canvas'

/**
 * E2E Tests for Canvas Keyboard Navigation (Task 5.6)
 * Test ID: E2E-CV-KEYBOARD
 * 
 * This test suite covers Canvas keyboard interactions:
 * - Arrow keys for panning navigation
 * - +/- keys for zooming operations
 * - Space bar for reset to center/default zoom
 * - Accessibility and keyboard-only navigation
 * 
 * Following TDD approach - these tests will FAIL initially.
 */

test.describe('Canvas Component - Keyboard Pan Navigation', () => {
  let canvasHelpers: CanvasHelpers
  let eventHelpers: EventAPIHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
    await canvasHelpers.focusCanvas()
  })

  test('should pan with arrow keys [E2E-CV-KEY-PAN-01]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-PAN-01
    // PRD Reference: Arrow keys should pan the canvas in corresponding directions
    
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Test right arrow key
    await page.keyboard.press(keyboardShortcuts.pan.right)
    await page.waitForTimeout(100)
    
    const rightViewBox = await canvasHelpers.getViewBox()
    expect(rightViewBox.x).toBeGreaterThan(initialViewBox.x)
    expect(rightViewBox.y).toBe(initialViewBox.y) // Y should not change
    
    // Test down arrow key
    await page.keyboard.press(keyboardShortcuts.pan.down)
    await page.waitForTimeout(100)
    
    const downViewBox = await canvasHelpers.getViewBox()
    expect(downViewBox.y).toBeGreaterThan(rightViewBox.y)
    expect(downViewBox.x).toBe(rightViewBox.x) // X should not change from previous
    
    // Test left arrow key
    await page.keyboard.press(keyboardShortcuts.pan.left)
    await page.waitForTimeout(100)
    
    const leftViewBox = await canvasHelpers.getViewBox()
    expect(leftViewBox.x).toBeLessThan(downViewBox.x)
    expect(leftViewBox.y).toBe(downViewBox.y) // Y should not change
    
    // Test up arrow key
    await page.keyboard.press(keyboardShortcuts.pan.up)
    await page.waitForTimeout(100)
    
    const upViewBox = await canvasHelpers.getViewBox()
    expect(upViewBox.y).toBeLessThan(leftViewBox.y)
    expect(upViewBox.x).toBe(leftViewBox.x) // X should not change
  })

  test('should maintain consistent pan step size [E2E-CV-KEY-PAN-02]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-PAN-02
    // PRD Reference: Keyboard pan should move by consistent increments
    
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Pan right twice
    await page.keyboard.press(keyboardShortcuts.pan.right)
    await page.waitForTimeout(50)
    const step1ViewBox = await canvasHelpers.getViewBox()
    
    await page.keyboard.press(keyboardShortcuts.pan.right)
    await page.waitForTimeout(50)
    const step2ViewBox = await canvasHelpers.getViewBox()
    
    // Calculate step sizes
    const firstStep = step1ViewBox.x - initialViewBox.x
    const secondStep = step2ViewBox.x - step1ViewBox.x
    
    // Steps should be consistent (within reasonable tolerance)
    expect(Math.abs(firstStep - secondStep)).toBeLessThan(1)
    expect(firstStep).toBeGreaterThan(0)
    expect(secondStep).toBeGreaterThan(0)
  })

  test('should handle rapid keyboard pan input [E2E-CV-KEY-PAN-03]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-PAN-03
    // PRD Reference: Canvas should handle rapid keyboard input smoothly
    
    const initialViewBox = await canvasHelpers.getViewBox()
    const startTime = Date.now()
    
    // Rapid arrow key presses
    const keys = [
      keyboardShortcuts.pan.right,
      keyboardShortcuts.pan.down,
      keyboardShortcuts.pan.left,
      keyboardShortcuts.pan.up,
      keyboardShortcuts.pan.right,
      keyboardShortcuts.pan.down,
    ]
    
    for (const key of keys) {
      await page.keyboard.press(key)
      await page.waitForTimeout(30)
    }
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    // Should handle rapid input efficiently
    expect(totalTime).toBeLessThan(1000)
    
    const finalViewBox = await canvasHelpers.getViewBox()
    
    // Position should have changed from initial
    expect(finalViewBox.x).not.toBe(initialViewBox.x)
    expect(finalViewBox.y).not.toBe(initialViewBox.y)
    
    // ViewBox should remain valid
    expect(finalViewBox.width).toBeGreaterThan(0)
    expect(finalViewBox.height).toBeGreaterThan(0)
  })

  test('should respect pan boundaries with keyboard [E2E-CV-KEY-PAN-04]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-PAN-04
    // PRD Reference: Keyboard panning should respect the same boundaries as mouse panning
    
    // Pan to extreme position using keyboard
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press(keyboardShortcuts.pan.right)
      await page.waitForTimeout(10)
      
      // Check boundaries periodically to avoid infinite loop
      if (i % 20 === 0) {
        const viewBox = await canvasHelpers.getViewBox()
        if (Math.abs(viewBox.x) >= CANVAS_CONFIG.pan.boundary) {
          break
        }
      }
    }
    
    const boundaryViewBox = await canvasHelpers.getViewBox()
    
    // Should be constrained within boundaries
    expect(Math.abs(boundaryViewBox.x)).toBeLessThanOrEqual(CANVAS_CONFIG.pan.boundary)
    expect(Math.abs(boundaryViewBox.y)).toBeLessThanOrEqual(CANVAS_CONFIG.pan.boundary)
  })
})

test.describe('Canvas Component - Keyboard Zoom Controls', () => {
  let canvasHelpers: CanvasHelpers
  let eventHelpers: EventAPIHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
    await canvasHelpers.focusCanvas()
  })

  test('should zoom with +/- keys [E2E-CV-KEY-ZOOM-01]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-ZOOM-01
    // PRD Reference: +/- keys should zoom in and out respectively
    
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Test zoom in with + key (Equal key)
    await page.keyboard.press(keyboardShortcuts.zoom.in)
    await page.waitForTimeout(200)
    
    const zoomedInViewBox = await canvasHelpers.getViewBox()
    
    // ViewBox should be smaller (zoomed in)
    expect(zoomedInViewBox.width).toBeLessThan(initialViewBox.width)
    expect(zoomedInViewBox.height).toBeLessThan(initialViewBox.height)
    
    // Test zoom out with - key
    await page.keyboard.press(keyboardShortcuts.zoom.out)
    await page.waitForTimeout(200)
    
    const zoomedOutViewBox = await canvasHelpers.getViewBox()
    
    // ViewBox should be larger (zoomed out)
    expect(zoomedOutViewBox.width).toBeGreaterThan(zoomedInViewBox.width)
    expect(zoomedOutViewBox.height).toBeGreaterThan(zoomedInViewBox.height)
  })

  test('should maintain zoom center during keyboard zoom [E2E-CV-KEY-ZOOM-02]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-ZOOM-02
    // PRD Reference: Keyboard zoom should center on canvas viewport center
    
    const initialViewBox = await canvasHelpers.getViewBox()
    const initialCenterX = initialViewBox.x + initialViewBox.width / 2
    const initialCenterY = initialViewBox.y + initialViewBox.height / 2
    
    // Zoom in
    await page.keyboard.press(keyboardShortcuts.zoom.in)
    await page.waitForTimeout(200)
    
    const zoomedViewBox = await canvasHelpers.getViewBox()
    const zoomedCenterX = zoomedViewBox.x + zoomedViewBox.width / 2
    const zoomedCenterY = zoomedViewBox.y + zoomedViewBox.height / 2
    
    // Center should remain approximately the same
    expect(Math.abs(zoomedCenterX - initialCenterX)).toBeLessThan(10)
    expect(Math.abs(zoomedCenterY - initialCenterY)).toBeLessThan(10)
  })

  test('should respect zoom limits with keyboard [E2E-CV-KEY-ZOOM-03]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-ZOOM-03
    // PRD Reference: Keyboard zoom should respect the same limits as mouse zoom
    
    // Attempt to zoom in beyond maximum
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press(keyboardShortcuts.zoom.in)
      await page.waitForTimeout(25)
    }
    
    const maxZoomViewBox = await canvasHelpers.getViewBox()
    
    // Should not zoom beyond minimum size
    expect(maxZoomViewBox.width).toBeGreaterThan(10)
    expect(maxZoomViewBox.height).toBeGreaterThan(10)
    
    // Attempt to zoom out beyond minimum
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press(keyboardShortcuts.zoom.out)
      await page.waitForTimeout(25)
    }
    
    const minZoomViewBox = await canvasHelpers.getViewBox()
    
    // Should not zoom beyond maximum size
    expect(minZoomViewBox.width).toBeLessThan(10000)
    expect(minZoomViewBox.height).toBeLessThan(10000)
  })

  test('should handle modifier key combinations [E2E-CV-KEY-ZOOM-04]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-ZOOM-04
    // PRD Reference: Ctrl+Plus and Ctrl+Minus should also work for zoom
    
    const initialViewBox = await canvasHelpers.getViewBox()
    
    // Test Ctrl+Plus for zoom in
    await page.keyboard.press('Control+Equal')
    await page.waitForTimeout(200)
    
    const ctrlZoomInViewBox = await canvasHelpers.getViewBox()
    expect(ctrlZoomInViewBox.width).toBeLessThan(initialViewBox.width)
    
    // Test Ctrl+Minus for zoom out
    await page.keyboard.press('Control+Minus')
    await page.waitForTimeout(200)
    
    const ctrlZoomOutViewBox = await canvasHelpers.getViewBox()
    expect(ctrlZoomOutViewBox.width).toBeGreaterThan(ctrlZoomInViewBox.width)
  })
})

test.describe('Canvas Component - Reset and View Controls', () => {
  let canvasHelpers: CanvasHelpers
  let eventHelpers: EventAPIHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
    await canvasHelpers.focusCanvas()
  })

  test('should reset view with R key [E2E-CV-KEY-RESET-01]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-RESET-01
    // PRD Reference: R key should reset canvas to default view
    
    // Get initial/default view
    const defaultViewBox = await canvasHelpers.getViewBox()
    
    // Modify the view (pan and zoom)
    await page.keyboard.press(keyboardShortcuts.pan.right)
    await page.keyboard.press(keyboardShortcuts.pan.down)
    await page.keyboard.press(keyboardShortcuts.zoom.in)
    await page.waitForTimeout(200)
    
    const modifiedViewBox = await canvasHelpers.getViewBox()
    
    // Verify view was modified
    expect(modifiedViewBox.x).not.toBe(defaultViewBox.x)
    expect(modifiedViewBox.y).not.toBe(defaultViewBox.y)
    expect(modifiedViewBox.width).not.toBe(defaultViewBox.width)
    
    // Reset with R key
    await page.keyboard.press(keyboardShortcuts.zoom.reset)
    await page.waitForTimeout(300)
    
    const resetViewBox = await canvasHelpers.getViewBox()
    
    // Should return to default-like view (exact values may vary based on implementation)
    expect(Math.abs(resetViewBox.x - defaultViewBox.x)).toBeLessThan(50)
    expect(Math.abs(resetViewBox.y - defaultViewBox.y)).toBeLessThan(50)
    expect(Math.abs(resetViewBox.width - defaultViewBox.width)).toBeLessThan(50)
  })

  test('should handle Ctrl+0 for reset view [E2E-CV-KEY-RESET-02]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-RESET-02
    // PRD Reference: Ctrl+0 should provide alternative reset shortcut
    
    // Modify view
    await canvasHelpers.panCanvas({ x: 100, y: 100 })
    await canvasHelpers.zoomCanvas('in', 3)
    await page.waitForTimeout(200)
    
    const modifiedViewBox = await canvasHelpers.getViewBox()
    
    // Reset with Ctrl+0
    await page.keyboard.press(keyboardShortcuts.zoom.resetAlt)
    await page.waitForTimeout(300)
    
    const resetViewBox = await canvasHelpers.getViewBox()
    
    // View should be reset (different from modified state)
    expect(resetViewBox.x).not.toBe(modifiedViewBox.x)
    expect(resetViewBox.y).not.toBe(modifiedViewBox.y)
    expect(resetViewBox.width).not.toBe(modifiedViewBox.width)
  })

  test('should not interfere with text input fields [E2E-CV-KEY-RESET-03]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-RESET-03
    // PRD Reference: Keyboard shortcuts should not interfere with form inputs
    
    // This test assumes there might be some input fields in the UI
    // If not present, this test serves as a placeholder for future implementation
    
    // Focus should be on canvas initially
    const focusedElement = page.locator(':focus')
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    
    // Verify canvas is focused or focusable
    await expect(canvasContainer).toHaveAttribute('tabindex', '0')
    
    // Test that keyboard shortcuts work when canvas is focused
    const initialViewBox = await canvasHelpers.getViewBox()
    
    await page.keyboard.press(keyboardShortcuts.pan.right)
    await page.waitForTimeout(100)
    
    const pannedViewBox = await canvasHelpers.getViewBox()
    expect(pannedViewBox.x).toBeGreaterThan(initialViewBox.x)
  })
})

test.describe('Canvas Component - Accessibility and Keyboard Navigation', () => {
  let canvasHelpers: CanvasHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
  })

  test('should be keyboard focusable [E2E-CV-KEY-A11Y-01]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-A11Y-01
    // PRD Reference: Canvas should be accessible via keyboard navigation
    
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    
    // Canvas should be focusable
    await expect(canvasContainer).toHaveAttribute('tabindex', '0')
    
    // Should have proper ARIA labels
    const ariaLabel = await canvasContainer.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel!.toLowerCase()).toContain('canvas')
    
    // Should be focusable via tab navigation
    await page.keyboard.press('Tab')
    const focusedElement = page.locator(':focus')
    
    // Focus should be on canvas or a related focusable element
    await expect(focusedElement).toBeVisible()
  })

  test('should provide keyboard shortcuts help [E2E-CV-KEY-A11Y-02]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-A11Y-02
    // PRD Reference: Users should be able to discover keyboard shortcuts
    
    // This test checks for potential help indicators or documentation
    // Implementation may vary - this is a placeholder for accessibility features
    
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    
    // Look for help text, tooltips, or keyboard shortcut indicators
    // This might be implemented as aria-describedby or data attributes
    const ariaDescribedBy = await canvasContainer.getAttribute('aria-describedby')
    const title = await canvasContainer.getAttribute('title')
    
    // At least one form of help should be available
    const hasHelpInfo = ariaDescribedBy || title ||
      await page.locator('[data-testid*="keyboard"], [data-testid*="shortcut"], [data-testid*="help"]').count() > 0
    
    expect(hasHelpInfo).toBeTruthy()
  })

  test('should maintain focus during keyboard operations [E2E-CV-KEY-A11Y-03]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-A11Y-03
    // PRD Reference: Focus should remain on canvas during keyboard interactions
    
    await canvasHelpers.focusCanvas()
    
    // Perform various keyboard operations
    await page.keyboard.press(keyboardShortcuts.pan.right)
    await page.keyboard.press(keyboardShortcuts.zoom.in)
    await page.keyboard.press(keyboardShortcuts.zoom.reset)
    
    await page.waitForTimeout(200)
    
    // Focus should still be on canvas or within canvas container
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // The focused element should be the canvas or a child of the canvas
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    const focusedElementBox = await focusedElement.boundingBox()
    const canvasBox = await canvasContainer.boundingBox()
    
    if (focusedElementBox && canvasBox) {
      // Focus should be within or on the canvas area
      const focusWithinCanvas = (
        focusedElementBox.x >= canvasBox.x &&
        focusedElementBox.y >= canvasBox.y &&
        focusedElementBox.x + focusedElementBox.width <= canvasBox.x + canvasBox.width &&
        focusedElementBox.y + focusedElementBox.height <= canvasBox.y + canvasBox.height
      )
      
      expect(focusWithinCanvas).toBeTruthy()
    }
  })

  test('should handle keyboard events without errors [E2E-CV-KEY-A11Y-04]', async ({ page }) => {
    // Test ID: E2E-CV-KEY-A11Y-04
    // PRD Reference: Keyboard operations should not generate console errors
    
    const errors: string[] = []
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await canvasHelpers.focusCanvas()
    
    // Test all keyboard shortcuts
    const allKeys = [
      ...Object.values(keyboardShortcuts.pan),
      ...Object.values(keyboardShortcuts.zoom),
    ]
    
    for (const key of allKeys) {
      await page.keyboard.press(key)
      await page.waitForTimeout(50)
    }
    
    // Should not generate console errors
    expect(errors).toEqual([])
  })
})