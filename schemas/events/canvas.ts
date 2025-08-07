import { z } from 'zod'
import { EventSchema } from './event'

/**
 * Canvas Event Schemas for Event Sourcing
 *
 * Defines immutable event structures for canvas interactions that extend
 * the base EventSchema. These events support undo/redo functionality and
 * maintain consistency with the existing event sourcing architecture.
 */

// Common validation schemas
export const PositionSchema = z.object({
  x: z.number().finite('X coordinate must be a finite number'),
  y: z.number().finite('Y coordinate must be a finite number'),
}).describe('2D coordinate position on the canvas')

export const NodeTypeSchema = z.enum(['document', 'agent'], {
  errorMap: () => ({ message: 'Node type must be either "document" or "agent"' })
}).describe('Type of canvas node')

const NodeIdSchema = z.string()
  .min(1, 'Node ID cannot be empty')
  .describe('Unique identifier for a canvas node')

const ZoomLevelSchema = z.number()
  .min(0.1, 'Zoom level cannot be less than 0.1x')
  .max(5.0, 'Zoom level cannot be greater than 5.0x')
  .describe('Canvas zoom scale factor')

const ViewBoxSchema = z.object({
  x: z.number().finite('ViewBox X must be finite'),
  y: z.number().finite('ViewBox Y must be finite'),
  width: z.number().positive('ViewBox width must be positive'),
  height: z.number().positive('ViewBox height must be positive'),
}).describe('Canvas viewport dimensions and position')

// Canvas Event Type Definitions
const CanvasEventTypes = {
  ADD_NODE: 'ADD_NODE',
  MOVE_NODE: 'MOVE_NODE',
  DELETE_NODE: 'DELETE_NODE',
  CREATE_EDGE: 'CREATE_EDGE',
  DELETE_EDGE: 'DELETE_EDGE',
  UPDATE_EDGE_PATH: 'UPDATE_EDGE_PATH',
  SELECT_ELEMENT: 'SELECT_ELEMENT',
  PAN_CANVAS: 'PAN_CANVAS',
  ZOOM_CANVAS: 'ZOOM_CANVAS',
  RESET_VIEW: 'RESET_VIEW',
} as const

/**
 * ADD_NODE Event - Creates a new document or agent node
 */
export const AddNodeEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.ADD_NODE),
  payload: z.object({
    nodeId: NodeIdSchema,
    nodeType: NodeTypeSchema,
    position: PositionSchema,
    title: z.string()
      .min(1, 'Node title cannot be empty')
      .max(100, 'Node title cannot exceed 100 characters')
      .optional()
      .describe('Display title for the node'),
    data: z.record(z.any())
      .optional()
      .describe('Additional node-specific data'),
  }).describe('Payload for creating a new canvas node'),
}).describe('Event fired when a new node is added to the canvas')

/**
 * MOVE_NODE Event - Updates node position
 */
export const MoveNodeEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.MOVE_NODE),
  payload: z.object({
    nodeId: NodeIdSchema,
    fromPosition: PositionSchema.describe('Previous node position'),
    toPosition: PositionSchema.describe('New node position'),
    isDragging: z.boolean()
      .optional()
      .describe('Whether the node is currently being dragged'),
  }).describe('Payload for moving a canvas node'),
}).describe('Event fired when a node is moved to a new position')

/**
 * DELETE_NODE Event - Removes a node from canvas
 */
export const DeleteNodeEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.DELETE_NODE),
  payload: z.object({
    nodeId: NodeIdSchema,
    nodeType: NodeTypeSchema.optional().describe('Type of deleted node for undo purposes'),
    position: PositionSchema.optional().describe('Last position for undo purposes'),
    data: z.record(z.any())
      .optional()
      .describe('Node data for undo purposes'),
  }).describe('Payload for deleting a canvas node'),
}).describe('Event fired when a node is removed from the canvas')

/**
 * SELECT_ELEMENT Event - Updates element selection state
 */
export const SelectElementEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.SELECT_ELEMENT),
  payload: z.object({
    elementId: z.string()
      .nullable()
      .describe('ID of selected element, null for deselection'),
    elementType: z.enum(['node', 'edge'])
      .optional()
      .describe('Type of selected element'),
    previousSelection: z.string()
      .nullable()
      .optional()
      .describe('Previously selected element ID'),
    multiSelect: z.boolean()
      .default(false)
      .describe('Whether this is part of a multi-selection'),
  }).describe('Payload for element selection changes'),
}).describe('Event fired when an element is selected or deselected')

// Edge-specific validation schemas
const EdgeIdSchema = z.string()
  .min(1, 'Edge ID cannot be empty')
  .describe('Unique identifier for a canvas edge')

export const ConnectionPointSchema = z.object({
  nodeId: NodeIdSchema,
  anchorId: z.string().min(1, 'Anchor ID cannot be empty').describe('Connection anchor identifier'),
  position: PositionSchema.describe('Absolute position of connection point'),
}).describe('Connection point for edge endpoints')

export const EdgeTypeSchema = z.enum(['bezier', 'straight', 'orthogonal'], {
  errorMap: () => ({ message: 'Edge type must be "bezier", "straight", or "orthogonal"' })
}).describe('Type of edge rendering')

export const EdgeStyleSchema = z.object({
  stroke: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Stroke must be a valid hex color').default('#666666'),
  strokeWidth: z.number().positive('Stroke width must be positive').default(2),
  strokeDasharray: z.string().optional().describe('SVG dash pattern (e.g., "5,5")'),
  opacity: z.number().min(0).max(1).default(1).describe('Edge opacity'),
  markerStart: z.string().optional().describe('SVG marker ID for start arrow'),
  markerEnd: z.string().optional().describe('SVG marker ID for end arrow'),
}).describe('Edge visual styling properties')

export const EdgeLabelSchema = z.object({
  text: z.string().min(1, 'Label text cannot be empty'),
  position: z.number().min(0).max(1).default(0.5).describe('Position along edge (0=start, 1=end)'),
  offset: z.number().default(10).describe('Perpendicular offset from edge line'),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#000000'),
  fontSize: z.number().positive().default(12),
  padding: z.number().min(0).default(4),
}).describe('Edge text label configuration')

export const BezierControlPointsSchema = z.object({
  cp1: PositionSchema.describe('First control point for bezier curve'),
  cp2: PositionSchema.describe('Second control point for bezier curve'),
}).describe('Bezier curve control points')

export const EdgePathSchema = z.object({
  type: EdgeTypeSchema,
  start: PositionSchema.describe('Edge start position'),
  end: PositionSchema.describe('Edge end position'),
  controlPoints: BezierControlPointsSchema.optional().describe('Control points for bezier curves'),
  waypoints: z.array(PositionSchema).optional().describe('Waypoints for orthogonal routing'),
}).describe('Edge path definition for rendering')

/**
 * CREATE_EDGE Event - Creates a new edge connection between nodes
 */
export const CreateEdgeEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.CREATE_EDGE),
  payload: z.object({
    edgeId: EdgeIdSchema,
    sourceConnection: ConnectionPointSchema.describe('Source node connection point'),
    targetConnection: ConnectionPointSchema.describe('Target node connection point'),
    edgeType: EdgeTypeSchema.default('bezier'),
    style: EdgeStyleSchema.optional(),
    label: EdgeLabelSchema.optional(),
    data: z.record(z.any())
      .optional()
      .describe('Additional edge-specific metadata'),
  }).describe('Payload for creating a new edge connection'),
}).describe('Event fired when a new edge is created between nodes')

/**
 * DELETE_EDGE Event - Removes an edge from canvas
 */
export const DeleteEdgeEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.DELETE_EDGE),
  payload: z.object({
    edgeId: EdgeIdSchema,
    sourceConnection: ConnectionPointSchema.optional().describe('Source connection for undo purposes'),
    targetConnection: ConnectionPointSchema.optional().describe('Target connection for undo purposes'),
    edgeType: EdgeTypeSchema.optional().describe('Edge type for undo purposes'),
    style: EdgeStyleSchema.optional().describe('Edge style for undo purposes'),
    data: z.record(z.any())
      .optional()
      .describe('Edge data for undo purposes'),
  }).describe('Payload for deleting an edge'),
}).describe('Event fired when an edge is removed from the canvas')

/**
 * UPDATE_EDGE_PATH Event - Updates edge routing and path
 */
export const UpdateEdgePathEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.UPDATE_EDGE_PATH),
  payload: z.object({
    edgeId: EdgeIdSchema,
    fromPath: EdgePathSchema.describe('Previous edge path'),
    toPath: EdgePathSchema.describe('New edge path'),
    reason: z.enum(['node_moved', 'manual_edit', 'routing_update'])
      .describe('Why the path was updated'),
    preserveControlPoints: z.boolean()
      .default(false)
      .describe('Whether to preserve manual control point adjustments'),
  }).describe('Payload for updating edge path and routing'),
}).describe('Event fired when an edge path or routing is updated')

/**
 * PAN_CANVAS Event - Updates canvas viewport position
 */
export const PanCanvasEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.PAN_CANVAS),
  payload: z.object({
    fromViewBox: ViewBoxSchema.describe('Previous viewport state'),
    toViewBox: ViewBoxSchema.describe('New viewport state'),
    deltaX: z.number().finite('Delta X must be finite').describe('Horizontal pan distance'),
    deltaY: z.number().finite('Delta Y must be finite').describe('Vertical pan distance'),
    isPanning: z.boolean()
      .optional()
      .describe('Whether panning is currently active'),
  }).describe('Payload for canvas panning operations'),
}).describe('Event fired when the canvas viewport is panned')

/**
 * ZOOM_CANVAS Event - Updates canvas zoom level
 */
export const ZoomCanvasEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.ZOOM_CANVAS),
  payload: z.object({
    fromZoom: ZoomLevelSchema.describe('Previous zoom level'),
    toZoom: ZoomLevelSchema.describe('New zoom level'),
    fromViewBox: ViewBoxSchema.describe('Previous viewport state'),
    toViewBox: ViewBoxSchema.describe('New viewport state'),
    zoomCenter: PositionSchema
      .optional()
      .describe('Point around which zoom is centered'),
    zoomDelta: z.number()
      .optional()
      .describe('Zoom change amount for wheel events'),
  }).describe('Payload for canvas zoom operations'),
}).describe('Event fired when the canvas zoom level changes')

/**
 * RESET_VIEW Event - Resets canvas to default state
 */
export const ResetViewEventSchema = EventSchema.extend({
  type: z.literal(CanvasEventTypes.RESET_VIEW),
  payload: z.object({
    fromViewBox: ViewBoxSchema.describe('Previous viewport state'),
    fromZoom: ZoomLevelSchema.describe('Previous zoom level'),
    toViewBox: ViewBoxSchema.describe('Reset viewport state'),
    toZoom: ZoomLevelSchema.describe('Reset zoom level'),
    resetType: z.enum(['keyboard', 'button', 'auto'])
      .default('keyboard')
      .describe('How the reset was triggered'),
  }).describe('Payload for canvas view reset operations'),
}).describe('Event fired when the canvas view is reset to default')

/**
 * Union type of all canvas event schemas
 */
export const CanvasEventSchema = z.union([
  AddNodeEventSchema,
  MoveNodeEventSchema,
  DeleteNodeEventSchema,
  CreateEdgeEventSchema,
  DeleteEdgeEventSchema,
  UpdateEdgePathEventSchema,
  SelectElementEventSchema,
  PanCanvasEventSchema,
  ZoomCanvasEventSchema,
  ResetViewEventSchema,
], {
  errorMap: () => ({ message: 'Invalid canvas event type' })
}).describe('Any valid canvas event')

/**
 * Canvas event type discriminator for type-safe handling
 */
export const CanvasEventTypeSchema = z.enum([
  CanvasEventTypes.ADD_NODE,
  CanvasEventTypes.MOVE_NODE,
  CanvasEventTypes.DELETE_NODE,
  CanvasEventTypes.CREATE_EDGE,
  CanvasEventTypes.DELETE_EDGE,
  CanvasEventTypes.UPDATE_EDGE_PATH,
  CanvasEventTypes.SELECT_ELEMENT,
  CanvasEventTypes.PAN_CANVAS,
  CanvasEventTypes.ZOOM_CANVAS,
  CanvasEventTypes.RESET_VIEW,
] as const).describe('Valid canvas event type identifiers')

// TypeScript type exports
export type Position = z.infer<typeof PositionSchema>
export type NodeType = z.infer<typeof NodeTypeSchema>
export type ViewBox = z.infer<typeof ViewBoxSchema>
export type ZoomLevel = z.infer<typeof ZoomLevelSchema>

// Edge type exports
export type ConnectionPoint = z.infer<typeof ConnectionPointSchema>
export type EdgeType = z.infer<typeof EdgeTypeSchema>
export type EdgeStyle = z.infer<typeof EdgeStyleSchema>
export type EdgeLabel = z.infer<typeof EdgeLabelSchema>
export type BezierControlPoints = z.infer<typeof BezierControlPointsSchema>
export type EdgePath = z.infer<typeof EdgePathSchema>

export type AddNodeEvent = z.infer<typeof AddNodeEventSchema>
export type MoveNodeEvent = z.infer<typeof MoveNodeEventSchema>
export type DeleteNodeEvent = z.infer<typeof DeleteNodeEventSchema>
export type CreateEdgeEvent = z.infer<typeof CreateEdgeEventSchema>
export type DeleteEdgeEvent = z.infer<typeof DeleteEdgeEventSchema>
export type UpdateEdgePathEvent = z.infer<typeof UpdateEdgePathEventSchema>
export type SelectElementEvent = z.infer<typeof SelectElementEventSchema>
export type PanCanvasEvent = z.infer<typeof PanCanvasEventSchema>
export type ZoomCanvasEvent = z.infer<typeof ZoomCanvasEventSchema>
export type ResetViewEvent = z.infer<typeof ResetViewEventSchema>

export type CanvasEvent = z.infer<typeof CanvasEventSchema>
export type CanvasEventType = z.infer<typeof CanvasEventTypeSchema>

// Canvas configuration constants for validation
export const CANVAS_LIMITS = {
  ZOOM: {
    MIN: 0.1,
    MAX: 5.0,
    DEFAULT: 1.0,
  },
  PAN: {
    MAX_DISTANCE: 10000,
    STEP: 50,
  },
  NODE: {
    MAX_TITLE_LENGTH: 100,
    MIN_RADIUS: 20,
    MAX_RADIUS: 50,
  },
  EDGE: {
    MIN_STROKE_WIDTH: 1,
    MAX_STROKE_WIDTH: 10,
    DEFAULT_STROKE_WIDTH: 2,
    MIN_LABEL_FONT_SIZE: 8,
    MAX_LABEL_FONT_SIZE: 24,
    DEFAULT_LABEL_FONT_SIZE: 12,
    MAX_CONTROL_POINT_DISTANCE: 500,
    MIN_EDGE_LENGTH: 10,
  },
  VIEWPORT: {
    MIN_WIDTH: 100,
    MIN_HEIGHT: 100,
    DEFAULT_WIDTH: 1200,
    DEFAULT_HEIGHT: 800,
  },
} as const

/**
 * Utility functions for canvas event validation and transformation
 */
export const CanvasEventUtils = {
  /**
   * Validates that a position is within reasonable bounds
   */
  isValidPosition: (pos: Position): boolean => {
    return Number.isFinite(pos.x) && 
           Number.isFinite(pos.y) && 
           Math.abs(pos.x) <= CANVAS_LIMITS.PAN.MAX_DISTANCE &&
           Math.abs(pos.y) <= CANVAS_LIMITS.PAN.MAX_DISTANCE
  },

  /**
   * Clamps zoom level to valid range
   */
  clampZoom: (zoom: number): ZoomLevel => {
    return Math.max(CANVAS_LIMITS.ZOOM.MIN, 
                   Math.min(CANVAS_LIMITS.ZOOM.MAX, zoom)) as ZoomLevel
  },

  /**
   * Creates a valid ViewBox with constrained dimensions
   */
  createViewBox: (x: number, y: number, width: number, height: number): ViewBox => {
    return {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      width: Math.max(CANVAS_LIMITS.VIEWPORT.MIN_WIDTH, width),
      height: Math.max(CANVAS_LIMITS.VIEWPORT.MIN_HEIGHT, height),
    }
  },

  /**
   * Calculates distance between two positions
   */
  distance: (pos1: Position, pos2: Position): number => {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2))
  },

  /**
   * Type guard to check if an event is a canvas event
   */
  isCanvasEvent: (event: any): event is CanvasEvent => {
    return CanvasEventTypeSchema.safeParse(event?.type).success
  },

  /**
   * Validates edge path and calculates total length
   */
  calculateEdgeLength: (path: EdgePath): number => {
    if (path.type === 'straight') {
      return CanvasEventUtils.distance(path.start, path.end)
    }
    // Simplified length calculation for curves - could be enhanced with proper curve math
    return CanvasEventUtils.distance(path.start, path.end) * 1.2
  },

  /**
   * Validates connection point positions are within reasonable bounds
   */
  isValidConnectionPoint: (connection: ConnectionPoint): boolean => {
    return CanvasEventUtils.isValidPosition(connection.position) && 
           connection.nodeId.length > 0 && 
           connection.anchorId.length > 0
  },

  /**
   * Generates default bezier control points for edge path
   */
  generateBezierControlPoints: (start: Position, end: Position): BezierControlPoints => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const offset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5
    
    return {
      cp1: { x: start.x + offset, y: start.y },
      cp2: { x: end.x - offset, y: end.y }
    }
  },

  /**
   * Type guard to check if an event is an edge event
   */
  isEdgeEvent: (event: any): event is CreateEdgeEvent | DeleteEdgeEvent | UpdateEdgePathEvent => {
    const type = event?.type
    return type === CanvasEventTypes.CREATE_EDGE || 
           type === CanvasEventTypes.DELETE_EDGE || 
           type === CanvasEventTypes.UPDATE_EDGE_PATH
  },
} as const

/**
 * Event factory functions for creating well-formed canvas events
 */
export const CanvasEventFactory = {
  /**
   * Creates an ADD_NODE event
   */
  createAddNodeEvent: (
    nodeId: string,
    nodeType: NodeType,
    position: Position,
    options: {
      title?: string
      data?: Record<string, any>
      userId?: string
      timestamp?: Date
    } = {}
  ): AddNodeEvent => {
    return AddNodeEventSchema.parse({
      type: CanvasEventTypes.ADD_NODE,
      payload: {
        nodeId,
        nodeType,
        position,
        title: options.title,
        data: options.data,
      },
      timestamp: options.timestamp || new Date(),
      userId: options.userId,
    })
  },

  /**
   * Creates a MOVE_NODE event
   */
  createMoveNodeEvent: (
    nodeId: string,
    fromPosition: Position,
    toPosition: Position,
    options: {
      isDragging?: boolean
      userId?: string
      timestamp?: Date
    } = {}
  ): MoveNodeEvent => {
    return MoveNodeEventSchema.parse({
      type: CanvasEventTypes.MOVE_NODE,
      payload: {
        nodeId,
        fromPosition,
        toPosition,
        isDragging: options.isDragging,
      },
      timestamp: options.timestamp || new Date(),
      userId: options.userId,
    })
  },

  /**
   * Creates a ZOOM_CANVAS event
   */
  createZoomCanvasEvent: (
    fromZoom: ZoomLevel,
    toZoom: ZoomLevel,
    fromViewBox: ViewBox,
    toViewBox: ViewBox,
    options: {
      zoomCenter?: Position
      zoomDelta?: number
      userId?: string
      timestamp?: Date
    } = {}
  ): ZoomCanvasEvent => {
    return ZoomCanvasEventSchema.parse({
      type: CanvasEventTypes.ZOOM_CANVAS,
      payload: {
        fromZoom,
        toZoom,
        fromViewBox,
        toViewBox,
        zoomCenter: options.zoomCenter,
        zoomDelta: options.zoomDelta,
      },
      timestamp: options.timestamp || new Date(),
      userId: options.userId,
    })
  },

  /**
   * Creates a CREATE_EDGE event
   */
  createCreateEdgeEvent: (
    edgeId: string,
    sourceConnection: ConnectionPoint,
    targetConnection: ConnectionPoint,
    options: {
      edgeType?: EdgeType
      style?: EdgeStyle
      label?: EdgeLabel
      data?: Record<string, any>
      userId?: string
      timestamp?: Date
    } = {}
  ): CreateEdgeEvent => {
    return CreateEdgeEventSchema.parse({
      type: CanvasEventTypes.CREATE_EDGE,
      payload: {
        edgeId,
        sourceConnection,
        targetConnection,
        edgeType: options.edgeType || 'bezier',
        style: options.style,
        label: options.label,
        data: options.data,
      },
      timestamp: options.timestamp || new Date(),
      userId: options.userId,
    })
  },

  /**
   * Creates a DELETE_EDGE event
   */
  createDeleteEdgeEvent: (
    edgeId: string,
    options: {
      sourceConnection?: ConnectionPoint
      targetConnection?: ConnectionPoint
      edgeType?: EdgeType
      style?: EdgeStyle
      data?: Record<string, any>
      userId?: string
      timestamp?: Date
    } = {}
  ): DeleteEdgeEvent => {
    return DeleteEdgeEventSchema.parse({
      type: CanvasEventTypes.DELETE_EDGE,
      payload: {
        edgeId,
        sourceConnection: options.sourceConnection,
        targetConnection: options.targetConnection,
        edgeType: options.edgeType,
        style: options.style,
        data: options.data,
      },
      timestamp: options.timestamp || new Date(),
      userId: options.userId,
    })
  },

  /**
   * Creates an UPDATE_EDGE_PATH event
   */
  createUpdateEdgePathEvent: (
    edgeId: string,
    fromPath: EdgePath,
    toPath: EdgePath,
    reason: 'node_moved' | 'manual_edit' | 'routing_update',
    options: {
      preserveControlPoints?: boolean
      userId?: string
      timestamp?: Date
    } = {}
  ): UpdateEdgePathEvent => {
    return UpdateEdgePathEventSchema.parse({
      type: CanvasEventTypes.UPDATE_EDGE_PATH,
      payload: {
        edgeId,
        fromPath,
        toPath,
        reason,
        preserveControlPoints: options.preserveControlPoints || false,
      },
      timestamp: options.timestamp || new Date(),
      userId: options.userId,
    })
  },
} as const