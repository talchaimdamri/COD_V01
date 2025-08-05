import React, { useState } from 'react'
import { FileText, Bot, List } from 'lucide-react'

interface SidebarNode {
  id: string
  type: 'document' | 'agent'
  title: string
}

const Sidebar: React.FC = () => {
  const [nodes, setNodes] = useState<SidebarNode[]>([])

  const [isCreating, setIsCreating] = useState(false)

  const handleCreateDocument = async () => {
    if (isCreating) return // Prevent multiple rapid clicks
    setIsCreating(true)
    
    try {
      // Call canvas create document function if available
      if (typeof window !== 'undefined' && (window as any).canvasCreateDocument) {
        const newNode = (window as any).canvasCreateDocument()
        console.log('Sidebar: Document created', newNode) // Debug log
        if (newNode && newNode.id) {
          setNodes(prev => [...prev, {
            id: newNode.id,
            type: 'document',
            title: newNode.title,
          }])
        }
      }
    } finally {
      setTimeout(() => setIsCreating(false), 500) // Prevent rapid clicks
    }
  }

  const handleCreateAgent = async () => {
    if (isCreating) return // Prevent multiple rapid clicks
    setIsCreating(true)
    
    try {
      // Call canvas create agent function if available
      if (typeof window !== 'undefined' && (window as any).canvasCreateAgent) {
        const newNode = (window as any).canvasCreateAgent()
        console.log('Sidebar: Agent created', newNode) // Debug log
        if (newNode && newNode.id) {
          setNodes(prev => [...prev, {
            id: newNode.id,
            type: 'agent',
            title: newNode.title,
          }])
        }
      }
    } finally {
      setTimeout(() => setIsCreating(false), 500) // Prevent rapid clicks
    }
  }

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
            <span className="text-sm font-medium text-foreground">Nodes</span>
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
                  className="flex items-center gap-2 p-2 rounded border border-border hover:bg-accent/50 transition-colors cursor-pointer"
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
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <button
            data-testid="reset-view-button"
            className="flex-1 px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            onClick={() => {
              // Reset canvas view
              if (typeof window !== 'undefined') {
                const event = new KeyboardEvent('keydown', { key: 'r' })
                document.dispatchEvent(event)
              }
            }}
          >
            Reset View
          </button>
          <button
            data-testid="zoom-in-button"
            className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: '=' })
              document.dispatchEvent(event)
            }}
          >
            +
          </button>
          <button
            data-testid="zoom-out-button"
            className="px-3 py-2 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: '-' })
              document.dispatchEvent(event)
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