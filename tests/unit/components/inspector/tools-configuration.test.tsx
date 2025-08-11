/**
 * Tools Configuration Component Tests (Task 9.5)
 * 
 * Comprehensive test suite for ToolsConfiguration component
 * following TDD principles and established test patterns.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolsConfiguration } from '../../../../src/components/inspector/ToolsConfiguration'
import { 
  availableTools, 
  selectedTools, 
  requiredTools,
  incompatibleTools,
  mockInspectorCallbacks,
  performanceBenchmarks 
} from '../../../fixtures/inspector'

// Mock user setup for testing interactions
const createUser = () => userEvent.setup()

describe('ToolsConfiguration Component', () => {
  const mockOnChange = vi.fn()
  const mockOnValidation = vi.fn()
  const mockOnConfigChange = vi.fn()
  
  const defaultProps = {
    tools: availableTools,
    selectedTools: selectedTools.map(tool => tool.id),
    selectedModel: 'gpt-4',
    onChange: mockOnChange,
    onValidation: mockOnValidation,
    onConfigChange: mockOnConfigChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  // === COMPONENT RENDERING TESTS ===

  describe('Component Rendering', () => {
    it('should render tools configuration with all available tools', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      expect(screen.getByTestId('tools-configuration')).toBeInTheDocument()
      expect(screen.getByText('Available Tools')).toBeInTheDocument()
      
      // Check that all tools are rendered
      availableTools.forEach(tool => {
        expect(screen.getByTestId(`tool-card-${tool.id}`)).toBeInTheDocument()
        expect(screen.getByText(tool.name)).toBeInTheDocument()
      })
    })

    it('should group tools by categories', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      // Check category sections
      expect(screen.getByTestId('category-Information')).toBeInTheDocument()
      expect(screen.getByTestId('category-File Processing')).toBeInTheDocument()
      expect(screen.getByTestId('category-Vision')).toBeInTheDocument()
      expect(screen.getByTestId('category-Data')).toBeInTheDocument()
      expect(screen.getByTestId('category-Integration')).toBeInTheDocument()
      expect(screen.getByTestId('category-Development')).toBeInTheDocument()
      expect(screen.getByTestId('category-Communication')).toBeInTheDocument()
    })

    it('should show category headers with tool counts', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const informationCategory = screen.getByTestId('category-Information')
      expect(within(informationCategory).getByText(/Information/)).toBeInTheDocument()
      expect(within(informationCategory).getByTestId('category-tool-count')).toBeInTheDocument()
    })

    it('should display selected tools as checked', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      selectedTools.forEach(tool => {
        const checkbox = screen.getByTestId(`tool-checkbox-${tool.id}`)
        expect(checkbox).toBeChecked()
      })
    })

    it('should disable component when disabled prop is true', () => {
      render(<ToolsConfiguration {...defaultProps} disabled />)
      
      const component = screen.getByTestId('tools-configuration')
      expect(component).toHaveAttribute('data-disabled', 'true')
      
      // All checkboxes should be disabled
      availableTools.forEach(tool => {
        const checkbox = screen.getByTestId(`tool-checkbox-${tool.id}`)
        expect(checkbox).toBeDisabled()
      })
    })
  })

  // === TOOL SELECTION TESTS ===

  describe('Tool Selection', () => {
    it('should call onChange when tool is selected', () => {
      render(<ToolsConfiguration {...defaultProps} selectedTools={[]} />)
      
      const firstTool = availableTools[0]
      const checkbox = screen.getByTestId(`tool-checkbox-${firstTool.id}`)
      
      fireEvent.click(checkbox)
      
      expect(mockOnChange).toHaveBeenCalledWith([firstTool.id])
    })

    it('should call onChange when tool is deselected', () => {
      const initialSelection = [availableTools[0].id, availableTools[1].id]
      render(<ToolsConfiguration {...defaultProps} selectedTools={initialSelection} />)
      
      const firstTool = availableTools[0]
      const checkbox = screen.getByTestId(`tool-checkbox-${firstTool.id}`)
      
      fireEvent.click(checkbox)
      
      expect(mockOnChange).toHaveBeenCalledWith([availableTools[1].id])
    })

    it('should not allow deselection of required tools', () => {
      const requiredTool = requiredTools[0]
      render(<ToolsConfiguration {...defaultProps} selectedTools={[requiredTool.id]} />)
      
      const checkbox = screen.getByTestId(`tool-checkbox-${requiredTool.id}`)
      
      // Required tools checkbox should be disabled
      expect(checkbox).toBeDisabled()
      expect(checkbox).toBeChecked()
    })

    it('should show required badge for required tools', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      requiredTools.forEach(tool => {
        const toolCard = screen.getByTestId(`tool-card-${tool.id}`)
        expect(within(toolCard).getByTestId('required-badge')).toBeInTheDocument()
        expect(within(toolCard).getByText('Required')).toBeInTheDocument()
      })
    })

    it('should handle multiple tool selection correctly', () => {
      const { rerender } = render(<ToolsConfiguration {...defaultProps} selectedTools={[]} />)
      
      const tool1 = availableTools[0]
      const tool2 = availableTools[1]
      
      // Select first tool
      fireEvent.click(screen.getByTestId(`tool-checkbox-${tool1.id}`))
      expect(mockOnChange).toHaveBeenCalledWith([tool1.id])
      
      // Mock the updated selection state using rerender
      vi.clearAllMocks()
      rerender(<ToolsConfiguration {...defaultProps} selectedTools={[tool1.id]} />)
      
      // Select second tool
      fireEvent.click(screen.getByTestId(`tool-checkbox-${tool2.id}`))
      expect(mockOnChange).toHaveBeenCalledWith([tool1.id, tool2.id])
    })
  })

  // === CATEGORY MANAGEMENT TESTS ===

  describe('Category Management', () => {
    it('should allow collapsing and expanding categories', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const categoryHeader = screen.getByTestId('category-header-Information')
      const categoryContent = screen.getByTestId('category-content-Information')
      
      expect(categoryContent).toHaveAttribute('data-collapsed', 'false')
      
      // Collapse category
      await user.click(categoryHeader)
      expect(categoryContent).toHaveAttribute('data-collapsed', 'true')
      
      // Expand category
      await user.click(categoryHeader)
      expect(categoryContent).toHaveAttribute('data-collapsed', 'false')
    })

    it('should show correct tool count for each category', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const categories = ['Information', 'File Processing', 'Vision', 'Data', 'Integration', 'Development', 'Communication']
      
      categories.forEach(category => {
        const toolsInCategory = availableTools.filter(tool => tool.category === category)
        const categoryElement = screen.getByTestId(`category-${category}`)
        const countElement = within(categoryElement).getByTestId('category-tool-count')
        
        expect(countElement).toHaveTextContent(`${toolsInCategory.length}`)
      })
    })

    it('should update category selection count when tools are selected', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const informationCategory = screen.getByTestId('category-Information')
      const selectionCount = within(informationCategory).getByTestId('category-selection-count')
      
      const selectedInformationTools = selectedTools.filter(tool => tool.category === 'Information')
      expect(selectionCount).toHaveTextContent(`${selectedInformationTools.length}`)
    })
  })

  // === SELECT-ALL/DESELECT-ALL TESTS ===

  describe('Select-All/Deselect-All Functionality', () => {
    it('should have global select-all/deselect-all controls', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      expect(screen.getByTestId('select-all-tools')).toBeInTheDocument()
      expect(screen.getByTestId('deselect-all-tools')).toBeInTheDocument()
    })

    it('should select all compatible tools when select-all is clicked', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} selectedTools={[]} />)
      
      const selectAllButton = screen.getByTestId('select-all-tools')
      await user.click(selectAllButton)
      
      // Should select all compatible tools (excluding incompatible ones)
      const compatibleToolIds = availableTools
        .filter(tool => tool.compatibleModels.includes('*') || tool.compatibleModels.includes('gpt-4'))
        .map(tool => tool.id)
      
      expect(mockOnChange).toHaveBeenCalledWith(compatibleToolIds)
    })

    it('should deselect all non-required tools when deselect-all is clicked', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const deselectAllButton = screen.getByTestId('deselect-all-tools')
      await user.click(deselectAllButton)
      
      // Should keep only required tools
      const requiredToolIds = requiredTools.map(tool => tool.id)
      expect(mockOnChange).toHaveBeenCalledWith(requiredToolIds)
    })

    it('should have category-specific select-all controls', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const informationCategory = screen.getByTestId('category-Information')
      expect(within(informationCategory).getByTestId('category-select-all-Information')).toBeInTheDocument()
    })

    it('should select all tools in category when category select-all is clicked', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} selectedTools={[]} />)
      
      const categorySelectAll = screen.getByTestId('category-select-all-Information')
      await user.click(categorySelectAll)
      
      const informationTools = availableTools
        .filter(tool => tool.category === 'Information')
        .filter(tool => tool.compatibleModels.includes('*') || tool.compatibleModels.includes('gpt-4'))
        .map(tool => tool.id)
      
      expect(mockOnChange).toHaveBeenCalledWith(informationTools)
    })
  })

  // === TOOL COMPATIBILITY TESTS ===

  describe('Tool Compatibility', () => {
    it('should filter out incompatible tools based on selected model', () => {
      render(<ToolsConfiguration {...defaultProps} selectedModel="gpt-3.5-turbo" />)
      
      // Tools not compatible with gpt-3.5-turbo should be hidden or marked as incompatible
      incompatibleTools.forEach(tool => {
        const toolCard = screen.queryByTestId(`tool-card-${tool.id}`)
        if (toolCard) {
          expect(toolCard).toHaveAttribute('data-compatible', 'false')
        }
      })
    })

    it('should show compatibility warnings for incompatible tools', () => {
      render(<ToolsConfiguration {...defaultProps} selectedModel="gpt-3.5-turbo" />)
      
      const incompatibleTool = availableTools.find(tool => 
        !tool.compatibleModels.includes('*') && !tool.compatibleModels.includes('gpt-3.5-turbo')
      )
      
      if (incompatibleTool) {
        const toolCard = screen.getByTestId(`tool-card-${incompatibleTool.id}`)
        expect(within(toolCard).getByTestId('compatibility-warning')).toBeInTheDocument()
      }
    })

    it('should call onValidation with compatibility results', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      expect(mockOnValidation).toHaveBeenCalled()
      const [isValid, errors] = mockOnValidation.mock.calls[0]
      expect(typeof isValid).toBe('boolean')
    })

    it('should show performance impact warnings for high-impact tools', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const highImpactTools = availableTools.filter(tool => tool.performanceImpact >= 4)
      
      highImpactTools.forEach(tool => {
        const toolCard = screen.getByTestId(`tool-card-${tool.id}`)
        expect(within(toolCard).getByTestId('performance-warning')).toBeInTheDocument()
      })
    })
  })

  // === TOOL CARD DISPLAY TESTS ===

  describe('Tool Card Display', () => {
    it('should display tool metadata in cards', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const firstTool = availableTools[0]
      const toolCard = screen.getByTestId(`tool-card-${firstTool.id}`)
      
      expect(within(toolCard).getByText(firstTool.name)).toBeInTheDocument()
      expect(within(toolCard).getByText(firstTool.description)).toBeInTheDocument()
      expect(within(toolCard).getByTestId('tool-icon')).toBeInTheDocument()
    })

    it('should show performance impact indicators', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      availableTools.forEach(tool => {
        const toolCard = screen.getByTestId(`tool-card-${tool.id}`)
        const performanceIndicator = within(toolCard).getByTestId('performance-impact')
        expect(performanceIndicator).toHaveAttribute('data-impact', tool.performanceImpact.toString())
      })
    })

    it('should display permission requirements', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const firstTool = availableTools[0]
      const toolCard = screen.getByTestId(`tool-card-${firstTool.id}`)
      const permissionsSection = within(toolCard).getByTestId('tool-permissions')
      
      firstTool.permissions.forEach(permission => {
        expect(within(permissionsSection).getByText(permission)).toBeInTheDocument()
      })
    })

    it('should show tool configuration preview when available', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const toolWithConfig = availableTools.find(tool => tool.config)
      if (toolWithConfig) {
        const toolCard = screen.getByTestId(`tool-card-${toolWithConfig.id}`)
        expect(within(toolCard).getByTestId('config-preview')).toBeInTheDocument()
      }
    })
  })

  // === ADVANCED CONFIGURATION TESTS ===

  describe('Advanced Configuration', () => {
    it('should show configuration button for configurable tools', () => {
      render(<ToolsConfiguration {...defaultProps} showAdvancedConfig />)
      
      const configurableTools = availableTools.filter(tool => tool.config)
      
      configurableTools.forEach(tool => {
        const toolCard = screen.getByTestId(`tool-card-${tool.id}`)
        expect(within(toolCard).getByTestId('configure-tool-button')).toBeInTheDocument()
      })
    })

    it('should open configuration panel when configure button is clicked', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} showAdvancedConfig />)
      
      const configurableTool = availableTools.find(tool => tool.config)
      if (configurableTool) {
        const configButton = screen.getByTestId(`configure-tool-button-${configurableTool.id}`)
        await user.click(configButton)
        
        expect(screen.getByTestId(`config-panel-${configurableTool.id}`)).toBeInTheDocument()
      }
    })

    it('should call onConfigChange when configuration is updated', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} showAdvancedConfig />)
      
      const configurableTool = availableTools.find(tool => tool.config)
      if (configurableTool) {
        const configButton = screen.getByTestId(`configure-tool-button-${configurableTool.id}`)
        await user.click(configButton)
        
        const configPanel = screen.getByTestId(`config-panel-${configurableTool.id}`)
        const configInputs = within(configPanel).getAllByRole('textbox')
        const configInput = configInputs[0] // Use the first input
        
        await user.type(configInput, 'new value')
        
        expect(mockOnConfigChange).toHaveBeenCalledWith(configurableTool.id, expect.any(Object))
      }
    })

    it('should validate configuration input', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} showAdvancedConfig />)
      
      const configurableTool = availableTools.find(tool => tool.config)
      if (configurableTool) {
        const configButton = screen.getByTestId(`configure-tool-button-${configurableTool.id}`)
        await user.click(configButton)
        
        const configPanel = screen.getByTestId(`config-panel-${configurableTool.id}`)
        expect(within(configPanel).getByTestId('config-validation')).toBeInTheDocument()
      }
    })
  })

  // === SEARCH AND FILTER TESTS ===

  describe('Search and Filter', () => {
    it('should show search input', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      expect(screen.getByTestId('tools-search-input')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Search tools...')).toBeInTheDocument()
    })

    it('should filter tools by search query', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const searchInput = screen.getByTestId('tools-search-input')
      await user.type(searchInput, 'web')
      
      await waitFor(() => {
        const webSearchTool = availableTools.find(tool => tool.name.toLowerCase().includes('web'))
        if (webSearchTool) {
          expect(screen.getByTestId(`tool-card-${webSearchTool.id}`)).toBeInTheDocument()
        }
        
        // Tools not matching should be hidden
        const nonMatchingTools = availableTools.filter(tool => !tool.name.toLowerCase().includes('web'))
        nonMatchingTools.forEach(tool => {
          const toolCard = screen.queryByTestId(`tool-card-${tool.id}`)
          if (toolCard) {
            expect(toolCard).not.toBeVisible()
          }
        })
      })
    })

    it('should show "no results" message when search yields no matches', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const searchInput = screen.getByTestId('tools-search-input')
      await user.type(searchInput, 'nonexistent-tool')
      
      await waitFor(() => {
        expect(screen.getByTestId('no-tools-message')).toBeInTheDocument()
        expect(screen.getByText('No tools found matching your search')).toBeInTheDocument()
      })
    })

    it('should filter by category', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const categoryFilter = screen.getByTestId('category-filter')
      await user.selectOptions(categoryFilter, 'Information')
      
      await waitFor(() => {
        const informationTools = availableTools.filter(tool => tool.category === 'Information')
        informationTools.forEach(tool => {
          expect(screen.getByTestId(`tool-card-${tool.id}`)).toBeInTheDocument()
        })
      })
    })
  })

  // === ACCESSIBILITY TESTS ===

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const firstCheckbox = screen.getByTestId(`tool-checkbox-${availableTools[0].id}`)
      firstCheckbox.focus()
      
      await user.keyboard('{Tab}')
      const secondCheckbox = screen.getByTestId(`tool-checkbox-${availableTools[1].id}`)
      expect(secondCheckbox).toHaveFocus()
    })

    it('should have proper ARIA labels and descriptions', () => {
      render(<ToolsConfiguration {...defaultProps} />)
      
      const component = screen.getByTestId('tools-configuration')
      expect(component).toHaveAttribute('role', 'group')
      expect(component).toHaveAttribute('aria-label', 'Tools Configuration')
      
      availableTools.forEach(tool => {
        const checkbox = screen.getByTestId(`tool-checkbox-${tool.id}`)
        expect(checkbox).toHaveAttribute('aria-describedby')
      })
    })

    it('should announce changes to screen readers', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} />)
      
      const checkbox = screen.getByTestId(`tool-checkbox-${availableTools[0].id}`)
      await user.click(checkbox)
      
      expect(screen.getByTestId('tools-live-region')).toBeInTheDocument()
    })
  })

  // === PERFORMANCE TESTS ===

  describe('Performance', () => {
    it('should render large tool lists within performance benchmark', () => {
      const startTime = performance.now()
      render(<ToolsConfiguration {...defaultProps} />)
      const endTime = performance.now()
      
      const renderTime = endTime - startTime
      expect(renderTime).toBeLessThan(150) // Allow 150ms for complex tool interface
    })

    it('should handle rapid selection changes efficiently', async () => {
      const user = createUser()
      render(<ToolsConfiguration {...defaultProps} selectedTools={[]} />)
      
      const startTime = performance.now()
      
      // Rapidly select multiple tools
      for (let i = 0; i < 5; i++) {
        const checkbox = screen.getByTestId(`tool-checkbox-${availableTools[i].id}`)
        await user.click(checkbox)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(1000) // Should handle 5 rapid clicks in under 1 second
    })
  })

  // === ERROR HANDLING TESTS ===

  describe('Error Handling', () => {
    it('should handle empty tools array gracefully', () => {
      render(<ToolsConfiguration {...defaultProps} tools={[]} />)
      
      expect(screen.getByTestId('no-tools-message')).toBeInTheDocument()
      expect(screen.getByText('No tools available')).toBeInTheDocument()
    })

    it('should handle missing tool configuration gracefully', () => {
      const toolsWithoutConfig = availableTools.map(tool => ({ ...tool, config: undefined }))
      render(<ToolsConfiguration {...defaultProps} tools={toolsWithoutConfig} />)
      
      // Should render without errors
      expect(screen.getByTestId('tools-configuration')).toBeInTheDocument()
    })

    it('should handle invalid selected tools gracefully', () => {
      render(<ToolsConfiguration {...defaultProps} selectedTools={['invalid-tool-id']} />)
      
      // Should not crash and should ignore invalid selections
      expect(screen.getByTestId('tools-configuration')).toBeInTheDocument()
    })
  })
})