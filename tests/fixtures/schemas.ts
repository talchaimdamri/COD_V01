/**
 * Centralized test fixtures for schema validation tests
 *
 * This file contains reusable test data objects that can be imported
 * and customized with spread operators to avoid duplication across tests.
 */

// Chain fixtures
export const baseChain = {
  id: 'chain-123',
  name: 'Test Chain',
  nodes: [
    {
      id: 'node-1',
      type: 'document',
      position: { x: 100, y: 200 },
      data: { title: 'Input Document' },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'default',
    },
  ],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

export const emptyChain = {
  id: 'chain-empty',
  name: 'Empty Chain',
  nodes: [],
  edges: [],
}

export const complexChain = {
  ...baseChain,
  id: 'chain-complex',
  name: 'Complex Chain',
  nodes: [
    {
      id: 'node-1',
      type: 'document',
      position: { x: 0, y: 0 },
      data: {
        title: 'Complex Document',
        content: 'Some content',
        metadata: {
          author: 'Test Author',
          tags: ['tag1', 'tag2'],
        },
      },
    },
    {
      id: 'node-2',
      type: 'agent',
      position: { x: 200, y: 0 },
      data: {
        agentId: 'agent-123',
        config: { temperature: 0.7 },
      },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'data-flow',
    },
  ],
}

// Document fixtures
export const baseDocument = {
  id: 'doc-123',
  title: 'Test Document',
  content: 'This is test document content.',
  metadata: {
    author: 'Test Author',
    tags: ['test', 'document'],
    version: 1,
    lastModified: new Date('2024-01-01T00:00:00.000Z'),
  },
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

export const minimalDocument = {
  id: 'doc-minimal',
  title: 'Minimal Document',
  content: 'Basic content',
  metadata: {},
}

export const complexDocument = {
  ...baseDocument,
  id: 'doc-complex',
  title: 'Complex Document with Rich Metadata',
  content: 'A'.repeat(1000), // Large content
  metadata: {
    author: {
      name: 'John Doe',
      email: 'john@example.com',
      profile: {
        bio: 'Software developer',
        skills: ['JavaScript', 'TypeScript'],
      },
    },
    document: {
      type: 'technical',
      classification: 'public',
      approval: {
        status: 'approved',
        approver: 'Jane Smith',
        date: new Date('2024-01-01T00:00:00.000Z'),
      },
    },
    tags: ['technical', 'approved', 'public'],
    version: 2,
    wordCount: 1000,
    language: 'en',
    references: ['ref1', 'ref2', 'ref3'],
  },
}

// Agent fixtures
export const baseAgent = {
  id: 'agent-123',
  name: 'Test Agent',
  prompt:
    'You are a test agent. Process the input and provide helpful responses.',
  model: 'gpt-4',
  tools: ['text-analyzer', 'summarizer'],
  config: {
    temperature: 0.7,
    maxTokens: 1000,
    timeout: 30000,
  },
  status: 'active',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
}

export const minimalAgent = {
  id: 'agent-minimal',
  name: 'Minimal Agent',
  prompt: 'Basic prompt',
  model: 'gpt-3.5-turbo',
  tools: [],
}

export const complexAgent = {
  ...baseAgent,
  id: 'agent-complex',
  name: 'Complex Document Processor',
  prompt:
    'You are an advanced document processing agent with multiple capabilities. Analyze, extract, and transform document content according to specified requirements.',
  model: 'gpt-4',
  tools: [
    'text-analyzer',
    'summarizer',
    'keyword-extractor',
    'sentiment-analyzer',
    'translator',
  ],
  config: {
    temperature: 0.8,
    maxTokens: 2000,
    timeout: 60000,
    retries: 3,
    systemMessage: 'You are a helpful assistant',
    stopSequences: ['\n\n', '###'],
    presencePenalty: 0.1,
    frequencyPenalty: 0.2,
    customSettings: {
      useCache: true,
      debugMode: false,
      outputFormat: 'json',
    },
  },
}

// Event fixtures for integration testing
export const baseEvent = {
  type: 'ADD_NODE',
  payload: {
    nodeId: 'node-123',
    nodeType: 'document',
    position: { x: 100, y: 200 },
    data: { title: 'New Document' },
  },
  timestamp: new Date('2024-01-01T00:00:00.000Z'),
  id: 'event-123',
  userId: 'user-456',
}

// Additional event fixtures for comprehensive testing
export const createEventRequest = {
  type: 'CREATE_CHAIN',
  payload: {
    chainId: 'chain-new',
    name: 'New Chain',
    description: 'Test chain creation',
  },
  userId: 'user-creator',
}

export const updateEventRequest = {
  type: 'UPDATE_NODE',
  payload: {
    nodeId: 'node-456',
    changes: {
      position: { x: 150, y: 300 },
      data: { title: 'Updated Document' },
    },
  },
  timestamp: new Date('2024-01-02T10:30:00.000Z'),
  userId: 'user-editor',
}

export const chainEvents = [
  {
    type: 'CHAIN_CREATE',
    payload: { chainId: 'chain-1', name: 'Test Chain 1' },
    timestamp: new Date('2024-01-01T09:00:00.000Z'),
    userId: 'user-1',
    id: 'chain-event-1',
  },
  {
    type: 'CHAIN_UPDATE',
    payload: { chainId: 'chain-1', name: 'Updated Chain 1' },
    timestamp: new Date('2024-01-01T10:00:00.000Z'),
    userId: 'user-1',
    id: 'chain-event-2',
  },
  {
    type: 'CHAIN_DELETE',
    payload: { chainId: 'chain-1' },
    timestamp: new Date('2024-01-01T11:00:00.000Z'),
    userId: 'user-1',
    id: 'chain-event-3',
  },
]

export const nodeEvents = [
  {
    type: 'NODE_ADD',
    payload: {
      nodeId: 'node-1',
      nodeType: 'document',
      position: { x: 0, y: 0 },
    },
    timestamp: new Date('2024-01-01T12:00:00.000Z'),
    userId: 'user-2',
    id: 'node-event-1',
  },
  {
    type: 'NODE_MOVE',
    payload: {
      nodeId: 'node-1',
      fromPosition: { x: 0, y: 0 },
      toPosition: { x: 100, y: 100 },
    },
    timestamp: new Date('2024-01-01T13:00:00.000Z'),
    userId: 'user-2',
    id: 'node-event-2',
  },
  {
    type: 'NODE_DELETE',
    payload: { nodeId: 'node-1' },
    timestamp: new Date('2024-01-01T14:00:00.000Z'),
    userId: 'user-2',
    id: 'node-event-3',
  },
]

export const minimalEvent = {
  type: 'SAVE_CHAIN',
  payload: {},
  timestamp: new Date('2024-01-01T00:00:00.000Z'),
}

export const complexEvent = {
  ...baseEvent,
  type: 'UPDATE_NODE',
  payload: {
    nodeId: 'node-complex',
    nodeType: 'agent',
    position: { x: 250, y: 350 },
    data: {
      agentConfig: {
        model: 'gpt-4',
        temperature: 0.7,
        tools: ['analyzer', 'summarizer'],
        systemPrompt: 'You are a helpful assistant',
      },
      metadata: {
        created: new Date('2024-01-01T00:00:00.000Z'),
        version: 1,
        tags: ['important', 'processing'],
      },
    },
    previousState: {
      position: { x: 200, y: 300 },
      data: { title: 'Old Title' },
    },
  },
}

// Event types for testing various event scenarios
export const eventTypes = [
  'ADD_NODE',
  'DELETE_NODE',
  'MOVE_NODE',
  'UPDATE_NODE',
  'ADD_EDGE',
  'DELETE_EDGE',
  'UPDATE_EDGE',
  'SAVE_CHAIN',
  'LOAD_CHAIN',
  'UNDO',
  'REDO',
  'RUN_AGENT',
  'AGENT_COMPLETE',
  'AGENT_ERROR',
] as const

// Model types for testing various AI models
export const modelTypes = [
  'gpt-4',
  'gpt-3.5-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'gemini-pro',
  'custom-model-v1',
] as const

// Common test data generators
export const generateLongString = (length: number): string => 'A'.repeat(length)

export const generateLargeArray = (
  size: number
): Array<{ id: string; data: string }> =>
  Array.from({ length: size }, (_, i) => ({
    id: `item-${i}`,
    data: `data-${i}`,
  }))

export const generateNestedObject = (depth: number): any => {
  if (depth <= 0) return { value: 'deep-value', array: [1, 2, 3] }
  return { [`level${depth}`]: generateNestedObject(depth - 1) }
}

// Invalid data fixtures for negative tests
export const invalidChainData = {
  missingId: {
    name: 'Test Chain',
    nodes: [],
    edges: [],
  },
  missingName: {
    id: 'chain-123',
    nodes: [],
    edges: [],
  },
  emptyId: {
    id: '',
    name: 'Test Chain',
    nodes: [],
    edges: [],
  },
  wrongTypeId: {
    id: 123,
    name: 'Test Chain',
    nodes: [],
    edges: [],
  },
  wrongTypeNodes: {
    id: 'chain-123',
    name: 'Test Chain',
    nodes: 'not-an-array',
    edges: [],
  },
}

export const invalidDocumentData = {
  missingId: {
    title: 'Test Document',
    content: 'Content',
    metadata: {},
  },
  missingTitle: {
    id: 'doc-123',
    content: 'Content',
    metadata: {},
  },
  emptyTitle: {
    id: 'doc-123',
    title: '',
    content: 'Content',
    metadata: {},
  },
  wrongTypeMetadata: {
    id: 'doc-123',
    title: 'Test Document',
    content: 'Content',
    metadata: 'not-an-object',
  },
}

export const invalidAgentData = {
  missingId: {
    name: 'Test Agent',
    prompt: 'Test prompt',
    model: 'gpt-4',
    tools: [],
  },
  missingPrompt: {
    id: 'agent-123',
    name: 'Test Agent',
    model: 'gpt-4',
    tools: [],
  },
  emptyPrompt: {
    id: 'agent-123',
    name: 'Test Agent',
    prompt: '',
    model: 'gpt-4',
    tools: [],
  },
  wrongTypeTools: {
    id: 'agent-123',
    name: 'Test Agent',
    prompt: 'Test prompt',
    model: 'gpt-4',
    tools: 'not-an-array',
  },
}

export const invalidEventData = {
  missingType: {
    payload: { data: 'test' },
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
  },
  missingPayload: {
    type: 'ADD_NODE',
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
  },
  emptyType: {
    type: '',
    payload: { data: 'test' },
    timestamp: new Date('2024-01-01T00:00:00.000Z'),
  },
  wrongTypeTimestamp: {
    type: 'ADD_NODE',
    payload: { data: 'test' },
    timestamp: '2024-01-01T00:00:00.000Z',
  },
}
