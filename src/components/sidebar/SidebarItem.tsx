/**
 * Sidebar Item Component (Task 8.3)
 * 
 * Individual item renderer with drag-and-drop support,
 * metadata display, and rich visual feedback.
 */

import React, { useState, useCallback } from 'react'
import { FileText, Bot, Link, Clock, User, Tag } from 'lucide-react'
import { cn } from '../../lib/utils'
import { 
  SidebarObjectItem,
  ChainMetadata,
  DocumentMetadata,
  AgentMetadata 
} from '../../../schemas/api/sidebar'

interface SidebarItemProps {
  item: SidebarObjectItem
  onSelect?: () => void
  onDragStart?: (event: React.DragEvent) => void
  onDragEnd?: (event: React.DragEvent) => void
  showMetadata?: boolean
  compact?: boolean
  className?: string
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  onSelect,
  onDragStart,
  onDragEnd,
  showMetadata = true,
  compact = false,
  className
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragPreview, setDragPreview] = useState<string | null>(null)
  
  // Get type-specific icon
  const getIcon = () => {
    switch (item.type) {
      case 'chain':
        return <Link size={compact ? 14 : 16} className="text-blue-500" />
      case 'document':
        return <FileText size={compact ? 14 : 16} className="text-green-500" />
      case 'agent':
        return <Bot size={compact ? 14 : 16} className="text-purple-500" />
      default:
        return <FileText size={compact ? 14 : 16} className="text-muted-foreground" />
    }
  }
  
  // Get status indicator
  const getStatusIndicator = () => {
    if (item.type === 'chain' && 'status' in item.metadata) {
      const status = (item.metadata as ChainMetadata).status
      return (
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          {
            'bg-gray-400': status === 'draft',
            'bg-green-500': status === 'active',
            'bg-yellow-500': status === 'paused',
            'bg-blue-500': status === 'completed',
            'bg-red-500': status === 'error'
          }
        )} title={`Status: ${status}`} />
      )
    }
    
    if (item.type === 'document' && 'status' in item.metadata) {
      const status = (item.metadata as DocumentMetadata).status
      return (
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          {
            'bg-gray-400': status === 'draft',
            'bg-blue-500': status === 'review',
            'bg-green-500': status === 'published',
            'bg-orange-500': status === 'archived'
          }
        )} title={`Status: ${status}`} />
      )
    }
    
    if (item.type === 'agent' && 'status' in item.metadata) {
      const status = (item.metadata as AgentMetadata).status
      return (
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          {
            'bg-green-500': status === 'idle',
            'bg-yellow-500 animate-pulse': status === 'processing',
            'bg-red-500': status === 'error',
            'bg-gray-400': status === 'offline'
          }
        )} title={`Status: ${status}`} />
      )
    }
    
    return null
  }
  
  // Get metadata display
  const getMetadataDisplay = () => {
    if (!showMetadata || compact) return null
    
    const metadata = item.metadata
    const elements: React.ReactNode[] = []
    
    // Type-specific metadata
    if (item.type === 'chain' && 'nodeCount' in metadata) {
      const chainMeta = metadata as ChainMetadata
      elements.push(
        <span key="nodes" className="text-xs text-muted-foreground flex items-center gap-1">
          <Link size={10} />
          {chainMeta.nodeCount} nodes
        </span>
      )
    }
    
    if (item.type === 'document' && 'size' in metadata) {
      const docMeta = metadata as DocumentMetadata
      if (docMeta.size) {
        elements.push(
          <span key="size" className="text-xs text-muted-foreground">
            {formatFileSize(docMeta.size)}
          </span>
        )
      }
      if (docMeta.wordCount) {
        elements.push(
          <span key="words" className="text-xs text-muted-foreground">
            {docMeta.wordCount.toLocaleString()} words
          </span>
        )
      }
    }
    
    if (item.type === 'agent' && 'model' in metadata) {
      const agentMeta = metadata as AgentMetadata
      elements.push(
        <span key="model" className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
          {agentMeta.model}
        </span>
      )
    }
    
    // Common metadata - updated for new schema structure
    if (item.updatedAt) {
      elements.push(
        <span key="modified" className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock size={10} />
          {formatRelativeTime(new Date(item.updatedAt))}
        </span>
      )
    }
    
    return elements.length > 0 ? (
      <div className="flex flex-wrap gap-2 mt-1">
        {elements}
      </div>
    ) : null
  }
  
  // Get badges
  const getBadges = () => {
    if (!item.metadata.badges || item.metadata.badges.length === 0) return null
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {item.metadata.badges.slice(0, 3).map((badge, index) => (
          <span
            key={index}
            className="text-xs px-1.5 py-0.5 rounded font-medium bg-muted text-muted-foreground"
            title={badge}
          >
            {badge}
          </span>
        ))}
        {item.metadata.badges.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{item.metadata.badges.length - 3}
          </span>
        )}
      </div>
    )
  }
  
  // Get tags
  const getTags = () => {
    if (!item.metadata.tags || item.metadata.tags.length === 0 || compact) return null
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {item.metadata.tags.slice(0, 3).map(tag => (
          <span 
            key={tag}
            className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1"
          >
            <Tag size={8} />
            {tag}
          </span>
        ))}
        {item.metadata.tags.length > 3 && (
          <span className="text-xs text-muted-foreground">
            +{item.metadata.tags.length - 3} more
          </span>
        )}
      </div>
    )
  }
  
  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    
    // Create drag data for Canvas component compatibility
    const canvasDropData = {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      metadata: item.metadata
    }
    
    // Set drag data - Canvas expects the simple format
    e.dataTransfer.setData('application/json', JSON.stringify(canvasDropData))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create custom drag preview if thumbnail available
    if (item.metadata.thumbnail) {
      const img = new Image()
      img.src = item.metadata.thumbnail
      img.onload = () => {
        e.dataTransfer.setDragImage(img, img.width / 2, img.height / 2)
      }
      setDragPreview(item.metadata.thumbnail)
    }
    
    onDragStart?.(e)
  }, [item, onDragStart])
  
  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDragPreview(null)
    onDragEnd?.(e)
  }, [onDragEnd])
  
  // Handle click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.()
  }, [onSelect])
  
  // Handle keyboard interaction
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect?.()
    }
  }, [onSelect])
  
  return (
    <div
      className={cn(
        'sidebar-item group relative cursor-pointer transition-all duration-200',
        'border border-transparent rounded-md',
        {
          // State classes
          'bg-primary/10 border-primary/20 shadow-sm': item.isFavorite,
          'opacity-50 scale-95': isDragOver,
          'ring-2 ring-primary/30': isDragOver,
          
          // Size classes
          'p-2': compact,
          'p-3': !compact,
          
          // Interactive states
          'hover:bg-accent/30 hover:border-border/50': true,
          'hover:shadow-md': !compact,
        },
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragEnter={() => setIsDragOver(true)}
      onDragLeave={() => setIsDragOver(false)}
      draggable
      tabIndex={0}
      role="button"
      aria-selected={item.isFavorite}
      data-testid={`sidebar-item-${item.id}`}
      data-item-type={item.type}
    >
      {/* Main Content Row */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        {/* Name and Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'font-medium truncate',
              {
                'text-sm': compact,
                'text-base': !compact
              }
            )}>
              {item.title}
            </span>
            {getStatusIndicator()}
          </div>
          
          {/* Description */}
          {item.description && !compact && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        
        {/* Favorite Indicator */}
        {item.isFavorite && (
          <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full" />
        )}
      </div>
      
      {/* Metadata */}
      {getMetadataDisplay()}
      
      {/* Badges */}
      {getBadges()}
      
      {/* Tags */}
      {getTags()}
      
      {/* Drag Preview */}
      {dragPreview && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <span className="text-xs text-primary-foreground">📎</span>
        </div>
      )}
    </div>
  )
}

// Helper functions
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  if (diffHours < 1) {
    return 'Just now'
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

export default SidebarItem