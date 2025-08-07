import React, { useCallback, useState, useRef, useEffect } from 'react'
import { DocumentNodeProps, VisualState } from '../../../../schemas/api/nodes'

// Default visual configuration constants
const DEFAULT_CONFIG = {
  width: 120,
  height: 80,
  borderRadius: 8,
  strokeWidth: 2,
  colors: {
    default: {
      fill: '#3b82f6',
      stroke: '#1e40af',
      text: '#ffffff',
      icon: '#ffffff'
    },
    selected: {
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      text: '#ffffff',
      icon: '#ffffff'
    },
    hover: {
      fill: '#60a5fa',
      stroke: '#1e40af',
      text: '#ffffff',
      icon: '#ffffff'
    },
    dragging: {
      fill: '#93c5fd',
      stroke: '#1e40af',
      text: '#ffffff',
      icon: '#ffffff',
      opacity: 0.8
    }
  }
} as const

/**
 * DocumentNode Component
 * 
 * Renders a document node as a rounded rectangle SVG with document icon and text.
 * Supports drag behavior, selection states, and accessibility features.
 * 
 * Features:
 * - Rounded rectangle SVG shape with proper dimensions
 * - Document icon rendering and positioning
 * - Text rendering with foreignObject for proper text wrapping
 * - Visual states: default, selected, hover, dragging, focused
 * - Mouse and touch interaction support
 * - Accessibility with proper ARIA labels
 * - Status indicator based on document status
 */
const DocumentNode: React.FC<DocumentNodeProps> = ({
  id,
  position,
  title,
  data,
  visualState = {},
  dimensions,
  colors,
  onSelect,
  onHover,
  onDragStart,
  onDragMove,
  onDragEnd,
  ...props
}) => {
  // Merge provided dimensions with defaults
  const nodeWidth = dimensions?.width ?? DEFAULT_CONFIG.width
  const nodeHeight = dimensions?.height ?? DEFAULT_CONFIG.height
  const borderRadius = dimensions?.borderRadius ?? DEFAULT_CONFIG.borderRadius
  const strokeWidth = DEFAULT_CONFIG.strokeWidth

  // Merge provided colors with defaults
  const nodeColors = colors ?? DEFAULT_CONFIG.colors

  // Local state for drag behavior
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [currentPosition, setCurrentPosition] = useState(position)
  const nodeRef = useRef<SVGGElement>(null)

  // Determine current visual state
  const isSelected = visualState.selected ?? false
  const isHovered = visualState.hovered ?? false
  const isVisuallyDragging = visualState.dragging ?? isDragging
  const isFocused = visualState.focused ?? false

  // Get appropriate color scheme based on visual state
  const getCurrentColors = useCallback(() => {
    if (isVisuallyDragging) return nodeColors.dragging
    if (isSelected) return nodeColors.selected
    if (isHovered) return nodeColors.hover
    return nodeColors.default
  }, [isVisuallyDragging, isSelected, isHovered, nodeColors])

  const currentColors = getCurrentColors()

  // Update position when prop changes (for external drag handling)
  useEffect(() => {
    if (!isDragging) {
      setCurrentPosition(position)
    }
  }, [position, isDragging])

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return // Only handle left click
    
    event.preventDefault()
    event.stopPropagation()
    
    const startPos = { x: event.clientX, y: event.clientY }
    setDragStart(startPos)
    setIsDragging(true)
    
    onDragStart?.(id, position, startPos)
    onSelect?.(id)

    // Add global event listeners for drag
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStart) return
      
      const deltaX = moveEvent.clientX - dragStart.x
      const deltaY = moveEvent.clientY - dragStart.y
      
      const newPos = {
        x: position.x + deltaX,
        y: position.y + deltaY
      }
      
      // Apply basic boundary constraints
      newPos.x = Math.max(nodeWidth/2, Math.min(1200 - nodeWidth/2, newPos.x))
      newPos.y = Math.max(nodeHeight/2, Math.min(800 - nodeHeight/2, newPos.y))
      
      setCurrentPosition(newPos)
      onDragMove?.(id, newPos, { deltaX, deltaY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      onDragEnd?.(id, currentPosition, dragStart)
      setDragStart(null)
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [id, position, dragStart, currentPosition, onDragStart, onDragMove, onDragEnd, onSelect, nodeWidth, nodeHeight])

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length !== 1) return
    
    event.preventDefault()
    const touch = event.touches[0]
    
    const startPos = { x: touch.clientX, y: touch.clientY }
    setDragStart(startPos)
    setIsDragging(true)
    
    onDragStart?.(id, position, startPos)
    onSelect?.(id)
  }, [id, position, onDragStart, onSelect])

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isDragging || !dragStart || event.touches.length !== 1) return
    
    event.preventDefault()
    const touch = event.touches[0]
    
    const deltaX = touch.clientX - dragStart.x
    const deltaY = touch.clientY - dragStart.y
    
    const newPos = {
      x: position.x + deltaX,
      y: position.y + deltaY
    }
    
    // Apply basic boundary constraints
    newPos.x = Math.max(nodeWidth/2, Math.min(1200 - nodeWidth/2, newPos.x))
    newPos.y = Math.max(nodeHeight/2, Math.min(800 - nodeHeight/2, newPos.y))
    
    setCurrentPosition(newPos)
    onDragMove?.(id, newPos, { deltaX, deltaY })
  }, [isDragging, dragStart, position, id, onDragMove, nodeWidth, nodeHeight])

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!isDragging) return
    
    event.preventDefault()
    setIsDragging(false)
    onDragEnd?.(id, currentPosition, dragStart)
    setDragStart(null)
  }, [isDragging, id, currentPosition, dragStart, onDragEnd])

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    onHover?.(id, true)
  }, [id, onHover])

  const handleMouseLeave = useCallback(() => {
    onHover?.(id, false)
  }, [id, onHover])

  // Get status indicator color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'published': return '#10b981'
      case 'review': return '#f59e0b'
      case 'draft': return '#6b7280'
      default: return '#6b7280'
    }
  }, [])

  return (
    <g
      ref={nodeRef}
      data-testid="document-node"
      data-node-id={id}
      data-node-type="document"
      transform={`translate(${currentPosition.x}, ${currentPosition.y})`}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: currentColors.opacity || 1
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      tabIndex={isFocused ? 0 : -1}
      role="button"
      aria-label={`Document node: ${title}`}
      aria-selected={isSelected}
      aria-describedby={`${id}-description`}
      {...props}
    >
      {/* Rounded rectangle shape */}
      <rect
        data-testid="document-shape"
        x={-nodeWidth / 2}
        y={-nodeHeight / 2}
        width={nodeWidth}
        height={nodeHeight}
        rx={borderRadius}
        ry={borderRadius}
        fill={currentColors.fill}
        stroke={currentColors.stroke}
        strokeWidth={strokeWidth}
        className="transition-all duration-200"
      />
      
      {/* Document icon */}
      <g 
        data-testid="document-icon" 
        transform="translate(-8, -20)"
        fill={currentColors.icon}
      >
        {/* Document base */}
        <rect 
          x="0" 
          y="4" 
          width="16" 
          height="16" 
          fill="currentColor" 
          rx="2"
        />
        {/* Document page with folded corner */}
        <path 
          d="M2 6h8m-8 3h8m-8 3h6m2-8v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1h9zm0-2l2 2h-2V6z" 
          fill="white" 
        />
        {/* Document lines */}
        <rect x="4" y="10" width="8" height="1" fill="currentColor" opacity="0.7" />
        <rect x="4" y="12" width="6" height="1" fill="currentColor" opacity="0.7" />
        <rect x="4" y="14" width="8" height="1" fill="currentColor" opacity="0.7" />
      </g>
      
      {/* Title text with foreignObject for proper text wrapping */}
      <foreignObject
        data-testid="document-title"
        x={-nodeWidth / 2 + 8}
        y={nodeHeight / 2 - 32}
        width={nodeWidth - 16}
        height={24}
      >
        <div 
          style={{ 
            color: currentColors.text,
            fontSize: '12px',
            fontWeight: '500',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
          }}
        >
          {title}
        </div>
      </foreignObject>
      
      {/* Status indicator */}
      {data.status && (
        <circle
          data-testid="document-status"
          cx={nodeWidth / 2 - 8}
          cy={-nodeHeight / 2 + 8}
          r="4"
          fill={getStatusColor(data.status)}
          stroke="white"
          strokeWidth="1"
        />
      )}

      {/* Word count indicator (if available) */}
      {data.wordCount && (
        <text
          x={0}
          y={nodeHeight / 2 + 16}
          textAnchor="middle"
          fontSize="10"
          fill="#6b7280"
          opacity="0.8"
        >
          {data.wordCount} words
        </text>
      )}
      
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={-nodeWidth / 2 - 2}
          y={-nodeHeight / 2 - 2}
          width={nodeWidth + 4}
          height={nodeHeight + 4}
          rx={borderRadius + 2}
          ry={borderRadius + 2}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.8"
        />
      )}
      
      {/* Focus ring for accessibility */}
      {isFocused && (
        <rect
          x={-nodeWidth / 2 - 3}
          y={-nodeHeight / 2 - 3}
          width={nodeWidth + 6}
          height={nodeHeight + 6}
          rx={borderRadius + 3}
          ry={borderRadius + 3}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          opacity="0.6"
        />
      )}

      {/* Hidden description for accessibility */}
      <desc id={`${id}-description`}>
        Document node with title "{title}", status: {data.status}
        {data.wordCount && `, ${data.wordCount} words`}
        {data.lastModified && `, last modified: ${data.lastModified.toLocaleDateString()}`}
      </desc>
    </g>
  )
}

export default DocumentNode