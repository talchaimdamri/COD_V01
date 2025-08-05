import React, { useState, useCallback } from 'react'
import { FileText, Bot, List } from 'lucide-react'
import { useCanvasEventSourcing } from '../../lib/eventSourcing'

interface SidebarNode {
  id: string
  type: 'document' | 'agent'
  title: string
}

const Sidebar: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false)
  
  // Use event sourcing to get canvas state and actions
  const { canvasState, addNode, resetView, zoomCanvas, canUndo, canRedo, undo, redo } = useCanvasEventSourcing()
  
  // Derive nodes from canvas state
  const nodes: SidebarNode[] = canvasState.nodes.map(node => ({
    id: node.id,
    type: node.type,
    title: node.title,
  }))

  const handleCreateDocument = useCallback(async () => {
    if (isCreating) return // Prevent multiple rapid clicks
    setIsCreating(true)
    
    try {
      // Create document node at center of current view
      const position = {
        x: canvasState.viewBox.x + canvasState.viewBox.width / 2,
        y: canvasState.viewBox.y + canvasState.viewBox.height / 2,
      }
      
      const title = `Document ${canvasState.nodes.filter(n => n.type === 'document').length + 1}`
      await addNode('document', position, title)
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setTimeout(() => setIsCreating(false), 500) // Prevent rapid clicks
    }
  }, [isCreating, canvasState, addNode])

  const handleCreateAgent = useCallback(async () => {
    if (isCreating) return // Prevent multiple rapid clicks
    setIsCreating(true)
    
    try {
      // Create agent node at center of current view, offset slightly from documents
      const position = {
        x: canvasState.viewBox.x + canvasState.viewBox.width / 2 + 50,
        y: canvasState.viewBox.y + canvasState.viewBox.height / 2,
      }
      
      const title = `Agent ${canvasState.nodes.filter(n => n.type === 'agent').length + 1}`
      await addNode('agent', position, title)
    } catch (error) {
      console.error('Failed to create agent:', error)
    } finally {
      setTimeout(() => setIsCreating(false), 500) // Prevent rapid clicks
    }
  }, [isCreating, canvasState, addNode])

  return (
    <aside 
      data-testid="sidebar" 
      className="w-64 bg-card border-r border-border flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">Chain Workspace</h1>
        <p className="text-sm text-muted-foreground">Build document workflows</p>
      </div>

      {/* Toolbar */}
      <div className="p-4 space-y-2">
        <button
          data-testid="add-doc-button"
          onClick={handleCreateDocument}
          disabled={isCreating}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            isCreating 
              ? 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed' 
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <FileText size={16} />
          Add Document
        </button>
        
        <button
          data-testid="add-agent-button"
          onClick={handleCreateAgent}
          disabled={isCreating}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
            isCreating 
              ? 'bg-secondary/50 text-secondary-foreground/50 cursor-not-allowed' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Bot size={16} />
          Add Agent
        </button>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <List size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Nodes ({nodes.length})
            </span>
          </div>
          
          <div data-testid="sidebar-node-list" className="space-y-2">
            {nodes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No nodes created yet
              </p>
            ) : (
              nodes.map((node) => (
                <div
                  key={node.id}
                  data-node-type={node.type}
                  className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer ${
                    canvasState.selectedNodeId === node.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-accent/50'
                  }`}
                >
                  {node.type === 'document' ? (
                    <FileText size={14} className="text-primary" />
                  ) : (
                    <Bot size={14} className="text-green-500" />
                  )}
                  <span 
                    data-testid="node-title" 
                    className="text-sm text-foreground flex-1"
                  >
                    {node.title}
                  </span>
                  {canvasState.selectedNodeId === node.id && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {/* Undo/Redo buttons */}
        <div className="flex gap-2 mb-2">
          <button
            data-testid="undo-button"
            className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
              canUndo 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            data-testid="redo-button"
            className={`flex-1 px-3 py-2 text-xs rounded transition-colors ${
              canRedo 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </div>
        
        {/* View controls */}
        <div className="flex gap-2">
          <button
            data-testid="reset-view-button"
            className="flex-1 px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            onClick={async () => {
              try {
                await resetView(canvasState.viewBox, canvasState.scale, 'button')
              } catch (error) {
                console.error('Failed to reset view:', error)
              }
            }}
          >
            Reset View
          </button>
          <button
            data-testid="zoom-in-button"
            className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            onClick={async () => {
              try {
                const newScale = Math.min(5.0, canvasState.scale * 1.2)
                const centerPos = {
                  x: canvasState.viewBox.x + canvasState.viewBox.width / 2,
                  y: canvasState.viewBox.y + canvasState.viewBox.height / 2,
                }
                const scaleFactor = newScale / canvasState.scale
                const newViewBox = {
                  x: centerPos.x - (centerPos.x - canvasState.viewBox.x) * scaleFactor,
                  y: centerPos.y - (centerPos.y - canvasState.viewBox.y) * scaleFactor,
                  width: canvasState.viewBox.width * scaleFactor,
                  height: canvasState.viewBox.height * scaleFactor,
                }
                await zoomCanvas(canvasState.scale, newScale, canvasState.viewBox, newViewBox, centerPos)
              } catch (error) {
                console.error('Failed to zoom in:', error)
              }
            }}
          >
            +
          </button>
          <button
            data-testid="zoom-out-button"
            className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            onClick={async () => {
              try {
                const newScale = Math.max(0.1, canvasState.scale * 0.8)
                const centerPos = {
                  x: canvasState.viewBox.x + canvasState.viewBox.width / 2,
                  y: canvasState.viewBox.y + canvasState.viewBox.height / 2,
                }
                const scaleFactor = newScale / canvasState.scale
                const newViewBox = {
                  x: centerPos.x - (centerPos.x - canvasState.viewBox.x) * scaleFactor,
                  y: centerPos.y - (centerPos.y - canvasState.viewBox.y) * scaleFactor,
                  width: canvasState.viewBox.width * scaleFactor,
                  height: canvasState.viewBox.height * scaleFactor,
                }
                await zoomCanvas(canvasState.scale, newScale, canvasState.viewBox, newViewBox, centerPos)
              } catch (error) {
                console.error('Failed to zoom out:', error)
              }
            }}
          >
            -
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar