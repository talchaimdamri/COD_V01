/**
 * StraightEdge Component
 * 
 * Renders a straight line edge with optional midpoint handle, labels, and interactive features.
 * Follows the comprehensive test suite requirements and schema definitions.
 */

import React, { useCallback, useMemo, useRef } from 'react'
import type { StraightEdgeProps, EdgeInteractionEvent } from '../../../../schemas/api/edges'
import { calculateStraightPath, getPointAtRatio, getTangentAtRatio } from '../../../lib/svgPaths'

export interface StraightEdgeComponentProps extends StraightEdgeProps {
  onEdgeClick?: (event: EdgeInteractionEvent) => void
  onEdgeContextMenu?: (event: EdgeInteractionEvent) => void
  onEdgeHover?: (event: EdgeInteractionEvent) => void
  onMidpointDrag?: (newPosition: { x: number; y: number }) => void
  onDoubleClick?: (event: EdgeInteractionEvent) => void
}

export const StraightEdge: React.FC<StraightEdgeComponentProps> = ({
  id,
  source,
  target,
  path,
  style = {},
  label,
  visualState = {},
  showMidpointHandle = false,
  midpointHandle,
  data,
  onEdgeClick,
  onEdgeContextMenu,
  onEdgeHover,
  onMidpointDrag,
  onDoubleClick,
}) => {
  const pathRef = useRef<SVGPathElement>(null)
  
  // Calculate SVG path string
  const pathString = useMemo(() => {
    return calculateStraightPath(path.start, path.end)
  }, [path.start, path.end])

  // Calculate midpoint for handle
  const midpoint = useMemo(() => {
    return getPointAtRatio(path, 0.5)
  }, [path])

  // Calculate label position and rotation
  const labelTransform = useMemo(() => {
    if (!label) return null
    
    const labelPosition = getPointAtRatio(path, label.position)
    const tangent = getTangentAtRatio(path, label.position)
    
    // Calculate rotation angle from tangent
    const angle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI)
    
    // Adjust position based on offset
    const offsetX = -tangent.y * label.offset
    const offsetY = tangent.x * label.offset
    
    return {
      x: labelPosition.x + offsetX,
      y: labelPosition.y + offsetY,
      rotation: Math.abs(angle) > 90 ? angle + 180 : angle, // Keep text readable
    }
  }, [label, path])

  // Apply visual state styles
  const effectiveStyle = useMemo(() => {
    const baseStyle = {
      stroke: '#666666',
      strokeWidth: 2,
      opacity: 1,
      fill: 'none',
      ...style,
    }

    if (visualState.hovered) {
      baseStyle.strokeWidth = Math.max(baseStyle.strokeWidth * 1.5, 3)
    }

    if (visualState.selected) {
      baseStyle.stroke = baseStyle.stroke === '#666666' ? '#1e40af' : baseStyle.stroke
    }

    if (visualState.dragging) {
      baseStyle.opacity = Math.min(baseStyle.opacity * 0.8, 0.8)
    }

    return baseStyle
  }, [style, visualState])

  // Handle click events
  const handleClick = useCallback((event: React.MouseEvent<SVGPathElement>) => {
    if (!onEdgeClick) return

    const rect = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    onEdgeClick({
      type: 'click',
      edgeId: id,
      position,
      timestamp: Date.now(),
      event,
    })
  }, [id, onEdgeClick])

  // Handle context menu
  const handleContextMenu = useCallback((event: React.MouseEvent<SVGPathElement>) => {
    if (!onEdgeContextMenu) return
    
    event.preventDefault()
    
    const rect = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    onEdgeContextMenu({
      type: 'contextmenu',
      edgeId: id,
      position,
      timestamp: Date.now(),
      event,
    })
  }, [id, onEdgeContextMenu])

  // Handle double click
  const handleDoubleClick = useCallback((event: React.MouseEvent<SVGPathElement>) => {
    if (!onDoubleClick) return

    const rect = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }

    onDoubleClick({
      type: 'doubleclick',
      edgeId: id,
      position,
      timestamp: Date.now(),
      event,
    })
  }, [id, onDoubleClick])

  // Handle midpoint drag
  const handleMidpointMouseDown = useCallback((
    event: React.MouseEvent<SVGCircleElement>
  ) => {
    if (!onMidpointDrag) return

    event.stopPropagation()
    
    const startX = event.clientX
    const startY = event.clientY
    const startPosition = { ...midpoint }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      onMidpointDrag({
        x: startPosition.x + deltaX,
        y: startPosition.y + deltaY,
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [midpoint, onMidpointDrag])

  // CSS classes for styling
  const edgeClasses = [
    'canvas-edge',
    'straight-edge',
    visualState.selected && 'edge-selected',
    visualState.hovered && 'edge-hovered',
    visualState.dragging && 'edge-dragging',
    visualState.connecting && 'edge-connecting',
  ].filter(Boolean).join(' ')

  return (
    <g 
      data-testid="canvas-edge"
      data-edge-id={id}
      data-edge-type="straight"
      className={edgeClasses}
    >
      {/* Selection highlight (rendered behind main path) */}
      {visualState.selected && (
        <path
          data-testid="selection-highlight"
          d={pathString}
          stroke="#1e40af"
          strokeWidth={Math.max(effectiveStyle.strokeWidth + 4, 6)}
          fill="none"
          opacity="0.3"
          pointerEvents="none"
        />
      )}

      {/* Main edge path */}
      <path
        ref={pathRef}
        data-testid="edge-path"
        data-edge-id={id}
        d={pathString}
        className={edgeClasses}
        style={effectiveStyle}
        markerStart={style?.markerStart}
        markerEnd={style?.markerEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={onEdgeHover ? (e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          }
          onEdgeHover({
            type: 'mouseenter',
            edgeId: id,
            position,
            timestamp: Date.now(),
            event: e,
          })
        } : undefined}
        style={{
          cursor: visualState.dragging ? 'grabbing' : 'pointer',
        }}
      />

      {/* Midpoint handle */}
      {showMidpointHandle && (visualState.selected || visualState.hovered) && midpointHandle && (
        <circle
          data-testid="midpoint-handle"
          cx={midpoint.x}
          cy={midpoint.y}
          r={midpointHandle.radius}
          fill={midpointHandle.color}
          stroke="#ffffff"
          strokeWidth="2"
          className="midpoint-handle"
          style={{ cursor: 'grab' }}
          onMouseDown={handleMidpointMouseDown}
        />
      )}

      {/* Edge label */}
      {label && labelTransform && (
        <g 
          data-testid="edge-label"
          transform={`translate(${labelTransform.x}, ${labelTransform.y}) rotate(${labelTransform.rotation})`}
        >
          {/* Label background */}
          <rect
            data-testid="edge-label-background"
            x={-50} // Will be adjusted based on text width
            y={-label.fontSize / 2 - label.padding}
            width={100} // Will be adjusted based on text width
            height={label.fontSize + label.padding * 2}
            fill={label.backgroundColor}
            stroke={label.backgroundColor}
            strokeWidth="1"
            rx={label.padding}
            ry={label.padding}
            pointerEvents="none"
          />
          
          {/* Label text */}
          <text
            data-testid="edge-label-text"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={label.fontSize}
            fontFamily="Inter, sans-serif"
            fill={label.textColor}
            pointerEvents="none"
          >
            {label.text}
          </text>
        </g>
      )}

      {/* Flow animation (if enabled) */}
      {visualState.animated && (
        <circle
          data-testid="flow-animation"
          r="3"
          fill={style?.stroke || '#0066cc'}
          opacity="0.8"
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathString}
          />
        </circle>
      )}
    </g>
  )
}

export default StraightEdge