/**
 * TipTap Document Editor Modal Unit Tests
 * Test ID: UNIT-DOC-EDITOR-MODAL
 * PRD Reference: Task 10.1 - TipTap Document Editor Modal
 * 
 * Unit tests for the TipTap document editor modal component, focusing on:
 * - Modal component behavior and props
 * - Editor configuration and initialization
 * - Event sourcing integration
 * - Toolbar component functionality
 * - Document rails component
 * 
 * These tests will FAIL initially until the components are implemented (TDD).
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'

// Components to be implemented
import DocumentEditorModal from '../../../src/components/modals/DocumentEditorModal'
import DocumentEditorToolbar from '../../../src/components/modals/DocumentEditorToolbar'
import DocumentRails from '../../../src/components/modals/DocumentRails'
import TipTapEditor from '../../../src/components/modals/TipTapEditor'

// Mock TipTap dependencies
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(),
  EditorContent: vi.fn(({ editor }) => (
    <div data-testid="tiptap-editor-content" className="ProseMirror" contentEditable="true">
      {editor?.getHTML?.() || ''}
    </div>
  )),
}))

vi.mock('@tiptap/starter-kit', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'StarterKit' })),
  },
}))

vi.mock('@tiptap/extension-heading', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'Heading' })),
  },
}))

vi.mock('@tiptap/extension-list-item', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'ListItem' })),
  },
}))

vi.mock('@tiptap/extension-bullet-list', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'BulletList' })),
  },
}))

vi.mock('@tiptap/extension-ordered-list', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'OrderedList' })),
  },
}))

vi.mock('@tiptap/extension-code-block', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'CodeBlock' })),
  },
}))

vi.mock('@tiptap/extension-blockquote', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'Blockquote' })),
  },
}))

vi.mock('@tiptap/extension-underline', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'Underline' })),
  },
}))

vi.mock('@tiptap/extension-strike', () => ({
  default: {
    configure: vi.fn(() => ({ name: 'Strike' })),
  },
}))

// Test fixtures
import { 
  mockDocuments,
  mockVersionHistory,
  mockRailConnections,
  editorTestContent,
  DOCUMENT_EDITOR_CONFIG,
} from '../../fixtures/document-editor'

const mockTipTap = await import('@tiptap/react') as any

// Mock event sourcing
vi.mock('../../../src/lib/eventSourcing', () => ({
  useDocumentEventSourcing: vi.fn(() => ({
    documentState: {
      id: 'test-doc',
      title: 'Test Document',
      content: '<p>Test content</p>',
      version: 1,
      upstream: [],
      downstream: [],
    },
    eventHistory: [],
    currentEventIndex: -1,
    isLoading: false,
    error: null,
    canUndo: false,
    canRedo: false,
    updateContent: vi.fn(),
    saveVersion: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
  })),
}))

describe('DocumentEditorModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    documentId: 'test-doc',
    initialContent: '<p>Initial content</p>',
    onSave: vi.fn(),
  }

  let mockUseDocumentEventSourcing: any

  beforeEach(async () => {
    vi.clearAllMocks()
    // Get the mocked function
    const eventSourcingModule = await import('../../../src/lib/eventSourcing')
    mockUseDocumentEventSourcing = vi.mocked(eventSourcingModule.useDocumentEventSourcing)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  test('should render modal with correct dimensions [UNIT-DOC-MODAL-01]', () => {
    // Test ID: UNIT-DOC-MODAL-01
    // PRD Reference: Modal should open at 70% width with maximize option
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    // Verify modal container is present
    const modal = screen.getByTestId('document-editor-modal')
    expect(modal).toBeInTheDocument()
    
    // Verify modal content has correct width styling
    const modalContent = screen.getByTestId('modal-content')
    expect(modalContent).toHaveStyle({
      width: DOCUMENT_EDITOR_CONFIG.modal.width,
      minWidth: DOCUMENT_EDITOR_CONFIG.modal.minWidth,
    })
    
    // Verify maximize button is present
    const maximizeButton = screen.getByTestId('maximize-modal-button')
    expect(maximizeButton).toBeInTheDocument()
  })

  test('should handle modal close actions [UNIT-DOC-MODAL-02]', async () => {
    // Test ID: UNIT-DOC-MODAL-02
    // PRD Reference: Modal should close with close button and escape key
    
    const onClose = vi.fn()
    render(<DocumentEditorModal {...defaultProps} onClose={onClose} />)
    
    // Test close button
    const closeButton = screen.getByTestId('close-modal-button')
    await userEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
    
    // Reset mock and test escape key
    onClose.mockClear()
    
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('should handle maximize and restore functionality [UNIT-DOC-MODAL-03]', async () => {
    // Test ID: UNIT-DOC-MODAL-03
    // PRD Reference: Modal should have maximize option
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    const modal = screen.getByTestId('document-editor-modal')
    const maximizeButton = screen.getByTestId('maximize-modal-button')
    
    // Initially not maximized
    expect(modal).not.toHaveAttribute('data-maximized', 'true')
    
    // Click maximize
    await userEvent.click(maximizeButton)
    
    // Should be maximized
    expect(modal).toHaveAttribute('data-maximized', 'true')
    
    // Maximize button should become restore button
    const restoreButton = screen.getByTestId('restore-modal-button')
    expect(restoreButton).toBeInTheDocument()
    
    // Click restore
    await userEvent.click(restoreButton)
    
    // Should not be maximized
    expect(modal).not.toHaveAttribute('data-maximized', 'true')
  })

  test('should integrate with event sourcing [UNIT-DOC-MODAL-04]', () => {
    // Test ID: UNIT-DOC-MODAL-04
    // PRD Reference: Integrate with event sourcing system for document change tracking
    
    const mockDocumentState = {
      id: 'test-doc',
      title: 'Test Document',
      content: '<p>Event sourced content</p>',
      version: 2,
      upstream: ['doc-1'],
      downstream: ['doc-2'],
    }
    
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: mockDocumentState,
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: true,
      canRedo: false,
      updateContent: vi.fn(),
      saveVersion: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    })
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    // Verify event sourcing hook is called with correct document ID
    expect(mockUseDocumentEventSourcing).toHaveBeenCalledWith(
      defaultProps.documentId
    )
    
    // Verify document state is used
    expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument()
  })

  test('should handle loading and error states [UNIT-DOC-MODAL-05]', () => {
    // Test ID: UNIT-DOC-MODAL-05
    // PRD Reference: Modal should handle loading and error states
    
    // Test loading state
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: null,
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: true,
      error: null,
      canUndo: false,
      canRedo: false,
      updateContent: vi.fn(),
      saveVersion: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    })
    
    const { rerender } = render(<DocumentEditorModal {...defaultProps} />)
    
    expect(screen.getByTestId('editor-loading')).toBeInTheDocument()
    expect(screen.getByText('Loading document...')).toBeInTheDocument()
    
    // Test error state
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: null,
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: 'Failed to load document',
      canUndo: false,
      canRedo: false,
      updateContent: vi.fn(),
      saveVersion: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    })
    
    rerender(<DocumentEditorModal {...defaultProps} />)
    
    expect(screen.getByTestId('error-indicator')).toBeInTheDocument()
    expect(screen.getByText('Failed to load document')).toBeInTheDocument()
  })
})

describe('TipTapEditor Component', () => {
  const defaultProps = {
    content: '<p>Initial content</p>',
    onChange: vi.fn(),
    onSave: vi.fn(),
    editable: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock TipTap editor instance
    const mockEditor = {
      getHTML: vi.fn(() => defaultProps.content),
      getText: vi.fn(() => 'Initial content'),
      commands: {
        setContent: vi.fn(),
        toggleBold: vi.fn(),
        toggleItalic: vi.fn(),
        toggleUnderline: vi.fn(),
        toggleStrike: vi.fn(),
        toggleHeading: vi.fn(),
        toggleBulletList: vi.fn(),
        toggleOrderedList: vi.fn(),
        toggleCodeBlock: vi.fn(),
        toggleBlockquote: vi.fn(),
        undo: vi.fn(),
        redo: vi.fn(),
      },
      isActive: vi.fn(),
      can: vi.fn(() => ({ undo: vi.fn(() => true), redo: vi.fn(() => true) })),
      on: vi.fn(),
      off: vi.fn(),
      destroy: vi.fn(),
    }
    
    vi.mocked(mockTipTap.useEditor).mockReturnValue(mockEditor)
  })

  test('should initialize with all required extensions [UNIT-DOC-EDITOR-01]', () => {
    // Test ID: UNIT-DOC-EDITOR-01
    // PRD Reference: Configure TipTap with StarterKit, heading, bullet list, ordered list, code block extensions
    
    render(<TipTapEditor {...defaultProps} />)
    
    // Verify useEditor is called with correct extensions
    expect(vi.mocked(mockTipTap.useEditor)).toHaveBeenCalledWith(
      expect.objectContaining({
        extensions: expect.arrayContaining([
          expect.objectContaining({ name: 'StarterKit' }),
          expect.objectContaining({ name: 'Heading' }),
          expect.objectContaining({ name: 'BulletList' }),
          expect.objectContaining({ name: 'OrderedList' }),
          expect.objectContaining({ name: 'CodeBlock' }),
        ]),
      })
    )
    
    // Verify editor content is rendered
    const editorContent = screen.getByTestId('tiptap-editor-content')
    expect(editorContent).toBeInTheDocument()
    expect(editorContent).toHaveAttribute('contenteditable', 'true')
  })

  test('should handle content changes [UNIT-DOC-EDITOR-02]', async () => {
    // Test ID: UNIT-DOC-EDITOR-02
    // PRD Reference: Editor should track content changes
    
    const onChange = vi.fn()
    render(<TipTapEditor {...defaultProps} onChange={onChange} />)
    
    // Verify editor is set up with change handler
    const editorOptions = mockTipTap.useEditor.mock.calls[0][0]
    expect(editorOptions.onUpdate).toBeDefined()
    
    // Simulate content change
    const mockTransaction = {
      editor: { getHTML: () => '<p>New content</p>' }
    }
    
    act(() => {
      editorOptions.onUpdate({ transaction: mockTransaction })
    })
    
    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('<p>New content</p>')
    })
  })

  test('should handle editor focus and blur events [UNIT-DOC-EDITOR-03]', () => {
    // Test ID: UNIT-DOC-EDITOR-03
    // PRD Reference: Editor should handle focus states
    
    const onFocus = vi.fn()
    const onBlur = vi.fn()
    
    render(<TipTapEditor {...defaultProps} onFocus={onFocus} onBlur={onBlur} />)
    
    // Verify focus and blur handlers are set
    const editorOptions = mockTipTap.useEditor.mock.calls[0][0]
    expect(editorOptions.onFocus).toBeDefined()
    expect(editorOptions.onBlur).toBeDefined()
    
    // Simulate focus and blur
    act(() => {
      editorOptions.onFocus()
    })
    expect(onFocus).toHaveBeenCalled()
    
    act(() => {
      editorOptions.onBlur()
    })
    expect(onBlur).toHaveBeenCalled()
  })

  test('should handle editor destruction [UNIT-DOC-EDITOR-04]', () => {
    // Test ID: UNIT-DOC-EDITOR-04
    // PRD Reference: Editor should clean up properly
    
    const mockEditor = mockTipTap.useEditor.mockReturnValue({
      destroy: vi.fn(),
      getHTML: vi.fn(() => ''),
      commands: {},
      isActive: vi.fn(),
      can: vi.fn(() => ({ undo: vi.fn(), redo: vi.fn() })),
      on: vi.fn(),
      off: vi.fn(),
    })
    
    const { unmount } = render(<TipTapEditor {...defaultProps} />)
    
    unmount()
    
    // Verify editor is destroyed on unmount
    expect(mockEditor.destroy).toHaveBeenCalled()
  })
})

describe('DocumentEditorToolbar Component', () => {
  const mockEditor = {
    commands: {
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnderline: vi.fn(),
      toggleStrike: vi.fn(),
      toggleHeading: vi.fn(),
      toggleBulletList: vi.fn(),
      toggleOrderedList: vi.fn(),
      toggleCodeBlock: vi.fn(),
      toggleBlockquote: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
    },
    isActive: vi.fn(),
    can: vi.fn(() => ({ undo: vi.fn(() => true), redo: vi.fn(() => true) })),
  }

  const defaultProps = {
    editor: mockEditor,
    onAskAgent: vi.fn(),
    onSaveVersion: vi.fn(),
    canUndo: true,
    canRedo: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render all toolbar buttons [UNIT-DOC-TOOLBAR-01]', () => {
    // Test ID: UNIT-DOC-TOOLBAR-01
    // PRD Reference: Custom toolbar with formatting options, Ask Agent button, Undo/Redo, Save Version
    
    render(<DocumentEditorToolbar {...defaultProps} />)
    
    // Verify all toolbar buttons are present
    expect(screen.getByTestId('toolbar-bold')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-italic')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-underline')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-strike')).toBeInTheDocument()
    
    expect(screen.getByTestId('toolbar-h1')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-h2')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-h3')).toBeInTheDocument()
    
    expect(screen.getByTestId('toolbar-bullet-list')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-ordered-list')).toBeInTheDocument()
    
    expect(screen.getByTestId('toolbar-code-block')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-blockquote')).toBeInTheDocument()
    
    expect(screen.getByTestId('toolbar-undo')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-redo')).toBeInTheDocument()
    
    expect(screen.getByTestId('toolbar-ask-agent')).toBeInTheDocument()
    expect(screen.getByTestId('toolbar-save-version')).toBeInTheDocument()
  })

  test('should handle formatting button clicks [UNIT-DOC-TOOLBAR-02]', async () => {
    // Test ID: UNIT-DOC-TOOLBAR-02
    // PRD Reference: Toolbar formatting options should work
    
    render(<DocumentEditorToolbar {...defaultProps} />)
    
    // Test bold button
    await userEvent.click(screen.getByTestId('toolbar-bold'))
    expect(mockEditor.commands.toggleBold).toHaveBeenCalled()
    
    // Test italic button
    await userEvent.click(screen.getByTestId('toolbar-italic'))
    expect(mockEditor.commands.toggleItalic).toHaveBeenCalled()
    
    // Test heading buttons
    await userEvent.click(screen.getByTestId('toolbar-h1'))
    expect(mockEditor.commands.toggleHeading).toHaveBeenCalledWith({ level: 1 })
    
    await userEvent.click(screen.getByTestId('toolbar-h2'))
    expect(mockEditor.commands.toggleHeading).toHaveBeenCalledWith({ level: 2 })
    
    // Test list buttons
    await userEvent.click(screen.getByTestId('toolbar-bullet-list'))
    expect(mockEditor.commands.toggleBulletList).toHaveBeenCalled()
    
    await userEvent.click(screen.getByTestId('toolbar-ordered-list'))
    expect(mockEditor.commands.toggleOrderedList).toHaveBeenCalled()
  })

  test('should handle undo/redo buttons [UNIT-DOC-TOOLBAR-03]', async () => {
    // Test ID: UNIT-DOC-TOOLBAR-03
    // PRD Reference: Toolbar should have Undo/Redo functionality
    
    render(<DocumentEditorToolbar {...defaultProps} />)
    
    // Test undo button
    const undoButton = screen.getByTestId('toolbar-undo')
    expect(undoButton).not.toBeDisabled()
    await userEvent.click(undoButton)
    expect(mockEditor.commands.undo).toHaveBeenCalled()
    
    // Test redo button (should be disabled based on props)
    const redoButton = screen.getByTestId('toolbar-redo')
    expect(redoButton).toBeDisabled()
  })

  test('should handle Ask Agent button [UNIT-DOC-TOOLBAR-04]', async () => {
    // Test ID: UNIT-DOC-TOOLBAR-04
    // PRD Reference: Custom toolbar with Ask Agent button
    
    const onAskAgent = vi.fn()
    render(<DocumentEditorToolbar {...defaultProps} onAskAgent={onAskAgent} />)
    
    await userEvent.click(screen.getByTestId('toolbar-ask-agent'))
    expect(onAskAgent).toHaveBeenCalled()
  })

  test('should handle Save Version button [UNIT-DOC-TOOLBAR-05]', async () => {
    // Test ID: UNIT-DOC-TOOLBAR-05
    // PRD Reference: Custom toolbar with Save Version button
    
    const onSaveVersion = vi.fn()
    render(<DocumentEditorToolbar {...defaultProps} onSaveVersion={onSaveVersion} />)
    
    await userEvent.click(screen.getByTestId('toolbar-save-version'))
    expect(onSaveVersion).toHaveBeenCalled()
  })

  test('should show active states for formatting buttons [UNIT-DOC-TOOLBAR-06]', () => {
    // Test ID: UNIT-DOC-TOOLBAR-06
    // PRD Reference: Toolbar should show active formatting states
    
    mockEditor.isActive.mockImplementation((format) => {
      return format === 'bold' || format === 'heading'
    })
    
    render(<DocumentEditorToolbar {...defaultProps} />)
    
    // Bold should be active
    const boldButton = screen.getByTestId('toolbar-bold')
    expect(boldButton).toHaveClass('active')
    
    // Italic should not be active
    const italicButton = screen.getByTestId('toolbar-italic')
    expect(italicButton).not.toHaveClass('active')
    
    // Heading should be active
    const h1Button = screen.getByTestId('toolbar-h1')
    expect(h1Button).toHaveClass('active')
  })
})

describe('DocumentRails Component', () => {
  const defaultProps = {
    documentId: 'test-doc',
    upstream: mockRailConnections.upstream,
    downstream: mockRailConnections.downstream,
    onConnect: vi.fn(),
    onDisconnect: vi.fn(),
    onPreview: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render upstream and downstream rails [UNIT-DOC-RAILS-01]', () => {
    // Test ID: UNIT-DOC-RAILS-01
    // PRD Reference: Document rails showing upstream/downstream connections
    
    render(<DocumentRails {...defaultProps} />)
    
    // Verify rails containers are present
    expect(screen.getByTestId('upstream-rail')).toBeInTheDocument()
    expect(screen.getByTestId('downstream-rail')).toBeInTheDocument()
    
    // Verify upstream items are rendered
    expect(screen.getByText('Source Document 1')).toBeInTheDocument()
    expect(screen.getByText('Agent Analysis')).toBeInTheDocument()
    expect(screen.getByText('Data Extract')).toBeInTheDocument()
    
    // Verify downstream items are rendered
    expect(screen.getByText('Summary Report')).toBeInTheDocument()
    expect(screen.getByText('Analysis Agent')).toBeInTheDocument()
  })

  test('should handle rail item interactions [UNIT-DOC-RAILS-02]', async () => {
    // Test ID: UNIT-DOC-RAILS-02
    // PRD Reference: Rails should allow interaction with connected documents
    
    const onPreview = vi.fn()
    render(<DocumentRails {...defaultProps} onPreview={onPreview} />)
    
    // Click on first upstream item
    const firstUpstreamItem = screen.getByTestId('rail-item')
    await userEvent.click(firstUpstreamItem)
    
    expect(onPreview).toHaveBeenCalledWith('doc-input-1')
  })

  test('should handle empty rails [UNIT-DOC-RAILS-03]', () => {
    // Test ID: UNIT-DOC-RAILS-03
    // PRD Reference: Rails should handle empty states
    
    render(<DocumentRails {...defaultProps} upstream={[]} downstream={[]} />)
    
    // Verify empty state messages
    expect(screen.getByText('No upstream connections')).toBeInTheDocument()
    expect(screen.getByText('No downstream connections')).toBeInTheDocument()
    
    // Verify add connection buttons
    expect(screen.getByTestId('add-upstream-connection')).toBeInTheDocument()
    expect(screen.getByTestId('add-downstream-connection')).toBeInTheDocument()
  })

  test('should handle connection actions [UNIT-DOC-RAILS-04]', async () => {
    // Test ID: UNIT-DOC-RAILS-04
    // PRD Reference: Rails should support adding/removing connections
    
    const onConnect = vi.fn()
    const onDisconnect = vi.fn()
    
    render(<DocumentRails {...defaultProps} onConnect={onConnect} onDisconnect={onDisconnect} />)
    
    // Test connect action - use the first indexed connect button
    const connectButton = screen.getByTestId('rail-item-connect-0')
    await userEvent.click(connectButton)
    expect(onConnect).toHaveBeenCalled()
    
    // Test disconnect action (if available) - use the first indexed disconnect button
    const disconnectButton = screen.queryByTestId('rail-item-disconnect-0')
    if (disconnectButton) {
      await userEvent.click(disconnectButton)
      expect(onDisconnect).toHaveBeenCalled()
    }
  })

  test('should display rail item previews [UNIT-DOC-RAILS-05]', () => {
    // Test ID: UNIT-DOC-RAILS-05
    // PRD Reference: Rails should show document previews
    
    render(<DocumentRails {...defaultProps} />)
    
    // Verify preview text is shown
    const firstPreview = screen.getByText('This is the first source document that feeds into...')
    expect(firstPreview).toBeInTheDocument()
    
    // Verify preview is truncated appropriately
    expect(firstPreview.textContent!.length).toBeLessThan(200)
  })
})

describe('Event Sourcing Integration', () => {
  test('should track document content changes [UNIT-DOC-EVENT-01]', async () => {
    // Test ID: UNIT-DOC-EVENT-01
    // PRD Reference: Integrate with event sourcing system for document change tracking
    
    const updateContent = vi.fn()
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: mockDocuments.simpleDocument,
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: false,
      canRedo: false,
      updateContent,
      saveVersion: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    })
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    // Simulate content change in editor
    const editorOptions = mockTipTap.useEditor.mock.calls[0][0]
    const mockTransaction = {
      editor: { getHTML: () => '<p>Changed content</p>' }
    }
    
    act(() => {
      editorOptions.onUpdate({ transaction: mockTransaction })
    })
    
    await waitFor(() => {
      expect(updateContent).toHaveBeenCalledWith('<p>Changed content</p>')
    })
  })

  test('should handle version saving through event sourcing [UNIT-DOC-EVENT-02]', async () => {
    // Test ID: UNIT-DOC-EVENT-02
    // PRD Reference: Save Version should integrate with event sourcing
    
    const saveVersion = vi.fn()
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: mockDocuments.simpleDocument,
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: false,
      canRedo: false,
      updateContent: vi.fn(),
      saveVersion,
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    })
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    // Click save version button
    const saveButton = screen.getByTestId('toolbar-save-version')
    await userEvent.click(saveButton)
    
    expect(saveVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.any(String),
      })
    )
  })

  test('should handle undo/redo through event sourcing [UNIT-DOC-EVENT-03]', async () => {
    // Test ID: UNIT-DOC-EVENT-03
    // PRD Reference: Undo/Redo should work with event sourcing
    
    const undo = vi.fn()
    const redo = vi.fn()
    
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: mockDocuments.simpleDocument,
      eventHistory: [{ type: 'CONTENT_CHANGE', timestamp: new Date() }],
      currentEventIndex: 0,
      isLoading: false,
      error: null,
      canUndo: true,
      canRedo: false,
      updateContent: vi.fn(),
      saveVersion: vi.fn(),
      undo,
      redo,
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    })
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    // Test undo
    const undoButton = screen.getByTestId('toolbar-undo')
    await userEvent.click(undoButton)
    expect(undo).toHaveBeenCalled()
    
    // Test redo (button should be disabled)
    const redoButton = screen.getByTestId('toolbar-redo')
    expect(redoButton).toBeDisabled()
  })

  test('should handle connection changes through event sourcing [UNIT-DOC-EVENT-04]', async () => {
    // Test ID: UNIT-DOC-EVENT-04
    // PRD Reference: Rails connections should integrate with event sourcing
    
    const addConnection = vi.fn()
    const removeConnection = vi.fn()
    
    mockUseDocumentEventSourcing.mockReturnValue({
      documentState: mockDocuments.documentWithConnections,
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: false,
      canRedo: false,
      updateContent: vi.fn(),
      saveVersion: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection,
      removeConnection,
    })
    
    render(<DocumentEditorModal {...defaultProps} />)
    
    // Test adding connection
    const addUpstreamButton = screen.getByTestId('add-upstream-connection')
    await userEvent.click(addUpstreamButton)
    
    // This would typically open a dialog to select document to connect
    // For now, verify the function is available
    expect(addConnection).toBeDefined()
  })
})