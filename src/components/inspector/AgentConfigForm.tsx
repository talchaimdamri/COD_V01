/**
 * Agent Configuration Form Component (Task 9.2)
 * 
 * React Hook Form integration with Zod validation for agent configuration.
 * Provides real-time validation with debounced feedback for better UX.
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Agent } from '../../schemas/database/agent'
import { CreateAgentRequestSchema } from '../../schemas/api/agents'

import { ModelOption, ToolOption } from '../../types/models'
import { ModelSelector } from './ModelSelector'
import { ToolsConfiguration } from './ToolsConfiguration'

// Form data type based on Agent schema
export interface AgentFormData {
  name: string
  prompt: string
  model: string
  tools: string[]
  description?: string
}

// Form validation schema based on existing Agent schema
const AgentConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Agent name cannot be empty')
    .max(255, 'Agent name cannot exceed 255 characters'),
  prompt: z
    .string()
    .min(1, 'Agent prompt cannot be empty')
    .max(5000, 'Agent prompt cannot exceed 5000 characters'),
  model: z
    .string()
    .min(1, 'Model identifier cannot be empty'),
  tools: z
    .array(z.string())
    .default([]),
  description: z
    .string()
    .optional(),
})

export interface AgentConfigFormProps {
  agent: Agent | null
  availableModels: ModelOption[]
  availableTools: ToolOption[]
  onSubmit: (data: AgentFormData) => void | Promise<void>
  onChange?: (data: Partial<AgentFormData>) => void
  onReset?: () => void
  onAutoSave?: (data: AgentFormData) => Promise<void>
  autoSaveEnabled?: boolean
  autoSaveInterval?: number // milliseconds, default 2000ms
  onToolConfigChange?: (toolId: string, config: Record<string, any>) => void
  showAdvancedToolConfig?: boolean
}

export const AgentConfigForm: React.FC<AgentConfigFormProps> = ({
  agent,
  availableModels,
  availableTools,
  onSubmit,
  onChange,
  onReset,
  onAutoSave,
  autoSaveEnabled = true,
  autoSaveInterval = 2000,
  onToolConfigChange,
  showAdvancedToolConfig = false,
}) => {
  // Auto-save state management
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSaveDataRef = useRef<string>('')
  
  // Tools validation state
  const [toolsValidation, setToolsValidation] = useState<{ isValid: boolean; errors?: string[] }>({ isValid: true })
  
  // Initialize form with default values
  const defaultValues: AgentFormData = useMemo(() => ({
    name: agent?.name || '',
    prompt: agent?.prompt || '',
    model: agent?.model || '',
    tools: agent?.tools || [],
    description: agent?.config?.description || '',
  }), [agent])

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    trigger,
    formState: {
      errors,
      isValid,
      isDirty,
      isSubmitting,
      touchedFields,
      isValidating,
    },
  } = useForm<AgentFormData>({
    resolver: zodResolver(AgentConfigSchema),
    defaultValues,
    mode: 'onSubmit', // Only validate on submit initially
    reValidateMode: 'onChange', // Re-validate on subsequent changes
    criteriaMode: 'all', // Show all validation errors
    shouldFocusError: true, // Focus on error fields
  })

  // Watch all form values for onChange callback
  const watchedValues = watch()

  // Trigger validation when we have valid initial data
  useEffect(() => {
    // Check if we have complete valid initial data
    const hasValidInitialData = agent?.name && agent?.prompt && agent?.model
    if (hasValidInitialData) {
      // Immediately trigger validation to update form state
      trigger()
    }
  }, [agent, trigger])

  // Call onChange when form values change
  useEffect(() => {
    if (onChange && isDirty) {
      // Debounce onChange calls
      const timer = setTimeout(() => {
        onChange(watchedValues)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [watchedValues, onChange, isDirty])

  // Reset form when agent prop changes
  useEffect(() => {
    reset(defaultValues)
    // Trigger validation after reset if we have valid data
    if (agent?.name && agent?.prompt && agent?.model) {
      trigger()
    }
    // Reset auto-save state when agent changes
    setAutoSaveStatus('idle')
    setHasUnsavedChanges(false)
    setLastSaved(null)
    lastSaveDataRef.current = JSON.stringify(defaultValues)
  }, [agent, defaultValues, reset, trigger])

  // Auto-save functionality
  const performAutoSave = async (data: AgentFormData) => {
    if (!onAutoSave || !autoSaveEnabled) return

    const currentDataString = JSON.stringify(data)
    
    // Don't save if data hasn't changed
    if (currentDataString === lastSaveDataRef.current) return
    
    // Don't save invalid data
    const isValid = await trigger()
    if (!isValid) return

    try {
      setAutoSaveStatus('saving')
      await onAutoSave(data)
      
      setAutoSaveStatus('saved')
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
      lastSaveDataRef.current = currentDataString
      
      // Clear saved status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle')
      }, 3000)
      
    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveStatus('error')
      
      // Clear error status after 5 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle')
      }, 5000)
    }
  }

  // Auto-save effect - triggers when form data changes
  useEffect(() => {
    if (!isDirty || !autoSaveEnabled) return

    setHasUnsavedChanges(true)
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout for auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave(watchedValues)
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [watchedValues, isDirty, autoSaveEnabled, autoSaveInterval])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  // Handle form submission
  const handleFormSubmit = async (data: AgentFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Handle form reset with unsaved changes warning
  const handleFormReset = () => {
    // Check for unsaved changes and confirm if needed
    if (hasUnsavedChanges && autoSaveEnabled) {
      const confirmReset = window.confirm(
        'You have unsaved changes. Are you sure you want to reset the form?'
      )
      if (!confirmReset) {
        return
      }
    }

    reset(defaultValues)
    setAutoSaveStatus('idle')
    setHasUnsavedChanges(false)
    setLastSaved(null)
    lastSaveDataRef.current = JSON.stringify(defaultValues)
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    if (onReset) {
      onReset()
    }
  }

  // Handle tools validation callback
  const handleToolsValidation = useCallback((isValid: boolean, errors?: string[]) => {
    setToolsValidation({ isValid, errors })
  }, [])

  // Handle tool configuration changes
  const handleToolConfigChange = useCallback((toolId: string, config: Record<string, any>) => {
    if (onToolConfigChange) {
      onToolConfigChange(toolId, config)
    }
  }, [onToolConfigChange])

  // Get compatible tools for selected model
  const compatibleTools = useMemo(() => {
    const selectedModel = watchedValues.model
    if (!selectedModel) return availableTools
    
    return availableTools.filter(tool => 
      tool.compatibleModels.includes('*') || 
      tool.compatibleModels.includes(selectedModel)
    )
  }, [watchedValues.model, availableTools])

  // Validation message component
  const ValidationMessage: React.FC<{ 
    fieldName: keyof AgentFormData
    error?: string
    success?: boolean 
  }> = ({ fieldName, error, success }) => (
    <div
      data-testid={`${fieldName}-validation-message`}
      className={`validation-message ${error ? 'validation-error' : success ? 'validation-success' : ''}`}
      role={error ? 'alert' : undefined}
    >
      {error || ''}
    </div>
  )

  // Auto-save status component
  const AutoSaveStatus: React.FC = () => {
    if (!autoSaveEnabled) return null

    const getStatusIcon = () => {
      switch (autoSaveStatus) {
        case 'saving':
          return '⏳'
        case 'saved':
          return '✓'
        case 'error':
          return '⚠️'
        default:
          return hasUnsavedChanges ? '●' : '○'
      }
    }

    const getStatusText = () => {
      switch (autoSaveStatus) {
        case 'saving':
          return 'Saving...'
        case 'saved':
          return lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved'
        case 'error':
          return 'Save failed'
        default:
          return hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'
      }
    }

    const getStatusClass = () => {
      switch (autoSaveStatus) {
        case 'saving':
          return 'auto-save-saving'
        case 'saved':
          return 'auto-save-saved'
        case 'error':
          return 'auto-save-error'
        default:
          return hasUnsavedChanges ? 'auto-save-unsaved' : 'auto-save-clean'
      }
    }

    return (
      <div 
        data-testid="auto-save-status"
        className={`auto-save-status ${getStatusClass()}`}
      >
        <span className="auto-save-icon">{getStatusIcon()}</span>
        <span className="auto-save-text">{getStatusText()}</span>
      </div>
    )
  }

  return (
    <div className="agent-config-form-container">
      <AutoSaveStatus />
      <form
        data-testid="agent-config-form"
        data-dirty={isDirty}
        data-valid={isValid}
        data-validating={isValidating}
        data-auto-save-status={autoSaveStatus}
        data-has-unsaved-changes={hasUnsavedChanges}
        className="agent-config-form"
        onSubmit={handleSubmit(handleFormSubmit)}
        onReset={handleFormReset}
      >
      {/* Agent Name Field */}
      <div className="form-field">
        <label htmlFor="agent-name-input" className="form-label">
          Agent Name *
        </label>
        <input
          {...register('name')}
          id="agent-name-input"
          data-testid="agent-name-input"
          data-valid={!errors.name && touchedFields.name ? 'true' : 'false'}
          type="text"
          className="form-input"
          placeholder="Enter agent name"
          aria-invalid={errors.name ? 'true' : 'false'}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        <ValidationMessage 
          fieldName="name" 
          error={errors.name?.message}
          success={touchedFields.name && !errors.name}
        />
      </div>

      {/* Agent Prompt Field */}
      <div className="form-field">
        <label htmlFor="agent-prompt-input" className="form-label">
          Agent Prompt *
        </label>
        <textarea
          {...register('prompt')}
          id="agent-prompt-input"
          data-testid="agent-prompt-input"
          data-valid={!errors.prompt && touchedFields.prompt ? 'true' : 'false'}
          className="form-textarea"
          placeholder="Enter agent instructions and prompt"
          rows={6}
          aria-invalid={errors.prompt ? 'true' : 'false'}
          aria-describedby={errors.prompt ? 'prompt-error' : undefined}
        />
        <div className="prompt-character-count">
          {watchedValues.prompt?.length || 0} / 5000 characters
        </div>
        <ValidationMessage 
          fieldName="prompt" 
          error={errors.prompt?.message}
          success={touchedFields.prompt && !errors.prompt}
        />
      </div>

      {/* Model Selection Field */}
      <div className="form-field">
        <label className="form-label">
          AI Model *
        </label>
        <Controller
          name="model"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ModelSelector
              models={availableModels}
              selectedModel={value}
              availableTools={watchedValues.tools || []}
              onChange={(modelId) => {
                onChange(modelId)
                trigger('model') // Trigger validation after model change
              }}
              onValidation={(isValid, errors) => {
                // Additional validation logic can be added here if needed
              }}
              placeholder="Select an AI model..."
              disabled={isSubmitting}
              className={errors.model ? 'error' : ''}
            />
          )}
        />
        <ValidationMessage 
          fieldName="model" 
          error={errors.model?.message}
          success={touchedFields.model && !errors.model}
        />
      </div>

      {/* Enhanced Tools Configuration */}
      <div className="form-field">
        <Controller
          name="tools"
          control={control}
          render={({ field: { value, onChange } }) => (
            <ToolsConfiguration
              tools={availableTools}
              selectedTools={value}
              selectedModel={watchedValues.model}
              onChange={(selectedTools) => {
                onChange(selectedTools)
                // Trigger tools validation after change
                setTimeout(() => trigger('tools'), 0)
              }}
              onValidation={handleToolsValidation}
              onConfigChange={handleToolConfigChange}
              disabled={isSubmitting}
              showAdvancedConfig={showAdvancedToolConfig}
              className={errors.tools ? 'error' : ''}
            />
          )}
        />
        <ValidationMessage 
          fieldName="tools" 
          error={errors.tools?.message || toolsValidation.errors?.join(', ')}
        />
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button
          type="submit"
          data-testid="form-submit-button"
          disabled={!isValid || isSubmitting}
          className="form-button form-button-primary"
        >
          {isSubmitting ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
        </button>
        <button
          type="button"
          data-testid="form-reset-button"
          onClick={handleFormReset}
          className="form-button form-button-secondary"
          disabled={isSubmitting}
        >
          Reset
        </button>
      </div>
    </form>
    </div>
  )
}

// CSS styles (inline for now, can be moved to CSS file later)
const styles = `
.agent-config-form-container {
  max-width: 100%;
}

.auto-save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 12px;
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.auto-save-icon {
  font-weight: bold;
}

.auto-save-text {
  color: #6b7280;
}

.auto-save-saving {
  background-color: #fef3c7;
  color: #d97706;
}

.auto-save-saved {
  background-color: #dcfce7;
  color: #16a34a;
}

.auto-save-error {
  background-color: #fee2e2;
  color: #dc2626;
}

.auto-save-unsaved {
  background-color: #fef3c7;
  color: #d97706;
}

.auto-save-clean {
  background-color: #f9fafb;
  color: #6b7280;
}

.agent-config-form {
  max-width: 100%;
  padding: 16px;
}

.form-field {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input[aria-invalid="true"],
.form-textarea[aria-invalid="true"],
.form-select[aria-invalid="true"] {
  border-color: #ef4444;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.prompt-character-count {
  font-size: 12px;
  color: #6b7280;
  text-align: right;
  margin-top: 4px;
}

.form-fieldset {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 20px;
}

.form-legend {
  padding: 0 8px;
  font-weight: 600;
  color: #374151;
}


.validation-message {
  font-size: 12px;
  margin-top: 4px;
  min-height: 16px;
}

.validation-error {
  color: #ef4444;
}

.validation-success {
  color: #10b981;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.form-button {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.form-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-button-primary {
  background-color: #3b82f6;
  color: white;
}

.form-button-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.form-button-secondary {
  background-color: white;
  color: #374151;
  border-color: #d1d5db;
}

.form-button-secondary:hover:not(:disabled) {
  background-color: #f9fafb;
}
`

// Inject styles (for development, should be moved to CSS file in production)
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style')
  styleElement.textContent = styles
  document.head.appendChild(styleElement)
}