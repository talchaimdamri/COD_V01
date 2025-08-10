/**
 * Unit Tests for Agent Property Display and Editing (Task 9.3) - Happy Path
 * 
 * TDD tests for agent name, prompt textarea, and property editing interface.
 * These are FAILING tests that define expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentPropertiesForm } from '../../../../src/components/inspector/AgentPropertiesForm'
import {
  baseAgentConfig,
  complexAgentConfig,
  emptyAgentConfig,
  mockInspectorCallbacks,
  performanceBenchmarks,
} from '../../../fixtures/inspector'

describe('Agent Property Display and Editing - Happy Path', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    
    // Mock localStorage for auto-save
    const mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    }
    vi.stubGlobal('localStorage', mockLocalStorage)
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('Agent Name Input Field', () => {
    it('should render agent name input with current value', () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      expect(nameInput).toBeInTheDocument()
      expect(nameInput).toHaveValue(baseAgentConfig.name)
      expect(nameInput).toHaveAttribute('type', 'text')
      expect(nameInput).toHaveAttribute('placeholder', expect.any(String))
    })

    it('should render empty name input for new agent', () => {
      render(
        <AgentPropertiesForm
          agent={null}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      expect(nameInput).toHaveValue('')
      expect(nameInput).toHaveAttribute('placeholder', 'Enter agent name...')
    })

    it('should handle name input changes with real-time validation', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Agent Name')

      // Should show real-time validation feedback
      await waitFor(() => {
        const validationIcon = screen.getByTestId('name-validation-icon')
        expect(validationIcon).toHaveClass('validation-success')
      })

      // Should call onChange with updated data
      expect(mockInspectorCallbacks.onFormChange).toHaveBeenCalledWith({
        field: 'name',
        value: 'Updated Agent Name',
        isValid: true,
        isDirty: true,
      })
    })

    it('should show character count indicator for name field', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const charCount = screen.getByTestId('name-char-count')

      expect(charCount).toHaveTextContent(`${baseAgentConfig.name.length}/255`)

      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      await waitFor(() => {
        expect(charCount).toHaveTextContent('8/255')
      })
    })

    it('should highlight name field when focused', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      await user.click(nameInput)

      expect(nameInput).toHaveClass('input-focused')
      expect(nameInput).toHaveFocus()
    })

    it('should show validation error styles for invalid name', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      await user.clear(nameInput)
      await user.tab() // Trigger validation on blur

      await waitFor(() => {
        expect(nameInput).toHaveClass('input-error')
        expect(nameInput).toHaveAttribute('aria-invalid', 'true')
        
        const errorMessage = screen.getByTestId('name-error-message')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveTextContent('Agent name is required')
      })
    })
  })

  describe('Prompt Textarea Field', () => {
    it('should render expandable prompt textarea with current value', () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      expect(promptTextarea).toBeInTheDocument()
      expect(promptTextarea).toHaveValue(baseAgentConfig.prompt)
      expect(promptTextarea).toHaveAttribute('placeholder', expect.any(String))
      expect(promptTextarea).toHaveAttribute('rows', expect.any(String))
    })

    it('should expand textarea height based on content', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      const initialHeight = promptTextarea.style.height

      // Add multiple lines of content
      const longPrompt = Array.from({ length: 10 }, (_, i) => `Line ${i + 1} of the prompt`).join('\n')
      
      await user.clear(promptTextarea)
      await user.type(promptTextarea, longPrompt)

      await waitFor(() => {
        const newHeight = promptTextarea.style.height
        expect(parseInt(newHeight)).toBeGreaterThan(parseInt(initialHeight) || 0)
      })
    })

    it('should show character count with limit indication', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const charCount = screen.getByTestId('prompt-char-count')
      expect(charCount).toHaveTextContent(`${baseAgentConfig.prompt.length}/5000`)
      expect(charCount).toHaveClass('char-count-normal')

      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      
      // Add text to approach limit
      const nearLimitText = 'x'.repeat(4900 - baseAgentConfig.prompt.length)
      await user.type(promptTextarea, nearLimitText)

      await waitFor(() => {
        expect(charCount).toHaveClass('char-count-warning')
      })
    })

    it('should provide resize handle for manual height adjustment', () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const promptContainer = screen.getByTestId('prompt-container')
      const resizeHandle = screen.getByTestId('prompt-resize-handle')

      expect(resizeHandle).toBeInTheDocument()
      expect(resizeHandle).toHaveClass('resize-handle')
      expect(promptContainer).toHaveStyle({ resize: 'vertical' })
    })

    it('should handle prompt changes with debounced auto-save', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          autoSave={true}
          autoSaveDelay={1000}
        />
      )

      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      
      await user.type(promptTextarea, ' Additional prompt text.')

      // Should not auto-save immediately
      expect(mockInspectorCallbacks.onSave).not.toHaveBeenCalled()

      // Should show auto-save pending indicator
      const autoSaveIndicator = screen.getByTestId('auto-save-indicator')
      expect(autoSaveIndicator).toHaveTextContent('Saving...')

      // Advance timer to trigger auto-save
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockInspectorCallbacks.onSave).toHaveBeenCalledWith({
          ...baseAgentConfig,
          prompt: baseAgentConfig.prompt + ' Additional prompt text.',
        })
        expect(autoSaveIndicator).toHaveTextContent('Saved')
      })
    })

    it('should support markdown formatting preview', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          enableMarkdownPreview={true}
        />
      )

      const markdownToggle = screen.getByTestId('markdown-preview-toggle')
      expect(markdownToggle).toBeInTheDocument()

      await user.click(markdownToggle)

      const markdownPreview = screen.getByTestId('markdown-preview')
      expect(markdownPreview).toBeInTheDocument()
      expect(markdownPreview).toHaveClass('markdown-rendered')
    })
  })

  describe('Description Field', () => {
    it('should render optional description field', () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const descriptionInput = screen.getByTestId('agent-description-input')
      expect(descriptionInput).toBeInTheDocument()
      expect(descriptionInput).toHaveAttribute('placeholder', 'Optional description...')
    })

    it('should handle description changes without validation errors', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const descriptionInput = screen.getByTestId('agent-description-input')
      
      await user.type(descriptionInput, 'This agent handles document processing tasks')

      expect(mockInspectorCallbacks.onFormChange).toHaveBeenCalledWith({
        field: 'description',
        value: 'This agent handles document processing tasks',
        isValid: true,
        isDirty: true,
      })

      // Should not show any validation errors for optional field
      expect(screen.queryByTestId('description-error-message')).not.toBeInTheDocument()
    })

    it('should support multiline descriptions', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const descriptionInput = screen.getByTestId('agent-description-input')
      const multilineDescription = 'Line 1\nLine 2\nLine 3'
      
      await user.type(descriptionInput, multilineDescription)

      expect(descriptionInput).toHaveValue(multilineDescription)
    })
  })

  describe('Auto-Save Functionality', () => {
    it('should show auto-save status indicators', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          autoSave={true}
        />
      )

      const autoSaveIndicator = screen.getByTestId('auto-save-indicator')
      expect(autoSaveIndicator).toHaveTextContent('All changes saved')

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, ' Updated')

      // Should show pending state
      await waitFor(() => {
        expect(autoSaveIndicator).toHaveTextContent('Saving...')
        expect(autoSaveIndicator).toHaveClass('auto-save-pending')
      })
    })

    it('should handle auto-save success feedback', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          autoSave={true}
          autoSaveDelay={300}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, ' Updated')

      vi.advanceTimersByTime(300)

      await waitFor(() => {
        const autoSaveIndicator = screen.getByTestId('auto-save-indicator')
        expect(autoSaveIndicator).toHaveTextContent('Saved')
        expect(autoSaveIndicator).toHaveClass('auto-save-success')
      })

      // Success indicator should fade after delay
      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        const autoSaveIndicator = screen.getByTestId('auto-save-indicator')
        expect(autoSaveIndicator).toHaveTextContent('All changes saved')
      })
    })

    it('should persist draft changes to localStorage', async () => {
      const mockSetItem = vi.fn()
      vi.stubGlobal('localStorage', { 
        getItem: vi.fn(),
        setItem: mockSetItem,
        removeItem: vi.fn(),
      })

      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          persistDraft={true}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, ' Draft Changes')

      vi.advanceTimersByTime(500) // Draft save delay

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(
          `agent-draft-${baseAgentConfig.id}`,
          expect.stringContaining(baseAgentConfig.name + ' Draft Changes')
        )
      })
    })

    it('should restore draft changes from localStorage', () => {
      const draftData = {
        name: 'Draft Agent Name',
        prompt: 'Draft prompt content',
        description: 'Draft description',
      }

      const mockGetItem = vi.fn().mockReturnValue(JSON.stringify(draftData))
      vi.stubGlobal('localStorage', { 
        getItem: mockGetItem,
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          persistDraft={true}
        />
      )

      // Should show draft restoration notification
      const draftNotification = screen.getByTestId('draft-restored-notification')
      expect(draftNotification).toBeInTheDocument()
      expect(draftNotification).toHaveTextContent('Draft changes restored')

      // Form fields should contain draft values
      const nameInput = screen.getByTestId('agent-name-input')
      expect(nameInput).toHaveValue(draftData.name)
    })
  })

  describe('Form Reset and Cancel', () => {
    it('should reset form to original values', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const resetButton = screen.getByTestId('form-reset-button')

      // Modify form values
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')

      expect(nameInput).toHaveValue('Modified Name')

      // Reset form
      await user.click(resetButton)

      expect(nameInput).toHaveValue(baseAgentConfig.name)
      
      // Should clear dirty state
      const form = screen.getByTestId('agent-properties-form')
      expect(form).toHaveAttribute('data-dirty', 'false')
    })

    it('should show confirmation dialog for unsaved changes', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          confirmUnsavedChanges={true}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const cancelButton = screen.getByTestId('form-cancel-button')

      // Make changes
      await user.type(nameInput, ' Modified')

      await user.click(cancelButton)

      // Should show confirmation dialog
      const confirmDialog = screen.getByTestId('unsaved-changes-dialog')
      expect(confirmDialog).toBeInTheDocument()
      expect(confirmDialog).toHaveTextContent('You have unsaved changes')

      const discardButton = screen.getByTestId('discard-changes-button')
      await user.click(discardButton)

      expect(mockInspectorCallbacks.onCancel).toHaveBeenCalled()
    })

    it('should clear draft data on successful save', async () => {
      const mockRemoveItem = vi.fn()
      vi.stubGlobal('localStorage', { 
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: mockRemoveItem,
      })

      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
          persistDraft={true}
        />
      )

      const saveButton = screen.getByTestId('form-save-button')
      await user.click(saveButton)

      await waitFor(() => {
        expect(mockInspectorCallbacks.onSave).toHaveBeenCalled()
        expect(mockRemoveItem).toHaveBeenCalledWith(`agent-draft-${baseAgentConfig.id}`)
      })
    })
  })

  describe('Visual Feedback and Indicators', () => {
    it('should show field validation icons', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      // Valid input should show success icon
      await user.type(nameInput, ' Valid')

      const nameValidationIcon = screen.getByTestId('name-validation-icon')
      expect(nameValidationIcon).toHaveClass('validation-success-icon')

      // Invalid input should show error icon
      await user.clear(nameInput)
      await user.tab()

      await waitFor(() => {
        expect(nameValidationIcon).toHaveClass('validation-error-icon')
      })
    })

    it('should highlight required fields when empty', () => {
      render(
        <AgentPropertiesForm
          agent={emptyAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')

      expect(nameInput).toHaveClass('field-required')
      expect(promptTextarea).toHaveClass('field-required')
      
      const nameLabel = screen.getByTestId('name-field-label')
      const promptLabel = screen.getByTestId('prompt-field-label')
      
      expect(nameLabel).toHaveClass('label-required')
      expect(promptLabel).toHaveClass('label-required')
    })

    it('should show progress indicators for field validation', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      await user.type(nameInput, ' Test')

      // Should show validation progress during debounce
      const validationSpinner = screen.getByTestId('name-validation-spinner')
      expect(validationSpinner).toBeInTheDocument()
      
      vi.advanceTimersByTime(300)

      await waitFor(() => {
        expect(validationSpinner).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Support', () => {
    it('should provide proper ARIA labels and descriptions', () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')

      expect(nameInput).toHaveAttribute('aria-label', 'Agent name')
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-help-text')
      
      expect(promptTextarea).toHaveAttribute('aria-label', 'Agent prompt')
      expect(promptTextarea).toHaveAttribute('aria-describedby', 'prompt-help-text')
    })

    it('should support keyboard navigation between fields', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      const promptTextarea = screen.getByTestId('agent-prompt-textarea')
      const descriptionInput = screen.getByTestId('agent-description-input')

      nameInput.focus()
      expect(nameInput).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(promptTextarea).toHaveFocus()

      await user.keyboard('{Tab}')
      expect(descriptionInput).toHaveFocus()
    })

    it('should announce validation changes to screen readers', async () => {
      render(
        <AgentPropertiesForm
          agent={baseAgentConfig}
          onSave={mockInspectorCallbacks.onSave}
          onChange={mockInspectorCallbacks.onFormChange}
          onCancel={mockInspectorCallbacks.onCancel}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      
      await user.clear(nameInput)
      await user.tab()

      await waitFor(() => {
        const errorAnnouncement = screen.getByTestId('name-error-announcement')
        expect(errorAnnouncement).toHaveAttribute('aria-live', 'assertive')
        expect(errorAnnouncement).toHaveTextContent('Agent name is required')
      })
    })
  })
})