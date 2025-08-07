import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { X, ArrowLeft, ArrowRight, Eye, EyeOff, Download, RotateCcw, Columns, AlignJustify } from 'lucide-react'
import { Version, DiffResult } from '../../../schemas/api/versions'

export interface VersionDiffProps {
  documentId: string
  sourceVersionId: string
  targetVersionId: string
  isVisible: boolean
  onClose: () => void
  onRestoreVersion?: (versionId: string) => void
  className?: string
}

interface DiffOperation {
  operation: 'equal' | 'delete' | 'insert'
  text: string
}

interface DiffLineProps {
  operation: DiffOperation
  lineNumber?: number
  showLineNumbers: boolean
}

const DiffLine: React.FC<DiffLineProps> = ({ operation, lineNumber, showLineNumbers }) => {
  const getLineClasses = () => {
    switch (operation.operation) {
      case 'insert':
        return 'bg-green-50 border-l-4 border-green-500'
      case 'delete':
        return 'bg-red-50 border-l-4 border-red-500'
      default:
        return 'bg-white'
    }
  }

  const getTextClasses = () => {
    switch (operation.operation) {
      case 'insert':
        return 'text-green-800'
      case 'delete':
        return 'text-red-800 line-through'
      default:
        return 'text-gray-800'
    }
  }

  const getMarker = () => {
    switch (operation.operation) {
      case 'insert':
        return '+ '
      case 'delete':
        return '- '
      default:
        return '  '
    }
  }

  return (
    <div 
      className={`px-4 py-1 font-mono text-sm whitespace-pre-wrap ${getLineClasses()}`}
      data-diff={operation.operation}
    >
      <div className="flex">
        {showLineNumbers && (
          <span className="text-gray-400 mr-4 select-none min-w-[3rem] text-right">
            {lineNumber}
          </span>
        )}
        <span className="text-gray-400 mr-2 select-none">{getMarker()}</span>
        <span className={getTextClasses()}>{operation.text}</span>
      </div>
    </div>
  )
}

interface SideBySideDiffProps {
  sourceVersion: Version
  targetVersion: Version
  diffOperations: DiffOperation[]
  showLineNumbers: boolean
}

const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  sourceVersion,
  targetVersion,
  diffOperations,
  showLineNumbers,
}) => {
  const { sourceLines, targetLines } = useMemo(() => {
    const source: Array<{ text: string; type: string; lineNum: number }> = []
    const target: Array<{ text: string; type: string; lineNum: number }> = []
    
    let sourceLineNum = 1
    let targetLineNum = 1
    
    diffOperations.forEach((op) => {
      const lines = op.text.split('\n')
      
      lines.forEach((line, index) => {
        if (index === lines.length - 1 && line === '') return // Skip empty last line from split
        
        switch (op.operation) {
          case 'equal':
            source.push({ text: line, type: 'equal', lineNum: sourceLineNum++ })
            target.push({ text: line, type: 'equal', lineNum: targetLineNum++ })
            break
          case 'delete':
            source.push({ text: line, type: 'delete', lineNum: sourceLineNum++ })
            // Add empty line to target to maintain alignment
            target.push({ text: '', type: 'empty', lineNum: -1 })
            break
          case 'insert':
            // Add empty line to source to maintain alignment
            source.push({ text: '', type: 'empty', lineNum: -1 })
            target.push({ text: line, type: 'insert', lineNum: targetLineNum++ })
            break
        }
      })
    })
    
    return { sourceLines: source, targetLines: target }
  }, [diffOperations])

  const getLineClasses = (type: string) => {
    switch (type) {
      case 'insert':
        return 'bg-green-50 border-l-2 border-green-500'
      case 'delete':
        return 'bg-red-50 border-l-2 border-red-500'
      case 'empty':
        return 'bg-gray-50'
      default:
        return 'bg-white'
    }
  }

  const getTextClasses = (type: string) => {
    switch (type) {
      case 'insert':
        return 'text-green-800'
      case 'delete':
        return 'text-red-800'
      case 'empty':
        return 'text-gray-400'
      default:
        return 'text-gray-800'
    }
  }

  return (
    <div data-testid="diff-side-by-side" className="flex h-full">
      {/* Source Version */}
      <div className="flex-1 border-r border-gray-200">
        <div className="bg-red-100 px-4 py-2 border-b border-red-200">
          <div className="font-semibold text-red-800">Version {sourceVersion.versionNumber}</div>
          <div className="text-xs text-red-600">
            {new Date(sourceVersion.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="overflow-y-auto h-full">
          {sourceLines.map((line, index) => (
            <div
              key={index}
              className={`px-4 py-1 font-mono text-sm whitespace-pre-wrap ${getLineClasses(line.type)}`}
            >
              <div className="flex">
                {showLineNumbers && (
                  <span className="text-gray-400 mr-4 select-none min-w-[3rem] text-right">
                    {line.lineNum > 0 ? line.lineNum : ''}
                  </span>
                )}
                <span className={getTextClasses(line.type)}>
                  {line.type === 'empty' ? '\u00A0' : line.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Version */}
      <div className="flex-1">
        <div className="bg-green-100 px-4 py-2 border-b border-green-200">
          <div className="font-semibold text-green-800">Version {targetVersion.versionNumber}</div>
          <div className="text-xs text-green-600">
            {new Date(targetVersion.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="overflow-y-auto h-full">
          {targetLines.map((line, index) => (
            <div
              key={index}
              className={`px-4 py-1 font-mono text-sm whitespace-pre-wrap ${getLineClasses(line.type)}`}
            >
              <div className="flex">
                {showLineNumbers && (
                  <span className="text-gray-400 mr-4 select-none min-w-[3rem] text-right">
                    {line.lineNum > 0 ? line.lineNum : ''}
                  </span>
                )}
                <span className={getTextClasses(line.type)}>
                  {line.type === 'empty' ? '\u00A0' : line.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface UnifiedDiffProps {
  diffOperations: DiffOperation[]
  showLineNumbers: boolean
}

const UnifiedDiff: React.FC<UnifiedDiffProps> = ({ diffOperations, showLineNumbers }) => {
  return (
    <div data-testid="diff-unified" className="h-full overflow-y-auto">
      {diffOperations.map((operation, index) => (
        <DiffLine
          key={index}
          operation={operation}
          lineNumber={showLineNumbers ? index + 1 : undefined}
          showLineNumbers={showLineNumbers}
        />
      ))}
    </div>
  )
}

const VersionDiff: React.FC<VersionDiffProps> = ({
  documentId,
  sourceVersionId,
  targetVersionId,
  isVisible,
  onClose,
  onRestoreVersion,
  className = '',
}) => {
  const [diffData, setDiffData] = useState<DiffResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')
  const [showLineNumbers, setShowLineNumbers] = useState(true)
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0)

  // Load diff data
  const loadDiff = useCallback(async () => {
    if (!sourceVersionId || !targetVersionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/documents/${documentId}/versions/${sourceVersionId}/diff?toId=${targetVersionId}&format=json&type=text`
      )

      if (!response.ok) {
        throw new Error('Failed to load version diff')
      }

      const result = await response.json()
      setDiffData(result.data)
    } catch (err) {
      console.error('Failed to load diff:', err)
      setError(err instanceof Error ? err.message : 'Failed to load version diff')
    } finally {
      setIsLoading(false)
    }
  }, [documentId, sourceVersionId, targetVersionId])

  // Load diff when component becomes visible or IDs change
  useEffect(() => {
    if (isVisible && sourceVersionId && targetVersionId) {
      loadDiff()
    }
  }, [isVisible, loadDiff])

  // Calculate change positions for navigation
  const changePositions = useMemo(() => {
    if (!diffData?.diff.operations) return []
    
    const positions: number[] = []
    diffData.diff.operations.forEach((op, index) => {
      if (op.operation === 'insert' || op.operation === 'delete') {
        positions.push(index)
      }
    })
    return positions
  }, [diffData])

  // Navigate to next/previous change
  const navigateToChange = useCallback((direction: 'next' | 'prev') => {
    if (changePositions.length === 0) return

    let newIndex: number
    if (direction === 'next') {
      newIndex = currentChangeIndex < changePositions.length - 1 
        ? currentChangeIndex + 1 
        : 0 // Wrap to first change
    } else {
      newIndex = currentChangeIndex > 0 
        ? currentChangeIndex - 1 
        : changePositions.length - 1 // Wrap to last change
    }
    
    setCurrentChangeIndex(newIndex)

    // Scroll to the change (simplified implementation)
    const changeElement = document.querySelector(`[data-diff]:nth-child(${changePositions[newIndex] + 1})`)
    changeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [changePositions, currentChangeIndex])

  // Export diff functionality
  const exportDiff = useCallback(async () => {
    if (!diffData) return

    try {
      const response = await fetch(
        `/api/documents/${documentId}/versions/${sourceVersionId}/diff?toId=${targetVersionId}&format=html&type=text`
      )

      if (response.ok) {
        const htmlDiff = await response.text()
        const blob = new Blob([htmlDiff], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `version-diff-${diffData.sourceVersion.versionNumber}-${diffData.targetVersion.versionNumber}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Failed to export diff:', err)
    }
  }, [diffData, documentId, sourceVersionId, targetVersionId])

  if (!isVisible) {
    return null
  }

  return (
    <div 
      data-testid="diff-viewer"
      className={`fixed inset-0 z-50 bg-white flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close diff viewer"
          >
            <X size={20} />
          </button>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Version Comparison</h2>
            {diffData && (
              <p className="text-sm text-gray-600">
                Comparing version {diffData.sourceVersion.versionNumber} with version {diffData.targetVersion.versionNumber}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Change Navigation */}
          {changePositions.length > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg border">
              <button
                onClick={() => navigateToChange('prev')}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={changePositions.length === 0}
              >
                <ArrowLeft size={14} />
              </button>
              <span className="text-xs text-gray-600 px-2">
                {currentChangeIndex + 1} / {changePositions.length}
              </span>
              <button
                onClick={() => navigateToChange('next')}
                className="p-1 hover:bg-gray-100 rounded"
                disabled={changePositions.length === 0}
              >
                <ArrowRight size={14} />
              </button>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex bg-white rounded-lg border">
            <button
              data-testid="diff-view-side-by-side"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-2 text-xs rounded-l-lg flex items-center gap-1 ${
                viewMode === 'side-by-side'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Columns size={14} />
              Side by Side
            </button>
            <button
              data-testid="diff-view-unified"
              onClick={() => setViewMode('unified')}
              className={`px-3 py-2 text-xs rounded-r-lg flex items-center gap-1 ${
                viewMode === 'unified'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlignJustify size={14} />
              Unified
            </button>
          </div>

          {/* Additional Controls */}
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Toggle line numbers"
          >
            {showLineNumbers ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          <button
            onClick={exportDiff}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Export diff"
            disabled={!diffData}
          >
            <Download size={16} />
          </button>

          {onRestoreVersion && diffData && (
            <button
              onClick={() => onRestoreVersion(sourceVersionId)}
              className="px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1"
              title="Restore source version"
            >
              <RotateCcw size={14} />
              Restore
            </button>
          )}
        </div>
      </div>

      {/* Diff Content */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={loadDiff}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
              Calculating diff...
            </div>
          </div>
        ) : diffData ? (
          <div className="h-full">
            {viewMode === 'side-by-side' ? (
              <SideBySideDiff
                sourceVersion={diffData.sourceVersion}
                targetVersion={diffData.targetVersion}
                diffOperations={diffData.diff.operations}
                showLineNumbers={showLineNumbers}
              />
            ) : (
              <UnifiedDiff
                diffOperations={diffData.diff.operations}
                showLineNumbers={showLineNumbers}
              />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No diff data available
          </div>
        )}
      </div>

      {/* Footer */}
      {diffData && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>{diffData.diff.insertions} additions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>{diffData.diff.deletions} deletions</span>
              </div>
              <div className="text-gray-500">
                Similarity: {Math.round(diffData.diff.similarity * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VersionDiff