/**
 * Unit Tests for React Hook Form Integration (Task 9.2) - Error Cases
 * 
 * TDD tests for form management system error handling and edge cases.
 * These are FAILING tests that define expected error behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentConfigForm } from '../../../../src/components/inspector/AgentConfigForm'
import {
  baseAgentConfig,
  invalidFormState,
  availableModels,
  availableTools,
  mockInspectorCallbacks,
  validationScenarios,
  errorScenarios,
} from '../../../fixtures/inspector'

describe('React Hook Form Integration - Error Cases', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // Mock console.error to test error handling
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Validation Schema Errors', () => {
    it('should handle empty name field validation error', async () => {
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
      const submitButton = screen.getByTestId('form-submit-button')

      // Try to submit with empty name
      await user.click(submitButton)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveTextContent('Agent name cannot be empty')
        expect(nameValidation).toHaveClass('validation-error')
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
        expect(nameInput).toHaveAttribute('aria-describedby', expect.stringContaining('name-error'))
      })
    })

    it('should handle name length exceeded validation error', async () => {
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
      
      await user.type(nameInput, 'x'.repeat(256)) // Exceeds 255 limit
      await user.tab()

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveTextContent('Agent name cannot exceed 255 characters')
        expect(nameValidation).toHaveClass('validation-error')
        expect(nameInput).toHaveClass('input-error')
      })
    })

    it('should handle prompt length exceeded validation error', async () => {
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
      
      // Type characters to exceed limit
      const longPrompt = 'x'.repeat(5001)
      await user.type(promptInput, longPrompt)

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const promptValidation = screen.getByTestId('prompt-validation-message')
        expect(promptValidation).toHaveTextContent('Agent prompt cannot exceed 5000 characters')
        expect(promptValidation).toHaveClass('validation-error')
        
        // Should show character count indicator
        const charCount = screen.getByTestId('prompt-char-count')
        expect(charCount).toHaveTextContent('5001/5000')
        expect(charCount).toHaveClass('char-count-exceeded')
      })
    })

    it('should handle invalid model selection error', async () => {
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
      
      // Mock selecting unavailable model
      fireEvent.change(modelSelect, { target: { value: 'unavailable-model' } })

      await waitFor(() => {
        const modelValidation = screen.getByTestId('model-validation-message')
        expect(modelValidation).toHaveTextContent('Selected model is not available')
        expect(modelValidation).toHaveClass('validation-error')
        expect(modelSelect).toHaveClass('select-error')
      })
    })

    it('should handle incompatible tools selection error', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Select a model with limited tool compatibility
      const modelSelect = screen.getByTestId('agent-model-select')
      await user.selectOptions(modelSelect, 'gpt-3.5-turbo')

      // Try to select incompatible tool
      const incompatibleTool = screen.getByTestId('tool-checkbox-image-processor')
      await user.click(incompatibleTool)

      await waitFor(() => {
        const toolsValidation = screen.getByTestId('tools-validation-message')
        expect(toolsValidation).toHaveTextContent(expect.stringContaining('not compatible'))
        expect(toolsValidation).toHaveClass('validation-error')
        expect(incompatibleTool).toHaveClass('checkbox-error')
      })
    })

    it('should handle multiple validation errors simultaneously', async () => {
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
      const submitButton = screen.getByTestId('form-submit-button')

      // Create multiple validation errors
      await user.type(nameInput, 'x'.repeat(256)) // Too long
      await user.type(promptInput, '') // Empty (if required)
      
      await user.click(submitButton)

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        const promptValidation = screen.getByTestId('prompt-validation-message')
        const modelValidation = screen.getByTestId('model-validation-message')

        expect(nameValidation).toHaveClass('validation-error')
        expect(promptValidation).toHaveClass('validation-error')
        expect(modelValidation).toHaveClass('validation-error')

        // Form should be invalid
        const form = screen.getByTestId('agent-config-form')
        expect(form).toHaveAttribute('data-valid', 'false')
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Form State Management Errors', () => {
    it('should handle form initialization with invalid agent data', () => {
      const corruptedAgent = {
        ...baseAgentConfig,
        name: null, // Invalid type
        prompt: undefined, // Invalid type
        tools: 'not-an-array', // Invalid type
      } as any

      expect(() => {
        render(
          <AgentConfigForm
            agent={corruptedAgent}
            availableModels={availableModels}
            availableTools={availableTools}
            onSubmit={mockInspectorCallbacks.onFormSubmit}
            onChange={mockInspectorCallbacks.onFormChange}
          />
        )
      }).not.toThrow()

      // Should show error state or fallback values
      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      
      expect(nameInput).toHaveValue('') // Fallback to empty
      expect(promptInput).toHaveValue('') // Fallback to empty
    })

    it('should handle callback execution errors gracefully', async () => {
      const throwingOnChange = vi.fn(() => {
        throw new Error('onChange callback error')
      })

      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={throwingOnChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')

      expect(() => {
        user.type(nameInput, 'Test')
      }).not.toThrow()

      vi.advanceTimersByTime(300)

      expect(throwingOnChange).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Form callback error'),
        expect.any(Error)
      )
    })

    it('should handle form submission with callback errors', async () => {
      const throwingOnSubmit = vi.fn(() => {
        throw new Error('onSubmit callback error')
      })

      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={throwingOnSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      // Fill form with valid data
      const nameInput = screen.getByTestId('agent-name-input')
      const promptInput = screen.getByTestId('agent-prompt-input')
      const modelSelect = screen.getByTestId('agent-model-select')

      await user.type(nameInput, 'Test Agent')
      await user.type(promptInput, 'Test prompt')
      await user.selectOptions(modelSelect, 'gpt-4')

      const submitButton = screen.getByTestId('form-submit-button')
      
      expect(() => {
        user.click(submitButton)
      }).not.toThrow()

      await waitFor(() => {
        expect(throwingOnSubmit).toHaveBeenCalled()
        expect(console.error).toHaveBeenCalledWith(
          expect.stringContaining('Form submission error'),
          expect.any(Error)
        )
      })

      // Form should show error state
      const form = screen.getByTestId('agent-config-form')
      expect(form).toHaveAttribute('data-submission-error', 'true')
    })

    it('should handle debounce timer cleanup errors', () => {
      const originalClearTimeout = globalThis.clearTimeout
      globalThis.clearTimeout = vi.fn(() => {
        throw new Error('Timer cleanup error')
      })

      const { unmount } = render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      expect(() => {
        unmount()
      }).not.toThrow()

      globalThis.clearTimeout = originalClearTimeout
    })
  })

  describe('Validation System Errors', () => {
    it('should handle Zod schema validation failures', async () => {
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
      
      // Input data that would cause schema parsing to fail
      const invalidData = { toString: () => { throw new Error('toString error') } }
      
      // Mock the input to have problematic value
      Object.defineProperty(nameInput, 'value', {
        get: () => invalidData,
        configurable: true,
      })

      fireEvent.blur(nameInput)
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toHaveClass('validation-error')
        expect(nameValidation).toHaveTextContent(expect.stringContaining('validation failed'))
      })
    })

    it('should handle async validation timeouts', async () => {
      // Mock a validation that takes too long
      const originalSetTimeout = globalThis.setTimeout
      globalThis.setTimeout = vi.fn((callback, delay) => {
        if (delay === 300) { // Debounce timeout
          // Never call the callback to simulate timeout
          return 123
        }
        return originalSetTimeout(callback, delay)
      })

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
      await user.type(nameInput, 'Test Name')

      vi.advanceTimersByTime(5000) // Wait longer than expected

      // Should show loading or timeout state
      const nameValidation = screen.getByTestId('name-validation-message')
      expect(nameValidation).toHaveClass('validation-pending')

      globalThis.setTimeout = originalSetTimeout
    })

    it('should handle validation race conditions', async () => {
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

      // Rapidly type different values
      await user.type(nameInput, 'First')
      vi.advanceTimersByTime(100) // Partial debounce
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Second')
      vi.advanceTimersByTime(100) // Partial debounce
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Third')
      vi.advanceTimersByTime(300) // Complete debounce

      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        // Should show result for the final value only
        expect(nameInput).toHaveValue('Third')
        expect(nameValidation).toHaveClass('validation-success')
      })
    })

    it('should handle circular validation dependencies', async () => {
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
      const toolCheckbox = screen.getByTestId('tool-checkbox-image-processor')

      // Create circular dependency: model affects tools, tools affect model validation
      await user.selectOptions(modelSelect, 'gpt-3.5-turbo') // Model with limited tool support
      await user.click(toolCheckbox) // Select incompatible tool

      // This should trigger model revalidation due to tool incompatibility
      // Should not cause infinite validation loop

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const modelValidation = screen.getByTestId('model-validation-message')
        const toolsValidation = screen.getByTestId('tools-validation-message')

        // Should show appropriate errors without infinite loop
        expect(toolsValidation).toHaveClass('validation-error')
        expect(toolsValidation).toHaveTextContent(expect.stringContaining('not compatible'))
      })
    })
  })

  describe('External Dependencies Errors', () => {
    it('should handle missing React Hook Form dependency', () => {
      // Mock useForm to throw error
      const mockUseForm = vi.fn(() => {
        throw new Error('useForm is not available')
      })

      expect(() => {
        render(
          <AgentConfigForm
            agent={null}
            availableModels={availableModels}
            availableTools={availableTools}
            onSubmit={mockInspectorCallbacks.onFormSubmit}
            onChange={mockInspectorCallbacks.onFormChange}
          />
        )
      }).not.toThrow()

      // Should show fallback error state
      const errorFallback = screen.getByTestId('form-error-fallback')
      expect(errorFallback).toBeInTheDocument()
      expect(errorFallback).toHaveTextContent(expect.stringContaining('form initialization failed'))
    })

    it('should handle missing Zod dependency', () => {
      // Mock Zod schema parsing to fail
      expect(() => {
        render(
          <AgentConfigForm
            agent={null}
            availableModels={availableModels}
            availableTools={availableTools}
            onSubmit={mockInspectorCallbacks.onFormSubmit}
            onChange={mockInspectorCallbacks.onFormChange}
          />
        )
      }).not.toThrow()

      // Form should still render but without validation
      const form = screen.getByTestId('agent-config-form')
      expect(form).toHaveAttribute('data-validation-disabled', 'true')
    })

    it('should handle resolver initialization failures', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const submitButton = screen.getByTestId('form-submit-button')
      
      // Mock resolver to fail
      const originalSubmit = submitButton.onclick
      submitButton.onclick = () => {
        throw new Error('Resolver validation failed')
      }

      expect(() => {
        user.click(submitButton)
      }).not.toThrow()

      await waitFor(() => {
        const form = screen.getByTestId('agent-config-form')
        expect(form).toHaveAttribute('data-resolver-error', 'true')
      })
    })
  })

  describe('Memory and Performance Errors', () => {
    it('should handle memory leaks in validation debouncing', async () => {
      const { unmount } = render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockInspectorCallbacks.onFormSubmit}
          onChange={mockInspectorCallbacks.onFormChange}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')

      // Create many pending validations
      for (let i = 0; i < 100; i++) {
        await user.type(nameInput, i.toString())
      }

      // Unmount before debounce completes
      expect(() => {
        unmount()
      }).not.toThrow()

      // Advance timers after unmount - should not cause errors
      vi.advanceTimersByTime(1000)
    })

    it('should handle excessive validation requests', async () => {
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

      // Simulate rapid typing that could overwhelm validation
      const promises = []
      for (let i = 0; i < 1000; i++) {
        promises.push(user.type(nameInput, 'a'))
      }

      await Promise.all(promises)
      vi.advanceTimersByTime(300)

      // Should not crash and should show final validation state
      await waitFor(() => {
        const nameValidation = screen.getByTestId('name-validation-message')
        expect(nameValidation).toBeInTheDocument()
      })
    })

    it('should handle form state corruption', async () => {
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
      
      // Simulate form state corruption
      const corruptEvent = new Event('input')
      Object.defineProperty(corruptEvent, 'target', {
        value: {
          name: 'corrupted-field',
          value: { circular: {} },
        },
      })
      
      // Create circular reference
      ;(corruptEvent.target.value as any).circular.self = corruptEvent.target.value

      expect(() => {
        fireEvent(form, corruptEvent)
      }).not.toThrow()

      // Form should handle corruption gracefully
      expect(form).toHaveAttribute('data-error-recovery', 'true')
    })
  })
})