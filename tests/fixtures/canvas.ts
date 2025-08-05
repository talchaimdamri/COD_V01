/**
 * Canvas Component Test Fixtures
 * 
 * Centralized test data and utilities for Canvas E2E tests.
 * These fixtures support the comprehensive Canvas test suite.
 */

// Canvas configuration constants
export const CANVAS_CONFIG = {
  dimensions: {
    width: 800,
    height: 600,
    centerX: 400,
    centerY: 300,
  },
  
  zoom: {
    min: 0.1,
    max: 10.0,
    default: 1.0,
    step: 0.1,
  },
  
  pan: {
    step: 50,
    boundary: 10000, // Maximum pan distance
  },
  
  grid: {
    size: 20,
    majorEvery: 5,
  },
  
  nodes: {
    document: {
      radius: 30,
      color: '#3b82f6',
      strokeWidth: 2,
    },
    agent: {
      radius: 25, 
      color: '#10b981',
      strokeWidth: 2,
    },
  },
} as const

// Test selectors for consistent element targeting
export const CANVAS_SELECTORS = {
  // Main canvas elements
  canvas: '[data-testid="canvas"]',
  canvasSvg: '[data-testid="canvas-svg"]',
  canvasBackground: '[data-testid="canvas-background"]',
  grid: '[data-testid="canvas-grid"]',
  
  // Node elements
  canvasNode: '[data-testid="canvas-node"]',
  documentNode: '[data-testid="canvas-node"][data-node-type="document"]',
  agentNode: '[data-testid="canvas-node"][data-node-type="agent"]',
  nodeTitle: '[data-testid="node-title"]',
  nodeCircle: 'circle',
  
  // Control buttons
  addDocButton: '[data-testid="add-doc-button"]',
  addAgentButton: '[data-testid="add-agent-button"]',
  resetViewButton: '[data-testid="reset-view-button"]',
  zoomInButton: '[data-testid="zoom-in-button"]',
  zoomOutButton: '[data-testid="zoom-out-button"]',
  
  // UI panels
  sidebar: '[data-testid="sidebar"]',
  sidebarNodeList: '[data-testid="sidebar-node-list"]',
  inspector: '[data-testid="inspector"]',
  
  // Edge elements
  canvasEdge: '[data-testid="canvas-edge"]',
  edgePath: 'path',
  
  // Grid pattern
  gridPattern: 'defs pattern[id="grid"]',
  gridLines: '[data-testid="canvas-grid"] line',
} as const

// Mock node data for testing
export const mockNodes = {
  document: {
    id: 'doc-test-1',
    type: 'document',
    position: { x: 200, y: 200 },
    data: {
      title: 'Test Document',
      content: 'This is a test document for E2E testing.',
    },
  },
  
  documentAtOrigin: {
    id: 'doc-test-origin',
    type: 'document', 
    position: { x: 0, y: 0 },
    data: {
      title: 'Origin Document',
      content: 'Document at canvas origin.',
    },
  },
  
  agent: {
    id: 'agent-test-1',
    type: 'agent',
    position: { x: 400, y: 300 },
    data: {
      name: 'Test Agent',
      prompt: 'Test agent for processing documents.',
      model: 'gpt-4',
    },
  },
} as const

// Mock edge data for testing
export const mockEdges = {
  docToAgent: {
    id: 'edge-test-1',
    source: 'doc-test-1',
    target: 'agent-test-1',
    type: 'data-flow',
  },
} as const

// Test event payloads
export const mockEvents = {
  addNode: {
    type: 'ADD_NODE',
    payload: {
      nodeId: 'node-new',
      nodeType: 'document',
      position: { x: 250, y: 250 },
      data: { title: 'New Node' },
    },
    timestamp: new Date('2024-01-01T12:00:00.000Z'),
    userId: 'test-user',
  },
  
  moveNode: {
    type: 'MOVE_NODE',
    payload: {
      nodeId: 'node-1',
      fromPosition: { x: 100, y: 100 },
      toPosition: { x: 200, y: 200 },
    },
    timestamp: new Date('2024-01-01T12:01:00.000Z'), 
    userId: 'test-user',
  },
  
  deleteNode: {
    type: 'DELETE_NODE',
    payload: {
      nodeId: 'node-1',
    },
    timestamp: new Date('2024-01-01T12:02:00.000Z'),
    userId: 'test-user',
  },
  
  undo: {
    type: 'UNDO',
    payload: {},
    timestamp: new Date('2024-01-01T12:03:00.000Z'),
    userId: 'test-user',
  },
  
  redo: {
    type: 'REDO', 
    payload: {},
    timestamp: new Date('2024-01-01T12:04:00.000Z'),
    userId: 'test-user',
  },
} as const

// Coordinate test data
export const testPositions = {
  // Standard positions for consistent testing
  topLeft: { x: 100, y: 100 },
  topRight: { x: 700, y: 100 },
  bottomLeft: { x: 100, y: 500 },
  bottomRight: { x: 700, y: 500 },
  center: { x: 400, y: 300 },
  
  // Edge case positions
  origin: { x: 0, y: 0 },
  negative: { x: -50, y: -50 },
  large: { x: 5000, y: 5000 },
  
  // Drag test positions
  dragStart: { x: 200, y: 200 },
  dragEnd: { x: 400, y: 350 },
  
  // Pan test offsets
  panRight: { x: 100, y: 0 },
  panDown: { x: 0, y: 100 },
  panDiagonal: { x: 50, y: 50 },
} as const

// Keyboard shortcut mappings
export const keyboardShortcuts = {
  pan: {
    up: 'ArrowUp',
    down: 'ArrowDown', 
    left: 'ArrowLeft',
    right: 'ArrowRight',
  },
  
  zoom: {
    in: 'Equal', // + key
    out: 'Minus', // - key
    reset: 'KeyR',
    resetAlt: 'Control+0',
  },
  
  edit: {
    undo: 'Control+KeyZ',
    redo: 'Control+KeyY',
    redoAlt: 'Control+Shift+KeyZ',
    copy: 'Control+KeyC',
    paste: 'Control+KeyV',
    delete: 'Delete',
    selectAll: 'Control+KeyA',
  },
  
  tools: {
    addDocument: 'KeyD',
    addAgent: 'KeyA',
    connect: 'KeyC',
    hand: 'KeyH',
  },
} as const

// Animation timing constants
export const animations = {
  duration: {
    short: 150,
    medium: 300,
    long: 500,
  },
  
  easing: {
    ease: 'ease',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
} as const

// Performance thresholds
export const performanceThresholds = {
  fps: {
    excellent: 60,
    good: 45,
    acceptable: 30,
    poor: 15,
  },
  
  timing: {
    fastOperation: 100,   // Fast UI operations (ms)
    normalOperation: 500, // Normal operations (ms)
    slowOperation: 2000,  // Slow operations like API calls (ms)
  },
  
  nodeCount: {
    light: 10,
    medium: 50,
    heavy: 200,
    stress: 1000,
  },
} as const

// Viewport test configurations
export const viewports = {
  desktop: {
    width: 1920,
    height: 1080,
  },
  
  laptop: {
    width: 1366,
    height: 768,
  },
  
  tablet: {
    width: 768,
    height: 1024,
  },
  
  mobile: {
    width: 375,
    height: 667,
  },
} as const

// Touch gesture configurations
export const touchGestures = {
  tap: {
    duration: 50,
  },
  
  longPress: {
    duration: 800,
  },
  
  drag: {
    steps: 10,
    duration: 300,
  },
  
  pinch: {
    startDistance: 100,
    endDistance: 200,
    steps: 10,
  },
} as const

// Test utilities for generating data
export const testUtils = {
  /**
   * Generate a unique node ID for testing
   */
  generateNodeId: (prefix = 'test-node') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * Generate a random position within canvas bounds
   */
  generateRandomPosition: (bounds = CANVAS_CONFIG.dimensions) => ({
    x: Math.random() * bounds.width,
    y: Math.random() * bounds.height,
  }),
  
  /**
   * Generate multiple nodes for performance testing
   */
  generateNodes: (count: number, type: 'document' | 'agent' = 'document') => {
    return Array.from({ length: count }, (_, i) => ({
      id: testUtils.generateNodeId(type),
      type,
      position: testUtils.generateRandomPosition(),
      data: {
        title: `${type} ${i + 1}`,
        ...(type === 'document' ? { content: `Test content ${i + 1}` } : { prompt: `Test prompt ${i + 1}` }),
      },
    }))
  },
  
  /**
   * Calculate distance between two points
   */
  distance: (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  },
  
  /**
   * Check if position is within bounds
   */
  isWithinBounds: (position: { x: number; y: number }, bounds = CANVAS_CONFIG.dimensions) => {
    return position.x >= 0 && position.x <= bounds.width && 
           position.y >= 0 && position.y <= bounds.height
  },
}

// Error scenarios for negative testing
export const errorScenarios = {
  invalidNodeData: {
    missingId: {
      type: 'document',
      position: { x: 100, y: 100 },
      data: { title: 'No ID' },
    },
    
    invalidPosition: {
      id: 'invalid-pos',
      type: 'document', 
      position: { x: 'invalid', y: 'invalid' },
      data: { title: 'Invalid Position' },
    },
    
    missingType: {
      id: 'no-type',
      position: { x: 100, y: 100 },
      data: { title: 'No Type' },
    },
  },
  
  invalidEvents: {
    malformedPayload: {
      type: 'ADD_NODE',
      payload: 'not an object',
      timestamp: new Date(),
    },
    
    missingTimestamp: {
      type: 'ADD_NODE', 
      payload: { nodeId: 'test' },
    },
    
    invalidEventType: {
      type: 'INVALID_EVENT_TYPE',
      payload: {},
      timestamp: new Date(),
    },
  },
} as const