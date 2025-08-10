/**
 * Sidebar Container Component (Task 8.1)
 * 
 * Collapsible sidebar with resize functionality, state persistence,
 * and comprehensive integration with the sidebar object library system.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, debounce } from '../../lib/utils'
import { 
  SidebarConfig, 
  SidebarLayout,
  SidebarState,
  SidebarFactory 
} from '../../../schemas/api/sidebar'
import { SidebarSection } from './SidebarSection'
import { GlobalSearch } from './GlobalSearch'
import { useSidebarEventSourcing } from '../../lib/sidebarEventSourcing'
import { Position } from '../../../schemas/events/common'

interface SidebarProps {
  config?: SidebarConfig
  layout?: SidebarLayout
  onLayoutChange?: (newLayout: SidebarLayout) => void
  onStateChange?: (newState: Partial<SidebarState>) => void
  className?: string
  children?: React.ReactNode
}

const STORAGE_KEY = 'sidebar-layout-state'
const TRANSITION_DURATION = 250 // ms
const RESIZE_THROTTLE = 33 // ~30fps

export const Sidebar: React.FC<SidebarProps> = ({
  config = SidebarFactory.createDefaultConfig(),
  layout: initialLayout = SidebarFactory.createDefaultConfig().layout!,
  onLayoutChange,
  onStateChange,
  className,
  children
}) => {
  // Use event sourcing for state management
  const {
    sidebarLayout: layout,
    sidebarState,
    isLoading,
    error,
    canUndo,
    canRedo,
    updateLayout,
    toggleCollapse,
    resizeSidebar,
    searchSection,
    loadSectionData,
    itemsLoading,
    itemsError,
  } = useSidebarEventSourcing(initialLayout)
  
  // Local UI state for smooth interactions
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [savedWidth, setSavedWidth] = useState(layout.width)
  
  // Refs for drag resize functionality
  const sidebarRef = useRef<HTMLElement>(null)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  
  // Load saved state from localStorage on mount
  useEffect(() => {
    if (!layout.persistState) return
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const savedLayout = JSON.parse(saved) as Partial<SidebarLayout>
        const restoredLayout = {
          ...layout,
          ...savedLayout,
          isResizing: false, // Never restore as resizing
        }
        
        setLayout(restoredLayout)
        setSavedWidth(restoredLayout.isCollapsed ? savedLayout.width || layout.width : restoredLayout.width)
        onLayoutChange?.(restoredLayout)
      }
    } catch (error) {
      console.warn('Failed to restore sidebar layout from localStorage:', error)
    }
  }, []) // Only run on mount
  
  // Debounced save to localStorage
  const saveToStorage = useCallback(
    debounce((layoutToSave: SidebarLayout) => {
      if (!layoutToSave.persistState) return
      
      try {
        const toSave = {
          width: layoutToSave.width,
          isCollapsed: layoutToSave.isCollapsed,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      } catch (error) {
        console.warn('Failed to save sidebar layout to localStorage:', error)
      }
    }, 300),
    []
  )
  
  // Update layout with validation and persistence
  const updateLayoutLocal = useCallback(async (newLayout: SidebarLayout, trigger: 'user' | 'resize' | 'collapse' | 'auto' = 'user') => {
    // Validate width constraints
    const validatedLayout = {
      ...newLayout,
      width: Math.max(
        newLayout.minWidth, 
        Math.min(newLayout.maxWidth, newLayout.width)
      )
    }
    
    await updateLayout(validatedLayout, trigger)
    saveToStorage(validatedLayout)
    onLayoutChange?.(validatedLayout)
  }, [updateLayout, onLayoutChange, saveToStorage])
  
  // Toggle collapse/expand
  const toggleCollapseLocal = useCallback(async () => {
    setIsTransitioning(true)
    
    if (!layout.isCollapsed) {
      // Collapsing - save current width
      setSavedWidth(layout.width)
    }
    
    await toggleCollapse('toggle')
    
    // Clear transition class after animation
    setTimeout(() => {
      setIsTransitioning(false)
    }, TRANSITION_DURATION)
  }, [layout, toggleCollapse])
  
  // Mouse down handler for resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = layout.width
    
    updateLayoutLocal({ ...layout, isResizing: true }, 'resize')
    
    // Add global cursor style
    document.body.style.cursor = 'col-resize'
  }, [layout, updateLayoutLocal])
  
  // Throttled mouse move handler
  const handleMouseMove = useCallback(
    debounce((e: MouseEvent) => {
      if (!isResizing.current) return
      
      const deltaX = e.clientX - startX.current
      const newWidth = startWidth.current + deltaX
      
      updateLayoutLocal({
        ...layout,
        width: newWidth,
        isResizing: true
      }, 'resize')
    }, RESIZE_THROTTLE),
    [layout, updateLayoutLocal]
  )
  
  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    if (!isResizing.current) return
    
    isResizing.current = false
    document.body.style.cursor = ''
    
    // Use resizeSidebar for the final resize event
    const startPos: Position = { x: startX.current, y: 0 }
    const endPos: Position = { x: startX.current + (layout.width - startWidth.current), y: 0 }
    resizeSidebar(startWidth.current, layout.width, startPos, endPos, 'drag')
    
    updateLayoutLocal({
      ...layout,
      isResizing: false
    }, 'resize')
  }, [layout, updateLayoutLocal, resizeSidebar])
  
  // Setup and cleanup global mouse events
  useEffect(() => {
    if (layout.isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [layout.isResizing, handleMouseMove, handleMouseUp])
  
  // Keyboard event handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      toggleCollapseLocal()
    }
  }, [toggleCollapseLocal])
  
  // Compute dynamic classes
  const sidebarClasses = cn(
    'sidebar-container flex flex-col bg-card border-r border-border relative overflow-hidden',
    'transition-all duration-250 ease-in-out',
    {
      'sidebar-transitioning': isTransitioning,
      'sidebar-collapsed': layout.isCollapsed,
      'sidebar-resizing': layout.isResizing,
    },
    className
  )
  
  const contentClasses = cn(
    'sidebar-content flex-1 overflow-hidden',
    {
      'pointer-events-none': layout.isResizing,
    }
  )
  
  // Dynamic styles
  const sidebarStyle: React.CSSProperties = {
    width: `${layout.width}px`,
    minWidth: `${layout.minWidth}px`,
    maxWidth: `${layout.maxWidth}px`,
  }
  
  const ariaLabel = `Sidebar ${layout.isCollapsed ? 'collapsed' : 'expanded'}, width ${layout.width} pixels`
  
  return (
    <aside
      ref={sidebarRef}
      data-testid="sidebar-container"
      data-collapsed={layout.isCollapsed}
      data-resizing={layout.isResizing}
      className={sidebarClasses}
      style={sidebarStyle}
      aria-label={ariaLabel}
      role="complementary"
    >
      {/* Toggle Button */}
      <button
        data-testid="sidebar-toggle-button"
        className={cn(
          'absolute top-4 -right-3 z-10 w-6 h-6 bg-background border border-border rounded-full',
          'flex items-center justify-center shadow-md hover:shadow-lg',
          'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50',
          'text-muted-foreground hover:text-foreground'
        )}
        onClick={toggleCollapseLocal}
        onKeyDown={handleKeyDown}
        aria-expanded={!layout.isCollapsed}
        aria-label={`${layout.isCollapsed ? 'Expand' : 'Collapse'} sidebar`}
        tabIndex={0}
      >
        {layout.isCollapsed ? (
          <ChevronRight size={12} />
        ) : (
          <ChevronLeft size={12} />
        )}
      </button>
      
      {/* Resize Handle */}
      {!layout.isCollapsed && (
        <div
          data-testid="sidebar-resize-handle"
          className={cn(
            'absolute top-0 right-0 w-1 h-full cursor-col-resize z-10',
            'hover:bg-primary/20 active:bg-primary/30 transition-colors',
            'bg-transparent hover:bg-gradient-to-r hover:from-transparent hover:to-primary/10'
          )}
          onMouseDown={handleMouseDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
        />
      )}
      
      {/* Sidebar Content */}
      <div className={contentClasses}>
        {/* Global Search */}
        {config.globalSearch?.enabled && !layout.isCollapsed && (
          <div className="p-3 border-b border-border">
            <GlobalSearch 
              config={config.globalSearch}
              onSearch={(term) => {
                searchSection(term, undefined, 'global')
              }}
            />
          </div>
        )}
        
        {/* Sections Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {config.sections
            .filter(section => section.isVisible)
            .sort((a, b) => a.order - b.order)
            .map(sectionConfig => (
              <SidebarSection
                key={sectionConfig.id}
                config={sectionConfig}
                isCollapsed={layout.isCollapsed}
                sectionState={sidebarState.sections[sectionConfig.id]}
                isLoading={itemsLoading[sectionConfig.id] || false}
                error={itemsError[sectionConfig.id] || null}
                onSearch={(term) => searchSection(term, sectionConfig.id, 'local')}
                onLoadData={() => loadSectionData(sectionConfig.id)}
                onStateChange={(sectionState) => {
                  onStateChange?.({
                    sections: {
                      [sectionConfig.id]: sectionState
                    }
                  })
                }}
              />
            ))
          }
        </div>
        
        {/* Custom Children */}
        {children}
      </div>
    </aside>
  )
}

export default Sidebar