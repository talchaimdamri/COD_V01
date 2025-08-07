import React, { useState, useCallback } from 'react'
import { FileText, Bot, Plus, Eye, Link2, X, ChevronDown, ChevronRight } from 'lucide-react'

export interface RailConnection {
  id: string
  title: string
  type: 'document' | 'agent'
  preview: string
  lastModified: Date
  metadata?: {
    author?: string
    wordCount?: number
    status?: 'draft' | 'published' | 'archived'
    tags?: string[]
  }
}

export interface DocumentRailsProps {
  documentId: string
  upstream: RailConnection[]
  downstream: RailConnection[]
  onConnect: (documentId: string, connectionId: string, type: 'upstream' | 'downstream') => void
  onDisconnect: (documentId: string, connectionId: string, type: 'upstream' | 'downstream') => void
  onPreview: (connectionId: string) => void
  isLoading?: boolean
  error?: string | null
}

const DocumentRails: React.FC<DocumentRailsProps> = ({
  documentId,
  upstream = [],
  downstream = [],
  onConnect,
  onDisconnect,
  onPreview,
  isLoading = false,
  error = null,
}) => {
  const [expandedRails, setExpandedRails] = useState<{
    upstream: boolean
    downstream: boolean
  }>({ upstream: true, downstream: true })
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const toggleRailExpansion = useCallback((railType: 'upstream' | 'downstream') => {
    setExpandedRails(prev => ({
      ...prev,
      [railType]: !prev[railType]
    }))
  }, [])

  const getConnectionType = useCallback((connection: RailConnection) => {
    return upstream.includes(connection) ? 'upstream' : 'downstream'
  }, [upstream])

  const renderConnectionMetadata = (connection: RailConnection) => {
    if (!connection.metadata) return null
    
    return (
      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
        {connection.metadata.wordCount && (
          <span>{connection.metadata.wordCount.toLocaleString()} words</span>
        )}
        {connection.metadata.author && (
          <span>by {connection.metadata.author}</span>
        )}
        {connection.metadata.status && (
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            connection.metadata.status === 'published' ? 'bg-green-100 text-green-700' :
            connection.metadata.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {connection.metadata.status}
          </span>
        )}
      </div>
    )
  }

  const renderRailItem = (connection: RailConnection, isFirst: boolean = false) => {
    const isHovered = hoveredItem === connection.id
    const connectionType = getConnectionType(connection)
    
    return (
      <div
        key={connection.id}
        data-testid={isFirst ? "rail-item" : undefined}
        className={`
          bg-white border rounded-lg p-3 cursor-pointer group transition-all duration-200
          ${isHovered ? 'border-purple-300 shadow-md scale-[1.02]' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
        `}
        onClick={() => onPreview(connection.id)}
        onMouseEnter={() => setHoveredItem(connection.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className={`
              p-1.5 rounded-full transition-colors
              ${connection.type === 'document' 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-green-100 text-green-600'
              }
              ${isHovered && connection.type === 'document' ? 'bg-blue-200' : ''}
              ${isHovered && connection.type === 'agent' ? 'bg-green-200' : ''}
            `}>
              {connection.type === 'document' ? (
                <FileText size={14} />
              ) : (
                <Bot size={14} />
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div 
              data-testid="rail-item-title"
              className="font-medium text-sm text-gray-900 truncate group-hover:text-purple-700 transition-colors"
            >
              {connection.title}
            </div>
            
            <div 
              data-testid="rail-item-preview"
              className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed"
            >
              {truncateText(connection.preview, 120)}
            </div>
            
            {renderConnectionMetadata(connection)}
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>{formatDate(connection.lastModified)}</span>
                {connection.metadata?.tags && connection.metadata.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {connection.metadata.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {connection.metadata.tags.length > 2 && (
                      <span className="text-gray-400 text-xs">+{connection.metadata.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className={`
                flex items-center gap-1 transition-opacity duration-200
                ${isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
              `}>
                <button
                  data-testid="rail-item-connect"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConnect(documentId, connection.id, connectionType)
                  }}
                  className="p-1.5 hover:bg-purple-50 rounded text-purple-600 hover:text-purple-700 transition-colors"
                  title="Connect document"
                  aria-label={`Connect ${connection.title}`}
                >
                  <Link2 size={12} />
                </button>
                <button
                  data-testid="rail-item-disconnect"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDisconnect(documentId, connection.id, connectionType)
                  }}
                  className="p-1.5 hover:bg-red-50 rounded text-red-600 hover:text-red-700 transition-colors"
                  title="Disconnect document"
                  aria-label={`Disconnect ${connection.title}`}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-3" />
      <div className="text-sm text-gray-500">Loading connections...</div>
    </div>
  )

  const renderErrorState = (error: string) => (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
        <X size={24} className="text-red-600" />
      </div>
      <div className="text-sm text-red-600 text-center mb-3">
        {error}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-gray-600 hover:text-gray-800 underline"
      >
        Try again
      </button>
    </div>
  )

  const renderEmptyState = (type: 'upstream' | 'downstream') => {
    const isUpstream = type === 'upstream'
    
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
          ${isUpstream ? 'bg-blue-50 text-blue-400' : 'bg-green-50 text-green-400'}
        `}>
          {isUpstream ? (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-current rounded-full" />
              <div className="w-6 h-0.5 bg-current mx-1" />
              <div className="w-2 h-2 border-2 border-current border-l-0 border-b-0 transform rotate-45" />
            </div>
          ) : (
            <div className="flex items-center">
              <div className="w-2 h-2 border-2 border-current border-r-0 border-t-0 transform rotate-45" />
              <div className="w-6 h-0.5 bg-current mx-1" />
              <div className="w-3 h-3 bg-current rounded-full" />
            </div>
          )}
        </div>
        
        <div className="text-sm text-gray-600 text-center mb-2 font-medium">
          {isUpstream ? 'No upstream connections' : 'No downstream connections'}
        </div>
        
        <div className="text-xs text-gray-500 text-center mb-4 max-w-48 leading-relaxed">
          {isUpstream 
            ? 'Connect source documents that feed into this one'
            : 'Connect documents that are created from this source'
          }
        </div>
        
        <button
          data-testid={`add-${type}-connection`}
          onClick={() => {
            // This would typically open a connection dialog
            console.log(`Add ${type} connection clicked`)
          }}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all duration-200
            font-medium border-2 border-dashed
            ${isUpstream 
              ? 'text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50' 
              : 'text-green-600 border-green-200 hover:border-green-300 hover:bg-green-50'
            }
            hover:scale-105 active:scale-95
          `}
        >
          <Plus size={16} />
          Add {isUpstream ? 'source' : 'output'}
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center">
          {renderErrorState(error)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Upstream Rail */}
      <div 
        data-testid="upstream-rail"
        className="w-72 border-r border-gray-200 bg-white flex flex-col shadow-sm"
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <button
            onClick={() => toggleRailExpansion('upstream')}
            className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
            aria-expanded={expandedRails.upstream}
            aria-controls="upstream-content"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <div className="flex items-center text-blue-600">
                  <div className="w-2 h-2 border-2 border-current border-r-0 border-t-0 transform rotate-45" />
                  <div className="w-4 h-0.5 bg-current mx-1" />
                  <div className="w-2.5 h-2.5 bg-current rounded-full" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Upstream ({upstream.length})
                </h3>
                <p className="text-xs text-gray-600">
                  Source documents
                </p>
              </div>
            </div>
            <div className="text-gray-400">
              {expandedRails.upstream ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
        </div>
        
        {expandedRails.upstream && (
          <div id="upstream-content" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-3">
                {isLoading ? (
                  renderLoadingState()
                ) : upstream.length > 0 ? (
                  upstream.map((connection, index) => renderRailItem(connection, index === 0))
                ) : (
                  renderEmptyState('upstream')
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Downstream Rail */}
      <div 
        data-testid="downstream-rail"
        className="w-72 border-l border-gray-200 bg-white flex flex-col shadow-sm"
      >
        <div className="border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <button
            onClick={() => toggleRailExpansion('downstream')}
            className="w-full p-4 flex items-center justify-between hover:bg-green-50/50 transition-colors"
            aria-expanded={expandedRails.downstream}
            aria-controls="downstream-content"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <div className="flex items-center text-green-600">
                  <div className="w-2.5 h-2.5 bg-current rounded-full" />
                  <div className="w-4 h-0.5 bg-current mx-1" />
                  <div className="w-2 h-2 border-2 border-current border-l-0 border-b-0 transform rotate-45" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Downstream ({downstream.length})
                </h3>
                <p className="text-xs text-gray-600">
                  Output documents
                </p>
              </div>
            </div>
            <div className="text-gray-400">
              {expandedRails.downstream ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          </button>
        </div>
        
        {expandedRails.downstream && (
          <div id="downstream-content" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 space-y-3">
                {isLoading ? (
                  renderLoadingState()
                ) : downstream.length > 0 ? (
                  downstream.map((connection, index) => renderRailItem(connection, index === 0 && upstream.length === 0))
                ) : (
                  renderEmptyState('downstream')
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentRails