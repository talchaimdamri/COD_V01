import React, { useCallback, useState, useRef, useEffect } from 'react'
import { AgentNodeProps, VisualState } from '../../../../schemas/api/nodes'

// Default visual configuration constants
const DEFAULT_CONFIG = {
  radius: 35,
  strokeWidth: 2,
  colors: {
    default: {
      fill: '#10b981',
      stroke: '#065f46',
      text: '#ffffff',
      icon: '#ffffff'
    },
    selected: {
      fill: '#10b981',
      stroke: '#047857',
      text: '#ffffff',
      icon: '#ffffff'
    },
    hover: {
      fill: '#34d399',
      stroke: '#065f46',
      text: '#ffffff',
      icon: '#ffffff'
    },
    dragging: {
      fill: '#6ee7b7',
      stroke: '#065f46',
      text: '#ffffff',
      icon: '#ffffff',
      opacity: 0.8
    }
  }
} as const

/**
 * Generate hexagon path for the agent node shape
 */
const generateHexagonPath = (radius: number): string => {
  const angles = [0, 60, 120, 180, 240, 300]
  const points = angles.map(angle => {
    const radian = (angle * Math.PI) / 180
    return `${Math.cos(radian) * radius},${Math.sin(radian) * radius}`
  })
  return `M${points.join(' L')} Z`
}

/**
 * AgentNode Component
 * 
 * Renders an agent node as a hexagonal SVG with CPU/agent icon and model indicator.
 * Supports drag behavior, selection states, and processing animations.
 * 
 * Features:
 * - Hexagonal SVG shape with proper geometry
 * - Agent/CPU icon rendering and positioning
 * - Model indicator display and positioning
 * - Status indicators with processing animation
 * - Visual states: default, selected, hover, dragging, focused
 * - Mouse and touch interaction support
 * - Accessibility with proper ARIA labels
 */
const AgentNode: React.FC<AgentNodeProps> = ({
  id,
  position,
  title,
  data,
  visualState = {},
  dimensions,
  colors,
  showProcessingAnimation = true,
  onSelect,
  onHover,
  onDragStart,
  onDragMove,
  onDragEnd,
  ...props
}) => {
  // Merge provided dimensions with defaults
  const nodeRadius = dimensions?.radius ?? DEFAULT_CONFIG.radius
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
      newPos.x = Math.max(nodeRadius, Math.min(1200 - nodeRadius, newPos.x))
      newPos.y = Math.max(nodeRadius, Math.min(800 - nodeRadius, newPos.y))
      
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
  }, [id, position, dragStart, currentPosition, onDragStart, onDragMove, onDragEnd, onSelect, nodeRadius])

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
    newPos.x = Math.max(nodeRadius, Math.min(1200 - nodeRadius, newPos.x))
    newPos.y = Math.max(nodeRadius, Math.min(800 - nodeRadius, newPos.y))
    
    setCurrentPosition(newPos)
    onDragMove?.(id, newPos, { deltaX, deltaY })
  }, [isDragging, dragStart, position, id, onDragMove, nodeRadius])

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
      case 'processing': return '#f59e0b'
      case 'error': return '#ef4444'
      case 'idle': return '#10b981'
      default: return '#10b981'
    }
  }, [])

  // Generate hexagon path
  const hexagonPath = generateHexagonPath(nodeRadius)

  return (
    <g
      ref={nodeRef}
      data-testid="agent-node"
      data-node-id={id}
      data-node-type="agent"
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
      aria-label={`Agent node: ${title}, model: ${data.model}`}
      aria-selected={isSelected}
      aria-describedby={`${id}-description`}
      {...props}
    >
      {/* Hexagonal shape */}
      <path
        data-testid="agent-shape"
        d={hexagonPath}
        fill={currentColors.fill}
        stroke={currentColors.stroke}
        strokeWidth={strokeWidth}
        className="transition-all duration-200"
      />
      
      {/* Agent/CPU icon */}
      <g 
        data-testid="agent-icon" 
        transform="translate(-9, -12)"
        fill={currentColors.icon}
      >
        {/* CPU main body */}
        <rect x="2" y="4" width="14" height="12" fill="currentColor" rx="2" />
        <rect x="4" y="6" width="10" height="8" fill="white" />
        <rect x="6" y="8" width="6" height="4" fill="currentColor" />
        
        {/* CPU connection pins */}
        <rect x="0" y="7" width="2" height="2" fill="currentColor" />
        <rect x="0" y="11" width="2" height="2" fill="currentColor" />
        <rect x="16" y="7" width="2" height="2" fill="currentColor" />
        <rect x="16" y="11" width="2" height="2" fill="currentColor" />
        <rect x="7" y="0" width="2" height="2" fill="currentColor" />
        <rect x="11" y="0" width="2" height="2" fill="currentColor" />
        <rect x="7" y="16" width="2" height="2" fill="currentColor" />
        <rect x="11" y="16" width="2" height="2" fill="currentColor" />
        
        {/* CPU core indicators */}
        <circle cx="8" cy="10" r="1" fill="currentColor" />
        <circle cx="10" cy="10" r="1" fill="currentColor" />
      </g>
      
      {/* Agent title */}
      <text
        data-testid="agent-title"
        x={0}
        y={nodeRadius + 16}
        textAnchor="middle"
        fontSize="12"
        fontWeight="500"
        fill={currentColors.text}
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {title}
      </text>
      
      {/* Model indicator */}
      <text
        data-testid="agent-model"
        x={0}
        y={nodeRadius + 30}
        textAnchor="middle"
        fontSize="9"
        fill="#6b7280"
        style={{
          opacity: 0.8,
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
      >
        {data.model}
      </text>
      
      {/* Status indicator */}
      <circle
        data-testid="agent-status"
        cx={nodeRadius - 8}
        cy={-nodeRadius + 8}
        r="5"
        fill={getStatusColor(data.status)}
        stroke="white"
        strokeWidth="2"
      />
      
      {/* Processing animation indicator */}
      {data.status === 'processing' && showProcessingAnimation && (
        <circle
          data-testid="processing-indicator"
          cx={nodeRadius - 8}
          cy={-nodeRadius + 8}
          r="8"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values="5;12;5"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.6;0.2;0.6"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      
      {/* Temperature indicator (if available) */}
      {data.temperature !== undefined && (
        <text
          x={-nodeRadius + 8}
          y={nodeRadius + 16}
          fontSize="8"
          fill="#6b7280"
          opacity="0.7"
        >
          T: {data.temperature}
        </text>
      )}
      
      {/* Selection highlight */}
      {isSelected && (
        <path
          d={generateHexagonPath(nodeRadius + 2)}
          fill="none"
          stroke="#047857"
          strokeWidth="2"
          strokeDasharray="4 2"
          opacity="0.8"
        />
      )}
      
      {/* Focus ring for accessibility */}
      {isFocused && (
        <path
          d={generateHexagonPath(nodeRadius + 4)}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.6"
        />
      )}

      {/* Hidden description for accessibility */}
      <desc id={`${id}-description`}>
        Agent node with title "{title}", using model: {data.model}, status: {data.status}
        {data.temperature !== undefined && `, temperature: ${data.temperature}`}
        {data.maxTokens && `, max tokens: ${data.maxTokens}`}
        {data.prompt && `, prompt: ${data.prompt.substring(0, 50)}${data.prompt.length > 50 ? '...' : ''}`}
      </desc>
    </g>
  )
}

export default AgentNode