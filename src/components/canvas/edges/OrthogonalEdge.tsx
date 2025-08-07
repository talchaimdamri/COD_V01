/**
 * OrthogonalEdge Component
 * 
 * Renders an orthogonal (right-angle) edge with optional waypoints, corner radius, and interactive features.
 * Follows the comprehensive test suite requirements and schema definitions.
 */

import React, { useCallback, useMemo, useRef } from 'react'
import type { OrthogonalEdgeProps, EdgeInteractionEvent } from '../../../../schemas/api/edges'
import { calculateOrthogonalPath, generateOrthogonalWaypoints, getPointAtRatio, getTangentAtRatio } from '../../../lib/svgPaths'

export interface OrthogonalEdgeComponentProps extends OrthogonalEdgeProps {
  onEdgeClick?: (event: EdgeInteractionEvent) => void
  onEdgeContextMenu?: (event: EdgeInteractionEvent) => void
  onEdgeHover?: (event: EdgeInteractionEvent) => void
  onWaypointDrag?: (waypointIndex: number, newPosition: { x: number; y: number }) => void
  onDoubleClick?: (event: EdgeInteractionEvent) => void
}

export const OrthogonalEdge: React.FC<OrthogonalEdgeComponentProps> = ({
  id,
  source,
  target,
  path,
  style = {},
  label,
  visualState = {},
  cornerRadius = 5,
  waypoints,
  waypointHandles = [],
  showWaypoints = false,
  data,
  onEdgeClick,
  onEdgeContextMenu,
  onEdgeHover,
  onWaypointDrag,
  onDoubleClick,
}) => {
  const pathRef = useRef<SVGPathElement>(null)
  
  // Generate waypoints if not provided
  const effectiveWaypoints = useMemo(() => {
    if (waypoints && waypoints.length > 0) {
      return waypoints
    }
    return path.waypoints || generateOrthogonalWaypoints(path.start, path.end)
  }, [waypoints, path.waypoints, path.start, path.end])

  // Calculate SVG path string
  const pathString = useMemo(() => {
    return calculateOrthogonalPath(
      path.start,
      path.end,
      effectiveWaypoints,
      cornerRadius
    )
  }, [path.start, path.end, effectiveWaypoints, cornerRadius])

  // Calculate all path points (start, waypoints, end)
  const allPoints = useMemo(() => {
    return [path.start, ...effectiveWaypoints, path.end]
  }, [path.start, path.end, effectiveWaypoints])

  // Calculate label position and rotation
  const labelTransform = useMemo(() => {
    if (!label) return null
    
    const labelPosition = getPointAtRatio(path, label.position)
    const tangent = getTangentAtRatio(path, label.position)
    
    // For orthogonal edges, prefer horizontal text for better readability
    const angle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI)
    const isVertical = Math.abs(angle) > 45 && Math.abs(angle) < 135
    const rotation = isVertical ? 0 : angle // Keep text horizontal for vertical segments
    
    // Adjust position based on offset
    const offsetX = -tangent.y * label.offset
    const offsetY = tangent.x * label.offset
    
    return {
      x: labelPosition.x + offsetX,
      y: labelPosition.y + offsetY,
      rotation,
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

  // Handle waypoint drag
  const handleWaypointMouseDown = useCallback((
    waypointIndex: number,
    event: React.MouseEvent<SVGCircleElement>
  ) => {
    if (!onWaypointDrag) return

    event.stopPropagation()
    
    const startX = event.clientX
    const startY = event.clientY
    const waypoint = effectiveWaypoints[waypointIndex]
    const startPosition = { ...waypoint }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      
      onWaypointDrag(waypointIndex, {
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
  }, [effectiveWaypoints, onWaypointDrag])

  // CSS classes for styling
  const edgeClasses = [
    'canvas-edge',
    'orthogonal-edge',
    visualState.selected && 'edge-selected',
    visualState.hovered && 'edge-hovered',
    visualState.dragging && 'edge-dragging',
    visualState.connecting && 'edge-connecting',
  ].filter(Boolean).join(' ')

  return (
    <g 
      data-testid="canvas-edge"
      data-edge-id={id}
      data-edge-type="orthogonal"
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

      {/* Waypoint handles */}
      {showWaypoints && (visualState.selected || visualState.hovered) && (
        <g data-testid="waypoint-handles-group">
          {/* Waypoint guide lines */}
          {effectiveWaypoints.map((waypoint, index) => (
            <g key={`waypoint-guides-${index}`}>
              {index === 0 && (
                <line
                  x1={path.start.x}
                  y1={path.start.y}
                  x2={waypoint.x}
                  y2={waypoint.y}
                  stroke="#999999"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.4"
                  pointerEvents="none"
                />
              )}
              {index === effectiveWaypoints.length - 1 && (
                <line
                  x1={waypoint.x}
                  y1={waypoint.y}
                  x2={path.end.x}
                  y2={path.end.y}
                  stroke="#999999"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.4"
                  pointerEvents="none"
                />
              )}
              {index < effectiveWaypoints.length - 1 && (
                <line
                  x1={waypoint.x}
                  y1={waypoint.y}
                  x2={effectiveWaypoints[index + 1].x}
                  y2={effectiveWaypoints[index + 1].y}
                  stroke="#999999"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                  opacity="0.4"
                  pointerEvents="none"
                />
              )}
            </g>
          ))}

          {/* Waypoint handles */}
          {effectiveWaypoints.map((waypoint, index) => (
            <circle
              key={`waypoint-handle-${index}`}
              data-testid="waypoint-handle"
              cx={waypoint.x}
              cy={waypoint.y}
              r={waypointHandles[index]?.radius || 5}
              fill={waypointHandles[index]?.color || '#10b981'}
              stroke="#ffffff"
              strokeWidth="2"
              className="waypoint-handle"
              style={{ cursor: 'grab' }}
              onMouseDown={(e) => handleWaypointMouseDown(index, e)}
            />
          ))}
        </g>
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
            dur="3s" // Slower for orthogonal paths
            repeatCount="indefinite"
            path={pathString}
          />
        </circle>
      )}
    </g>
  )
}

export default OrthogonalEdge