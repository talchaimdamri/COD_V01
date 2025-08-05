import { test, expect, Page } from '@playwright/test'

/**
 * Comprehensive E2E Tests for Canvas Component
 * 
 * These tests follow the TDD methodology and will initially fail since the Canvas 
 * component doesn't exist yet. Tests cover all functionality specified in Task 5:
 * 
 * - Canvas initialization and rendering
 * - Document node creation (E2E-CV-01)
 * - Node dragging functionality (E2E-CV-02)
 * - Pan/zoom functionality  
 * - Grid rendering
 * - Keyboard shortcuts
 * - Mouse/touch interactions
 * - Event sourcing integration
 */

// Test fixtures and helper functions
const CANVAS_SELECTORS = {
  canvas: '[data-testid="canvas"]',
  canvasSvg: '[data-testid="canvas-svg"]',
  grid: '[data-testid="canvas-grid"]',
  docButton: '[data-testid="add-doc-button"]',
  agentButton: '[data-testid="add-agent-button"]',
  sidebar: '[data-testid="sidebar"]',
  sidebarNodeList: '[data-testid="sidebar-node-list"]',
  resetButton: '[data-testid="reset-view-button"]',
  zoomIn: '[data-testid="zoom-in-button"]',
  zoomOut: '[data-testid="zoom-out-button"]',
} as const

const CANVAS_DIMENSIONS = {
  width: 800,
  height: 600,
  centerX: 400,
  centerY: 300,
} as const

const DRAG_POSITIONS = {
  start: { x: 200, y: 200 },
  end: { x: 400, y: 300 },
} as const

// Helper function to get canvas coordinates
async function getCanvasCoordinates(page: Page, element: string) {
  const bbox = await page.locator(element).boundingBox()
  if (!bbox) throw new Error(`Element ${element} not found`)
  return {
    x: bbox.x + bbox.width / 2,
    y: bbox.y + bbox.height / 2,
  }
}

// Helper function to wait for and verify API events
async function waitForEventInAPI(page: Page, eventType: string, timeout = 5000) {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await page.request.get('/api/events')
      const events = await response.json()
      
      const foundEvent = events.find((event: any) => event.type === eventType)
      if (foundEvent) {
        return foundEvent
      }
      
      await page.waitForTimeout(100)
    } catch (error) {
      // Continue polling
    }
  }
  
  throw new Error(`Event ${eventType} not found in API within ${timeout}ms`)
}

// Helper function to create a document node
async function createDocumentNode(page: Page, position = { x: 200, y: 200 }) {
  await page.locator(CANVAS_SELECTORS.docButton).click()
  
  // Wait for the node to appear and verify position
  const node = page.locator('[data-testid="canvas-node"]').first()
  await expect(node).toBeVisible()
  
  return node
}

// Helper function to get node position from DOM
async function getNodePosition(page: Page, nodeSelector: string) {
  const transform = await page.locator(nodeSelector).getAttribute('transform')
  if (!transform) return { x: 0, y: 0 }
  
  const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
  if (!match) return { x: 0, y: 0 }
  
  return {
    x: parseFloat(match[1]),
    y: parseFloat(match[2]),
  }
}

test.describe('Canvas Component - Initialization and Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle')
  })

  test('should render canvas with SVG container', async ({ page }) => {
    // Verify main canvas container exists
    await expect(page.locator(CANVAS_SELECTORS.canvas)).toBeVisible()
    
    // Verify SVG element exists and has correct attributes
    const svg = page.locator(CANVAS_SELECTORS.canvasSvg)
    await expect(svg).toBeVisible()
    
    // Check SVG dimensions
    const svgElement = await svg.elementHandle()
    const width = await svgElement?.getAttribute('width')
    const height = await svgElement?.getAttribute('height')
    
    expect(parseInt(width || '0')).toBeGreaterThan(0)
    expect(parseInt(height || '0')).toBeGreaterThan(0)
  })

  test('should render grid pattern', async ({ page }) => {
    // Verify grid is visible
    await expect(page.locator(CANVAS_SELECTORS.grid)).toBeVisible()
    
    // Check grid pattern definition exists
    const gridPattern = page.locator('defs pattern[id="grid"]')
    await expect(gridPattern).toBeAttached()
    
    // Verify grid lines are rendered
    const gridLines = page.locator(CANVAS_SELECTORS.grid + ' line')
    const lineCount = await gridLines.count()
    expect(lineCount).toBeGreaterThan(0)
  })

  test('should have proper canvas viewport setup', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Check viewBox attribute
    const viewBox = await canvas.getAttribute('viewBox')
    expect(viewBox).toBeTruthy()
    
    // Verify preserveAspectRatio
    const aspectRatio = await canvas.getAttribute('preserveAspectRatio')
    expect(aspectRatio).toContain('xMidYMid')
  })
})

test.describe('Canvas Component - Document Node Creation (E2E-CV-01)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should create document node when Doc button clicked', async ({ page }) => {
    // Step 1: Click Doc button
    await page.locator(CANVAS_SELECTORS.docButton).click()
    
    // Step 2: Verify new circle (document node) is visible
    const documentNode = page.locator('[data-testid="canvas-node"][data-node-type="document"]')
    await expect(documentNode).toBeVisible()
    
    // Verify node has circular shape
    const circle = documentNode.locator('circle')
    await expect(circle).toBeVisible()
    
    // Check circle attributes
    const radius = await circle.getAttribute('r')
    expect(parseInt(radius || '0')).toBeGreaterThan(0)
  })

  test('should add document to sidebar list', async ({ page }) => {
    // Create document node
    await page.locator(CANVAS_SELECTORS.docButton).click()
    
    // Verify sidebar shows the document
    const sidebarList = page.locator(CANVAS_SELECTORS.sidebarNodeList)
    await expect(sidebarList).toBeVisible()
    
    const documentItem = sidebarList.locator('[data-node-type="document"]')
    await expect(documentItem).toBeVisible()
    
    // Verify document has proper title/label
    const documentTitle = documentItem.locator('[data-testid="node-title"]')
    await expect(documentTitle).toContainText('Document')
  })

  test('should generate unique IDs for multiple document nodes', async ({ page }) => {
    // Create first document
    await page.locator(CANVAS_SELECTORS.docButton).click()
    const firstNode = page.locator('[data-testid="canvas-node"]').first()
    const firstId = await firstNode.getAttribute('data-node-id')
    
    // Create second document  
    await page.locator(CANVAS_SELECTORS.docButton).click()
    const secondNode = page.locator('[data-testid="canvas-node"]').nth(1)
    const secondId = await secondNode.getAttribute('data-node-id')
    
    // Verify IDs are different
    expect(firstId).toBeTruthy()
    expect(secondId).toBeTruthy()
    expect(firstId).not.toBe(secondId)
  })

  test('should place new nodes at default position', async ({ page }) => {
    await page.locator(CANVAS_SELECTORS.docButton).click()
    
    const node = page.locator('[data-testid="canvas-node"]').first()
    const position = await getNodePosition(page, '[data-testid="canvas-node"]')
    
    // Should be placed at a reasonable default position
    expect(position.x).toBeGreaterThanOrEqual(0)
    expect(position.y).toBeGreaterThanOrEqual(0)
    expect(position.x).toBeLessThan(1000)
    expect(position.y).toBeLessThan(1000)
  })
})

test.describe('Canvas Component - Node Dragging (E2E-CV-02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Create a document node for dragging tests
    await createDocumentNode(page)
  })

  test('should drag node to new position', async ({ page }) => {
    const node = page.locator('[data-testid="canvas-node"]').first()
    
    // Get initial position
    const initialPosition = await getNodePosition(page, '[data-testid="canvas-node"]')
    
    // Perform drag operation
    const nodeCenter = await getCanvasCoordinates(page, '[data-testid="canvas-node"]')
    
    await page.mouse.move(nodeCenter.x, nodeCenter.y)
    await page.mouse.down()
    await page.mouse.move(
      nodeCenter.x + DRAG_POSITIONS.end.x - DRAG_POSITIONS.start.x,
      nodeCenter.y + DRAG_POSITIONS.end.y - DRAG_POSITIONS.start.y,
      { steps: 10 }
    )
    await page.mouse.up()
    
    // Verify node moved to new position
    const finalPosition = await getNodePosition(page, '[data-testid="canvas-node"]')
    
    expect(finalPosition.x).not.toBe(initialPosition.x)
    expect(finalPosition.y).not.toBe(initialPosition.y)
  })

  test('should send MOVE_NODE event to API', async ({ page }) => {
    const node = page.locator('[data-testid="canvas-node"]').first()
    const nodeId = await node.getAttribute('data-node-id')
    
    // Perform drag operation
    const nodeCenter = await getCanvasCoordinates(page, '[data-testid="canvas-node"]')
    
    await page.mouse.move(nodeCenter.x, nodeCenter.y)
    await page.mouse.down()
    await page.mouse.move(nodeCenter.x + 100, nodeCenter.y + 100, { steps: 10 })
    await page.mouse.up()
    
    // Wait for and verify event in API
    const event = await waitForEventInAPI(page, 'MOVE_NODE')
    
    expect(event).toBeTruthy()
    expect(event.type).toBe('MOVE_NODE')
    expect(event.payload.nodeId).toBe(nodeId)
    expect(event.payload.position).toBeTruthy()
    expect(typeof event.payload.position.x).toBe('number')
    expect(typeof event.payload.position.y).toBe('number')
  })

  test('should show visual feedback during drag', async ({ page }) => {
    const node = page.locator('[data-testid="canvas-node"]').first()
    
    // Start drag
    const nodeCenter = await getCanvasCoordinates(page, '[data-testid="canvas-node"]')
    await page.mouse.move(nodeCenter.x, nodeCenter.y)
    await page.mouse.down()
    
    // Check for drag state styling
    await expect(node).toHaveClass(/dragging|drag-active/)
    
    // Move and verify node follows cursor
    await page.mouse.move(nodeCenter.x + 50, nodeCenter.y + 50)
    
    // End drag
    await page.mouse.up()
    
    // Verify drag state is removed
    await expect(node).not.toHaveClass(/dragging|drag-active/)
  })

  test('should maintain node boundaries during drag', async ({ page }) => {
    const node = page.locator('[data-testid="canvas-node"]').first()
    
    // Attempt to drag node to negative coordinates
    const nodeCenter = await getCanvasCoordinates(page, '[data-testid="canvas-node"]')
    
    await page.mouse.move(nodeCenter.x, nodeCenter.y)
    await page.mouse.down()
    await page.mouse.move(-50, -50, { steps: 10 })
    await page.mouse.up()
    
    // Verify node position is clamped to valid bounds
    const position = await getNodePosition(page, '[data-testid="canvas-node"]')
    expect(position.x).toBeGreaterThanOrEqual(0)
    expect(position.y).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Canvas Component - Pan and Zoom Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should pan canvas with mouse drag on empty space', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Get initial viewBox
    const initialViewBox = await canvas.getAttribute('viewBox')
    
    // Pan by dragging on empty space
    await page.mouse.move(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    await page.mouse.down()
    await page.mouse.move(
      CANVAS_DIMENSIONS.centerX + 100,
      CANVAS_DIMENSIONS.centerY + 100,
      { steps: 5 }
    )
    await page.mouse.up()
    
    // Verify viewBox changed
    const finalViewBox = await canvas.getAttribute('viewBox')
    expect(finalViewBox).not.toBe(initialViewBox)
  })

  test('should zoom with mouse wheel', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Get initial viewBox
    const initialViewBox = await canvas.getAttribute('viewBox')
    const initialValues = initialViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    // Zoom in with wheel
    await page.mouse.move(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    await page.mouse.wheel(0, -120) // Zoom in
    
    // Verify viewBox dimensions changed (smaller = zoomed in)
    const finalViewBox = await canvas.getAttribute('viewBox')
    const finalValues = finalViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    expect(finalValues[2]).toBeLessThan(initialValues[2]) // width decreased
    expect(finalValues[3]).toBeLessThan(initialValues[3]) // height decreased
  })

  test('should respect zoom limits', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Zoom in multiple times to test max zoom
    await page.mouse.move(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    
    for (let i = 0; i < 20; i++) {
      await page.mouse.wheel(0, -120)
      await page.waitForTimeout(50)
    }
    
    const maxZoomViewBox = await canvas.getAttribute('viewBox')
    const maxZoomValues = maxZoomViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    // Zoom out multiple times to test min zoom
    for (let i = 0; i < 30; i++) {
      await page.mouse.wheel(0, 120)
      await page.waitForTimeout(50)
    }
    
    const minZoomViewBox = await canvas.getAttribute('viewBox')
    const minZoomValues = minZoomViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    // Verify reasonable zoom limits
    expect(maxZoomValues[2]).toBeGreaterThan(50) // Min width limit
    expect(minZoomValues[2]).toBeLessThan(5000) // Max width limit
  })

  test('should zoom to cursor position', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Position cursor at specific location
    const zoomPoint = { x: 300, y: 200 }
    await page.mouse.move(zoomPoint.x, zoomPoint.y)
    
    // Get initial viewBox
    const initialViewBox = await canvas.getAttribute('viewBox')
    
    // Zoom in at cursor position
    await page.mouse.wheel(0, -120)
    
    // Verify the zoom center is approximately at cursor position
    const finalViewBox = await canvas.getAttribute('viewBox')
    expect(finalViewBox).not.toBe(initialViewBox)
    
    // Additional verification could check that the relative position
    // of the cursor to the viewport remains consistent
  })
})

test.describe('Canvas Component - Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Focus the canvas
    await page.locator(CANVAS_SELECTORS.canvas).click()
  })

  test('should pan with arrow keys', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Get initial viewBox
    const initialViewBox = await canvas.getAttribute('viewBox')
    const initialValues = initialViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    // Pan right with arrow key
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
    
    const rightViewBox = await canvas.getAttribute('viewBox')
    const rightValues = rightViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    expect(rightValues[0]).toBeGreaterThan(initialValues[0]) // X offset increased
    
    // Pan down with arrow key
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(100)
    
    const downViewBox = await canvas.getAttribute('viewBox')
    const downValues = downViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    expect(downValues[1]).toBeGreaterThan(rightValues[1]) // Y offset increased
  })

  test('should zoom with +/- keys', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Get initial viewBox
    const initialViewBox = await canvas.getAttribute('viewBox')
    const initialValues = initialViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    // Zoom in with + key
    await page.keyboard.press('Equal') // + key
    await page.waitForTimeout(100)
    
    const zoomInViewBox = await canvas.getAttribute('viewBox')
    const zoomInValues = zoomInViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    expect(zoomInValues[2]).toBeLessThan(initialValues[2]) // Width decreased (zoomed in)
    
    // Zoom out with - key
    await page.keyboard.press('Minus')
    await page.waitForTimeout(100)
    
    const zoomOutViewBox = await canvas.getAttribute('viewBox')
    const zoomOutValues = zoomOutViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    expect(zoomOutValues[2]).toBeGreaterThan(zoomInValues[2]) // Width increased (zoomed out)
  })

  test('should reset view with R key', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Pan and zoom first
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Equal')
    await page.waitForTimeout(200)
    
    const modifiedViewBox = await canvas.getAttribute('viewBox')
    
    // Reset with R key
    await page.keyboard.press('KeyR')
    await page.waitForTimeout(200)
    
    const resetViewBox = await canvas.getAttribute('viewBox')
    
    // Should return to default view
    expect(resetViewBox).not.toBe(modifiedViewBox)
    
    // Verify default values (this would depend on implementation)
    const resetValues = resetViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    expect(resetValues[0]).toBe(0) // X offset reset
    expect(resetValues[1]).toBe(0) // Y offset reset
  })

  test('should handle keyboard shortcuts with modifiers', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Test Ctrl+0 for reset (alternative shortcut)
    await page.keyboard.press('Control+0')
    await page.waitForTimeout(100)
    
    // Test Ctrl+Plus for zoom in
    await page.keyboard.press('Control+Equal')
    await page.waitForTimeout(100)
    
    const zoomedViewBox = await canvas.getAttribute('viewBox')
    const zoomedValues = zoomedViewBox?.split(' ').map(Number) || [0, 0, 800, 600]
    
    // Should be zoomed in
    expect(zoomedValues[2]).toBeLessThan(800)
  })
})

test.describe('Canvas Component - Touch and Mouse Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should handle touch pan gestures', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Simulate touch pan
    await page.touchscreen.tap(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    
    const initialViewBox = await canvas.getAttribute('viewBox')
    
    // Simulate swipe gesture
    await page.touchscreen.tap(CANVAS_DIMENSIONS.centerX - 100, CANVAS_DIMENSIONS.centerY - 100)
    
    await page.waitForTimeout(200)
    
    const finalViewBox = await canvas.getAttribute('viewBox')
    
    // Touch pan should work similarly to mouse pan
    expect(finalViewBox).not.toBe(initialViewBox)
  })

  test('should prevent default browser zoom on mobile', async ({ page }) => {
    // Create a document node first
    await createDocumentNode(page)
    
    // Simulate pinch gesture (this is challenging in Playwright but we can test the setup)
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Check that touch-action is set to prevent browser zoom
    const touchAction = await canvas.evaluate(el => 
      window.getComputedStyle(el).touchAction
    )
    
    expect(touchAction).toContain('none')
  })

  test('should handle double-click for zoom to fit', async ({ page }) => {
    // Create some nodes first
    await createDocumentNode(page)
    await page.locator(CANVAS_SELECTORS.docButton).click() // Second node
    
    const canvas = page.locator(CANVAS_SELECTORS.canvasSvg)
    
    // Pan and zoom to change the view
    await page.mouse.move(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    await page.mouse.wheel(0, -240) // Zoom in
    
    const zoomedViewBox = await canvas.getAttribute('viewBox')
    
    // Double-click to fit all nodes
    await page.mouse.dblclick(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    await page.waitForTimeout(300)
    
    const fittedViewBox = await canvas.getAttribute('viewBox')
    
    // Should adjust view to fit all nodes
    expect(fittedViewBox).not.toBe(zoomedViewBox)
  })
})

test.describe('Canvas Component - Event Sourcing Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should send ADD_NODE event when creating document', async ({ page }) => {
    await page.locator(CANVAS_SELECTORS.docButton).click()
    
    // Wait for and verify ADD_NODE event
    const event = await waitForEventInAPI(page, 'ADD_NODE')
    
    expect(event.type).toBe('ADD_NODE')
    expect(event.payload.nodeType).toBe('document')
    expect(event.payload.position).toBeTruthy()
    expect(typeof event.payload.position.x).toBe('number')  
    expect(typeof event.payload.position.y).toBe('number')
    expect(event.timestamp).toBeTruthy()
  })

  test('should include user context in events', async ({ page }) => {
    await page.locator(CANVAS_SELECTORS.docButton).click()
    
    const event = await waitForEventInAPI(page, 'ADD_NODE')
    
    // Should have user identification (could be session-based)
    expect(event.userId).toBeTruthy()
  })

  test('should send UPDATE_NODE event when changing node properties', async ({ page }) => {
    // Create a node first
    await createDocumentNode(page)
    
    // Simulate node property update (e.g., through inspector)
    const node = page.locator('[data-testid="canvas-node"]').first()
    await node.click()
    
    // This would trigger opening inspector and updating properties
    // For now, we'll simulate a direct property update
    
    // Wait for potential UPDATE_NODE event
    // Note: This might need adjustment based on actual implementation
    await page.waitForTimeout(1000)
  })

  test('should maintain event ordering', async ({ page }) => {
    // Perform multiple operations quickly
    await page.locator(CANVAS_SELECTORS.docButton).click()
    await page.waitForTimeout(100)
    await page.locator(CANVAS_SELECTORS.docButton).click()
    await page.waitForTimeout(100)
    
    // Get all events
    const response = await page.request.get('/api/events')
    const events = await response.json()
    
    // Filter ADD_NODE events
    const addNodeEvents = events.filter((e: any) => e.type === 'ADD_NODE')
    expect(addNodeEvents.length).toBeGreaterThanOrEqual(2)
    
    // Verify timestamp ordering
    for (let i = 1; i < addNodeEvents.length; i++) {
      const prevTime = new Date(addNodeEvents[i-1].timestamp).getTime()
      const currTime = new Date(addNodeEvents[i].timestamp).getTime()
      expect(currTime).toBeGreaterThanOrEqual(prevTime)
    }
  })

  test('should handle event replay for undo/redo', async ({ page }) => {
    // Create a document node
    await createDocumentNode(page)
    
    // Verify node exists
    const node = page.locator('[data-testid="canvas-node"]')
    await expect(node).toBeVisible()
    
    // Simulate undo (Ctrl+Z)
    await page.keyboard.press('Control+KeyZ')
    await page.waitForTimeout(200)
    
    // Node should be removed/hidden
    await expect(node).not.toBeVisible()
    
    // Simulate redo (Ctrl+Y)
    await page.keyboard.press('Control+KeyY')
    await page.waitForTimeout(200)
    
    // Node should reappear
    await expect(node).toBeVisible()
    
    // Verify UNDO and REDO events in API
    const undoEvent = await waitForEventInAPI(page, 'UNDO')
    expect(undoEvent.type).toBe('UNDO')
    
    const redoEvent = await waitForEventInAPI(page, 'REDO')
    expect(redoEvent.type).toBe('REDO')
  })
})

test.describe('Canvas Component - Accessibility and Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should have proper ARIA labels', async ({ page }) => {
    const canvas = page.locator(CANVAS_SELECTORS.canvas)
    
    // Check main canvas accessibility
    const ariaLabel = await canvas.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('canvas')
    
    // Check SVG has proper role
    const svg = page.locator(CANVAS_SELECTORS.canvasSvg)
    const role = await svg.getAttribute('role')
    expect(role).toBe('img')
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Create some nodes
    await createDocumentNode(page)
    await page.locator(CANVAS_SELECTORS.docButton).click()
    
    // Test tab navigation between nodes
    await page.keyboard.press('Tab')
    
    // Check if focus is on a node
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Should be able to navigate with arrow keys
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(100)
    
    // Focus should move to next node or UI element
  })

  test('should render smoothly with many nodes', async ({ page }) => {
    // Create multiple nodes to test performance
    for (let i = 0; i < 10; i++) {
      await page.locator(CANVAS_SELECTORS.docButton).click()
      await page.waitForTimeout(50)
    }
    
    // Verify all nodes are rendered
    const nodes = page.locator('[data-testid="canvas-node"]')
    const nodeCount = await nodes.count()
    expect(nodeCount).toBe(10)
    
    // Test pan performance with many nodes
    const startTime = Date.now()
    
    await page.mouse.move(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    await page.mouse.down()
    await page.mouse.move(
      CANVAS_DIMENSIONS.centerX + 200,
      CANVAS_DIMENSIONS.centerY + 200,
      { steps: 10 }
    )
    await page.mouse.up()
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete pan operation reasonably quickly
    expect(duration).toBeLessThan(2000)
  })

  test('should maintain 60fps during animations', async ({ page }) => {
    await createDocumentNode(page)
    
    // Start performance monitoring
    await page.evaluate(() => {
      // @ts-ignore
      window.perfData = { frames: 0, startTime: performance.now() }
      
      function measureFPS() {
        // @ts-ignore
        window.perfData.frames++
        requestAnimationFrame(measureFPS)
      }
      
      requestAnimationFrame(measureFPS)
    })
    
    // Perform smooth pan operation
    await page.mouse.move(CANVAS_DIMENSIONS.centerX, CANVAS_DIMENSIONS.centerY)
    await page.mouse.down()
    
    for (let i = 0; i < 60; i++) {
      await page.mouse.move(
        CANVAS_DIMENSIONS.centerX + i * 2,
        CANVAS_DIMENSIONS.centerY + i * 2
      )
      await page.waitForTimeout(16) // ~60fps
    }
    
    await page.mouse.up()
    
    // Check FPS
    const perfData = await page.evaluate(() => {
      // @ts-ignore
      const data = window.perfData
      const duration = performance.now() - data.startTime
      return { fps: (data.frames / duration) * 1000 }
    })
    
    // Should maintain reasonable frame rate
    expect(perfData.fps).toBeGreaterThan(30)
  })
})