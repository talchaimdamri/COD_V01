/**
 * Model Selector Component (Task 9.4)
 * 
 * Enhanced dropdown interface for selecting AI models with search/filter functionality,
 * model descriptions, capability indicators, and tool compatibility validation.
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ModelOption, ToolOption } from '../../types/models'

export interface ModelSelectorProps {
  models: ModelOption[]
  selectedModel: string
  availableTools: string[]
  onChange: (modelId: string) => void
  onValidation?: (isValid: boolean, errors?: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  availableTools = [],
  onChange,
  onValidation,
  placeholder = 'Select a model...',
  disabled = false,
  className = '',
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Refs for managing focus and clicks
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Get selected model data
  const selectedModelData = models.find(model => model.id === selectedModel)
  const isValidSelection = selectedModelData && selectedModelData.isAvailable

  // Filter available models
  const availableModels = useMemo(() => {
    return models.filter(model => model.isAvailable)
  }, [models])

  // Filter models by search query and tool compatibility
  const filteredModels = useMemo(() => {
    let filtered = availableModels

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        model.capabilities.some(cap => cap.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [availableModels, searchQuery])

  // Check tool compatibility for a model
  const checkModelCompatibility = useCallback((model: ModelOption): { isCompatible: boolean; incompatibleTools: string[] } => {
    const incompatibleTools: string[] = []
    
    // For this implementation, we'll simulate tool compatibility checking
    // In a real app, this would check against actual tool configurations
    const hasIncompatibleTools = availableTools.some(toolId => {
      // Simulate some incompatibility rules
      if (toolId === 'image-processor' && !['gpt-4', 'gemini-pro'].includes(model.id)) {
        incompatibleTools.push(toolId)
        return true
      }
      if (toolId === 'code-executor' && model.id === 'gpt-3.5-turbo') {
        incompatibleTools.push(toolId)
        return true
      }
      return false
    })

    return {
      isCompatible: !hasIncompatibleTools,
      incompatibleTools
    }
  }, [availableTools])

  // Validate current selection
  const validateSelection = useCallback((modelId: string) => {
    const model = models.find(m => m.id === modelId)
    const errors: string[] = []
    
    if (!model) {
      errors.push('Model not found')
    } else if (!model.isAvailable) {
      errors.push('Selected model is not available')
    } else {
      const { isCompatible, incompatibleTools } = checkModelCompatibility(model)
      if (!isCompatible) {
        errors.push(`Model is not compatible with tools: ${incompatibleTools.join(', ')}`)
      }
    }

    setValidationErrors(errors)
    
    if (onValidation) {
      onValidation(errors.length === 0, errors.length > 0 ? errors : undefined)
    }
    
    return errors.length === 0
  }, [models, checkModelCompatibility, onValidation])

  // Handle model selection
  const handleModelSelect = useCallback((modelId: string) => {
    // Call onChange immediately
    onChange(modelId)
    
    // Update UI state
    setIsOpen(false)
    setSearchQuery('')
    setFocusedIndex(-1)
    
    // Validate after selection
    validateSelection(modelId)
    
    // Return focus to button
    setTimeout(() => {
      if (buttonRef.current) {
        buttonRef.current.focus()
      }
    }, 0)
  }, [onChange, validateSelection])

  // Handle dropdown toggle
  const handleToggle = useCallback(() => {
    if (disabled) return
    
    setIsOpen(prev => {
      const newIsOpen = !prev
      if (newIsOpen) {
        // Focus search input when opening
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus()
          }
        }, 0)
      }
      return newIsOpen
    })
  }, [disabled])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Escape':
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
        if (buttonRef.current) {
          buttonRef.current.focus()
        }
        break
        
      case 'Enter':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else if (focusedIndex >= 0 && focusedIndex < filteredModels.length) {
          handleModelSelect(filteredModels[focusedIndex].id)
        }
        break
        
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          setFocusedIndex(0) // Set focus to first item when opening
        } else {
          setFocusedIndex(prev => 
            prev < filteredModels.length - 1 ? prev + 1 : 0
          )
        }
        break
        
      case 'ArrowUp':
        event.preventDefault()
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredModels.length - 1
          )
        }
        break
    }
  }, [disabled, isOpen, focusedIndex, filteredModels, handleModelSelect])

  // Handle clicks outside component
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setFocusedIndex(-1)
      }
    }

    if (isOpen) {
      // Use setTimeout to allow for click events to process first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Update option refs array when filtered models change
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, filteredModels.length)
  }, [filteredModels.length])

  // Focus management for keyboard navigation
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [isOpen, focusedIndex])

  // Validate initial selection
  useEffect(() => {
    if (selectedModel) {
      validateSelection(selectedModel)
    }
  }, [selectedModel, validateSelection])

  // Performance rating component
  const PerformanceRating: React.FC<{ label: string; value: number; testId: string }> = ({ label, value, testId }) => (
    <div className="performance-rating" data-testid={testId}>
      <span className="performance-label">{label}</span>
      <div className="performance-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span 
            key={i} 
            className={`star ${i < value ? 'filled' : 'empty'}`}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  )

  // Capability badge component
  const CapabilityBadge: React.FC<{ capability: string }> = ({ capability }) => (
    <span 
      className="capability-badge" 
      data-testid={`capability-badge-${capability}`}
    >
      {capability}
    </span>
  )

  // Model option component
  const ModelOption: React.FC<{ 
    model: ModelOption
    index: number
    isSelected: boolean
    isFocused: boolean
  }> = ({ model, index, isSelected, isFocused }) => {
    const { isCompatible, incompatibleTools } = checkModelCompatibility(model)
    
    return (
      <div
        ref={el => { optionRefs.current[index] = el }}
        data-testid={`model-option-${model.id}`}
        data-selected={isSelected}
        data-focused={isFocused}
        role="option"
        aria-selected={isSelected}
        aria-describedby={`model-description-${model.id}`}
        className={`model-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleModelSelect(model.id)
        }}
        onMouseEnter={() => setFocusedIndex(index)}
      >
        <div className="model-header">
          <div className="model-name-provider">
            <h4 className="model-name">{model.name}</h4>
            <span className="model-provider">{model.provider}</span>
          </div>
          <div className="model-cost" data-testid="model-cost">
            ${model.costPer1k}/1K tokens
          </div>
        </div>
        
        <div 
          className="model-description" 
          id={`model-description-${model.id}`}
        >
          {model.description}
        </div>
        
        <div className="model-details">
          <div className="model-specs">
            <span className="token-limit">
              {model.maxTokens.toLocaleString()} tokens
            </span>
          </div>
          
          <div className="performance-indicators">
            <PerformanceRating 
              label="Speed" 
              value={model.performance.speed} 
              testId="performance-speed"
            />
            <PerformanceRating 
              label="Quality" 
              value={model.performance.quality} 
              testId="performance-quality"
            />
            <PerformanceRating 
              label="Reasoning" 
              value={model.performance.reasoning} 
              testId="performance-reasoning"
            />
          </div>
        </div>
        
        <div className="model-capabilities">
          {model.capabilities.map(capability => (
            <CapabilityBadge key={capability} capability={capability} />
          ))}
        </div>
        
        <div className="compatibility-section">
          <div 
            className={`compatibility-indicator ${isCompatible ? 'compatible' : 'incompatible'}`}
            data-testid="compatibility-indicator"
          >
            {isCompatible ? '✓ Compatible' : '⚠ Limited compatibility'}
          </div>
          
          {!isCompatible && (
            <div 
              className="compatibility-warning"
              data-testid="compatibility-warning"
            >
              Not compatible with: {incompatibleTools.join(', ')}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`model-selector ${className}`}
      data-testid="model-selector"
      data-open={isOpen}
      data-disabled={disabled}
    >
      {/* Main selector button */}
      <button
        ref={buttonRef}
        type="button"
        data-testid="model-selector-button"
        data-invalid={!isValidSelection}
        className="model-selector-button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        role="combobox"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {selectedModelData ? (
          <div className="selected-model">
            <span className="selected-model-name">{selectedModelData.name}</span>
            <span className="selected-model-provider">{selectedModelData.provider}</span>
          </div>
        ) : (
          <span className="placeholder">{placeholder}</span>
        )}
        
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>
          ▼
        </span>
      </button>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors" data-testid="validation-errors">
          {validationErrors.map((error, index) => (
            <div key={index} className="validation-error">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          data-testid="model-dropdown"
          className="model-dropdown"
          role="listbox"
          aria-label="Available models"
        >
          {/* Search input */}
          <div className="search-section">
            <input
              ref={searchInputRef}
              type="text"
              data-testid="model-search-input"
              className="model-search-input"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setFocusedIndex(0)
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Model options */}
          <div className="model-options">
            {filteredModels.length === 0 ? (
              <div 
                className="no-models-message" 
                data-testid="no-models-message"
              >
                {availableModels.length === 0 
                  ? 'No models available'
                  : 'No models found matching your search'
                }
              </div>
            ) : (
              filteredModels.map((model, index) => (
                <ModelOption
                  key={model.id}
                  model={model}
                  index={index}
                  isSelected={model.id === selectedModel}
                  isFocused={index === focusedIndex}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Live region for screen reader announcements */}
      <div
        data-testid="model-selector-live-region"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* This will be updated when selection changes */}
        {selectedModelData && `Selected model: ${selectedModelData.name} by ${selectedModelData.provider}`}
      </div>
    </div>
  )
}

// Inline styles (should be moved to CSS file in production)
const styles = `
.model-selector {
  position: relative;
  width: 100%;
}

.model-selector.error .model-selector-button {
  border-color: #ef4444;
}

.model-selector-button {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  transition: all 0.2s;
}

.model-selector-button:hover:not(:disabled) {
  border-color: #d1d5db;
}

.model-selector-button:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.model-selector-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.model-selector-button[data-invalid="true"] {
  border-color: #ef4444;
}

.selected-model {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.selected-model-name {
  font-weight: 600;
  color: #111827;
}

.selected-model-provider {
  font-size: 12px;
  color: #6b7280;
}

.placeholder {
  color: #9ca3af;
}

.dropdown-arrow {
  transition: transform 0.2s;
  color: #6b7280;
  font-size: 12px;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.validation-errors {
  margin-top: 4px;
}

.validation-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 2px;
}

.model-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.search-section {
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.model-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.model-search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.model-options {
  overflow-y: auto;
  max-height: 320px;
}

.no-models-message {
  padding: 24px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

.model-option {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-option:last-child {
  border-bottom: none;
}

.model-option:hover,
.model-option.focused {
  background-color: #f9fafb;
}

.model-option.selected {
  background-color: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.model-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.model-name-provider {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.model-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.model-provider {
  font-size: 12px;
  color: #6b7280;
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.model-cost {
  font-size: 12px;
  font-weight: 500;
  color: #059669;
  background-color: #ecfdf5;
  padding: 2px 6px;
  border-radius: 4px;
}

.model-description {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 12px;
}

.model-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.token-limit {
  font-size: 12px;
  color: #4b5563;
  background-color: #f9fafb;
  padding: 2px 6px;
  border-radius: 4px;
}

.performance-indicators {
  display: flex;
  gap: 12px;
}

.performance-rating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.performance-label {
  font-size: 10px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 500;
}

.performance-stars {
  display: flex;
  gap: 1px;
}

.star {
  font-size: 10px;
  color: #fbbf24;
}

.star.empty {
  color: #e5e7eb;
}

.model-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 8px;
}

.capability-badge {
  font-size: 10px;
  background-color: #e0e7ff;
  color: #3730a3;
  padding: 2px 6px;
  border-radius: 12px;
  font-weight: 500;
}

.compatibility-section {
  font-size: 12px;
}

.compatibility-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.compatibility-indicator.compatible {
  color: #059669;
}

.compatibility-indicator.incompatible {
  color: #d97706;
}

.compatibility-warning {
  color: #dc2626;
  font-size: 11px;
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
@media (max-width: 640px) {
  .model-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .performance-indicators {
    gap: 8px;
  }
}
`

// Inject styles (for development, should be moved to CSS file in production)
if (typeof document !== 'undefined') {
  const styleId = 'model-selector-styles'
  if (!document.getElementById(styleId)) {
    const styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  }
}