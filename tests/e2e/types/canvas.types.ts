/**
 * TypeScript types for Canvas E2E tests
 * 
 * Provides type safety for test data structures and helper functions.
 */

// Canvas node types
export interface CanvasNode {
  id: string
  type: 'document' | 'agent'
  position: Position
  data: NodeData
}

export interface DocumentNode extends CanvasNode {
  type: 'document'
  data: DocumentData
}

export interface AgentNode extends CanvasNode {
  type: 'agent'  
  data: AgentData
}

// Position and coordinate types
export interface Position {
  x: number
  y: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ViewBox {
  x: number
  y: number
  width: number
  height: number
}

// Node data types
export interface NodeData {
  title?: string
  [key: string]: any
}

export interface DocumentData extends NodeData {
  title: string
  content?: string
  metadata?: Record<string, any>
}

export interface AgentData extends NodeData {
  name: string
  prompt: string
  model: string
  tools?: string[]
  config?: Record<string, any>
}

// Edge types
export interface CanvasEdge {
  id: string
  source: string
  target: string
  type: string
}

// Event types for testing
export interface CanvasEvent {
  id?: string
  type: string
  payload: any
  timestamp: Date
  userId?: string
}

export interface AddNodeEvent extends CanvasEvent {
  type: 'ADD_NODE'
  payload: {
    nodeId: string
    nodeType: 'document' | 'agent'
    position: Position
    data: NodeData
  }
}

export interface MoveNodeEvent extends CanvasEvent {
  type: 'MOVE_NODE'
  payload: {
    nodeId: string
    fromPosition?: Position
    toPosition: Position
  }
}

export interface DeleteNodeEvent extends CanvasEvent {
  type: 'DELETE_NODE'
  payload: {
    nodeId: string
  }
}

export interface UpdateNodeEvent extends CanvasEvent {
  type: 'UPDATE_NODE'  
  payload: {
    nodeId: string
    changes: Partial<NodeData>
  }
}

// Test configuration types
export interface CanvasTestConfig {
  dimensions: {
    width: number
    height: number
    centerX: number
    centerY: number
  }
  zoom: {
    min: number
    max: number
    default: number
    step: number
  }
  pan: {
    step: number
    boundary: number
  }
  grid: {
    size: number
    majorEvery: number
  }
  nodes: {
    document: NodeStyle
    agent: NodeStyle
  }
}

export interface NodeStyle {
  radius: number
  color: string
  strokeWidth: number
}

// Performance measurement types
export interface PerformanceMetrics {
  duration: number
  fps: number
  memoryUsage?: {
    before: number
    after: number
    delta: number
  }
}

export interface TimingMetrics {
  creationTime: number
  renderTime: number
  operationTime: number
}

// Animation types
export interface AnimationConfig {
  duration: {
    short: number
    medium: number
    long: number
  }
  easing: {
    ease: string
    easeInOut: string
    linear: string
  }
}

// Touch gesture types
export interface TouchGesture {
  type: 'tap' | 'longPress' | 'drag' | 'pinch'
  duration: number
  steps?: number
  distance?: number
}

// Keyboard shortcut types
export interface KeyboardShortcuts {
  pan: Record<string, string>
  zoom: Record<string, string>
  edit: Record<string, string>
  tools: Record<string, string>
}

// Test selector types
export interface TestSelectors {
  canvas: string
  canvasSvg: string
  canvasBackground: string
  grid: string
  canvasNode: string
  documentNode: string
  agentNode: string
  nodeTitle: string
  nodeCircle: string
  addDocButton: string
  addAgentButton: string
  resetViewButton: string
  zoomInButton: string
  zoomOutButton: string
  sidebar: string
  sidebarNodeList: string
  inspector: string
  canvasEdge: string
  edgePath: string
  gridPattern: string
  gridLines: string
}

// Viewport configuration types
export interface ViewportConfig {
  width: number
  height: number
}

export interface ViewportConfigs {
  desktop: ViewportConfig
  laptop: ViewportConfig
  tablet: ViewportConfig
  mobile: ViewportConfig
}

// Error scenario types
export interface ErrorScenario {
  invalidNodeData: Record<string, Partial<CanvasNode>>
  invalidEvents: Record<string, Partial<CanvasEvent>>
}

// Test utility function types
export interface TestUtils {
  generateNodeId: (prefix?: string) => string
  generateRandomPosition: (bounds?: { width: number; height: number }) => Position
  generateNodes: (count: number, type?: 'document' | 'agent') => CanvasNode[]
  distance: (p1: Position, p2: Position) => number
  isWithinBounds: (position: Position, bounds?: { width: number; height: number }) => boolean
}

// Event API response types
export interface EventAPIResponse {
  events: CanvasEvent[]
  total: number
  page?: number
  limit?: number
}

// Canvas state types
export interface CanvasState {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
  viewBox: ViewBox
  zoom: number
  selection: string[]
}

// Test assertion types
export interface PositionAssertion {
  expectedX: number
  expectedY: number
  tolerance?: number
}

export interface ViewBoxAssertion {
  expectedViewBox: ViewBox
  tolerance?: number
}

export interface EventAssertion {
  type: string
  payloadKeys: string[]
  requiredFields: string[]
}

// Helper class interface types
export interface ICanvasHelpers {
  initializeCanvas(): Promise<void>
  getCanvas(): any // Locator type
  getCanvasBounds(): Promise<Bounds>
  getViewBox(): Promise<ViewBox>
  createDocumentNode(position?: Position): Promise<any>
  createAgentNode(position?: Position): Promise<any>
  getNodePosition(node: any): Promise<Position>
  getNodeById(nodeId: string): any
  getAllNodes(): any
  dragNode(node: any, targetPosition: Position): Promise<void>
  panCanvas(offset: Position): Promise<void>
  zoomCanvas(direction: 'in' | 'out', steps?: number): Promise<void>
  resetView(): Promise<void>
  focusCanvas(): Promise<void>
  fitToContent(): Promise<void>
}

export interface IEventAPIHelpers {
  getAllEvents(): Promise<CanvasEvent[]>
  getEventsByType(eventType: string): Promise<CanvasEvent[]>
  waitForEvent(eventType: string, timeout?: number): Promise<CanvasEvent>
  waitForEventWithPayload(eventType: string, payloadMatch: Record<string, any>, timeout?: number): Promise<CanvasEvent>
  verifyEventStructure(event: CanvasEvent): void
  clearEvents(): Promise<void>
}

export interface IAnimationHelpers {
  waitForAnimations(selector: string, timeout?: number): Promise<void>
  measureAnimationPerformance(animationTrigger: () => Promise<void>): Promise<PerformanceMetrics>
}

export interface IAccessibilityHelpers {
  verifyAriaAttributes(selector: string, expectedAttributes: Record<string, string>): Promise<void>
  testKeyboardNavigation(startSelector: string, keys: string[]): Promise<void>
  checkColorContrast(selector: string): Promise<void>
}

export interface IPerformanceHelpers {
  measureTiming(operation: () => Promise<void>): Promise<number>
  loadTestNodes(nodeCount: number): Promise<TimingMetrics>
  monitorMemoryUsage(operation: () => Promise<void>): Promise<PerformanceMetrics['memoryUsage']>
}