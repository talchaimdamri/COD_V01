/**
 * Unit Tests for Agent Config Form Auto-Save Functionality (Task 9.3)
 * 
 * Tests the auto-save system with visual feedback and unsaved changes warning.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AgentConfigForm } from '../../../../src/components/inspector/AgentConfigForm'
import {
  baseAgentConfig,
  availableModels,
  availableTools,
} from '../../../fixtures/inspector'

// Mock auto-save callback
const mockAutoSave = vi.fn()
const mockOnSubmit = vi.fn()
const mockOnChange = vi.fn()

describe('Agent Config Form Auto-Save Functionality (Task 9.3)', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  describe('Auto-Save Status Display', () => {
    it('should show auto-save status component when enabled', () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
        />
      )

      const autoSaveStatus = screen.getByTestId('auto-save-status')
      expect(autoSaveStatus).toBeInTheDocument()
      expect(autoSaveStatus).toHaveClass('auto-save-clean')
      expect(autoSaveStatus).toHaveTextContent('All changes saved')
    })

    it('should hide auto-save status when disabled', () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          autoSaveEnabled={false}
        />
      )

      expect(screen.queryByTestId('auto-save-status')).not.toBeInTheDocument()
    })
  })

  describe('Auto-Save Behavior', () => {
    it('should trigger auto-save after interval when form changes', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
          autoSaveInterval={1000}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')

      // Should show unsaved changes immediately
      const autoSaveStatus = screen.getByTestId('auto-save-status')
      expect(autoSaveStatus).toHaveClass('auto-save-unsaved')
      expect(autoSaveStatus).toHaveTextContent('Unsaved changes')

      // Advance timer to trigger auto-save
      vi.advanceTimersByTime(1000)

      await waitFor(() => {
        expect(mockAutoSave).toHaveBeenCalledWith({
          name: 'Test Agent',
          prompt: '',
          model: '',
          tools: [],
          description: '',
        })
      })
    })

    it('should show saving status during auto-save operation', async () => {
      // Make auto-save promise that we can control
      let resolveSave: () => void
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve
      })
      mockAutoSave.mockReturnValue(savePromise)

      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
          autoSaveInterval={100}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')
      
      vi.advanceTimersByTime(100)

      await waitFor(() => {
        const autoSaveStatus = screen.getByTestId('auto-save-status')
        expect(autoSaveStatus).toHaveClass('auto-save-saving')
        expect(autoSaveStatus).toHaveTextContent('Saving...')
      })

      // Resolve the save
      resolveSave!()

      await waitFor(() => {
        const autoSaveStatus = screen.getByTestId('auto-save-status')
        expect(autoSaveStatus).toHaveClass('auto-save-saved')
        expect(autoSaveStatus).toHaveTextContent('Saved at')
      })
    })

    it('should show error status when auto-save fails', async () => {
      mockAutoSave.mockRejectedValue(new Error('Save failed'))

      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
          autoSaveInterval={100}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test Agent')
      
      vi.advanceTimersByTime(100)

      await waitFor(() => {
        const autoSaveStatus = screen.getByTestId('auto-save-status')
        expect(autoSaveStatus).toHaveClass('auto-save-error')
        expect(autoSaveStatus).toHaveTextContent('Save failed')
      })
    })

    it('should not auto-save invalid form data', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
          autoSaveInterval={100}
        />
      )

      // Enter invalid data (empty name)
      const promptInput = screen.getByTestId('agent-prompt-input')
      await user.type(promptInput, 'Test prompt')
      
      vi.advanceTimersByTime(100)

      // Should not call auto-save for invalid data
      expect(mockAutoSave).not.toHaveBeenCalled()
    })
  })

  describe('Form Reset with Unsaved Changes Warning', () => {
    it('should show confirmation dialog when resetting with unsaved changes', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')

      const resetButton = screen.getByTestId('form-reset-button')
      await user.click(resetButton)

      expect(confirmSpy).toHaveBeenCalledWith(
        'You have unsaved changes. Are you sure you want to reset the form?'
      )

      confirmSpy.mockRestore()
    })

    it('should not reset form if user cancels confirmation', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
        />
      )

      const nameInput = screen.getByTestId('agent-name-input')
      await user.clear(nameInput)
      await user.type(nameInput, 'Modified Name')

      const resetButton = screen.getByTestId('form-reset-button')
      await user.click(resetButton)

      // Form should keep modified value
      expect(nameInput).toHaveValue('Modified Name')

      confirmSpy.mockRestore()
    })

    it('should reset without confirmation when no unsaved changes', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm')

      render(
        <AgentConfigForm
          agent={baseAgentConfig}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
        />
      )

      const resetButton = screen.getByTestId('form-reset-button')
      await user.click(resetButton)

      // Should not show confirmation
      expect(confirmSpy).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Form Data Attributes', () => {
    it('should set correct data attributes for auto-save state', async () => {
      render(
        <AgentConfigForm
          agent={null}
          availableModels={availableModels}
          availableTools={availableTools}
          onSubmit={mockOnSubmit}
          onAutoSave={mockAutoSave}
          autoSaveEnabled={true}
        />
      )

      const form = screen.getByTestId('agent-config-form')
      
      // Initially clean
      expect(form).toHaveAttribute('data-auto-save-status', 'idle')
      expect(form).toHaveAttribute('data-has-unsaved-changes', 'false')

      // Make changes
      const nameInput = screen.getByTestId('agent-name-input')
      await user.type(nameInput, 'Test')

      expect(form).toHaveAttribute('data-has-unsaved-changes', 'true')
    })
  })
})