import { z } from 'zod'
import { PositionSchema, NodeTypeSchema } from '../events/canvas'

/**
 * Node UI Component Schemas
 * 
 * Schemas for DocumentNode and AgentNode component props, states, and interactions.
 * These schemas validate the UI layer of nodes, extending the base canvas event schemas
 * with UI-specific properties like visual states, drag behavior, and user interactions.
 */

// Base visual dimensions and styling
const DimensionsSchema = z.object({
  width: z.number().positive('Width must be positive'),
  height: z.number().positive('Height must be positive'),
  radius: z.number().positive('Radius must be positive').optional(),
}).describe('Node visual dimensions')

const BorderRadiusSchema = z.number()
  .min(0, 'Border radius cannot be negative')
  .max(50, 'Border radius cannot exceed 50px')
  .describe('Border radius for rounded rectangles')

// Color scheme for different visual states
const ColorSchemeSchema = z.object({
  fill: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Fill must be a valid hex color'),
  stroke: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Stroke must be a valid hex color'),
  text: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Text color must be a valid hex color'),
  icon: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Icon color must be a valid hex color').optional(),
}).describe('Color scheme for a visual state')

const NodeColorsSchema = z.object({
  default: ColorSchemeSchema,
  selected: ColorSchemeSchema,
  hover: ColorSchemeSchema,
  dragging: ColorSchemeSchema.extend({
    opacity: z.number().min(0).max(1).describe('Opacity for dragging state'),
  }),
}).describe('Complete color configuration for all node states')

// Node visual states
const VisualStateSchema = z.object({
  selected: z.boolean().default(false).describe('Whether the node is selected'),
  hovered: z.boolean().default(false).describe('Whether the node is being hovered'),
  dragging: z.boolean().default(false).describe('Whether the node is being dragged'),
  focused: z.boolean().default(false).describe('Whether the node has keyboard focus'),
}).describe('Visual state flags for node appearance')

// Document-specific data
const DocumentNodeDataSchema = z.object({
  content: z.string().optional().describe('Document content'),
  lastModified: z.date().optional().describe('Last modification timestamp'),
  wordCount: z.number().int().min(0).optional().describe('Word count'),
  status: z.enum(['draft', 'review', 'published']).describe('Document status'),
}).describe('Document-specific node data')

// Agent-specific data  
const AgentNodeDataSchema = z.object({
  model: z.string().min(1, 'AI model is required').describe('AI model identifier'),
  prompt: z.string().optional().describe('Agent prompt/instructions'),
  temperature: z.number().min(0).max(2).optional().describe('AI temperature setting'),
  maxTokens: z.number().positive().optional().describe('Maximum token limit'),
  status: z.enum(['idle', 'processing', 'error']).describe('Agent processing status'),
}).describe('Agent-specific node data')

// Base node props shared by both types
const BaseNodePropsSchema = z.object({
  id: z.string().min(1, 'Node ID is required').describe('Unique node identifier'),
  type: NodeTypeSchema,
  position: PositionSchema,
  title: z.string().min(1, 'Node title is required').describe('Display title'),
  visualState: VisualStateSchema.optional(),
}).describe('Base properties shared by all node types')

// Document node component props
export const DocumentNodePropsSchema = BaseNodePropsSchema.extend({
  type: z.literal('document'),
  data: DocumentNodeDataSchema,
  dimensions: z.object({
    width: z.number().positive().default(120),
    height: z.number().positive().default(80),
    borderRadius: BorderRadiusSchema.default(8),
  }).optional(),
  colors: NodeColorsSchema.optional(),
  onSelect: z.function().optional().describe('Selection event handler'),
  onHover: z.function().optional().describe('Hover event handler'),
  onDragStart: z.function().optional().describe('Drag start event handler'),
  onDragMove: z.function().optional().describe('Drag move event handler'),
  onDragEnd: z.function().optional().describe('Drag end event handler'),
}).describe('Props for DocumentNode component')

// Agent node component props
export const AgentNodePropsSchema = BaseNodePropsSchema.extend({
  type: z.literal('agent'),
  data: AgentNodeDataSchema,
  dimensions: z.object({
    radius: z.number().positive().default(35),
  }).optional(),
  colors: NodeColorsSchema.optional(),
  showProcessingAnimation: z.boolean().default(true).describe('Show processing animation'),
  onSelect: z.function().optional().describe('Selection event handler'),
  onHover: z.function().optional().describe('Hover event handler'),
  onDragStart: z.function().optional().describe('Drag start event handler'),
  onDragMove: z.function().optional().describe('Drag move event handler'),
  onDragEnd: z.function().optional().describe('Drag end event handler'),
}).describe('Props for AgentNode component')

// Union of all node props
export const NodePropsSchema = z.union([
  DocumentNodePropsSchema,
  AgentNodePropsSchema,
]).describe('Props for any node component')

// Drag behavior state management
export const DragStateSchema = z.object({
  isDragging: z.boolean().describe('Whether drag is currently active'),
  nodeId: z.string().nullable().describe('ID of node being dragged'),
  startPosition: PositionSchema.nullable().describe('Initial drag position'),
  currentPosition: PositionSchema.nullable().describe('Current drag position'),
  deltaX: z.number().describe('Horizontal drag distance'),
  deltaY: z.number().describe('Vertical drag distance'),
  constrainToBounds: z.boolean().default(true).describe('Whether to constrain drag to viewport'),
}).describe('Drag operation state')

// Selection state management
export const SelectionStateSchema = z.object({
  selectedNodeIds: z.array(z.string()).describe('Array of selected node IDs'),
  lastSelectedId: z.string().nullable().describe('Most recently selected node ID'),
  multiSelect: z.boolean().default(false).describe('Whether multi-selection is active'),
  selectionMethod: z.enum(['mouse', 'keyboard', 'touch']).optional().describe('How selection was triggered'),
}).describe('Node selection state')

// Hover state management
export const HoverStateSchema = z.object({
  hoveredNodeId: z.string().nullable().describe('ID of currently hovered node'),
  hoverStartTime: z.number().optional().describe('Timestamp when hover started'),
  showConnectionPoints: z.boolean().default(false).describe('Whether to show connection points on hover'),
}).describe('Node hover state')

// Grid snapping configuration
export const GridSnapConfigSchema = z.object({
  enabled: z.boolean().default(true).describe('Whether grid snapping is enabled'),
  size: z.number().positive().default(20).describe('Grid cell size in pixels'),
  snapThreshold: z.number().positive().default(10).describe('Distance threshold for snapping'),
  majorEvery: z.number().int().positive().default(5).describe('Major grid line frequency'),
  showGrid: z.boolean().default(false).describe('Whether to show grid lines'),
}).describe('Grid snapping configuration')

// Collision detection configuration
export const CollisionConfigSchema = z.object({
  enabled: z.boolean().default(true).describe('Whether collision detection is enabled'),
  minDistance: z.number().positive().default(100).describe('Minimum distance between nodes'),
  buffer: z.number().positive().default(10).describe('Extra buffer space for collision'),
  preventOverlap: z.boolean().default(true).describe('Whether to prevent node overlap'),
}).describe('Collision detection configuration')

// Mouse/touch interaction events
export const InteractionEventSchema = z.object({
  type: z.enum(['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'click']),
  nodeId: z.string(),
  position: PositionSchema,
  modifiers: z.object({
    shiftKey: z.boolean().default(false),
    ctrlKey: z.boolean().default(false),
    altKey: z.boolean().default(false),
    metaKey: z.boolean().default(false),
  }).optional(),
  timestamp: z.number().describe('Event timestamp'),
}).describe('Node interaction event data')

// Drag gesture configuration
export const DragGestureSchema = z.object({
  minDistance: z.number().positive().default(5).describe('Minimum distance to initiate drag'),
  maxDuration: z.number().positive().default(30000).describe('Maximum drag duration in ms'),
  smoothing: z.boolean().default(true).describe('Whether to apply position smoothing'),
  momentum: z.boolean().default(false).describe('Whether to apply momentum after drag'),
}).describe('Drag gesture configuration')

// Node animation configuration
export const NodeAnimationConfigSchema = z.object({
  enabled: z.boolean().default(true).describe('Whether animations are enabled'),
  duration: z.number().positive().default(200).describe('Animation duration in ms'),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']).default('easeOut').describe('Animation easing function'),
  properties: z.array(z.enum(['position', 'opacity', 'scale', 'rotation'])).default(['position', 'opacity']).describe('Properties to animate'),
}).describe('Node animation configuration')

// Complete node component configuration
export const NodeConfigSchema = z.object({
  grid: GridSnapConfigSchema.optional(),
  collision: CollisionConfigSchema.optional(),
  drag: DragGestureSchema.optional(),
  animation: NodeAnimationConfigSchema.optional(),
  interaction: z.object({
    enableTouch: z.boolean().default(true).describe('Enable touch interactions'),
    enableKeyboard: z.boolean().default(true).describe('Enable keyboard navigation'),
    focusTimeout: z.number().positive().default(5000).describe('Focus timeout in ms'),
  }).optional(),
}).describe('Complete node interaction configuration')

/**
 * TypeScript types for node component schemas
 */
export type DocumentNodeProps = z.infer<typeof DocumentNodePropsSchema>
export type AgentNodeProps = z.infer<typeof AgentNodePropsSchema>
export type NodeProps = z.infer<typeof NodePropsSchema>
export type VisualState = z.infer<typeof VisualStateSchema>
export type DocumentNodeData = z.infer<typeof DocumentNodeDataSchema>
export type AgentNodeData = z.infer<typeof AgentNodeDataSchema>
export type DragState = z.infer<typeof DragStateSchema>
export type SelectionState = z.infer<typeof SelectionStateSchema>
export type HoverState = z.infer<typeof HoverStateSchema>
export type GridSnapConfig = z.infer<typeof GridSnapConfigSchema>
export type CollisionConfig = z.infer<typeof CollisionConfigSchema>
export type InteractionEvent = z.infer<typeof InteractionEventSchema>
export type DragGesture = z.infer<typeof DragGestureSchema>
export type NodeAnimationConfig = z.infer<typeof NodeAnimationConfigSchema>
export type NodeConfig = z.infer<typeof NodeConfigSchema>

/**
 * Factory functions for creating well-formed node props
 */
export const NodePropsFactory = {
  /**
   * Creates DocumentNode props with defaults
   */
  createDocumentNodeProps: (
    overrides: Partial<DocumentNodeProps> = {}
  ): DocumentNodeProps => {
    return DocumentNodePropsSchema.parse({
      id: `doc-${Date.now()}`,
      type: 'document',
      position: { x: 0, y: 0 },
      title: 'New Document',
      data: {
        status: 'draft',
      },
      ...overrides,
    })
  },

  /**
   * Creates AgentNode props with defaults
   */
  createAgentNodeProps: (
    overrides: Partial<AgentNodeProps> = {}
  ): AgentNodeProps => {
    return AgentNodePropsSchema.parse({
      id: `agent-${Date.now()}`,
      type: 'agent',
      position: { x: 0, y: 0 },
      title: 'New Agent',
      data: {
        model: 'gpt-4',
        status: 'idle',
      },
      ...overrides,
    })
  },
}

/**
 * Validation utilities for node components
 */
export const NodeValidation = {
  /**
   * Validates node props and returns detailed error information
   */
  validateNodeProps: (props: unknown): { valid: boolean; errors: string[]; warnings: string[] } => {
    const result = NodePropsSchema.safeParse(props)
    
    if (result.success) {
      return {
        valid: true,
        errors: [],
        warnings: [],
      }
    }

    const errors = result.error.issues.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    )

    return {
      valid: false,
      errors,
      warnings: [],
    }
  },

  /**
   * Type guard to check if props are valid DocumentNode props
   */
  isDocumentNodeProps: (props: unknown): props is DocumentNodeProps => {
    return DocumentNodePropsSchema.safeParse(props).success
  },

  /**
   * Type guard to check if props are valid AgentNode props
   */
  isAgentNodeProps: (props: unknown): props is AgentNodeProps => {
    return AgentNodePropsSchema.safeParse(props).success
  },
}