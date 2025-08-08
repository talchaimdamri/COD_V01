/**
 * Sidebar Section Component (Task 8.3)
 * 
 * Individual section components for Chains, Documents, and Agents
 * with search bars, filtering, and virtualized list integration.
 */

import React, { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, Filter } from 'lucide-react'
import { cn } from '../../lib/utils'
import { 
  SidebarSectionConfig,
  SidebarObjectItem,
  FilterState,
  SearchConfig,
  SidebarFactory 
} from '../../../schemas/api/sidebar'
import { VirtualizedList } from './VirtualizedList'
import { SearchBar } from './SearchBar'
import { FilterPanel } from './FilterPanel'
import { SidebarItem } from './SidebarItem'

interface SidebarSectionProps {
  config: SidebarSectionConfig
  items?: SidebarObjectItem[]
  isCollapsed?: boolean
  searchConfig?: SearchConfig
  onStateChange?: (state: any) => void
  onItemSelect?: (item: SidebarObjectItem) => void
  onItemDrag?: (item: SidebarObjectItem, event: React.DragEvent) => void
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  config,
  items = [],
  isCollapsed = false,
  searchConfig = SidebarFactory.createSearchConfig(),
  onStateChange,
  onItemSelect,
  onItemDrag
}) => {
  // Component state
  const [isSectionCollapsed, setIsSectionCollapsed] = useState(config.isCollapsed)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterState, setFilterState] = useState<FilterState>({
    searchTerm: '',
    activeFilters: {},
    availableFilters: [],
    isFiltering: false,
    resultCount: 0,
    totalCount: 0
  })

  // Filter and search items
  const filteredItems = useMemo(() => {
    let filtered = items

    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item => {
        const searchableText = [
          item.metadata.name,
          item.metadata.description,
          ...(item.metadata.tags || [])
        ].join(' ').toLowerCase()
        
        return searchableText.includes(term)
      })
    }

    // Apply active filters
    Object.entries(filterState.activeFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = (item.metadata as any)[key]
          
          if (Array.isArray(value)) {
            return Array.isArray(itemValue) 
              ? itemValue.some(v => value.includes(v))
              : value.includes(itemValue)
          }
          
          return itemValue === value
        })
      }
    })

    return filtered
  }, [items, searchTerm, filterState.activeFilters])

  // Toggle section collapse
  const toggleCollapse = useCallback(() => {
    const newCollapsed = !isSectionCollapsed
    setIsSectionCollapsed(newCollapsed)
    
    onStateChange?.({
      config: { ...config, isCollapsed: newCollapsed },
      filter: { ...filterState, resultCount: filteredItems.length }
    })
  }, [isSectionCollapsed, config, filterState, filteredItems.length, onStateChange])

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    
    const newFilterState = {
      ...filterState,
      searchTerm: term,
      resultCount: filteredItems.length,
      totalCount: items.length
    }
    
    setFilterState(newFilterState)
    onStateChange?.({
      filter: newFilterState
    })
  }, [filterState, filteredItems.length, items.length, onStateChange])

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    const newFilterState = {
      ...filterState,
      activeFilters: newFilters,
      isFiltering: Object.keys(newFilters).some(key => newFilters[key] !== null),
      resultCount: filteredItems.length,
      totalCount: items.length
    }
    
    setFilterState(newFilterState)
    onStateChange?.({
      filter: newFilterState
    })
  }, [filterState, filteredItems.length, items.length, onStateChange])

  // Render section icon
  const renderIcon = () => {
    if (!config.icon) return null
    
    // You would typically import actual icons here
    // For now, using placeholder based on section type
    const IconComponent = config.id === 'chains' ? ChevronRight :
                         config.id === 'documents' ? Search :
                         config.id === 'agents' ? Filter : ChevronRight
    
    return <IconComponent size={16} className="text-muted-foreground" />
  }

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggleCollapse()
    }
  }, [toggleCollapse])

  // If parent sidebar is collapsed, show only icon
  if (isCollapsed) {
    return (
      <div
        data-testid={`sidebar-section-${config.id}`}
        data-collapsed="true"
        className="p-3 flex justify-center border-b border-border"
        title={config.title}
      >
        <div data-testid={`sidebar-section-icon-${config.id}`}>
          {renderIcon()}
        </div>
      </div>
    )
  }

  return (
    <div
      data-testid={`sidebar-section-${config.id}`}
      data-collapsed={isSectionCollapsed}
      className={cn(
        'border-b border-border transition-all duration-200',
        {
          'bg-muted/30': isSectionCollapsed
        }
      )}
    >
      {/* Section Header */}
      <button
        className={cn(
          'w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-accent/50',
          'transition-colors focus:outline-none focus:bg-accent/50'
        )}
        onClick={toggleCollapse}
        onKeyDown={handleKeyDown}
        aria-expanded={!isSectionCollapsed}
        aria-controls={`${config.id}-section-content`}
      >
        {/* Collapse Indicator */}
        <div className="flex-shrink-0">
          {isSectionCollapsed ? (
            <ChevronRight size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
        
        {/* Section Icon */}
        <div data-testid={`sidebar-section-icon-${config.id}`}>
          {renderIcon()}
        </div>
        
        {/* Section Title */}
        <span className="flex-1 text-sm font-medium text-foreground">
          {config.title}
        </span>
        
        {/* Item Count */}
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
          {filteredItems.length}
        </span>
      </button>
      
      {/* Section Content */}
      {!isSectionCollapsed && (
        <div
          id={`${config.id}-section-content`}
          data-testid={`${config.id}-section-content`}
          className="pb-2"
          style={{ display: isCollapsed ? 'none' : 'block' }}
        >
          {/* Search Bar */}
          {config.enableSearch && (
            <div className="px-4 pb-2">
              <SearchBar
                config={searchConfig}
                value={searchTerm}
                onChange={handleSearch}
                placeholder={`Search ${config.title.toLowerCase()}...`}
              />
            </div>
          )}
          
          {/* Filter Toggle */}
          {config.enableFilters && (
            <div className="px-4 pb-2">
              <button
                className={cn(
                  'flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground',
                  'transition-colors',
                  { 'text-primary': showFilters }
                )}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter size={12} />
                Filters
                {filterState.isFiltering && (
                  <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-xs">
                    {Object.keys(filterState.activeFilters).filter(k => filterState.activeFilters[k]).length}
                  </span>
                )}
              </button>
            </div>
          )}
          
          {/* Filter Panel */}
          {showFilters && config.enableFilters && (
            <div className="px-4 pb-2">
              <FilterPanel
                filters={filterState.availableFilters}
                activeFilters={filterState.activeFilters}
                onChange={handleFilterChange}
              />
            </div>
          )}
          
          {/* Items List */}
          <div className="px-2">
            {filteredItems.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {searchTerm || filterState.isFiltering ? (
                  <span>No {config.title.toLowerCase()} match your search</span>
                ) : (
                  <span>No {config.title.toLowerCase()} available</span>
                )}
              </div>
            ) : config.enableVirtualization && filteredItems.length > 50 ? (
              <VirtualizedList
                items={filteredItems}
                itemHeight={60}
                onItemSelect={onItemSelect}
                onItemDrag={onItemDrag}
                renderItem={(item) => (
                  <SidebarItem
                    key={item.metadata.id}
                    item={item}
                    onSelect={() => onItemSelect?.(item)}
                    onDragStart={(e) => onItemDrag?.(item, e)}
                  />
                )}
              />
            ) : (
              <div className="space-y-1">
                {filteredItems.map(item => (
                  <SidebarItem
                    key={item.metadata.id}
                    item={item}
                    onSelect={() => onItemSelect?.(item)}
                    onDragStart={(e) => onItemDrag?.(item, e)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SidebarSection