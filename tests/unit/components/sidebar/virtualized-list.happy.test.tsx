/**
 * Unit Tests for Virtualized List Performance (Task 8.2) - Happy Path
 * 
 * TDD tests for @tanstack/react-virtual integration and large dataset rendering.
 * These are FAILING tests that define expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VirtualizedSidebarList } from '../../../../src/components/sidebar/VirtualizedSidebarList'
import {
  baseVirtualListConfig,
  performanceVirtualListConfig,
  generateLargeChainList,
  generateLargeDocumentList,
  generateLargeAgentList,
  mockSidebarCallbacks,
  performanceBenchmarks,
} from '../../../fixtures/sidebar'

describe('Virtualized List Performance - Happy Path', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock performance.now for timing tests
    vi.stubGlobal('performance', {
      now: vi.fn(() => Date.now())
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Initial Rendering with @tanstack/react-virtual', () => {
    it('should render virtualized container with proper setup', () => {
      const items = generateLargeChainList(100)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const virtualContainer = screen.getByTestId('virtualized-list-container')
      expect(virtualContainer).toBeInTheDocument()
      expect(virtualContainer).toHaveAttribute('data-virtualized', 'true')
    })

    it('should initialize with correct virtual window dimensions', () => {
      const items = generateLargeChainList(1000)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      expect(scrollContainer).toHaveStyle({
        height: expect.stringMatching(/\d+px/),
        overflow: 'auto',
      })

      // Should calculate total height based on item count and item height
      const expectedTotalHeight = 1000 * baseVirtualListConfig.itemHeight
      const virtualSizer = screen.getByTestId('virtual-sizer')
      expect(virtualSizer).toHaveStyle({
        height: `${expectedTotalHeight}px`,
      })
    })

    it('should render only visible items initially (overscan included)', () => {
      const items = generateLargeChainList(1000)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      // Should render visible items + overscan
      const renderedItems = screen.getAllByTestId(/^virtual-item-/)
      const expectedVisibleCount = Math.ceil(400 / baseVirtualListConfig.itemHeight) + (baseVirtualListConfig.overscan * 2)
      
      expect(renderedItems.length).toBeLessThanOrEqual(expectedVisibleCount)
      expect(renderedItems.length).toBeGreaterThan(0)
    })

    it('should apply correct positioning to virtual items', () => {
      const items = generateLargeChainList(100)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const firstItem = screen.getByTestId('virtual-item-0')
      expect(firstItem).toHaveStyle({
        position: 'absolute',
        top: '0px',
        height: `${baseVirtualListConfig.itemHeight}px`,
      })

      const secondItem = screen.getByTestId('virtual-item-1')
      expect(secondItem).toHaveStyle({
        position: 'absolute',
        top: `${baseVirtualListConfig.itemHeight}px`,
        height: `${baseVirtualListConfig.itemHeight}px`,
      })
    })
  })

  describe('Large Dataset Performance', () => {
    it('should handle 1000+ chain items with smooth performance', async () => {
      const largeDataset = generateLargeChainList(1500)
      const startTime = performance.now()

      render(
        <VirtualizedSidebarList
          items={largeDataset}
          config={performanceVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(performanceBenchmarks.virtualListRendering.largeList.expectedRenderTime)

      // Should only render visible items, not all 1500
      const renderedItems = screen.getAllByTestId(/^virtual-item-/)
      expect(renderedItems.length).toBeLessThan(100) // Much less than total count
    })

    it('should handle 2000+ document items efficiently', async () => {
      const largeDocumentDataset = generateLargeDocumentList(2000)

      const { container } = render(
        <VirtualizedSidebarList
          items={largeDocumentDataset}
          config={performanceVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      // Memory usage should be reasonable (check DOM node count)
      const domNodes = container.querySelectorAll('*')
      expect(domNodes.length).toBeLessThan(500) // Should not render all 2000 items as DOM nodes
    })

    it('should maintain performance during rapid scrolling', async () => {
      const largeDataset = generateLargeAgentList(1000)

      render(
        <VirtualizedSidebarList
          items={largeDataset}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')

      // Simulate rapid scrolling
      const scrollHeight = 1000 * baseVirtualListConfig.itemHeight
      for (let i = 0; i < 10; i++) {
        const scrollTop = (scrollHeight / 10) * i
        fireEvent.scroll(scrollContainer, { target: { scrollTop } })
        
        // Should update visible items without lag
        await waitFor(() => {
          const renderedItems = screen.getAllByTestId(/^virtual-item-/)
          expect(renderedItems.length).toBeGreaterThan(0)
        }, { timeout: 50 })
      }
    })
  })

  describe('Scroll Position and Viewport Management', () => {
    it('should update visible range when scrolling vertically', async () => {
      const items = generateLargeChainList(500)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
          onVisibleRangeChange={mockSidebarCallbacks.onScrollToIndex}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')

      // Scroll to middle of list
      const middleScrollTop = (500 * baseVirtualListConfig.itemHeight) / 2
      fireEvent.scroll(scrollContainer, { target: { scrollTop: middleScrollTop } })

      await waitFor(() => {
        expect(mockSidebarCallbacks.onScrollToIndex).toHaveBeenCalledWith(
          expect.objectContaining({
            startIndex: expect.any(Number),
            endIndex: expect.any(Number),
          })
        )
      })

      // Should render items from middle range, not from beginning
      const firstVisibleItem = screen.getAllByTestId(/^virtual-item-/)[0]
      const itemIndex = parseInt(firstVisibleItem.getAttribute('data-index') || '0')
      expect(itemIndex).toBeGreaterThan(0)
    })

    it('should handle smooth scrolling to specific index', async () => {
      const items = generateLargeChainList(1000)

      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const targetIndex = 500

      // Update props to scroll to index
      rerender(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          scrollToIndex={targetIndex}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      await waitFor(() => {
        // Should show item at target index
        const targetItem = screen.getByTestId(`virtual-item-${targetIndex}`)
        expect(targetItem).toBeInTheDocument()
      })
    })

    it('should preserve scroll position during data updates', async () => {
      let items = generateLargeChainList(500)

      const { rerender } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')

      // Scroll to specific position
      const scrollTop = 5000
      fireEvent.scroll(scrollContainer, { target: { scrollTop } })

      // Update items (simulate data refresh)
      items = generateLargeChainList(500)
      rerender(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      // Should maintain scroll position
      await waitFor(() => {
        expect(scrollContainer.scrollTop).toBe(scrollTop)
      })
    })
  })

  describe('Item Recycling and Memory Management', () => {
    it('should reuse DOM elements when scrolling (item recycling)', async () => {
      const items = generateLargeChainList(1000)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      
      // Get initial rendered item count
      const initialItems = screen.getAllByTestId(/^virtual-item-/)
      const initialItemCount = initialItems.length

      // Scroll significantly
      fireEvent.scroll(scrollContainer, { 
        target: { scrollTop: 10000 } 
      })

      await waitFor(() => {
        const newItems = screen.getAllByTestId(/^virtual-item-/)
        
        // Should maintain similar item count (recycling)
        expect(newItems.length).toBeCloseTo(initialItemCount, 2)
        
        // But should show different data
        const newFirstItem = newItems[0]
        const newItemIndex = parseInt(newFirstItem.getAttribute('data-index') || '0')
        expect(newItemIndex).toBeGreaterThan(100) // Should be much further down
      })
    })

    it('should handle cache size limits efficiently', () => {
      const items = generateLargeChainList(5000)

      render(
        <VirtualizedSidebarList
          items={items}
          config={{
            ...baseVirtualListConfig,
            maxCacheSize: 100, // Small cache for testing
          }}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const virtualContainer = screen.getByTestId('virtualized-list-container')
      expect(virtualContainer).toHaveAttribute('data-cache-size', expect.stringMatching(/\d+/))
    })

    it('should cleanup resources on unmount', () => {
      const items = generateLargeChainList(1000)

      const { unmount } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      // Mock ResizeObserver cleanup
      const mockDisconnect = vi.fn()
      vi.stubGlobal('ResizeObserver', class MockResizeObserver {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = mockDisconnect
      })

      unmount()

      // Should cleanup observers
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('Different Item Types and Heights', () => {
    it('should handle mixed item types in same virtual list', () => {
      const mixedItems = [
        ...generateLargeChainList(200),
        ...generateLargeDocumentList(200),
        ...generateLargeAgentList(200),
      ]

      render(
        <VirtualizedSidebarList
          items={mixedItems}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      // Should render different item types
      const chainItems = screen.getAllByTestId(/^virtual-item-.*chain/)
      const documentItems = screen.getAllByTestId(/^virtual-item-.*document/)
      const agentItems = screen.getAllByTestId(/^virtual-item-.*agent/)

      expect(chainItems.length + documentItems.length + agentItems.length).toBeGreaterThan(0)
    })

    it('should support dynamic item heights', async () => {
      const items = generateLargeChainList(100)

      render(
        <VirtualizedSidebarList
          items={items}
          config={{
            ...baseVirtualListConfig,
            itemHeight: 'dynamic', // Enable dynamic heights
          }}
          getItemHeight={(index) => {
            // Vary heights based on content
            return items[index].metadata.description ? 80 : 60
          }}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const virtualItems = screen.getAllByTestId(/^virtual-item-/)
      
      // Should apply different heights to different items
      const itemHeights = virtualItems.map(item => 
        parseInt(getComputedStyle(item).height)
      )
      
      const uniqueHeights = new Set(itemHeights)
      expect(uniqueHeights.size).toBeGreaterThan(1) // Should have different heights
    })

    it('should handle empty items or null data gracefully', () => {
      const itemsWithEmpties = [
        ...generateLargeChainList(50),
        null,
        undefined,
        ...generateLargeDocumentList(50),
      ]

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={itemsWithEmpties}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
            onItemHover={mockSidebarCallbacks.onItemHover}
          />
        )
      }).not.toThrow()

      // Should render valid items and skip invalid ones
      const renderedItems = screen.getAllByTestId(/^virtual-item-/)
      expect(renderedItems.length).toBeGreaterThan(0)
    })
  })

  describe('Event Handling in Virtual Environment', () => {
    it('should handle click events on virtual items correctly', async () => {
      const items = generateLargeChainList(100)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const firstItem = screen.getByTestId('virtual-item-0')
      await user.click(firstItem)

      expect(mockSidebarCallbacks.onItemSelect).toHaveBeenCalledWith(
        items[0],
        0
      )
    })

    it('should handle hover events for virtual items', async () => {
      const items = generateLargeChainList(100)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const firstItem = screen.getByTestId('virtual-item-0')
      await user.hover(firstItem)

      expect(mockSidebarCallbacks.onItemHover).toHaveBeenCalledWith(
        items[0],
        0
      )
    })

    it('should handle keyboard navigation in virtual list', async () => {
      const items = generateLargeChainList(100)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
          onKeyNavigation={mockSidebarCallbacks.onScrollToIndex}
        />
      )

      const virtualContainer = screen.getByTestId('virtualized-list-container')
      virtualContainer.focus()

      // Navigate down with arrow keys
      await user.keyboard('{ArrowDown}')
      await user.keyboard('{ArrowDown}')

      expect(mockSidebarCallbacks.onScrollToIndex).toHaveBeenCalledWith(
        expect.objectContaining({
          focusedIndex: 2,
        })
      )
    })

    it('should handle rapid event sequences without performance degradation', async () => {
      const items = generateLargeChainList(1000)

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')

      // Rapidly fire scroll events
      const startTime = performance.now()
      for (let i = 0; i < 100; i++) {
        fireEvent.scroll(scrollContainer, { 
          target: { scrollTop: i * 100 } 
        })
      }
      const eventTime = performance.now() - startTime

      // Should handle events efficiently
      expect(eventTime).toBeLessThan(100) // Should complete within 100ms
    })
  })

  describe('Configuration and Customization', () => {
    it('should respect overscan configuration', () => {
      const items = generateLargeChainList(1000)
      const customOverscan = 10

      render(
        <VirtualizedSidebarList
          items={items}
          config={{
            ...baseVirtualListConfig,
            overscan: customOverscan,
          }}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const renderedItems = screen.getAllByTestId(/^virtual-item-/)
      
      // Should render visible + overscan items
      const expectedVisible = Math.ceil(400 / baseVirtualListConfig.itemHeight)
      const expectedWithOverscan = expectedVisible + (customOverscan * 2)
      
      expect(renderedItems.length).toBeCloseTo(expectedWithOverscan, 5)
    })

    it('should handle custom batch size for loading', async () => {
      const items = generateLargeChainList(1000)

      render(
        <VirtualizedSidebarList
          items={items}
          config={{
            ...baseVirtualListConfig,
            batchSize: 25, // Small batches
          }}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
          onBatchLoad={mockSidebarCallbacks.onFilter}
        />
      )

      // Scroll to trigger batch loading
      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      fireEvent.scroll(scrollContainer, { 
        target: { scrollTop: 15000 } 
      })

      await waitFor(() => {
        expect(mockSidebarCallbacks.onFilter).toHaveBeenCalledWith(
          expect.objectContaining({
            batchSize: 25,
            startIndex: expect.any(Number),
          })
        )
      })
    })

    it('should support custom item renderer', () => {
      const items = generateLargeChainList(50)

      const customItemRenderer = (item: any, index: number) => (
        <div data-testid={`custom-item-${index}`} key={index}>
          Custom: {item.metadata.name}
        </div>
      )

      render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          renderItem={customItemRenderer}
          onItemClick={mockSidebarCallbacks.onItemSelect}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )

      const customItems = screen.getAllByTestId(/^custom-item-/)
      expect(customItems.length).toBeGreaterThan(0)
      expect(customItems[0]).toHaveTextContent('Custom:')
    })
  })

  describe('TypeScript Type Safety', () => {
    it('should infer correct types for virtual list config', () => {
      const config = baseVirtualListConfig

      // Type assertions to verify schema inference
      const enabledType: boolean = config.enabled
      const itemHeightType: number = config.itemHeight
      const overscanType: number = config.overscan

      expect(typeof enabledType).toBe('boolean')
      expect(typeof itemHeightType).toBe('number')
      expect(typeof overscanType).toBe('number')
    })

    it('should handle generic item type correctly', () => {
      const chainItems = generateLargeChainList(10)
      
      render(
        <VirtualizedSidebarList
          items={chainItems}
          config={baseVirtualListConfig}
          onItemClick={(item, index) => {
            // TypeScript should infer correct item type
            expect(item.type).toBe('chain')
            expect(typeof index).toBe('number')
          }}
          onItemHover={mockSidebarCallbacks.onItemHover}
        />
      )
    })
  })
})