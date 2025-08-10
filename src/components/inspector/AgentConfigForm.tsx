/**
 * Agent Configuration Form Component (Task 9.2)
 * 
 * React Hook Form integration with Zod validation for agent configuration.
 * Provides real-time validation with debounced feedback for better UX.
 */

import React, { useEffect, useMemo, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Agent } from '../../schemas/database/agent'
import { CreateAgentRequestSchema } from '../../schemas/api/agents'

// Types from test fixtures
interface ModelOption {
  id: string
  name: string
  provider: string
  description: string
  capabilities: string[]
  maxTokens: number
  costPer1k: number
  isAvailable: boolean
  recommendedFor: string[]
  performance: {
    speed: number // 1-5 scale
    quality: number // 1-5 scale
    reasoning: number // 1-5 scale
  }
}

interface ToolOption {
  id: string
  name: string
  description: string
  category: string
  icon: string
  isEnabled: boolean
  isRequired: boolean
  permissions: string[]
  config?: Record<string, any>
  compatibleModels: string[]
  performanceImpact: number // 1-5 scale
}

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
}

export const AgentConfigForm: React.FC<AgentConfigFormProps> = ({
  agent,
  availableModels,
  availableTools,
  onSubmit,
  onChange,
  onReset,
}) => {
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
  }, [agent, defaultValues, reset, trigger])

  // Handle form submission
  const handleFormSubmit = async (data: AgentFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  // Handle form reset
  const handleFormReset = () => {
    reset(defaultValues)
    if (onReset) {
      onReset()
    }
  }

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

  return (
    <form
      data-testid="agent-config-form"
      data-dirty={isDirty}
      data-valid={isValid}
      data-validating={isValidating}
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
        <label htmlFor="agent-model-select" className="form-label">
          AI Model *
        </label>
        <select
          {...register('model', {
            onChange: () => trigger('model') // Immediate validation for model selection
          })}
          id="agent-model-select"
          data-testid="agent-model-select"
          data-valid={!errors.model && touchedFields.model ? 'true' : 'false'}
          className="form-select"
          aria-invalid={errors.model ? 'true' : 'false'}
          aria-describedby={errors.model ? 'model-error' : undefined}
        >
          <option value="">Select a model...</option>
          {availableModels
            .filter(model => model.isAvailable)
            .map(model => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.provider}
                {model.maxTokens && ` (${model.maxTokens.toLocaleString()} tokens)`}
              </option>
            ))}
        </select>
        <ValidationMessage 
          fieldName="model" 
          error={errors.model?.message}
          success={touchedFields.model && !errors.model}
        />
      </div>

      {/* Tools Configuration Fieldset */}
      <fieldset data-testid="agent-tools-fieldset" className="form-fieldset">
        <legend className="form-legend">Available Tools</legend>
        <div className="tools-grid">
          {compatibleTools.map(tool => (
            <label
              key={tool.id}
              className={`tool-option ${tool.isRequired ? 'tool-required' : ''}`}
            >
              <Controller
                name="tools"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <input
                    type="checkbox"
                    data-testid={`tool-checkbox-${tool.id}`}
                    data-valid={!errors.tools ? 'true' : 'false'}
                    checked={value.includes(tool.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...value, tool.id])
                      } else if (!tool.isRequired) {
                        onChange(value.filter(id => id !== tool.id))
                      }
                      // Trigger tools validation after change
                      setTimeout(() => trigger('tools'), 0)
                    }}
                    disabled={tool.isRequired}
                    className="tool-checkbox"
                  />
                )}
              />
              <div className="tool-info">
                <div className="tool-name">{tool.name}</div>
                <div className="tool-description">{tool.description}</div>
                {tool.isRequired && (
                  <div className="tool-required-badge">Required</div>
                )}
              </div>
            </label>
          ))}
        </div>
        <ValidationMessage 
          fieldName="tools" 
          error={errors.tools?.message}
        />
      </fieldset>

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
  )
}

// CSS styles (inline for now, can be moved to CSS file later)
const styles = `
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

.tools-grid {
  display: grid;
  gap: 12px;
}

.tool-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.tool-option:hover {
  background-color: #f9fafb;
}

.tool-checkbox {
  margin-top: 2px;
}

.tool-info {
  flex: 1;
}

.tool-name {
  font-weight: 500;
  color: #374151;
  margin-bottom: 2px;
}

.tool-description {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.tool-required-badge {
  display: inline-block;
  background-color: #fef3c7;
  color: #d97706;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 12px;
  margin-top: 4px;
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