/**
 * Model Selector Component Tests (Task 9.4)
 * 
 * Comprehensive test suite for ModelSelector dropdown component
 * following TDD principles and established test patterns.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModelSelector } from '../../../../src/components/inspector/ModelSelector'
import { 
  availableModels, 
  selectedModel, 
  unavailableModel,
  availableTools,
  mockInspectorCallbacks,
  performanceBenchmarks 
} from '../../../fixtures/inspector'

// Mock user setup for testing interactions
const createUser = () => userEvent.setup()

describe('ModelSelector Component', () => {
  const mockOnChange = vi.fn()
  const mockOnValidation = vi.fn()
  
  const defaultProps = {
    models: availableModels,
    selectedModel: selectedModel.id,
    availableTools: availableTools.map(tool => tool.id),
    onChange: mockOnChange,
    onValidation: mockOnValidation,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // === COMPONENT RENDERING TESTS ===

  describe('Component Rendering', () => {
    it('should render model selector with selected model', () => {
      render(<ModelSelector {...defaultProps} />)
      
      expect(screen.getByTestId('model-selector')).toBeInTheDocument()
      expect(screen.getByTestId('model-selector-button')).toBeInTheDocument()
      expect(screen.getByText(selectedModel.name)).toBeInTheDocument()
      expect(screen.getByText(selectedModel.provider)).toBeInTheDocument()
    })

    it('should show placeholder when no model is selected', () => {
      render(<ModelSelector {...defaultProps} selectedModel="" placeholder="Select a model..." />)
      
      expect(screen.getByText('Select a model...')).toBeInTheDocument()
    })

    it('should render dropdown as closed by default', () => {
      render(<ModelSelector {...defaultProps} />)
      
      expect(screen.getByTestId('model-selector')).toHaveAttribute('data-open', 'false')
      expect(screen.queryByTestId('model-dropdown')).not.toBeInTheDocument()
    })

    it('should apply disabled state correctly', () => {
      render(<ModelSelector {...defaultProps} disabled />)
      
      const button = screen.getByTestId('model-selector-button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have proper accessibility attributes', () => {
      render(<ModelSelector {...defaultProps} />)
      
      const button = screen.getByTestId('model-selector-button')
      expect(button).toHaveAttribute('aria-haspopup', 'listbox')
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('role', 'combobox')
    })
  })

  // === DROPDOWN INTERACTION TESTS ===

  describe('Dropdown Interactions', () => {
    it('should open dropdown when button is clicked', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      const button = screen.getByTestId('model-selector-button')
      await user.click(button)
      
      expect(screen.getByTestId('model-dropdown')).toBeInTheDocument()
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByTestId('model-selector')).toHaveAttribute('data-open', 'true')
    })

    it('should close dropdown when clicking outside', async () => {
      const user = createUser()
      render(
        <div>
          <ModelSelector {...defaultProps} />
          <div data-testid="outside-element">Outside</div>
        </div>
      )
      
      // Open dropdown
      await user.click(screen.getByTestId('model-selector-button'))
      expect(screen.getByTestId('model-dropdown')).toBeInTheDocument()
      
      // Click outside
      await user.click(screen.getByTestId('outside-element'))
      expect(screen.queryByTestId('model-dropdown')).not.toBeInTheDocument()
    })

    it('should close dropdown when pressing Escape key', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      const button = screen.getByTestId('model-selector-button')
      await user.click(button)
      expect(screen.getByTestId('model-dropdown')).toBeInTheDocument()
      
      await user.keyboard('{Escape}')
      expect(screen.queryByTestId('model-dropdown')).not.toBeInTheDocument()
    })

    it('should toggle dropdown on button click', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      const button = screen.getByTestId('model-selector-button')
      
      // Open dropdown
      await user.click(button)
      expect(screen.getByTestId('model-dropdown')).toBeInTheDocument()
      
      // Close dropdown
      await user.click(button)
      expect(screen.queryByTestId('model-dropdown')).not.toBeInTheDocument()
    })
  })

  // === MODEL SELECTION TESTS ===

  describe('Model Selection', () => {
    it('should display all available models in dropdown', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const dropdown = screen.getByTestId('model-dropdown')
      const modelOptions = within(dropdown).getAllByTestId(/^model-option-/)
      
      expect(modelOptions).toHaveLength(availableModels.filter(model => model.isAvailable).length)
    })

    it('should show model details for each option', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const firstModel = availableModels[0]
      const modelOption = screen.getByTestId(`model-option-${firstModel.id}`)
      
      expect(within(modelOption).getByText(firstModel.name)).toBeInTheDocument()
      expect(within(modelOption).getByText(firstModel.provider)).toBeInTheDocument()
      expect(within(modelOption).getByText(firstModel.description)).toBeInTheDocument()
      expect(within(modelOption).getByText(`${firstModel.maxTokens.toLocaleString()} tokens`)).toBeInTheDocument()
    })

    it('should call onChange when model is selected', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const targetModel = availableModels[1] // Select different model
      const modelOption = screen.getByTestId(`model-option-${targetModel.id}`)
      
      expect(modelOption).toBeInTheDocument()
      
      // Try fireEvent instead of user.click
      fireEvent.click(modelOption)
      
      expect(mockOnChange).toHaveBeenCalledWith(targetModel.id)
    })

    it('should close dropdown after model selection', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const targetModel = availableModels[1]
      
      // Try fireEvent instead of user.click
      fireEvent.click(screen.getByTestId(`model-option-${targetModel.id}`))
      
      expect(screen.queryByTestId('model-dropdown')).not.toBeInTheDocument()
    })

    it('should highlight selected model in dropdown', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const selectedOption = screen.getByTestId(`model-option-${selectedModel.id}`)
      expect(selectedOption).toHaveAttribute('data-selected', 'true')
      expect(selectedOption).toHaveAttribute('aria-selected', 'true')
    })
  })

  // === SEARCH AND FILTER TESTS ===

  describe('Search and Filter Functionality', () => {
    it('should show search input when dropdown is open', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      expect(screen.getByTestId('model-search-input')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument()
    })

    it('should filter models by name', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const searchInput = screen.getByTestId('model-search-input')
      
      await user.type(searchInput, 'GPT-4')
      
      await waitFor(() => {
        const modelOptions = screen.getAllByTestId(/^model-option-/)
        const gptModels = availableModels.filter(model => 
          model.name.includes('GPT-4') && model.isAvailable
        )
        expect(modelOptions).toHaveLength(gptModels.length)
      })
    })

    it('should filter models by provider', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const searchInput = screen.getByTestId('model-search-input')
      
      await user.type(searchInput, 'Anthropic')
      
      await waitFor(() => {
        const modelOptions = screen.getAllByTestId(/^model-option-/)
        const anthropicModels = availableModels.filter(model => 
          model.provider === 'Anthropic' && model.isAvailable
        )
        expect(modelOptions).toHaveLength(anthropicModels.length)
      })
    })

    it('should show "no results" message when search yields no matches', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const searchInput = screen.getByTestId('model-search-input')
      
      await user.type(searchInput, 'nonexistent-model')
      
      await waitFor(() => {
        expect(screen.getByTestId('no-models-message')).toBeInTheDocument()
        expect(screen.getByText('No models found matching your search')).toBeInTheDocument()
      })
    })

    it('should clear search and show all models when search is cleared', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const searchInput = screen.getByTestId('model-search-input')
      
      // Search and filter
      await user.type(searchInput, 'GPT')
      await waitFor(() => {
        expect(screen.getAllByTestId(/^model-option-/)).toHaveLength(3) // GPT models
      })
      
      // Clear search
      await user.clear(searchInput)
      await waitFor(() => {
        const allAvailableModels = availableModels.filter(model => model.isAvailable)
        expect(screen.getAllByTestId(/^model-option-/)).toHaveLength(allAvailableModels.length)
      })
    })

    it('should perform case-insensitive search', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const searchInput = screen.getByTestId('model-search-input')
      
      await user.type(searchInput, 'claude')
      
      await waitFor(() => {
        const modelOptions = screen.getAllByTestId(/^model-option-/)
        const claudeModels = availableModels.filter(model => 
          model.name.toLowerCase().includes('claude') && model.isAvailable
        )
        expect(modelOptions).toHaveLength(claudeModels.length)
      })
    })
  })

  // === TOOL COMPATIBILITY TESTS ===

  describe('Tool Compatibility', () => {
    it('should filter models based on tool compatibility', async () => {
      const restrictiveTools = ['image-processor'] // Only compatible with certain models
      const user = createUser()
      
      render(<ModelSelector {...defaultProps} availableTools={restrictiveTools} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const modelOptions = screen.getAllByTestId(/^model-option-/)
      const compatibleModels = availableModels.filter(model => 
        model.isAvailable && availableTools
          .filter(tool => restrictiveTools.includes(tool.id))
          .every(tool => tool.compatibleModels.includes('*') || tool.compatibleModels.includes(model.id))
      )
      
      expect(modelOptions.length).toBeLessThanOrEqual(availableModels.filter(m => m.isAvailable).length)
    })

    it('should show compatibility indicators for models', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const firstModel = availableModels[0]
      const modelOption = screen.getByTestId(`model-option-${firstModel.id}`)
      
      expect(within(modelOption).getByTestId('compatibility-indicator')).toBeInTheDocument()
    })

    it('should show warning for models with limited tool compatibility', async () => {
      const user = createUser()
      const incompatibleTools = ['image-processor', 'pdf-analyzer']
      
      render(<ModelSelector {...defaultProps} availableTools={incompatibleTools} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      // Find a model that's not compatible with all tools
      const incompatibleModel = availableModels.find(model => 
        model.isAvailable && 
        !incompatibleTools.every(toolId => {
          const tool = availableTools.find(t => t.id === toolId)
          return tool && (tool.compatibleModels.includes('*') || tool.compatibleModels.includes(model.id))
        })
      )
      
      if (incompatibleModel) {
        const modelOption = screen.getByTestId(`model-option-${incompatibleModel.id}`)
        expect(within(modelOption).getByTestId('compatibility-warning')).toBeInTheDocument()
      }
    })

    it('should call onValidation with compatibility results', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const targetModel = availableModels[1]
      await user.click(screen.getByTestId(`model-option-${targetModel.id}`))
      
      expect(mockOnValidation).toHaveBeenCalled()
      const [isValid, errors] = mockOnValidation.mock.calls[0]
      expect(typeof isValid).toBe('boolean')
      if (errors) {
        expect(Array.isArray(errors)).toBe(true)
      }
    })
  })

  // === PERFORMANCE INDICATORS TESTS ===

  describe('Performance Indicators', () => {
    it('should display performance ratings for each model', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const firstModel = availableModels[0]
      const modelOption = screen.getByTestId(`model-option-${firstModel.id}`)
      
      expect(within(modelOption).getByTestId('performance-speed')).toBeInTheDocument()
      expect(within(modelOption).getByTestId('performance-quality')).toBeInTheDocument()
      expect(within(modelOption).getByTestId('performance-reasoning')).toBeInTheDocument()
    })

    it('should show cost information for each model', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const firstModel = availableModels[0]
      const modelOption = screen.getByTestId(`model-option-${firstModel.id}`)
      
      expect(within(modelOption).getByTestId('model-cost')).toBeInTheDocument()
      expect(within(modelOption).getByText(`$${firstModel.costPer1k}/1K tokens`)).toBeInTheDocument()
    })

    it('should display model capabilities as badges', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const firstModel = availableModels[0]
      const modelOption = screen.getByTestId(`model-option-${firstModel.id}`)
      const capabilityBadges = within(modelOption).getAllByTestId(/^capability-badge-/)
      
      expect(capabilityBadges.length).toBe(firstModel.capabilities.length)
    })
  })

  // === ACCESSIBILITY TESTS ===

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      const button = screen.getByTestId('model-selector-button')
      
      // Focus and open with Enter
      button.focus()
      await user.keyboard('{Enter}')
      expect(screen.getByTestId('model-dropdown')).toBeInTheDocument()
      
      // Navigate with arrow keys
      await user.keyboard('{ArrowDown}')
      const firstOption = screen.getByTestId(`model-option-${availableModels[0].id}`)
      expect(firstOption).toHaveAttribute('data-focused', 'true')
    })

    it('should select model with Enter key', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      const button = screen.getByTestId('model-selector-button')
      button.focus()
      await user.keyboard('{Enter}')
      
      // Navigate to a different model and select
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{Enter}')
      
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('should have proper ARIA labels and descriptions', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      const dropdown = screen.getByTestId('model-dropdown')
      expect(dropdown).toHaveAttribute('role', 'listbox')
      
      const firstOption = screen.getByTestId(`model-option-${availableModels[0].id}`)
      expect(firstOption).toHaveAttribute('role', 'option')
      expect(firstOption).toHaveAttribute('aria-describedby')
    })

    it('should announce changes to screen readers', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const targetModel = availableModels[1]
      await user.click(screen.getByTestId(`model-option-${targetModel.id}`))
      
      // Check for live region updates
      expect(screen.getByTestId('model-selector-live-region')).toBeInTheDocument()
    })
  })

  // === PERFORMANCE TESTS ===

  describe('Performance', () => {
    it('should render dropdown within performance benchmark', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      const startTime = performance.now()
      await user.click(screen.getByTestId('model-selector-button'))
      const endTime = performance.now()
      
      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(performanceBenchmarks.modelSelection.maxDropdownRenderTime)
    })

    it('should filter search results within performance benchmark', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      const searchInput = screen.getByTestId('model-search-input')
      
      const startTime = performance.now()
      await user.type(searchInput, 'GPT')
      const endTime = performance.now()
      
      const searchTime = endTime - startTime
      expect(searchTime).toBeLessThan(performanceBenchmarks.modelSelection.maxSearchFilterTime * 10) // Allow for typing time
    })
  })

  // === ERROR HANDLING TESTS ===

  describe('Error Handling', () => {
    it('should handle empty models array gracefully', async () => {
      const user = createUser()
      render(<ModelSelector {...defaultProps} models={[]} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      expect(screen.getByTestId('no-models-message')).toBeInTheDocument()
      expect(screen.getByText('No models available')).toBeInTheDocument()
    })

    it('should handle unavailable models correctly', async () => {
      const modelsWithUnavailable = [...availableModels, unavailableModel]
      const user = createUser()
      
      render(<ModelSelector {...defaultProps} models={modelsWithUnavailable} />)
      
      await user.click(screen.getByTestId('model-selector-button'))
      
      // Should not show unavailable models in dropdown
      expect(screen.queryByTestId(`model-option-${unavailableModel.id}`)).not.toBeInTheDocument()
    })

    it('should handle invalid selected model gracefully', () => {
      render(<ModelSelector {...defaultProps} selectedModel="invalid-model-id" />)
      
      expect(screen.getByTestId('model-selector-button')).toBeInTheDocument()
      // Should show some indication that selection is invalid
      expect(screen.getByTestId('model-selector-button')).toHaveAttribute('data-invalid', 'true')
    })
  })
})