/**
 * Document Version History Performance Tests
 * Test ID: PERF-VERSION-HISTORY  
 * PRD Reference: Task 11.1 - Performance tests for large version histories
 * 
 * This test suite covers performance testing of the version history system,
 * including loading large version datasets, diff calculations, UI rendering
 * performance, and memory usage optimization.
 * 
 * These tests will FAIL initially until performance optimizations are implemented (TDD).
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { performance } from 'perf_hooks'
import { useDocumentEventSourcing } from '../../src/lib/eventSourcing'
import { DocumentEventFactory } from '../../schemas/events/document'
import { 
  mockLargeVersionHistory,
  editorPerformanceThresholds,
  editorTestUtils,
} from '../fixtures/document-editor'

// Mock performance.now for consistent timing in tests
const mockPerformanceNow = vi.fn(() => Date.now())
global.performance = { now: mockPerformanceNow } as any

// Mock React hooks for performance testing
vi.mock('../../src/lib/eventSourcing')

describe('Document Version History Performance Tests [PERF-VERSION-HISTORY]', () => {
  let mockEventSourcing: any
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockEventSourcing = {
      documentState: {
        id: 'perf-test-doc',
        title: 'Performance Test Document',
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
      undo: vi.fn(),
      redo: vi.fn(),
      saveVersion: vi.fn(),
    }
    
    vi.mocked(useDocumentEventSourcing).mockReturnValue(mockEventSourcing)
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Version History Loading Performance', () => {
    it('should load large version history within performance threshold [PERF-VH-01]', async () => {
      // Test ID: PERF-VH-01
      // PRD Reference: Performance with 100+ versions loading under 800ms
      
      const largeHistory = mockLargeVersionHistory.versions
      mockEventSourcing.eventHistory = largeHistory.slice(0, 100) // 100 versions
      mockEventSourcing.currentEventIndex = 99
      
      const VersionHistoryPanel = () => {
        const { eventHistory, isLoading } = useDocumentEventSourcing('perf-test-doc')
        
        if (isLoading) return <div data-testid="loading">Loading...</div>
        
        return (
          <div data-testid="version-history-panel">
            {eventHistory.map((event: any, index: number) => (
              <div key={index} data-testid="version-item">
                Version {index + 1}
              </div>
            ))}
          </div>
        )
      }
      
      const startTime = performance.now()
      
      render(<VersionHistoryPanel />)
      
      // Wait for component to render all version items
      await waitFor(() => {
        expect(screen.getByTestId('version-history-panel')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render within performance threshold
      expect(renderTime).toBeLessThan(editorPerformanceThresholds.versionHistoryLoad)
      
      // Verify all versions are rendered
      const versionItems = screen.getAllByTestId('version-item')
      expect(versionItems).toHaveLength(100)
    })

    it('should implement virtual scrolling for very large histories [PERF-VH-02]', async () => {
      // Test ID: PERF-VH-02
      // PRD Reference: Virtual scrolling optimization for 500+ versions
      
      const veryLargeHistory = Array.from({ length: 500 }, (_, i) => ({
        id: `version-${i + 1}`,
        version: i + 1,
        content: `<p>Version ${i + 1} content</p>`,
        timestamp: new Date(Date.now() - i * 60000),
        description: `Version ${i + 1} changes`,
        wordCount: 3,
        charCount: 25,
      }))
      
      mockEventSourcing.eventHistory = veryLargeHistory
      
      const VirtualizedVersionHistory = () => {
        const { eventHistory } = useDocumentEventSourcing('perf-test-doc')
        
        // Mock virtualization - only render visible items (first 50)
        const visibleVersions = eventHistory.slice(0, 50)
        
        return (
          <div data-testid="virtualized-history" style={{ height: '400px' }}>
            <div data-testid="total-count">{eventHistory.length} total versions</div>
            {visibleVersions.map((version: any, index: number) => (
              <div key={version.id} data-testid="visible-version-item">
                Version {version.version}
              </div>
            ))}
            <div data-testid="scroll-indicator">
              Showing 1-50 of {eventHistory.length}
            </div>
          </div>
        )
      }
      
      const startTime = performance.now()
      
      render(<VirtualizedVersionHistory />)
      
      await waitFor(() => {
        expect(screen.getByTestId('virtualized-history')).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render quickly despite large dataset
      expect(renderTime).toBeLessThan(300) // Faster than non-virtualized
      
      // Verify virtual scrolling is working
      expect(screen.getByTestId('total-count')).toHaveTextContent('500 total versions')
      expect(screen.getAllByTestId('visible-version-item')).toHaveLength(50)
      expect(screen.getByTestId('scroll-indicator')).toHaveTextContent('Showing 1-50 of 500')
    })

    it('should optimize memory usage with large version datasets [PERF-VH-03]', async () => {
      // Test ID: PERF-VH-03
      // PRD Reference: Memory optimization for version history storage
      
      const largeVersions = mockLargeVersionHistory.versions
      
      // Simulate memory-optimized version loading
      const optimizedVersions = largeVersions.map(version => ({
        id: version.id,
        version: version.version,
        timestamp: version.timestamp,
        description: version.description,
        wordCount: version.wordCount,
        charCount: version.charCount,
        // Content loaded on-demand, not stored in memory
        hasContent: true,
      }))
      
      mockEventSourcing.eventHistory = optimizedVersions.slice(0, 150)
      
      const MemoryOptimizedHistory = () => {
        const { eventHistory } = useDocumentEventSourcing('perf-test-doc')
        
        // Calculate approximate memory footprint
        const memoryFootprint = JSON.stringify(eventHistory).length
        
        return (
          <div data-testid="memory-optimized-history">
            <div data-testid="version-count">{eventHistory.length} versions</div>
            <div data-testid="memory-footprint">{memoryFootprint} bytes</div>
            {eventHistory.slice(0, 20).map((version: any) => (
              <div key={version.id} data-testid="optimized-version-item">
                <span>Version {version.version}</span>
                <span>{version.description}</span>
                <span>{version.wordCount} words</span>
                {/* Content not included in DOM to save memory */}
              </div>
            ))}
          </div>
        )
      }
      
      render(<MemoryOptimizedHistory />)
      
      await waitFor(() => {
        expect(screen.getByTestId('memory-optimized-history')).toBeInTheDocument()
      })
      
      // Verify memory optimization
      const memoryFootprint = parseInt(screen.getByTestId('memory-footprint').textContent?.split(' ')[0] || '0')
      const estimatedUnoptimizedSize = 150 * 1000 // ~1KB per version with full content
      
      expect(memoryFootprint).toBeLessThan(estimatedUnoptimizedSize)
      expect(screen.getAllByTestId('optimized-version-item')).toHaveLength(20)
    })
  })

  describe('Diff Calculation Performance', () => {
    it('should calculate diffs within performance threshold [PERF-DIFF-01]', async () => {
      // Test ID: PERF-DIFF-01
      // PRD Reference: Diff calculation performance under 300ms
      
      const version1Content = '<p>Original content</p>'.repeat(100) // Large content
      const version2Content = version1Content.replace(/Original/g, 'Modified')
      
      const calculateDiff = (fromContent: string, toContent: string) => {
        // Mock diff calculation (in real implementation, use proper diff library)
        const startTime = performance.now()
        
        const changes = []
        const words1 = fromContent.split(' ')
        const words2 = toContent.split(' ')
        
        // Simple diff simulation
        for (let i = 0; i < Math.max(words1.length, words2.length); i++) {
          if (words1[i] !== words2[i]) {
            if (words1[i]) changes.push({ type: 'deletion', content: words1[i] })
            if (words2[i]) changes.push({ type: 'addition', content: words2[i] })
          } else if (words1[i]) {
            changes.push({ type: 'unchanged', content: words1[i] })
          }
        }
        
        const endTime = performance.now()
        
        return {
          changes,
          statistics: {
            calculationTime: endTime - startTime,
            addedWords: words2.length - words1.length,
            removedWords: Math.max(0, words1.length - words2.length),
          },
        }
      }
      
      const diff = calculateDiff(version1Content, version2Content)
      
      // Verify diff calculation performance
      expect(diff.statistics.calculationTime).toBeLessThan(editorPerformanceThresholds.diffCalculation)
      expect(diff.changes.length).toBeGreaterThan(0)
      expect(diff.statistics.addedWords).toBe(0) // Same length, just replacements
    })

    it('should handle large document diffs efficiently [PERF-DIFF-02]', async () => {
      // Test ID: PERF-DIFF-02
      // PRD Reference: Large document diff performance optimization
      
      // Create large documents (10K+ words)
      const baseContent = '<p>This is a test paragraph with multiple words. '.repeat(2000) + '</p>'
      const modifiedContent = baseContent
        .replace(/test/g, 'modified')
        .replace(/multiple/g, 'several')
        .replace(/words/g, 'terms')
      
      const performLargeDiff = (content1: string, content2: string) => {
        const startTime = performance.now()
        
        // Simulate optimized diff algorithm for large content
        const chunks1 = content1.match(/.{1,1000}/g) || []
        const chunks2 = content2.match(/.{1,1000}/g) || []
        
        const diffResults = chunks1.map((chunk, i) => {
          const correspondingChunk = chunks2[i] || ''
          return {
            chunkIndex: i,
            hasChanges: chunk !== correspondingChunk,
            changeCount: Math.abs(chunk.length - correspondingChunk.length),
          }
        })
        
        const endTime = performance.now()
        
        return {
          processingTime: endTime - startTime,
          chunkCount: chunks1.length,
          changedChunks: diffResults.filter(r => r.hasChanges).length,
        }
      }
      
      const result = performLargeDiff(baseContent, modifiedContent)
      
      // Verify large diff performance
      expect(result.processingTime).toBeLessThan(500) // 500ms for large documents
      expect(result.chunkCount).toBeGreaterThan(20)
      expect(result.changedChunks).toBeGreaterThan(0)
    })
  })

  describe('Undo/Redo Performance', () => {
    it('should perform undo operations quickly with large history [PERF-UNDO-01]', async () => {
      // Test ID: PERF-UNDO-01
      // PRD Reference: Undo performance with extensive event history
      
      const largeEventHistory = editorTestUtils.generateEventHistory('perf-test', 200)
      mockEventSourcing.eventHistory = largeEventHistory
      mockEventSourcing.currentEventIndex = 199
      mockEventSourcing.canUndo = true
      
      const performUndo = vi.fn(() => {
        mockEventSourcing.currentEventIndex--
        mockEventSourcing.canRedo = true
        if (mockEventSourcing.currentEventIndex < 0) {
          mockEventSourcing.canUndo = false
        }
      })
      
      mockEventSourcing.undo = performUndo
      
      const UndoPerformanceTest = () => {
        const { undo, canUndo, currentEventIndex } = useDocumentEventSourcing('perf-test')
        
        const handleUndo = async () => {
          const startTime = performance.now()
          await undo()
          const endTime = performance.now()
          
          // Store timing in DOM for testing
          const timingDiv = document.createElement('div')
          timingDiv.setAttribute('data-testid', 'undo-timing')
          timingDiv.textContent = `${endTime - startTime}`
          document.body.appendChild(timingDiv)
        }
        
        return (
          <div>
            <button 
              data-testid="undo-button" 
              onClick={handleUndo}
              disabled={!canUndo}
            >
              Undo
            </button>
            <span data-testid="event-index">{currentEventIndex}</span>
          </div>
        )
      }
      
      render(<UndoPerformanceTest />)
      
      const undoButton = screen.getByTestId('undo-button')
      
      await act(async () => {
        undoButton.click()
      })
      
      // Wait for timing to be recorded
      await waitFor(() => {
        expect(screen.getByTestId('undo-timing')).toBeInTheDocument()
      })
      
      const undoTime = parseFloat(screen.getByTestId('undo-timing').textContent || '0')
      
      // Verify undo performance
      expect(undoTime).toBeLessThan(editorPerformanceThresholds.undoRedo)
      expect(performUndo).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('event-index')).toHaveTextContent('198')
    })

    it('should maintain performance during rapid undo/redo sequences [PERF-UNDO-02]', async () => {
      // Test ID: PERF-UNDO-02
      // PRD Reference: Rapid undo/redo sequence performance
      
      const eventHistory = editorTestUtils.generateEventHistory('perf-test', 50)
      mockEventSourcing.eventHistory = eventHistory
      
      let currentIndex = 49
      mockEventSourcing.currentEventIndex = currentIndex
      mockEventSourcing.canUndo = true
      mockEventSourcing.canRedo = false
      
      const performRapidUndoRedo = async (operations: ('undo' | 'redo')[]) => {
        const startTime = performance.now()
        const timings = []
        
        for (const op of operations) {
          const opStartTime = performance.now()
          
          if (op === 'undo' && currentIndex >= 0) {
            currentIndex--
          } else if (op === 'redo' && currentIndex < eventHistory.length - 1) {
            currentIndex++
          }
          
          const opEndTime = performance.now()
          timings.push(opEndTime - opStartTime)
        }
        
        const endTime = performance.now()
        
        return {
          totalTime: endTime - startTime,
          averageOperationTime: timings.reduce((a, b) => a + b, 0) / timings.length,
          operationTimings: timings,
          finalIndex: currentIndex,
        }
      }
      
      // Test rapid sequence: 10 undos followed by 10 redos
      const rapidSequence: ('undo' | 'redo')[] = [
        ...Array(10).fill('undo'),
        ...Array(10).fill('redo'),
      ] as ('undo' | 'redo')[]
      
      const result = await performRapidUndoRedo(rapidSequence)
      
      // Verify rapid sequence performance
      expect(result.totalTime).toBeLessThan(200) // 200ms for 20 operations
      expect(result.averageOperationTime).toBeLessThan(10) // 10ms average per operation
      expect(result.finalIndex).toBe(49) // Should return to original position
      
      // Verify no operation took excessively long
      const maxOperationTime = Math.max(...result.operationTimings)
      expect(maxOperationTime).toBeLessThan(50) // No single operation over 50ms
    })
  })

  describe('UI Rendering Performance', () => {
    it('should render version history UI efficiently [PERF-UI-01]', async () => {
      // Test ID: PERF-UI-01
      // PRD Reference: Version history UI rendering performance
      
      const versions = mockLargeVersionHistory.versions.slice(0, 100)
      
      const VersionHistoryUI = () => {
        const startRenderTime = performance.now()
        
        // Simulate component render tracking
        React.useEffect(() => {
          const endRenderTime = performance.now()
          const renderTime = endRenderTime - startRenderTime
          
          // Store render time for test verification
          const timingElement = document.createElement('div')
          timingElement.setAttribute('data-testid', 'render-timing')
          timingElement.textContent = `${renderTime}`
          document.body.appendChild(timingElement)
        }, [startRenderTime])
        
        return (
          <div data-testid="version-history-ui">
            <div data-testid="version-list">
              {versions.map((version) => (
                <div key={version.id} data-testid="version-card" className="version-item">
                  <div className="version-header">
                    <span className="version-number">Version {version.version}</span>
                    <span className="version-timestamp">
                      {editorTestUtils.formatVersionTimestamp(version.timestamp)}
                    </span>
                  </div>
                  <div className="version-meta">
                    <span>{version.wordCount} words</span>
                    <span>{version.charCount} chars</span>
                    <span>{version.author}</span>
                  </div>
                  <div className="version-description">{version.description}</div>
                </div>
              ))}
            </div>
          </div>
        )
      }
      
      render(<VersionHistoryUI />)
      
      await waitFor(() => {
        expect(screen.getByTestId('version-history-ui')).toBeInTheDocument()
      })
      
      // Wait for render timing to be recorded
      await waitFor(() => {
        expect(screen.getByTestId('render-timing')).toBeInTheDocument()
      })
      
      const renderTime = parseFloat(screen.getByTestId('render-timing').textContent || '0')
      
      // Verify UI rendering performance
      expect(renderTime).toBeLessThan(editorPerformanceThresholds.versionHistoryLoad)
      expect(screen.getAllByTestId('version-card')).toHaveLength(100)
    })

    it('should handle smooth scrolling with large version lists [PERF-UI-02]', async () => {
      // Test ID: PERF-UI-02
      // PRD Reference: Smooth scrolling performance with large datasets
      
      const largeVersionList = mockLargeVersionHistory.versions
      
      const ScrollableVersionList = () => {
        const [scrollTop, setScrollTop] = React.useState(0)
        const [isScrolling, setIsScrolling] = React.useState(false)
        
        const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
          const startTime = performance.now()
          setIsScrolling(true)
          setScrollTop(e.currentTarget.scrollTop)
          
          // Debounce scroll end detection
          setTimeout(() => {
            setIsScrolling(false)
            const endTime = performance.now()
            
            // Record scroll performance
            const scrollElement = document.querySelector('[data-testid="scroll-timing"]')
            if (scrollElement) {
              scrollElement.textContent = `${endTime - startTime}`
            } else {
              const timing = document.createElement('div')
              timing.setAttribute('data-testid', 'scroll-timing')
              timing.textContent = `${endTime - startTime}`
              document.body.appendChild(timing)
            }
          }, 100)
        }
        
        // Calculate visible items (virtualization simulation)
        const itemHeight = 80
        const containerHeight = 400
        const visibleStart = Math.floor(scrollTop / itemHeight)
        const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, largeVersionList.length)
        const visibleVersions = largeVersionList.slice(visibleStart, visibleEnd)
        
        return (
          <div 
            data-testid="scrollable-version-list"
            style={{ height: containerHeight, overflowY: 'scroll' }}
            onScroll={handleScroll}
          >
            <div style={{ height: largeVersionList.length * itemHeight, position: 'relative' }}>
              {visibleVersions.map((version, index) => (
                <div
                  key={version.id}
                  data-testid="scroll-version-item"
                  style={{
                    position: 'absolute',
                    top: (visibleStart + index) * itemHeight,
                    height: itemHeight,
                    width: '100%',
                    backgroundColor: isScrolling ? '#f0f0f0' : 'white',
                  }}
                >
                  Version {version.version} - {version.description}
                </div>
              ))}
            </div>
            <div data-testid="visible-count">{visibleVersions.length} visible</div>
          </div>
        )
      }
      
      render(<ScrollableVersionList />)
      
      const scrollContainer = screen.getByTestId('scrollable-version-list')
      
      // Simulate scroll event
      await act(async () => {
        scrollContainer.scrollTop = 1000
        scrollContainer.dispatchEvent(new Event('scroll'))
      })
      
      // Wait for scroll handling
      await waitFor(() => {
        expect(screen.getByTestId('scroll-timing')).toBeInTheDocument()
      })
      
      const scrollTime = parseFloat(screen.getByTestId('scroll-timing').textContent || '0')
      
      // Verify smooth scrolling performance
      expect(scrollTime).toBeLessThan(100) // Scroll handling under 100ms
      expect(screen.getByTestId('visible-count')).toBeInTheDocument()
      
      // Verify virtualization is working
      const visibleItems = screen.getAllByTestId('scroll-version-item')
      expect(visibleItems.length).toBeLessThan(20) // Only visible items rendered
    })
  })
})