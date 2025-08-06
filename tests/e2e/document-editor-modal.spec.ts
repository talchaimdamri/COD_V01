/**
 * TipTap Document Editor Modal E2E Tests
 * Test ID: E2E-DOC-EDITOR-MODAL
 * PRD Reference: Task 10.1 - TipTap Document Editor Modal
 * 
 * This test suite covers the comprehensive functionality of the TipTap document editor modal,
 * including modal behavior, editor functionality, toolbar interactions, and document rails.
 * 
 * These tests will FAIL initially until the TipTap Document Editor Modal is implemented (TDD).
 */

import { test, expect } from '@playwright/test'
import { 
  DOCUMENT_EDITOR_SELECTORS,
  DOCUMENT_EDITOR_CONFIG,
  mockDocuments,
  editorTestContent,
  editorKeyboardShortcuts,
  editorPerformanceThresholds,
  modalStates,
} from '../fixtures/document-editor'

test.describe('TipTap Document Editor Modal - Modal Behavior', () => {
  test('should open modal with 70% width and proper dimensions [E2E-DOC-MODAL-01]', async ({ page }) => {
    // Test ID: E2E-DOC-MODAL-01
    // PRD Reference: Modal should open at 70% width with maximize option
    
    await page.goto('/')
    
    // Trigger modal opening (exact trigger will depend on implementation)
    await page.click('[data-testid="open-document-editor"]')
    
    // Verify modal appears
    const modal = page.locator(DOCUMENT_EDITOR_SELECTORS.modal)
    await expect(modal).toBeVisible()
    
    // Verify modal overlay
    const overlay = page.locator(DOCUMENT_EDITOR_SELECTORS.modalOverlay)
    await expect(overlay).toBeVisible()
    
    // Verify modal dimensions
    const modalContent = page.locator(DOCUMENT_EDITOR_SELECTORS.modalContent)
    await expect(modalContent).toBeVisible()
    
    // Check width is approximately 70% of viewport
    const viewport = page.viewportSize()!
    const modalBox = await modalContent.boundingBox()
    expect(modalBox!.width).toBeCloseTo(viewport.width * 0.7, -1) // Allow ~10% variance
    
    // Verify modal has minimum dimensions
    expect(modalBox!.width).toBeGreaterThanOrEqual(600)
    expect(modalBox!.height).toBeGreaterThanOrEqual(400)
    
    // Verify maximize button is present
    const maximizeButton = page.locator(DOCUMENT_EDITOR_SELECTORS.maximizeButton)
    await expect(maximizeButton).toBeVisible()
  })

  test('should maximize and restore modal correctly [E2E-DOC-MODAL-02]', async ({ page }) => {
    // Test ID: E2E-DOC-MODAL-02
    // PRD Reference: Modal should have maximize option
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const modal = page.locator(DOCUMENT_EDITOR_SELECTORS.modal)
    const modalContent = page.locator(DOCUMENT_EDITOR_SELECTORS.modalContent)
    
    // Record initial dimensions
    const initialBox = await modalContent.boundingBox()
    
    // Click maximize button
    await page.click(DOCUMENT_EDITOR_SELECTORS.maximizeButton)
    
    // Verify modal is maximized
    const maximizedBox = await modalContent.boundingBox()
    const viewport = page.viewportSize()!
    
    expect(maximizedBox!.width).toBeCloseTo(viewport.width, -2)
    expect(maximizedBox!.height).toBeCloseTo(viewport.height, -2)
    
    // Verify maximize button becomes restore button
    const restoreButton = page.locator(DOCUMENT_EDITOR_SELECTORS.restoreButton)
    await expect(restoreButton).toBeVisible()
    
    // Click restore button
    await page.click(DOCUMENT_EDITOR_SELECTORS.restoreButton)
    
    // Verify modal returns to normal size
    const restoredBox = await modalContent.boundingBox()
    expect(restoredBox!.width).toBeCloseTo(initialBox!.width, -1)
    expect(restoredBox!.height).toBeCloseTo(initialBox!.height, -1)
    
    // Verify maximize button is back
    const maximizeButton = page.locator(DOCUMENT_EDITOR_SELECTORS.maximizeButton)
    await expect(maximizeButton).toBeVisible()
  })

  test('should close modal with close button and escape key [E2E-DOC-MODAL-03]', async ({ page }) => {
    // Test ID: E2E-DOC-MODAL-03
    // PRD Reference: Modal should have standard close functionality
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const modal = page.locator(DOCUMENT_EDITOR_SELECTORS.modal)
    await expect(modal).toBeVisible()
    
    // Test close button
    await page.click(DOCUMENT_EDITOR_SELECTORS.closeButton)
    await expect(modal).toBeHidden()
    
    // Reopen modal
    await page.click('[data-testid="open-document-editor"]')
    await expect(modal).toBeVisible()
    
    // Test escape key
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()
  })

  test('should handle modal resize operations [E2E-DOC-MODAL-04]', async ({ page }) => {
    // Test ID: E2E-DOC-MODAL-04
    // PRD Reference: Modal should be resizable
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const modalContent = page.locator(DOCUMENT_EDITOR_SELECTORS.modalContent)
    const resizeHandle = page.locator(DOCUMENT_EDITOR_SELECTORS.resizeHandle)
    
    // Verify resize handle is present
    await expect(resizeHandle).toBeVisible()
    
    // Record initial dimensions
    const initialBox = await modalContent.boundingBox()
    
    // Perform resize drag
    await resizeHandle.hover()
    await page.mouse.down()
    await page.mouse.move(initialBox!.x + initialBox!.width + 100, initialBox!.y + initialBox!.height + 50)
    await page.mouse.up()
    
    // Verify modal was resized
    const resizedBox = await modalContent.boundingBox()
    expect(resizedBox!.width).toBeGreaterThan(initialBox!.width)
    expect(resizedBox!.height).toBeGreaterThan(initialBox!.height)
    
    // Verify minimum size constraints
    expect(resizedBox!.width).toBeGreaterThanOrEqual(600)
    expect(resizedBox!.height).toBeGreaterThanOrEqual(400)
  })
})

test.describe('TipTap Document Editor Modal - Editor Initialization', () => {
  test('should initialize TipTap editor with all required extensions [E2E-DOC-EDITOR-01]', async ({ page }) => {
    // Test ID: E2E-DOC-EDITOR-01
    // PRD Reference: Configure TipTap with StarterKit, heading, bullet list, ordered list, code block extensions
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    // Verify editor container is present
    const editorContainer = page.locator(DOCUMENT_EDITOR_SELECTORS.editorContainer)
    await expect(editorContainer).toBeVisible()
    
    // Verify ProseMirror editor is initialized
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    await expect(proseMirror).toHaveAttribute('contenteditable', 'true')
    
    // Verify editor is focusable
    await proseMirror.click()
    await expect(proseMirror).toBeFocused()
    
    // Test basic typing
    await page.keyboard.type('Test content')
    const content = await proseMirror.textContent()
    expect(content).toContain('Test content')
    
    // Verify editor extensions work (test a few key ones)
    await page.keyboard.press('Control+a')
    await page.keyboard.press('Control+b') // Bold formatting
    
    // Check if bold was applied
    const boldElement = proseMirror.locator('strong')
    await expect(boldElement).toBeVisible()
    expect(await boldElement.textContent()).toBe('Test content')
  })

  test('should load document content into editor [E2E-DOC-EDITOR-02]', async ({ page }) => {
    // Test ID: E2E-DOC-EDITOR-02
    // PRD Reference: Editor should load existing document content
    
    // Mock API response for document loading
    await page.route('/api/documents/doc-complex', async route => {
      await route.fulfill({
        json: mockDocuments.complexDocument,
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-complex"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    
    // Verify content was loaded
    await expect(proseMirror.locator('h1')).toContainText('Main Heading')
    await expect(proseMirror.locator('h2')).toContainText('Section 1')
    await expect(proseMirror.locator('ul li')).toHaveCount(2)
    await expect(proseMirror.locator('ol li')).toHaveCount(2)
    await expect(proseMirror.locator('pre code')).toContainText('const example')
    await expect(proseMirror.locator('blockquote')).toContainText('This is a blockquote')
  })

  test('should handle editor loading states [E2E-DOC-EDITOR-03]', async ({ page }) => {
    // Test ID: E2E-DOC-EDITOR-03
    // PRD Reference: Editor should handle loading and error states
    
    // Mock slow API response
    await page.route('/api/documents/doc-slow', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.fulfill({
        json: mockDocuments.simpleDocument,
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-slow"]')
    
    // Verify loading state
    const loadingIndicator = page.locator('[data-testid="editor-loading"]')
    await expect(loadingIndicator).toBeVisible()
    
    // Wait for content to load
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible({ timeout: 2000 })
    
    // Verify loading indicator is gone
    await expect(loadingIndicator).toBeHidden()
  })
})

test.describe('TipTap Document Editor Modal - Toolbar Functionality', () => {
  test('should render all required toolbar buttons [E2E-DOC-TOOLBAR-01]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-01
    // PRD Reference: Custom toolbar with formatting options, Ask Agent button, Undo/Redo, Save Version
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const toolbar = page.locator(DOCUMENT_EDITOR_SELECTORS.toolbar)
    await expect(toolbar).toBeVisible()
    
    // Verify formatting buttons
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.boldButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.italicButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.underlineButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.strikeButton)).toBeVisible()
    
    // Verify heading buttons
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.heading1Button)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.heading2Button)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.heading3Button)).toBeVisible()
    
    // Verify list buttons
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.bulletListButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.orderedListButton)).toBeVisible()
    
    // Verify block buttons
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.codeBlockButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.blockquoteButton)).toBeVisible()
    
    // Verify history buttons
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.undoButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.redoButton)).toBeVisible()
    
    // Verify action buttons
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.askAgentButton)).toBeVisible()
    await expect(page.locator(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)).toBeVisible()
  })

  test('should apply text formatting correctly [E2E-DOC-TOOLBAR-02]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-02
    // PRD Reference: Toolbar formatting options should work
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Type some text
    await page.keyboard.type('Testing formatting')
    
    // Select all text
    await page.keyboard.press('Control+a')
    
    // Test bold formatting
    await page.click(DOCUMENT_EDITOR_SELECTORS.boldButton)
    await expect(proseMirror.locator('strong')).toContainText('Testing formatting')
    
    // Test italic formatting (should combine with bold)
    await page.click(DOCUMENT_EDITOR_SELECTORS.italicButton)
    await expect(proseMirror.locator('strong em, em strong')).toContainText('Testing formatting')
    
    // Test underline
    await page.click(DOCUMENT_EDITOR_SELECTORS.underlineButton)
    const underlinedText = proseMirror.locator('u')
    await expect(underlinedText).toBeVisible()
    
    // Test strike-through
    await page.click(DOCUMENT_EDITOR_SELECTORS.strikeButton)
    const strikeText = proseMirror.locator('s')
    await expect(strikeText).toBeVisible()
  })

  test('should create headings correctly [E2E-DOC-TOOLBAR-03]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-03
    // PRD Reference: Toolbar should support heading creation
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Test H1
    await page.keyboard.type('Heading 1')
    await page.keyboard.press('Control+a')
    await page.click(DOCUMENT_EDITOR_SELECTORS.heading1Button)
    await expect(proseMirror.locator('h1')).toContainText('Heading 1')
    
    // Move to new line and test H2
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Heading 2')
    await page.keyboard.press('Control+a')
    await page.click(DOCUMENT_EDITOR_SELECTORS.heading2Button)
    await expect(proseMirror.locator('h2')).toContainText('Heading 2')
    
    // Move to new line and test H3
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Heading 3')
    await page.keyboard.press('Control+a')
    await page.click(DOCUMENT_EDITOR_SELECTORS.heading3Button)
    await expect(proseMirror.locator('h3')).toContainText('Heading 3')
  })

  test('should create lists correctly [E2E-DOC-TOOLBAR-04]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-04
    // PRD Reference: Toolbar should support list creation
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Test bullet list
    await page.keyboard.type('First item')
    await page.click(DOCUMENT_EDITOR_SELECTORS.bulletListButton)
    await expect(proseMirror.locator('ul li')).toContainText('First item')
    
    // Add second item
    await page.keyboard.press('Enter')
    await page.keyboard.type('Second item')
    await expect(proseMirror.locator('ul li')).toHaveCount(2)
    
    // Exit list and create ordered list
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter') // Exit list
    await page.keyboard.type('First numbered item')
    await page.click(DOCUMENT_EDITOR_SELECTORS.orderedListButton)
    await expect(proseMirror.locator('ol li')).toContainText('First numbered item')
    
    // Add second numbered item
    await page.keyboard.press('Enter')
    await page.keyboard.type('Second numbered item')
    await expect(proseMirror.locator('ol li')).toHaveCount(2)
  })

  test('should create code blocks and blockquotes [E2E-DOC-TOOLBAR-05]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-05
    // PRD Reference: Toolbar should support code blocks
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Test code block
    await page.keyboard.type('console.log("Hello World");')
    await page.keyboard.press('Control+a')
    await page.click(DOCUMENT_EDITOR_SELECTORS.codeBlockButton)
    await expect(proseMirror.locator('pre code')).toContainText('console.log("Hello World");')
    
    // Move to new line and test blockquote
    await page.keyboard.press('End')
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter') // Exit code block
    await page.keyboard.type('This is a quote')
    await page.keyboard.press('Control+a')
    await page.click(DOCUMENT_EDITOR_SELECTORS.blockquoteButton)
    await expect(proseMirror.locator('blockquote')).toContainText('This is a quote')
  })

  test('should handle undo/redo operations [E2E-DOC-TOOLBAR-06]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-06
    // PRD Reference: Toolbar should have Undo/Redo functionality
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Type initial content
    await page.keyboard.type('Initial text')
    
    // Make a change
    await page.keyboard.type(' with addition')
    const initialContent = await proseMirror.textContent()
    
    // Test undo
    await page.click(DOCUMENT_EDITOR_SELECTORS.undoButton)
    const undoneContent = await proseMirror.textContent()
    expect(undoneContent).not.toBe(initialContent)
    
    // Test redo
    await page.click(DOCUMENT_EDITOR_SELECTORS.redoButton)
    const redoneContent = await proseMirror.textContent()
    expect(redoneContent).toBe(initialContent)
    
    // Test keyboard shortcuts
    await page.keyboard.press('Control+z') // Undo
    const keyboardUndoneContent = await proseMirror.textContent()
    expect(keyboardUndoneContent).toBe(undoneContent)
    
    await page.keyboard.press('Control+y') // Redo
    const keyboardRedoneContent = await proseMirror.textContent()
    expect(keyboardRedoneContent).toBe(initialContent)
  })

  test('should handle Ask Agent button functionality [E2E-DOC-TOOLBAR-07]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-07
    // PRD Reference: Custom toolbar with Ask Agent button
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Type some content
    await page.keyboard.type('Please analyze this text for key insights.')
    
    // Click Ask Agent button
    await page.click(DOCUMENT_EDITOR_SELECTORS.askAgentButton)
    
    // Verify Ask Agent modal or popup appears
    const askAgentModal = page.locator('[data-testid="ask-agent-modal"]')
    await expect(askAgentModal).toBeVisible()
    
    // Verify selected text or context is passed to agent
    const agentContext = page.locator('[data-testid="agent-context"]')
    await expect(agentContext).toContainText('Please analyze this text')
  })

  test('should handle Save Version functionality [E2E-DOC-TOOLBAR-08]', async ({ page }) => {
    // Test ID: E2E-DOC-TOOLBAR-08
    // PRD Reference: Custom toolbar with Save Version button
    
    // Mock save API
    await page.route('/api/documents/*/versions', async route => {
      await route.fulfill({
        json: { versionId: 'version-new', versionNumber: 2 },
        status: 201,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"]')
    
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await proseMirror.click()
    
    // Type some content
    await page.keyboard.type('Content to be saved as new version')
    
    // Click Save Version button
    await page.click(DOCUMENT_EDITOR_SELECTORS.saveVersionButton)
    
    // Verify save success indicator
    const savedIndicator = page.locator(DOCUMENT_EDITOR_SELECTORS.savedIndicator)
    await expect(savedIndicator).toBeVisible()
    await expect(savedIndicator).toContainText('Version saved')
    
    // Verify save dialog if present
    const saveDialog = page.locator('[data-testid="save-version-dialog"]')
    if (await saveDialog.isVisible()) {
      await expect(saveDialog).toContainText('Save new version')
    }
  })
})

test.describe('TipTap Document Editor Modal - Document Rails', () => {
  test('should display upstream document connections [E2E-DOC-RAILS-01]', async ({ page }) => {
    // Test ID: E2E-DOC-RAILS-01
    // PRD Reference: Document rails showing upstream/downstream connections
    
    // Mock API with document connections
    await page.route('/api/documents/doc-connected', async route => {
      await route.fulfill({
        json: mockDocuments.documentWithConnections,
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-connected/connections', async route => {
      await route.fulfill({
        json: {
          upstream: [
            { id: 'doc-input-1', title: 'Source Doc 1', preview: 'Source content preview...' },
            { id: 'doc-input-2', title: 'Source Doc 2', preview: 'More source content...' },
          ],
          downstream: [
            { id: 'doc-output-1', title: 'Output Doc 1', preview: 'Generated output...' },
          ],
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-connected"]')
    
    // Verify upstream rail is visible
    const upstreamRail = page.locator(DOCUMENT_EDITOR_SELECTORS.upstreamRail)
    await expect(upstreamRail).toBeVisible()
    
    // Verify upstream items are displayed
    const upstreamItems = page.locator(`${DOCUMENT_EDITOR_SELECTORS.upstreamRail} ${DOCUMENT_EDITOR_SELECTORS.railItem}`)
    await expect(upstreamItems).toHaveCount(2)
    
    // Verify upstream item details
    await expect(upstreamItems.first().locator(DOCUMENT_EDITOR_SELECTORS.railItemTitle)).toContainText('Source Doc 1')
    await expect(upstreamItems.first().locator(DOCUMENT_EDITOR_SELECTORS.railItemPreview)).toContainText('Source content preview')
    
    await expect(upstreamItems.nth(1).locator(DOCUMENT_EDITOR_SELECTORS.railItemTitle)).toContainText('Source Doc 2')
  })

  test('should display downstream document connections [E2E-DOC-RAILS-02]', async ({ page }) => {
    // Test ID: E2E-DOC-RAILS-02
    // PRD Reference: Document rails showing downstream connections
    
    // Mock API with document connections
    await page.route('/api/documents/doc-connected', async route => {
      await route.fulfill({
        json: mockDocuments.documentWithConnections,
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-connected/connections', async route => {
      await route.fulfill({
        json: {
          upstream: [],
          downstream: [
            { id: 'doc-output-1', title: 'Summary Report', preview: 'Generated summary...' },
            { id: 'doc-output-2', title: 'Analysis Output', preview: 'Analysis results...' },
          ],
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-connected"]')
    
    // Verify downstream rail is visible
    const downstreamRail = page.locator(DOCUMENT_EDITOR_SELECTORS.downstreamRail)
    await expect(downstreamRail).toBeVisible()
    
    // Verify downstream items are displayed
    const downstreamItems = page.locator(`${DOCUMENT_EDITOR_SELECTORS.downstreamRail} ${DOCUMENT_EDITOR_SELECTORS.railItem}`)
    await expect(downstreamItems).toHaveCount(2)
    
    // Verify downstream item details
    await expect(downstreamItems.first().locator(DOCUMENT_EDITOR_SELECTORS.railItemTitle)).toContainText('Summary Report')
    await expect(downstreamItems.first().locator(DOCUMENT_EDITOR_SELECTORS.railItemPreview)).toContainText('Generated summary')
    
    await expect(downstreamItems.nth(1).locator(DOCUMENT_EDITOR_SELECTORS.railItemTitle)).toContainText('Analysis Output')
  })

  test('should handle rail item interactions [E2E-DOC-RAILS-03]', async ({ page }) => {
    // Test ID: E2E-DOC-RAILS-03
    // PRD Reference: Rails should allow interaction with connected documents
    
    // Mock API responses
    await page.route('/api/documents/doc-connected', async route => {
      await route.fulfill({
        json: mockDocuments.documentWithConnections,
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-connected/connections', async route => {
      await route.fulfill({
        json: {
          upstream: [{ id: 'doc-input-1', title: 'Source Doc 1', preview: 'Source content...' }],
          downstream: [{ id: 'doc-output-1', title: 'Output Doc 1', preview: 'Generated output...' }],
        },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-connected"]')
    
    // Test clicking on upstream rail item
    const upstreamItem = page.locator(`${DOCUMENT_EDITOR_SELECTORS.upstreamRail} ${DOCUMENT_EDITOR_SELECTORS.railItem}`)
    await upstreamItem.click()
    
    // Verify document preview or navigation occurs
    const documentPreview = page.locator('[data-testid="document-preview"]')
    if (await documentPreview.isVisible()) {
      await expect(documentPreview).toContainText('Source content')
    }
    
    // Test connect button if present
    const connectButton = upstreamItem.locator(DOCUMENT_EDITOR_SELECTORS.railItemConnect)
    if (await connectButton.isVisible()) {
      await connectButton.click()
      
      // Verify connection action occurs
      const connectionDialog = page.locator('[data-testid="connection-dialog"]')
      await expect(connectionDialog).toBeVisible()
    }
  })

  test('should handle empty rails gracefully [E2E-DOC-RAILS-04]', async ({ page }) => {
    // Test ID: E2E-DOC-RAILS-04
    // PRD Reference: Rails should handle empty states
    
    // Mock API with no connections
    await page.route('/api/documents/doc-empty', async route => {
      await route.fulfill({
        json: mockDocuments.emptyDocument,
        status: 200,
      })
    })
    
    await page.route('/api/documents/doc-empty/connections', async route => {
      await route.fulfill({
        json: { upstream: [], downstream: [] },
        status: 200,
      })
    })
    
    await page.goto('/')
    await page.click('[data-testid="open-document-editor"][data-document-id="doc-empty"]')
    
    // Verify rails are still present but show empty states
    const upstreamRail = page.locator(DOCUMENT_EDITOR_SELECTORS.upstreamRail)
    const downstreamRail = page.locator(DOCUMENT_EDITOR_SELECTORS.downstreamRail)
    
    await expect(upstreamRail).toBeVisible()
    await expect(downstreamRail).toBeVisible()
    
    // Verify empty state messages
    await expect(upstreamRail).toContainText('No upstream connections')
    await expect(downstreamRail).toContainText('No downstream connections')
    
    // Verify add connection options are present
    const addUpstreamButton = page.locator('[data-testid="add-upstream-connection"]')
    const addDownstreamButton = page.locator('[data-testid="add-downstream-connection"]')
    
    await expect(addUpstreamButton).toBeVisible()
    await expect(addDownstreamButton).toBeVisible()
  })
})

test.describe('TipTap Document Editor Modal - Performance', () => {
  test('should meet performance thresholds for modal and editor [E2E-DOC-PERF-01]', async ({ page }) => {
    // Test ID: E2E-DOC-PERF-01
    // PRD Reference: Editor should meet performance requirements
    
    await page.goto('/')
    
    // Measure modal opening time
    const startTime = performance.now()
    await page.click('[data-testid="open-document-editor"]')
    
    const modal = page.locator(DOCUMENT_EDITOR_SELECTORS.modal)
    await expect(modal).toBeVisible()
    
    const endTime = performance.now()
    const modalOpenTime = endTime - startTime
    
    // Modal should open quickly
    expect(modalOpenTime).toBeLessThan(editorPerformanceThresholds.modalOpen)
    
    // Measure editor initialization time
    const editorStartTime = performance.now()
    const proseMirror = page.locator(DOCUMENT_EDITOR_SELECTORS.editorProseMirror)
    await expect(proseMirror).toBeVisible()
    
    const editorEndTime = performance.now()
    const editorInitTime = editorEndTime - editorStartTime
    
    // Editor should initialize quickly
    expect(editorInitTime).toBeLessThan(editorPerformanceThresholds.initialization)
    
    // Test typing responsiveness
    await proseMirror.click()
    const typingStartTime = performance.now()
    await page.keyboard.type('Performance test content')
    const typingEndTime = performance.now()
    const typingTime = typingEndTime - typingStartTime
    
    // Typing should be responsive
    expect(typingTime).toBeLessThan(editorPerformanceThresholds.typing * 10) // Allow for test overhead
  })
})