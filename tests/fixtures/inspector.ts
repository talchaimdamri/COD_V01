/**
 * Test fixtures for Inspector Panel (Task 9)
 * 
 * Comprehensive test data for inspector panel components, form validation,
 * agent configuration, model selection, and tools configuration.
 */

import { vi } from 'vitest'
import { Agent } from '../../schemas/database/agent'

// === INSPECTOR PANEL LAYOUT FIXTURES ===

export interface InspectorPanelLayout {
  isOpen: boolean
  width: number
  minWidth: number
  maxWidth: number
  position: 'left' | 'right'
  animationDuration: number
  hasBackdrop: boolean
  backdropOpacity: number
  zIndex: number
}

export const baseInspectorLayout: InspectorPanelLayout = {
  isOpen: false,
  width: 400,
  minWidth: 300,
  maxWidth: 600,
  position: 'right',
  animationDuration: 300,
  hasBackdrop: true,
  backdropOpacity: 0.5,
  zIndex: 1000,
}

export const openInspectorLayout: InspectorPanelLayout = {
  ...baseInspectorLayout,
  isOpen: true,
}

export const mobileInspectorLayout: InspectorPanelLayout = {
  ...baseInspectorLayout,
  width: 320,
  minWidth: 280,
}

export const desktopInspectorLayout: InspectorPanelLayout = {
  ...baseInspectorLayout,
  width: 480,
  maxWidth: 800,
}

// === AGENT CONFIGURATION FIXTURES ===

export const baseAgentConfig: Agent = {
  id: 'agent-test-001',
  name: 'Test Agent',
  prompt: 'You are a helpful AI assistant that can analyze documents and provide summaries. Be concise and accurate in your responses.',
  model: 'gpt-4',
  tools: ['web-search', 'file-reader', 'calculator'],
  config: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
  status: 'active',
  createdAt: new Date('2024-08-01T08:00:00.000Z'),
  updatedAt: new Date('2024-08-08T10:00:00.000Z'),
}

export const emptyAgentConfig: Agent = {
  id: '',
  name: '',
  prompt: '',
  model: '',
  tools: [],
  config: undefined,
  status: 'draft',
}

export const complexAgentConfig: Agent = {
  id: 'agent-complex-002',
  name: 'Advanced Document Processor',
  prompt: `You are an advanced document processing agent with the following capabilities:

1. Document Analysis: Analyze structure, content, and metadata
2. Content Extraction: Extract key information, entities, and relationships
3. Summarization: Create concise summaries maintaining important details
4. Classification: Categorize documents based on content and context
5. Validation: Check document integrity and compliance

Always provide detailed explanations for your analysis and maintain accuracy in all responses.`,
  model: 'gpt-4-turbo',
  tools: [
    'web-search',
    'file-reader',
    'pdf-analyzer',
    'image-processor',
    'database-connector',
    'api-caller',
    'code-executor',
    'email-sender',
  ],
  config: {
    temperature: 0.3,
    maxTokens: 4000,
    topP: 0.8,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    systemMessage: 'Focus on accuracy and detailed analysis',
    responseFormat: 'structured',
    enableMemory: true,
    memoryWindowSize: 10,
  },
  status: 'active',
  createdAt: new Date('2024-07-15T12:00:00.000Z'),
  updatedAt: new Date('2024-08-08T15:30:00.000Z'),
}

export const invalidAgentConfig = {
  id: '',
  name: '',
  prompt: 'x'.repeat(5001), // Exceeds max length
  model: '',
  tools: [],
}

// === MODEL SELECTION FIXTURES ===

export interface ModelOption {
  id: string
  name: string
  provider: string
  description: string
  capabilities: string[]
  maxTokens: number
  costPer1k: number
  isAvailable: boolean
  recommendedFor: string[]
  performance: {
    speed: number // 1-5 scale
    quality: number // 1-5 scale
    reasoning: number // 1-5 scale
  }
}

export const availableModels: ModelOption[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Most capable GPT-4 model with advanced reasoning and broad knowledge',
    capabilities: ['text-generation', 'reasoning', 'analysis', 'coding', 'math'],
    maxTokens: 8192,
    costPer1k: 0.03,
    isAvailable: true,
    recommendedFor: ['complex-analysis', 'reasoning', 'creative-writing'],
    performance: { speed: 3, quality: 5, reasoning: 5 },
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Faster and more cost-effective version of GPT-4 with larger context',
    capabilities: ['text-generation', 'reasoning', 'analysis', 'coding', 'math'],
    maxTokens: 128000,
    costPer1k: 0.01,
    isAvailable: true,
    recommendedFor: ['large-documents', 'batch-processing', 'cost-efficiency'],
    performance: { speed: 4, quality: 4, reasoning: 4 },
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient model for most conversational and text processing tasks',
    capabilities: ['text-generation', 'conversation', 'summarization'],
    maxTokens: 16385,
    costPer1k: 0.002,
    isAvailable: true,
    recommendedFor: ['chat', 'simple-tasks', 'high-volume'],
    performance: { speed: 5, quality: 3, reasoning: 3 },
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    description: 'Most powerful Claude model with exceptional reasoning and analysis capabilities',
    capabilities: ['text-generation', 'reasoning', 'analysis', 'coding', 'math'],
    maxTokens: 200000,
    costPer1k: 0.015,
    isAvailable: true,
    recommendedFor: ['complex-reasoning', 'analysis', 'creative-tasks'],
    performance: { speed: 3, quality: 5, reasoning: 5 },
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed for a wide range of tasks',
    capabilities: ['text-generation', 'reasoning', 'analysis', 'coding'],
    maxTokens: 200000,
    costPer1k: 0.003,
    isAvailable: true,
    recommendedFor: ['general-purpose', 'balanced-performance'],
    performance: { speed: 4, quality: 4, reasoning: 4 },
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model optimized for speed and efficiency',
    capabilities: ['text-generation', 'conversation', 'simple-analysis'],
    maxTokens: 200000,
    costPer1k: 0.00025,
    isAvailable: true,
    recommendedFor: ['speed', 'cost-efficiency', 'simple-tasks'],
    performance: { speed: 5, quality: 3, reasoning: 3 },
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Advanced multimodal model with text and vision capabilities',
    capabilities: ['text-generation', 'vision', 'reasoning', 'coding'],
    maxTokens: 30720,
    costPer1k: 0.0005,
    isAvailable: false, // Not available for testing
    recommendedFor: ['multimodal', 'vision-tasks', 'cost-efficiency'],
    performance: { speed: 4, quality: 4, reasoning: 4 },
  },
]

export const selectedModel = availableModels[0] // GPT-4
export const unavailableModel = availableModels[6] // Gemini Pro

// === TOOLS CONFIGURATION FIXTURES ===

export interface ToolOption {
  id: string
  name: string
  description: string
  category: string
  icon: string
  isEnabled: boolean
  isRequired: boolean
  permissions: string[]
  config?: Record<string, any>
  compatibleModels: string[]
  performanceImpact: number // 1-5 scale
}

export const availableTools: ToolOption[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the internet for current information and data',
    category: 'Information',
    icon: 'search',
    isEnabled: false,
    isRequired: false,
    permissions: ['internet-access', 'search-engines'],
    config: { maxResults: 10, timeout: 5000 },
    compatibleModels: ['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet'],
    performanceImpact: 3,
  },
  {
    id: 'file-reader',
    name: 'File Reader',
    description: 'Read and analyze various file formats including text, PDF, and documents',
    category: 'File Processing',
    icon: 'file-text',
    isEnabled: true,
    isRequired: true,
    permissions: ['file-system-access', 'document-parsing'],
    config: { supportedFormats: ['txt', 'pdf', 'docx', 'csv', 'json'] },
    compatibleModels: ['*'], // Compatible with all models
    performanceImpact: 2,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Perform mathematical calculations and numerical operations',
    category: 'Math & Logic',
    icon: 'calculator',
    isEnabled: false,
    isRequired: false,
    permissions: ['computation'],
    config: { precision: 15, scientificNotation: true },
    compatibleModels: ['*'],
    performanceImpact: 1,
  },
  {
    id: 'pdf-analyzer',
    name: 'PDF Analyzer',
    description: 'Advanced PDF analysis including text extraction, structure analysis, and metadata',
    category: 'File Processing',
    icon: 'file',
    isEnabled: false,
    isRequired: false,
    permissions: ['file-system-access', 'pdf-processing'],
    config: { extractImages: true, preserveFormatting: true },
    compatibleModels: ['gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
    performanceImpact: 4,
  },
  {
    id: 'image-processor',
    name: 'Image Processor',
    description: 'Process and analyze images including OCR, object detection, and visual analysis',
    category: 'Vision',
    icon: 'image',
    isEnabled: false,
    isRequired: false,
    permissions: ['image-processing', 'vision-api'],
    config: { ocrEnabled: true, maxImageSize: 10485760 },
    compatibleModels: ['gpt-4', 'gemini-pro'],
    performanceImpact: 5,
  },
  {
    id: 'database-connector',
    name: 'Database Connector',
    description: 'Connect to and query databases including SQL and NoSQL systems',
    category: 'Data',
    icon: 'database',
    isEnabled: false,
    isRequired: false,
    permissions: ['database-access', 'query-execution'],
    config: { supportedTypes: ['postgresql', 'mysql', 'mongodb'], timeout: 30000 },
    compatibleModels: ['gpt-4', 'gpt-4-turbo', 'claude-3-opus'],
    performanceImpact: 3,
  },
  {
    id: 'api-caller',
    name: 'API Caller',
    description: 'Make HTTP requests to external APIs and web services',
    category: 'Integration',
    icon: 'globe',
    isEnabled: false,
    isRequired: false,
    permissions: ['http-requests', 'external-apis'],
    config: { timeout: 10000, maxRetries: 3, rateLimitHandling: true },
    compatibleModels: ['*'],
    performanceImpact: 3,
  },
  {
    id: 'code-executor',
    name: 'Code Executor',
    description: 'Execute code in various programming languages safely in isolated environments',
    category: 'Development',
    icon: 'code',
    isEnabled: false,
    isRequired: false,
    permissions: ['code-execution', 'sandboxed-environment'],
    config: { supportedLanguages: ['python', 'javascript', 'bash'], timeout: 30000 },
    compatibleModels: ['gpt-4', 'claude-3-opus', 'claude-3-sonnet'],
    performanceImpact: 4,
  },
  {
    id: 'email-sender',
    name: 'Email Sender',
    description: 'Send emails and notifications through configured email services',
    category: 'Communication',
    icon: 'mail',
    isEnabled: false,
    isRequired: false,
    permissions: ['email-sending', 'smtp-access'],
    config: { maxRecipientsPerEmail: 50, attachmentSizeLimit: 25165824 },
    compatibleModels: ['*'],
    performanceImpact: 2,
  },
]

export const selectedTools = availableTools.slice(0, 3) // First 3 tools selected
export const requiredTools = availableTools.filter(tool => tool.isRequired)
export const incompatibleTools = availableTools.filter(tool => 
  !tool.compatibleModels.includes('*') && !tool.compatibleModels.includes('gpt-3.5-turbo')
)

// === FORM STATE FIXTURES ===

export interface FormState {
  values: {
    name: string
    prompt: string
    model: string
    tools: string[]
    description?: string
    config?: Record<string, any>
  }
  errors: Record<string, string>
  touched: Record<string, boolean>
  isDirty: boolean
  isValid: boolean
  isSubmitting: boolean
}

export const initialFormState: FormState = {
  values: {
    name: '',
    prompt: '',
    model: '',
    tools: [],
    description: '',
    config: {},
  },
  errors: {},
  touched: {},
  isDirty: false,
  isValid: false,
  isSubmitting: false,
}

export const validFormState: FormState = {
  values: {
    name: 'Test Agent',
    prompt: 'You are a helpful assistant.',
    model: 'gpt-4',
    tools: ['file-reader', 'calculator'],
    description: 'A test agent for validation',
    config: { temperature: 0.7 },
  },
  errors: {},
  touched: { name: true, prompt: true, model: true },
  isDirty: true,
  isValid: true,
  isSubmitting: false,
}

export const invalidFormState: FormState = {
  values: {
    name: '', // Required field missing
    prompt: 'x'.repeat(5001), // Exceeds max length
    model: 'invalid-model',
    tools: ['invalid-tool'],
  },
  errors: {
    name: 'Agent name is required',
    prompt: 'Prompt cannot exceed 5000 characters',
    model: 'Selected model is not available',
    tools: 'Some selected tools are not available',
  },
  touched: { name: true, prompt: true, model: true, tools: true },
  isDirty: true,
  isValid: false,
  isSubmitting: false,
}

// === AUTO-GENERATE PROMPT FIXTURES ===

export interface PromptGenerationRequest {
  agentName: string
  agentRole: string
  selectedTools: string[]
  additionalContext?: string
  promptStyle: 'concise' | 'detailed' | 'technical'
  includeExamples: boolean
}

export const basePromptRequest: PromptGenerationRequest = {
  agentName: 'Document Processor',
  agentRole: 'Document analysis and processing',
  selectedTools: ['file-reader', 'pdf-analyzer'],
  promptStyle: 'detailed',
  includeExamples: true,
}

export const generatedPromptResponse = {
  success: true,
  prompt: `You are a Document Processor, a specialized AI agent focused on document analysis and processing.

Your primary responsibilities include:
- Reading and parsing various document formats
- Extracting key information and metadata
- Analyzing document structure and content
- Providing detailed summaries and insights

Available Tools:
- File Reader: For accessing and reading document content
- PDF Analyzer: For advanced PDF processing and analysis

Guidelines:
1. Always be thorough and accurate in your analysis
2. Provide structured outputs when possible
3. Highlight important findings and potential issues
4. Maintain document confidentiality and security

Example Usage:
When processing a document, first read the content using the File Reader, then apply the PDF Analyzer for detailed structural analysis if it's a PDF format.`,
  metadata: {
    wordCount: 145,
    estimatedTokens: 180,
    complexity: 'medium',
    generationTime: 1250,
  },
}

// === RESPONSIVE DESIGN FIXTURES ===

export interface ViewportFixture {
  name: string
  width: number
  height: number
  expectedLayout: {
    panelWidth: number
    showLabels: boolean
    stackedLayout: boolean
    compactMode: boolean
  }
}

export const viewportFixtures: ViewportFixture[] = [
  {
    name: 'mobile-portrait',
    width: 375,
    height: 667,
    expectedLayout: {
      panelWidth: 320,
      showLabels: false,
      stackedLayout: true,
      compactMode: true,
    },
  },
  {
    name: 'mobile-landscape',
    width: 667,
    height: 375,
    expectedLayout: {
      panelWidth: 350,
      showLabels: true,
      stackedLayout: false,
      compactMode: true,
    },
  },
  {
    name: 'tablet-portrait',
    width: 768,
    height: 1024,
    expectedLayout: {
      panelWidth: 400,
      showLabels: true,
      stackedLayout: false,
      compactMode: false,
    },
  },
  {
    name: 'tablet-landscape',
    width: 1024,
    height: 768,
    expectedLayout: {
      panelWidth: 450,
      showLabels: true,
      stackedLayout: false,
      compactMode: false,
    },
  },
  {
    name: 'desktop',
    width: 1440,
    height: 900,
    expectedLayout: {
      panelWidth: 480,
      showLabels: true,
      stackedLayout: false,
      compactMode: false,
    },
  },
  {
    name: 'large-desktop',
    width: 1920,
    height: 1080,
    expectedLayout: {
      panelWidth: 600,
      showLabels: true,
      stackedLayout: false,
      compactMode: false,
    },
  },
]

// === ANIMATION FIXTURES ===

export interface AnimationState {
  isAnimating: boolean
  animationType: 'slide-in' | 'slide-out' | 'fade' | 'scale'
  duration: number
  easing: string
  progress: number
}

export const baseAnimationState: AnimationState = {
  isAnimating: false,
  animationType: 'slide-in',
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  progress: 0,
}

export const slideInAnimation: AnimationState = {
  ...baseAnimationState,
  isAnimating: true,
  animationType: 'slide-in',
  progress: 0.5,
}

export const slideOutAnimation: AnimationState = {
  ...baseAnimationState,
  isAnimating: true,
  animationType: 'slide-out',
  progress: 0.75,
}

// === MOCK CALLBACKS ===

export const mockInspectorCallbacks = {
  onOpen: vi.fn(),
  onClose: vi.fn(),
  onBackdropClick: vi.fn(),
  onResize: vi.fn(),
  onFormSubmit: vi.fn(),
  onFormReset: vi.fn(),
  onFormChange: vi.fn(),
  onModelChange: vi.fn(),
  onToolsChange: vi.fn(),
  onPromptGenerate: vi.fn(),
  onValidation: vi.fn(),
  onSave: vi.fn(),
  onCancel: vi.fn(),
}

// === VALIDATION FIXTURES ===

export const validationScenarios = {
  emptyName: {
    input: { ...baseAgentConfig, name: '' },
    expectedError: 'Agent name cannot be empty',
  },
  longName: {
    input: { ...baseAgentConfig, name: 'x'.repeat(256) },
    expectedError: 'Agent name cannot exceed 255 characters',
  },
  emptyPrompt: {
    input: { ...baseAgentConfig, prompt: '' },
    expectedError: 'Agent prompt cannot be empty',
  },
  longPrompt: {
    input: { ...baseAgentConfig, prompt: 'x'.repeat(5001) },
    expectedError: 'Agent prompt cannot exceed 5000 characters',
  },
  emptyModel: {
    input: { ...baseAgentConfig, model: '' },
    expectedError: 'Model identifier cannot be empty',
  },
  invalidModel: {
    input: { ...baseAgentConfig, model: 'invalid-model' },
    expectedError: 'Selected model is not available',
  },
  invalidTool: {
    input: { ...baseAgentConfig, tools: ['invalid-tool'] },
    expectedError: 'Some selected tools are not available',
  },
}

// === PERFORMANCE BENCHMARKS ===

export const performanceBenchmarks = {
  panelAnimation: {
    expectedSlideInTime: 300, // ms
    expectedSlideOutTime: 300, // ms
    maxFrameDrops: 0,
  },
  formValidation: {
    maxValidationTime: 50, // ms for real-time validation
    maxDebounceTime: 300, // ms for debounced validation
  },
  modelSelection: {
    maxDropdownRenderTime: 100, // ms
    maxSearchFilterTime: 50, // ms
  },
  toolsConfiguration: {
    maxToolsRenderTime: 150, // ms for all tools
    maxToggleResponseTime: 20, // ms per tool toggle
  },
  promptGeneration: {
    maxGenerationTime: 5000, // ms for API call
    expectedMinLength: 100, // characters
    expectedMaxLength: 2000, // characters
  },
}

// === ERROR SCENARIOS ===

export const errorScenarios = {
  networkError: {
    type: 'network',
    message: 'Failed to connect to the server',
    code: 'NETWORK_ERROR',
    retryable: true,
  },
  validationError: {
    type: 'validation',
    message: 'Form data is invalid',
    code: 'VALIDATION_ERROR',
    retryable: false,
    fields: ['name', 'prompt'],
  },
  modelUnavailable: {
    type: 'model',
    message: 'Selected model is temporarily unavailable',
    code: 'MODEL_UNAVAILABLE',
    retryable: true,
  },
  toolCompatibility: {
    type: 'tool',
    message: 'Selected tools are not compatible with the chosen model',
    code: 'TOOL_COMPATIBILITY',
    retryable: false,
    incompatibleTools: ['image-processor'],
  },
  promptGeneration: {
    type: 'generation',
    message: 'Failed to generate prompt',
    code: 'GENERATION_ERROR',
    retryable: true,
  },
}