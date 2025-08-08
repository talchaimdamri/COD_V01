export interface Position {
  x: number
  y: number
}

export interface CanvasNode {
  id: string
  type: 'document' | 'agent'
  position: Position
  title: string
  selected?: boolean
  dragging?: boolean
  // Additional properties for edge connections
  content?: string
  wordCount?: number
  lastModified?: Date
  model?: string
  prompt?: string
  temperature?: number
  maxTokens?: number
}

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

// Import edge types from existing schemas
import type { 
  EdgeCreationState, 
  EdgeProps, 
  NodeAnchor 
} from '../../../schemas/api/edges'

export interface CanvasEdge {
  id: string
  type: 'bezier' | 'straight' | 'orthogonal'
  source: {
    nodeId: string
    anchorId: string
    position: Position
  }
  target: {
    nodeId: string
    anchorId: string
    position: Position
  }
  style?: {
    stroke?: string
    strokeWidth?: number
    strokeDasharray?: string
    opacity?: number
    markerEnd?: string
    markerStart?: string
  }
  selected?: boolean
  data?: Record<string, any>
}

export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewBox: ViewBox
  scale: number
  isPanning: boolean
  selectedNodeId: string | null
  selectedEdgeId: string | null
  showGrid: boolean
  edgeCreationState: EdgeCreationState
  dragState: {
    isDragging: boolean
    nodeId: string | null
    startPosition: Position | null
    currentPosition: Position | null
  }
}

export interface CanvasProps {
  className?: string
  onNodeCreate?: (type: 'document' | 'agent', position: Position) => void
  onNodeMove?: (nodeId: string, position: Position) => void
  onNodeSelect?: (nodeId: string | null) => void
  onEdgeCreate?: (sourceNodeId: string, targetNodeId: string, edgeType: 'bezier' | 'straight' | 'orthogonal') => void
  onEdgeSelect?: (edgeId: string | null) => void
  onEdgeDelete?: (edgeId: string) => void
  onViewChange?: (viewBox: ViewBox, scale: number) => void
  onGridToggle?: (showGrid: boolean) => void
}

export interface CanvasGridProps {
  viewBox: ViewBox
  scale: number
  visible?: boolean
  className?: string
}

export type CanvasEventHandler = (event: React.MouseEvent | React.TouchEvent) => void
export type KeyboardEventHandler = (event: React.KeyboardEvent) => void
export type WheelEventHandler = (event: React.WheelEvent) => void

export interface CanvasEvents {
  onMouseDown: CanvasEventHandler
  onMouseMove: CanvasEventHandler
  onMouseUp: CanvasEventHandler
  onTouchStart: CanvasEventHandler
  onTouchMove: CanvasEventHandler
  onTouchEnd: CanvasEventHandler
  onWheel: WheelEventHandler
  onKeyDown: KeyboardEventHandler
}

// Constants
export const DEFAULT_VIEW_BOX: ViewBox = {
  x: 0,
  y: 0,
  width: 1200,
  height: 800,
}

export const CANVAS_CONFIG = {
  GRID_SIZE: 8,
  MIN_SCALE: 0.1,
  MAX_SCALE: 5,
  PAN_STEP: 50,
  ZOOM_STEP: 0.1,
  NODE_RADIUS: 30,
  DRAG_THRESHOLD: 5,
} as const