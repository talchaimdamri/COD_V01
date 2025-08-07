/**
 * Document Version History and Undo/Redo E2E Tests
 * Test ID: E2E-VERSION-HISTORY
 * PRD Reference: Task 11.1 - Document Version History and Undo/Redo
 * 
 * This test suite covers the comprehensive functionality of the document version history system,
 * including version history panel UI, version comparison/diff viewer, version restoration,
 * and real-time undo/redo operations integrated with the TipTap Document Editor Modal.
 * 
 * These tests will FAIL initially until the Version History system is implemented (TDD).
 */

import { test, expect } from '@playwright/test'
import { 
  DOCUMENT_EDITOR_SELECTORS,
  mockVersionHistory,
  mockLargeVersionHistory,
  mockVersionDiffs,
  editorPerformanceThresholds,
  editorTestUtils,
} from '../fixtures/document-editor'

test.describe('Document Version History - Panel UI', () => {
  test('should display version history panel with timeline [E2E-VS-01]', async ({ page }) => {
    // Test ID: E2E-VS-01
    // PRD Reference: Version history panel showing versions with timestamps and descriptions
    
    // Mock API response with version history
    await page.route('/api/documents/doc-complex/versions', async route => {
      await route.fulfill({
        json: { versions: mockVersionHistory.versions },
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-complex', async route => {
      await route.fulfill({
        json: {
          id: 'doc-complex',
          title: 'Complex Document',
          content: mockVersionHistory.versions[mockVersionHistory.versions.length - 1].content,
          version: mockVersionHistory.versions.length,
        },
        status: 200,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-complex"]')
    
    // Open version history panel
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionToggle)
    
    // Verify version history panel is visible
    const versionPanel = page.locator(DOCUMENT_EDITOR_SELECTORS.versionHistoryPanel)
    await expect(versionPanel).toBeVisible()
    
    // Verify all versions are displayed in chronological order (newest first)
    const versionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    await expect(versionItems).toHaveCount(mockVersionHistory.versions.length)
    
    // Verify first version (newest) details
    const firstVersion = versionItems.first()
    await expect(firstVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionDescription))
      .toContainText('Added conclusion paragraph')
    await expect(firstVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionAuthor))
      .toContainText('test-user')
    await expect(firstVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionWordCount))
      .toContainText('30 words')
    await expect(firstVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionCharCount))
      .toContainText('510 chars')
    
    // Verify timestamp formatting
    const timestamp = firstVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionTimestamp)
    await expect(timestamp).toContainText('Jan 1, 2024')
    await expect(timestamp).toContainText('04:15 PM')
    
    // Verify version progression (word/character counts increase)
    const secondVersion = versionItems.nth(1)
    await expect(secondVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionWordCount))
      .toContainText('25 words')
    
    const thirdVersion = versionItems.nth(2) 
    await expect(thirdVersion.locator(DOCUMENT_EDITOR_SELECTORS.versionWordCount))
      .toContainText('4 words')
  })

  test('should display version diff viewer for comparisons [E2E-VS-02]', async ({ page }) => {
    // Test ID: E2E-VS-02
    // PRD Reference: Side-by-side diff viewer component showing content changes
    
    // Mock API responses
    await page.route('/api/documents/doc-complex/versions', async route => {
      await route.fulfill({
        json: { versions: mockVersionHistory.versions },
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-complex/versions/*/diff', async route => {
      const url = route.request().url()
      const versionMatch = url.match(/versions\/(\d+)\/diff/)
      if (versionMatch) {
        await route.fulfill({
          json: {
            from: mockVersionHistory.versions[0].content,
            to: mockVersionHistory.versions[1].content,
            diff: mockVersionDiffs.structuralChange.expectedDiff,
          },
          status: 200,
        })
      }
    })
    
    await page.route('/api/documents/doc-complex', async route => {
      await route.fulfill({
        json: {
          id: 'doc-complex',
          title: 'Complex Document',
          content: mockVersionHistory.versions[mockVersionHistory.versions.length - 1].content,
        },
        status: 200,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-complex"]')
    
    // Open version history panel
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionToggle)
    
    const versionPanel = page.locator(DOCUMENT_EDITOR_SELECTORS.versionHistoryPanel)
    await expect(versionPanel).toBeVisible()
    
    // Select two versions to compare
    const versionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    
    // Select first version (ctrl+click for multi-select)
    await versionItems.first().click({ modifiers: ['ControlOrMeta'] })
    await expect(versionItems.first()).toHaveClass(/selected/)
    
    // Select second version
    await versionItems.nth(1).click({ modifiers: ['ControlOrMeta'] })
    await expect(versionItems.nth(1)).toHaveClass(/selected/)
    
    // Click compare button
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionCompare)
    
    // Verify diff viewer opens
    const diffViewer = page.locator(DOCUMENT_EDITOR_SELECTORS.diffViewer)
    await expect(diffViewer).toBeVisible()
    
    // Verify side-by-side diff display
    const sideBySideDiff = page.locator(DOCUMENT_EDITOR_SELECTORS.diffSideBySide)
    await expect(sideBySideDiff).toBeVisible()
    
    // Verify diff shows both versions
    await expect(diffViewer).toContainText('Version 1')
    await expect(diffViewer).toContainText('Version 2')
    
    // Verify additions and deletions are highlighted
    const additions = diffViewer.locator('[data-diff="addition"]')
    const deletions = diffViewer.locator('[data-diff="deletion"]')
    
    await expect(additions).toHaveCount(1) // At least one addition
    await expect(deletions).toHaveCount(1) // At least one deletion
    
    // Test unified diff view toggle
    await page.click('[data-testid="diff-view-unified"]')
    const unifiedDiff = page.locator(DOCUMENT_EDITOR_SELECTORS.diffUnified)
    await expect(unifiedDiff).toBeVisible()
    await expect(sideBySideDiff).toBeHidden()
    
    // Switch back to side-by-side
    await page.click('[data-testid="diff-view-side-by-side"]')
    await expect(sideBySideDiff).toBeVisible()
    await expect(unifiedDiff).toBeHidden()
  })

  test('should restore previous version correctly [E2E-VS-03]', async ({ page }) => {
    // Test ID: E2E-VS-03
    // PRD Reference: Version restoration functionality
    
    let restoredVersion = null
    
    // Mock API responses
    await page.route('/api/documents/doc-complex/versions', async route => {
      await route.fulfill({
        json: { versions: mockVersionHistory.versions },
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-complex/versions/*/restore', async route => {
      const url = route.request().url()
      const versionMatch = url.match(/versions\/(\d+)\/restore/)
      if (versionMatch) {
        const versionNumber = parseInt(versionMatch[1])
        restoredVersion = mockVersionHistory.versions.find(v => v.version === versionNumber)
        
        await route.fulfill({
          json: {
            success: true,
            newVersion: {
              id: 'version-5',
              version: 5,
              content: restoredVersion.content,
              description: `Restored to version ${versionNumber}`,
            },
          },
          status: 200,
        })
      }
    })
    
    await page.route('/api/documents/doc-complex', async route => {
      if (restoredVersion) {
        await route.fulfill({
          json: {
            id: 'doc-complex',
            title: 'Complex Document',
            content: restoredVersion.content,
            version: 5,
          },
          status: 200,
        })
      } else {
        await route.fulfill({
          json: {
            id: 'doc-complex',
            title: 'Complex Document',
            content: mockVersionHistory.versions[3].content, // Latest version
            version: 4,
          },
          status: 200,
        })
      }
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-complex"]')
    
    // Verify current content
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    const initialContent = await proseMirror.textContent()
    
    // Open version history panel
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionToggle)
    
    // Select an earlier version (version 2)
    const versionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    const version2Item = versionItems.nth(2) // Third item (version 2)
    
    await version2Item.click()
    await expect(version2Item).toHaveClass(/selected/)
    
    // Click restore button
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionRestore)
    
    // Verify restoration confirmation dialog
    const confirmDialog = page.locator('[data-testid="restore-confirmation"]')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText('Restore version 2')
    
    // Confirm restoration
    await page.click('[data-testid="confirm-restore"]')
    
    // Verify restoration success message
    const successMessage = page.locator('[data-testid="restore-success"]')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText('Version restored successfully')
    
    // Wait for content to reload
    await page.waitForTimeout(500)
    
    // Verify content has changed to the restored version
    const restoredContent = await proseMirror.textContent()
    expect(restoredContent).not.toBe(initialContent)
    expect(restoredContent).toContain('Main Heading')
    expect(restoredContent).toContain('Added heading')
    
    // Verify new version was created
    const updatedVersionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    await expect(updatedVersionItems).toHaveCount(mockVersionHistory.versions.length + 1)
    
    // Verify newest version shows restoration description
    await expect(updatedVersionItems.first().locator(DOCUMENT_EDITOR_SELECTORS.versionDescription))
      .toContainText('Restored to version 2')
  })

  test('should handle version history performance with large datasets [E2E-VS-04]', async ({ page }) => {
    // Test ID: E2E-VS-04  
    // PRD Reference: Performance tests for large version histories
    
    // Mock API with large version history
    await page.route('/api/documents/doc-performance-test/versions', async route => {
      // Simulate slower response for large dataset
      await new Promise(resolve => setTimeout(resolve, 200))
      
      await route.fulfill({
        json: { versions: mockLargeVersionHistory.versions },
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-performance-test', async route => {
      await route.fulfill({
        json: {
          id: 'doc-performance-test',
          title: 'Performance Test Document',
          content: mockLargeVersionHistory.versions[0].content,
          version: mockLargeVersionHistory.versions.length,
        },
        status: 200,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-performance-test"]')
    
    // Measure version history loading time
    const startTime = performance.now()
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionToggle)
    
    const versionPanel = page.locator(DOCUMENT_EDITOR_SELECTORS.versionHistoryPanel)
    await expect(versionPanel).toBeVisible()
    
    // Wait for all version items to load
    const versionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    await expect(versionItems.first()).toBeVisible()
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Should meet performance threshold for large history
    expect(loadTime).toBeLessThan(editorPerformanceThresholds.largeHistoryRender)
    
    // Verify pagination or virtualization for large datasets
    // (Initially only show first 20-50 items)
    const visibleItems = await versionItems.count()
    expect(visibleItems).toBeLessThanOrEqual(50)
    expect(visibleItems).toBeGreaterThan(0)
    
    // Test scroll loading more items
    const loadMoreButton = page.locator('[data-testid="load-more-versions"]')
    if (await loadMoreButton.isVisible()) {
      const initialCount = await versionItems.count()
      await loadMoreButton.click()
      
      // Wait for more items to load
      await page.waitForTimeout(200)
      const newCount = await versionItems.count()
      expect(newCount).toBeGreaterThan(initialCount)
    }
    
    // Test search/filter functionality for large history
    const searchInput = page.locator('[data-testid="version-search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('Major update')
      await page.keyboard.press('Enter')
      
      // Should filter to only major updates
      const filteredItems = page.locator(`${DOCUMENT_EDITOR_SELECTORS.versionItem}:visible`)
      const filteredCount = await filteredItems.count()
      expect(filteredCount).toBeLessThan(mockLargeVersionHistory.versions.length / 2)
      
      // Verify filtered items contain search term
      const firstFiltered = filteredItems.first()
      await expect(firstFiltered.locator(DOCUMENT_EDITOR_SELECTORS.versionDescription))
        .toContainText('Major update')
    }
  })
})

test.describe('Document Version History - Undo/Redo Operations', () => {
  test('should perform undo operations correctly [E2E-VS-05]', async ({ page }) => {
    // Test ID: E2E-VS-05
    // PRD Reference: Undo/redo command patterns with event replay
    
    await page.route('/api/documents/doc-undo-test', async route => {
      await route.fulfill({
        json: {
          id: 'doc-undo-test',
          title: 'Undo Test Document',
          content: '<p>Initial content</p>',
          version: 1,
        },
        status: 200,
      })
    })
    
    // Mock event sourcing API
    await page.route('/api/events/document', async route => {
      await route.fulfill({
        json: { success: true, eventId: 'event-' + Date.now() },
        status: 201,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-undo-test"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Record initial state
    const initialContent = await proseMirror.textContent()
    expect(initialContent).toContain('Initial content')
    
    // Make first change
    await page.keyboard.selectAll()
    await page.keyboard.type('First change content')
    
    const firstChangeContent = await proseMirror.textContent()
    expect(firstChangeContent).toBe('First change content')
    
    // Make second change
    await page.keyboard.selectAll()
    await page.keyboard.type('Second change content')
    
    const secondChangeContent = await proseMirror.textContent()
    expect(secondChangeContent).toBe('Second change content')
    
    // Test undo button
    const startTime = performance.now()
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    
    // Should revert to first change
    const afterUndoContent = await proseMirror.textContent()
    expect(afterUndoContent).toBe('First change content')
    
    const endTime = performance.now()
    const undoTime = endTime - startTime
    expect(undoTime).toBeLessThan(editorPerformanceThresholds.undoRedo)
    
    // Test second undo
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    const afterSecondUndoContent = await proseMirror.textContent()
    expect(afterSecondUndoContent).toBe('Initial content')
    
    // Test undo button disabled state
    const undoButton = page.locator(DOCUMENT_EDITOR_SELECTORS.undoButton)
    await expect(undoButton).toBeDisabled()
    
    // Test keyboard shortcut undo
    await page.keyboard.type('Keyboard shortcut change')
    await page.keyboard.press('Control+z')
    
    const afterKeyboardUndoContent = await proseMirror.textContent()
    expect(afterKeyboardUndoContent).toBe('Initial content')
  })

  test('should perform redo operations correctly [E2E-VS-06]', async ({ page }) => {
    // Test ID: E2E-VS-06
    // PRD Reference: Redo operations with event replay integrity
    
    await page.route('/api/documents/doc-redo-test', async route => {
      await route.fulfill({
        json: {
          id: 'doc-redo-test', 
          title: 'Redo Test Document',
          content: '<p>Initial content</p>',
          version: 1,
        },
        status: 200,
      })
    })
    
    await page.route('/api/events/document', async route => {
      await route.fulfill({
        json: { success: true, eventId: 'event-' + Date.now() },
        status: 201,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-redo-test"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Make changes
    await page.keyboard.selectAll()
    await page.keyboard.type('Change to redo')
    
    const changedContent = await proseMirror.textContent()
    expect(changedContent).toBe('Change to redo')
    
    // Undo the change
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    const undoneContent = await proseMirror.textContent()
    expect(undoneContent).toBe('Initial content')
    
    // Test redo button is now enabled
    const redoButton = page.locator(DOCUMENT_EDITOR_SELECTORS.redoButton)
    await expect(redoButton).toBeEnabled()
    
    // Test redo operation
    const startTime = performance.now()
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton)
    
    const redoneContent = await proseMirror.textContent()
    expect(redoneContent).toBe('Change to redo')
    
    const endTime = performance.now()
    const redoTime = endTime - startTime
    expect(redoTime).toBeLessThan(editorPerformanceThresholds.undoRedo)
    
    // Test redo button disabled state after redo
    await expect(redoButton).toBeDisabled()
    
    // Test keyboard shortcut redo
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton) // Undo first
    await page.keyboard.press('Control+y') // Redo with keyboard
    
    const keyboardRedoneContent = await proseMirror.textContent()
    expect(keyboardRedoneContent).toBe('Change to redo')
    
    // Test redo after new changes (should clear redo stack)
    await page.keyboard.selectAll()
    await page.keyboard.type('New change after redo')
    
    // Undo the new change
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    
    // Redo button should still work for the new change
    await expect(redoButton).toBeEnabled()
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton)
    
    const finalContent = await proseMirror.textContent()
    expect(finalContent).toBe('New change after redo')
  })

  test('should maintain undo/redo state across editor operations [E2E-VS-07]', async ({ page }) => {
    // Test ID: E2E-VS-07
    // PRD Reference: Event sourcing integrity with complex operations
    
    await page.route('/api/documents/doc-state-test', async route => {
      await route.fulfill({
        json: {
          id: 'doc-state-test',
          title: 'State Test Document', 
          content: '<p>Test content</p>',
          version: 1,
        },
        status: 200,
      })
    })
    
    await page.route('/api/events/document', async route => {
      await route.fulfill({
        json: { success: true, eventId: 'event-' + Date.now() },
        status: 201,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-state-test"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Perform a sequence of different operations
    await page.keyboard.selectAll()
    await page.keyboard.type('Step 1: Basic text')
    
    // Add formatting
    await page.keyboard.selectAll()
    await page.click(DOCUMENT_EDITOR_SELECTORS.boldButton)
    
    // Add more content
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Step 2: New line')
    
    // Create a list
    await page.keyboard.selectAll()
    await page.click(DOCUMENT_EDITOR_SELECTORS.bulletListButton)
    
    // Verify current state
    const listItems = proseMirror.locator('li')
    await expect(listItems).toHaveCount(2)
    
    // Undo list creation
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    await expect(listItems).toHaveCount(0)
    
    // Undo new line addition
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    const afterSecondUndo = await proseMirror.textContent()
    expect(afterSecondUndo).toBe('Step 1: Basic text')
    
    // Verify formatting is preserved
    const boldElement = proseMirror.locator('strong')
    await expect(boldElement).toBeVisible()
    
    // Undo formatting
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    await expect(boldElement).toHaveCount(0)
    
    // Undo to initial text change
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    const initialContent = await proseMirror.textContent()
    expect(initialContent).toBe('Test content')
    
    // Test redo sequence
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton) // Text change
    await expect(proseMirror).toContainText('Step 1: Basic text')
    
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton) // Formatting
    await expect(proseMirror.locator('strong')).toBeVisible()
    
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton) // New line
    const multiLineContent = await proseMirror.textContent()
    expect(multiLineContent).toContain('Step 2: New line')
    
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton) // List creation
    const redoneListItems = proseMirror.locator('li')
    await expect(redoneListItems).toHaveCount(2)
    
    // Verify redo button is now disabled
    const redoButton = page.locator(DOCUMENT_EDITOR_SELECTORS.redoButton)
    await expect(redoButton).toBeDisabled()
  })
})

test.describe('Document Version History - Error Handling', () => {
  test('should handle version loading errors gracefully [E2E-VS-08]', async ({ page }) => {
    // Test ID: E2E-VS-08
    // PRD Reference: Error handling for version conflicts
    
    // Mock API failure for version loading
    await page.route('/api/documents/doc-error-test/versions', async route => {
      await route.fulfill({
        json: { error: 'Failed to load version history' },
        status: 500,
      })
    })
    
    await page.route('/api/documents/doc-error-test', async route => {
      await route.fulfill({
        json: {
          id: 'doc-error-test',
          title: 'Error Test Document',
          content: '<p>Error test content</p>',
          version: 1,
        },
        status: 200,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-error-test"]')
    
    // Try to open version history panel
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionToggle)
    
    // Verify error state is displayed
    const errorMessage = page.locator('[data-testid="version-history-error"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toContainText('Failed to load version history')
    
    // Verify retry functionality
    const retryButton = page.locator('[data-testid="retry-version-load"]')
    await expect(retryButton).toBeVisible()
    
    // Mock successful retry
    await page.route('/api/documents/doc-error-test/versions', async route => {
      await route.fulfill({
        json: { versions: mockVersionHistory.versions.slice(0, 2) },
        status: 200,
      })
    })
    
    await retryButton.click()
    
    // Verify successful loading after retry
    const versionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    await expect(versionItems).toHaveCount(2)
    await expect(errorMessage).toBeHidden()
  })

  test('should handle version restore conflicts [E2E-VS-09]', async ({ page }) => {
    // Test ID: E2E-VS-09
    // PRD Reference: Version conflict resolution
    
    // Mock version conflict scenario
    await page.route('/api/documents/doc-conflict-test/versions', async route => {
      await route.fulfill({
        json: { versions: mockVersionHistory.versions },
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-conflict-test/versions/*/restore', async route => {
      await route.fulfill({
        json: { 
          error: 'Version conflict: Document has been modified by another user',
          errorCode: 'VERSION_CONFLICT',
        },
        status: 409,
      })
    })
    
    await page.route('/api/documents/doc-conflict-test', async route => {
      await route.fulfill({
        json: {
          id: 'doc-conflict-test',
          title: 'Conflict Test Document',
          content: mockVersionHistory.versions[3].content,
          version: 4,
        },
        status: 200,
      })
    })

    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-conflict-test"]')
    
    // Open version history
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionToggle)
    
    // Try to restore a version
    const versionItems = page.locator(DOCUMENT_EDITOR_SELECTORS.versionItem)
    await versionItems.nth(2).click()
    await page.click(DOCUMENT_EDITOR_SELECTORS.versionRestore)
    
    // Confirm restoration
    const confirmDialog = page.locator('[data-testid="restore-confirmation"]')
    await expect(confirmDialog).toBeVisible()
    await page.click('[data-testid="confirm-restore"]')
    
    // Verify conflict error is displayed
    const conflictDialog = page.locator('[data-testid="version-conflict-dialog"]')
    await expect(conflictDialog).toBeVisible()
    await expect(conflictDialog).toContainText('Version conflict')
    await expect(conflictDialog).toContainText('modified by another user')
    
    // Test conflict resolution options
    const forceRestore = page.locator('[data-testid="force-restore"]')
    const reloadDocument = page.locator('[data-testid="reload-document"]')
    const cancelRestore = page.locator('[data-testid="cancel-restore"]')
    
    await expect(forceRestore).toBeVisible()
    await expect(reloadDocument).toBeVisible()
    await expect(cancelRestore).toBeVisible()
    
    // Test cancel option
    await cancelRestore.click()
    await expect(conflictDialog).toBeHidden()
    
    // Document should remain unchanged
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    const content = await proseMirror.textContent()
    expect(content).toContain('Bold conclusion') // Latest version content
  })
})