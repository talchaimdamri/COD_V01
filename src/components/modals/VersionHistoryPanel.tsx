import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, User, FileText, MoreVertical, Eye, RotateCcw, Trash2, Search, Filter } from 'lucide-react'
import { Version, DiffResult } from '../../../schemas/api/versions'

export interface VersionHistoryPanelProps {
  documentId: string
  isVisible: boolean
  onClose: () => void
  onRestoreVersion: (versionId: string, versionNumber: number) => void
  onCompareVersions: (fromVersionId: string, toVersionId: string) => void
  onDeleteVersion: (versionId: string) => void
  className?: string
}

interface VersionItemProps {
  version: Version
  isSelected: boolean
  isComparisonMode: boolean
  onSelect: (versionId: string, multiSelect: boolean) => void
  onRestore: (versionId: string, versionNumber: number) => void
  onDelete: (versionId: string) => void
  onPreview: (versionId: string) => void
}

const VersionItem: React.FC<VersionItemProps> = ({
  version,
  isSelected,
  isComparisonMode,
  onSelect,
  onRestore,
  onDelete,
  onPreview,
}) => {
  const [showActions, setShowActions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div
      data-testid="version-item"
      className={`
        relative border rounded-lg p-4 cursor-pointer transition-all duration-200
        hover:shadow-md
        ${isSelected 
          ? 'border-purple-300 bg-purple-50 shadow-sm selected' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
        }
        ${isComparisonMode ? 'cursor-pointer' : ''}
      `}
      onClick={(e) => {
        if (isComparisonMode) {
          onSelect(version.id, e.ctrlKey || e.metaKey)
        }
      }}
    >
      {/* Version Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            <FileText size={16} className="text-gray-500" />
            Version {version.versionNumber}
            {version.isSnapshot && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                Snapshot
              </span>
            )}
          </div>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Version actions"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(version.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye size={14} />
                Preview
              </button>
              <button
                data-testid="version-restore"
                onClick={(e) => {
                  e.stopPropagation()
                  onRestore(version.id, version.versionNumber)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Restore
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(version.id)
                  setShowActions(false)
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Version Description */}
      {version.description && (
        <div data-testid="version-description" className="mb-2">
          <p className="text-sm text-gray-700">{version.description}</p>
        </div>
      )}

      {/* Version Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          {version.createdBy && (
            <div data-testid="version-author" className="flex items-center gap-1">
              <User size={12} />
              {version.createdBy}
            </div>
          )}
          
          <div data-testid="version-timestamp" className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(version.createdAt)}</span>
            <span className="text-gray-400">at</span>
            <span>{formatTime(version.createdAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div data-testid="version-word-count" className="text-xs">
            {version.wordCount} words
          </div>
          <div data-testid="version-char-count" className="text-xs">
            {version.charCount} chars
          </div>
        </div>
      </div>
    </div>
  )
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  documentId,
  isVisible,
  onClose,
  onRestoreVersion,
  onCompareVersions,
  onDeleteVersion,
  className = '',
}) => {
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersionIds, setSelectedVersionIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterSnapshot, setFilterSnapshot] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Load versions
  const loadVersions = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
    if (isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        includeContent: 'false',
        ...(filterSnapshot && { snapshotsOnly: 'true' }),
      })

      const response = await fetch(`/api/documents/${documentId}/versions?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load version history')
      }

      const result = await response.json()
      const newVersions = result.data.versions

      if (reset || pageNum === 1) {
        setVersions(newVersions)
      } else {
        setVersions(prev => [...prev, ...newVersions])
      }

      setHasMore(newVersions.length === 20) // If we got less than the limit, no more pages
    } catch (err) {
      console.error('Failed to load versions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load version history')
    } finally {
      setIsLoading(false)
    }
  }, [documentId, isLoading, filterSnapshot])

  // Initial load
  useEffect(() => {
    if (isVisible && documentId) {
      loadVersions(1, true)
      setPage(1)
    }
  }, [isVisible, documentId, filterSnapshot, loadVersions])

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || !hasMore || isLoading) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage > 0.9) {
      const nextPage = page + 1
      setPage(nextPage)
      loadVersions(nextPage, false)
    }
  }, [hasMore, isLoading, page, loadVersions])

  // Scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // Filter versions by search query
  const filteredVersions = versions.filter(version => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      version.description?.toLowerCase().includes(query) ||
      version.createdBy?.toLowerCase().includes(query) ||
      version.versionNumber.toString().includes(query)
    )
  })

  // Handle version selection
  const handleVersionSelect = useCallback((versionId: string, multiSelect: boolean) => {
    setSelectedVersionIds(prev => {
      if (multiSelect) {
        // Multi-select mode (Ctrl/Cmd click)
        if (prev.includes(versionId)) {
          return prev.filter(id => id !== versionId)
        } else {
          return [...prev, versionId].slice(0, 2) // Max 2 selections for comparison
        }
      } else {
        // Single select mode
        return prev.includes(versionId) ? [] : [versionId]
      }
    })

    // Enable comparison mode if we have selections
    setIsComparisonMode(true)
  }, [])

  // Handle compare versions
  const handleCompareVersions = useCallback(() => {
    if (selectedVersionIds.length === 2) {
      onCompareVersions(selectedVersionIds[0], selectedVersionIds[1])
      setSelectedVersionIds([])
      setIsComparisonMode(false)
    }
  }, [selectedVersionIds, onCompareVersions])

  // Handle restore version with confirmation
  const handleRestoreVersion = useCallback((versionId: string, versionNumber: number) => {
    if (window.confirm(`Are you sure you want to restore to version ${versionNumber}? This will create a new version with the restored content.`)) {
      onRestoreVersion(versionId, versionNumber)
    }
  }, [onRestoreVersion])

  // Handle retry
  const handleRetry = useCallback(() => {
    setError(null)
    loadVersions(1, true)
    setPage(1)
  }, [loadVersions])

  if (!isVisible) {
    return null
  }

  return (
    <div 
      data-testid="version-history-panel"
      className={`
        flex flex-col h-full bg-white border-r border-gray-200
        ${className}
      `}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close version history"
        >
          <Clock size={20} className="text-gray-500 rotate-180" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            data-testid="version-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search versions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Filter size={14} />
            Filters
          </button>

          {isComparisonMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {selectedVersionIds.length}/2 selected
              </span>
              {selectedVersionIds.length === 2 && (
                <button
                  data-testid="version-compare"
                  onClick={handleCompareVersions}
                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                >
                  Compare
                </button>
              )}
            </div>
          )}
        </div>

        {showFilters && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filterSnapshot}
                onChange={(e) => setFilterSnapshot(e.target.checked)}
                className="rounded border-gray-300"
              />
              Snapshots only
            </label>
          </div>
        )}
      </div>

      {/* Version List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {error ? (
          <div data-testid="version-history-error" className="text-center py-8">
            <div className="text-red-600 mb-2">{error}</div>
            <button
              data-testid="retry-version-load"
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredVersions.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No versions match your search' : 'No versions found'}
          </div>
        ) : (
          <>
            {filteredVersions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                isSelected={selectedVersionIds.includes(version.id)}
                isComparisonMode={isComparisonMode}
                onSelect={handleVersionSelect}
                onRestore={handleRestoreVersion}
                onDelete={onDeleteVersion}
                onPreview={(versionId) => console.log('Preview version:', versionId)}
              />
            ))}
            
            {isLoading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
                  Loading versions...
                </div>
              </div>
            )}

            {hasMore && !isLoading && filteredVersions.length > 0 && (
              <button
                data-testid="load-more-versions"
                onClick={() => {
                  const nextPage = page + 1
                  setPage(nextPage)
                  loadVersions(nextPage, false)
                }}
                className="w-full py-2 text-purple-600 hover:text-purple-700 text-sm"
              >
                Load more versions
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default VersionHistoryPanel