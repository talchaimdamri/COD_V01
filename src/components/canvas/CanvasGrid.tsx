import React from 'react'
import { CanvasGridProps, CANVAS_CONFIG } from './types'

const CanvasGrid: React.FC<CanvasGridProps> = ({ 
  viewBox, 
  scale, 
  visible = true, 
  className = '' 
}) => {
  if (!visible) return null

  const gridSize = CANVAS_CONFIG.GRID_SIZE
  const adjustedGridSize = gridSize * scale

  // Calculate grid parameters based on current view
  const startX = Math.floor(viewBox.x / adjustedGridSize) * adjustedGridSize
  const startY = Math.floor(viewBox.y / adjustedGridSize) * adjustedGridSize
  const endX = viewBox.x + viewBox.width
  const endY = viewBox.y + viewBox.height

  // Generate grid lines
  const verticalLines = []
  const horizontalLines = []

  // Vertical lines
  for (let x = startX; x <= endX; x += adjustedGridSize) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={viewBox.y}
        x2={x}
        y2={viewBox.y + viewBox.height}
        stroke="currentColor"
        strokeWidth={0.5}
        opacity={0.2}
      />
    )
  }

  // Horizontal lines
  for (let y = startY; y <= endY; y += adjustedGridSize) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={viewBox.x}
        y1={y}
        x2={viewBox.x + viewBox.width}
        y2={y}
        stroke="currentColor"
        strokeWidth={0.5}
        opacity={0.2}
      />
    )
  }

  return (
    <g 
      data-testid="canvas-grid" 
      className={`text-muted-foreground ${className}`}
    >
      <defs>
        <pattern
          id="grid"
          width={adjustedGridSize}
          height={adjustedGridSize}
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx={adjustedGridSize / 2}
            cy={adjustedGridSize / 2}
            r={0.5}
            fill="currentColor"
            opacity={0.3}
          />
        </pattern>
      </defs>
      
      {/* Grid pattern background */}
      <rect
        x={viewBox.x}
        y={viewBox.y}
        width={viewBox.width}
        height={viewBox.height}
        fill="url(#grid)"
        opacity={0.5}
      />
      
      {/* Grid lines for better visibility */}
      {verticalLines}
      {horizontalLines}
    </g>
  )
}

export default CanvasGrid