/**
 * Simplified TipTap Document Editor Modal Unit Tests
 * Test ID: UNIT-DOC-EDITOR-MODAL-SIMPLE
 * 
 * Basic tests for the DocumentEditorModal component structure.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, vi, beforeEach } from 'vitest'

// Import component
import DocumentEditorModal from '../../../src/components/modals/DocumentEditorModal'

// Mock all dependencies
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

vi.mock('../../../src/components/modals/DocumentEditorToolbar', () => ({
  default: ({ onAskAgent, onSaveVersion, canUndo, canRedo }: any) => (
    <div data-testid="editor-toolbar">
      <button data-testid="toolbar-bold">B</button>
      <button data-testid="toolbar-italic">I</button>
      <button data-testid="toolbar-undo" disabled={!canUndo}>Undo</button>
      <button data-testid="toolbar-redo" disabled={!canRedo}>Redo</button>
      <button data-testid="toolbar-ask-agent" onClick={onAskAgent}>Ask Agent</button>
      <button data-testid="toolbar-save-version" onClick={onSaveVersion}>Save Version</button>
    </div>
  ),
}))

vi.mock('../../../src/components/modals/DocumentRails', () => ({
  default: ({ upstream, downstream, onConnect, onPreview }: any) => (
    <div>
      <div data-testid="upstream-rail">
        {upstream.length === 0 ? (
          <div>
            <div>No upstream connections</div>
            <button data-testid="add-upstream-connection">+ Add connection</button>
          </div>
        ) : (
          upstream.map((item: any, index: number) => (
            <div key={item.id} data-testid={index === 0 ? "rail-item" : undefined}>
              <div data-testid="rail-item-title">{item.title}</div>
              <button data-testid="rail-item-connect" onClick={() => onConnect(item.id)}>Connect</button>
            </div>
          ))
        )}
      </div>
      <div data-testid="downstream-rail">
        {downstream.length === 0 ? (
          <div>
            <div>No downstream connections</div>
            <button data-testid="add-downstream-connection">+ Add connection</button>
          </div>
        ) : (
          downstream.map((item: any) => (
            <div key={item.id}>
              <div data-testid="rail-item-title">{item.title}</div>
            </div>
          ))
        )}
      </div>
    </div>
  ),
}))

vi.mock('../../../src/components/modals/TipTapEditor', () => ({
  default: ({ content, onChange }: any) => (
    <div data-testid="tiptap-editor-container">
      <div 
        data-testid="tiptap-editor-content" 
        className="ProseMirror"
        contentEditable="true"
        suppressContentEditableWarning={true}
        onInput={(e) => onChange && onChange(e.currentTarget.innerHTML)}
      >
        {content || 'Click here to start editing...'}
      </div>
    </div>
  ),
}))

describe('DocumentEditorModal Simple Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    documentId: 'test-doc',
    initialContent: '<p>Initial content</p>',
    onSave: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should render modal when open', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const modal = screen.getByTestId('document-editor-modal')
    expect(modal).toBeInTheDocument()
  })

  test('should not render modal when closed', () => {
    render(<DocumentEditorModal {...defaultProps} isOpen={false} />)
    
    const modal = screen.queryByTestId('document-editor-modal')
    expect(modal).not.toBeInTheDocument()
  })

  test('should render modal header with close button', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const header = screen.getByTestId('modal-header')
    expect(header).toBeInTheDocument()
    
    const closeButton = screen.getByTestId('close-modal-button')
    expect(closeButton).toBeInTheDocument()
  })

  test('should render modal body with main components', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const body = screen.getByTestId('modal-body')
    expect(body).toBeInTheDocument()
    
    const content = screen.getByTestId('modal-content')
    expect(content).toBeInTheDocument()
    
    const toolbar = screen.getByTestId('editor-toolbar')
    expect(toolbar).toBeInTheDocument()
    
    const editorContainer = screen.getByTestId('tiptap-editor-container')
    expect(editorContainer).toBeInTheDocument()
  })

  test('should render rails components', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const upstreamRail = screen.getByTestId('upstream-rail')
    expect(upstreamRail).toBeInTheDocument()
    
    const downstreamRail = screen.getByTestId('downstream-rail')
    expect(downstreamRail).toBeInTheDocument()
  })

  test('should render modal footer', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const footer = screen.getByTestId('modal-footer')
    expect(footer).toBeInTheDocument()
  })

  test('should call onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<DocumentEditorModal {...defaultProps} onClose={onClose} />)
    
    const closeButton = screen.getByTestId('close-modal-button')
    await userEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('should handle maximize button', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const maximizeButton = screen.getByTestId('maximize-modal-button')
    expect(maximizeButton).toBeInTheDocument()
  })

  test('should render TipTap editor content area', () => {
    render(<DocumentEditorModal {...defaultProps} />)
    
    const editorContent = screen.getByTestId('tiptap-editor-content')
    expect(editorContent).toBeInTheDocument()
    expect(editorContent).toHaveAttribute('contenteditable', 'true')
  })

  test('should show loading state', () => {
    // Mock loading state
    vi.mocked(require('../../../src/lib/eventSourcing').useDocumentEventSourcing).mockReturnValueOnce({
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

    render(<DocumentEditorModal {...defaultProps} />)
    
    const loadingIndicator = screen.getByTestId('editor-loading')
    expect(loadingIndicator).toBeInTheDocument()
    expect(screen.getByText('Loading document...')).toBeInTheDocument()
  })

  test('should show error state', () => {
    // Mock error state
    vi.mocked(require('../../../src/lib/eventSourcing').useDocumentEventSourcing).mockReturnValueOnce({
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

    render(<DocumentEditorModal {...defaultProps} />)
    
    const errorIndicator = screen.getByTestId('error-indicator')
    expect(errorIndicator).toBeInTheDocument()
    expect(screen.getByText('Failed to load document')).toBeInTheDocument()
  })
})