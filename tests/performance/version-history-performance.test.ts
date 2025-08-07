import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDocumentEventSourcing } from '../../src/lib/eventSourcing'
import useVersionManagement from '../../src/hooks/useVersionManagement'
import { Version } from '../../schemas/api/versions'

/**
 * Performance Tests for Version History Integration
 * 
 * Tests performance characteristics of the version history system
 * with large datasets, including memory usage, event processing speed,
 * and UI responsiveness during version operations.
 */

// Mock fetch for API calls
global.fetch = vi.fn()
const mockFetch = fetch as vi.MockedFunction<typeof fetch>

// Performance test utilities
const measurePerformance = async (operation: () => Promise<void>) => {
  const startTime = performance.now()
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0
  
  await operation()
  
  const endTime = performance.now()
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0
  
  return {
    duration: endTime - startTime,
    memoryDelta: endMemory - startMemory,
  }
}

// Generate large test datasets
const generateVersions = (count: number): Version[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `v${i + 1}`,
    documentId: 'doc-1',
    versionNumber: i + 1,
    content: `<p>Version ${i + 1} content with substantial text content that represents a realistic document size. This includes multiple sentences and paragraphs to simulate real-world usage.</p><p>Additional paragraph ${i + 1} with more content to increase the document size and test memory usage patterns.</p>`,
    description: `Version ${i + 1} description`,
    createdAt: new Date(Date.now() - (count - i) * 60000), // 1 minute intervals
    wordCount: 50 + i * 2,
    characterCount: 300 + i * 20,
    author: 'test-user',
    tags: [`tag-${i % 5}`, `category-${i % 3}`],
  }))
}

const generateLargeContent = (sizeKB: number): string => {
  const chunkSize = 100 // characters per chunk
  const chunks = Math.floor(sizeKB * 1024 / chunkSize)
  
  return Array.from({ length: chunks }, (_, i) => 
    `<p>Paragraph ${i + 1}: ${'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut '.repeat(Math.floor(chunkSize / 80))}</p>`
  ).join('')
}

describe('Version History Performance Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    
    // Mock API responses
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

  describe('Large Version History Performance', () => {
    it('should handle 100 versions efficiently', async () => {
      const versions = generateVersions(100)
      
      const { result } = renderHook(() => useVersionManagement({
        documentId: 'doc-1',
      }))

      // Mock loadVersions to return large dataset
      mockFetch.mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            data: { 
              versions: versions.slice(0, 20), // First page
              currentVersion: 100 
            } 
          }),
        } as Response)
      )

      const performance = await measurePerformance(async () => {
        await act(async () => {
          await result.current.loadVersions({ page: 1, limit: 20 })
        })
      })

      expect(performance.duration).toBeLessThan(1000) // Less than 1 second
      expect(result.current.versions).toHaveLength(20)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle version pagination efficiently', async () => {
      const versions = generateVersions(500)
      
      const { result } = renderHook(() => useVersionManagement({
        documentId: 'doc-1',
      }))

      // Test loading multiple pages
      const pageLoadTimes: number[] = []
      
      for (let page = 1; page <= 5; page++) {
        mockFetch.mockImplementationOnce(() => 
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ 
              data: { 
                versions: versions.slice((page - 1) * 20, page * 20),
                currentVersion: 500 
              } 
            }),
          } as Response)
        )

        const performance = await measurePerformance(async () => {
          await act(async () => {
            await result.current.loadVersions({ 
              page, 
              limit: 20, 
              reset: page === 1 
            })
          })
        })
        
        pageLoadTimes.push(performance.duration)
      }

      // Each page load should be consistently fast
      const averageTime = pageLoadTimes.reduce((a, b) => a + b) / pageLoadTimes.length
      expect(averageTime).toBeLessThan(500) // Less than 500ms average
      
      // Memory usage should not grow excessively
      expect(result.current.versions).toHaveLength(100) // 5 pages × 20 items
    })
  })

  describe('Large Document Content Performance', () => {
    it('should handle large document content (1MB) efficiently', async () => {
      const largeContent = generateLargeContent(1024) // 1MB content
      
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      const performance = await measurePerformance(async () => {
        await act(async () => {
          await result.current.updateContent(largeContent)
        })
      })

      expect(performance.duration).toBeLessThan(2000) // Less than 2 seconds
      expect(result.current.documentState?.content).toBe(largeContent)
      expect(result.current.error).toBeNull()
    })

    it('should handle rapid content changes without memory leaks', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      const contentSize = 1024 // 1KB per change
      
      // Simulate rapid editing with debouncing
      const rapidChanges = Array.from({ length: 100 }, (_, i) => 
        generateLargeContent(contentSize / 1024).substring(0, contentSize)
      )

      const performance = await measurePerformance(async () => {
        for (const content of rapidChanges) {
          await act(async () => {
            await result.current.updateContent(content)
          })
        }
      })

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryGrowth = finalMemory - initialMemory

      expect(performance.duration).toBeLessThan(5000) // Less than 5 seconds for 100 changes
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024) // Less than 50MB growth
      expect(result.current.eventHistory.length).toBeGreaterThan(0)
    })
  })

  describe('Version Restore Performance', () => {
    it('should restore large versions quickly', async () => {
      const largeVersion: Version = {
        id: 'large-v1',
        documentId: 'doc-1',
        versionNumber: 1,
        content: generateLargeContent(500), // 500KB content
        description: 'Large version',
        createdAt: new Date(),
        wordCount: 5000,
        characterCount: 500 * 1024,
        author: 'test-user',
        tags: [],
      }

      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      const performance = await measurePerformance(async () => {
        await act(async () => {
          await result.current.restoreToVersion(largeVersion)
        })
      })

      expect(performance.duration).toBeLessThan(3000) // Less than 3 seconds
      expect(result.current.documentState?.content).toBe(largeVersion.content)
      expect(result.current.versionRestoreInProgress).toBe(false)
    })

    it('should handle multiple concurrent restore attempts gracefully', async () => {
      const versions = generateVersions(10)
      
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Attempt multiple concurrent restores
      const restorePromises = versions.slice(0, 5).map(version => 
        act(async () => {
          try {
            await result.current.restoreToVersion(version)
          } catch (error) {
            // Expected for concurrent attempts
          }
        })
      )

      const performance = await measurePerformance(async () => {
        await Promise.allSettled(restorePromises)
      })

      expect(performance.duration).toBeLessThan(2000) // Less than 2 seconds
      expect(result.current.versionRestoreInProgress).toBe(false)
      // Should have restored to one of the versions
      expect(result.current.documentState?.content).toBeTruthy()
    })
  })

  describe('Event History Performance', () => {
    it('should maintain performance with large event history', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Generate large event history
      const operations: (() => Promise<void>)[] = []
      
      for (let i = 0; i < 1000; i++) {
        operations.push(async () => {
          await result.current.updateContent(`<p>Change ${i}</p>`)
        })
        
        if (i % 100 === 0) {
          operations.push(async () => {
            await result.current.saveVersion({ description: `Checkpoint ${i}` })
          })
        }
      }

      const performance = await measurePerformance(async () => {
        // Execute operations in batches to avoid overwhelming
        const batchSize = 50
        for (let i = 0; i < operations.length; i += batchSize) {
          const batch = operations.slice(i, i + batchSize)
          await Promise.all(batch.map(op => act(op)))
        }
      })

      expect(performance.duration).toBeLessThan(15000) // Less than 15 seconds
      expect(result.current.eventHistory.length).toBeGreaterThan(100) // Should have substantial history
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })

    it('should efficiently calculate content statistics', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Create substantial event history
      for (let i = 0; i < 200; i++) {
        await act(async () => {
          await result.current.updateContent(`<p>Content update ${i} with more text to analyze</p>`)
        })
      }

      const startTime = performance.now()
      
      // Access derived state multiple times to test memoization
      for (let i = 0; i < 100; i++) {
        const state = result.current.documentState
        expect(state).toBeTruthy()
      }
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(calculationTime).toBeLessThan(100) // Less than 100ms for 100 state calculations
    })
  })

  describe('Memory Management', () => {
    it('should not leak memory during long editing sessions', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      const measureMemoryUsage = async (iterations: number) => {
        const startMemory = (performance as any).memory?.usedJSHeapSize || 0
        
        for (let i = 0; i < iterations; i++) {
          await act(async () => {
            await result.current.updateContent(`<p>Edit ${i}</p>`)
          })
          
          // Occasionally save versions
          if (i % 50 === 0) {
            await act(async () => {
              await result.current.saveVersion({ description: `Save ${i}` })
            })
          }
        }
        
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0
        return endMemory - startMemory
      }

      const memoryUsage1 = await measureMemoryUsage(100)
      const memoryUsage2 = await measureMemoryUsage(100)
      
      // Memory growth should be linear, not exponential
      const growthRatio = memoryUsage2 / (memoryUsage1 || 1)
      expect(growthRatio).toBeLessThan(3) // Less than 3x growth for 2x operations
    })

    it('should handle cleanup properly on unmount', () => {
      const { result, unmount } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Create some state
      act(() => {
        result.current.updateContent('<p>Test content</p>')
      })

      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0
      
      unmount()
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc()
      }
      
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0
      
      // Memory should not increase significantly after unmount
      expect(memoryAfter - memoryBefore).toBeLessThan(1024 * 1024) // Less than 1MB
    })
  })

  describe('Debouncing and Batching Performance', () => {
    it('should efficiently batch rapid content changes', async () => {
      const { result } = renderHook(() => useDocumentEventSourcing('doc-1'))

      // Simulate rapid typing
      const rapidChanges = Array.from({ length: 1000 }, (_, i) => 
        `<p>Rapid typing change ${i}</p>`
      )

      const performance = await measurePerformance(async () => {
        const promises = rapidChanges.map(content => 
          act(async () => {
            await result.current.updateContent(content)
          })
        )
        
        await Promise.all(promises)
        
        // Wait for debouncing to complete
        await new Promise(resolve => setTimeout(resolve, 1000))
      })

      expect(performance.duration).toBeLessThan(5000) // Less than 5 seconds
      
      // Should have debounced the events significantly
      const contentEvents = result.current.eventHistory.filter(
        event => event.type === 'DOCUMENT_CONTENT_CHANGE'
      )
      expect(contentEvents.length).toBeLessThan(rapidChanges.length / 2)
    })
  })
})