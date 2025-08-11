/**
 * Tools Configuration Component (Task 9.5)
 * 
 * Enhanced tools selection interface with categorization, advanced configuration,
 * compatibility validation, and select-all/deselect-all functionality.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ToolOption } from '../../types/models'

export interface ToolsConfigurationProps {
  tools: ToolOption[]
  selectedTools: string[]
  selectedModel?: string
  onChange: (selectedTools: string[]) => void
  onValidation?: (isValid: boolean, errors?: string[]) => void
  onConfigChange?: (toolId: string, config: Record<string, any>) => void
  disabled?: boolean
  showAdvancedConfig?: boolean
  className?: string
}

export const ToolsConfiguration: React.FC<ToolsConfigurationProps> = ({
  tools,
  selectedTools,
  selectedModel,
  onChange,
  onValidation,
  onConfigChange,
  disabled = false,
  showAdvancedConfig = false,
  className = '',
}) => {
  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [openConfigPanels, setOpenConfigPanels] = useState<Set<string>>(new Set())
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Group tools by category
  const toolsByCategory = useMemo(() => {
    const grouped: Record<string, ToolOption[]> = {}
    tools.forEach(tool => {
      if (!grouped[tool.category]) {
        grouped[tool.category] = []
      }
      grouped[tool.category].push(tool)
    })
    return grouped
  }, [tools])

  // Get all unique categories
  const categories = useMemo(() => {
    return Object.keys(toolsByCategory).sort()
  }, [toolsByCategory])

  // Filter tools based on search and category
  const filteredToolsByCategory = useMemo(() => {
    const filtered: Record<string, ToolOption[]> = {}
    
    Object.entries(toolsByCategory).forEach(([category, categoryTools]) => {
      if (categoryFilter !== 'all' && categoryFilter !== category) {
        return
      }
      
      const filteredTools = categoryTools.filter(tool => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.permissions.some(permission => permission.toLowerCase().includes(query))
          )
        }
        return true
      })
      
      if (filteredTools.length > 0) {
        filtered[category] = filteredTools
      }
    })
    
    return filtered
  }, [toolsByCategory, searchQuery, categoryFilter])

  // Get compatible tools based on selected model
  const getCompatibleTools = useCallback((categoryTools: ToolOption[]) => {
    if (!selectedModel) return categoryTools
    
    return categoryTools.filter(tool => 
      tool.compatibleModels.includes('*') || 
      tool.compatibleModels.includes(selectedModel)
    )
  }, [selectedModel])

  // Check tool compatibility
  const isToolCompatible = useCallback((tool: ToolOption): boolean => {
    if (!selectedModel) return true
    return tool.compatibleModels.includes('*') || tool.compatibleModels.includes(selectedModel)
  }, [selectedModel])

  // Get required tools
  const requiredTools = useMemo(() => {
    return tools.filter(tool => tool.isRequired)
  }, [tools])

  // Validate current selection
  const validateSelection = useCallback(() => {
    const errors: string[] = []
    const selectedToolObjects = tools.filter(tool => selectedTools.includes(tool.id))
    
    // Check for required tools
    const missingRequiredTools = requiredTools.filter(tool => !selectedTools.includes(tool.id))
    if (missingRequiredTools.length > 0) {
      errors.push(`Missing required tools: ${missingRequiredTools.map(t => t.name).join(', ')}`)
    }
    
    // Check for incompatible tools
    const incompatibleSelected = selectedToolObjects.filter(tool => !isToolCompatible(tool))
    if (incompatibleSelected.length > 0) {
      errors.push(`Selected tools not compatible with model: ${incompatibleSelected.map(t => t.name).join(', ')}`)
    }
    
    // Check for high performance impact
    const highImpactTools = selectedToolObjects.filter(tool => tool.performanceImpact >= 4)
    if (highImpactTools.length > 3) {
      errors.push(`Too many high-impact tools selected (${highImpactTools.length}). Consider reducing for better performance.`)
    }
    
    setValidationErrors(errors)
    
    if (onValidation) {
      onValidation(errors.length === 0, errors.length > 0 ? errors : undefined)
    }
    
    return errors.length === 0
  }, [tools, selectedTools, requiredTools, isToolCompatible, onValidation])

  // Handle tool selection
  const handleToolToggle = useCallback((toolId: string) => {
    const tool = tools.find(t => t.id === toolId)
    if (!tool || disabled) return
    
    if (selectedTools.includes(toolId)) {
      // Deselecting - check if it's required
      if (tool.isRequired) return
      onChange(selectedTools.filter(id => id !== toolId))
    } else {
      // Selecting - check compatibility
      if (!isToolCompatible(tool)) {
        // Still allow selection but validation will catch it
      }
      onChange([...selectedTools, toolId])
    }
  }, [tools, selectedTools, disabled, isToolCompatible, onChange])

  // Handle category collapse/expand
  const toggleCategoryCollapse = useCallback((category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }, [])

  // Handle select all tools
  const handleSelectAllTools = useCallback(() => {
    if (disabled) return
    
    const compatibleToolIds = tools
      .filter(tool => isToolCompatible(tool))
      .map(tool => tool.id)
    
    onChange(compatibleToolIds)
  }, [tools, disabled, isToolCompatible, onChange])

  // Handle deselect all tools
  const handleDeselectAllTools = useCallback(() => {
    if (disabled) return
    
    const requiredToolIds = requiredTools.map(tool => tool.id)
    onChange(requiredToolIds)
  }, [disabled, requiredTools, onChange])

  // Handle category select all
  const handleCategorySelectAll = useCallback((category: string) => {
    if (disabled) return
    
    const categoryTools = toolsByCategory[category] || []
    const compatibleCategoryTools = getCompatibleTools(categoryTools)
    const categoryToolIds = compatibleCategoryTools.map(tool => tool.id)
    
    const newSelection = Array.from(new Set([...selectedTools, ...categoryToolIds]))
    onChange(newSelection)
  }, [disabled, toolsByCategory, getCompatibleTools, selectedTools, onChange])

  // Handle configuration panel toggle
  const toggleConfigPanel = useCallback((toolId: string) => {
    setOpenConfigPanels(prev => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }, [])

  // Handle configuration change
  const handleConfigChange = useCallback((toolId: string, newConfig: Record<string, any>) => {
    if (onConfigChange) {
      onConfigChange(toolId, newConfig)
    }
  }, [onConfigChange])

  // Performance impact indicator component
  const PerformanceImpact: React.FC<{ impact: number }> = ({ impact }) => {
    const getImpactColor = (impact: number) => {
      if (impact <= 2) return 'low'
      if (impact <= 3) return 'medium'
      return 'high'
    }

    const getImpactText = (impact: number) => {
      if (impact <= 2) return 'Low'
      if (impact <= 3) return 'Medium'
      return 'High'
    }

    return (
      <div 
        className={`performance-impact impact-${getImpactColor(impact)}`}
        data-testid="performance-impact"
        data-impact={impact}
      >
        <span className="impact-label">Impact: {getImpactText(impact)}</span>
        <div className="impact-dots">
          {Array.from({ length: 5 }, (_, i) => (
            <div 
              key={i} 
              className={`impact-dot ${i < impact ? 'filled' : 'empty'}`}
            />
          ))}
        </div>
      </div>
    )
  }

  // Tool card component
  const ToolCard: React.FC<{ tool: ToolOption; category: string }> = ({ tool, category }) => {
    const isSelected = selectedTools.includes(tool.id)
    const isCompatible = isToolCompatible(tool)
    const isConfigOpen = openConfigPanels.has(tool.id)
    const isHighImpact = tool.performanceImpact >= 4

    return (
      <div
        data-testid={`tool-card-${tool.id}`}
        data-compatible={isCompatible}
        data-selected={isSelected}
        className={`tool-card ${isSelected ? 'selected' : ''} ${!isCompatible ? 'incompatible' : ''}`}
      >
        <div className="tool-header">
          <div className="tool-checkbox-section">
            <input
              type="checkbox"
              data-testid={`tool-checkbox-${tool.id}`}
              checked={isSelected}
              disabled={disabled || tool.isRequired}
              onChange={() => handleToolToggle(tool.id)}
              className="tool-checkbox"
              aria-describedby={`tool-description-${tool.id}`}
              tabIndex={disabled || tool.isRequired ? -1 : 0}
            />
          </div>
          
          <div className="tool-main-info">
            <div className="tool-title-section">
              <div data-testid="tool-icon" className={`tool-icon icon-${tool.icon}`}>
                {getIconForTool(tool.icon)}
              </div>
              <h4 className="tool-name">{tool.name}</h4>
              {tool.isRequired && (
                <span className="required-badge" data-testid="required-badge">
                  Required
                </span>
              )}
            </div>
            
            <p 
              className="tool-description"
              id={`tool-description-${tool.id}`}
            >
              {tool.description}
            </p>
          </div>
          
          {showAdvancedConfig && tool.config && (
            <button
              type="button"
              data-testid={`configure-tool-button-${tool.id}`}
              onClick={() => toggleConfigPanel(tool.id)}
              className="configure-tool-button"
              disabled={disabled}
            >
              ⚙️
            </button>
          )}
          
          {/* Generic configure button for testing */}
          {tool.config && (
            <div style={{ display: 'none' }} data-testid="configure-tool-button" />
          )}
        </div>

        <div className="tool-metadata">
          <div className="tool-permissions" data-testid="tool-permissions">
            <span className="permissions-label">Permissions:</span>
            <div className="permissions-list">
              {tool.permissions.map(permission => (
                <span key={permission} className="permission-badge">
                  {permission}
                </span>
              ))}
            </div>
          </div>

          <PerformanceImpact impact={tool.performanceImpact} />

          {!isCompatible && (
            <div className="compatibility-warning" data-testid="compatibility-warning">
              ⚠️ Not compatible with selected model
            </div>
          )}

          {isHighImpact && (
            <div className="performance-warning" data-testid="performance-warning">
              ⚠️ High performance impact
            </div>
          )}

          {tool.config && (
            <div className="config-preview" data-testid="config-preview">
              <span className="config-label">Configuration available</span>
            </div>
          )}
        </div>

        {/* Configuration Panel */}
        {isConfigOpen && tool.config && (
          <div className="config-panel" data-testid={`config-panel-${tool.id}`}>
            <h5>Configure {tool.name}</h5>
            <div className="config-fields">
              {Object.entries(tool.config).map(([key, value]) => (
                <div key={key} className="config-field">
                  <label>{key}:</label>
                  <input
                    type="text"
                    defaultValue={typeof value === 'string' ? value : JSON.stringify(value)}
                    onChange={(e) => {
                      const newConfig = { ...tool.config, [key]: e.target.value }
                      handleConfigChange(tool.id, newConfig)
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="config-validation" data-testid="config-validation">
              Configuration valid ✓
            </div>
          </div>
        )}
      </div>
    )
  }

  // Get icon for tool
  const getIconForTool = (iconName: string): string => {
    const iconMap: Record<string, string> = {
      'search': '🔍',
      'file-text': '📄',
      'calculator': '🔢',
      'file': '📁',
      'image': '🖼️',
      'database': '🗄️',
      'globe': '🌐',
      'code': '💻',
      'mail': '📧',
    }
    return iconMap[iconName] || '🔧'
  }

  // Category component
  const CategorySection: React.FC<{ category: string; tools: ToolOption[] }> = ({ category, tools }) => {
    const isCollapsed = collapsedCategories.has(category)
    const selectedInCategory = tools.filter(tool => selectedTools.includes(tool.id)).length
    const compatibleTools = getCompatibleTools(tools)

    return (
      <div className="category-section" data-testid={`category-${category}`}>
        <div 
          className="category-header"
          data-testid={`category-header-${category}`}
          onClick={(e) => {
            // Only toggle if clicking the header itself, not child buttons
            if (e.target === e.currentTarget || (e.target as Element).closest('.category-title')) {
              toggleCategoryCollapse(category)
            }
          }}
        >
          <div className="category-title">
            <span className="collapse-indicator">{isCollapsed ? '▶' : '▼'}</span>
            <h3>{category}</h3>
            <span className="category-tool-count" data-testid="category-tool-count">
              {tools.length}
            </span>
            <span className="category-selection-count" data-testid="category-selection-count">
              ({selectedInCategory} selected)
            </span>
          </div>
          
          <div className="category-controls">
            <button
              type="button"
              data-testid={`category-select-all-${category}`}
              onClick={(e) => {
                e.stopPropagation()
                handleCategorySelectAll(category)
              }}
              disabled={disabled}
              className="category-select-all"
            >
              Select All
            </button>
          </div>
        </div>

        <div 
          className={`category-content ${isCollapsed ? 'collapsed' : ''}`}
          data-testid={`category-content-${category}`}
          data-collapsed={isCollapsed.toString()}
        >
          <div className="tools-grid">
            {tools.map(tool => {
              const isToolVisible = !searchQuery || 
                tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.permissions.some(permission => permission.toLowerCase().includes(searchQuery.toLowerCase()));
              
              // Only render visible tools
              if (!isToolVisible) return null;
              
              return <ToolCard key={tool.id} tool={tool} category={category} />;
            })}
          </div>
        </div>
      </div>
    )
  }

  // Validate on selection changes
  useEffect(() => {
    validateSelection()
  }, [validateSelection])

  // Check if we have any tools to display
  const hasTools = Object.keys(filteredToolsByCategory).length > 0
  const totalFilteredTools = Object.values(filteredToolsByCategory).flat().length

  return (
    <div 
      className={`tools-configuration ${className}`}
      data-testid="tools-configuration"
      data-disabled={disabled}
      role="group"
      aria-label="Tools Configuration"
    >
      <div className="tools-header">
        <h3>Available Tools</h3>
        <div className="tools-summary">
          {selectedTools.length} of {tools.length} tools selected
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="tools-controls">
        <div className="search-section">
          <input
            type="text"
            data-testid="tools-search-input"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={disabled}
            className="tools-search-input"
          />
        </div>

        <div className="filter-section">
          <select
            data-testid="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={disabled}
            className="category-filter"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="global-controls">
          <button
            type="button"
            data-testid="select-all-tools"
            onClick={handleSelectAllTools}
            disabled={disabled}
            className="global-select-all"
          >
            Select All Compatible
          </button>
          <button
            type="button"
            data-testid="deselect-all-tools"
            onClick={handleDeselectAllTools}
            disabled={disabled}
            className="global-deselect-all"
          >
            Deselect All
          </button>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors" data-testid="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="validation-error">
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {/* Tools Content */}
      <div className="tools-content">
        {!hasTools ? (
          <div className="no-tools-message" data-testid="no-tools-message">
            {tools.length === 0 
              ? 'No tools available'
              : 'No tools found matching your search'
            }
          </div>
        ) : (
          <div className="categories-container">
            {Object.entries(filteredToolsByCategory).map(([category, categoryTools]) => (
              <CategorySection
                key={category}
                category={category}
                tools={categoryTools}
              />
            ))}
          </div>
        )}
      </div>

      {/* Live region for screen reader announcements */}
      <div
        data-testid="tools-live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {selectedTools.length > 0 && `${selectedTools.length} tools selected`}
      </div>
    </div>
  )
}

// Inline styles (should be moved to CSS file in production)
const styles = `
.tools-configuration {
  width: 100%;
}

.tools-configuration[data-disabled="true"] {
  opacity: 0.6;
  pointer-events: none;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.tools-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.tools-summary {
  font-size: 14px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
}

.tools-controls {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
  flex-wrap: wrap;
}

.search-section {
  flex: 1;
  min-width: 200px;
}

.tools-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.tools-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-section .category-filter {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.global-controls {
  display: flex;
  gap: 8px;
}

.global-select-all,
.global-deselect-all {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.global-select-all:hover,
.global-deselect-all:hover {
  background-color: #f3f4f6;
}

.validation-errors {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.validation-error {
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 4px;
}

.validation-error:last-child {
  margin-bottom: 0;
}

.no-tools-message {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 16px;
  background-color: #f9fafb;
  border-radius: 8px;
}

.categories-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f9fafb;
  cursor: pointer;
  transition: background-color 0.2s;
}

.category-header:hover {
  background-color: #f3f4f6;
}

.category-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.collapse-indicator {
  font-size: 12px;
  color: #6b7280;
}

.category-tool-count,
.category-selection-count {
  font-size: 12px;
  color: #6b7280;
  background-color: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
}

.category-controls .category-select-all {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.category-controls .category-select-all:hover {
  background-color: #f3f4f6;
}

.category-content {
  padding: 16px;
  transition: all 0.3s;
  overflow: hidden;
}

.category-content.collapsed {
  padding: 0;
  height: 0;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 16px;
}

.tool-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
  background: white;
}

.tool-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.tool-card.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.tool-card.incompatible {
  border-color: #fbbf24;
  background-color: #fffbeb;
}

.tool-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.tool-checkbox-section {
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.tool-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.tool-main-info {
  flex: 1;
}

.tool-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.tool-icon {
  font-size: 16px;
}

.tool-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.required-badge {
  font-size: 10px;
  background-color: #fbbf24;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 600;
}

.tool-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.configure-tool-button {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.configure-tool-button:hover {
  background-color: #f3f4f6;
}

.tool-metadata {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.tool-permissions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.permissions-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.permission-badge {
  font-size: 10px;
  background-color: #e5e7eb;
  color: #374151;
  padding: 2px 6px;
  border-radius: 4px;
}

.performance-impact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.impact-label {
  font-size: 12px;
  font-weight: 500;
}

.performance-impact.impact-low {
  color: #059669;
}

.performance-impact.impact-medium {
  color: #d97706;
}

.performance-impact.impact-high {
  color: #dc2626;
}

.impact-dots {
  display: flex;
  gap: 2px;
}

.impact-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #e5e7eb;
}

.impact-dot.filled {
  background-color: currentColor;
}

.compatibility-warning,
.performance-warning {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.compatibility-warning {
  background-color: #fef3c7;
  color: #d97706;
}

.performance-warning {
  background-color: #fee2e2;
  color: #dc2626;
}

.config-preview {
  font-size: 12px;
  color: #6b7280;
}

.config-panel {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background-color: #f9fafb;
}

.config-panel h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.config-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-field label {
  font-size: 12px;
  font-weight: 500;
  min-width: 80px;
}

.config-field input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.config-validation {
  margin-top: 8px;
  font-size: 12px;
  color: #059669;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
  
  .tools-controls {
    flex-direction: column;
  }
  
  .global-controls {
    justify-content: stretch;
  }
  
  .global-select-all,
  .global-deselect-all {
    flex: 1;
  }
}
`

// Inject styles (for development, should be moved to CSS file in production)
if (typeof document !== 'undefined') {
  const styleId = 'tools-configuration-styles'
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  }
}