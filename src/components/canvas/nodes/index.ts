/**
 * Canvas Node Components
 * 
 * Exports DocumentNode and AgentNode components for the Canvas system.
 * These components implement the comprehensive node specification with
 * drag behavior, selection states, and accessibility features.
 */

export { default as DocumentNode } from './DocumentNode'
export { default as AgentNode } from './AgentNode'

// Re-export types for convenience
export type {
  DocumentNodeProps,
  AgentNodeProps,
  NodeProps,
  VisualState,
  DocumentNodeData,
  AgentNodeData
} from '../../../schemas/api/nodes'