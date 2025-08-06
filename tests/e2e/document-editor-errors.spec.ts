/**
 * TipTap Document Editor Modal - Error Handling E2E Tests
 * Test ID: E2E-DOC-EDITOR-ERRORS
 * PRD Reference: Task 10.1 - TipTap Document Editor Modal Error Cases
 * 
 * This test suite covers error handling and edge cases for the TipTap document editor modal,
 * including network failures, validation errors, and recovery scenarios.
 * 
 * These tests will FAIL initially until the TipTap Document Editor Modal is implemented (TDD).
 */

import { test, expect } from '@playwright/test'
import { 
  DOCUMENT_EDITOR_SELECTORS,
  editorErrorScenarios,
  editorPerformanceThresholds,
} from '../fixtures/document-editor'

test.describe('TipTap Document Editor Modal - Error Handling', () => {
  test('should handle document loading failures gracefully [E2E-DOC-ERROR-01]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-01
    // PRD Reference: Editor should handle loading and error states
    
    // Mock API failure
    await page.route('/api/documents/doc-fail', async route => {
      await route.fulfill({
        status: 500,
        json: { error: 'Internal server error' },
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-fail"]')
    
    // Verify error state is displayed
    const errorIndicator = page.locator(DOCUMENT_EDITOR_SELECTORS.errorIndicator)
    await expect(errorIndicator).toBeVisible()
    
    // Verify error message is shown
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load document')
    
    // Verify retry option is available
    const retryButton = page.locator('[data-testid="retry-load-button"]')
    await expect(retryButton).toBeVisible()
    
    // Test retry functionality
    await page.route('/api/documents/doc-fail', async route => {
      await route.fulfill({
        json: { id: 'doc-fail', title: 'Recovered Document', content: '<p>Recovered content</p>' },
        status: 200,
      })
    })
    
    await retryButton.click()
    
    // Verify document loads after retry
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    await expect(proseMirror).toContainText('Recovered content')
  })

  test('should handle save failures with recovery options [E2E-DOC-ERROR-02]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-02
    // PRD Reference: Save operations should handle failures gracefully
    
    // Mock save failure
    await page.route('/api/documents/*/versions', async route => {
      await route.fulfill({
        status: 503,
        json: { error: 'Service temporarily unavailable' },
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    await page.keyboard.type('Content to save')
    
    // Attempt to save version
    await page.click(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)
    
    // Verify save error is displayed
    const errorIndicator = page.locator(DOCUMENT_EDITOR_SELECTORS.errorIndicator)
    await expect(errorIndicator).toBeVisible()
    await expect(errorIndicator).toContainText('Failed to save')
    
    // Verify retry save option is available
    const retrySaveButton = page.locator('[data-testid="retry-save-button"]')
    await expect(retrySaveButton).toBeVisible()
    
    // Verify content is preserved locally
    await expect(proseMirror).toContainText('Content to save')
    
    // Test auto-save recovery
    const autoSaveIndicator = page.locator('[data-testid="auto-save-pending"]')
    await expect(autoSaveIndicator).toBeVisible()
    
    // Mock successful save
    await page.route('/api/documents/*/versions', async route => {
      await route.fulfill({
        json: { versionId: 'version-recovered', versionNumber: 2 },
        status: 201,
      })
    })
    
    await retrySaveButton.click()
    
    // Verify successful save
    const savedIndicator = page.locator(DOCUMENT_EDITOR_SELECTORS.savedIndicator)
    await expect(savedIndicator).toBeVisible()
  })

  test('should handle network connectivity issues [E2E-DOC-ERROR-03]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-03
    // PRD Reference: Editor should handle network failures
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    await page.keyboard.type('Content created offline')
    
    // Simulate network offline
    await page.route('**/*', route => route.abort())
    
    // Attempt to save - should show offline indicator
    await page.click(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)
    
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]')
    await expect(offlineIndicator).toBeVisible()
    await expect(offlineIndicator).toContainText('Working offline')
    
    // Verify content is still editable
    await proseMirror.click()
    await page.keyboard.type(' - additional offline content')
    await expect(proseMirror).toContainText('additional offline content')
    
    // Restore network connectivity
    await page.unroute('**/*')
    
    // Mock successful save
    await page.route('/api/documents/*/versions', async route => {
      await route.fulfill({
        json: { versionId: 'version-sync', versionNumber: 2 },
        status: 201,
      })
    })
    
    // Should automatically attempt to sync
    const syncingIndicator = page.locator('[data-testid="syncing-indicator"]')
    await expect(syncingIndicator).toBeVisible()
    
    // Should eventually show success
    const savedIndicator = page.locator(DOCUMENT_EDITOR_SELECTORS.savedIndicator)
    await expect(savedIndicator).toBeVisible({ timeout: 5000 })
  })

  test('should handle malformed content gracefully [E2E-DOC-ERROR-04]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-04
    // PRD Reference: Editor should validate and sanitize content
    
    // Mock document with malformed content
    await page.route('/api/documents/doc-malformed', async route => {
      await route.fulfill({
        json: {
          id: 'doc-malformed',
          title: 'Malformed Document',
          content: editorErrorScenarios.invalidContent.malformedHtml,
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-malformed"]')
    
    // Verify content is sanitized and rendered safely
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    
    // Content should be cleaned up
    await expect(proseMirror.locator('p')).toBeVisible()
    await expect(proseMirror).toContainText('Unclosed paragraph')
    
    // Verify no malformed HTML elements remain
    const unclosedTags = page.locator('p:not([closed])')
    expect(await unclosedTags.count()).toBe(0)
    
    // Verify editor is still functional
    await proseMirror.click()
    await page.keyboard.type(' - fixed content')
    await expect(proseMirror).toContainText('fixed content')
  })

  test('should prevent XSS attacks in content [E2E-DOC-ERROR-05]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-05
    // PRD Reference: Editor should sanitize dangerous content
    
    // Mock document with potentially dangerous content
    await page.route('/api/documents/doc-xss', async route => {
      await route.fulfill({
        json: {
          id: 'doc-xss',
          title: 'XSS Test Document',
          content: editorErrorScenarios.invalidContent.scriptInjection,
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-xss"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    
    // Verify script tags are stripped
    const scriptElements = page.locator('script')
    expect(await scriptElements.count()).toBe(0)
    
    // Verify content is sanitized but readable text remains
    await expect(proseMirror).toContainText('Text with')
    
    // Verify no JavaScript execution occurs
    const alertDialogs = page.locator('.alert, [role="alert"]')
    expect(await alertDialogs.count()).toBe(0)
  })

  test('should handle modal resize errors [E2E-DOC-ERROR-06]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-06
    // PRD Reference: Modal resize should be robust
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const modal = page.locator(DOCUMENT_EDITOR_SELECTORS.modal)
    const modalContent = page.locator(DOCUMENT_EDITOR_SELECTORS.modalContent)
    
    // Test extreme resize attempts
    const initialBox = await modalContent.boundingBox()
    
    // Attempt to resize beyond viewport limits
    const resizeHandle = page.locator(DOCUMENT_EDITOR_SELECTORS.resizeHandle)
    await resizeHandle.hover()
    await page.mouse.down()
    
    // Try to resize to negative dimensions
    await page.mouse.move(-100, -100)
    await page.mouse.up()
    
    // Verify modal maintains minimum dimensions
    const afterInvalidResize = await modalContent.boundingBox()
    expect(afterInvalidResize!.width).toBeGreaterThanOrEqual(600)
    expect(afterInvalidResize!.height).toBeGreaterThanOrEqual(400)
    
    // Try to resize beyond viewport
    const viewport = page.viewportSize()!
    await resizeHandle.hover()
    await page.mouse.down()
    await page.mouse.move(viewport.width + 100, viewport.height + 100)
    await page.mouse.up()
    
    // Verify modal doesn't exceed viewport
    const afterMaxResize = await modalContent.boundingBox()
    expect(afterMaxResize!.width).toBeLessThanOrEqual(viewport.width)
    expect(afterMaxResize!.height).toBeLessThanOrEqual(viewport.height)
  })

  test('should handle editor performance degradation [E2E-DOC-ERROR-07]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-07
    // PRD Reference: Editor should handle large content gracefully
    
    // Generate very large content
    const largeContent = '<p>' + 'Large document content. '.repeat(1000) + '</p>'
    
    await page.route('/api/documents/doc-large', async route => {
      await route.fulfill({
        json: {
          id: 'doc-large',
          title: 'Large Document',
          content: largeContent,
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    
    // Measure loading time
    const startTime = performance.now()
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-large"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    // Should still load within reasonable time
    expect(loadTime).toBeLessThan(editorPerformanceThresholds.contentLoad * 5) // Allow 5x threshold for large content
    
    // Test scrolling performance
    await proseMirror.click()
    
    const scrollStartTime = performance.now()
    await page.keyboard.press('End') // Scroll to end
    const scrollEndTime = performance.now()
    const scrollTime = scrollEndTime - scrollStartTime
    
    expect(scrollTime).toBeLessThan(500) // Scrolling should be smooth
    
    // Test typing performance with large content
    const typingStartTime = performance.now()
    await page.keyboard.type('Test typing')
    const typingEndTime = performance.now()
    const typingTime = typingEndTime - typingStartTime
    
    expect(typingTime).toBeLessThan(editorPerformanceThresholds.typing * 10) // Allow for large content overhead
  })

  test('should handle rapid user interactions gracefully [E2E-DOC-ERROR-08]', async ({ page }) => {
    // Test ID: E2E-DOC-ERROR-08
    // PRD Reference: Editor should handle rapid operations without errors
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Rapid formatting operations
    await page.keyboard.type('Test content')
    await page.keyboard.press('Control+a')
    
    // Rapid button clicks
    const buttons = [
      DOCUMENT_EDITOR_SELECTORS.boldButton,
      DOCUMENT_EDITOR_SELECTORS.italicButton,
      DOCUMENT_EDITOR_SELECTORS.underlineButton,
      DOCUMENT_EDITOR_SELECTORS.boldButton, // Toggle off
      DOCUMENT_EDITOR_SELECTORS.italicButton, // Toggle off
    ]
    
    for (const button of buttons) {
      await page.click(button)
      await page.waitForTimeout(10) // Very short delay
    }
    
    // Verify content is still intact
    await expect(proseMirror).toContainText('Test content')
    
    // Rapid undo/redo operations
    for (let i = 0; i < 5; i++) {
      await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
      await page.waitForTimeout(10)
      await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton)
      await page.waitForTimeout(10)
    }
    
    // Editor should still be responsive
    await proseMirror.click()
    await page.keyboard.type(' additional text')
    await expect(proseMirror).toContainText('additional text')
  })

  test('should handle concurrent editing conflicts [E2E-DOC-ERROR-09]', async ({ page, browser }) => {
    // Test ID: E2E-DOC-ERROR-09
    // PRD Reference: Editor should handle concurrent editing
    
    // Mock document for concurrent editing
    let documentVersion = 1
    let documentContent = '<p>Initial content</p>'
    
    await page.route('/api/documents/doc-concurrent', async route => {
      await route.fulfill({
        json: {
          id: 'doc-concurrent',
          title: 'Concurrent Document',
          content: documentContent,
          version: documentVersion,
        },
        status: 200,
      })
    })
    
    // Mock version conflict on save
    await page.route('/api/documents/doc-concurrent/versions', async route => {
      if (documentVersion > 1) {
        await route.fulfill({
          status: 409,
          json: { error: 'Version conflict', currentVersion: documentVersion },
        })
      } else {
        documentVersion++
        documentContent = '<p>Content updated by another user</p>'
        await route.fulfill({
          json: { versionId: 'version-2', versionNumber: documentVersion },
          status: 201,
        })
      }
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-concurrent"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Make changes
    await page.keyboard.press('End')
    await page.keyboard.type(' - local changes')
    
    // Simulate concurrent update (increment version)
    documentVersion = 2
    
    // Attempt to save - should detect conflict
    await page.click(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)
    
    // Verify conflict resolution UI appears
    const conflictDialog = page.locator('[data-testid="version-conflict-dialog"]')
    await expect(conflictDialog).toBeVisible()
    
    // Should show merge options
    await expect(page.locator('[data-testid="merge-changes-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="overwrite-changes-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="cancel-save-button"]')).toBeVisible()
    
    // Test merge option
    await page.click('[data-testid="merge-changes-button"]')
    
    // Should show merge editor or success message
    const mergeResult = page.locator('[data-testid="merge-result"]')
    await expect(mergeResult).toBeVisible()
  })
})

test.describe('TipTap Document Editor Modal - Edge Cases', () => {
  test('should handle extremely long document titles [E2E-DOC-EDGE-01]', async ({ page }) => {
    // Test ID: E2E-DOC-EDGE-01
    // PRD Reference: Modal should handle edge cases gracefully
    
    const longTitle = 'Very '.repeat(100) + 'Long Document Title'
    
    await page.route('/api/documents/doc-long-title', async route => {
      await route.fulfill({
        json: {
          id: 'doc-long-title',
          title: longTitle,
          content: '<p>Content with very long title</p>',
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-long-title"]')
    
    // Verify title is truncated in UI but full title is preserved
    const modalHeader = page.locator(DOCUMENT_EDITOR_SELECTORS.modalHeader)
    await expect(modalHeader).toBeVisible()
    
    // Title should be truncated for display
    const displayTitle = modalHeader.locator('[data-testid="document-title"]')
    const displayTitleText = await displayTitle.textContent()
    expect(displayTitleText!.length).toBeLessThan(longTitle.length)
    expect(displayTitleText).toContain('...')
    
    // Full title should be available in tooltip or title attribute
    const fullTitle = await displayTitle.getAttribute('title')
    expect(fullTitle).toBe(longTitle)
  })

  test('should handle empty and whitespace-only content [E2E-DOC-EDGE-02]', async ({ page }) => {
    // Test ID: E2E-DOC-EDGE-02
    // PRD Reference: Editor should handle empty content gracefully
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Test empty content
    await expect(proseMirror).toBeEmpty()
    
    // Test whitespace-only content
    await page.keyboard.type('   \n\n\n   ')
    
    // Should show placeholder or empty state
    const placeholder = page.locator('[data-testid="editor-placeholder"]')
    if (await placeholder.isVisible()) {
      await expect(placeholder).toContainText('Start typing...')
    }
    
    // Test save with empty content
    await page.click(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)
    
    // Should show validation message or handle gracefully
    const validationMessage = page.locator('[data-testid="validation-message"]')
    if (await validationMessage.isVisible()) {
      await expect(validationMessage).toContainText('Document cannot be empty')
    }
  })

  test('should handle special characters and unicode [E2E-DOC-EDGE-03]', async ({ page }) => {
    // Test ID: E2E-DOC-EDGE-03
    // PRD Reference: Editor should support international content
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Test various unicode characters
    const specialText = '🚀 Unicode: héllo wörld 中文 العربية 🎉'
    await page.keyboard.type(specialText)
    
    await expect(proseMirror).toContainText(specialText)
    
    // Test special formatting characters
    await page.keyboard.type('\n\nSpecial chars: & < > " \'')
    await expect(proseMirror).toContainText('Special chars: & < > " \'')
    
    // Test copy/paste with special characters
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+c')
    
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Control+v')
    
    // Content should be duplicated correctly
    const allText = await proseMirror.textContent()
    expect(allText!.split(specialText).length - 1).toBe(2) // Should appear twice
  })

  test('should handle maximum content size limits [E2E-DOC-EDGE-04]', async ({ page }) => {
    // Test ID: E2E-DOC-EDGE-04
    // PRD Reference: Editor should enforce content size limits
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Generate content approaching size limit (simulate)
    const largeText = 'Large content block. '.repeat(500)
    await page.keyboard.type(largeText)
    
    // Continue adding content to exceed limit
    const excessText = 'Excess content that should trigger limit warning. '.repeat(100)
    await page.keyboard.type(excessText)
    
    // Should show size limit warning
    const sizeLimitWarning = page.locator('[data-testid="content-size-warning"]')
    if (await sizeLimitWarning.isVisible()) {
      await expect(sizeLimitWarning).toContainText('Content size limit')
    }
    
    // Try to save at limit
    await page.click(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)
    
    // Should either save successfully or show limit error
    const saveResult = await Promise.race([
      page.locator(DOCUMENT_EDITOR_SELECTORS.savedIndicator).waitFor({ timeout: 2000 }),
      page.locator('[data-testid="content-too-large-error"]').waitFor({ timeout: 2000 }),
    ]).catch(() => null)
    
    expect(saveResult).toBeTruthy() // Should show some result
  })
})