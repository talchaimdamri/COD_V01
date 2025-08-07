/**
 * Document Undo/Redo Unit Tests
 * Test ID: UT-UNDO-REDO
 * PRD Reference: Task 11.1 - Document Version History and Undo/Redo
 * 
 * This test suite covers the unit-level functionality of the undo/redo system,
 * including command patterns, event replay logic, state management, and
 * integration with the document event sourcing architecture.
 * 
 * These tests will FAIL initially until the undo/redo system is implemented (TDD).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { useDocumentEventSourcing } from '../../src/lib/eventSourcing'
import { DocumentEventFactory, DocumentEventUtils } from '../../schemas/events/document'
import { 
  mockDocuments, 
  mockVersionHistory,
  editorTestUtils,
} from '../fixtures/document-editor'

// Mock the event sourcing hook for isolated testing
vi.mock('../../src/lib/eventSourcing')

// Mock TipTap editor for testing
const mockTipTapEditor = {
  getHTML: vi.fn(() => '<p>Test content</p>'),
  commands: {
    setContent: vi.fn(),
    focus: vi.fn(),
    undo: vi.fn(() => true),
    redo: vi.fn(() => true),
  },
  can: vi.fn(() => ({
    undo: vi.fn(() => true),
    redo: vi.fn(() => true),
  })),
  state: {
    doc: { content: { size: 100 } },
  },
}

describe('Document Undo/Redo Functionality', () => {
  let mockEventSourcing: any
  let mockDispatchEvent: any
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Create mock event sourcing implementation
    mockDispatchEvent = vi.fn()
    mockEventSourcing = {
      documentState: {
        id: 'test-doc',
        title: 'Test Document',
        content: '<p>Initial content</p>',
        version: 1,
        upstream: [],
        downstream: [],
      },
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: false,
      canRedo: false,
      updateContent: vi.fn(),
      updateTitle: vi.fn(),
      saveVersion: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      addConnection: vi.fn(),
      removeConnection: vi.fn(),
    }
    
    vi.mocked(useDocumentEventSourcing).mockReturnValue(mockEventSourcing)
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Undo Operations [UT-UR-01]', () => {
    it('should enable undo when events exist in history', async () => {
      // Test ID: UT-UR-01-A
      // PRD Reference: Undo functionality with event history
      
      const events = editorTestUtils.generateEventHistory('test-doc', 3)
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = 2
      mockEventSourcing.canUndo = true
      
      const TestComponent = () => {
        const { canUndo, undo } = useDocumentEventSourcing('test-doc')
        
        return (
          <div>
            <button 
              data-testid="undo-button" 
              disabled={!canUndo}
              onClick={undo}
            >
              Undo
            </button>
            <span data-testid="can-undo">{canUndo ? 'true' : 'false'}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const undoButton = screen.getByTestId('undo-button')
      const canUndoIndicator = screen.getByTestId('can-undo')
      
      expect(canUndoIndicator).toHaveTextContent('true')
      expect(undoButton).toBeEnabled()
    })

    it('should disable undo when no events in history', async () => {
      // Test ID: UT-UR-01-B
      // PRD Reference: Undo button state management
      
      mockEventSourcing.eventHistory = []
      mockEventSourcing.currentEventIndex = -1
      mockEventSourcing.canUndo = false
      
      const TestComponent = () => {
        const { canUndo, undo } = useDocumentEventSourcing('test-doc')
        
        return (
          <div>
            <button 
              data-testid="undo-button" 
              disabled={!canUndo}
              onClick={undo}
            >
              Undo
            </button>
            <span data-testid="can-undo">{canUndo ? 'true' : 'false'}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const undoButton = screen.getByTestId('undo-button')
      const canUndoIndicator = screen.getByTestId('can-undo')
      
      expect(canUndoIndicator).toHaveTextContent('false')
      expect(undoButton).toBeDisabled()
    })

    it('should correctly execute undo operation', async () => {
      // Test ID: UT-UR-01-C
      // PRD Reference: Undo operation execution with state reversion
      
      const events = editorTestUtils.generateEventHistory('test-doc', 2)
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = 1
      mockEventSourcing.canUndo = true
      
      const TestComponent = () => {
        const { undo } = useDocumentEventSourcing('test-doc')
        
        return (
          <button data-testid="undo-button" onClick={undo}>
            Undo
          </button>
        )
      }
      
      render(<TestComponent />)
      
      const undoButton = screen.getByTestId('undo-button')
      
      await act(async () => {
        fireEvent.click(undoButton)
      })
      
      expect(mockEventSourcing.undo).toHaveBeenCalledTimes(1)
    })

    it('should create undo event with proper tracking', async () => {
      // Test ID: UT-UR-01-D
      // PRD Reference: Undo event tracking for audit trail
      
      const documentId = 'test-doc'
      const contentBefore = '<p>Content before undo</p>'
      const contentAfter = '<p>Content after undo</p>'
      
      const undoEvent = DocumentEventFactory.createUndoRedoEvent(
        documentId,
        'undo',
        contentBefore,
        contentAfter,
        {
          targetEventId: 'event-123',
          userId: 'test-user',
        }
      )
      
      expect(undoEvent.type).toBe('DOCUMENT_UNDO_REDO')
      expect(undoEvent.payload.operation).toBe('undo')
      expect(undoEvent.payload.documentId).toBe(documentId)
      expect(undoEvent.payload.contentBefore).toBe(contentBefore)
      expect(undoEvent.payload.contentAfter).toBe(contentAfter)
      expect(undoEvent.payload.targetEventId).toBe('event-123')
      expect(undoEvent.userId).toBe('test-user')
      expect(undoEvent.timestamp).toBeInstanceOf(Date)
    })

    it('should handle multiple consecutive undo operations', async () => {
      // Test ID: UT-UR-01-E
      // PRD Reference: Multiple undo operations with correct state progression
      
      const events = editorTestUtils.generateEventHistory('test-doc', 5)
      
      let currentIndex = 4
      let canUndo = true
      
      const mockUndo = vi.fn(() => {
        if (currentIndex >= 0) {
          currentIndex--
          canUndo = currentIndex >= 0
        }
      })
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = currentIndex
      mockEventSourcing.canUndo = canUndo
      mockEventSourcing.undo = mockUndo
      
      const TestComponent = () => {
        const { canUndo: canUndoProp, undo } = useDocumentEventSourcing('test-doc')
        
        return (
          <div>
            <button 
              data-testid="undo-button" 
              disabled={!canUndoProp}
              onClick={undo}
            >
              Undo
            </button>
            <span data-testid="event-index">{mockEventSourcing.currentEventIndex}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const undoButton = screen.getByTestId('undo-button')
      
      // Perform multiple undos
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.click(undoButton)
        })
        
        expect(mockUndo).toHaveBeenCalledTimes(i + 1)
      }
      
      expect(mockUndo).toHaveBeenCalledTimes(3)
    })
  })

  describe('Redo Operations [UT-UR-02]', () => {
    it('should enable redo when undo operations exist', async () => {
      // Test ID: UT-UR-02-A
      // PRD Reference: Redo functionality after undo operations
      
      const events = editorTestUtils.generateEventHistory('test-doc', 3)
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = 1 // Undone from index 2
      mockEventSourcing.canRedo = true
      
      const TestComponent = () => {
        const { canRedo, redo } = useDocumentEventSourcing('test-doc')
        
        return (
          <div>
            <button 
              data-testid="redo-button" 
              disabled={!canRedo}
              onClick={redo}
            >
              Redo
            </button>
            <span data-testid="can-redo">{canRedo ? 'true' : 'false'}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const redoButton = screen.getByTestId('redo-button')
      const canRedoIndicator = screen.getByTestId('can-redo')
      
      expect(canRedoIndicator).toHaveTextContent('true')
      expect(redoButton).toBeEnabled()
    })

    it('should disable redo when at latest event', async () => {
      // Test ID: UT-UR-02-B  
      // PRD Reference: Redo button state when no forward history
      
      const events = editorTestUtils.generateEventHistory('test-doc', 3)
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = 2 // At latest event
      mockEventSourcing.canRedo = false
      
      const TestComponent = () => {
        const { canRedo, redo } = useDocumentEventSourcing('test-doc')
        
        return (
          <div>
            <button 
              data-testid="redo-button" 
              disabled={!canRedo}
              onClick={redo}
            >
              Redo
            </button>
            <span data-testid="can-redo">{canRedo ? 'true' : 'false'}</span>
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const redoButton = screen.getByTestId('redo-button')
      const canRedoIndicator = screen.getByTestId('can-redo')
      
      expect(canRedoIndicator).toHaveTextContent('false')
      expect(redoButton).toBeDisabled()
    })

    it('should correctly execute redo operation', async () => {
      // Test ID: UT-UR-02-C
      // PRD Reference: Redo operation execution with state progression
      
      const events = editorTestUtils.generateEventHistory('test-doc', 3)
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = 1
      mockEventSourcing.canRedo = true
      
      const TestComponent = () => {
        const { redo } = useDocumentEventSourcing('test-doc')
        
        return (
          <button data-testid="redo-button" onClick={redo}>
            Redo
          </button>
        )
      }
      
      render(<TestComponent />)
      
      const redoButton = screen.getByTestId('redo-button')
      
      await act(async () => {
        fireEvent.click(redoButton)
      })
      
      expect(mockEventSourcing.redo).toHaveBeenCalledTimes(1)
    })

    it('should create redo event with proper tracking', async () => {
      // Test ID: UT-UR-02-D
      // PRD Reference: Redo event tracking for audit trail
      
      const documentId = 'test-doc'
      const contentBefore = '<p>Content before redo</p>'
      const contentAfter = '<p>Content after redo</p>'
      
      const redoEvent = DocumentEventFactory.createUndoRedoEvent(
        documentId,
        'redo',
        contentBefore,
        contentAfter,
        {
          targetEventId: 'event-456',
          userId: 'test-user',
        }
      )
      
      expect(redoEvent.type).toBe('DOCUMENT_UNDO_REDO')
      expect(redoEvent.payload.operation).toBe('redo')
      expect(redoEvent.payload.documentId).toBe(documentId)
      expect(redoEvent.payload.contentBefore).toBe(contentBefore)
      expect(redoEvent.payload.contentAfter).toBe(contentAfter)
      expect(redoEvent.payload.targetEventId).toBe('event-456')
      expect(redoEvent.userId).toBe('test-user')
      expect(redoEvent.timestamp).toBeInstanceOf(Date)
    })

    it('should clear redo stack after new changes', async () => {
      // Test ID: UT-UR-02-E
      // PRD Reference: Redo stack management with new content changes
      
      const events = editorTestUtils.generateEventHistory('test-doc', 3)
      
      let currentIndex = 1 // Simulating undo from index 2
      let canRedo = true
      
      const mockRedo = vi.fn(() => {
        if (currentIndex < events.length - 1) {
          currentIndex++
          canRedo = currentIndex < events.length - 1
        }
      })
      
      const mockUpdateContent = vi.fn(() => {
        // Simulate new content change clearing redo stack
        currentIndex = events.length - 1
        canRedo = false
        
        // Add new event to history
        const newEvent = DocumentEventFactory.createContentChangeEvent(
          'test-doc',
          '<p>Previous content</p>',
          '<p>New content change</p>',
          'replace'
        )
        events.push(newEvent)
        currentIndex = events.length - 1
      })
      
      mockEventSourcing.eventHistory = events
      mockEventSourcing.currentEventIndex = currentIndex
      mockEventSourcing.canRedo = canRedo
      mockEventSourcing.redo = mockRedo
      mockEventSourcing.updateContent = mockUpdateContent
      
      // Verify redo is initially available
      expect(mockEventSourcing.canRedo).toBe(true)
      
      // Make a new content change
      await act(async () => {
        mockUpdateContent('<p>New content change</p>')
      })
      
      // Verify redo stack is cleared
      expect(mockEventSourcing.canRedo).toBe(false)
      expect(mockUpdateContent).toHaveBeenCalledTimes(1)
    })
  })

  describe('Undo/Redo State Management', () => {
    it('should maintain correct state indices during operations', async () => {
      // Test ID: UT-UR-03-A
      // PRD Reference: Event index management for undo/redo state
      
      const events = editorTestUtils.generateEventHistory('test-doc', 4)
      
      // Test initial state
      expect(events).toHaveLength(4)
      
      // Simulate state at various indices
      const testCases = [
        { index: 3, canUndo: true, canRedo: false },  // At latest
        { index: 2, canUndo: true, canRedo: true },   // Middle
        { index: 1, canUndo: true, canRedo: true },   // Middle
        { index: 0, canUndo: true, canRedo: true },   // First event
        { index: -1, canUndo: false, canRedo: true }, // Before first
      ]
      
      testCases.forEach(({ index, canUndo, canRedo }) => {
        const actualCanUndo = index >= 0
        const actualCanRedo = index < events.length - 1
        
        expect(actualCanUndo).toBe(canUndo)
        expect(actualCanRedo).toBe(canRedo)
      })
    })

    it('should handle complex undo/redo sequences correctly', async () => {
      // Test ID: UT-UR-03-B
      // PRD Reference: Complex operation sequences with state integrity
      
      const events = editorTestUtils.generateEventHistory('test-doc', 5)
      
      let currentIndex = 4 // Start at latest
      
      const performUndo = () => {
        if (currentIndex >= 0) {
          currentIndex--
        }
        return {
          index: currentIndex,
          canUndo: currentIndex >= 0,
          canRedo: currentIndex < events.length - 1,
        }
      }
      
      const performRedo = () => {
        if (currentIndex < events.length - 1) {
          currentIndex++
        }
        return {
          index: currentIndex,
          canUndo: currentIndex >= 0,
          canRedo: currentIndex < events.length - 1,
        }
      }
      
      // Test sequence: Undo 3 times, Redo 2 times, Undo 1 time
      const sequence = []
      
      // Undo 3 times
      for (let i = 0; i < 3; i++) {
        sequence.push(performUndo())
      }
      
      expect(sequence[2]).toEqual({
        index: 1,
        canUndo: true,
        canRedo: true,
      })
      
      // Redo 2 times
      for (let i = 0; i < 2; i++) {
        sequence.push(performRedo())
      }
      
      expect(sequence[4]).toEqual({
        index: 3,
        canUndo: true,
        canRedo: true,
      })
      
      // Undo 1 time
      sequence.push(performUndo())
      
      expect(sequence[5]).toEqual({
        index: 2,
        canUndo: true,
        canRedo: true,
      })
    })

    it('should validate event sourcing integrity', async () => {
      // Test ID: UT-UR-03-C
      // PRD Reference: Event sourcing integrity validation
      
      const events = [
        DocumentEventFactory.createContentChangeEvent(
          'test-doc',
          '<p>Initial</p>',
          '<p>First change</p>',
          'replace'
        ),
        DocumentEventFactory.createContentChangeEvent(
          'test-doc',
          '<p>First change</p>',
          '<p>Second change</p>',
          'replace'
        ),
        DocumentEventFactory.createContentChangeEvent(
          'test-doc',
          '<p>Second change</p>',
          '<p>Third change</p>',
          'replace'
        ),
      ]
      
      // Validate event chain consistency
      for (let i = 1; i < events.length; i++) {
        const prevEvent = events[i - 1]
        const currentEvent = events[i]
        
        if (DocumentEventUtils.isContentChangeEvent(prevEvent) && 
            DocumentEventUtils.isContentChangeEvent(currentEvent)) {
          expect(prevEvent.payload.newContent)
            .toBe(currentEvent.payload.previousContent)
        }
      }
      
      // Validate timestamps are sequential
      for (let i = 1; i < events.length; i++) {
        expect(events[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(events[i - 1].timestamp.getTime())
      }
    })
  })

  describe('Event Utils Integration', () => {
    it('should correctly identify undo/redo events', async () => {
      // Test ID: UT-UR-04-A
      // PRD Reference: Event type validation and utilities
      
      const undoEvent = DocumentEventFactory.createUndoRedoEvent(
        'test-doc',
        'undo',
        '<p>Before</p>',
        '<p>After</p>'
      )
      
      const contentEvent = DocumentEventFactory.createContentChangeEvent(
        'test-doc',
        '<p>Old</p>',
        '<p>New</p>',
        'replace'
      )
      
      // Validate event type detection
      expect(undoEvent.type).toBe('DOCUMENT_UNDO_REDO')
      expect(contentEvent.type).toBe('DOCUMENT_CONTENT_CHANGE')
      
      // Test DocumentEventUtils if they have type checking methods
      if (DocumentEventUtils.isContentChangeEvent) {
        expect(DocumentEventUtils.isContentChangeEvent(contentEvent)).toBe(true)
        expect(DocumentEventUtils.isContentChangeEvent(undoEvent)).toBe(false)
      }
    })

    it('should handle event serialization correctly', async () => {
      // Test ID: UT-UR-04-B
      // PRD Reference: Event persistence and serialization
      
      const originalEvent = DocumentEventFactory.createUndoRedoEvent(
        'test-doc',
        'undo',
        '<p>Content before undo</p>',
        '<p>Content after undo</p>',
        {
          targetEventId: 'target-event-123',
          userId: 'user-456',
        }
      )
      
      // Serialize and deserialize
      const serialized = JSON.stringify(originalEvent)
      const deserialized = JSON.parse(serialized)
      
      // Restore Date object
      deserialized.timestamp = new Date(deserialized.timestamp)
      
      // Validate all properties preserved
      expect(deserialized.type).toBe(originalEvent.type)
      expect(deserialized.payload).toEqual(originalEvent.payload)
      expect(deserialized.timestamp.getTime()).toBe(originalEvent.timestamp.getTime())
      expect(deserialized.userId).toBe(originalEvent.userId)
    })
  })
})