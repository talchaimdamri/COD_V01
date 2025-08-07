/**
 * Document Event Sourcing State Management Unit Tests
 * Test ID: UT-EVENT-SOURCING
 * PRD Reference: Task 11.1 - Enhanced Event Sourcing with Version Snapshots
 * 
 * This test suite covers the enhanced event sourcing architecture for document management,
 * including state derivation from events, version snapshot creation and restoration,
 * event replay mechanisms, and state consistency validation.
 * 
 * These tests will FAIL initially until the enhanced event sourcing is implemented (TDD).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentEventSourcing } from '../../src/lib/eventSourcing'
import { DocumentEventFactory, DocumentEventUtils } from '../../schemas/events/document'
import type { DocumentEvent } from '../../schemas/events/document'
import { 
  mockDocuments,
  mockVersionHistory,
  editorTestUtils,
} from '../fixtures/document-editor'

// Mock API service for testing
const mockAPIService = {
  createDocumentEvent: vi.fn(),
  getDocumentEvents: vi.fn(),
}

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Document Event Sourcing State Management [UT-SS-01]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default API responses
    vi.mocked(fetch).mockImplementation((url: string) => {
      if (url.includes('/api/events/document') && url.includes('GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      }
      
      if (url.includes('/api/events/document') && !url.includes('GET')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            data: { 
              id: 'event-' + Date.now(),
              timestamp: new Date().toISOString(),
            },
          }),
        } as Response)
      }
      
      return Promise.reject(new Error('Unmocked API call'))
    })
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('State Derivation from Events', () => {
    it('should derive document state from event history', async () => {
      // Test ID: UT-SS-01-A
      // PRD Reference: State derivation through event replay
      
      const documentId = 'test-doc'
      const events: DocumentEvent[] = [
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          '',
          '<p>Initial content</p>',
          'insert'
        ),
        DocumentEventFactory.createTitleChangeEvent(
          documentId,
          'Untitled',
          'Test Document'
        ),
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          '<p>Initial content</p>',
          '<p><strong>Bold</strong> content</p>',
          'format'
        ),
      ]
      
      // Mock API to return events
      vi.mocked(fetch).mockImplementation((url: string) => {
        if (url.includes('/api/events/document') && url.includes(`documentId=${documentId}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: events.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
              })),
            }),
          } as Response)
        }
        return Promise.reject(new Error('Unmocked API call'))
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const { documentState, eventHistory, currentEventIndex } = result.current
      
      // Verify state is derived correctly from events
      expect(documentState).toBeDefined()
      expect(documentState?.id).toBe(documentId)
      expect(documentState?.title).toBe('Test Document')
      expect(documentState?.content).toBe('<p><strong>Bold</strong> content</p>')
      expect(eventHistory).toHaveLength(3)
      expect(currentEventIndex).toBe(2)
    })

    it('should handle event replay for state reconstruction', async () => {
      // Test ID: UT-SS-01-B
      // PRD Reference: Event replay mechanisms for state consistency
      
      const documentId = 'test-replay'
      const events: DocumentEvent[] = [
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          '',
          '<p>Step 1</p>',
          'insert'
        ),
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          '<p>Step 1</p>',
          '<p>Step 1</p><p>Step 2</p>',
          'insert'
        ),
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          '<p>Step 1</p><p>Step 2</p>',
          '<p>Modified Step 1</p><p>Step 2</p>',
          'replace'
        ),
      ]
      
      vi.mocked(fetch).mockImplementation((url: string) => {
        if (url.includes('/api/events/document') && url.includes(`documentId=${documentId}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: events.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
              })),
            }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'event-new' } }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      // Wait for initial load
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const { documentState } = result.current
      
      // Verify final state reflects all events
      expect(documentState?.content).toBe('<p>Modified Step 1</p><p>Step 2</p>')
      
      // Test event replay by simulating undo/redo operations
      await act(async () => {
        await result.current.undo()
      })
      
      // Content should revert to previous state
      expect(result.current.documentState?.content).toBe('<p>Step 1</p><p>Step 2</p>')
      
      await act(async () => {
        await result.current.redo()
      })
      
      // Content should return to final state
      expect(result.current.documentState?.content).toBe('<p>Modified Step 1</p><p>Step 2</p>')
    })

    it('should validate event sourcing consistency', async () => {
      // Test ID: UT-SS-01-C
      // PRD Reference: Event sourcing integrity validation
      
      const documentId = 'test-consistency'
      const events = editorTestUtils.generateEventHistory(documentId, 5)
      
      vi.mocked(fetch).mockImplementation((url: string) => {
        if (url.includes('/api/events/document') && url.includes(`documentId=${documentId}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: events.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
              })),
            }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'event-new' } }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      const { eventHistory, documentState } = result.current
      
      // Validate event chain consistency
      expect(eventHistory).toHaveLength(5)
      expect(documentState).toBeDefined()
      
      // Validate event timestamps are sequential
      for (let i = 1; i < eventHistory.length; i++) {
        expect(eventHistory[i].timestamp.getTime())
          .toBeGreaterThanOrEqual(eventHistory[i - 1].timestamp.getTime())
      }
      
      // Validate event payload consistency
      eventHistory.forEach(event => {
        expect(event.payload.documentId).toBe(documentId)
        expect(event.type).toBe('DOCUMENT_CONTENT_CHANGE')
        expect(event.payload.changeSize).toBeGreaterThan(0)
        expect(event.payload.contentLength).toBeGreaterThan(0)
      })
    })
  })

  describe('Version Snapshot Management', () => {
    it('should create version snapshots correctly', async () => {
      // Test ID: UT-SS-01-D
      // PRD Reference: Version snapshot creation with content preservation
      
      const documentId = 'test-snapshot'
      
      vi.mocked(fetch).mockImplementation((url: string, options: any) => {
        if (url.includes('/api/events/document') && options?.method === 'POST') {
          const body = JSON.parse(options.body)
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: { 
                ...body,
                id: 'event-snapshot-' + Date.now(),
                timestamp: new Date().toISOString(),
              },
            }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })
      
      // Add some content
      await act(async () => {
        await result.current.updateContent('<h1>Document Title</h1><p>Content for snapshot</p>')
      })
      
      // Create version snapshot
      const versionDescription = 'Snapshot with title and content'
      await act(async () => {
        await result.current.saveVersion({ description: versionDescription })
      })
      
      // Verify version save event was created
      const fetchCalls = vi.mocked(fetch).mock.calls
      const versionSaveCall = fetchCalls.find(call => {
        if (call[1]?.body) {
          const body = JSON.parse(call[1].body as string)
          return body.type === 'DOCUMENT_VERSION_SAVE'
        }
        return false
      })
      
      expect(versionSaveCall).toBeDefined()
      
      if (versionSaveCall && versionSaveCall[1]?.body) {
        const versionEvent = JSON.parse(versionSaveCall[1].body as string)
        expect(versionEvent.payload.description).toBe(versionDescription)
        expect(versionEvent.payload.contentSnapshot).toContain('<h1>Document Title</h1>')
        expect(versionEvent.payload.wordCount).toBeGreaterThan(0)
        expect(versionEvent.payload.charCount).toBeGreaterThan(0)
      }
    })

    it('should restore from version snapshots', async () => {
      // Test ID: UT-SS-01-E  
      // PRD Reference: Version restoration with state rollback
      
      const documentId = 'test-restore'
      const snapshotContent = '<p>Snapshot content to restore</p>'
      
      const mockEvents: DocumentEvent[] = [
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          '',
          '<p>Initial content</p>',
          'insert'
        ),
        DocumentEventFactory.createVersionSaveEvent(
          documentId,
          1,
          snapshotContent,
          { description: 'Saved snapshot' }
        ),
        DocumentEventFactory.createContentChangeEvent(
          documentId,
          snapshotContent,
          '<p>Modified after snapshot</p>',
          'replace'
        ),
      ]
      
      vi.mocked(fetch).mockImplementation((url: string, options: any) => {
        if (url.includes('/api/events/document') && url.includes(`documentId=${documentId}`) && !options) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: mockEvents.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
              })),
            }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'event-new' } }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      // Verify current state includes modifications after snapshot
      expect(result.current.documentState?.content).toBe('<p>Modified after snapshot</p>')
      
      // Simulate restoration by undoing to snapshot
      await act(async () => {
        await result.current.undo() // Undo to snapshot
      })
      
      // Verify content restored to snapshot
      expect(result.current.documentState?.content).toBe(snapshotContent)
    })
  })

  describe('Event Buffering and Performance', () => {
    it('should buffer events for performance optimization', async () => {
      // Test ID: UT-SS-01-F
      // PRD Reference: Event buffering for batch operations
      
      const documentId = 'test-buffer'
      let apiCallCount = 0
      
      vi.mocked(fetch).mockImplementation((url: string, options: any) => {
        if (url.includes('/api/events/document') && options?.method === 'POST') {
          apiCallCount++
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: { 
                id: `event-${apiCallCount}`,
                timestamp: new Date().toISOString(),
              },
            }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })
      
      // Make multiple rapid content changes
      await act(async () => {
        await result.current.updateContent('<p>Change 1</p>')
        await result.current.updateContent('<p>Change 2</p>')
        await result.current.updateContent('<p>Change 3</p>')
      })
      
      // Wait for buffering/debouncing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)) // Wait for buffer flush
      })
      
      // Verify events were created but potentially buffered
      expect(apiCallCount).toBeGreaterThan(0)
      expect(result.current.eventHistory.length).toBeGreaterThan(0)
      
      // Verify final state is correct
      expect(result.current.documentState?.content).toBe('<p>Change 3</p>')
    })

    it('should handle large event histories efficiently', async () => {
      // Test ID: UT-SS-01-G
      // PRD Reference: Performance with large event datasets
      
      const documentId = 'test-large-history'
      const largeEventHistory = editorTestUtils.generateEventHistory(documentId, 100)
      
      vi.mocked(fetch).mockImplementation((url: string) => {
        if (url.includes('/api/events/document') && url.includes(`documentId=${documentId}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: largeEventHistory.map(e => ({
                ...e,
                timestamp: e.timestamp.toISOString(),
              })),
            }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'event-new' } }),
        } as Response)
      })
      
      const startTime = performance.now()
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
      })
      
      const endTime = performance.now()
      const loadTime = endTime - startTime
      
      // Should handle large history reasonably quickly
      expect(loadTime).toBeLessThan(1000) // 1 second threshold
      
      const { eventHistory, documentState } = result.current
      
      // Verify all events loaded
      expect(eventHistory).toHaveLength(100)
      expect(documentState).toBeDefined()
      
      // Test undo/redo performance with large history
      const undoStartTime = performance.now()
      
      await act(async () => {
        await result.current.undo()
      })
      
      const undoEndTime = performance.now()
      const undoTime = undoEndTime - undoStartTime
      
      // Undo should be fast even with large history
      expect(undoTime).toBeLessThan(100) // 100ms threshold
      expect(result.current.currentEventIndex).toBe(98)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle API failures gracefully', async () => {
      // Test ID: UT-SS-01-H
      // PRD Reference: Error handling in event sourcing
      
      const documentId = 'test-api-error'
      
      vi.mocked(fetch).mockImplementation((url: string) => {
        if (url.includes('/api/events/document')) {
          return Promise.reject(new Error('API unavailable'))
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      // Should continue to function locally despite API error
      expect(result.current.error).toBeNull() // In development mode
      expect(result.current.documentState).toBeDefined()
      
      // Test local operations still work
      await act(async () => {
        await result.current.updateContent('<p>Local content</p>')
      })
      
      expect(result.current.documentState?.content).toBe('<p>Local content</p>')
      expect(result.current.eventHistory.length).toBeGreaterThan(0)
    })

    it('should recover from corrupted event data', async () => {
      // Test ID: UT-SS-01-I
      // PRD Reference: Data integrity and recovery mechanisms
      
      const documentId = 'test-corruption'
      
      // Simulate corrupted event data
      const corruptedEvents = [
        {
          type: 'DOCUMENT_CONTENT_CHANGE',
          payload: {
            documentId,
            previousContent: '<p>Valid</p>',
            newContent: null, // Corrupted data
            changeType: 'replace',
            changeSize: 0,
            contentLength: -1, // Invalid length
          },
          timestamp: new Date().toISOString(),
        },
        {
          type: 'UNKNOWN_EVENT_TYPE', // Invalid event type
          payload: {},
          timestamp: 'invalid-date', // Invalid timestamp
        },
      ]
      
      vi.mocked(fetch).mockImplementation((url: string) => {
        if (url.includes('/api/events/document') && url.includes(`documentId=${documentId}`)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: corruptedEvents }),
          } as Response)
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: { id: 'event-new' } }),
        } as Response)
      })
      
      const { result } = renderHook(() => useDocumentEventSourcing(documentId))
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })
      
      // Should handle corrupted data gracefully
      expect(result.current.documentState).toBeDefined()
      
      // Should filter out invalid events
      expect(result.current.eventHistory.length).toBeLessThanOrEqual(1) // Only valid events
      
      // Should still allow new operations
      await act(async () => {
        await result.current.updateContent('<p>New valid content</p>')
      })
      
      expect(result.current.documentState?.content).toBe('<p>New valid content</p>')
    })
  })
})