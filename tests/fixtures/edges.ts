/**
 * Edge Component Test Fixtures
 * 
 * Centralized test data and utilities for Edge component tests.
 * These fixtures support the comprehensive Edge test suite following TDD methodology.
 */

import type {
  Position,
  ConnectionPoint,
  EdgeType,
  EdgeStyle,
  EdgeLabel,
  BezierControlPoints,
  EdgePath,
} from '../../schemas/events/canvas'

import type {
  NodeAnchor,
  EdgeVisualState,
  DragHandle,
  EdgeCreationState,
  BezierEdgeProps,
  StraightEdgeProps,
  OrthogonalEdgeProps,
  EdgeRoutingConfig,
  EdgeAnimation,
} from '../../schemas/api/edges'

// Test positions for edge endpoints
export const testPositions = {
  topLeft: { x: 100, y: 100 },
  topRight: { x: 600, y: 100 },
  bottomLeft: { x: 100, y: 400 },
  bottomRight: { x: 600, y: 400 },
  center: { x: 350, y: 250 },
  origin: { x: 0, y: 0 },
  
  // Specific test positions for edge scenarios
  closePoints: {
    start: { x: 100, y: 100 },
    end: { x: 120, y: 110 }, // Very close points
  },
  
  farPoints: {
    start: { x: 0, y: 0 },
    end: { x: 1000, y: 800 }, // Far apart points
  },
  
  verticalLine: {
    start: { x: 200, y: 100 },
    end: { x: 200, y: 400 }, // Vertical line
  },
  
  horizontalLine: {
    start: { x: 100, y: 200 },
    end: { x: 500, y: 200 }, // Horizontal line
  },
  
  diagonalLine: {
    start: { x: 100, y: 100 },
    end: { x: 400, y: 300 }, // Diagonal line
  },
} as const

// Base connection points for testing
export const baseConnectionPoints = {
  documentNode: {
    nodeId: 'doc-1',
    anchorId: 'right',
    position: { x: 200, y: 150 },
  } as ConnectionPoint,
  
  agentNode: {
    nodeId: 'agent-1', 
    anchorId: 'left',
    position: { x: 400, y: 150 },
  } as ConnectionPoint,
  
  topAnchor: {
    nodeId: 'node-1',
    anchorId: 'top',
    position: { x: 300, y: 100 },
  } as ConnectionPoint,
  
  bottomAnchor: {
    nodeId: 'node-2',
    anchorId: 'bottom', 
    position: { x: 300, y: 300 },
  } as ConnectionPoint,
} as const

// Node anchor test fixtures
export const nodeAnchors = {
  inputOnly: {
    id: 'input-anchor',
    position: 'left' as const,
    connectionType: 'input' as const,
    connectable: true,
    visible: true,
  } as NodeAnchor,
  
  outputOnly: {
    id: 'output-anchor',
    position: 'right' as const,
    connectionType: 'output' as const,
    connectable: true,
    visible: true,
  } as NodeAnchor,
  
  bidirectional: {
    id: 'bi-anchor',
    position: 'center' as const,
    connectionType: 'bidirectional' as const,
    connectable: true,
    visible: true,
  } as NodeAnchor,
  
  notConnectable: {
    id: 'disabled-anchor',
    position: 'bottom' as const,
    connectionType: 'output' as const,
    connectable: false,
    visible: false,
  } as NodeAnchor,
  
  withOffset: {
    id: 'offset-anchor',
    position: 'top' as const,
    offset: { x: 10, y: -5 },
    connectionType: 'bidirectional' as const,
    connectable: true,
    visible: true,
  } as NodeAnchor,
} as const

// Edge style variations for testing
export const edgeStyles = {
  default: {
    stroke: '#666666',
    strokeWidth: 2,
    opacity: 1,
  } as EdgeStyle,
  
  thick: {
    stroke: '#333333',
    strokeWidth: 4,
    opacity: 1,
  } as EdgeStyle,
  
  dashed: {
    stroke: '#999999',
    strokeWidth: 2,
    strokeDasharray: '5,5',
    opacity: 0.8,
  } as EdgeStyle,
  
  colored: {
    stroke: '#3b82f6',
    strokeWidth: 3,
    opacity: 1,
  } as EdgeStyle,
  
  withMarkers: {
    stroke: '#10b981',
    strokeWidth: 2,
    markerStart: 'url(#arrow-start)',
    markerEnd: 'url(#arrow-end)',
    opacity: 1,
  } as EdgeStyle,
  
  transparent: {
    stroke: '#666666',
    strokeWidth: 2,
    opacity: 0.3,
  } as EdgeStyle,
} as const

// Edge label test fixtures
export const edgeLabels = {
  simple: {
    text: 'Edge Label',
    position: 0.5,
    offset: 10,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontSize: 12,
    padding: 4,
  } as EdgeLabel,
  
  atStart: {
    text: 'Start',
    position: 0.1,
    offset: 15,
    backgroundColor: '#f0f0f0',
    textColor: '#333333',
    fontSize: 10,
    padding: 2,
  } as EdgeLabel,
  
  atEnd: {
    text: 'End',
    position: 0.9,
    offset: 15,
    backgroundColor: '#f0f0f0',
    textColor: '#333333', 
    fontSize: 10,
    padding: 2,
  } as EdgeLabel,
  
  longText: {
    text: 'This is a very long edge label that might need wrapping',
    position: 0.5,
    offset: 20,
    backgroundColor: '#ffffff',
    textColor: '#000000',
    fontSize: 11,
    padding: 6,
  } as EdgeLabel,
  
  styled: {
    text: 'Styled',
    position: 0.5,
    offset: 12,
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    fontSize: 14,
    padding: 8,
  } as EdgeLabel,
} as const

// Bezier control points for testing
export const bezierControlPoints = {
  gentle: {
    cp1: { x: 250, y: 150 },
    cp2: { x: 350, y: 150 },
  } as BezierControlPoints,
  
  dramatic: {
    cp1: { x: 200, y: 50 },
    cp2: { x: 400, y: 250 },
  } as BezierControlPoints,
  
  reverse: {
    cp1: { x: 150, y: 150 },
    cp2: { x: 250, y: 150 },
  } as BezierControlPoints,
  
  vertical: {
    cp1: { x: 200, y: 50 },
    cp2: { x: 200, y: 350 },
  } as BezierControlPoints,
  
  horizontal: {
    cp1: { x: 50, y: 200 },
    cp2: { x: 450, y: 200 },
  } as BezierControlPoints,
} as const

// Edge paths for different types
export const edgePaths = {
  bezier: {
    type: 'bezier' as EdgeType,
    start: testPositions.topLeft,
    end: testPositions.bottomRight,
    controlPoints: bezierControlPoints.gentle,
  } as EdgePath,
  
  straight: {
    type: 'straight' as EdgeType,
    start: testPositions.topLeft,
    end: testPositions.bottomRight,
  } as EdgePath,
  
  orthogonal: {
    type: 'orthogonal' as EdgeType,
    start: testPositions.topLeft,
    end: testPositions.bottomRight,
    waypoints: [
      { x: 100, y: 250 },
      { x: 600, y: 250 },
    ],
  } as EdgePath,
  
  shortBezier: {
    type: 'bezier' as EdgeType,
    start: testPositions.closePoints.start,
    end: testPositions.closePoints.end,
    controlPoints: {
      cp1: { x: 110, y: 100 },
      cp2: { x: 115, y: 110 },
    },
  } as EdgePath,
  
  longStraight: {
    type: 'straight' as EdgeType,
    start: testPositions.farPoints.start,
    end: testPositions.farPoints.end,
  } as EdgePath,
} as const

// Visual states for testing
export const visualStates = {
  default: {
    selected: false,
    hovered: false,
    dragging: false,
    connecting: false,
    animated: false,
  } as EdgeVisualState,
  
  selected: {
    selected: true,
    hovered: false,
    dragging: false,
    connecting: false,
    animated: false,
  } as EdgeVisualState,
  
  hovered: {
    selected: false,
    hovered: true,
    dragging: false,
    connecting: false,
    animated: false,
  } as EdgeVisualState,
  
  dragging: {
    selected: true,
    hovered: false,
    dragging: true,
    connecting: false,
    animated: false,
  } as EdgeVisualState,
  
  connecting: {
    selected: false,
    hovered: false,
    dragging: false,
    connecting: true,
    animated: false,
  } as EdgeVisualState,
  
  animated: {
    selected: false,
    hovered: false,
    dragging: false,
    connecting: false,
    animated: true,
  } as EdgeVisualState,
} as const

// Drag handles for control points
export const dragHandles = {
  default: {
    position: { x: 250, y: 150 },
    radius: 6,
    visible: false,
    color: '#0066cc',
    hoverColor: '#0080ff',
  } as DragHandle,
  
  visible: {
    position: { x: 350, y: 150 },
    radius: 8,
    visible: true,
    color: '#10b981',
    hoverColor: '#34d399',
  } as DragHandle,
  
  large: {
    position: { x: 300, y: 200 },
    radius: 12,
    visible: true,
    color: '#f59e0b',
    hoverColor: '#fbbf24',
  } as DragHandle,
} as const

// Complete edge props for different types
export const edgeProps = {
  bezierEdge: {
    id: 'bezier-edge-1',
    type: 'bezier' as const,
    source: baseConnectionPoints.documentNode,
    target: baseConnectionPoints.agentNode,
    path: edgePaths.bezier,
    style: edgeStyles.default,
    label: edgeLabels.simple,
    visualState: visualStates.default,
    controlPoints: bezierControlPoints.gentle,
    showControlPoints: false,
    curvature: 0.5,
  } as BezierEdgeProps,
  
  straightEdge: {
    id: 'straight-edge-1',
    type: 'straight' as const,
    source: baseConnectionPoints.topAnchor,
    target: baseConnectionPoints.bottomAnchor,
    path: edgePaths.straight,
    style: edgeStyles.thick,
    showMidpointHandle: false,
  } as StraightEdgeProps,
  
  orthogonalEdge: {
    id: 'orthogonal-edge-1',
    type: 'orthogonal' as const,
    source: baseConnectionPoints.documentNode,
    target: baseConnectionPoints.agentNode,
    path: edgePaths.orthogonal,
    style: edgeStyles.colored,
    label: edgeLabels.atStart,
    cornerRadius: 5,
    waypoints: edgePaths.orthogonal.waypoints,
    showWaypoints: false,
  } as OrthogonalEdgeProps,
} as const

// Edge creation states for drag-and-drop testing
export const creationStates = {
  inactive: {
    isCreating: false,
    sourceConnection: null,
    currentPosition: null,
    validTarget: null,
  } as EdgeCreationState,
  
  started: {
    isCreating: true,
    sourceConnection: baseConnectionPoints.documentNode,
    currentPosition: { x: 300, y: 150 },
    validTarget: null,
  } as EdgeCreationState,
  
  hovering: {
    isCreating: true,
    sourceConnection: baseConnectionPoints.documentNode,
    currentPosition: { x: 390, y: 150 },
    validTarget: baseConnectionPoints.agentNode,
    previewStyle: edgeStyles.dashed,
  } as EdgeCreationState,
  
  invalidTarget: {
    isCreating: true,
    sourceConnection: baseConnectionPoints.documentNode,
    currentPosition: { x: 350, y: 200 },
    validTarget: null,
  } as EdgeCreationState,
} as const

// Routing configurations for testing
export const routingConfigs = {
  default: {
    algorithm: 'bezier' as const,
    avoidNodes: true,
    cornerRadius: 5,
    padding: 20,
    smoothing: 0.5,
  } as EdgeRoutingConfig,
  
  straight: {
    algorithm: 'straight' as const,
    avoidNodes: false,
    cornerRadius: 0,
    padding: 10,
    smoothing: 0,
  } as EdgeRoutingConfig,
  
  orthogonal: {
    algorithm: 'orthogonal' as const,
    avoidNodes: true,
    cornerRadius: 8,
    padding: 30,
    smoothing: 0.3,
  } as EdgeRoutingConfig,
  
  smart: {
    algorithm: 'smart' as const,
    avoidNodes: true,
    cornerRadius: 10,
    padding: 25,
    smoothing: 0.7,
  } as EdgeRoutingConfig,
} as const

// Animation configurations
export const animations = {
  flow: {
    enabled: true,
    type: 'flow' as const,
    duration: 2000,
    direction: 'forward' as const,
    color: '#3b82f6',
    width: 3,
  } as EdgeAnimation,
  
  pulse: {
    enabled: true,
    type: 'pulse' as const,
    duration: 1500,
    direction: 'bidirectional' as const,
    color: '#10b981',
    width: 4,
  } as EdgeAnimation,
  
  dash: {
    enabled: true,
    type: 'dash' as const,
    duration: 3000,
    direction: 'backward' as const,
    color: '#f59e0b',
    width: 2,
  } as EdgeAnimation,
  
  disabled: {
    enabled: false,
    type: 'flow' as const,
    duration: 2000,
    direction: 'forward' as const,
    color: '#666666',
    width: 2,
  } as EdgeAnimation,
} as const

// Test scenarios for complex edge behaviors
export const testScenarios = {
  // Performance testing scenarios
  manyEdges: Array.from({ length: 100 }, (_, i) => ({
    id: `edge-${i}`,
    type: 'bezier' as const,
    source: {
      nodeId: `node-${i}`,
      anchorId: 'right',
      position: { x: 100 + (i % 10) * 50, y: 100 + Math.floor(i / 10) * 50 },
    },
    target: {
      nodeId: `node-${i + 1}`,
      anchorId: 'left', 
      position: { x: 200 + (i % 10) * 50, y: 100 + Math.floor(i / 10) * 50 },
    },
    path: {
      type: 'bezier' as EdgeType,
      start: { x: 100 + (i % 10) * 50, y: 100 + Math.floor(i / 10) * 50 },
      end: { x: 200 + (i % 10) * 50, y: 100 + Math.floor(i / 10) * 50 },
    },
  })),
  
  // Edge crossing scenarios
  crossingEdges: [
    {
      id: 'horizontal-edge',
      type: 'straight' as const,
      source: { nodeId: 'left', anchorId: 'right', position: { x: 100, y: 200 } },
      target: { nodeId: 'right', anchorId: 'left', position: { x: 400, y: 200 } },
      path: {
        type: 'straight' as EdgeType,
        start: { x: 100, y: 200 },
        end: { x: 400, y: 200 },
      },
    },
    {
      id: 'vertical-edge',
      type: 'straight' as const,
      source: { nodeId: 'top', anchorId: 'bottom', position: { x: 250, y: 100 } },
      target: { nodeId: 'bottom', anchorId: 'top', position: { x: 250, y: 300 } },
      path: {
        type: 'straight' as EdgeType,
        start: { x: 250, y: 100 },
        end: { x: 250, y: 300 },
      },
    },
  ],
  
  // Self-loop edge
  selfLoop: {
    id: 'self-loop',
    type: 'bezier' as const,
    source: { nodeId: 'node-1', anchorId: 'top', position: { x: 200, y: 150 } },
    target: { nodeId: 'node-1', anchorId: 'bottom', position: { x: 200, y: 250 } },
    path: {
      type: 'bezier' as EdgeType,
      start: { x: 200, y: 150 },
      end: { x: 200, y: 250 },
      controlPoints: {
        cp1: { x: 300, y: 150 },
        cp2: { x: 300, y: 250 },
      },
    },
    controlPoints: {
      cp1: { x: 300, y: 150 },
      cp2: { x: 300, y: 250 },
    },
  },
} as const

// SVG path test data
export const svgPaths = {
  bezier: 'M 100,100 C 250,150 350,150 600,400',
  straight: 'M 100,100 L 600,400',
  orthogonal: 'M 100,100 L 100,250 L 600,250 L 600,400',
  
  // Complex paths
  multiSegment: 'M 100,100 L 200,100 Q 250,100 250,150 L 250,200 C 250,250 300,250 350,200 L 400,200',
  withArcs: 'M 100,100 A 50,50 0 0,1 200,200 L 300,300 A 30,30 0 1,0 400,400',
} as const

// Error scenarios for negative testing
export const errorScenarios = {
  invalidPositions: {
    nanCoordinates: { x: NaN, y: 150 },
    infiniteCoordinates: { x: 100, y: Infinity },
    stringCoordinates: { x: '100' as any, y: '150' as any },
  },
  
  invalidConnectionPoints: {
    missingNodeId: {
      nodeId: '',
      anchorId: 'right',
      position: { x: 100, y: 100 },
    },
    missingAnchorId: {
      nodeId: 'node-1',
      anchorId: '',
      position: { x: 100, y: 100 },
    },
    invalidPosition: {
      nodeId: 'node-1',
      anchorId: 'right',
      position: { x: NaN, y: 100 },
    },
  },
  
  invalidEdgeTypes: {
    unknownType: 'unknown' as any,
    nullType: null as any,
    undefinedType: undefined as any,
  },
} as const

// Performance measurement utilities
export const performanceUtils = {
  /**
   * Generate edges for performance testing
   */
  generateEdges: (count: number): BezierEdgeProps[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `perf-edge-${i}`,
      type: 'bezier' as const,
      source: {
        nodeId: `source-${i}`,
        anchorId: 'right',
        position: { x: 50 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
      },
      target: {
        nodeId: `target-${i}`,
        anchorId: 'left',
        position: { x: 150 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
      },
      path: {
        type: 'bezier' as EdgeType,
        start: { x: 50 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
        end: { x: 150 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
        controlPoints: {
          cp1: { x: 100 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
          cp2: { x: 100 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
        },
      },
      controlPoints: {
        cp1: { x: 100 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
        cp2: { x: 100 + (i % 20) * 30, y: 50 + Math.floor(i / 20) * 40 },
      },
      curvature: 0.5,
      showControlPoints: false,
    }))
  },
  
  /**
   * Calculate edge path length (approximation)
   */
  calculatePathLength: (path: EdgePath): number => {
    if (path.type === 'straight') {
      return Math.sqrt(
        Math.pow(path.end.x - path.start.x, 2) + 
        Math.pow(path.end.y - path.start.y, 2)
      )
    }
    // Simplified bezier/orthogonal length calculation
    return Math.sqrt(
      Math.pow(path.end.x - path.start.x, 2) + 
      Math.pow(path.end.y - path.start.y, 2)
    ) * 1.2
  },
  
  /**
   * Create collision detection test bounds
   */
  createTestBounds: (center: Position, size: number) => ({
    x: center.x - size / 2,
    y: center.y - size / 2,
    width: size,
    height: size,
  }),
} as const

// Test selectors for consistent element targeting
export const EDGE_SELECTORS = {
  // Edge elements
  canvasEdge: '[data-testid="canvas-edge"]',
  edgePath: '[data-testid="edge-path"]',
  edgeLabel: '[data-testid="edge-label"]',
  
  // Control elements
  controlPoint: '[data-testid="control-point"]',
  dragHandle: '[data-testid="drag-handle"]',
  midpointHandle: '[data-testid="midpoint-handle"]',
  waypointHandle: '[data-testid="waypoint-handle"]',
  
  // Connection elements
  nodeAnchor: '[data-testid="node-anchor"]',
  connectionPoint: '[data-testid="connection-point"]',
  connectionPreview: '[data-testid="connection-preview"]',
  
  // Selection elements
  selectionHighlight: '[data-testid="selection-highlight"]',
  deleteHandle: '[data-testid="delete-handle"]',
  
  // Animation elements
  flowAnimation: '[data-testid="flow-animation"]',
  pulseAnimation: '[data-testid="pulse-animation"]',
  
  // SVG elements
  edgeMarkerStart: '[data-testid="edge-marker-start"]',
  edgeMarkerEnd: '[data-testid="edge-marker-end"]',
  
  // Context menu
  edgeContextMenu: '[data-testid="edge-context-menu"]',
  editLabelMenuItem: '[data-testid="edit-label-menu-item"]',
  deleteEdgeMenuItem: '[data-testid="delete-edge-menu-item"]',
} as const

export default {
  testPositions,
  baseConnectionPoints,
  nodeAnchors,
  edgeStyles,
  edgeLabels,
  bezierControlPoints,
  edgePaths,
  visualStates,
  dragHandles,
  edgeProps,
  creationStates,
  routingConfigs,
  animations,
  testScenarios,
  svgPaths,
  errorScenarios,
  performanceUtils,
  EDGE_SELECTORS,
}