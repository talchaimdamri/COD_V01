/**
 * Inspector Panel Base Component (Task 9.1)
 * 
 * Context-sensitive inspector panel that slides in from the right when an AgentNode is selected.
 * Provides agent configuration interface with smooth animations and responsive design.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Agent } from '../../schemas/database/agent'
import { AgentConfigForm, type AgentFormData } from './AgentConfigForm'

export interface InspectorPanelLayout {
  isOpen: boolean
  width: number
  minWidth: number
  maxWidth: number
  position: 'left' | 'right'
  animationDuration: number
  hasBackdrop: boolean
  backdropOpacity: number
  zIndex: number
}

// Types for models and tools (should match test fixtures)
interface ModelOption {
  id: string
  name: string
  provider: string
  description: string
  capabilities: string[]
  maxTokens: number
  costPer1k: number
  isAvailable: boolean
  recommendedFor: string[]
  performance: {
    speed: number
    quality: number
    reasoning: number
  }
}

interface ToolOption {
  id: string
  name: string
  description: string
  category: string
  icon: string
  isEnabled: boolean
  isRequired: boolean
  permissions: string[]
  config?: Record<string, any>
  compatibleModels: string[]
  performanceImpact: number
}

export interface InspectorPanelProps {
  layout: InspectorPanelLayout
  selectedAgent: Agent | null | undefined
  availableModels?: ModelOption[]
  availableTools?: ToolOption[]
  onLayoutChange?: (layout: InspectorPanelLayout) => void
  onAgentUpdate?: (agent: Agent, formData: AgentFormData) => void | Promise<void>
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  layout,
  selectedAgent,
  availableModels = [],
  availableTools = [],
  onLayoutChange,
  onAgentUpdate,
}) => {
  const panelRef = useRef<HTMLDivElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationClass, setAnimationClass] = useState('')

  // Determine if panel should be open
  const isOpen = layout.isOpen && selectedAgent !== null && selectedAgent !== undefined

  // Calculate constrained width
  const constrainedWidth = Math.max(
    layout.minWidth,
    Math.min(layout.width, layout.maxWidth)
  )

  // Handle full-width on small screens
  const finalWidth = window.innerWidth < 768 && constrainedWidth >= window.innerWidth 
    ? window.innerWidth 
    : constrainedWidth

  // Calculate z-index with fallback
  const finalZIndex = layout.zIndex > 0 ? layout.zIndex : 1000
  const backdropZIndex = finalZIndex - 1

  // Track previous open state to detect state changes
  const prevIsOpenRef = useRef(isOpen)
  
  // Handle animation state changes
  useEffect(() => {
    const prevIsOpen = prevIsOpenRef.current
    
    if (isOpen && !prevIsOpen) {
      // Opening animation
      setIsAnimating(true)
      setAnimationClass('inspector-panel-transitioning inspector-panel-entering')
    } else if (!isOpen && prevIsOpen) {
      // Closing animation
      setIsAnimating(true)
      setAnimationClass('inspector-panel-transitioning inspector-panel-exiting')
    }

    // Update previous state
    prevIsOpenRef.current = isOpen

    // Clear animation classes after duration
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setAnimationClass('')
      }, layout.animationDuration)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, layout.animationDuration, isAnimating])

  // Handle close actions
  const handleClose = useCallback(() => {
    if (onLayoutChange) {
      onLayoutChange({
        ...layout,
        isOpen: false,
      })
    }
  }, [layout, onLayoutChange])

  // Handle form submission
  const handleAgentFormSubmit = useCallback(async (formData: AgentFormData) => {
    if (selectedAgent && onAgentUpdate) {
      try {
        await onAgentUpdate(selectedAgent, formData)
      } catch (error) {
        console.error('Agent update failed:', error)
      }
    }
  }, [selectedAgent, onAgentUpdate])

  // Handle form changes (real-time updates)
  const handleAgentFormChange = useCallback((partialData: Partial<AgentFormData>) => {
    // For now, just log the changes - could be used for live preview
    console.log('Form data changed:', partialData)
  }, [])

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    handleClose()
  }, [handleClose])

  // Handle close button click
  const handleCloseButtonClick = useCallback(() => {
    handleClose()
  }, [handleClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, handleClose])

  // Focus trap (basic implementation)
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length > 0) {
        // Focus first focusable element (likely the close button)
        const firstFocusable = focusableElements[0] as HTMLElement
        setTimeout(() => firstFocusable.focus(), 10) // Small delay to ensure DOM is ready
      }
    }
  }, [isOpen])

  // Transform value based on panel state
  const transformValue = isOpen ? 'translateX(0%)' : 'translateX(100%)'

  // Animation duration with fallback
  const animationDurationMs = layout.animationDuration || 300

  return (
    <>
      {/* Backdrop */}
      {layout.hasBackdrop && isOpen && (
        <>
          <div
            data-testid="inspector-backdrop"
            className={`backdrop-transitioning ${isAnimating ? 'backdrop-animating' : ''}`}
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              width: '100vw',
              height: '100vh',
              backgroundColor: `rgba(0, 0, 0, ${layout.backdropOpacity})`,
              zIndex: backdropZIndex,
              transition: `opacity ${animationDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
            onClick={handleBackdropClick}
          />
          {/* Screen reader announcement */}
          <div
            data-testid="inspector-announcement"
            aria-live="polite"
            className="sr-only"
          >
            Inspector panel opened
          </div>
        </>
      )}

      {/* Inspector Panel */}
      <div
        ref={panelRef}
        data-testid="inspector-panel"
        data-open={isOpen}
        className={`inspector-panel ${animationClass}`}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-hidden={!isOpen}
        aria-labelledby={isOpen ? 'inspector-panel-title' : undefined}
        style={{
          position: 'fixed',
          top: '0',
          right: '0',
          height: '100vh',
          width: finalWidth === window.innerWidth ? '100vw' : `${finalWidth}px`,
          zIndex: finalZIndex,
          transform: transformValue,
          transition: `transform ${animationDurationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          backgroundColor: 'white',
          borderLeft: '1px solid #e5e7eb',
          boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Panel Header */}
        {isOpen && (
          <div className="inspector-panel-header" style={{ 
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2
              id="inspector-panel-title"
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              Agent Configuration
            </h2>
            <button
              data-testid="inspector-close-button"
              aria-label="Close inspector panel"
              onClick={handleCloseButtonClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCloseButtonClick()
                }
              }}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Panel Content */}
        {isOpen && selectedAgent && (
          <div
            data-testid="inspector-content"
            className="inspector-content"
            style={{
              flex: '1 1 auto',
              overflow: 'auto',
              padding: '0', // Remove padding since form has its own
            }}
          >
            <AgentConfigForm
              agent={selectedAgent}
              availableModels={availableModels}
              availableTools={availableTools}
              onSubmit={handleAgentFormSubmit}
              onChange={handleAgentFormChange}
            />
          </div>
        )}
      </div>
    </>
  )
}