/**
 * Unit Tests for Virtualized List Performance - Edge Cases (Task 8.2)
 * 
 * Test ID: UT-VL-03
 * Tests edge cases and boundary conditions for virtualized list:
 * - Dynamic item size changes
 * - Extreme dataset sizes (empty, single item, massive)
 * - Performance stress testing under load
 * - Viewport resize and orientation changes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VirtualizedSidebarList } from '../../../../src/components/sidebar/VirtualizedSidebarList'
import {
  baseVirtualListConfig,
  performanceVirtualListConfig,
  generateLargeDocumentList,
  generateLargeChainList,
  generateLargeAgentList,
  mockSidebarCallbacks,
  performanceBenchmarks,
} from '../../../fixtures/sidebar'

// Mock @tanstack/react-virtual
const mockUseVirtualizer = vi.fn()
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: mockUseVirtualizer,
}))

// Mock performance monitoring
const mockPerformanceObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}))
window.PerformanceObserver = mockPerformanceObserver

describe('VirtualizedSidebarList - Edge Cases', () => {
  const user = userEvent.setup()
  const mockVirtualizer = {
    getVirtualItems: vi.fn(() => []),
    getTotalSize: vi.fn(() => 1000),
    scrollToIndex: vi.fn(),
    scrollToOffset: vi.fn(),
    measure: vi.fn(),
    range: { startIndex: 0, endIndex: 10 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVirtualizer.mockReturnValue(mockVirtualizer)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Dynamic Item Size Changes', () => {
    it('should handle items changing size after render', async () => {
      const items = generateLargeDocumentList(10)
      let itemHeight = 60

      const DynamicHeightItem = ({ item }: any) => (
        <div 
          data-testid={`item-${item.metadata.id}`}
          style={{ height: itemHeight }}
        >
          {item.metadata.name}
        </div>
      )

      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={DynamicHeightItem}
        />
      )

      // Change item height and re-render
      itemHeight = 120

      rerender(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={DynamicHeightItem}
        />
      )

      // Should trigger re-measurement
      await waitFor(() => {
        expect(mockVirtualizer.measure).toHaveBeenCalled()
      })
    })

    it('should handle content-driven height changes', async () => {
      const items = generateLargeDocumentList(5)
      const [expandedId, setExpandedId] = [null, vi.fn()]

      const ExpandableItem = ({ item }: any) => (
        <div data-testid={`item-${item.metadata.id}`}>
          <div>{item.metadata.name}</div>
          {expandedId === item.metadata.id && (
            <div className="expanded-content" style={{ height: 200 }}>
              Expanded content with lots of details...
            </div>
          )}
        </div>
      )

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={ExpandableItem}
        />
      )

      // Simulate expansion
      act(() => {
        setExpandedId(items[0].metadata.id)
      })

      await waitFor(() => {
        expect(mockVirtualizer.measure).toHaveBeenCalled()
      })
    })

    it('should handle variable item heights within single render', () => {
      const items = [
        ...generateLargeChainList(2),
        ...generateLargeDocumentList(2),
        ...generateLargeAgentList(2),
      ]

      const VariableHeightItem = ({ item }: any) => {
        const heights = {
          chain: 80,
          document: 60,
          agent: 100,
        }
        
        return (
          <div 
            style={{ height: heights[item.type] }}
            data-testid={`item-${item.metadata.id}`}
          >
            {item.metadata.name}
          </div>
        )
      }

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={VariableHeightItem}
        />
      )

      // Should initialize with dynamic sizing
      const estimateSizeCall = mockUseVirtualizer.mock.calls[0][0]
      expect(estimateSizeCall.estimateSize).toBeDefined()
    })

    it('should handle rapid size changes during scrolling', async () => {
      const items = generateLargeDocumentList(50)
      let currentSize = 60

      const FluctuatingItem = ({ item }: any) => (
        <div style={{ height: currentSize + (Math.random() * 20) }}>
          {item.metadata.name}
        </div>
      )

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={FluctuatingItem}
        />
      )

      const viewport = screen.getByTestId('virtualized-viewport')

      // Simulate rapid scrolling with size changes
      for (let i = 0; i < 10; i++) {
        currentSize = 60 + (i * 5)
        fireEvent.scroll(viewport, { target: { scrollTop: i * 100 } })
      }

      // Should handle gracefully without errors
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })
  })

  describe('Extreme Dataset Sizes', () => {
    it('should handle completely empty dataset', () => {
      render(
        <VirtualizedSidebarList
          items={[]}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      expect(mockUseVirtualizer).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 0,
        })
      )

      const list = screen.getByTestId('virtualized-list')
      expect(list).toBeInTheDocument()
      expect(list).toBeEmptyDOMElement()
    })

    it('should handle single item dataset', () => {
      const items = generateLargeDocumentList(1)
      mockVirtualizer.getVirtualItems.mockReturnValue([
        { index: 0, start: 0, size: 60, key: 'item-0' }
      ])

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div data-testid={`item-${item.metadata.id}`}>{item.metadata.name}</div>}
        />
      )

      expect(screen.getByTestId('item-doc-perf-1')).toBeInTheDocument()
      expect(screen.getAllByRole('generic').length).toBe(1)
    })

    it('should handle massive dataset efficiently', () => {
      const massiveItems = generateLargeDocumentList(100000)
      
      const renderStart = performance.now()
      render(
        <VirtualizedSidebarList
          items={massiveItems}
          config={performanceVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )
      const renderTime = performance.now() - renderStart

      // Should still render efficiently
      expect(renderTime).toBeLessThan(500) // Should be under 500ms even for massive datasets
      expect(mockUseVirtualizer).toHaveBeenCalledWith(
        expect.objectContaining({
          count: 100000,
        })
      )
    })

    it('should handle dataset size changes from empty to large', () => {
      const { rerender } = render(
        <VirtualizedSidebarList
          items={[]}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Update to large dataset
      const largeItems = generateLargeDocumentList(1000)
      rerender(
        <VirtualizedSidebarList
          items={largeItems}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      expect(mockUseVirtualizer).toHaveBeenLastCalledWith(
        expect.objectContaining({
          count: 1000,
        })
      )
    })

    it('should handle dataset size changes from large to small', () => {
      const largeItems = generateLargeDocumentList(1000)
      const { rerender } = render(
        <VirtualizedSidebarList
          items={largeItems}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Update to small dataset
      const smallItems = generateLargeDocumentList(5)
      rerender(
        <VirtualizedSidebarList
          items={smallItems}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      expect(mockUseVirtualizer).toHaveBeenLastCalledWith(
        expect.objectContaining({
          count: 5,
        })
      )
    })
  })

  describe('Performance Stress Testing', () => {
    it('should handle rapid prop changes under load', () => {
      let items = generateLargeDocumentList(100)
      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Rapid updates simulating real-time data changes
      for (let i = 0; i < 50; i++) {
        items = generateLargeDocumentList(100 + i)
        rerender(
          <VirtualizedSidebarList
            items={items}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
            renderItem={(item) => <div>{item.metadata.name}</div>}
          />
        )
      }

      // Should remain functional
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle continuous scrolling stress test', async () => {
      const items = generateLargeDocumentList(1000)
      mockVirtualizer.range = { startIndex: 0, endIndex: 20 }

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      const viewport = screen.getByTestId('virtualized-viewport')

      // Continuous scrolling simulation
      const scrollPromises = []
      for (let i = 0; i < 100; i++) {
        scrollPromises.push(
          new Promise(resolve => {
            setTimeout(() => {
              fireEvent.scroll(viewport, { target: { scrollTop: i * 50 } })
              resolve(true)
            }, i * 10)
          })
        )
      }

      await Promise.all(scrollPromises)

      // Should handle without performance degradation
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should maintain performance during rapid resize events', () => {
      const items = generateLargeDocumentList(500)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Simulate rapid resize events
      for (let i = 0; i < 20; i++) {
        act(() => {
          Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 800 + i * 10,
          })
          window.dispatchEvent(new Event('resize'))
        })
      }

      // Should handle gracefully
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle memory pressure during stress testing', () => {
      // Mock memory pressure scenario
      const mockMemoryInfo = {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 100 * 1024 * 1024, // 100MB limit
      }

      Object.defineProperty(performance, 'memory', {
        value: mockMemoryInfo,
        writable: true,
      })

      const items = generateLargeDocumentList(2000)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onMemoryPressure={mockSidebarCallbacks.onMemoryPressure}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Simulate memory pressure
      mockMemoryInfo.usedJSHeapSize = 90 * 1024 * 1024 // 90MB used

      act(() => {
        window.dispatchEvent(new Event('memoryPressure'))
      })

      expect(mockSidebarCallbacks.onMemoryPressure).toHaveBeenCalled()
    })
  })

  describe('Viewport and Orientation Changes', () => {
    it('should handle viewport resize from desktop to mobile', () => {
      const items = generateLargeDocumentList(50)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Simulate resize to mobile viewport
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375, // iPhone viewport
        })
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 667,
        })
        window.dispatchEvent(new Event('resize'))
      })

      const list = screen.getByTestId('virtualized-list')
      expect(list).toHaveAttribute('data-viewport-size', 'mobile')
    })

    it('should handle orientation changes', async () => {
      const items = generateLargeDocumentList(30)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Simulate orientation change
      act(() => {
        Object.defineProperty(screen, 'orientation', {
          value: { angle: 90, type: 'landscape-primary' },
          writable: true,
        })
        window.dispatchEvent(new Event('orientationchange'))
      })

      await waitFor(() => {
        expect(mockVirtualizer.measure).toHaveBeenCalled()
      })
    })

    it('should handle zoom level changes', () => {
      const items = generateLargeDocumentList(20)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Simulate zoom change
      act(() => {
        Object.defineProperty(window, 'devicePixelRatio', {
          writable: true,
          configurable: true,
          value: 2.0, // 200% zoom
        })
        window.dispatchEvent(new Event('resize'))
      })

      const list = screen.getByTestId('virtualized-list')
      expect(list).toHaveAttribute('data-pixel-ratio', '2')
    })

    it('should handle very narrow viewport constraints', () => {
      const items = generateLargeDocumentList(10)
      
      // Mock extremely narrow viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 200, // Very narrow
      })

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      const list = screen.getByTestId('virtualized-list')
      expect(list).toHaveAttribute('data-viewport-constrained', 'true')
    })
  })

  describe('Timing and Synchronization Edge Cases', () => {
    it('should handle async renderItem functions', async () => {
      const items = generateLargeDocumentList(5)
      const asyncRenderItem = vi.fn().mockImplementation(async (item) => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return <div data-testid={`item-${item.metadata.id}`}>{item.metadata.name}</div>
      })

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={asyncRenderItem}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('item-doc-perf-1')).toBeInTheDocument()
      })
    })

    it('should handle race conditions during rapid updates', async () => {
      let items = generateLargeDocumentList(10)
      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div data-testid={`item-${item.metadata.id}`}>{item.metadata.name}</div>}
        />
      )

      // Rapid updates that could cause race conditions
      const updates = []
      for (let i = 0; i < 10; i++) {
        updates.push(
          new Promise(resolve => {
            setTimeout(() => {
              items = generateLargeDocumentList(10 + i)
              rerender(
                <VirtualizedSidebarList
                  items={items}
                  config={baseVirtualListConfig}
                  onItemClick={mockSidebarCallbacks.onItemSelect}
                  renderItem={(item) => <div data-testid={`item-${item.metadata.id}`}>{item.metadata.name}</div>}
                />
              )
              resolve(true)
            }, i * 10)
          })
        )
      }

      await Promise.all(updates)

      // Should handle race conditions gracefully
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle concurrent scroll and data updates', async () => {
      const items = generateLargeDocumentList(100)
      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      const viewport = screen.getByTestId('virtualized-viewport')

      // Concurrent operations
      await Promise.all([
        // Continuous scrolling
        new Promise(resolve => {
          let scrollPosition = 0
          const scrollInterval = setInterval(() => {
            scrollPosition += 50
            fireEvent.scroll(viewport, { target: { scrollTop: scrollPosition } })
            if (scrollPosition > 500) {
              clearInterval(scrollInterval)
              resolve(true)
            }
          }, 50)
        }),
        
        // Concurrent data updates
        new Promise(resolve => {
          setTimeout(() => {
            const newItems = generateLargeDocumentList(120)
            rerender(
              <VirtualizedSidebarList
                items={newItems}
                config={baseVirtualListConfig}
                onItemClick={mockSidebarCallbacks.onItemSelect}
                renderItem={(item) => <div>{item.metadata.name}</div>}
              />
            )
            resolve(true)
          }, 200)
        })
      ])

      // Should complete without errors
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle component unmount during virtualization operations', () => {
      const items = generateLargeDocumentList(50)
      
      const { unmount } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Start scroll operation and immediately unmount
      const viewport = screen.getByTestId('virtualized-viewport')
      fireEvent.scroll(viewport, { target: { scrollTop: 500 } })
      
      // Should not throw on unmount
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Accessibility Edge Cases', () => {
    it('should maintain focus during virtual item changes', async () => {
      const items = generateLargeDocumentList(20)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => (
            <button data-testid={`item-${item.metadata.id}`}>
              {item.metadata.name}
            </button>
          )}
        />
      )

      const firstItem = screen.getByTestId('item-doc-perf-1')
      firstItem.focus()
      expect(firstItem).toHaveFocus()

      // Scroll to cause virtual items to change
      const viewport = screen.getByTestId('virtualized-viewport')
      fireEvent.scroll(viewport, { target: { scrollTop: 300 } })

      // Focus should be managed appropriately
      await waitFor(() => {
        const focusedElement = document.activeElement
        expect(focusedElement).toBeTruthy()
      })
    })

    it('should handle screen reader navigation with virtual items', async () => {
      const items = generateLargeDocumentList(30)
      
      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item, { index }) => (
            <div 
              role="option"
              aria-setsize={items.length}
              aria-posinset={index + 1}
              data-testid={`item-${item.metadata.id}`}
            >
              {item.metadata.name}
            </div>
          )}
        />
      )

      const list = screen.getByTestId('virtualized-list')
      expect(list).toHaveAttribute('role', 'listbox')
      expect(list).toHaveAttribute('aria-label', expect.stringContaining('30 items'))
    })

    it('should announce dynamic content changes to screen readers', () => {
      const items = generateLargeDocumentList(5)
      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Add more items
      const moreItems = generateLargeDocumentList(10)
      rerender(
        <VirtualizedSidebarList
          items={moreItems}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          renderItem={(item) => <div>{item.metadata.name}</div>}
        />
      )

      // Should have live region for announcements
      const liveRegion = screen.getByLabelText(/items updated/i)
      expect(liveRegion).toHaveTextContent('10 items')
    })
  })
})