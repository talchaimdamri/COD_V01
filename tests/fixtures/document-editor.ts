/**
 * Document Editor Modal Test Fixtures
 * Test ID: FIXTURE-DOC-EDITOR
 * 
 * Centralized test data and utilities for TipTap Document Editor Modal tests.
 * These fixtures support comprehensive testing of the document editor functionality.
 */

// Document Editor Modal configuration constants
export const DOCUMENT_EDITOR_CONFIG = {
  modal: {
    width: '70%',
    maxWidth: '90vw',
    minWidth: '600px',
    height: '80vh',
    maxHeight: '90vh',
    minHeight: '400px',
  },
  
  editor: {
    minHeight: '200px',
    defaultContent: '',
    extensions: ['StarterKit', 'Heading', 'BulletList', 'OrderedList', 'CodeBlock'],
  },
  
  toolbar: {
    groups: ['formatting', 'lists', 'blocks', 'history', 'actions'],
    buttons: [
      'bold', 'italic', 'underline', 'strike',
      'heading1', 'heading2', 'heading3',
      'bulletList', 'orderedList',
      'codeBlock', 'blockquote',
      'undo', 'redo',
      'askAgent', 'saveVersion'
    ],
  },
  
  rails: {
    upstream: {
      maxVisible: 5,
      itemHeight: 40,
    },
    downstream: {
      maxVisible: 5, 
      itemHeight: 40,
    },
  },
} as const

// Test selectors for consistent element targeting
export const DOCUMENT_EDITOR_SELECTORS = {
  // Modal elements
  modal: '[data-testid="document-editor-modal"]',
  modalOverlay: '[data-testid="modal-overlay"]',
  modalContent: '[data-testid="modal-content"]',
  modalHeader: '[data-testid="modal-header"]',
  modalBody: '[data-testid="modal-body"]',
  modalFooter: '[data-testid="modal-footer"]',
  
  // Modal controls
  closeButton: '[data-testid="close-modal-button"]',
  maximizeButton: '[data-testid="maximize-modal-button"]',
  restoreButton: '[data-testid="restore-modal-button"]',
  resizeHandle: '[data-testid="resize-handle"]',
  
  // Editor container
  editorContainer: '[data-testid="tiptap-editor-container"]',
  editorContent: '[data-testid="tiptap-editor-content"]',
  editorProseMirror: '.ProseMirror',
  
  // Toolbar elements
  toolbar: '[data-testid="editor-toolbar"]',
  toolbarGroup: '[data-testid="toolbar-group"]',
  
  // Formatting buttons
  boldButton: '[data-testid="toolbar-bold"]',
  italicButton: '[data-testid="toolbar-italic"]',
  underlineButton: '[data-testid="toolbar-underline"]',
  strikeButton: '[data-testid="toolbar-strike"]',
  
  // Heading buttons
  heading1Button: '[data-testid="toolbar-h1"]',
  heading2Button: '[data-testid="toolbar-h2"]',
  heading3Button: '[data-testid="toolbar-h3"]',
  
  // List buttons
  bulletListButton: '[data-testid="toolbar-bullet-list"]',
  orderedListButton: '[data-testid="toolbar-ordered-list"]',
  
  // Block buttons
  codeBlockButton: '[data-testid="toolbar-code-block"]',
  blockquoteButton: '[data-testid="toolbar-blockquote"]',
  
  // History buttons
  undoButton: '[data-testid="toolbar-undo"]',
  redoButton: '[data-testid="toolbar-redo"]',
  
  // Action buttons
  askAgentButton: '[data-testid="toolbar-ask-agent"]',
  saveVersionButton: '[data-testid="toolbar-save-version"]',
  
  // Document rails
  upstreamRail: '[data-testid="upstream-rail"]',
  downstreamRail: '[data-testid="downstream-rail"]',
  railItem: '[data-testid="rail-item"]',
  railItemTitle: '[data-testid="rail-item-title"]',
  railItemPreview: '[data-testid="rail-item-preview"]',
  railItemConnect: '[data-testid="rail-item-connect"]',
  
  // Version controls
  versionHistory: '[data-testid="version-history"]',
  versionHistoryPanel: '[data-testid="version-history-panel"]',
  versionItem: '[data-testid="version-item"]',
  versionRestore: '[data-testid="version-restore"]',
  versionCompare: '[data-testid="version-compare"]',
  versionDiff: '[data-testid="version-diff"]',
  versionTimestamp: '[data-testid="version-timestamp"]',
  versionDescription: '[data-testid="version-description"]',
  versionAuthor: '[data-testid="version-author"]',
  versionWordCount: '[data-testid="version-word-count"]',
  versionCharCount: '[data-testid="version-char-count"]',
  versionToggle: '[data-testid="version-toggle"]',
  diffViewer: '[data-testid="diff-viewer"]',
  diffSideBySide: '[data-testid="diff-side-by-side"]',
  diffUnified: '[data-testid="diff-unified"]',
  
  // Status indicators
  savingIndicator: '[data-testid="saving-indicator"]',
  savedIndicator: '[data-testid="saved-indicator"]',
  errorIndicator: '[data-testid="error-indicator"]',
  
  // Content elements
  paragraph: 'p',
  heading1: 'h1',
  heading2: 'h2', 
  heading3: 'h3',
  bulletList: 'ul',
  orderedList: 'ol',
  listItem: 'li',
  codeBlock: 'pre code',
  blockquote: 'blockquote',
} as const

// Mock document data for testing
export const mockDocuments = {
  emptyDocument: {
    id: 'doc-empty',
    title: 'Empty Document',
    content: '',
    version: 1,
    createdAt: new Date('2024-01-01T12:00:00.000Z'),
    updatedAt: new Date('2024-01-01T12:00:00.000Z'),
    upstream: [],
    downstream: [],
  },
  
  simpleDocument: {
    id: 'doc-simple',
    title: 'Simple Document',
    content: '<p>This is a simple document with <strong>bold</strong> and <em>italic</em> text.</p>',
    version: 1,
    createdAt: new Date('2024-01-01T12:00:00.000Z'),
    updatedAt: new Date('2024-01-01T12:01:00.000Z'),
    upstream: [],
    downstream: [],
  },
  
  complexDocument: {
    id: 'doc-complex',
    title: 'Complex Document',
    content: `
      <h1>Main Heading</h1>
      <p>Introduction paragraph with <strong>bold</strong> text.</p>
      <h2>Section 1</h2>
      <ul>
        <li>First bullet point</li>
        <li>Second bullet point with <em>emphasis</em></li>
      </ul>
      <h3>Subsection</h3>
      <ol>
        <li>First numbered item</li>
        <li>Second numbered item</li>
      </ol>
      <pre><code>const example = 'code block';</code></pre>
      <blockquote>This is a blockquote</blockquote>
    `,
    version: 3,
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
    updatedAt: new Date('2024-01-01T14:30:00.000Z'),
    upstream: ['doc-source-1', 'doc-source-2'],
    downstream: ['doc-output-1'],
  },
  
  documentWithConnections: {
    id: 'doc-connected',
    title: 'Connected Document',
    content: '<p>Document with upstream and downstream connections.</p>',
    version: 2,
    createdAt: new Date('2024-01-01T11:00:00.000Z'),
    updatedAt: new Date('2024-01-01T13:15:00.000Z'),
    upstream: ['doc-input-1', 'doc-input-2', 'doc-input-3'],
    downstream: ['doc-output-1', 'doc-output-2'],
  },
} as const

// Mock version history data
export const mockVersionHistory = {
  versions: [
    {
      id: 'version-1',
      documentId: 'doc-complex',
      version: 1,
      content: '<p>Initial version</p>',
      timestamp: new Date('2024-01-01T10:00:00.000Z'),
      author: 'test-user',
      description: 'Initial document creation',
      wordCount: 2,
      charCount: 25,
    },
    {
      id: 'version-2', 
      documentId: 'doc-complex',
      version: 2,
      content: '<h1>Main Heading</h1><p>Added heading</p>',
      timestamp: new Date('2024-01-01T12:00:00.000Z'),
      author: 'test-user',
      description: 'Added main heading structure',
      wordCount: 4,
      charCount: 48,
    },
    {
      id: 'version-3',
      documentId: 'doc-complex', 
      version: 3,
      content: mockDocuments.complexDocument.content,
      timestamp: new Date('2024-01-01T14:30:00.000Z'),
      author: 'test-user',
      description: 'Added lists and code blocks',
      wordCount: 25,
      charCount: 450,
    },
    {
      id: 'version-4',
      documentId: 'doc-complex',
      version: 4,
      content: `${mockDocuments.complexDocument.content}<p><strong>Bold conclusion</strong> with final thoughts.</p>`,
      timestamp: new Date('2024-01-01T16:15:00.000Z'),
      author: 'test-user',
      description: 'Added conclusion paragraph',
      wordCount: 30,
      charCount: 510,
    },
  ],
} as const

// Extended version history for performance testing
export const mockLargeVersionHistory = {
  versions: Array.from({ length: 150 }, (_, i) => ({
    id: `version-${i + 1}`,
    documentId: 'doc-performance-test',
    version: i + 1,
    content: `<p>Version ${i + 1} content with some changes and modifications to test performance.</p>`.repeat(Math.floor(i / 10) + 1),
    timestamp: new Date(Date.now() - (150 - i) * 60000), // 1 minute intervals
    author: i % 3 === 0 ? 'test-user-1' : i % 3 === 1 ? 'test-user-2' : 'test-user-3',
    description: `Version ${i + 1} - ${i % 5 === 0 ? 'Major update' : i % 3 === 0 ? 'Bug fix' : 'Minor changes'}`,
    wordCount: 10 + i * 2,
    charCount: 80 + i * 15,
  })),
} as const

// Version diff test data
export const mockVersionDiffs = {
  simpleTextChange: {
    from: '<p>Hello world</p>',
    to: '<p>Hello beautiful world</p>',
    expectedDiff: {
      additions: ['beautiful '],
      deletions: [],
      changes: [
        { type: 'unchanged', content: 'Hello ' },
        { type: 'addition', content: 'beautiful ' },
        { type: 'unchanged', content: 'world' },
      ],
    },
  },
  
  formattingChange: {
    from: '<p>Simple text</p>',
    to: '<p><strong>Simple</strong> <em>text</em></p>',
    expectedDiff: {
      additions: ['<strong>', '</strong>', '<em>', '</em>'],
      deletions: [],
      changes: [
        { type: 'addition', content: '<strong>' },
        { type: 'unchanged', content: 'Simple' },
        { type: 'addition', content: '</strong>' },
        { type: 'unchanged', content: ' ' },
        { type: 'addition', content: '<em>' },
        { type: 'unchanged', content: 'text' },
        { type: 'addition', content: '</em>' },
      ],
    },
  },
  
  structuralChange: {
    from: '<p>Single paragraph</p>',
    to: '<h1>Main Title</h1><p>Content paragraph</p>',
    expectedDiff: {
      additions: ['<h1>Main Title</h1>', '<p>Content paragraph</p>'],
      deletions: ['<p>Single paragraph</p>'],
      changes: [
        { type: 'deletion', content: '<p>Single paragraph</p>' },
        { type: 'addition', content: '<h1>Main Title</h1>' },
        { type: 'addition', content: '<p>Content paragraph</p>' },
      ],
    },
  },
  
  complexChange: {
    from: '<h1>Old Title</h1><p>First paragraph</p><ul><li>Item 1</li></ul>',
    to: '<h1>New Title</h1><p>Updated first paragraph</p><p>Second paragraph</p><ul><li>Item 1</li><li>Item 2</li></ul>',
    expectedDiff: {
      additions: ['New ', 'Updated ', '<p>Second paragraph</p>', '<li>Item 2</li>'],
      deletions: ['Old '],
      changes: [
        { type: 'unchanged', content: '<h1>' },
        { type: 'deletion', content: 'Old ' },
        { type: 'addition', content: 'New ' },
        { type: 'unchanged', content: 'Title</h1>' },
        { type: 'unchanged', content: '<p>' },
        { type: 'addition', content: 'Updated ' },
        { type: 'unchanged', content: 'first paragraph</p>' },
        { type: 'addition', content: '<p>Second paragraph</p>' },
        { type: 'unchanged', content: '<ul><li>Item 1</li>' },
        { type: 'addition', content: '<li>Item 2</li>' },
        { type: 'unchanged', content: '</ul>' },
      ],
    },
  },
} as const

// Mock rail connection data
export const mockRailConnections = {
  upstream: [
    {
      id: 'doc-input-1',
      title: 'Source Document 1',
      type: 'document',
      preview: 'This is the first source document that feeds into...',
      lastModified: new Date('2024-01-01T09:00:00.000Z'),
    },
    {
      id: 'doc-input-2',
      title: 'Agent Analysis',
      type: 'agent',
      preview: 'Analysis results from AI agent processing...',
      lastModified: new Date('2024-01-01T10:30:00.000Z'),
    },
    {
      id: 'doc-input-3',
      title: 'Data Extract',
      type: 'document',
      preview: 'Extracted data points for processing...',
      lastModified: new Date('2024-01-01T11:15:00.000Z'),
    },
  ],
  
  downstream: [
    {
      id: 'doc-output-1',
      title: 'Summary Report',
      type: 'document',
      preview: 'Generated summary based on this document...',
      lastModified: new Date('2024-01-01T15:00:00.000Z'),
    },
    {
      id: 'doc-output-2',
      title: 'Analysis Agent',
      type: 'agent',
      preview: 'Agent configured to analyze this content...',
      lastModified: new Date('2024-01-01T16:30:00.000Z'),
    },
  ],
} as const

// Editor content test data
export const editorTestContent = {
  plainText: 'This is plain text content.',
  
  boldText: '<strong>This text is bold.</strong>',
  
  italicText: '<em>This text is italic.</em>',
  
  underlineText: '<u>This text is underlined.</u>',
  
  strikeText: '<s>This text is struck through.</s>',
  
  combinedFormatting: '<strong><em><u>Bold, italic, and underlined text.</u></em></strong>',
  
  headings: {
    h1: '<h1>Heading Level 1</h1>',
    h2: '<h2>Heading Level 2</h2>',
    h3: '<h3>Heading Level 3</h3>',
  },
  
  lists: {
    bulletList: '<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>',
    orderedList: '<ol><li>First item</li><li>Second item</li><li>Third item</li></ol>',
    nestedList: '<ul><li>Item 1<ul><li>Nested item</li></ul></li><li>Item 2</li></ul>',
  },
  
  blocks: {
    codeBlock: '<pre><code>const example = "Hello World";\nconsole.log(example);</code></pre>',
    blockquote: '<blockquote><p>This is a quoted text block.</p></blockquote>',
  },
  
  mixedContent: `
    <h1>Document Title</h1>
    <p>This is an <strong>example</strong> document with <em>various</em> formatting.</p>
    <h2>Features</h2>
    <ul>
      <li><strong>Bold text</strong> support</li>
      <li><em>Italic text</em> support</li>
      <li><u>Underlined text</u> support</li>
    </ul>
    <h3>Code Example</h3>
    <pre><code>function hello() {
  console.log("Hello World");
}</code></pre>
    <blockquote>
      <p>This is a quote about the importance of documentation.</p>
    </blockquote>
  `,
} as const

// Event sourcing test data for document changes
export const mockDocumentEvents = {
  contentChange: {
    type: 'DOCUMENT_CONTENT_CHANGED',
    payload: {
      documentId: 'doc-test',
      previousContent: '<p>Old content</p>',
      newContent: '<p>New content</p>',
      changeType: 'edit',
      selection: { from: 0, to: 11 },
    },
    timestamp: new Date('2024-01-01T12:00:00.000Z'),
    userId: 'test-user',
  },
  
  formatApplied: {
    type: 'DOCUMENT_FORMAT_APPLIED',
    payload: {
      documentId: 'doc-test',
      formatType: 'bold',
      selection: { from: 5, to: 10 },
      content: 'text',
    },
    timestamp: new Date('2024-01-01T12:01:00.000Z'),
    userId: 'test-user',
  },
  
  versionSaved: {
    type: 'DOCUMENT_VERSION_SAVED',
    payload: {
      documentId: 'doc-test',
      versionId: 'version-2',
      versionNumber: 2,
      content: '<p>Saved content</p>',
      description: 'Manual save',
    },
    timestamp: new Date('2024-01-01T12:02:00.000Z'),
    userId: 'test-user',
  },
  
  connectionAdded: {
    type: 'DOCUMENT_CONNECTION_ADDED',
    payload: {
      documentId: 'doc-test',
      connectionId: 'doc-source',
      connectionType: 'upstream',
      title: 'Source Document',
    },
    timestamp: new Date('2024-01-01T12:03:00.000Z'),
    userId: 'test-user',
  },
} as const

// Keyboard shortcuts for editor testing
export const editorKeyboardShortcuts = {
  formatting: {
    bold: 'Control+b',
    italic: 'Control+i',
    underline: 'Control+u',
    strike: 'Control+Shift+x',
  },
  
  headings: {
    h1: 'Control+Alt+1',
    h2: 'Control+Alt+2',
    h3: 'Control+Alt+3',
  },
  
  lists: {
    bulletList: 'Control+Shift+8',
    orderedList: 'Control+Shift+7',
  },
  
  blocks: {
    codeBlock: 'Control+Alt+c',
    blockquote: 'Control+Shift+b',
  },
  
  history: {
    undo: 'Control+z',
    redo: 'Control+y',
  },
  
  custom: {
    askAgent: 'Control+Shift+a',
    saveVersion: 'Control+s',
  },
  
  modal: {
    close: 'Escape',
    maximize: 'F11',
  },
} as const

// Performance thresholds specific to document editor
export const editorPerformanceThresholds = {
  initialization: 500,    // Editor initialization time (ms)
  contentLoad: 200,       // Content loading time (ms)
  typing: 16,             // Typing response time (ms) - 60fps
  formatting: 100,        // Format application time (ms)
  modalOpen: 300,         // Modal opening animation (ms)
  modalResize: 200,       // Modal resize time (ms)
  save: 1000,             // Save operation time (ms)
  railLoad: 400,          // Rail content loading (ms)
  versionHistoryLoad: 800, // Version history panel loading (ms)
  versionRestore: 600,    // Version restoration time (ms)
  undoRedo: 100,          // Undo/redo operation time (ms)
  diffCalculation: 300,   // Diff calculation time (ms)
  largeHistoryRender: 1500, // Large version history rendering (ms)
} as const

// Modal state configurations
export const modalStates = {
  default: {
    width: '70%',
    height: '80vh',
    maximized: false,
    position: 'center',
  },
  
  maximized: {
    width: '100vw',
    height: '100vh',
    maximized: true,
    position: 'fullscreen',
  },
  
  minimized: {
    width: '600px',
    height: '400px',
    maximized: false,
    position: 'center',
  },
  
  mobile: {
    width: '100vw',
    height: '100vh',
    maximized: true,
    position: 'fullscreen',
  },
} as const

// Test utilities for document editor
export const editorTestUtils = {
  /**
   * Generate unique document ID for testing
   */
  generateDocumentId: (prefix = 'test-doc') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  /**
   * Generate mock document content with specified elements
   */
  generateContent: (elements: string[]) => {
    const contentMap: Record<string, string> = {
      'heading': '<h1>Test Heading</h1>',
      'paragraph': '<p>Test paragraph content.</p>',
      'bold': '<p>Text with <strong>bold</strong> formatting.</p>',
      'italic': '<p>Text with <em>italic</em> formatting.</p>',
      'list': '<ul><li>List item 1</li><li>List item 2</li></ul>',
      'code': '<pre><code>console.log("test");</code></pre>',
      'quote': '<blockquote><p>Test quote</p></blockquote>',
    }
    
    return elements.map(element => contentMap[element] || '').join('')
  },
  
  /**
   * Count words in HTML content
   */
  countWords: (htmlContent: string) => {
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    return textContent ? textContent.split(' ').length : 0
  },
  
  /**
   * Extract plain text from HTML content
   */
  extractText: (htmlContent: string) => {
    return htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  },
  
  /**
   * Validate HTML structure
   */
  validateHtml: (htmlContent: string) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlContent, 'text/html')
      return !doc.querySelector('parsererror')
    } catch {
      return false
    }
  },
  
  /**
   * Generate version history for testing
   */
  generateVersionHistory: (documentId: string, count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `version-${i + 1}`,
      documentId,
      version: i + 1,
      content: `<p>Version ${i + 1} content</p>`,
      timestamp: new Date(Date.now() - (count - i) * 60000), // 1 minute intervals
      author: 'test-user',
      description: `Version ${i + 1} changes`,
      wordCount: 3 + i,
      charCount: 25 + i * 5,
    }))
  },

  /**
   * Calculate differences between two HTML content strings
   */
  calculateContentDiff: (fromContent: string, toContent: string) => {
    // Simple diff calculation for testing (in real app, use proper diff library)
    const additions = []
    const deletions = []
    
    if (fromContent !== toContent) {
      if (toContent.length > fromContent.length) {
        const addition = toContent.substring(fromContent.length)
        additions.push(addition)
      } else if (fromContent.length > toContent.length) {
        const deletion = fromContent.substring(toContent.length)
        deletions.push(deletion)
      }
    }
    
    return {
      additions,
      deletions,
      hasChanges: fromContent !== toContent,
      changeType: toContent.length > fromContent.length ? 'addition' : 
                  fromContent.length > toContent.length ? 'deletion' : 'modification',
    }
  },

  /**
   * Generate event history for undo/redo testing
   */
  generateEventHistory: (documentId: string, eventCount: number) => {
    const events = []
    let content = '<p>Initial content</p>'
    
    for (let i = 0; i < eventCount; i++) {
      const previousContent = content
      content = `<p>Content after change ${i + 1}</p>`
      
      events.push({
        type: 'DOCUMENT_CONTENT_CHANGE',
        payload: {
          documentId,
          previousContent,
          newContent: content,
          changeType: 'replace',
          changeSize: Math.abs(content.length - previousContent.length),
          contentLength: content.length,
        },
        timestamp: new Date(Date.now() - (eventCount - i) * 10000), // 10 second intervals
        userId: 'test-user',
      })
    }
    
    return events
  },

  /**
   * Format timestamp for version history display
   */
  formatVersionTimestamp: (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },
} as const

// Error scenarios for document editor testing
export const editorErrorScenarios = {
  invalidContent: {
    malformedHtml: '<p>Unclosed paragraph',
    scriptInjection: '<p>Text with <script>alert("xss")</script></p>',
    invalidNesting: '<p><div>Invalid nesting</div></p>',
  },
  
  modalErrors: {
    failedToOpen: 'Modal failed to open',
    resizeError: 'Modal resize failed',
    saveError: 'Failed to save document',
  },
  
  networkErrors: {
    loadFailure: 'Failed to load document content',
    saveFailure: 'Failed to save changes',
    versionLoadFailure: 'Failed to load version history',
    railLoadFailure: 'Failed to load rail connections',
  },
  
  validationErrors: {
    emptyTitle: 'Document title cannot be empty',
    contentTooLarge: 'Document content exceeds maximum size',
    invalidCharacters: 'Content contains invalid characters',
  },
} as const