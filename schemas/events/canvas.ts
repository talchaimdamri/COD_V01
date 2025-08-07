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

export type AddNodeEvent = z.infer<typeof AddNodeEventSchema>
export type MoveNodeEvent = z.infer<typeof MoveNodeEventSchema>
export type DeleteNodeEvent = z.infer<typeof DeleteNodeEventSchema>
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
} as const