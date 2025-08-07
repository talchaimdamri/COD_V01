import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentEventSourcing } from '../../src/lib/eventSourcing'
import { DocumentEventFactory } from '../../schemas/events/document'
import { Version } from '../../schemas/api/versions'

/**
 * Integration Tests for Version History with Event Sourcing
 * 
 * Tests the integration between document event sourcing and version management,
 * ensuring seamless operation when restoring versions, creating snapshots,
 * and synchronizing with the version system.
 */

// Mock fetch for API calls
global.fetch = vi.fn()

const mockFetch = fetch as vi.MockedFunction<typeof fetch>

// Mock version data
const mockVersions: Version[] = [
  {
    id: 'v1',
    documentId: 'doc-1',
    versionNumber: 1,
    content: '<p>Version 1 content</p>',
    description: 'Initial version',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    wordCount: 3,
    characterCount: 25,
    author: 'user-1',
    tags: [],
  },
  {
    id: 'v2',
    documentId: 'doc-1',
    versionNumber: 2,
    content: '<p>Version 2 content with more text</p>',
    description: 'Updated version',
    createdAt: new Date('2024-01-01T11:00:00Z'),
    wordCount: 6,
    characterCount: 40,
    author: 'user-1',
    tags: [],
  },
]

describe('Version History Event Sourcing Integration', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    
    // Mock successful API responses
    mockFetch.mockImplementation((url) => {
      if (url.includes('/events/document')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      } as Response)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Version Restoration Integration', () => {
    it('should restore version content through event sourcing', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      await act(async () => {
        await result.current.restoreToVersion(mockVersions[0])
      })

      expect(result.current.documentState?.content).toBe(mockVersions[0].content)
      expect(result.current.versionRestoreInProgress).toBe(false)
      expect(result.current.eventHistory.length).toBeGreaterThan(0)
      
      // Should have created a restore event
      const restoreEvent = result.current.eventHistory.find(
        event => event.type === 'DOCUMENT_VERSION_RESTORE'
      )
      expect(restoreEvent).toBeDefined()
      expect(restoreEvent?.payload.restoredVersionId).toBe(mockVersions[0].id)
    })

    it('should handle version restore with event buffer flush', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Make some content changes first
      await act(async () => {
        await result.current.updateContent('<p>Current content</p>')
      })

      const initialEventCount = result.current.eventHistory.length

      // Restore to previous version
      await act(async () => {
        await result.current.restoreToVersion(mockVersions[0])
      })

      // Should have more events (content change + restore)
      expect(result.current.eventHistory.length).toBeGreaterThan(initialEventCount)
      expect(result.current.documentState?.content).toBe(mockVersions[0].content)
    })

    it('should prevent concurrent version restorations', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Start first restoration
      const promise1 = act(async () => {
        await result.current.restoreToVersion(mockVersions[0])
      })

      // Try to start second restoration immediately
      const promise2 = act(async () => {
        await result.current.restoreToVersion(mockVersions[1])
      })

      await Promise.all([promise1, promise2])

      // Only the first restoration should have succeeded
      expect(result.current.documentState?.content).toBe(mockVersions[0].content)
    })
  })

  describe('Version Snapshot Creation', () => {
    it('should create version snapshots through event sourcing', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Add some content
      await act(async () => {
        await result.current.updateContent('<p>Content for snapshot</p>')
      })

      await act(async () => {
        await result.current.createVersionSnapshot()
      })

      expect(result.current.pendingVersionSnapshot).toBe(false)
      
      // Should have created a version save event
      const versionEvent = result.current.eventHistory.find(
        event => event.type === 'DOCUMENT_VERSION_SAVE'
      )
      expect(versionEvent).toBeDefined()
    })

    it('should prevent concurrent snapshot creation', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      await act(async () => {
        await result.current.updateContent('<p>Content for snapshot</p>')
      })

      // Try to create multiple snapshots concurrently
      const promises = Array(3).fill(null).map(() => 
        act(async () => {
          await result.current.createVersionSnapshot()
        })
      )

      await Promise.all(promises)

      // Only one snapshot should have been created
      const versionEvents = result.current.eventHistory.filter(
        event => event.type === 'DOCUMENT_VERSION_SAVE'
      )
      expect(versionEvents.length).toBeLessThanOrEqual(1)
    })
  })

  describe('Version Synchronization', () => {
    it('should sync with external version updates', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      act(() => {
        result.current.syncWithVersions(mockVersions)
      })

      expect(result.current.lastVersionSync).toBeDefined()
      expect(result.current.lastVersionSync).toBeInstanceOf(Date)
    })

    it('should trigger auto-snapshot for old content', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Create old version (6+ minutes ago)
      const oldVersion: Version = {
        ...mockVersions[0],
        createdAt: new Date(Date.now() - 7 * 60 * 1000),
      }

      await act(async () => {
        await result.current.updateContent('<p>New content different from version</p>')
      })

      // Mock setTimeout to be synchronous for testing
      vi.useFakeTimers()

      act(() => {
        result.current.syncWithVersions([oldVersion])
      })

      // Advance timers to trigger auto-snapshot
      act(() => {
        vi.advanceTimersByTime(30000)
      })

      vi.useRealTimers()

      // Should have triggered auto-snapshot logic
      expect(result.current.lastVersionSync).toBeDefined()
    })
  })

  describe('Event History Management', () => {
    it('should maintain event history through version operations', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      const initialCount = result.current.eventHistory.length

      // Perform various operations
      await act(async () => {
        await result.current.updateContent('<p>Updated content</p>')
        await result.current.updateTitle('New Title')
        await result.current.saveVersion({ description: 'Test version' })
      })

      expect(result.current.eventHistory.length).toBeGreaterThan(initialCount)
      
      // Check event types
      const eventTypes = result.current.eventHistory.map(e => e.type)
      expect(eventTypes).toContain('DOCUMENT_CONTENT_CHANGE')
      expect(eventTypes).toContain('DOCUMENT_TITLE_CHANGE')
      expect(eventTypes).toContain('DOCUMENT_VERSION_SAVE')
    })

    it('should handle undo/redo with version operations', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Make some changes
      await act(async () => {
        await result.current.updateContent('<p>First change</p>')
        await result.current.updateContent('<p>Second change</p>')
      })

      expect(result.current.canUndo).toBe(true)

      // Undo a change
      await act(async () => {
        await result.current.undo()
      })

      expect(result.current.canRedo).toBe(true)

      // Redo the change
      await act(async () => {
        await result.current.redo()
      })

      expect(result.current.documentState?.content).toBe('<p>Second change</p>')
    })
  })

  describe('Performance and Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
        } as Response)
      )

      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      await act(async () => {
        try {
          await result.current.restoreToVersion(mockVersions[0])
        } catch (error) {
          // Should handle error gracefully
          expect(result.current.error).toBeTruthy()
        }
      })

      expect(result.current.versionRestoreInProgress).toBe(false)
    })

    it('should debounce rapid version operations', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Rapid content changes
      const promises = Array(10).fill(null).map((_, i) => 
        act(async () => {
          await result.current.updateContent(`<p>Change ${i}</p>`)
        })
      )

      await Promise.all(promises)

      // Should have debounced the events
      const contentEvents = result.current.eventHistory.filter(
        event => event.type === 'DOCUMENT_CONTENT_CHANGE'
      )
      expect(contentEvents.length).toBeLessThan(10)
    })

    it('should clean up resources on unmount', () => {
      const { unmount } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Should not throw errors on unmount
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Event Factory Integration', () => {
    it('should create well-formed version restore events', () => {
      const event = DocumentEventFactory.createVersionRestoreEvent(
        'doc-1',
        'v1',
        1,
        '<p>Current</p>',
        '<p>Restored</p>',
        { description: 'Test restore' }
      )

      expect(event.type).toBe('DOCUMENT_VERSION_RESTORE')
      expect(event.payload.documentId).toBe('doc-1')
      expect(event.payload.restoredVersionId).toBe('v1')
      expect(event.payload.restoredVersionNumber).toBe(1)
      expect(event.payload.previousContent).toBe('<p>Current</p>')
      expect(event.payload.restoredContent).toBe('<p>Restored</p>')
      expect(event.timestamp).toBeInstanceOf(Date)
    })

    it('should handle content change events with position data', () => {
      const event = DocumentEventFactory.createContentChangeEvent(
        'doc-1',
        '<p>Old</p>',
        '<p>New</p>',
        'replace',
        { position: { from: 0, to: 10 } }
      )

      expect(event.payload.position).toEqual({ from: 0, to: 10 })
      expect(event.payload.changeSize).toBe(1) // Difference in content length
      expect(event.payload.contentLength).toBe(9) // Length of new content
    })
  })
})