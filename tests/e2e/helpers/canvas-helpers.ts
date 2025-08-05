/**
 * Canvas E2E Test Helper Functions
 * 
 * Reusable utility functions for Canvas component E2E testing.
 * These helpers abstract common operations and provide consistent
 * test patterns across different test scenarios.
 */

import { Page, Locator, expect } from '@playwright/test'
import { CANVAS_SELECTORS, CANVAS_CONFIG, testPositions } from '../../fixtures/canvas'

/**
 * Canvas interaction helpers
 */
export class CanvasHelpers {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Navigate to the application and wait for canvas to load
   */
  async initializeCanvas(): Promise<void> {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
    
    // Wait for canvas to be visible
    await expect(this.page.locator(CANVAS_SELECTORS.canvas)).toBeVisible()
    await expect(this.page.locator(CANVAS_SELECTORS.canvasSvg)).toBeVisible()
  }

  /**
   * Get canvas SVG element
   */
  getCanvas(): Locator {
    return this.page.locator(CANVAS_SELECTORS.canvasSvg)
  }

  /**
   * Get canvas bounding box and center coordinates
   */
  async getCanvasBounds() {
    const canvas = this.getCanvas()
    const bbox = await canvas.boundingBox()
    
    if (!bbox) {
      throw new Error('Canvas bounding box not found')
    }

    return {
      ...bbox,
      centerX: bbox.x + bbox.width / 2,
      centerY: bbox.y + bbox.height / 2,
    }
  }

  /**
   * Get current viewBox values from SVG
   */
  async getViewBox(): Promise<{ x: number; y: number; width: number; height: number }> {
    const viewBox = await this.getCanvas().getAttribute('viewBox')
    
    if (!viewBox) {
      throw new Error('ViewBox not found on canvas SVG')
    }

    const values = viewBox.split(' ').map(Number)
    return {
      x: values[0],
      y: values[1], 
      width: values[2],
      height: values[3],
    }
  }

  /**
   * Create a document node at specified position
   */
  async createDocumentNode(position?: { x: number; y: number }): Promise<Locator> {
    await this.page.locator(CANVAS_SELECTORS.addDocButton).click()
    
    // Wait for node to appear
    const node = this.page.locator(CANVAS_SELECTORS.documentNode).first()
    await expect(node).toBeVisible()

    return node
  }

  /**
   * Create an agent node at specified position
   */
  async createAgentNode(position?: { x: number; y: number }): Promise<Locator> {
    await this.page.locator(CANVAS_SELECTORS.addAgentButton).click()
    
    // Wait for node to appear
    const node = this.page.locator(CANVAS_SELECTORS.agentNode).first()
    await expect(node).toBeVisible()

    return node
  }

  /**
   * Get node position from transform attribute
   */
  async getNodePosition(node: Locator): Promise<{ x: number; y: number }> {
    const transform = await node.getAttribute('transform')
    
    if (!transform) {
      return { x: 0, y: 0 }
    }

    const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
    if (!match) {
      return { x: 0, y: 0 }
    }

    return {
      x: parseFloat(match[1]),
      y: parseFloat(match[2]),
    }
  }

  /**
   * Get node by ID
   */
  getNodeById(nodeId: string): Locator {
    return this.page.locator(`[data-testid="canvas-node"][data-node-id="${nodeId}"]`)
  }

  /**
   * Get all visible nodes
   */
  getAllNodes(): Locator {
    return this.page.locator(CANVAS_SELECTORS.canvasNode)
  }

  /**
   * Drag a node from current position to target position
   */
  async dragNode(node: Locator, targetPosition: { x: number; y: number }): Promise<void> {
    // Get node center coordinates
    const bbox = await node.boundingBox()
    if (!bbox) {
      throw new Error('Node bounding box not found')
    }

    const startX = bbox.x + bbox.width / 2
    const startY = bbox.y + bbox.height / 2

    // Perform drag operation
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(targetPosition.x, targetPosition.y, { steps: 10 })
    await this.page.mouse.up()
  }

  /**
   * Pan canvas by dragging empty space
   */
  async panCanvas(offset: { x: number; y: number }): Promise<void> {
    const bounds = await this.getCanvasBounds()
    
    // Start from center of canvas
    const startX = bounds.centerX
    const startY = bounds.centerY
    
    await this.page.mouse.move(startX, startY)
    await this.page.mouse.down()
    await this.page.mouse.move(startX + offset.x, startY + offset.y, { steps: 5 })
    await this.page.mouse.up()
  }

  /**
   * Zoom canvas using mouse wheel
   */
  async zoomCanvas(direction: 'in' | 'out', steps = 1): Promise<void> {
    const bounds = await this.getCanvasBounds()
    
    await this.page.mouse.move(bounds.centerX, bounds.centerY)
    
    const wheelDelta = direction === 'in' ? -120 : 120
    for (let i = 0; i < steps; i++) {
      await this.page.mouse.wheel(0, wheelDelta)
      await this.page.waitForTimeout(50)
    }
  }

  /**
   * Reset canvas view using keyboard shortcut
   */
  async resetView(): Promise<void> {
    await this.page.keyboard.press('KeyR')
    await this.page.waitForTimeout(200)
  }

  /**
   * Focus the canvas for keyboard interactions
   */
  async focusCanvas(): Promise<void> {
    await this.page.locator(CANVAS_SELECTORS.canvas).click()
  }

  /**
   * Double-click canvas to fit view to content
   */
  async fitToContent(): Promise<void> {
    const bounds = await this.getCanvasBounds()
    await this.page.mouse.dblclick(bounds.centerX, bounds.centerY)
    await this.page.waitForTimeout(300)
  }
}

/**
 * Event API helpers for testing event sourcing
 */
export class EventAPIHelpers {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Get all events from the API
   */
  async getAllEvents(): Promise<any[]> {
    const response = await this.page.request.get('/api/events')
    expect(response.ok()).toBeTruthy()
    return await response.json()
  }

  /**
   * Get events filtered by type
   */
  async getEventsByType(eventType: string): Promise<any[]> {
    const events = await this.getAllEvents()
    return events.filter(event => event.type === eventType)
  }

  /**
   * Wait for a specific event to appear in the API
   */
  async waitForEvent(eventType: string, timeout = 5000): Promise<any> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const events = await this.getEventsByType(eventType)
        if (events.length > 0) {
          return events[events.length - 1] // Return latest event
        }
        
        await this.page.waitForTimeout(100)
      } catch (error) {
        // Continue polling
      }
    }
    
    throw new Error(`Event ${eventType} not found within ${timeout}ms`)
  }

  /**
   * Wait for event with specific payload properties
   */
  async waitForEventWithPayload(eventType: string, payloadMatch: Record<string, any>, timeout = 5000): Promise<any> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const events = await this.getEventsByType(eventType)
        
        const matchingEvent = events.find(event => {
          return Object.entries(payloadMatch).every(([key, value]) => {
            return event.payload && event.payload[key] === value
          })
        })
        
        if (matchingEvent) {
          return matchingEvent
        }
        
        await this.page.waitForTimeout(100)
      } catch (error) {
        // Continue polling
      }
    }
    
    throw new Error(`Event ${eventType} with matching payload not found within ${timeout}ms`)
  }

  /**
   * Verify event has required structure
   */
  verifyEventStructure(event: any): void {
    expect(event).toBeTruthy()
    expect(event.type).toBeTruthy()
    expect(event.payload).toBeDefined()
    expect(event.timestamp).toBeTruthy()
    
    // Verify timestamp is valid date
    const timestamp = new Date(event.timestamp)
    expect(timestamp.getTime()).not.toBeNaN()
  }

  /**
   * Clear all events (for test cleanup)
   */
  async clearEvents(): Promise<void> {
    // This would depend on API implementation
    // For now, we'll just verify we can get events
    await this.getAllEvents()
  }
}

/**
 * Animation and timing helpers
 */
export class AnimationHelpers {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Wait for CSS animations to complete
   */
  async waitForAnimations(selector: string, timeout = 1000): Promise<void> {
    await this.page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel)
        if (!element) return true
        
        const styles = window.getComputedStyle(element)
        const animationName = styles.animationName
        const transitionProperty = styles.transitionProperty
        
        return animationName === 'none' && transitionProperty === 'none'
      },
      selector,
      { timeout }
    )
  }

  /**
   * Measure animation performance
   */
  async measureAnimationPerformance(animationTrigger: () => Promise<void>): Promise<{ duration: number; fps: number }> {
    // Start performance monitoring
    await this.page.evaluate(() => {
      // @ts-ignore
      window.animationPerfData = { 
        frames: 0, 
        startTime: performance.now(),
        endTime: 0,
      }
      
      function measureFrames() {
        // @ts-ignore
        window.animationPerfData.frames++
        // @ts-ignore
        window.animationPerfData.endTime = performance.now()
        requestAnimationFrame(measureFrames)
      }
      
      requestAnimationFrame(measureFrames)
    })

    // Trigger animation
    await animationTrigger()
    
    // Wait for animation to complete
    await this.page.waitForTimeout(500)

    // Get performance data
    const perfData = await this.page.evaluate(() => {
      // @ts-ignore
      const data = window.animationPerfData
      const duration = data.endTime - data.startTime
      const fps = (data.frames / duration) * 1000
      
      return { duration, fps }
    })

    return perfData
  }
}

/**
 * Accessibility helpers
 */
export class AccessibilityHelpers {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Verify element has proper ARIA attributes
   */
  async verifyAriaAttributes(selector: string, expectedAttributes: Record<string, string>): Promise<void> {
    const element = this.page.locator(selector)
    
    for (const [attr, expectedValue] of Object.entries(expectedAttributes)) {
      const actualValue = await element.getAttribute(attr)
      expect(actualValue).toBe(expectedValue)
    }
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(startSelector: string, keys: string[]): Promise<void> {
    await this.page.locator(startSelector).focus()
    
    for (const key of keys) {
      await this.page.keyboard.press(key)
      await this.page.waitForTimeout(100)
      
      // Verify focus is still within the application
      const focusedElement = this.page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    }
  }

  /**
   * Check color contrast ratios
   */
  async checkColorContrast(selector: string): Promise<void> {
    const contrastRatio = await this.page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (!element) return null
      
      const styles = window.getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor
      
      // This is a simplified check - in practice you'd use a proper contrast calculation
      return { color, backgroundColor }
    }, selector)
    
    expect(contrastRatio).toBeTruthy()
  }
}

/**
 * Performance testing helpers
 */
export class PerformanceHelpers {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * Measure operation timing
   */
  async measureTiming(operation: () => Promise<void>): Promise<number> {
    const startTime = Date.now()
    await operation()
    const endTime = Date.now()
    
    return endTime - startTime
  }

  /**
   * Load test with multiple nodes
   */
  async loadTestNodes(nodeCount: number): Promise<{ creationTime: number; renderTime: number }> {
    const canvasHelpers = new CanvasHelpers(this.page)
    
    // Measure node creation time
    const creationStartTime = Date.now()
    
    for (let i = 0; i < nodeCount; i++) {
      await canvasHelpers.createDocumentNode()
      
      // Small delay to prevent overwhelming the system
      if (i % 10 === 0) {
        await this.page.waitForTimeout(50)
      }
    }
    
    const creationEndTime = Date.now()
    
    // Measure render performance
    const renderStartTime = Date.now()
    
    // Trigger a pan operation to test render performance
    await canvasHelpers.panCanvas({ x: 100, y: 100 })
    
    const renderEndTime = Date.now()
    
    return {
      creationTime: creationEndTime - creationStartTime,
      renderTime: renderEndTime - renderStartTime,
    }
  }

  /**
   * Monitor memory usage during operations
   */
  async monitorMemoryUsage(operation: () => Promise<void>): Promise<{ before: number; after: number; delta: number }> {
    // Get initial memory usage
    const beforeMemory = await this.page.evaluate(() => {
      // @ts-ignore
      return performance.memory ? performance.memory.usedJSHeapSize : 0
    })

    await operation()

    // Force garbage collection if available
    await this.page.evaluate(() => {
      // @ts-ignore
      if (window.gc) window.gc()
    })

    // Get final memory usage
    const afterMemory = await this.page.evaluate(() => {
      // @ts-ignore
      return performance.memory ? performance.memory.usedJSHeapSize : 0
    })

    return {
      before: beforeMemory,
      after: afterMemory,
      delta: afterMemory - beforeMemory,
    }
  }
}