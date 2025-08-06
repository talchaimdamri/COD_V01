import React, { useMemo } from 'react'
import { CanvasGridProps, CANVAS_CONFIG } from './types'

const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  viewBox, 
  scale, 
  visible = true, 
  className = '' 
}) => {
  if (!visible) return null

  // Calculate grid visibility and sizing based on zoom level
  const gridMetrics = useMemo(() => {
    const baseGridSize = CANVAS_CONFIG.GRID_SIZE
    const majorGridMultiplier = 5 // Every 5th line is major (40px at 1x scale)
    
    // Determine if we should show grid based on zoom level
    const minVisibleScale = 0.25 // Don't show grid when zoomed out too far
    const showGrid = scale >= minVisibleScale
    
    // Calculate grid sizes
    const minorGridSize = baseGridSize / scale // Size in world coordinates
    const majorGridSize = minorGridSize * majorGridMultiplier
    
    // Determine opacity based on scale
    const minorOpacity = Math.min(0.15, Math.max(0.05, (scale - 0.25) * 0.2))
    const majorOpacity = Math.min(0.3, Math.max(0.1, (scale - 0.25) * 0.4))
    const dotOpacity = Math.min(0.4, Math.max(0.1, (scale - 0.25) * 0.6))
    
    // Decide which elements to show based on scale
    const showDots = scale >= 0.5
    const showMinorLines = scale >= 0.75
    const showMajorLines = scale >= 0.25
    
    return {
      baseGridSize,
      minorGridSize,
      majorGridSize,
      minorOpacity,
      majorOpacity,
      dotOpacity,
      showGrid,
      showDots,
      showMinorLines,
      showMajorLines,
      majorGridMultiplier
    }
  }, [scale])

  // Early return if grid shouldn't be visible
  if (!gridMetrics.showGrid) return null

  // Use standard pattern IDs for test compatibility
  const patternId = "grid"
  const majorPatternId = "major-grid"

  return (
    <g 
      data-testid="canvas-grid" 
      className={`text-slate-400 ${className}`}
    >
      <defs>
        {/* Minor grid pattern with dots */}
        {gridMetrics.showDots && (
          <pattern
            id={patternId}
            width={gridMetrics.minorGridSize}
            height={gridMetrics.minorGridSize}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={gridMetrics.minorGridSize / 2}
              cy={gridMetrics.minorGridSize / 2}
              r={Math.max(0.5 / scale, 0.25)}
              fill="currentColor"
              opacity={gridMetrics.dotOpacity}
            />
          </pattern>
        )}
        
        {/* Major grid pattern with larger dots */}
        {gridMetrics.showDots && (
          <pattern
            id={majorPatternId}
            width={gridMetrics.majorGridSize}
            height={gridMetrics.majorGridSize}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={gridMetrics.majorGridSize / 2}
              cy={gridMetrics.majorGridSize / 2}
              r={Math.max(1 / scale, 0.5)}
              fill="currentColor"
              opacity={gridMetrics.majorOpacity}
            />
          </pattern>
        )}
      </defs>
      
      {/* Minor grid dots */}
      {gridMetrics.showDots && (
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill={`url(#${patternId})`}
          opacity={1}
        />
      )}
      
      {/* Major grid dots (overlay on minor) */}
      {gridMetrics.showDots && (
        <rect
          x={viewBox.x}
          y={viewBox.y}
          width={viewBox.width}
          height={viewBox.height}
          fill={`url(#${majorPatternId})`}
          opacity={1}
        />
      )}
      
      {/* Minor grid lines */}
      {gridMetrics.showMinorLines && (
        <GridLines
          viewBox={viewBox}
          gridSize={gridMetrics.minorGridSize}
          opacity={gridMetrics.minorOpacity}
          strokeWidth={0.5 / scale}
          className="minor-grid"
        />
      )}
      
      {/* Major grid lines */}
      {gridMetrics.showMajorLines && (
        <GridLines
          viewBox={viewBox}
          gridSize={gridMetrics.majorGridSize}
          opacity={gridMetrics.majorOpacity}
          strokeWidth={1 / scale}
          className="major-grid"
        />
      )}
    </g>
  )
}

// Separate component for grid lines to improve performance
const GridLines: React.FC<{
  viewBox: { x: number; y: number; width: number; height: number }
  gridSize: number
  opacity: number
  strokeWidth: number
  className?: string
}> = React.memo(({ viewBox, gridSize, opacity, strokeWidth, className }) => {
  const lines = useMemo(() => {
    // Calculate grid boundaries with some padding
    const startX = Math.floor((viewBox.x - gridSize) / gridSize) * gridSize
    const startY = Math.floor((viewBox.y - gridSize) / gridSize) * gridSize
    const endX = viewBox.x + viewBox.width + gridSize
    const endY = viewBox.y + viewBox.height + gridSize
    
    const verticalLines = []
    const horizontalLines = []
    
    // Generate vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      verticalLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={viewBox.y}
          x2={x}
          y2={viewBox.y + viewBox.height}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={opacity}
          vectorEffect="non-scaling-stroke"
        />
      )
    }
    
    // Generate horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      horizontalLines.push(
        <line
          key={`h-${y}`}
          x1={viewBox.x}
          y1={y}
          x2={viewBox.x + viewBox.width}
          y2={y}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          opacity={opacity}
          vectorEffect="non-scaling-stroke"
        />
      )
    }
    
    return [...verticalLines, ...horizontalLines]
  }, [viewBox, gridSize, opacity, strokeWidth])
  
  return <g className={className}>{lines}</g>
})

export default CanvasGrid