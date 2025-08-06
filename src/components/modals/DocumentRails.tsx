import React from 'react'
import { FileText, Bot, Plus, Eye, Link2, X } from 'lucide-react'

export interface RailConnection {
  id: string
  title: string
  type: 'document' | 'agent'
  preview: string
  lastModified: Date
}

export interface DocumentRailsProps {
  documentId: string
  upstream: RailConnection[]
  downstream: RailConnection[]
  onConnect: (documentId: string, connectionId: string, type: 'upstream' | 'downstream') => void
  onDisconnect: (documentId: string, connectionId: string, type: 'upstream' | 'downstream') => void
  onPreview: (connectionId: string) => void
}

const DocumentRails: React.FC<DocumentRailsProps> = ({
  documentId,
  upstream = [],
  downstream = [],
  onConnect,
  onDisconnect,
  onPreview,
}) => {
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

  const renderRailItem = (connection: RailConnection, isFirst: boolean = false) => (
    <div
      key={connection.id}
      data-testid={isFirst ? "rail-item" : undefined}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onPreview(connection.id)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {connection.type === 'document' ? (
            <FileText size={16} className="text-blue-600" />
          ) : (
            <Bot size={16} className="text-green-600" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div 
            data-testid="rail-item-title"
            className="font-medium text-sm text-gray-900 truncate"
          >
            {connection.title}
          </div>
          
          <div 
            data-testid="rail-item-preview"
            className="text-xs text-gray-600 mt-1 line-clamp-3"
          >
            {truncateText(connection.preview)}
          </div>
          
          <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
            <span>{formatDate(connection.lastModified)}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                data-testid="rail-item-connect"
                onClick={(e) => {
                  e.stopPropagation()
                  onConnect(documentId, connection.id, upstream.includes(connection) ? 'upstream' : 'downstream')
                }}
                className="p-1 hover:bg-gray-100 rounded"
                title="Connect"
              >
                <Link2 size={12} />
              </button>
              <button
                data-testid="rail-item-disconnect"
                onClick={(e) => {
                  e.stopPropagation()
                  onDisconnect(documentId, connection.id, upstream.includes(connection) ? 'upstream' : 'downstream')
                }}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="Disconnect"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEmptyState = (type: 'upstream' | 'downstream') => (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <FileText size={24} className="text-gray-400" />
      </div>
      <div className="text-sm text-gray-500 text-center mb-3">
        {type === 'upstream' ? 'No upstream connections' : 'No downstream connections'}
      </div>
      <button
        data-testid={`add-${type}-connection`}
        onClick={() => {
          // This would typically open a connection dialog
          console.log(`Add ${type} connection clicked`)
        }}
        className="flex items-center gap-2 px-3 py-2 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
      >
        <Plus size={14} />
        Add connection
      </button>
    </div>
  )

  return (
    <div className="flex h-full">
      {/* Upstream Rail */}
      <div 
        data-testid="upstream-rail"
        className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span>⬅️</span>
            Upstream
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Sources feeding into this document
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {upstream.length > 0 ? (
              upstream.map((connection, index) => renderRailItem(connection, index === 0))
            ) : (
              renderEmptyState('upstream')
            )}
          </div>
        </div>
      </div>

      {/* Downstream Rail */}
      <div 
        data-testid="downstream-rail"
        className="w-64 border-l border-gray-200 bg-gray-50 flex flex-col"
      >
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span>➡️</span>
            Downstream
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Documents created from this source
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-3">
            {downstream.length > 0 ? (
              downstream.map((connection, index) => renderRailItem(connection, index === 0 && upstream.length === 0))
            ) : (
              renderEmptyState('downstream')
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentRails