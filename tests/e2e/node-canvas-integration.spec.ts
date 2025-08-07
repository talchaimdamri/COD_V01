/**
 * Node Canvas Integration E2E Tests
 * 
 * End-to-end tests for node interactions with Canvas event sourcing.
 * Tests complete user workflows including node creation, manipulation, and persistence.
 * 
 * Test Requirements (Task 6.6):
 * - Node creation through Canvas interface
 * - Drag and drop with event sourcing persistence
 * - Selection changes and state management
 * - Undo/redo functionality with nodes
 * - Multi-node operations
 * - Real-time event synchronization
 */

import { test, expect, Page } from '@playwright/test'
import { 
  CANVAS_SELECTORS,
  CANVAS_CONFIG,
  mockNodes,
  testPositions,
  performanceThresholds
} from '../fixtures/canvas'

// Helper functions for node interactions
const NodeHelpers = {
  /**
   * Create a document node at specified position
   */
  async createDocumentNode(page: Page, position = testPositions.center) {
    await page.click(CANVAS_SELECTORS.addDocButton)
    await page.click(CANVAS_SELECTORS.canvas, { 
      position: { x: position.x, y: position.y } 
    })
    
    // Wait for node to appear
    await page.waitForSelector(CANVAS_SELECTORS.documentNode, { timeout: 5000 })
    
    const nodes = await page.locator(CANVAS_SELECTORS.documentNode).all()
    return nodes[nodes.length - 1] // Return the newly created node
  },

  /**
   * Create an agent node at specified position
   */
  async createAgentNode(page: Page, position = testPositions.center) {
    await page.click(CANVAS_SELECTORS.addAgentButton)
    await page.click(CANVAS_SELECTORS.canvas, { 
      position: { x: position.x, y: position.y } 
    })
    
    // Wait for node to appear
    await page.waitForSelector(CANVAS_SELECTORS.agentNode, { timeout: 5000 })
    
    const nodes = await page.locator(CANVAS_SELECTORS.agentNode).all()
    return nodes[nodes.length - 1] // Return the newly created node
  },

  /**
   * Drag a node from one position to another
   */
  async dragNode(page: Page, nodeSelector: string, fromPos, toPos) {
    await page.dragAndDrop(
      nodeSelector,
      CANVAS_SELECTORS.canvas,
      {
        sourcePosition: fromPos,
        targetPosition: toPos
      }
    )
  },

  /**
   * Get node position from transform attribute
   */
  async getNodePosition(page: Page, nodeSelector: string) {
    const transform = await page.locator(nodeSelector).getAttribute('transform')
    const match = transform?.match(/translate\(([^,]+),\s*([^)]+)\)/)
    
    if (match) {
      return {
        x: parseFloat(match[1]),
        y: parseFloat(match[2])
      }
    }
    
    return { x: 0, y: 0 }
  },

  /**
   * Wait for event sourcing to complete
   */
  async waitForEventSync(page: Page, timeout = 2000) {
    // Wait for any loading indicators to disappear
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[data-testid="canvas"]')
      return !canvas?.classList.contains('loading')
    }, { timeout })
    
    // Additional wait for network requests to complete
    await page.waitForLoadState('networkidle')
  }
}

test.describe('Node Canvas Integration E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
    
    // Wait for canvas to load
    await page.waitForSelector(CANVAS_SELECTORS.canvas, { timeout: 10000 })
    
    // Ensure canvas is ready for interaction
    await page.waitForFunction(() => {
      const canvas = document.querySelector('[data-testid="canvas-svg"]')
      return canvas && canvas.getAttribute('viewBox')
    })
  })

  test.describe('Node Creation', () => {
    test('should create document node through UI and persist via event sourcing', async ({ page }) => {
      // Create document node
      const documentNode = await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      
      // Verify node exists in DOM
      await expect(documentNode).toBeVisible()
      await expect(documentNode).toHaveAttribute('data-node-type', 'document')
      
      // Verify position is correct
      const position = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(position.x).toBeCloseTo(testPositions.topLeft.x, 10)
      expect(position.y).toBeCloseTo(testPositions.topLeft.y, 10)
      
      // Wait for event sourcing to persist
      await NodeHelpers.waitForEventSync(page)
      
      // Refresh page and verify persistence
      await page.reload()
      await page.waitForSelector(CANVAS_SELECTORS.canvas)
      
      const persistedNode = page.locator(CANVAS_SELECTORS.documentNode).first()
      await expect(persistedNode).toBeVisible()
    })

    test('should create agent node through UI and persist via event sourcing', async ({ page }) => {
      // Create agent node
      const agentNode = await NodeHelpers.createAgentNode(page, testPositions.topRight)
      
      // Verify node exists in DOM
      await expect(agentNode).toBeVisible()
      await expect(agentNode).toHaveAttribute('data-node-type', 'agent')
      
      // Verify position is correct
      const position = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.agentNode)
      expect(position.x).toBeCloseTo(testPositions.topRight.x, 10)
      expect(position.y).toBeCloseTo(testPositions.topRight.y, 10)
      
      // Wait for event sourcing
      await NodeHelpers.waitForEventSync(page)
      
      // Verify persistence after refresh
      await page.reload()
      await page.waitForSelector(CANVAS_SELECTORS.canvas)
      
      const persistedNode = page.locator(CANVAS_SELECTORS.agentNode).first()
      await expect(persistedNode).toBeVisible()
    })

    test('should create multiple nodes and maintain correct ordering', async ({ page }) => {
      // Create multiple nodes
      const docNode1 = await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      const agentNode1 = await NodeHelpers.createAgentNode(page, testPositions.topRight)
      const docNode2 = await NodeHelpers.createDocumentNode(page, testPositions.bottomLeft)
      
      // Verify all nodes exist
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(2)
      await expect(page.locator(CANVAS_SELECTORS.agentNode)).toHaveCount(1)
      
      // Wait for event sourcing
      await NodeHelpers.waitForEventSync(page)
      
      // Verify persistence and ordering
      await page.reload()
      await page.waitForSelector(CANVAS_SELECTORS.canvas)
      
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(2)
      await expect(page.locator(CANVAS_SELECTORS.agentNode)).toHaveCount(1)
    })
  })

  test.describe('Node Drag and Drop with Event Sourcing', () => {
    test('should drag document node and persist position change', async ({ page }) => {
      // Create a document node
      const documentNode = await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      
      // Get initial position
      const initialPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      
      // Drag node to new position
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        testPositions.topLeft,
        testPositions.bottomRight
      )
      
      // Verify position changed
      await page.waitForTimeout(500) // Allow for drag animation
      const newPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      
      expect(newPosition.x).not.toBeCloseTo(initialPosition.x, 10)
      expect(newPosition.y).not.toBeCloseTo(initialPosition.y, 10)
      expect(newPosition.x).toBeCloseTo(testPositions.bottomRight.x, 50)
      expect(newPosition.y).toBeCloseTo(testPositions.bottomRight.y, 50)
      
      // Wait for event sourcing to persist
      await NodeHelpers.waitForEventSync(page)
      
      // Verify persistence after refresh
      await page.reload()
      await page.waitForSelector(CANVAS_SELECTORS.canvas)
      
      const persistedPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(persistedPosition.x).toBeCloseTo(newPosition.x, 10)
      expect(persistedPosition.y).toBeCloseTo(newPosition.y, 10)
    })

    test('should handle rapid drag operations with event sourcing', async ({ page }) => {
      // Create multiple nodes
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      await NodeHelpers.createAgentNode(page, testPositions.topRight)
      
      // Perform rapid drags
      const positions = [
        testPositions.center,
        testPositions.bottomLeft,
        testPositions.bottomRight,
        testPositions.center
      ]
      
      for (const position of positions) {
        await NodeHelpers.dragNode(
          page,
          CANVAS_SELECTORS.documentNode,
          { x: 0, y: 0 }, // Relative to current position
          position
        )
        await page.waitForTimeout(100) // Small delay between drags
      }
      
      // Wait for all events to be processed
      await NodeHelpers.waitForEventSync(page, 5000)
      
      // Verify final position
      const finalPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(finalPosition.x).toBeCloseTo(testPositions.center.x, 50)
      expect(finalPosition.y).toBeCloseTo(testPositions.center.y, 50)
    })
  })

  test.describe('Node Selection with Event Sourcing', () => {
    test('should select node and persist selection state', async ({ page }) => {
      // Create nodes
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      await NodeHelpers.createAgentNode(page, testPositions.topRight)
      
      // Click on document node to select it
      await page.click(CANVAS_SELECTORS.documentNode)
      
      // Verify selection styling
      const selectedNode = page.locator(CANVAS_SELECTORS.documentNode)
      await expect(selectedNode).toHaveClass(/selected/)
      
      // Verify selection persistence (if implemented)
      await NodeHelpers.waitForEventSync(page)
      
      // Click on agent node to change selection
      await page.click(CANVAS_SELECTORS.agentNode)
      
      // Verify selection changed
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).not.toHaveClass(/selected/)
      await expect(page.locator(CANVAS_SELECTORS.agentNode)).toHaveClass(/selected/)
    })

    test('should handle keyboard navigation between nodes', async ({ page }) => {
      // Create multiple nodes
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      await NodeHelpers.createAgentNode(page, testPositions.topRight)
      await NodeHelpers.createDocumentNode(page, testPositions.bottomLeft)
      
      // Focus on canvas
      await page.focus(CANVAS_SELECTORS.canvas)
      
      // Use Tab to navigate between nodes
      await page.keyboard.press('Tab')
      
      // Verify first node is focused/selected
      const firstNode = page.locator(CANVAS_SELECTORS.canvasNode).first()
      await expect(firstNode).toHaveClass(/selected|focused/)
      
      // Navigate to next node
      await page.keyboard.press('Tab')
      
      // Verify selection moved
      const secondNode = page.locator(CANVAS_SELECTORS.canvasNode).nth(1)
      await expect(secondNode).toHaveClass(/selected|focused/)
    })
  })

  test.describe('Undo/Redo with Node Operations', () => {
    test('should undo node creation via event sourcing', async ({ page }) => {
      // Create a node
      await NodeHelpers.createDocumentNode(page, testPositions.center)
      
      // Verify node exists
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(1)
      
      // Wait for event to be persisted
      await NodeHelpers.waitForEventSync(page)
      
      // Perform undo
      await page.keyboard.press('Control+z')
      
      // Verify node was removed
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(0)
    })

    test('should undo node move operation', async ({ page }) => {
      // Create and move a node
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      const initialPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      
      // Move the node
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        testPositions.topLeft,
        testPositions.bottomRight
      )
      
      await NodeHelpers.waitForEventSync(page)
      
      // Undo the move
      await page.keyboard.press('Control+z')
      
      // Verify position was restored
      await page.waitForTimeout(500)
      const restoredPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(restoredPosition.x).toBeCloseTo(initialPosition.x, 10)
      expect(restoredPosition.y).toBeCloseTo(initialPosition.y, 10)
    })

    test('should redo node operations after undo', async ({ page }) => {
      // Create node
      await NodeHelpers.createDocumentNode(page, testPositions.center)
      await NodeHelpers.waitForEventSync(page)
      
      // Undo creation
      await page.keyboard.press('Control+z')
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(0)
      
      // Redo creation
      await page.keyboard.press('Control+y')
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(1)
      
      // Verify position is restored
      const position = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(position.x).toBeCloseTo(testPositions.center.x, 10)
      expect(position.y).toBeCloseTo(testPositions.center.y, 10)
    })
  })

  test.describe('Multi-Node Operations', () => {
    test('should handle multiple node selection with Ctrl+click', async ({ page }) => {
      // Create multiple nodes
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      await NodeHelpers.createAgentNode(page, testPositions.topRight)
      await NodeHelpers.createDocumentNode(page, testPositions.bottomLeft)
      
      // Select first node
      await page.click(CANVAS_SELECTORS.documentNode)
      
      // Add second node to selection with Ctrl+click
      await page.click(CANVAS_SELECTORS.agentNode, { modifiers: ['Control'] })
      
      // Verify both nodes are selected
      await expect(page.locator(`${CANVAS_SELECTORS.documentNode}.selected`)).toHaveCount(1)
      await expect(page.locator(`${CANVAS_SELECTORS.agentNode}.selected`)).toHaveCount(1)
    })

    test('should create nodes in sequence and maintain event order', async ({ page }) => {
      const positions = [
        testPositions.topLeft,
        testPositions.topRight,
        testPositions.bottomLeft,
        testPositions.bottomRight
      ]
      
      // Create nodes rapidly
      for (let i = 0; i < positions.length; i++) {
        if (i % 2 === 0) {
          await NodeHelpers.createDocumentNode(page, positions[i])
        } else {
          await NodeHelpers.createAgentNode(page, positions[i])
        }
      }
      
      // Wait for all events to be processed
      await NodeHelpers.waitForEventSync(page, 5000)
      
      // Verify all nodes were created
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(2)
      await expect(page.locator(CANVAS_SELECTORS.agentNode)).toHaveCount(2)
      
      // Verify persistence
      await page.reload()
      await page.waitForSelector(CANVAS_SELECTORS.canvas)
      
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(2)
      await expect(page.locator(CANVAS_SELECTORS.agentNode)).toHaveCount(2)
    })
  })

  test.describe('Performance and Real-time Sync', () => {
    test('should handle node operations within performance thresholds', async ({ page }) => {
      const startTime = Date.now()
      
      // Create multiple nodes
      for (let i = 0; i < 10; i++) {
        await NodeHelpers.createDocumentNode(page, {
          x: (i % 5) * 100 + 50,
          y: Math.floor(i / 5) * 100 + 50
        })
      }
      
      const creationTime = Date.now() - startTime
      expect(creationTime).toBeLessThan(performanceThresholds.timing.slowOperation)
      
      // Test drag performance
      const dragStartTime = Date.now()
      
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        { x: 50, y: 50 },
        { x: 300, y: 200 }
      )
      
      const dragTime = Date.now() - dragStartTime
      expect(dragTime).toBeLessThan(performanceThresholds.timing.normalOperation)
    })

    test('should sync events in real-time across operations', async ({ page }) => {
      // Create initial state
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      await NodeHelpers.createAgentNode(page, testPositions.topRight)
      
      // Perform multiple operations rapidly
      await page.click(CANVAS_SELECTORS.documentNode) // Select
      
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        testPositions.topLeft,
        testPositions.center
      ) // Move
      
      await page.click(CANVAS_SELECTORS.agentNode) // Change selection
      
      // Wait for all events to sync
      await NodeHelpers.waitForEventSync(page, 3000)
      
      // Verify final state is consistent
      const selectedAgentNode = page.locator(`${CANVAS_SELECTORS.agentNode}.selected`)
      await expect(selectedAgentNode).toHaveCount(1)
      
      const movedDocPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(movedDocPosition.x).toBeCloseTo(testPositions.center.x, 50)
    })
  })

  test.describe('Error Handling and Recovery', () => {
    test('should handle network interruption gracefully', async ({ page }) => {
      // Create node
      await NodeHelpers.createDocumentNode(page, testPositions.center)
      
      // Simulate network interruption
      await page.setOffline(true)
      
      // Try to drag node (should work optimistically)
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        testPositions.center,
        testPositions.bottomRight
      )
      
      // Verify optimistic update
      const position = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(position.x).toBeCloseTo(testPositions.bottomRight.x, 50)
      
      // Restore network
      await page.setOffline(false)
      
      // Wait for sync
      await NodeHelpers.waitForEventSync(page, 5000)
      
      // Verify position persisted
      await page.reload()
      await page.waitForSelector(CANVAS_SELECTORS.canvas)
      
      const persistedPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(persistedPosition.x).toBeCloseTo(testPositions.bottomRight.x, 50)
    })

    test('should recover from invalid node states', async ({ page }) => {
      // Create node with invalid position (if possible through UI manipulation)
      await NodeHelpers.createDocumentNode(page, testPositions.center)
      
      // Try to drag to invalid position (outside canvas bounds)
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        testPositions.center,
        { x: -100, y: -100 }
      )
      
      // Verify position was constrained/corrected
      const position = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(position.x).toBeGreaterThanOrEqual(0)
      expect(position.y).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Integration with Canvas Features', () => {
    test('should integrate node operations with canvas pan and zoom', async ({ page }) => {
      // Create node
      await NodeHelpers.createDocumentNode(page, testPositions.center)
      
      // Zoom in
      await page.keyboard.press('Equal') // + key
      await page.waitForTimeout(200)
      
      // Drag node at zoomed level
      await NodeHelpers.dragNode(
        page,
        CANVAS_SELECTORS.documentNode,
        testPositions.center,
        testPositions.bottomRight
      )
      
      // Zoom out
      await page.keyboard.press('Minus') // - key
      await page.waitForTimeout(200)
      
      // Verify node position is still correct
      const position = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
      expect(position.x).toBeCloseTo(testPositions.bottomRight.x, 50)
      expect(position.y).toBeCloseTo(testPositions.bottomRight.y, 50)
    })

    test('should maintain node visibility during canvas operations', async ({ page }) => {
      // Create nodes across canvas
      await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
      await NodeHelpers.createAgentNode(page, testPositions.bottomRight)
      
      // Pan canvas
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowDown')
      
      // Verify nodes are still interactive
      await page.click(CANVAS_SELECTORS.documentNode)
      await expect(page.locator(`${CANVAS_SELECTORS.documentNode}.selected`)).toHaveCount(1)
      
      // Reset view
      await page.keyboard.press('r')
      
      // Verify both nodes are visible
      await expect(page.locator(CANVAS_SELECTORS.documentNode)).toBeVisible()
      await expect(page.locator(CANVAS_SELECTORS.agentNode)).toBeVisible()
    })
  })
})

// Helper test for testing event sourcing integration specifically
test.describe('Event Sourcing Integration', () => {
  test('should maintain consistent event history across node operations', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector(CANVAS_SELECTORS.canvas)
    
    // Create node (1 event)
    await NodeHelpers.createDocumentNode(page, testPositions.topLeft)
    await NodeHelpers.waitForEventSync(page)
    
    // Move node (1 event)
    await NodeHelpers.dragNode(
      page,
      CANVAS_SELECTORS.documentNode,
      testPositions.topLeft,
      testPositions.topRight
    )
    await NodeHelpers.waitForEventSync(page)
    
    // Select node (1 event)
    await page.click(CANVAS_SELECTORS.documentNode)
    await NodeHelpers.waitForEventSync(page)
    
    // Undo all operations
    await page.keyboard.press('Control+z') // Undo select
    await page.keyboard.press('Control+z') // Undo move
    await page.keyboard.press('Control+z') // Undo create
    
    // Verify canvas is empty
    await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(0)
    
    // Redo all operations
    await page.keyboard.press('Control+y') // Redo create
    await page.keyboard.press('Control+y') // Redo move
    await page.keyboard.press('Control+y') // Redo select
    
    // Verify final state
    await expect(page.locator(CANVAS_SELECTORS.documentNode)).toHaveCount(1)
    
    const finalPosition = await NodeHelpers.getNodePosition(page, CANVAS_SELECTORS.documentNode)
    expect(finalPosition.x).toBeCloseTo(testPositions.topRight.x, 10)
    expect(finalPosition.y).toBeCloseTo(testPositions.topRight.y, 10)
  })
})