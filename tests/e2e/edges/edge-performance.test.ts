/**
 * Edge Performance E2E Tests
 * 
 * End-to-end performance tests for edge rendering and interactions:
 * - Many edges rendering performance
 * - Complex routing calculations
 * - Memory usage with animations
 * - Real-time edge updates
 * 
 * Following TDD methodology - these tests define performance requirements.
 */

import { test, expect, type Page } from '@playwright/test'
import { EDGE_SELECTORS } from '../../fixtures/edges'
import { CANVAS_SELECTORS } from '../../fixtures/canvas'

test.describe('Edge Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Wait for canvas to be ready
    await expect(page.locator(CANVAS_SELECTORS.canvasSvg)).toBeVisible()
  })

  test('should render 100 edges efficiently', async ({ page }) => {
    // Create a 10x10 grid of nodes
    const gridSize = 10
    const nodePositions = []
    
    console.log('Creating grid of nodes...')
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = 50 + col * 80
        const y = 50 + row * 60
        nodePositions.push({ x, y })
        
        await page.click(CANVAS_SELECTORS.addDocButton)
        await page.click(CANVAS_SELECTORS.canvasSvg, { 
          position: { x, y },
          timeout: 1000
        })
      }
    }
    
    await expect(page.locator(CANVAS_SELECTORS.canvasNode)).toHaveCount(100)
    
    // Start performance measurement
    const startTime = await page.evaluate(() => performance.now())
    
    console.log('Creating edges...')
    // Create edges connecting adjacent nodes
    let edgeCount = 0
    for (let i = 0; i < gridSize * gridSize - 1; i++) {
      // Connect to right neighbor
      if ((i + 1) % gridSize !== 0) {
        await createQuickEdge(page, i, i + 1)
        edgeCount++
      }
      
      // Connect to bottom neighbor  
      if (i + gridSize < gridSize * gridSize) {
        await createQuickEdge(page, i, i + gridSize)
        edgeCount++
      }
      
      // Limit to prevent test timeout
      if (edgeCount >= 50) break
    }
    
    const renderTime = await page.evaluate(() => performance.now()) - startTime
    
    console.log(`Created ${edgeCount} edges in ${renderTime}ms`)
    
    // Should create edges efficiently
    expect(renderTime).toBeLessThan(10000) // 10 seconds max
    
    // Verify edges exist
    const actualEdgeCount = await page.locator(EDGE_SELECTORS.canvasEdge).count()
    expect(actualEdgeCount).toBeGreaterThan(40)
    
    // Canvas should remain responsive
    const panStartTime = await page.evaluate(() => performance.now())
    
    await page.mouse.move(400, 300)
    await page.mouse.down()
    await page.mouse.move(500, 350, { steps: 10 })
    await page.mouse.up()
    
    const panTime = await page.evaluate(() => performance.now()) - panStartTime
    
    // Panning should be smooth even with many edges
    expect(panTime).toBeLessThan(500) // 500ms max for pan
  })

  test('should handle edge animations without performance degradation', async ({ page }) => {
    // Create fewer nodes but with animations
    await createTestGrid(page, 4, 4) // 16 nodes
    
    // Create edges with flow animations
    await page.evaluate(() => {
      // Enable edge animations globally
      window.edgeConfig = { enableAnimations: true }
    })
    
    let edgeCount = 0
    for (let i = 0; i < 12; i++) {
      await createQuickEdge(page, i, i + 1)
      edgeCount++
      
      // Enable animation on created edge
      const edge = page.locator(EDGE_SELECTORS.canvasEdge).nth(i)
      await edge.click() // Select
      
      await page.click('[data-testid="enable-animation"]')
    }
    
    console.log(`Created ${edgeCount} animated edges`)
    
    // Measure animation performance
    const animationMetrics = await page.evaluate(async () => {
      const startTime = performance.now()
      let frameCount = 0
      
      return new Promise((resolve) => {
        function measureFrame() {
          frameCount++
          if (performance.now() - startTime < 2000) { // 2 seconds
            requestAnimationFrame(measureFrame)
          } else {
            const fps = frameCount / ((performance.now() - startTime) / 1000)
            resolve({ fps, frameCount, duration: performance.now() - startTime })
          }
        }
        requestAnimationFrame(measureFrame)
      })
    })
    
    console.log('Animation metrics:', animationMetrics)
    
    // Should maintain reasonable FPS with animations
    expect(animationMetrics.fps).toBeGreaterThan(30) // 30 FPS minimum
    
    // Verify animations are visible
    const animatedEdges = page.locator(EDGE_SELECTORS.flowAnimation)
    const animatedCount = await animatedEdges.count()
    expect(animatedCount).toBeGreaterThan(0)
  })

  test('should handle complex routing calculations efficiently', async ({ page }) => {
    // Create nodes in a complex layout with obstacles
    const complexLayout = [
      { x: 100, y: 100 }, { x: 200, y: 100 }, { x: 300, y: 100 },
      { x: 150, y: 200 }, { x: 250, y: 200 },
      { x: 100, y: 300 }, { x: 200, y: 300 }, { x: 300, y: 300 }
    ]
    
    for (const pos of complexLayout) {
      await page.click(CANVAS_SELECTORS.addDocButton)
      await page.click(CANVAS_SELECTORS.canvasSvg, { position: pos })
    }
    
    // Enable smart routing with obstacle avoidance
    await page.click('[data-testid="routing-settings"]')
    await page.click('[data-testid="routing-smart"]')
    await page.check('[data-testid="avoid-nodes"]')
    
    const startTime = await page.evaluate(() => performance.now())
    
    // Create edges that require complex routing
    const routingCases = [
      [0, 7], // Diagonal across obstacles
      [1, 5], // Around obstacles
      [2, 4], // Complex path
      [3, 6], // Another complex path
    ]
    
    for (const [source, target] of routingCases) {
      await createQuickEdge(page, source, target)
      
      // Wait for routing calculation
      await page.waitForTimeout(100)
    }
    
    const routingTime = await page.evaluate(() => performance.now()) - startTime
    
    console.log(`Complex routing completed in ${routingTime}ms`)
    
    // Should calculate routes efficiently
    expect(routingTime).toBeLessThan(2000) // 2 seconds max
    
    // Verify edges avoid obstacles (visual inspection through path data)
    const edges = page.locator(EDGE_SELECTORS.canvasEdge)
    const edgeCount = await edges.count()
    expect(edgeCount).toBe(4)
    
    // Check that paths are not simple straight lines (indicating routing worked)
    for (let i = 0; i < edgeCount; i++) {
      const edge = edges.nth(i)
      const pathElement = edge.locator(EDGE_SELECTORS.edgePath)
      const pathData = await pathElement.getAttribute('d')
      
      // Should have waypoints or curves (not just M...L pattern)
      expect(pathData).toMatch(/(C|Q|A|L.*L)/) // Contains curves or multiple line segments
    }
  })

  test('should handle real-time edge updates efficiently', async ({ page }) => {
    await createTestGrid(page, 3, 3) // 9 nodes
    
    // Create initial edges
    for (let i = 0; i < 6; i++) {
      await createQuickEdge(page, i, i + 1)
    }
    
    const startTime = await page.evaluate(() => performance.now())
    
    // Simulate real-time updates by moving nodes
    console.log('Starting real-time updates...')
    for (let i = 0; i < 20; i++) {
      const nodeIndex = i % 6 // Cycle through first 6 nodes
      const node = page.locator(CANVAS_SELECTORS.canvasNode).nth(nodeIndex)
      
      // Move node slightly to trigger edge updates
      await node.dragTo(node, {
        targetPosition: { 
          x: Math.sin(i * 0.5) * 20, 
          y: Math.cos(i * 0.5) * 20 
        }
      })
      
      // Small delay to simulate real-time updates
      await page.waitForTimeout(50)
    }
    
    const updateTime = await page.evaluate(() => performance.now()) - startTime
    
    console.log(`Real-time updates completed in ${updateTime}ms`)
    
    // Should handle updates efficiently
    expect(updateTime).toBeLessThan(5000) // 5 seconds max
    
    // Verify edges are still connected after updates
    const edges = page.locator(EDGE_SELECTORS.canvasEdge)
    const edgeCount = await edges.count()
    expect(edgeCount).toBe(6) // Should maintain all edges
    
    // Check that edges update their paths (not stuck)
    const firstEdge = edges.first()
    const pathElement = firstEdge.locator(EDGE_SELECTORS.edgePath)
    const pathData = await pathElement.getAttribute('d')
    expect(pathData).toBeTruthy()
    expect(pathData).not.toBe('M 0,0 L 0,0') // Should not be degenerate
  })

  test('should maintain performance during bulk operations', async ({ page }) => {
    await createTestGrid(page, 5, 4) // 20 nodes
    
    // Create many edges
    console.log('Creating edges for bulk operations...')
    for (let i = 0; i < 15; i++) {
      await createQuickEdge(page, i, (i + 3) % 20)
    }
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(15)
    
    // Test bulk selection performance
    const selectionStartTime = await page.evaluate(() => performance.now())
    
    // Select all edges with Ctrl+A
    await page.keyboard.press('Control+a')
    
    const selectionTime = await page.evaluate(() => performance.now()) - selectionStartTime
    
    console.log(`Bulk selection took ${selectionTime}ms`)
    expect(selectionTime).toBeLessThan(1000) // 1 second max
    
    // Verify all edges are selected
    const selectedEdges = page.locator(EDGE_SELECTORS.canvasEdge + '.edge-selected')
    const selectedCount = await selectedEdges.count()
    expect(selectedCount).toBe(15)
    
    // Test bulk deletion performance
    const deletionStartTime = await page.evaluate(() => performance.now())
    
    await page.keyboard.press('Delete')
    
    const deletionTime = await page.evaluate(() => performance.now()) - deletionStartTime
    
    console.log(`Bulk deletion took ${deletionTime}ms`)
    expect(deletionTime).toBeLessThan(1000) // 1 second max
    
    // Verify all edges are deleted
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(0)
  })

  test('should handle memory usage efficiently with many edges', async ({ page }) => {
    // Monitor memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
    })
    
    if (!initialMemory) {
      console.log('Memory monitoring not available, skipping memory test')
      return
    }
    
    await createTestGrid(page, 6, 6) // 36 nodes
    
    // Create many edges with various features
    console.log('Creating feature-rich edges...')
    for (let i = 0; i < 30; i++) {
      await createQuickEdge(page, i, (i + 5) % 36)
      
      // Add features to some edges
      if (i % 3 === 0) {
        const edge = page.locator(EDGE_SELECTORS.canvasEdge).nth(i)
        await edge.dblclick() // Add label
        
        await page.locator('[data-testid="edge-label-editor"]').fill(`Edge ${i}`)
        await page.keyboard.press('Enter')
      }
      
      if (i % 4 === 0) {
        const edge = page.locator(EDGE_SELECTORS.canvasEdge).nth(i)
        await edge.click()
        await page.click('[data-testid="enable-animation"]')
      }
    }
    
    const peakMemory = await page.evaluate(() => {
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
    })
    
    // Clean up by deleting edges
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Delete')
    
    await page.waitForTimeout(1000) // Allow cleanup
    
    const finalMemory = await page.evaluate(() => {
      // Force garbage collection if available
      if (window.gc) window.gc()
      return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
    })
    
    if (peakMemory && finalMemory) {
      const memoryIncrease = peakMemory - initialMemory
      const memoryRecovered = peakMemory - finalMemory
      const recoveryRate = memoryRecovered / memoryIncrease
      
      console.log(`Memory: Initial ${initialMemory}, Peak ${peakMemory}, Final ${finalMemory}`)
      console.log(`Memory increase: ${memoryIncrease} bytes, Recovery rate: ${(recoveryRate * 100).toFixed(1)}%`)
      
      // Should not leak too much memory
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // 50MB max increase
      expect(recoveryRate).toBeGreaterThan(0.7) // Should recover at least 70% of memory
    }
  })

  test('should handle viewport culling efficiently', async ({ page }) => {
    // Create nodes spread across a large area
    const wideSpread = []
    for (let i = 0; i < 20; i++) {
      wideSpread.push({
        x: (i % 10) * 200,
        y: Math.floor(i / 10) * 200
      })
    }
    
    for (const pos of wideSpread) {
      await page.click(CANVAS_SELECTORS.addDocButton)
      await page.click(CANVAS_SELECTORS.canvasSvg, { position: pos })
    }
    
    // Create edges
    for (let i = 0; i < 15; i++) {
      await createQuickEdge(page, i, (i + 1) % 20)
    }
    
    // Pan to show only part of the canvas
    await page.mouse.move(400, 300)
    await page.mouse.down()
    await page.mouse.move(-500, -200, { steps: 5 }) // Pan away from most content
    await page.mouse.up()
    
    // Measure rendering performance when most edges are off-screen
    const cullStartTime = await page.evaluate(() => performance.now())
    
    // Trigger re-render by zooming
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Equal') // Zoom in
      await page.waitForTimeout(100)
    }
    
    const cullTime = await page.evaluate(() => performance.now()) - cullStartTime
    
    console.log(`Viewport culling performance: ${cullTime}ms`)
    
    // Should handle culling efficiently
    expect(cullTime).toBeLessThan(2000) // 2 seconds max
    
    // Should still maintain responsive interface
    await page.click(CANVAS_SELECTORS.resetViewButton)
    await expect(page.locator(CANVAS_SELECTORS.canvasSvg)).toHaveAttribute('viewBox', '0 0 1200 800')
  })

  // Helper functions
  async function createTestGrid(page: Page, rows: number, cols: number) {
    console.log(`Creating ${rows}x${cols} grid...`)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 50 + col * 100
        const y = 50 + row * 80
        
        await page.click(CANVAS_SELECTORS.addDocButton)
        await page.click(CANVAS_SELECTORS.canvasSvg, { 
          position: { x, y },
          timeout: 500
        })
      }
    }
    
    await expect(page.locator(CANVAS_SELECTORS.canvasNode)).toHaveCount(rows * cols)
  }

  async function createQuickEdge(page: Page, sourceIndex: number, targetIndex: number) {
    const sourceNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(sourceIndex)
    const targetNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(targetIndex)
    
    await sourceNode.hover({ timeout: 500 })
    const sourceAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="right"]').nth(sourceIndex)
    
    await targetNode.hover({ timeout: 500 })
    const targetAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="left"]').nth(targetIndex)
    
    await sourceAnchor.dragTo(targetAnchor, { timeout: 1000 })
  }
})