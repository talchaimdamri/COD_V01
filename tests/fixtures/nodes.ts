/**
 * Node Component Test Fixtures
 * 
 * Centralized test data and utilities for DocumentNode and AgentNode tests.
 * These fixtures support comprehensive testing of node components following TDD methodology.
 */

import { z } from 'zod'
import { Position, ViewBox } from '../../schemas/events/canvas'

// Base node fixture types
export interface BaseNodeFixture {
  id: string
  type: 'document' | 'agent'
  position: Position
  title: string
  selected?: boolean
  dragging?: boolean
  hovered?: boolean
}

export interface DocumentNodeData {
  content?: string
  lastModified?: Date
  wordCount?: number
  status?: 'draft' | 'review' | 'published'
}

export interface AgentNodeData {
  model: string
  prompt?: string
  temperature?: number
  maxTokens?: number
  status?: 'idle' | 'processing' | 'error'
}

export interface DocumentNodeFixture extends BaseNodeFixture {
  type: 'document'
  data: DocumentNodeData
}

export interface AgentNodeFixture extends BaseNodeFixture {
  type: 'agent'
  data: AgentNodeData
}

export type NodeFixture = DocumentNodeFixture | AgentNodeFixture

// Visual configuration constants
export const NODE_CONFIG = {
  document: {
    shape: 'rounded-rectangle',
    width: 120,
    height: 80,
    borderRadius: 8,
    strokeWidth: 2,
    iconSize: 20,
    iconType: 'document',
    colors: {
      default: {
        fill: '#3b82f6',
        stroke: '#1e40af',
        text: '#ffffff',
        icon: '#ffffff'
      },
      selected: {
        fill: '#3b82f6',
        stroke: '#1d4ed8',
        text: '#ffffff',
        icon: '#ffffff'
      },
      hover: {
        fill: '#60a5fa',
        stroke: '#1e40af',
        text: '#ffffff', 
        icon: '#ffffff'
      },
      dragging: {
        fill: '#93c5fd',
        stroke: '#1e40af',
        text: '#ffffff',
        icon: '#ffffff',
        opacity: 0.8
      }
    }
  },
  agent: {
    shape: 'hexagon',
    radius: 35,
    strokeWidth: 2,
    iconSize: 18,
    iconType: 'cpu',
    colors: {
      default: {
        fill: '#10b981',
        stroke: '#065f46',
        text: '#ffffff',
        icon: '#ffffff'
      },
      selected: {
        fill: '#10b981',
        stroke: '#047857',
        text: '#ffffff',
        icon: '#ffffff'
      },
      hover: {
        fill: '#34d399',
        stroke: '#065f46',
        text: '#ffffff',
        icon: '#ffffff'
      },
      dragging: {
        fill: '#6ee7b7',
        stroke: '#065f46',
        text: '#ffffff',
        icon: '#ffffff',
        opacity: 0.8
      }
    }
  },
  grid: {
    size: 20,
    snapThreshold: 10,
    majorEvery: 5
  },
  collision: {
    minDistance: 100,
    buffer: 10
  }
} as const

// Test selectors for consistent element targeting
export const NODE_SELECTORS = {
  // Base node selectors
  documentNode: '[data-testid="document-node"]',
  agentNode: '[data-testid="agent-node"]',
  nodeContainer: '[data-testid="node-container"]',
  
  // Document node elements
  documentShape: '[data-testid="document-shape"]',
  documentIcon: '[data-testid="document-icon"]',
  documentTitle: '[data-testid="document-title"]',
  documentContent: '[data-testid="document-content"]',
  documentStatus: '[data-testid="document-status"]',
  
  // Agent node elements  
  agentShape: '[data-testid="agent-shape"]',
  agentIcon: '[data-testid="agent-icon"]',
  agentTitle: '[data-testid="agent-title"]',
  agentModel: '[data-testid="agent-model"]',
  agentStatus: '[data-testid="agent-status"]',
  
  // State indicators
  selectionIndicator: '[data-testid="selection-indicator"]',
  hoverIndicator: '[data-testid="hover-indicator"]',
  connectionPoints: '[data-testid="connection-points"]',
  dragHandle: '[data-testid="drag-handle"]',
  
  // Grid and snap indicators
  gridLines: '[data-testid="grid-lines"]',
  snapIndicator: '[data-testid="snap-indicator"]',
  snapGuides: '[data-testid="snap-guides"]'
} as const

// Mock DocumentNode fixtures
export const documentNodeFixtures = {
  basic: {
    id: 'doc-test-basic',
    type: 'document' as const,
    position: { x: 200, y: 200 },
    title: 'Test Document',
    data: {
      content: 'This is test content for a document node.',
      wordCount: 42,
      status: 'draft' as const
    }
  },
  
  selected: {
    id: 'doc-test-selected', 
    type: 'document' as const,
    position: { x: 300, y: 150 },
    title: 'Selected Document',
    selected: true,
    data: {
      content: 'Selected document content.',
      wordCount: 25,
      status: 'review' as const
    }
  },
  
  dragging: {
    id: 'doc-test-dragging',
    type: 'document' as const,
    position: { x: 150, y: 300 },
    title: 'Dragging Document',
    dragging: true,
    data: {
      content: 'Document being dragged.',
      wordCount: 18,
      status: 'published' as const
    }
  },
  
  longTitle: {
    id: 'doc-test-long',
    type: 'document' as const,
    position: { x: 400, y: 100 },
    title: 'This is a very long document title that should be truncated',
    data: {
      content: 'Document with a very long title for testing text overflow.',
      wordCount: 55,
      status: 'draft' as const
    }
  },
  
  minimal: {
    id: 'doc-test-minimal',
    type: 'document' as const,
    position: { x: 100, y: 400 },
    title: 'Min',
    data: {
      status: 'draft' as const
    }
  }
} as const

// Mock AgentNode fixtures
export const agentNodeFixtures = {
  basic: {
    id: 'agent-test-basic',
    type: 'agent' as const,
    position: { x: 500, y: 200 },
    title: 'Test Agent',
    data: {
      model: 'gpt-4',
      prompt: 'You are a helpful assistant.',
      temperature: 0.7,
      maxTokens: 2048,
      status: 'idle' as const
    }
  },
  
  selected: {
    id: 'agent-test-selected',
    type: 'agent' as const,
    position: { x: 350, y: 350 },
    title: 'Selected Agent',
    selected: true,
    data: {
      model: 'claude-3-sonnet',
      prompt: 'Selected agent prompt.',
      temperature: 0.5,
      maxTokens: 1024,
      status: 'processing' as const
    }
  },
  
  processing: {
    id: 'agent-test-processing',
    type: 'agent' as const,
    position: { x: 250, y: 450 },
    title: 'Processing Agent',
    data: {
      model: 'gpt-3.5-turbo',
      prompt: 'Processing request...',
      temperature: 0.3,
      maxTokens: 512,
      status: 'processing' as const
    }
  },
  
  error: {
    id: 'agent-test-error',
    type: 'agent' as const,
    position: { x: 450, y: 450 },
    title: 'Error Agent',
    data: {
      model: 'gpt-4',
      prompt: 'Failed request.',
      temperature: 0.7,
      status: 'error' as const
    }
  },
  
  minimal: {
    id: 'agent-test-minimal',
    type: 'agent' as const,
    position: { x: 50, y: 50 },
    title: 'Min',
    data: {
      model: 'gpt-4',
      status: 'idle' as const
    }
  }
} as const

// Mock node collections for multi-node tests
export const nodeCollections = {
  mixed: [
    documentNodeFixtures.basic,
    agentNodeFixtures.basic,
    documentNodeFixtures.selected,
    agentNodeFixtures.processing
  ],
  
  documents: [
    documentNodeFixtures.basic,
    documentNodeFixtures.selected,
    documentNodeFixtures.dragging,
    documentNodeFixtures.longTitle
  ],
  
  agents: [
    agentNodeFixtures.basic,
    agentNodeFixtures.selected,
    agentNodeFixtures.processing,
    agentNodeFixtures.error
  ],
  
  gridPositioned: [
    { ...documentNodeFixtures.basic, position: { x: 200, y: 200 } }, // On grid
    { ...agentNodeFixtures.basic, position: { x: 205, y: 198 } },      // Near grid (should snap)
    { ...documentNodeFixtures.selected, position: { x: 240, y: 240 } }, // On grid
    { ...agentNodeFixtures.selected, position: { x: 270, y: 268 } }     // Near grid
  ],
  
  colliding: [
    { ...documentNodeFixtures.basic, position: { x: 200, y: 200 } },
    { ...agentNodeFixtures.basic, position: { x: 220, y: 220 } },      // Too close (should collide)
    { ...documentNodeFixtures.selected, position: { x: 300, y: 300 } },
    { ...agentNodeFixtures.selected, position: { x: 340, y: 340 } }    // Far enough apart
  ]
} as const

// Drag interaction test data
export const dragScenarios = {
  shortDrag: {
    start: { x: 200, y: 200 },
    end: { x: 250, y: 220 },
    steps: 3,
    duration: 100
  },
  
  longDrag: {
    start: { x: 100, y: 100 },
    end: { x: 400, y: 300 },
    steps: 10,
    duration: 500
  },
  
  snapToGrid: {
    start: { x: 203, y: 197 },
    end: { x: 258, y: 242 },
    expectedSnap: { x: 260, y: 240 },
    steps: 5
  },
  
  collisionAvoidance: {
    start: { x: 200, y: 200 },
    end: { x: 220, y: 220 },
    expectedStop: { x: 210, y: 210 }, // Should stop before collision
    obstacle: { x: 220, y: 220 }
  },
  
  boundary: {
    start: { x: 50, y: 50 },
    end: { x: -10, y: -10 },
    expectedConstrained: { x: 0, y: 0 } // Should be constrained to viewport
  }
} as const

// Touch gesture test configurations  
export const touchScenarios = {
  tap: {
    position: { x: 200, y: 200 },
    duration: 50
  },
  
  longPress: {
    position: { x: 300, y: 250 },
    duration: 800,
    expectedAction: 'context-menu'
  },
  
  drag: {
    start: { x: 150, y: 150 },
    end: { x: 250, y: 200 },
    steps: 8,
    duration: 300
  },
  
  multiTouch: {
    touch1: { x: 180, y: 180 },
    touch2: { x: 220, y: 220 },
    expectedAction: 'none' // Should ignore multi-touch on nodes
  }
} as const

// Selection state test data
export const selectionScenarios = {
  single: {
    nodeId: 'doc-test-basic',
    expectedState: { selected: true, multiSelect: false }
  },
  
  deselect: {
    nodeId: null,
    expectedState: { selected: false }
  },
  
  switchSelection: {
    from: 'doc-test-basic',
    to: 'agent-test-basic',
    expectedStates: [
      { nodeId: 'doc-test-basic', selected: false },
      { nodeId: 'agent-test-basic', selected: true }
    ]
  },
  
  keyboardNavigation: {
    nodes: ['doc-test-basic', 'agent-test-basic', 'doc-test-selected'],
    tabForward: ['doc-test-basic', 'agent-test-basic', 'doc-test-selected', 'doc-test-basic'],
    tabBackward: ['doc-test-selected', 'agent-test-basic', 'doc-test-basic', 'doc-test-selected']
  }
} as const

// Grid snapping test utilities
export const gridUtils = {
  /**
   * Calculate expected snap position for given coordinates
   */
  calculateSnapPosition: (position: Position, gridSize = NODE_CONFIG.grid.size): Position => {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    }
  },
  
  /**
   * Check if position should snap to grid
   */
  shouldSnapToGrid: (position: Position, gridSize = NODE_CONFIG.grid.size): boolean => {
    const snapPos = gridUtils.calculateSnapPosition(position, gridSize)
    const distance = Math.sqrt(
      Math.pow(position.x - snapPos.x, 2) + Math.pow(position.y - snapPos.y, 2)
    )
    return distance <= NODE_CONFIG.grid.snapThreshold
  },
  
  /**
   * Generate grid positions for testing
   */
  generateGridPositions: (count: number, gridSize = NODE_CONFIG.grid.size): Position[] => {
    const positions: Position[] = []
    const cols = Math.ceil(Math.sqrt(count))
    
    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      positions.push({
        x: col * gridSize * 3, // Space out for visibility
        y: row * gridSize * 3
      })
    }
    
    return positions
  }
}

// Collision detection utilities
export const collisionUtils = {
  /**
   * Check if two nodes would collide
   */
  wouldCollide: (pos1: Position, pos2: Position, minDistance = NODE_CONFIG.collision.minDistance): boolean => {
    const distance = Math.sqrt(
      Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
    )
    return distance < minDistance
  },
  
  /**
   * Find nearest non-colliding position
   */
  findNonCollidingPosition: (
    targetPos: Position, 
    existingPositions: Position[], 
    minDistance = NODE_CONFIG.collision.minDistance
  ): Position => {
    let testPos = { ...targetPos }
    let angle = 0
    let radius = minDistance
    
    while (existingPositions.some(pos => collisionUtils.wouldCollide(testPos, pos, minDistance))) {
      testPos = {
        x: targetPos.x + Math.cos(angle) * radius,
        y: targetPos.y + Math.sin(angle) * radius
      }
      angle += Math.PI / 8 // 22.5 degree increments
      if (angle >= 2 * Math.PI) {
        angle = 0
        radius += 20
      }
    }
    
    return testPos
  }
}

// Animation test utilities
export const animationUtils = {
  /**
   * Create smooth position interpolation for drag animation testing
   */
  interpolatePosition: (start: Position, end: Position, progress: number): Position => {
    return {
      x: start.x + (end.x - start.x) * progress,
      y: start.y + (end.y - start.y) * progress
    }
  },
  
  /**
   * Generate animation frames for testing
   */
  generateAnimationFrames: (start: Position, end: Position, steps: number): Position[] => {
    const frames: Position[] = []
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      frames.push(animationUtils.interpolatePosition(start, end, progress))
    }
    return frames
  }
}

// Test utilities
export const nodeTestUtils = {
  /**
   * Generate unique node ID for testing
   */
  generateNodeId: (type: 'document' | 'agent' = 'document'): string => 
    `${type}-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * Create test node with random position
   */
  createTestNode: (overrides: Partial<NodeFixture> = {}): NodeFixture => {
    const type = overrides.type || 'document'
    const baseNode = type === 'document' 
      ? { ...documentNodeFixtures.basic }
      : { ...agentNodeFixtures.basic }
    
    return {
      ...baseNode,
      id: nodeTestUtils.generateNodeId(type),
      position: {
        x: Math.random() * 800,
        y: Math.random() * 600
      },
      ...overrides
    } as NodeFixture
  },
  
  /**
   * Validate node fixture structure
   */
  validateNodeFixture: (node: any): node is NodeFixture => {
    if (!node || typeof node !== 'object') return false
    if (typeof node.id !== 'string' || !node.id) return false
    if (!['document', 'agent'].includes(node.type)) return false
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') return false
    if (typeof node.title !== 'string') return false
    if (!node.data || typeof node.data !== 'object') return false
    
    if (node.type === 'document') {
      return typeof node.data.status === 'string'
    }
    
    if (node.type === 'agent') {
      return typeof node.data.model === 'string' && typeof node.data.status === 'string'
    }
    
    return false
  },
  
  /**
   * Create Zod schema for node fixture validation
   */
  createNodeFixtureSchema: () => z.union([
    z.object({
      id: z.string().min(1),
      type: z.literal('document'),
      position: z.object({ x: z.number(), y: z.number() }),
      title: z.string(),
      selected: z.boolean().optional(),
      dragging: z.boolean().optional(),
      hovered: z.boolean().optional(),
      data: z.object({
        content: z.string().optional(),
        lastModified: z.date().optional(),
        wordCount: z.number().optional(),
        status: z.enum(['draft', 'review', 'published'])
      })
    }),
    z.object({
      id: z.string().min(1),
      type: z.literal('agent'),
      position: z.object({ x: z.number(), y: z.number() }),
      title: z.string(),
      selected: z.boolean().optional(),
      dragging: z.boolean().optional(),
      hovered: z.boolean().optional(),
      data: z.object({
        model: z.string().min(1),
        prompt: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().positive().optional(),
        status: z.enum(['idle', 'processing', 'error'])
      })
    })
  ])
}

// Error scenarios for negative testing
export const errorScenarios = {
  invalidNode: {
    missingId: {
      type: 'document',
      position: { x: 100, y: 100 },
      title: 'No ID'
    },
    
    invalidType: {
      id: 'invalid-type',
      type: 'invalid',
      position: { x: 100, y: 100 },
      title: 'Invalid Type'
    },
    
    invalidPosition: {
      id: 'invalid-pos',
      type: 'document',
      position: { x: 'invalid', y: 'invalid' },
      title: 'Invalid Position'
    },
    
    missingData: {
      id: 'missing-data',
      type: 'agent',
      position: { x: 100, y: 100 },
      title: 'Missing Data'
    }
  },
  
  invalidInteractions: {
    dragOutOfBounds: {
      start: { x: 0, y: 0 },
      end: { x: -1000, y: -1000 }
    },
    
    invalidSelection: {
      nodeId: 'non-existent-node'
    }
  }
} as const