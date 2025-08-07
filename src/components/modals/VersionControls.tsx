import React, { useState, useEffect, useCallback } from 'react'
import { Undo, Redo, History, GitBranch, Save, Clock, Tag } from 'lucide-react'

export interface VersionControlsProps {
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onSaveVersion: () => void
  onShowVersionHistory: () => void
  onCreateBranch?: () => void
  onTagVersion?: () => void
  currentVersion?: number
  totalVersions?: number
  isSaving?: boolean
  isHistoryVisible?: boolean
  className?: string
}

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  description: string
}

const shortcuts: KeyboardShortcut[] = [
  { key: 'z', ctrlKey: true, description: 'Undo' },
  { key: 'y', ctrlKey: true, description: 'Redo' },
  { key: 's', ctrlKey: true, description: 'Save Version' },
  { key: 'h', ctrlKey: true, shiftKey: true, description: 'Version History' },
]

const VersionControls: React.FC<VersionControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveVersion,
  onShowVersionHistory,
  onCreateBranch,
  onTagVersion,
  currentVersion,
  totalVersions,
  isSaving = false,
  isHistoryVisible = false,
  className = '',
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [undoCount, setUndoCount] = useState(0)
  const [redoCount, setRedoCount] = useState(0)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts if no input is focused
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.contentEditable === 'true'
      
      if (isInputFocused) return

      const { key, ctrlKey, metaKey, shiftKey } = event
      const cmdOrCtrl = ctrlKey || metaKey

      switch (key.toLowerCase()) {
        case 'z':
          if (cmdOrCtrl && !shiftKey) {
            event.preventDefault()
            if (canUndo) {
              onUndo()
              setUndoCount(prev => prev + 1)
            }
          }
          break
        case 'y':
          if (cmdOrCtrl) {
            event.preventDefault()
            if (canRedo) {
              onRedo()
              setRedoCount(prev => prev + 1)
            }
          }
          break
        case 's':
          if (cmdOrCtrl) {
            event.preventDefault()
            onSaveVersion()
          }
          break
        case 'h':
          if (cmdOrCtrl && shiftKey) {
            event.preventDefault()
            onShowVersionHistory()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, onUndo, onRedo, onSaveVersion, onShowVersionHistory])

  // Reset counters when undo/redo availability changes
  useEffect(() => {
    if (!canUndo) setUndoCount(0)
    if (!canRedo) setRedoCount(0)
  }, [canUndo, canRedo])

  const ControlButton = ({ 
    testId, 
    onClick, 
    disabled, 
    icon: Icon, 
    label, 
    shortcut, 
    count,
    variant = 'default' 
  }: {
    testId: string
    onClick: () => void
    disabled?: boolean
    icon: React.ComponentType<any>
    label: string
    shortcut?: string
    count?: number
    variant?: 'default' | 'primary' | 'secondary'
  }) => {
    const getButtonClasses = () => {
      const baseClasses = 'relative p-2 rounded-lg transition-all duration-200 flex items-center gap-2 group'
      
      if (disabled) {
        return `${baseClasses} opacity-50 cursor-not-allowed text-gray-400`
      }
      
      switch (variant) {
        case 'primary':
          return `${baseClasses} bg-purple-600 text-white hover:bg-purple-700 shadow-sm hover:shadow`
        case 'secondary':
          return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow`
        default:
          return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-gray-900`
      }
    }

    return (
      <button
        data-testid={testId}
        onClick={onClick}
        disabled={disabled}
        className={getButtonClasses()}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
        aria-label={`${label}${count ? ` (${count} available)` : ''}`}
      >
        <Icon size={16} />
        
        {/* Count indicator */}
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
        
        {/* Keyboard shortcut tooltip */}
        {shortcut && (
          <div className="
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
            px-2 py-1 bg-gray-900 text-white text-xs rounded 
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            pointer-events-none whitespace-nowrap z-10
          ">
            {label}
            <div className="text-gray-300 text-[10px] mt-0.5">{shortcut}</div>
          </div>
        )}
      </button>
    )
  }

  const formatVersionInfo = () => {
    if (currentVersion && totalVersions) {
      return `v${currentVersion} of ${totalVersions}`
    }
    return currentVersion ? `v${currentVersion}` : 'Draft'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Undo/Redo Group */}
      <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border">
        <ControlButton
          testId="version-control-undo"
          onClick={onUndo}
          disabled={!canUndo}
          icon={Undo}
          label="Undo"
          shortcut="Ctrl+Z"
          count={canUndo ? undoCount || undefined : undefined}
        />
        
        <div className="border-l border-gray-300 h-6 mx-1" />
        
        <ControlButton
          testId="version-control-redo"
          onClick={onRedo}
          disabled={!canRedo}
          icon={Redo}
          label="Redo"
          shortcut="Ctrl+Y"
          count={canRedo ? redoCount || undefined : undefined}
        />
      </div>

      {/* Version Info Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border text-sm text-gray-600">
        <Clock size={14} />
        <span>{formatVersionInfo()}</span>
      </div>

      {/* Version Actions Group */}
      <div className="flex items-center gap-1">
        <ControlButton
          testId="version-control-save"
          onClick={onSaveVersion}
          disabled={isSaving}
          icon={isSaving ? () => (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : Save}
          label={isSaving ? "Saving..." : "Save Version"}
          shortcut="Ctrl+S"
          variant="secondary"
        />
        
        <ControlButton
          testId="version-control-history"
          onClick={onShowVersionHistory}
          disabled={false}
          icon={History}
          label="Version History"
          shortcut="Ctrl+Shift+H"
          variant={isHistoryVisible ? 'primary' : 'default'}
        />
      </div>

      {/* Advanced Version Controls */}
      {(onCreateBranch || onTagVersion) && (
        <>
          <div className="border-l border-gray-300 h-6 mx-2" />
          <div className="flex items-center gap-1">
            {onCreateBranch && (
              <ControlButton
                testId="version-control-branch"
                onClick={onCreateBranch}
                icon={GitBranch}
                label="Create Branch"
              />
            )}
            
            {onTagVersion && (
              <ControlButton
                testId="version-control-tag"
                onClick={onTagVersion}
                icon={Tag}
                label="Tag Version"
              />
            )}
          </div>
        </>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="relative">
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Keyboard shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <span className="text-xs font-mono">?</span>
        </button>
        
        {showShortcuts && (
          <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 min-w-[250px]">
            <div className="text-sm font-semibold text-gray-900 mb-3">Keyboard Shortcuts</div>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.ctrlKey && (
                      <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Ctrl</kbd>
                    )}
                    {shortcut.shiftKey && (
                      <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs">Shift</kbd>
                    )}
                    <kbd className="px-2 py-1 bg-gray-100 border rounded text-xs uppercase">
                      {shortcut.key}
                    </kbd>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              Press shortcuts while editor has focus
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VersionControls