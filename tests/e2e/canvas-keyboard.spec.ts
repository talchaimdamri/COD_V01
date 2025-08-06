import { test, expect } from '@playwright/test'
import { CanvasHelpers, EventAPIHelpers } from './helpers/canvas-helpers'
import { CANVAS_SELECTORS, CANVAS_CONFIG, keyboardShortcuts } from '../fixtures/canvas'

/**
 * E2E Tests for Canvas Keyboard Navigation (Task 5.1)
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
      await page.waitForTimeout(30)\n    }\n    \n    const endTime = Date.now()\n    const totalTime = endTime - startTime\n    \n    // Should handle rapid input efficiently\n    expect(totalTime).toBeLessThan(1000)\n    \n    const finalViewBox = await canvasHelpers.getViewBox()\n    \n    // Position should have changed from initial\n    expect(finalViewBox.x).not.toBe(initialViewBox.x)\n    expect(finalViewBox.y).not.toBe(initialViewBox.y)\n    \n    // ViewBox should remain valid\n    expect(finalViewBox.width).toBeGreaterThan(0)\n    expect(finalViewBox.height).toBeGreaterThan(0)\n  })\n\n  test('should respect pan boundaries with keyboard [E2E-CV-KEY-PAN-04]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-PAN-04\n    // PRD Reference: Keyboard panning should respect the same boundaries as mouse panning\n    \n    // Pan to extreme position using keyboard\n    for (let i = 0; i < 100; i++) {\n      await page.keyboard.press(keyboardShortcuts.pan.right)\n      await page.waitForTimeout(10)\n      \n      // Check boundaries periodically to avoid infinite loop\n      if (i % 20 === 0) {\n        const viewBox = await canvasHelpers.getViewBox()\n        if (Math.abs(viewBox.x) >= CANVAS_CONFIG.pan.boundary) {\n          break\n        }\n      }\n    }\n    \n    const boundaryViewBox = await canvasHelpers.getViewBox()\n    \n    // Should be constrained within boundaries\n    expect(Math.abs(boundaryViewBox.x)).toBeLessThanOrEqual(CANVAS_CONFIG.pan.boundary)\n    expect(Math.abs(boundaryViewBox.y)).toBeLessThanOrEqual(CANVAS_CONFIG.pan.boundary)\n  })\n})\n\ntest.describe('Canvas Component - Keyboard Zoom Controls', () => {\n  let canvasHelpers: CanvasHelpers\n  let eventHelpers: EventAPIHelpers\n\n  test.beforeEach(async ({ page }) => {\n    canvasHelpers = new CanvasHelpers(page)\n    eventHelpers = new EventAPIHelpers(page)\n    \n    await canvasHelpers.initializeCanvas()\n    await canvasHelpers.focusCanvas()\n  })\n\n  test('should zoom with +/- keys [E2E-CV-KEY-ZOOM-01]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-ZOOM-01\n    // PRD Reference: +/- keys should zoom in and out respectively\n    \n    const initialViewBox = await canvasHelpers.getViewBox()\n    \n    // Test zoom in with + key (Equal key)\n    await page.keyboard.press(keyboardShortcuts.zoom.in)\n    await page.waitForTimeout(200)\n    \n    const zoomedInViewBox = await canvasHelpers.getViewBox()\n    \n    // ViewBox should be smaller (zoomed in)\n    expect(zoomedInViewBox.width).toBeLessThan(initialViewBox.width)\n    expect(zoomedInViewBox.height).toBeLessThan(initialViewBox.height)\n    \n    // Test zoom out with - key\n    await page.keyboard.press(keyboardShortcuts.zoom.out)\n    await page.waitForTimeout(200)\n    \n    const zoomedOutViewBox = await canvasHelpers.getViewBox()\n    \n    // ViewBox should be larger (zoomed out)\n    expect(zoomedOutViewBox.width).toBeGreaterThan(zoomedInViewBox.width)\n    expect(zoomedOutViewBox.height).toBeGreaterThan(zoomedInViewBox.height)\n  })\n\n  test('should maintain zoom center during keyboard zoom [E2E-CV-KEY-ZOOM-02]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-ZOOM-02\n    // PRD Reference: Keyboard zoom should center on canvas viewport center\n    \n    const initialViewBox = await canvasHelpers.getViewBox()\n    const initialCenterX = initialViewBox.x + initialViewBox.width / 2\n    const initialCenterY = initialViewBox.y + initialViewBox.height / 2\n    \n    // Zoom in\n    await page.keyboard.press(keyboardShortcuts.zoom.in)\n    await page.waitForTimeout(200)\n    \n    const zoomedViewBox = await canvasHelpers.getViewBox()\n    const zoomedCenterX = zoomedViewBox.x + zoomedViewBox.width / 2\n    const zoomedCenterY = zoomedViewBox.y + zoomedViewBox.height / 2\n    \n    // Center should remain approximately the same\n    expect(Math.abs(zoomedCenterX - initialCenterX)).toBeLessThan(10)\n    expect(Math.abs(zoomedCenterY - initialCenterY)).toBeLessThan(10)\n  })\n\n  test('should respect zoom limits with keyboard [E2E-CV-KEY-ZOOM-03]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-ZOOM-03\n    // PRD Reference: Keyboard zoom should respect the same limits as mouse zoom\n    \n    // Attempt to zoom in beyond maximum\n    for (let i = 0; i < 30; i++) {\n      await page.keyboard.press(keyboardShortcuts.zoom.in)\n      await page.waitForTimeout(25)\n    }\n    \n    const maxZoomViewBox = await canvasHelpers.getViewBox()\n    \n    // Should not zoom beyond minimum size\n    expect(maxZoomViewBox.width).toBeGreaterThan(10)\n    expect(maxZoomViewBox.height).toBeGreaterThan(10)\n    \n    // Attempt to zoom out beyond minimum\n    for (let i = 0; i < 50; i++) {\n      await page.keyboard.press(keyboardShortcuts.zoom.out)\n      await page.waitForTimeout(25)\n    }\n    \n    const minZoomViewBox = await canvasHelpers.getViewBox()\n    \n    // Should not zoom beyond maximum size\n    expect(minZoomViewBox.width).toBeLessThan(10000)\n    expect(minZoomViewBox.height).toBeLessThan(10000)\n  })\n\n  test('should handle modifier key combinations [E2E-CV-KEY-ZOOM-04]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-ZOOM-04\n    // PRD Reference: Ctrl+Plus and Ctrl+Minus should also work for zoom\n    \n    const initialViewBox = await canvasHelpers.getViewBox()\n    \n    // Test Ctrl+Plus for zoom in\n    await page.keyboard.press('Control+Equal')\n    await page.waitForTimeout(200)\n    \n    const ctrlZoomInViewBox = await canvasHelpers.getViewBox()\n    expect(ctrlZoomInViewBox.width).toBeLessThan(initialViewBox.width)\n    \n    // Test Ctrl+Minus for zoom out\n    await page.keyboard.press('Control+Minus')\n    await page.waitForTimeout(200)\n    \n    const ctrlZoomOutViewBox = await canvasHelpers.getViewBox()\n    expect(ctrlZoomOutViewBox.width).toBeGreaterThan(ctrlZoomInViewBox.width)\n  })\n})\n\ntest.describe('Canvas Component - Reset and View Controls', () => {\n  let canvasHelpers: CanvasHelpers\n  let eventHelpers: EventAPIHelpers\n\n  test.beforeEach(async ({ page }) => {\n    canvasHelpers = new CanvasHelpers(page)\n    eventHelpers = new EventAPIHelpers(page)\n    \n    await canvasHelpers.initializeCanvas()\n    await canvasHelpers.focusCanvas()\n  })\n\n  test('should reset view with R key [E2E-CV-KEY-RESET-01]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-RESET-01\n    // PRD Reference: R key should reset canvas to default view\n    \n    // Get initial/default view\n    const defaultViewBox = await canvasHelpers.getViewBox()\n    \n    // Modify the view (pan and zoom)\n    await page.keyboard.press(keyboardShortcuts.pan.right)\n    await page.keyboard.press(keyboardShortcuts.pan.down)\n    await page.keyboard.press(keyboardShortcuts.zoom.in)\n    await page.waitForTimeout(200)\n    \n    const modifiedViewBox = await canvasHelpers.getViewBox()\n    \n    // Verify view was modified\n    expect(modifiedViewBox.x).not.toBe(defaultViewBox.x)\n    expect(modifiedViewBox.y).not.toBe(defaultViewBox.y)\n    expect(modifiedViewBox.width).not.toBe(defaultViewBox.width)\n    \n    // Reset with R key\n    await page.keyboard.press(keyboardShortcuts.zoom.reset)\n    await page.waitForTimeout(300)\n    \n    const resetViewBox = await canvasHelpers.getViewBox()\n    \n    // Should return to default-like view (exact values may vary based on implementation)\n    expect(Math.abs(resetViewBox.x - defaultViewBox.x)).toBeLessThan(50)\n    expect(Math.abs(resetViewBox.y - defaultViewBox.y)).toBeLessThan(50)\n    expect(Math.abs(resetViewBox.width - defaultViewBox.width)).toBeLessThan(50)\n  })\n\n  test('should handle Ctrl+0 for reset view [E2E-CV-KEY-RESET-02]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-RESET-02\n    // PRD Reference: Ctrl+0 should provide alternative reset shortcut\n    \n    // Modify view\n    await canvasHelpers.panCanvas({ x: 100, y: 100 })\n    await canvasHelpers.zoomCanvas('in', 3)\n    await page.waitForTimeout(200)\n    \n    const modifiedViewBox = await canvasHelpers.getViewBox()\n    \n    // Reset with Ctrl+0\n    await page.keyboard.press(keyboardShortcuts.zoom.resetAlt)\n    await page.waitForTimeout(300)\n    \n    const resetViewBox = await canvasHelpers.getViewBox()\n    \n    // View should be reset (different from modified state)\n    expect(resetViewBox.x).not.toBe(modifiedViewBox.x)\n    expect(resetViewBox.y).not.toBe(modifiedViewBox.y)\n    expect(resetViewBox.width).not.toBe(modifiedViewBox.width)\n  })\n\n  test('should not interfere with text input fields [E2E-CV-KEY-RESET-03]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-RESET-03\n    // PRD Reference: Keyboard shortcuts should not interfere with form inputs\n    \n    // This test assumes there might be some input fields in the UI\n    // If not present, this test serves as a placeholder for future implementation\n    \n    // Focus should be on canvas initially\n    const focusedElement = page.locator(':focus')\n    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)\n    \n    // Verify canvas is focused or focusable\n    await expect(canvasContainer).toHaveAttribute('tabindex', '0')\n    \n    // Test that keyboard shortcuts work when canvas is focused\n    const initialViewBox = await canvasHelpers.getViewBox()\n    \n    await page.keyboard.press(keyboardShortcuts.pan.right)\n    await page.waitForTimeout(100)\n    \n    const pannedViewBox = await canvasHelpers.getViewBox()\n    expect(pannedViewBox.x).toBeGreaterThan(initialViewBox.x)\n  })\n})\n\ntest.describe('Canvas Component - Accessibility and Keyboard Navigation', () => {\n  let canvasHelpers: CanvasHelpers\n\n  test.beforeEach(async ({ page }) => {\n    canvasHelpers = new CanvasHelpers(page)\n    await canvasHelpers.initializeCanvas()\n  })\n\n  test('should be keyboard focusable [E2E-CV-KEY-A11Y-01]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-A11Y-01\n    // PRD Reference: Canvas should be accessible via keyboard navigation\n    \n    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)\n    \n    // Canvas should be focusable\n    await expect(canvasContainer).toHaveAttribute('tabindex', '0')\n    \n    // Should have proper ARIA labels\n    const ariaLabel = await canvasContainer.getAttribute('aria-label')\n    expect(ariaLabel).toBeTruthy()\n    expect(ariaLabel!.toLowerCase()).toContain('canvas')\n    \n    // Should be focusable via tab navigation\n    await page.keyboard.press('Tab')\n    const focusedElement = page.locator(':focus')\n    \n    // Focus should be on canvas or a related focusable element\n    await expect(focusedElement).toBeVisible()\n  })\n\n  test('should provide keyboard shortcuts help [E2E-CV-KEY-A11Y-02]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-A11Y-02\n    // PRD Reference: Users should be able to discover keyboard shortcuts\n    \n    // This test checks for potential help indicators or documentation\n    // Implementation may vary - this is a placeholder for accessibility features\n    \n    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)\n    \n    // Look for help text, tooltips, or keyboard shortcut indicators\n    // This might be implemented as aria-describedby or data attributes\n    const ariaDescribedBy = await canvasContainer.getAttribute('aria-describedby')\n    const title = await canvasContainer.getAttribute('title')\n    \n    // At least one form of help should be available\n    const hasHelpInfo = ariaDescribedBy || title ||\n      await page.locator('[data-testid*=\"keyboard\"], [data-testid*=\"shortcut\"], [data-testid*=\"help\"]').count() > 0\n    \n    expect(hasHelpInfo).toBeTruthy()\n  })\n\n  test('should maintain focus during keyboard operations [E2E-CV-KEY-A11Y-03]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-A11Y-03\n    // PRD Reference: Focus should remain on canvas during keyboard interactions\n    \n    await canvasHelpers.focusCanvas()\n    \n    // Perform various keyboard operations\n    await page.keyboard.press(keyboardShortcuts.pan.right)\n    await page.keyboard.press(keyboardShortcuts.zoom.in)\n    await page.keyboard.press(keyboardShortcuts.zoom.reset)\n    \n    await page.waitForTimeout(200)\n    \n    // Focus should still be on canvas or within canvas container\n    const focusedElement = page.locator(':focus')\n    await expect(focusedElement).toBeVisible()\n    \n    // The focused element should be the canvas or a child of the canvas\n    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)\n    const focusedElementBox = await focusedElement.boundingBox()\n    const canvasBox = await canvasContainer.boundingBox()\n    \n    if (focusedElementBox && canvasBox) {\n      // Focus should be within or on the canvas area\n      const focusWithinCanvas = (\n        focusedElementBox.x >= canvasBox.x &&\n        focusedElementBox.y >= canvasBox.y &&\n        focusedElementBox.x + focusedElementBox.width <= canvasBox.x + canvasBox.width &&\n        focusedElementBox.y + focusedElementBox.height <= canvasBox.y + canvasBox.height\n      )\n      \n      expect(focusWithinCanvas).toBeTruthy()\n    }\n  })\n\n  test('should handle keyboard events without errors [E2E-CV-KEY-A11Y-04]', async ({ page }) => {\n    // Test ID: E2E-CV-KEY-A11Y-04\n    // PRD Reference: Keyboard operations should not generate console errors\n    \n    const errors: string[] = []\n    \n    page.on('console', (msg) => {\n      if (msg.type() === 'error') {\n        errors.push(msg.text())\n      }\n    })\n    \n    await canvasHelpers.focusCanvas()\n    \n    // Test all keyboard shortcuts\n    const allKeys = [\n      ...Object.values(keyboardShortcuts.pan),\n      ...Object.values(keyboardShortcuts.zoom),\n    ]\n    \n    for (const key of allKeys) {\n      await page.keyboard.press(key)\n      await page.waitForTimeout(50)\n    }\n    \n    // Should not generate console errors\n    expect(errors).toEqual([])\n  })\n})"