/**
 * Edge Creation Workflow E2E Tests
 * 
 * End-to-end tests for complete edge creation workflows including:
 * - Drag-and-drop edge creation between nodes
 * - Edge selection and editing
 * - Edge deletion and undo/redo
 * - Performance with multiple edges
 * 
 * Following TDD methodology - these tests define expected user interactions.
 */

import { test, expect, type Page } from '@playwright/test'
import { EDGE_SELECTORS } from '../../fixtures/edges'
import { CANVAS_SELECTORS, testPositions } from '../../fixtures/canvas'

test.describe('Edge Creation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')
    
    // Wait for canvas to be ready
    await expect(page.locator(CANVAS_SELECTORS.canvasSvg)).toBeVisible()
  })

  test('should create edge by dragging between node anchors', async ({ page }) => {
    // Add two nodes first
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { 
      position: { x: 200, y: 200 } 
    })
    
    await page.click(CANVAS_SELECTORS.addAgentButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { 
      position: { x: 400, y: 200 } 
    })
    
    // Wait for nodes to be created
    await expect(page.locator(CANVAS_SELECTORS.canvasNode)).toHaveCount(2)
    
    // Hover over first node to reveal anchors
    const sourceNode = page.locator(CANVAS_SELECTORS.documentNode).first()
    await sourceNode.hover()
    
    // Should show connection anchors on hover
    await expect(page.locator(EDGE_SELECTORS.nodeAnchor)).toHaveCount(4) // 4 anchors per node
    
    // Start drag from right anchor of first node
    const sourceAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="right"]').first()
    await expect(sourceAnchor).toBeVisible()
    
    // Begin edge creation by dragging from anchor
    await sourceAnchor.dragTo(page.locator(CANVAS_SELECTORS.canvasSvg), {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Should show preview edge during drag
    await expect(page.locator(EDGE_SELECTORS.connectionPreview)).toBeVisible()
    
    // Drag to left anchor of second node
    const targetNode = page.locator(CANVAS_SELECTORS.agentNode).first()
    await targetNode.hover()
    
    const targetAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="left"]').last()
    await expect(targetAnchor).toBeVisible()
    
    // Complete edge creation by dropping on target anchor
    await page.mouse.move(450, 200) // Move to target anchor
    await page.mouse.up()
    
    // Should create actual edge
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(1)
    
    // Edge should connect the two nodes
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    await expect(edge).toHaveAttribute('data-source-node', expect.stringContaining('doc-'))
    await expect(edge).toHaveAttribute('data-target-node', expect.stringContaining('agent-'))
  })

  test('should show visual feedback during edge creation', async ({ page }) => {
    // Setup nodes
    await createTwoNodes(page)
    
    const sourceNode = page.locator(CANVAS_SELECTORS.documentNode).first()
    await sourceNode.hover()
    
    const sourceAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="right"]').first()
    
    // Start edge creation
    await sourceAnchor.dragTo(page.locator(CANVAS_SELECTORS.canvasSvg), {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Should show creation indicator
    await expect(page.locator('[data-testid="creation-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="creation-indicator"]')).toContainText('Creating connection')
    
    // Should change cursor
    await expect(page.locator(CANVAS_SELECTORS.canvasSvg)).toHaveCSS('cursor', 'crosshair')
    
    // Preview edge should be dashed
    const preview = page.locator(EDGE_SELECTORS.connectionPreview)
    await expect(preview).toHaveCSS('stroke-dasharray', expect.stringContaining('5'))
    
    // Cancel creation with Escape
    await page.keyboard.press('Escape')
    
    // Should clean up creation state
    await expect(page.locator(EDGE_SELECTORS.connectionPreview)).not.toBeVisible()
    await expect(page.locator('[data-testid="creation-indicator"]')).not.toBeVisible()
  })

  test('should validate connection compatibility', async ({ page }) => {
    await createTwoNodes(page)
    
    // Try to connect incompatible anchors (e.g., two output anchors)
    const sourceNode = page.locator(CANVAS_SELECTORS.documentNode).first()
    await sourceNode.hover()
    
    const sourceOutputAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-connection-type="output"]').first()
    
    await sourceOutputAnchor.dragTo(page.locator(CANVAS_SELECTORS.canvasSvg), {
      targetPosition: { x: 300, y: 200 }
    })
    
    // Hover over target node's output anchor (incompatible)
    const targetNode = page.locator(CANVAS_SELECTORS.agentNode).first()
    await targetNode.hover()
    
    const targetOutputAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-connection-type="output"]').last()
    await page.mouse.move(450, 200)
    
    // Should show invalid connection indicator
    const preview = page.locator(EDGE_SELECTORS.connectionPreview)
    await expect(preview).toHaveClass(/preview-invalid/)
    await expect(preview).toHaveCSS('stroke', expect.stringMatching(/#ef4444|red/))
    
    // Attempt to complete invalid connection
    await page.mouse.up()
    
    // Should not create edge
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(0)
    
    // Should show error message
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="connection-error"]')).toContainText('Incompatible connection')
  })

  test('should support different edge types during creation', async ({ page }) => {
    await createTwoNodes(page)
    
    // Select straight edge type
    await page.click('[data-testid="edge-type-selector"]')
    await page.click('[data-testid="edge-type-straight"]')
    
    // Create edge
    await createEdgeBetweenNodes(page)
    
    // Should create straight edge
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    await expect(edge).toHaveAttribute('data-edge-type', 'straight')
    
    // Path should be a straight line
    const edgePath = edge.locator(EDGE_SELECTORS.edgePath)
    const pathData = await edgePath.getAttribute('d')
    expect(pathData).toMatch(/^M \d+,\d+ L \d+,\d+$/) // Straight line pattern
  })

  test('should select and highlight edges', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    
    // Click to select edge
    await edge.click()
    
    // Should show selection highlight
    await expect(edge).toHaveClass(/edge-selected/)
    await expect(page.locator(EDGE_SELECTORS.selectionHighlight)).toBeVisible()
    
    // Should show control points for bezier edges
    await expect(page.locator(EDGE_SELECTORS.controlPoint)).toHaveCount(2)
    
    // Should show delete handle
    await expect(page.locator(EDGE_SELECTORS.deleteHandle)).toBeVisible()
  })

  test('should edit edge control points by dragging', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    await edge.click() // Select edge
    
    const controlPoint = page.locator(EDGE_SELECTORS.controlPoint).first()
    await expect(controlPoint).toBeVisible()
    
    // Get initial path
    const edgePath = edge.locator(EDGE_SELECTORS.edgePath)
    const initialPath = await edgePath.getAttribute('d')
    
    // Drag control point
    await controlPoint.dragTo(controlPoint, {
      targetPosition: { x: 50, y: 50 } // Relative offset
    })
    
    // Path should update
    const updatedPath = await edgePath.getAttribute('d')
    expect(updatedPath).not.toBe(initialPath)
    
    // Control point should move
    const controlPointPosition = await controlPoint.boundingBox()
    expect(controlPointPosition).toBeTruthy()
  })

  test('should delete edges with delete handle', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    // Select edge
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    await edge.click()
    
    // Click delete handle
    const deleteHandle = page.locator(EDGE_SELECTORS.deleteHandle)
    await expect(deleteHandle).toBeVisible()
    await deleteHandle.click()
    
    // Should remove edge
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(0)
  })

  test('should delete edges with keyboard shortcut', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    // Select edge
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    await edge.click()
    
    // Press Delete key
    await page.keyboard.press('Delete')
    
    // Should remove edge
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(0)
  })

  test('should support undo/redo for edge operations', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    // Verify edge exists
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(1)
    
    // Delete edge
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    await edge.click()
    await page.keyboard.press('Delete')
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(0)
    
    // Undo deletion
    await page.keyboard.press('Control+z')
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(1)
    
    // Redo deletion
    await page.keyboard.press('Control+y')
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(0)
  })

  test('should handle edge labels', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    
    // Double-click edge to add label
    await edge.dblclick()
    
    // Should show label editor
    const labelEditor = page.locator('[data-testid="edge-label-editor"]')
    await expect(labelEditor).toBeVisible()
    
    // Type label text
    await labelEditor.fill('Test Edge Label')
    await page.keyboard.press('Enter')
    
    // Should show edge label
    const edgeLabel = page.locator(EDGE_SELECTORS.edgeLabel)
    await expect(edgeLabel).toBeVisible()
    await expect(edgeLabel).toContainText('Test Edge Label')
  })

  test('should show context menu on right-click', async ({ page }) => {
    await createTwoNodes(page)
    await createEdgeBetweenNodes(page)
    
    const edge = page.locator(EDGE_SELECTORS.canvasEdge).first()
    
    // Right-click edge
    await edge.click({ button: 'right' })
    
    // Should show context menu
    const contextMenu = page.locator(EDGE_SELECTORS.edgeContextMenu)
    await expect(contextMenu).toBeVisible()
    
    // Should have menu items
    await expect(page.locator(EDGE_SELECTORS.editLabelMenuItem)).toBeVisible()
    await expect(page.locator(EDGE_SELECTORS.deleteEdgeMenuItem)).toBeVisible()
    
    // Click edit label
    await page.locator(EDGE_SELECTORS.editLabelMenuItem).click()
    
    await expect(page.locator('[data-testid="edge-label-editor"]')).toBeVisible()
  })

  test('should handle performance with many edges', async ({ page }) => {
    // Create a grid of nodes
    const nodeCount = 10
    for (let i = 0; i < nodeCount; i++) {
      await page.click(CANVAS_SELECTORS.addDocButton)
      await page.click(CANVAS_SELECTORS.canvasSvg, { 
        position: { 
          x: 100 + (i % 5) * 100, 
          y: 100 + Math.floor(i / 5) * 100 
        } 
      })
    }
    
    await expect(page.locator(CANVAS_SELECTORS.canvasNode)).toHaveCount(nodeCount)
    
    // Create multiple edges quickly
    const startTime = Date.now()
    
    for (let i = 0; i < 5; i++) {
      const sourceNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(i)
      const targetNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(i + 1)
      
      await sourceNode.hover()
      const sourceAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="right"]').nth(i)
      
      await targetNode.hover()
      const targetAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="left"]').nth(i + 1)
      
      // Quick edge creation
      await sourceAnchor.dragTo(targetAnchor)
    }
    
    const creationTime = Date.now() - startTime
    
    // Should create edges efficiently
    expect(creationTime).toBeLessThan(5000) // 5 seconds max
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(5)
    
    // Canvas should remain responsive
    await page.click(CANVAS_SELECTORS.resetViewButton)
    await expect(page.locator(CANVAS_SELECTORS.canvasSvg)).toHaveAttribute('viewBox', '0 0 1200 800')
  })

  test('should handle edge intersection scenarios', async ({ page }) => {
    // Create nodes in a cross pattern
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { position: { x: 200, y: 300 } }) // Left
    
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { position: { x: 400, y: 300 } }) // Right
    
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { position: { x: 300, y: 200 } }) // Top
    
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { position: { x: 300, y: 400 } }) // Bottom
    
    // Create horizontal edge (left to right)
    await createEdgeBetweenSpecificNodes(page, 0, 1)
    
    // Create vertical edge (top to bottom) - should intersect
    await createEdgeBetweenSpecificNodes(page, 2, 3)
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(2)
    
    // Should handle intersection rendering properly
    const edges = page.locator(EDGE_SELECTORS.canvasEdge)
    await expect(edges.first()).toBeVisible()
    await expect(edges.last()).toBeVisible()
  })

  // Helper functions
  async function createTwoNodes(page: Page) {
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { position: { x: 200, y: 200 } })
    
    await page.click(CANVAS_SELECTORS.addAgentButton)
    await page.click(CANVAS_SELECTORS.canvasSvg, { position: { x: 400, y: 200 } })
    
    await expect(page.locator(CANVAS_SELECTORS.canvasNode)).toHaveCount(2)
  }

  async function createEdgeBetweenNodes(page: Page) {
    const sourceNode = page.locator(CANVAS_SELECTORS.documentNode).first()
    await sourceNode.hover()
    
    const sourceAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="right"]').first()
    const targetAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="left"]').last()
    
    await sourceAnchor.dragTo(targetAnchor)
    
    await expect(page.locator(EDGE_SELECTORS.canvasEdge)).toHaveCount(1)
  }

  async function createEdgeBetweenSpecificNodes(page: Page, sourceIndex: number, targetIndex: number) {
    const sourceNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(sourceIndex)
    const targetNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(targetIndex)
    
    await sourceNode.hover()
    const sourceAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="right"]').nth(sourceIndex)
    
    await targetNode.hover()
    const targetAnchor = page.locator(EDGE_SELECTORS.nodeAnchor + '[data-position="left"]').nth(targetIndex)
    
    await sourceAnchor.dragTo(targetAnchor)
  }
})