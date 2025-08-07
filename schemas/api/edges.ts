import { z } from 'zod'
import { 
  PositionSchema, 
  ConnectionPointSchema, 
  EdgeTypeSchema, 
  EdgeStyleSchema, 
  EdgeLabelSchema, 
  EdgePathSchema,
  BezierControlPointsSchema,
  ConnectionPoint
} from '../events/canvas'
import { 
  EdgeEntitySchema, 
  CreateEdgeSchema, 
  UpdateEdgeSchema, 
  EdgeQueryFiltersSchema,
  EdgeSummarySchema,
  EdgeWithNodesSchema,
  EdgeStatsSchema 
} from '../database/edge'
import { 
  SuccessResponseSchema, 
  PaginatedResponseSchema, 
  PaginationQuerySchema 
} from './common'

/**
 * Edge UI Component Schemas
 * 
 * Schemas for Edge component props, states, and interactions.
 * These schemas validate the UI layer of edges, extending the base canvas event schemas
 * with UI-specific properties like drag handles, selection state, and visual effects.
 */

// Connection anchor point definitions
export const NodeAnchorSchema = z.object({
  id: z.string().min(1, 'Anchor ID is required').describe('Unique anchor identifier'),
  position: z.enum(['top', 'right', 'bottom', 'left', 'center']).describe('Relative position on node'),
  offset: PositionSchema.optional().describe('Offset from base position'),
  visible: z.boolean().default(false).describe('Whether anchor is visible'),
  connectable: z.boolean().default(true).describe('Whether anchor accepts connections'),
  connectionType: z.enum(['input', 'output', 'bidirectional']).default('bidirectional').describe('Connection direction'),
}).describe('Connection anchor point on a node')

export const ConnectionPointDetectionSchema = z.object({
  snapDistance: z.number().positive().default(20).describe('Distance to snap to connection point'),
  highlightRadius: z.number().positive().default(15).describe('Radius for connection point highlight'),
  validConnectionColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#00ff00').describe('Color for valid connection'),
  invalidConnectionColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ff0000').describe('Color for invalid connection'),
}).describe('Connection point detection and visual feedback configuration')

// Edge visual state management
export const EdgeVisualStateSchema = z.object({
  selected: z.boolean().default(false).describe('Whether the edge is selected'),
  hovered: z.boolean().default(false).describe('Whether the edge is being hovered'),
  dragging: z.boolean().default(false).describe('Whether the edge is being dragged'),
  connecting: z.boolean().default(false).describe('Whether the edge is in connection mode'),
  animated: z.boolean().default(false).describe('Whether the edge shows flow animation'),
}).describe('Visual state flags for edge appearance')

// Drag handle for edge control points
export const DragHandleSchema = z.object({
  position: PositionSchema.describe('Handle position'),
  radius: z.number().positive().default(6).describe('Handle radius in pixels'),
  visible: z.boolean().default(false).describe('Whether handle is visible'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0066cc').describe('Handle color'),
  hoverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0080ff').describe('Handle hover color'),
}).describe('Drag handle for edge control points')

// Selection state for edges
export const EdgeSelectionStateSchema = z.object({
  selectedEdgeIds: z.array(z.string()).describe('Array of selected edge IDs'),
  selectionMethod: z.enum(['mouse', 'keyboard', 'touch']).optional().describe('How selection was triggered'),
  showControlPoints: z.boolean().default(true).describe('Whether to show control points when selected'),
  showDeleteHandle: z.boolean().default(true).describe('Whether to show delete handle when selected'),
}).describe('Edge selection state management')

// Edge routing configuration
export const EdgeRoutingConfigSchema = z.object({
  algorithm: z.enum(['bezier', 'straight', 'orthogonal', 'smart']).default('bezier').describe('Routing algorithm'),
  avoidNodes: z.boolean().default(true).describe('Whether to avoid overlapping nodes'),
  cornerRadius: z.number().min(0).default(5).describe('Radius for rounded corners in orthogonal routing'),
  padding: z.number().min(0).default(20).describe('Padding around nodes for routing'),
  smoothing: z.number().min(0).max(1).default(0.5).describe('Smoothing factor for curves'),
}).describe('Edge routing and path calculation configuration')

// Edge animation configuration
export const EdgeAnimationSchema = z.object({
  enabled: z.boolean().default(false).describe('Whether animation is enabled'),
  type: z.enum(['flow', 'pulse', 'dash']).default('flow').describe('Animation type'),
  duration: z.number().positive().default(2000).describe('Animation duration in ms'),
  direction: z.enum(['forward', 'backward', 'bidirectional']).default('forward').describe('Animation direction'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#0066cc').describe('Animation color'),
  width: z.number().positive().default(3).describe('Animation element width'),
}).describe('Edge flow animation configuration')

// Edge interaction events
export const EdgeInteractionEventSchema = z.object({
  type: z.enum(['click', 'doubleclick', 'mousedown', 'mousemove', 'mouseup', 'contextmenu']),
  edgeId: z.string().describe('ID of the edge being interacted with'),
  position: PositionSchema.describe('Interaction position on the edge'),
  segmentIndex: z.number().int().min(0).optional().describe('Edge segment index for multi-segment edges'),
  distanceFromStart: z.number().min(0).max(1).optional().describe('Relative position along edge (0=start, 1=end)'),
  modifiers: z.object({
    shiftKey: z.boolean().default(false),
    ctrlKey: z.boolean().default(false),
    altKey: z.boolean().default(false),
    metaKey: z.boolean().default(false),
  }).optional(),
  timestamp: z.number().describe('Event timestamp'),
}).describe('Edge interaction event data')

// Base edge component props
export const BaseEdgePropsSchema = z.object({
  id: z.string().min(1, 'Edge ID is required').describe('Unique edge identifier'),
  source: ConnectionPointSchema.describe('Source connection point'),
  target: ConnectionPointSchema.describe('Target connection point'),
  type: EdgeTypeSchema.default('bezier'),
  path: EdgePathSchema.describe('Edge path for rendering'),
  style: EdgeStyleSchema.optional(),
  label: EdgeLabelSchema.optional(),
  visualState: EdgeVisualStateSchema.optional(),
  data: z.record(z.any()).optional().describe('Additional edge metadata'),
}).describe('Base properties for edge components')

// Bezier edge component props
export const BezierEdgePropsSchema = BaseEdgePropsSchema.extend({
  type: z.literal('bezier'),
  controlPoints: BezierControlPointsSchema.optional(),
  showControlPoints: z.boolean().default(false).describe('Whether to show control point handles'),
  controlPointHandles: z.array(DragHandleSchema).optional().describe('Drag handles for control points'),
  curvature: z.number().min(0).max(2).default(0.5).describe('Curve intensity factor'),
}).describe('Props for BezierEdge component')

// Straight edge component props  
export const StraightEdgePropsSchema = BaseEdgePropsSchema.extend({
  type: z.literal('straight'),
  showMidpointHandle: z.boolean().default(false).describe('Whether to show midpoint drag handle'),
  midpointHandle: DragHandleSchema.optional().describe('Midpoint drag handle'),
}).describe('Props for StraightEdge component')

// Orthogonal edge component props
export const OrthogonalEdgePropsSchema = BaseEdgePropsSchema.extend({
  type: z.literal('orthogonal'),
  cornerRadius: z.number().min(0).default(5).describe('Radius for rounded corners'),
  waypoints: z.array(PositionSchema).optional().describe('Routing waypoints'),
  waypointHandles: z.array(DragHandleSchema).optional().describe('Handles for waypoint editing'),
  showWaypoints: z.boolean().default(false).describe('Whether to show waypoint handles'),
}).describe('Props for OrthogonalEdge component')

// Union of all edge component props
export const EdgePropsSchema = z.union([
  BezierEdgePropsSchema,
  StraightEdgePropsSchema,
  OrthogonalEdgePropsSchema,
]).describe('Props for any edge component')

// Drag-and-drop edge creation state
export const EdgeCreationStateSchema = z.object({
  isCreating: z.boolean().describe('Whether edge creation is active'),
  sourceConnection: ConnectionPointSchema.nullable().describe('Source connection point'),
  currentPosition: PositionSchema.nullable().describe('Current mouse/touch position'),
  validTarget: ConnectionPointSchema.nullable().describe('Valid target connection if hovering'),
  previewStyle: EdgeStyleSchema.optional().describe('Style for preview edge during creation'),
}).describe('State during edge creation process')

// Complete edge component configuration
export const EdgeConfigSchema = z.object({
  routing: EdgeRoutingConfigSchema.optional(),
  animation: EdgeAnimationSchema.optional(),
  connectionDetection: ConnectionPointDetectionSchema.optional(),
  interaction: z.object({
    enableSelection: z.boolean().default(true).describe('Enable edge selection'),
    enableHover: z.boolean().default(true).describe('Enable hover effects'),
    enableDragToEdit: z.boolean().default(true).describe('Enable dragging to edit path'),
    enableDoubleClickToEdit: z.boolean().default(true).describe('Enable double-click to edit label'),
    enableContextMenu: z.boolean().default(true).describe('Enable right-click context menu'),
  }).optional(),
  performance: z.object({
    enableOcclusion: z.boolean().default(true).describe('Enable occlusion culling for off-screen edges'),
    batchUpdates: z.boolean().default(true).describe('Batch multiple edge updates'),
    maxVisibleEdges: z.number().positive().default(1000).describe('Maximum edges to render'),
  }).optional(),
}).describe('Complete edge interaction and performance configuration')

/**
 * TypeScript types for edge component schemas
 */
export type NodeAnchor = z.infer<typeof NodeAnchorSchema>
export type ConnectionPointDetection = z.infer<typeof ConnectionPointDetectionSchema>
export type EdgeVisualState = z.infer<typeof EdgeVisualStateSchema>
export type DragHandle = z.infer<typeof DragHandleSchema>
export type EdgeSelectionState = z.infer<typeof EdgeSelectionStateSchema>
export type EdgeRoutingConfig = z.infer<typeof EdgeRoutingConfigSchema>
export type EdgeAnimation = z.infer<typeof EdgeAnimationSchema>
export type EdgeInteractionEvent = z.infer<typeof EdgeInteractionEventSchema>
export type BaseEdgeProps = z.infer<typeof BaseEdgePropsSchema>
export type BezierEdgeProps = z.infer<typeof BezierEdgePropsSchema>
export type StraightEdgeProps = z.infer<typeof StraightEdgePropsSchema>
export type OrthogonalEdgeProps = z.infer<typeof OrthogonalEdgePropsSchema>
export type EdgeProps = z.infer<typeof EdgePropsSchema>
export type EdgeCreationState = z.infer<typeof EdgeCreationStateSchema>
export type EdgeConfig = z.infer<typeof EdgeConfigSchema>

/**
 * Factory functions for creating well-formed edge props
 */
export const EdgePropsFactory = {
  /**
   * Creates BezierEdge props with defaults
   */
  createBezierEdgeProps: (
    source: ConnectionPoint,
    target: ConnectionPoint,
    overrides: Partial<BezierEdgeProps> = {}
  ): BezierEdgeProps => {
    return BezierEdgePropsSchema.parse({
      id: `edge-${Date.now()}`,
      type: 'bezier',
      source,
      target,
      path: {
        type: 'bezier',
        start: source.position,
        end: target.position,
      },
      ...overrides,
    })
  },

  /**
   * Creates StraightEdge props with defaults
   */
  createStraightEdgeProps: (
    source: ConnectionPoint,
    target: ConnectionPoint,
    overrides: Partial<StraightEdgeProps> = {}
  ): StraightEdgeProps => {
    return StraightEdgePropsSchema.parse({
      id: `edge-${Date.now()}`,
      type: 'straight',
      source,
      target,
      path: {
        type: 'straight',
        start: source.position,
        end: target.position,
      },
      ...overrides,
    })
  },

  /**
   * Creates OrthogonalEdge props with defaults
   */
  createOrthogonalEdgeProps: (
    source: ConnectionPoint,
    target: ConnectionPoint,
    overrides: Partial<OrthogonalEdgeProps> = {}
  ): OrthogonalEdgeProps => {
    return OrthogonalEdgePropsSchema.parse({
      id: `edge-${Date.now()}`,
      type: 'orthogonal',
      source,
      target,
      path: {
        type: 'orthogonal',
        start: source.position,
        end: target.position,
      },
      ...overrides,
    })
  },
}

/**
 * Validation utilities for edge components
 */
export const EdgeValidation = {
  /**
   * Validates edge props and returns detailed error information
   */
  validateEdgeProps: (props: unknown): { valid: boolean; errors: string[]; warnings: string[] } => {
    const result = EdgePropsSchema.safeParse(props)
    
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
   * Type guard to check if props are valid BezierEdge props
   */
  isBezierEdgeProps: (props: unknown): props is BezierEdgeProps => {
    return BezierEdgePropsSchema.safeParse(props).success
  },

  /**
   * Type guard to check if props are valid StraightEdge props
   */
  isStraightEdgeProps: (props: unknown): props is StraightEdgeProps => {
    return StraightEdgePropsSchema.safeParse(props).success
  },

  /**
   * Type guard to check if props are valid OrthogonalEdge props
   */
  isOrthogonalEdgeProps: (props: unknown): props is OrthogonalEdgeProps => {
    return OrthogonalEdgePropsSchema.safeParse(props).success
  },

  /**
   * Validates connection compatibility between two anchor points
   */
  validateConnection: (
    sourceAnchor: NodeAnchor, 
    targetAnchor: NodeAnchor
  ): { valid: boolean; reason?: string } => {
    // Check if both anchors are connectable
    if (!sourceAnchor.connectable || !targetAnchor.connectable) {
      return { valid: false, reason: 'One or both anchor points are not connectable' }
    }

    // Check connection type compatibility
    if (sourceAnchor.connectionType === 'input' && targetAnchor.connectionType === 'input') {
      return { valid: false, reason: 'Cannot connect two input anchors' }
    }
    
    if (sourceAnchor.connectionType === 'output' && targetAnchor.connectionType === 'output') {
      return { valid: false, reason: 'Cannot connect two output anchors' }
    }

    return { valid: true }
  },
}

/**
 * API Endpoint Schemas for Edge Operations
 * 
 * Request/response schemas for edge CRUD operations and management
 */

// Edge API request schemas
export const CreateEdgeRequestSchema = CreateEdgeSchema.describe('Request body for creating a new edge')

export const UpdateEdgeRequestSchema = UpdateEdgeSchema.describe('Request body for updating an edge')

export const GetEdgeParamsSchema = z.object({
  edgeId: z.string().min(1, 'Edge ID is required').describe('Edge identifier'),
}).describe('Path parameters for getting an edge')

export const DeleteEdgeParamsSchema = z.object({
  edgeId: z.string().min(1, 'Edge ID is required').describe('Edge identifier'),
}).describe('Path parameters for deleting an edge')

export const ListEdgesQuerySchema = PaginationQuerySchema.extend({
  chainId: z.string().optional().describe('Filter by chain ID'),
  sourceNodeId: z.string().optional().describe('Filter by source node'),
  targetNodeId: z.string().optional().describe('Filter by target node'),
  type: z.array(EdgeTypeSchema).optional().describe('Filter by edge types'),
  hasLabel: z.boolean().optional().describe('Filter edges with/without labels'),
  includeDeleted: z.boolean().default(false).describe('Include soft-deleted edges'),
  includeNodes: z.boolean().default(false).describe('Include source/target node details'),
}).describe('Query parameters for listing edges')

export const EdgeBulkOperationSchema = z.object({
  edgeIds: z.array(z.string().min(1)).min(1, 'At least one edge ID is required'),
  operation: z.enum(['delete', 'restore', 'update_style']).describe('Bulk operation type'),
  operationData: z.record(z.any()).optional().describe('Operation-specific data'),
}).describe('Bulk operation on multiple edges')

// Edge API response schemas
export const EdgeResponseSchema = SuccessResponseSchema(EdgeEntitySchema).describe('Single edge response')

export const EdgeSummaryResponseSchema = SuccessResponseSchema(EdgeSummarySchema).describe('Edge summary response')

export const EdgeWithNodesResponseSchema = SuccessResponseSchema(EdgeWithNodesSchema).describe('Edge with node details response')

export const EdgeListResponseSchema = PaginatedResponseSchema(EdgeSummarySchema).describe('Paginated edge list response')

export const EdgeListWithNodesResponseSchema = PaginatedResponseSchema(EdgeWithNodesSchema).describe('Paginated edge list with node details response')

export const EdgeStatsResponseSchema = SuccessResponseSchema(EdgeStatsSchema).describe('Edge statistics response')

export const EdgeBulkOperationResponseSchema = SuccessResponseSchema(z.object({
  processedCount: z.number().int().min(0).describe('Number of edges processed'),
  successCount: z.number().int().min(0).describe('Number of successful operations'),
  failureCount: z.number().int().min(0).describe('Number of failed operations'),
  errors: z.array(z.object({
    edgeId: z.string(),
    error: z.string(),
  })).describe('Errors encountered during bulk operation'),
})).describe('Bulk operation results response')

// Edge path calculation API schemas
export const CalculateEdgePathRequestSchema = z.object({
  edgeType: EdgeTypeSchema.describe('Type of edge to calculate path for'),
  sourcePosition: PositionSchema.describe('Source position'),
  targetPosition: PositionSchema.describe('Target position'),
  routingOptions: z.object({
    avoidNodes: z.boolean().default(true).describe('Whether to avoid overlapping nodes'),
    cornerRadius: z.number().min(0).default(5).describe('Corner radius for orthogonal routing'),
    padding: z.number().min(0).default(20).describe('Padding around obstacles'),
  }).optional().describe('Path calculation options'),
  obstacles: z.array(z.object({
    position: PositionSchema,
    width: z.number().positive(),
    height: z.number().positive(),
  })).optional().describe('Obstacles to avoid during routing'),
}).describe('Request body for edge path calculation')

export const CalculateEdgePathResponseSchema = SuccessResponseSchema(z.object({
  path: EdgePathSchema.describe('Calculated edge path'),
  length: z.number().min(0).describe('Path length in pixels'),
  intersections: z.array(PositionSchema).describe('Path intersections with obstacles'),
})).describe('Edge path calculation response')

// Edge validation API schemas
export const ValidateEdgeConnectionRequestSchema = z.object({
  sourceNodeId: z.string().min(1),
  sourceAnchorId: z.string().min(1),
  targetNodeId: z.string().min(1),
  targetAnchorId: z.string().min(1),
  chainId: z.string().min(1),
}).describe('Request body for validating edge connection')

export const ValidateEdgeConnectionResponseSchema = SuccessResponseSchema(z.object({
  valid: z.boolean().describe('Whether the connection is valid'),
  reasons: z.array(z.string()).describe('Validation failure reasons if invalid'),
  warnings: z.array(z.string()).describe('Validation warnings'),
})).describe('Edge connection validation response')

/**
 * TypeScript types for API schemas
 */
export type CreateEdgeRequest = z.infer<typeof CreateEdgeRequestSchema>
export type UpdateEdgeRequest = z.infer<typeof UpdateEdgeRequestSchema>
export type GetEdgeParams = z.infer<typeof GetEdgeParamsSchema>
export type DeleteEdgeParams = z.infer<typeof DeleteEdgeParamsSchema>
export type ListEdgesQuery = z.infer<typeof ListEdgesQuerySchema>
export type EdgeBulkOperation = z.infer<typeof EdgeBulkOperationSchema>

export type EdgeResponse = z.infer<typeof EdgeResponseSchema>
export type EdgeSummaryResponse = z.infer<typeof EdgeSummaryResponseSchema>
export type EdgeWithNodesResponse = z.infer<typeof EdgeWithNodesResponseSchema>
export type EdgeListResponse = z.infer<typeof EdgeListResponseSchema>
export type EdgeListWithNodesResponse = z.infer<typeof EdgeListWithNodesResponseSchema>
export type EdgeStatsResponse = z.infer<typeof EdgeStatsResponseSchema>
export type EdgeBulkOperationResponse = z.infer<typeof EdgeBulkOperationResponseSchema>

export type CalculateEdgePathRequest = z.infer<typeof CalculateEdgePathRequestSchema>
export type CalculateEdgePathResponse = z.infer<typeof CalculateEdgePathResponseSchema>
export type ValidateEdgeConnectionRequest = z.infer<typeof ValidateEdgeConnectionRequestSchema>
export type ValidateEdgeConnectionResponse = z.infer<typeof ValidateEdgeConnectionResponseSchema>