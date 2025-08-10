/**
 * Main Workspace Layout Component
 * Integrates Sidebar and Canvas with event sourcing and performance optimizations
 */

import React, { useCallback, useRef, useEffect, useState } from 'react'
import { Sidebar } from '../sidebar/Sidebar'
import Canvas from '../canvas/Canvas'
import { SidebarFactory } from '../../../schemas/api/sidebar'
import { DroppedItem, Position } from '../canvas/types'
import { ViewBox } from '../../../schemas/events/canvas'

interface WorkspaceLayoutProps {
  className?: string
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const workspaceRef = useRef<HTMLDivElement>(null)

  // Handle sidebar-to-canvas drop integration
  const handleItemDrop = useCallback((item: DroppedItem, position: Position) => {
    console.log('Item dropped from sidebar to canvas:', {
      item: {
        id: item.id,
        type: item.type,
        title: item.title,
      },
      position,
    })

    // Additional integration logic can be added here
    // For example, creating connections between items, 
    // logging analytics, triggering workflows, etc.
  }, [])

  // Handle canvas view changes for performance optimization
  const handleViewChange = useCallback((viewBox: ViewBox, scale: number) => {
    // This could be used to optimize sidebar visibility,
    // trigger lazy loading, or update URL state
    console.log('Canvas view changed:', { viewBox, scale })
  }, [])

  // Handle sidebar layout changes for canvas optimization
  const handleSidebarLayoutChange = useCallback((newLayout: any) => {
    // Trigger canvas performance optimization when sidebar resizes
    if (workspaceRef.current) {
      const canvasWidth = workspaceRef.current.offsetWidth - newLayout.width
      // Could trigger canvas resize optimizations here
    }
  }, [])

  // Initialize workspace
  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className={`workspace-layout ${className} h-screen flex items-center justify-center`}>
        <div className="text-muted-foreground">Loading workspace...</div>
      </div>
    )
  }

  return (
    <div 
      ref={workspaceRef}
      className={`workspace-layout ${className} h-screen flex overflow-hidden bg-background`}
      data-testid="workspace-layout"
    >
      {/* Left Sidebar */}
      <Sidebar
        config={SidebarFactory.createDefaultConfig()}
        onLayoutChange={handleSidebarLayoutChange}
        onStateChange={(stateChanges) => {
          console.log('Sidebar state changed:', stateChanges)
        }}
        className="flex-shrink-0"
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header/Toolbar Area (placeholder) */}
        <div className="flex-shrink-0 h-12 border-b border-border bg-card flex items-center px-4">
          <div className="text-sm font-medium text-foreground">
            Chain Workspace
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            Drag items from sidebar to canvas
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas
            className="w-full h-full"
            onItemDrop={handleItemDrop}
            onViewChange={handleViewChange}
            onNodeCreate={(type, position) => {
              console.log('Node created:', { type, position })
            }}
            onNodeMove={(nodeId, position) => {
              console.log('Node moved:', { nodeId, position })
            }}
            onNodeSelect={(nodeId) => {
              console.log('Node selected:', nodeId)
            }}
            onEdgeCreate={(sourceId, targetId, edgeType) => {
              console.log('Edge created:', { sourceId, targetId, edgeType })
            }}
            onEdgeSelect={(edgeId) => {
              console.log('Edge selected:', edgeId)
            }}
            onEdgeDelete={(edgeId) => {
              console.log('Edge deleted:', edgeId)
            }}
            onGridToggle={(showGrid) => {
              console.log('Grid toggled:', showGrid)
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default WorkspaceLayout