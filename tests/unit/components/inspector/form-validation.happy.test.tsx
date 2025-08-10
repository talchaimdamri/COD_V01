/**
 * Unit Tests for React Hook Form Integration (Task 9.2) - Happy Path
 * 
 * TDD tests for form management system with real-time validation.
 * These are FAILING tests that define expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentConfigForm } from '../../../../src/components/inspector/AgentConfigForm'
import {
  baseAgentConfig,
  validFormState,
  initialFormState,
  availableModels,
  availableTools,
  mockInspectorCallbacks,
  validationScenarios,
} from '../../../fixtures/inspector'

describe('React Hook Form Integration - Happy Path', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock debounce timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Form Initialization', () => {
    it('should initialize form with empty state when no agent provided', () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      const modelSelect = screen.getByTestId('agent-model-select')

      expect(nameInput).toHaveValue('')
      expect(promptInput).toHaveValue('')
      expect(modelSelect).toHaveValue('')
    })

    it('should initialize form with agent data when provided', () => {
      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      const modelSelect = screen.getByTestId('agent-model-select')

      expect(nameInput).toHaveValue(baseAgentConfig.name)
      expect(promptInput).toHaveValue(baseAgentConfig.prompt)
      expect(modelSelect).toHaveValue(baseAgentConfig.model)
    })

    it('should initialize with selected tools from agent config', () => {
      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      baseAgentConfig.tools.forEach(toolId => {
        const toolCheckbox = screen.getByTestId(`tool-checkbox-${toolId}`)
        expect(toolCheckbox).toBeChecked()
      })
    })

    it('should show form in pristine state initially', () => {
      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const form = screen.getByTestId('agent-config-form')
      expect(form).toHaveAttribute('data-dirty', 'false')
      expect(form).toHaveAttribute('data-valid', 'true')
    })

    it('should register all form fields with React Hook Form', () => {
      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      expect(screen.getByTestId('agent-name-input')).toHaveAttribute('name', 'name')
      expect(screen.getByTestId('agent-prompt-input')).toHaveAttribute('name', 'prompt')
      expect(screen.getByTestId('agent-model-select')).toHaveAttribute('name', 'model')
      expect(screen.getByTestId('agent-tools-fieldset')).toBeInTheDocument()
    })
  })

  describe('Real-time Validation', () => {
    it('should validate name field on blur with success feedback', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      await user.type(nameInput, 'Valid Agent Name')
      await user.tab() // Trigger blur event

      // Advance debounce timer
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const validationMessage = screen.getByTestId('name-validation-message')
        expect(validationMessage).toHaveClass('validation-success')
        expect(validationMessage).toHaveTextContent('')
      })
    })

    it('should show debounced validation for prompt field', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const promptInput = screen.getByTestId('agent-prompt-input')
      
      // Type quickly without validation triggering immediately
      await user.type(promptInput, 'You are a helpful assistant.')

      // Validation should not trigger immediately
      expect(screen.queryByTestId('prompt-validation-message')).not.toBeInTheDocument()

      // Advance debounce timer
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const validationMessage = screen.getByTestId('prompt-validation-message')
        expect(validationMessage).toHaveClass('validation-success')
      })
    })

    it('should validate model selection immediately on change', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const modelSelect = screen.getByTestId('agent-model-select')
      
      await user.selectOptions(modelSelect, 'gpt-4')

      await waitFor(() => {
        const validationMessage = screen.getByTestId('model-validation-message')
        expect(validationMessage).toHaveClass('validation-success')
        expect(modelSelect).toHaveAttribute('data-valid', 'true')
      })
    })

    it('should validate tools selection with compatibility checks', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Select a model first
      const modelSelect = screen.getByTestId('agent-model-select')
      await user.selectOptions(modelSelect, 'gpt-4')

      // Select compatible tools
      const webSearchCheckbox = screen.getByTestId('tool-checkbox-web-search')
      const fileReaderCheckbox = screen.getByTestId('tool-checkbox-file-reader')
      
      await user.click(webSearchCheckbox)
      await user.click(fileReaderCheckbox)

      await waitFor(() => {
        const toolsValidation = screen.getByTestId('tools-validation-message')
        expect(toolsValidation).toHaveClass('validation-success')
        expect(webSearchCheckbox).toHaveAttribute('data-valid', 'true')
        expect(fileReaderCheckbox).toHaveAttribute('data-valid', 'true')
      })
    })

    it('should update form dirty state on field changes', async () => {
      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const form = screen.getByTestId('agent-config-form')
      expect(form).toHaveAttribute('data-dirty', 'false')

      const nameInput = screen.getByTestId('agent-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Agent Name')

      expect(form).toHaveAttribute('data-dirty', 'true')
    })

    it('should call onChange callback with form data and validation state', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')

      // Advance debounce timer
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(mockInspectorCallbacks.onFormChange).toHaveBeenCalledWith({
          values: expect.objectContaining({
            name: 'Test Agent',
          }),
          errors: expect.any(Object),
          isDirty: true,
          isValid: expect.any(Boolean),
          touchedFields: expect.objectContaining({
            name: true,
          }),
        })
      })
    })
  })

  describe('Zod Schema Integration', () => {
    it('should use AgentConfigSchema for validation', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Submit form with empty required fields
      const submitButton = screen.getByTestId('form-submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('name-validation-message')).toHaveTextContent('Agent name cannot be empty')
        expect(screen.getByTestId('prompt-validation-message')).toHaveTextContent('Agent prompt cannot be empty')
        expect(screen.getByTestId('model-validation-message')).toHaveTextContent('Model identifier cannot be empty')
      })
    })

    it('should validate string length constraints from schema', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const longName = 'x'.repeat(256) // Exceeds 255 character limit
      
      await user.type(nameInput, longName)
      await user.tab()

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveTextContent('Agent name cannot exceed 255 characters')
        expect(nameValidation).toHaveClass('validation-error')
      })
    })

    it('should validate prompt length constraints', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const promptInput = screen.getByTestId('agent-prompt-input')
      const longPrompt = 'x'.repeat(5001) // Exceeds 5000 character limit
      
      await user.type(promptInput, longPrompt)
      
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const promptValidation = screen.getByTestId('prompt-validation-message')
        expect(promptValidation).toHaveTextContent('Agent prompt cannot exceed 5000 characters')
        expect(promptValidation).toHaveClass('validation-error')
      })
    })

    it('should validate array constraints for tools field', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Tools array can be empty (valid)
      const submitButton = screen.getByTestId('form-submit-button')
      
      // First fill required fields
      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      const modelSelect = screen.getByTestId('agent-model-select')
      
      await user.type(nameInput, 'Test Agent')
      await user.type(promptInput, 'Test prompt')
      await user.selectOptions(modelSelect, 'gpt-4')

      await user.click(submitButton)

      await waitFor(() => {
        // Should not show tools validation error for empty array
        const toolsValidation = screen.queryByTestId('tools-validation-error')
        expect(toolsValidation).not.toBeInTheDocument()
      })
    })

    it('should show TypeScript type inference in validation errors', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Force a type validation error
      const form = screen.getByTestId('agent-config-form')
      
      // Test that the form data types are properly inferred
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test')
      
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const formData = form.getAttribute('data-form-values')
        if (formData) {
          const parsed = JSON.parse(formData)
          // Type assertion to verify schema inference
          const nameType: string = parsed.name
          expect(typeof nameType).toBe('string')
        }
      })
    })
  })

  describe('Form State Management', () => {
    it('should track touched fields correctly', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')

      // Touch name field
      await user.click(nameInput)
      await user.tab()

      expect(nameInput).toHaveAttribute('data-touched', 'true')
      expect(promptInput).toHaveAttribute('data-touched', 'false')

      // Touch prompt field
      await user.click(promptInput)
      await user.tab()

      expect(promptInput).toHaveAttribute('data-touched', 'true')
    })

    it('should calculate form validity based on all field validations', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const form = screen.getByTestId('agent-config-form')
      const submitButton = screen.getByTestId('form-submit-button')

      // Form should be invalid initially
      expect(form).toHaveAttribute('data-valid', 'false')
      expect(submitButton).toBeDisabled()

      // Fill all required fields
      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      const modelSelect = screen.getByTestId('agent-model-select')

      await user.type(nameInput, 'Valid Agent')
      await user.type(promptInput, 'Valid prompt for testing')
      await user.selectOptions(modelSelect, 'gpt-4')

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(form).toHaveAttribute('data-valid', 'true')
        expect(submitButton).toBeEnabled()
      })
    })

    it('should handle form reset functionality', async () => {
      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const resetButton = screen.getByTestId('form-reset-button')

      // Modify the form
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')

      const form = screen.getByTestId('agent-config-form')
      expect(form).toHaveAttribute('data-dirty', 'true')

      // Reset the form
      await user.click(resetButton)

      expect(nameInput).toHaveValue(baseAgentConfig.name)
      expect(form).toHaveAttribute('data-dirty', 'false')
    })

    it('should handle form submission with valid data', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Fill form with valid data
      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      const modelSelect = screen.getByTestId('agent-model-select')
      const webSearchCheckbox = screen.getByTestId('tool-checkbox-web-search')

      await user.type(nameInput, 'Test Agent')
      await user.type(promptInput, 'You are a helpful assistant.')
      await user.selectOptions(modelSelect, 'gpt-4')
      await user.click(webSearchCheckbox)

      const submitButton = screen.getByTestId('form-submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockInspectorCallbacks.onFormSubmit).toHaveBeenCalledWith({
          name: 'Test Agent',
          prompt: 'You are a helpful assistant.',
          model: 'gpt-4',
          tools: ['web-search'],
          config: expect.any(Object),
        })
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should recover from validation errors when corrected', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      // Enter invalid data
      await user.type(nameInput, 'x'.repeat(256))
      await user.tab()

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveClass('validation-error')
      })

      // Correct the data
      await user.clear(nameInput)
      await user.type(nameInput, 'Valid Agent Name')
      await user.tab()

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveClass('validation-success')
      })
    })

    it('should handle concurrent validation requests gracefully', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      // Rapidly type to trigger multiple validation requests
      await user.type(nameInput, 'A')
      await user.type(nameInput, 'B')
      await user.type(nameInput, 'C')
      await user.type(nameInput, 'D')

      // Advance timer partially to simulate overlapping requests
      vi.advanceTimersByTime(100)
      
      await user.type(nameInput, 'E')
      await user.type(nameInput, 'F')

      // Complete all debounce timers
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        // Should show result for final input value
        expect(nameInput).toHaveValue('ABCDEF')
        expect(nameValidation).toHaveClass('validation-success')
      })
    })

    it('should maintain form state during validation errors', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')

      // Fill one field with valid data, another with invalid
      await user.type(nameInput, 'Valid Name')
      await user.type(promptInput, 'x'.repeat(5001)) // Invalid length

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        // Valid field should maintain its value and state
        expect(nameInput).toHaveValue('Valid Name')
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveClass('validation-success')

        // Invalid field should show error but maintain value
        expect(promptInput).toHaveValue('x'.repeat(5001))
        const promptValidation = screen.getByTestId('prompt-validation-message')
        expect(promptValidation).toHaveClass('validation-error')
      })
    })
  })
})