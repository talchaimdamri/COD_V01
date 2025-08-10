/**
 * Model and Tool Types (Task 9.4)
 * 
 * Type definitions for AI models and tools used in the inspector components.
 */

export interface ModelOption {
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

export interface ToolOption {
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