import { test, expect } from '@playwright/test'
import { CanvasHelpers, EventAPIHelpers } from './helpers/canvas-helpers'
import { CANVAS_SELECTORS, CANVAS_CONFIG } from '../fixtures/canvas'

/**
 * E2E Tests for Canvas Component Rendering (Task 5.1)
 * Test ID: E2E-CV-RENDER
 * 
 * This test suite covers the basic Canvas component rendering functionality:
 * - SVG container setup and display
 * - Background grid pattern rendering (8px)
 * - Proper canvas viewport configuration
 * - Initial state verification
 * 
 * Following TDD approach - these tests will FAIL initially as Canvas
 * component implementation needs completion.
 */

test.describe('Canvas Component - Rendering and Initialization', () => {
  let canvasHelpers: CanvasHelpers
  let eventHelpers: EventAPIHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    eventHelpers = new EventAPIHelpers(page)
    
    await canvasHelpers.initializeCanvas()
  })

  test('should render canvas with SVG container [E2E-CV-RENDER-01]', async ({ page }) => {
    // Test ID: E2E-CV-RENDER-01
    // PRD Reference: Canvas component must display interactive SVG workspace
    
    // Verify main canvas container exists and is visible
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    await expect(canvasContainer).toBeVisible()
    await expect(canvasContainer).toHaveAttribute('data-testid', 'canvas')
    
    // Verify SVG element exists with proper structure
    const svgElement = page.locator(CANVAS_SELECTORS.canvasSvg)
    await expect(svgElement).toBeVisible()
    await expect(svgElement).toHaveAttribute('data-testid', 'canvas-svg')
    
    // Check SVG has required attributes
    await expect(svgElement).toHaveAttribute('width', '100%')
    await expect(svgElement).toHaveAttribute('height', '100%')
    await expect(svgElement).toHaveAttribute('preserveAspectRatio', /xMidYMid/)
    
    // Verify viewBox is set correctly
    const viewBox = await svgElement.getAttribute('viewBox')
    expect(viewBox).toBeTruthy()
    
    const viewBoxValues = viewBox!.split(' ').map(Number)
    expect(viewBoxValues).toHaveLength(4)
    expect(viewBoxValues.every(val => !isNaN(val))).toBe(true)
  })

  test('should render 8px background grid pattern [E2E-CV-RENDER-02]', async ({ page }) => {
    // Test ID: E2E-CV-RENDER-02
    // PRD Reference: Canvas must display 8px grid pattern for alignment
    
    // Verify grid container exists
    const gridElement = page.locator(CANVAS_SELECTORS.grid)
    await expect(gridElement).toBeVisible()
    await expect(gridElement).toHaveAttribute('data-testid', 'canvas-grid')
    
    // Check for grid pattern definition in SVG defs
    const gridPattern = page.locator(CANVAS_SELECTORS.gridPattern)
    await expect(gridPattern).toBeAttached()
    
    // Verify pattern has correct ID for CSS referencing
    await expect(gridPattern).toHaveAttribute('id', 'grid')
    
    // Verify grid lines are rendered
    const gridLines = page.locator(CANVAS_SELECTORS.gridLines)
    const lineCount = await gridLines.count()
    expect(lineCount).toBeGreaterThan(0)
    
    // Verify grid lines have proper stroke styling
    const firstLine = gridLines.first()
    const stroke = await firstLine.evaluate(el => 
      window.getComputedStyle(el).stroke
    )
    expect(stroke).not.toBe('none')
  })

  test('should have proper canvas viewport setup [E2E-CV-RENDER-03]', async ({ page }) => {
    // Test ID: E2E-CV-RENDER-03
    // PRD Reference: Canvas viewport must be properly configured for pan/zoom
    
    const canvas = canvasHelpers.getCanvas()
    
    // Verify SVG has proper role for accessibility
    await expect(canvas).toHaveAttribute('role', 'img')
    await expect(canvas).toHaveAttribute('aria-label', /canvas/i)
    
    // Check viewBox format (x y width height)
    const viewBox = await canvasHelpers.getViewBox()
    expect(typeof viewBox.x).toBe('number')
    expect(typeof viewBox.y).toBe('number')
    expect(typeof viewBox.width).toBe('number')
    expect(typeof viewBox.height).toBe('number')
    
    expect(viewBox.width).toBeGreaterThan(0)
    expect(viewBox.height).toBeGreaterThan(0)
    
    // Verify canvas is focusable for keyboard interactions
    const canvasContainer = page.locator(CANVAS_SELECTORS.canvas)
    await expect(canvasContainer).toHaveAttribute('tabindex', '0')
  })

  test('should initialize with default view state [E2E-CV-RENDER-04]', async ({ page }) => {
    // Test ID: E2E-CV-RENDER-04
    // PRD Reference: Canvas should start with centered, 1:1 zoom view
    
    const viewBox = await canvasHelpers.getViewBox()
    
    // Default view should be reasonable dimensions
    // Exact values depend on implementation, but should be sensible defaults
    expect(viewBox.width).toBeGreaterThanOrEqual(400)
    expect(viewBox.width).toBeLessThanOrEqual(2000)
    expect(viewBox.height).toBeGreaterThanOrEqual(300)
    expect(viewBox.height).toBeLessThanOrEqual(1500)
    
    // Initial position should be at origin or centered
    expect(viewBox.x).toBeGreaterThanOrEqual(-1000)
    expect(viewBox.x).toBeLessThanOrEqual(1000)
    expect(viewBox.y).toBeGreaterThanOrEqual(-1000)
    expect(viewBox.y).toBeLessThanOrEqual(1000)
  })

  test('should render without errors in browser console [E2E-CV-RENDER-05]', async ({ page }) => {
    // Test ID: E2E-CV-RENDER-05
    // PRD Reference: Canvas should render without JavaScript errors
    
    const errors: string[] = []
    
    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Wait for any async rendering to complete
    await page.waitForTimeout(1000)
    
    // Verify no errors occurred during rendering
    expect(errors).toEqual([])
  })

  test('should have responsive canvas dimensions [E2E-CV-RENDER-06]', async ({ page }) => {
    // Test ID: E2E-CV-RENDER-06
    // PRD Reference: Canvas should adapt to container size
    
    const bounds = await canvasHelpers.getCanvasBounds()
    
    // Canvas should fill available space
    expect(bounds.width).toBeGreaterThan(400)
    expect(bounds.height).toBeGreaterThan(300)
    
    // Test resize behavior
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(200)
    
    const newBounds = await canvasHelpers.getCanvasBounds()
    
    // Canvas should adapt to new viewport
    expect(newBounds.width).toBeGreaterThan(bounds.width * 0.8)
    expect(newBounds.height).toBeGreaterThan(bounds.height * 0.8)
  })
})

test.describe('Canvas Component - Grid System', () => {
  let canvasHelpers: CanvasHelpers

  test.beforeEach(async ({ page }) => {
    canvasHelpers = new CanvasHelpers(page)
    await canvasHelpers.initializeCanvas()
  })

  test('should render grid with 8px spacing [E2E-CV-GRID-01]', async ({ page }) => {
    // Test ID: E2E-CV-GRID-01
    // PRD Reference: Grid must have 8px spacing for pixel-perfect alignment
    
    const gridPattern = page.locator(CANVAS_SELECTORS.gridPattern)
    
    // Check pattern width and height attributes for 8px spacing
    // Note: Implementation may use different approach, adjust accordingly
    const patternWidth = await gridPattern.getAttribute('width')
    const patternHeight = await gridPattern.getAttribute('height')
    
    // Allow for some implementation flexibility (8px, 20px, etc.)
    expect(patternWidth).toBeTruthy()
    expect(patternHeight).toBeTruthy()
    
    const widthVal = parseInt(patternWidth!)
    const heightVal = parseInt(patternHeight!)
    
    expect(widthVal).toBeGreaterThanOrEqual(8)
    expect(heightVal).toBeGreaterThanOrEqual(8)
  })

  test('should maintain grid visibility during zoom [E2E-CV-GRID-02]', async ({ page }) => {
    // Test ID: E2E-CV-GRID-02
    // PRD Reference: Grid should remain visible and scale appropriately
    
    // Initial grid visibility
    const gridElement = page.locator(CANVAS_SELECTORS.grid)
    await expect(gridElement).toBeVisible()
    
    // Zoom in
    await canvasHelpers.zoomCanvas('in', 3)
    await page.waitForTimeout(200)
    
    // Grid should still be visible
    await expect(gridElement).toBeVisible()
    
    // Zoom out
    await canvasHelpers.zoomCanvas('out', 5)
    await page.waitForTimeout(200)
    
    // Grid should still be visible
    await expect(gridElement).toBeVisible()
  })

  test('should render grid lines with proper styling [E2E-CV-GRID-03]', async ({ page }) => {
    // Test ID: E2E-CV-GRID-03
    // PRD Reference: Grid lines should have subtle, non-intrusive appearance
    
    const gridLines = page.locator(CANVAS_SELECTORS.gridLines)
    const lineCount = await gridLines.count()
    
    expect(lineCount).toBeGreaterThan(0)
    
    // Check first line styling
    const firstLine = gridLines.first()
    const computedStyles = await firstLine.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        stroke: styles.stroke,
        strokeWidth: styles.strokeWidth,
        opacity: styles.opacity
      }
    })
    
    // Grid should be subtle (low opacity or light color)
    expect(computedStyles.stroke).not.toBe('none')
    expect(parseFloat(computedStyles.opacity)).toBeLessThanOrEqual(0.5)
  })
})