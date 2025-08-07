import React, { useState, useCallback, useEffect } from 'react'
import { X, Maximize2, Minimize2, History } from 'lucide-react'
import { DOCUMENT_EDITOR_CONFIG } from '../../../tests/fixtures/document-editor'
import { useDocumentEventSourcing } from '../../lib/eventSourcing'
import useVersionManagement from '../../hooks/useVersionManagement'
import DocumentEditorToolbar from './DocumentEditorToolbar'
import DocumentRails from './DocumentRails'
import TipTapEditor from './TipTapEditor'
import VersionHistoryPanel from './VersionHistoryPanel'
import VersionDiff from './VersionDiff'
import VersionControls from './VersionControls'

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
  const [editor, setEditor] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isAskAgentLoading, setIsAskAgentLoading] = useState(false)
  
  // Version history state
  const [isVersionHistoryVisible, setIsVersionHistoryVisible] = useState(false)
  const [isDiffViewerVisible, setIsDiffViewerVisible] = useState(false)
  const [diffVersionIds, setDiffVersionIds] = useState<{ source: string; target: string } | null>(null)
  const [showRestoreConfirmation, setShowRestoreConfirmation] = useState<{ versionId: string; versionNumber: number } | null>(null)
  
  // Use document event sourcing with version management integration
  const {
    documentState,
    eventHistory,
    isLoading,
    error,
    canUndo,
    canRedo,
    lastVersionSync,
    pendingVersionSnapshot,
    versionRestoreInProgress,
    updateContent,
    updateTitle,
    saveVersion,
    undo,
    redo,
    addConnection,
    removeConnection,
    restoreToVersion,
    createVersionSnapshot,
    syncWithVersions,
  } = useDocumentEventSourcing(documentId)
  
  // Version management hook with integration
  const {
    versions,
    currentVersion,
    isLoading: versionsLoading,
    error: versionsError,
    loadVersions,
    createSnapshot,
    restoreVersion: restoreVersionApi,
    deleteVersion,
    compareVersions,
    clearError: clearVersionsError,
  } = useVersionManagement({
    documentId,
    onVersionRestored: async (version) => {
      console.log('Version restored via API:', version)
      // Use event sourcing to restore version content
      await restoreToVersion(version)
    },
    onVersionDeleted: (versionId) => {
      console.log('Version deleted:', versionId)
      // Sync with updated version list
      syncWithVersions(versions.filter(v => v.id !== versionId))
    },
    onError: (error) => {
      console.error('Version management error:', error)
    },
  })

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

  // Enhanced Ask Agent functionality
  const handleAskAgent = useCallback(async () => {
    if (!editor) return
    
    setIsAskAgentLoading(true)
    try {
      // Get current selection or entire document content
      const selectedText = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
        ' '
      )
      const contextText = selectedText || editor.getText()
      
      console.log('Ask Agent requested with context:', contextText.substring(0, 100) + '...')
      
      // TODO: Implement actual AI agent integration
      // For now, show a placeholder response
      setTimeout(() => {
        // Simulate AI response - in production this would call an actual AI service
        const suggestion = '// AI Agent suggestion would appear here based on the selected content'
        
        // Insert suggestion at current cursor position
        if (selectedText) {
          editor.chain().focus().insertContent(`\n\n**AI Suggestion:**\n${suggestion}\n\n`).run()
        } else {
          editor.chain().focus().insertContent(`\n\n**AI Analysis:**\n${suggestion}\n\n`).run()
        }
        
        setIsAskAgentLoading(false)
      }, 2000)
      
    } catch (error) {
      console.error('Ask Agent error:', error)
      setIsAskAgentLoading(false)
    }
  }, [editor])

  // Enhanced Save Version functionality with integration
  const handleSaveVersion = useCallback(async () => {
    setIsSaving(true)
    try {
      const description = `Manual save - ${new Date().toLocaleString()}`
      
      // Save version through event sourcing
      await saveVersion({ description })
      
      // Create a snapshot in the version system
      const newVersion = await createSnapshot(description)
      
      // Sync with version management
      if (newVersion) {
        syncWithVersions([newVersion, ...versions])
      }
      
      // Call the onSave prop if provided
      if (onSave && documentState?.content) {
        onSave(documentState.content)
      }
      
      console.log('Version saved and synced successfully')
    } catch (error) {
      console.error('Save version error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [saveVersion, createSnapshot, syncWithVersions, versions, onSave, documentState?.content])

  // Handle document events from TipTap
  const handleDocumentEvent = useCallback(async (event: any) => {
    console.log('Document event received:', event.type, event.payload)
    // Events are handled automatically by the event sourcing system
    // This is just for debugging/monitoring
  }, [])

  // Handle title changes with event sourcing
  const handleTitleChange = useCallback(async (newTitle: string) => {
    if (newTitle !== documentTitle) {
      setDocumentTitle(newTitle)
      await updateTitle(newTitle)
    }
  }, [documentTitle, updateTitle])

  // Handle editor ready callback
  const handleEditorReady = useCallback((editorInstance: any) => {
    setEditor(editorInstance)
  }, [])
  
  // Version history handlers with sync
  const handleShowVersionHistory = useCallback(async () => {
    setIsVersionHistoryVisible(true)
    await loadVersions({ page: 1, reset: true })
    // Sync versions with event sourcing after loading
    if (versions.length > 0) {
      syncWithVersions(versions)
    }
  }, [loadVersions, versions, syncWithVersions])
  
  const handleHideVersionHistory = useCallback(() => {
    setIsVersionHistoryVisible(false)
  }, [])
  
  const handleCompareVersions = useCallback(async (fromVersionId: string, toVersionId: string) => {
    setDiffVersionIds({ source: fromVersionId, target: toVersionId })
    setIsDiffViewerVisible(true)
  }, [])
  
  const handleCloseDiffViewer = useCallback(() => {
    setIsDiffViewerVisible(false)
    setDiffVersionIds(null)
  }, [])
  
  const handleRestoreVersion = useCallback((versionId: string, versionNumber: number) => {
    setShowRestoreConfirmation({ versionId, versionNumber })
  }, [])
  
  const handleConfirmRestore = useCallback(async () => {
    if (!showRestoreConfirmation) return
    
    try {
      // Use API restore which will trigger event sourcing integration
      const success = await restoreVersionApi(
        showRestoreConfirmation.versionId,
        `Restored to version ${showRestoreConfirmation.versionNumber}`
      )
      
      if (success) {
        // Reload versions to get updated list
        await loadVersions({ page: 1, reset: true })
        setShowRestoreConfirmation(null)
        setIsVersionHistoryVisible(false)
      }
    } catch (error) {
      console.error('Version restore failed:', error)
    }
  }, [showRestoreConfirmation, restoreVersionApi, loadVersions])
  
  const handleCancelRestore = useCallback(() => {
    setShowRestoreConfirmation(null)
  }, [])
  
  const handleDeleteVersion = useCallback(async (versionId: string) => {
    if (window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      await deleteVersion(versionId)
    }
  }, [deleteVersion])

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
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-white focus:border focus:border-purple-300 rounded px-2 py-1 transition-all"
              placeholder="Document Title"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Version Controls */}
            <VersionControls
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              onSaveVersion={handleSaveVersion}
              onShowVersionHistory={handleShowVersionHistory}
              currentVersion={currentVersion?.versionNumber}
              totalVersions={versions.length}
              isSaving={isSaving}
              isHistoryVisible={isVersionHistoryVisible}
              className="mr-2"
            />
            
            {/* Version History Toggle */}
            <button
              data-testid="version-toggle"
              onClick={isVersionHistoryVisible ? handleHideVersionHistory : handleShowVersionHistory}
              className={`p-2 rounded-lg transition-colors ${
                isVersionHistoryVisible 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Toggle version history"
            >
              <History size={16} />
            </button>
            
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
          {/* Version History Panel */}
          {isVersionHistoryVisible && (
            <VersionHistoryPanel
              documentId={documentId}
              isVisible={isVersionHistoryVisible}
              onClose={handleHideVersionHistory}
              onRestoreVersion={handleRestoreVersion}
              onCompareVersions={handleCompareVersions}
              onDeleteVersion={handleDeleteVersion}
              className="w-80 flex-shrink-0"
            />
          )}
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
                upstream={documentState?.upstream?.map((id, index) => ({
                  id,
                  title: `${index === 0 ? 'Source Research Paper' : index === 1 ? 'Data Analysis Report' : 'Reference Document'} ${id.slice(-3)}`,
                  type: index % 2 === 0 ? 'document' as const : 'agent' as const,
                  preview: index === 0 
                    ? 'This research paper provides foundational insights into the methodology and theoretical framework that informs our analysis...' 
                    : index === 1 
                    ? 'Automated analysis results showing key patterns and statistical correlations found in the source data...'
                    : 'Supporting reference material with additional context and background information for comprehensive understanding...',
                  lastModified: new Date(Date.now() - (index + 1) * 86400000), // Days ago
                  metadata: {
                    author: index === 0 ? 'Dr. Sarah Chen' : index === 1 ? 'AI Analysis Bot' : 'Research Team',
                    wordCount: Math.floor(Math.random() * 5000) + 1000,
                    status: index % 3 === 0 ? 'published' : index % 3 === 1 ? 'draft' : 'archived',
                    tags: index === 0 ? ['research', 'methodology'] : index === 1 ? ['analysis', 'data'] : ['reference', 'context'],
                  },
                })) || []}
                downstream={documentState?.downstream?.map((id, index) => ({
                  id,
                  title: `${index === 0 ? 'Executive Summary' : index === 1 ? 'Technical Analysis' : 'Report Output'} ${id.slice(-3)}`,
                  type: index % 2 === 1 ? 'document' as const : 'agent' as const,
                  preview: index === 0 
                    ? 'Comprehensive executive summary synthesizing key findings and recommendations for stakeholder review...' 
                    : index === 1 
                    ? 'Detailed technical analysis breaking down methodologies, results, and implications of the research...'
                    : 'Generated report output containing processed information and actionable insights derived from source materials...',
                  lastModified: new Date(Date.now() + (index + 1) * 3600000), // Hours from now
                  metadata: {
                    author: index === 0 ? 'Content Generator' : index === 1 ? 'Technical Writer AI' : 'Report Builder',
                    wordCount: Math.floor(Math.random() * 3000) + 500,
                    status: index % 3 === 0 ? 'draft' : index % 3 === 1 ? 'published' : 'draft',
                    tags: index === 0 ? ['summary', 'executive'] : index === 1 ? ['technical', 'analysis'] : ['report', 'output'],
                  },
                })) || []}
                onConnect={(_docId, connectionId, type) => addConnection(connectionId, type)}
                onDisconnect={(_docId, connectionId, type) => removeConnection(connectionId, type)}
                onPreview={(connectionId) => console.log('Preview:', connectionId)}
                isLoading={isLoading}
                error={error}
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
                  editor={editor}
                  onAskAgent={handleAskAgent}
                  onSaveVersion={handleSaveVersion}
                  canUndo={canUndo}
                  canRedo={canRedo}
                  onUndo={undo}
                  onRedo={redo}
                  isSaving={isSaving}
                  isAskAgentLoading={isAskAgentLoading}
                />

                {/* Editor Container */}
                <div 
                  className="flex-1 overflow-auto relative"
                >
                  {/* TipTap Editor with Version Integration */}
                  <TipTapEditor
                    content={documentState?.content || initialContent}
                    onChange={updateContent}
                    onSave={handleSaveVersion}
                    onEditorReady={handleEditorReady}
                    placeholder="Start writing your document..."
                    className="h-full"
                    documentId={documentId}
                    onDocumentEvent={handleDocumentEvent}
                    enableEventSourcing={true}
                    isVersionRestoring={versionRestoreInProgress}
                    onVersionContentUpdate={(content) => {
                      console.log('Version content updated in editor:', content.substring(0, 100) + '...')
                    }}
                  />

                  {/* Status Indicators */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs">
                    {isSaving || pendingVersionSnapshot ? (
                      <div data-testid="saving-indicator" className="text-orange-600 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        {pendingVersionSnapshot ? 'Creating snapshot...' : 'Saving...'}
                      </div>
                    ) : versionRestoreInProgress ? (
                      <div data-testid="restoring-indicator" className="text-purple-600 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        Restoring version...
                      </div>
                    ) : (
                      <div data-testid="saved-indicator" className="text-green-600 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full" />
                        Saved {lastVersionSync && `(synced ${new Date(lastVersionSync).toLocaleTimeString()})`}
                      </div>
                    )}
                    
                    {isAskAgentLoading && (
                      <div data-testid="agent-indicator" className="text-purple-600 flex items-center gap-1">
                        <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        AI Agent working...
                      </div>
                    )}
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
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Version {currentVersion?.versionNumber || documentState?.version || 1}</span>
              <span>Events: {eventHistory.length}</span>
              <span>Words: {documentState?.content ? documentState.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length : 0}</span>
              <span>Last updated: {documentState?.updatedAt ? new Date(documentState.updatedAt).toLocaleTimeString() : 'Never'}</span>
              {versions.length > 0 && <span>Versions: {versions.length}</span>}
            </div>
          </div>
        </footer>
      </div>
      
      {/* Version Diff Viewer */}
      {isDiffViewerVisible && diffVersionIds && (
        <VersionDiff
          documentId={documentId}
          sourceVersionId={diffVersionIds.source}
          targetVersionId={diffVersionIds.target}
          isVisible={isDiffViewerVisible}
          onClose={handleCloseDiffViewer}
          onRestoreVersion={(versionId) => {
            const version = versions.find(v => v.id === versionId)
            if (version) {
              handleRestoreVersion(versionId, version.versionNumber)
            }
          }}
        />
      )}
      
      {/* Restore Confirmation Dialog */}
      {showRestoreConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
          <div 
            data-testid="restore-confirmation"
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Restore version {showRestoreConfirmation.versionNumber}?
            </h3>
            <p className="text-gray-600 mb-6">
              This will create a new version with the content from version {showRestoreConfirmation.versionNumber}. 
              Your current changes will be preserved in the version history.
            </p>
            <div className="flex justify-end gap-3">
              <button
                data-testid="cancel-restore"
                onClick={handleCancelRestore}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                data-testid="confirm-restore"
                onClick={handleConfirmRestore}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Restore Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentEditorModal