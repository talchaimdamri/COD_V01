import React, { useState, useCallback, useEffect } from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { DOCUMENT_EDITOR_CONFIG } from '../../../tests/fixtures/document-editor'
import { useDocumentEventSourcing } from '../../lib/eventSourcing'
import DocumentEditorToolbar from './DocumentEditorToolbar'
import DocumentRails from './DocumentRails'
import TipTapEditor from './TipTapEditor'

// Props interface for DocumentEditorModal
export interface DocumentEditorModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  initialContent?: string
  onSave?: (content: string) => void
}

// Main DocumentEditorModal component
const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  isOpen,
  onClose,
  documentId,
  initialContent = '',
  onSave,
}) => {
  const [isMaximized, setIsMaximized] = useState(false)
  
  // Use document event sourcing
  const {
    documentState,
    isLoading,
    error,
    canUndo,
    canRedo,
    updateContent,
    saveVersion,
    undo,
    redo,
    addConnection,
    removeConnection,
  } = useDocumentEventSourcing(documentId)

  const [documentTitle, setDocumentTitle] = useState(documentState?.title || 'New Document')
  
  // Update title when document state changes
  useEffect(() => {
    if (documentState?.title) {
      setDocumentTitle(documentState.title)
    }
  }, [documentState?.title])

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle maximize/restore functionality
  const handleMaximize = useCallback(() => {
    setIsMaximized(true)
  }, [])

  const handleRestore = useCallback(() => {
    setIsMaximized(false)
  }, [])

  // Handle modal close
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Handle overlay click to close
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose()
    }
  }, [handleClose])

  if (!isOpen) {
    return null
  }

  return (
    <div 
      data-testid="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="document-editor-modal"
        data-maximized={isMaximized}
        className={`
          bg-white rounded-lg shadow-xl flex flex-col transition-all duration-300
          ${isMaximized 
            ? 'w-full h-full rounded-none' 
            : `w-[${DOCUMENT_EDITOR_CONFIG.modal.width}] max-w-[${DOCUMENT_EDITOR_CONFIG.modal.maxWidth}] min-w-[${DOCUMENT_EDITOR_CONFIG.modal.minWidth}] h-[${DOCUMENT_EDITOR_CONFIG.modal.height}] max-h-[${DOCUMENT_EDITOR_CONFIG.modal.maxHeight}] min-h-[${DOCUMENT_EDITOR_CONFIG.modal.minHeight}]`
          }
        `}
        style={{
          width: isMaximized ? '100vw' : DOCUMENT_EDITOR_CONFIG.modal.width,
          height: isMaximized ? '100vh' : DOCUMENT_EDITOR_CONFIG.modal.height,
          minWidth: isMaximized ? 'unset' : DOCUMENT_EDITOR_CONFIG.modal.minWidth,
          maxWidth: isMaximized ? 'unset' : DOCUMENT_EDITOR_CONFIG.modal.maxWidth,
          minHeight: isMaximized ? 'unset' : DOCUMENT_EDITOR_CONFIG.modal.minHeight,
          maxHeight: isMaximized ? 'unset' : DOCUMENT_EDITOR_CONFIG.modal.maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header 
          data-testid="modal-header"
          className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-purple-300 rounded px-2 py-1 transition-all"
              placeholder="Document Title"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Maximize/Restore Button */}
            {isMaximized ? (
              <button
                data-testid="restore-modal-button"
                onClick={handleRestore}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Restore modal size"
              >
                <Minimize2 size={16} />
              </button>
            ) : (
              <button
                data-testid="maximize-modal-button"
                onClick={handleMaximize}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                aria-label="Maximize modal"
              >
                <Maximize2 size={16} />
              </button>
            )}
            
            {/* Close Button */}
            <button
              data-testid="close-modal-button"
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Modal Body */}
        <div 
          data-testid="modal-body"
          className="flex-1 flex overflow-hidden"
        >
          {isLoading ? (
            <div data-testid="editor-loading" className="flex-1 flex items-center justify-center">
              <div className="text-gray-500">Loading document...</div>
            </div>
          ) : error ? (
            <div data-testid="error-indicator" className="flex-1 flex items-center justify-center bg-red-50 border border-red-200 text-red-700 p-4 m-4 rounded">
              <div className="text-sm">{error}</div>
            </div>
          ) : (
            <>
              {/* Document Rails */}
              <DocumentRails
                documentId={documentId}
                upstream={documentState?.upstream?.map(id => ({
                  id,
                  title: `Document ${id}`,
                  type: 'document' as const,
                  preview: 'Preview content...',
                  lastModified: new Date(),
                })) || []}
                downstream={documentState?.downstream?.map(id => ({
                  id,
                  title: `Document ${id}`,
                  type: 'document' as const,
                  preview: 'Preview content...',
                  lastModified: new Date(),
                })) || []}
                onConnect={addConnection}
                onDisconnect={removeConnection}
                onPreview={(connectionId) => console.log('Preview:', connectionId)}
              />

              {/* Main Content Area */}
              <div 
                data-testid="modal-content"
                className="flex-1 flex flex-col"
                style={{
                  width: isMaximized ? '100%' : DOCUMENT_EDITOR_CONFIG.modal.width,
                  minWidth: DOCUMENT_EDITOR_CONFIG.modal.minWidth,
                }}
              >
                {/* Toolbar */}
                <DocumentEditorToolbar
                  editor={null as any} // Will be set properly when TipTap editor is integrated
                  onAskAgent={() => console.log('Ask Agent clicked')}
                  onSaveVersion={() => saveVersion({ description: 'Manual save' })}
                  canUndo={canUndo}
                  canRedo={canRedo}
                />

                {/* Editor Container */}
                <div 
                  className="flex-1 overflow-auto relative"
                >
                  {/* TipTap Editor */}
                  <TipTapEditor
                    content={documentState?.content || initialContent}
                    onChange={updateContent}
                    onSave={onSave ? () => onSave(documentState?.content || '') : undefined}
                    placeholder="Start writing your document..."
                    className="h-full"
                  />

                  {/* Status Indicators */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs">
                    <div data-testid="saving-indicator" className="hidden text-orange-600">
                      Saving...
                    </div>
                    <div data-testid="saved-indicator" className="text-green-600">
                      Saved
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <footer 
          data-testid="modal-footer"
          className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Document ID: {documentId}
            </div>
            <div className="text-xs text-gray-500">
              Version 1 • Last saved: Never
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default DocumentEditorModal