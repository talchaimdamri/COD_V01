/**
 * Unit Tests for Virtualized List Performance (Task 8.2) - Error Cases
 * 
 * TDD tests for error handling in virtualized list functionality.
 * These are FAILING tests that define expected error behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VirtualizedSidebarList } from '../../../../src/components/sidebar/VirtualizedSidebarList'
import {
  baseVirtualListConfig,
  disabledVirtualListConfig,
  generateLargeChainList,
  mockSidebarCallbacks,
} from '../../../fixtures/sidebar'

// Mock console.error to track error calls
const mockConsoleError = vi.fn()
vi.stubGlobal('console', { ...console, error: mockConsoleError })

describe('Virtualized List Performance - Error Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Invalid Configuration Handling', () => {
    it('should handle invalid virtual list configuration gracefully', () => {
      const invalidConfig = {
        ...baseVirtualListConfig,
        itemHeight: -50, // Invalid negative height
        overscan: -5,    // Invalid negative overscan
      }

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={invalidConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid virtual list configuration')
      )
    })

    it('should handle missing @tanstack/react-virtual gracefully', () => {
      // Mock the import failure
      vi.doMock('@tanstack/react-virtual', () => {
        throw new Error('Module not found')
      })

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      // Should fallback to non-virtualized rendering
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Virtualization library not available')
      )
    })

    it('should handle disabled virtualization config', () => {
      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(1000)}
            config={disabledVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      // Should render all items without virtualization (performance warning)
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Large dataset without virtualization')
      )
    })
  })

  describe('Data Handling Errors', () => {
    it('should handle null or undefined items array', () => {
      expect(() => {
        render(
          <VirtualizedSidebarList
            items={null}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      // Should render empty state
      expect(screen.getByTestId('virtual-empty-state')).toBeInTheDocument()
    })

    it('should handle empty items array', () => {
      render(
        <VirtualizedSidebarList
          items={[]}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      const emptyState = screen.getByTestId('virtual-empty-state')
      expect(emptyState).toBeInTheDocument()
      expect(emptyState).toHaveTextContent('No items to display')
    })

    it('should handle corrupted item data', () => {
      const corruptedItems = [
        ...generateLargeChainList(50),
        { /* missing required fields */ },
        null,
        { metadata: null },
        { type: 'invalid-type' },
        ...generateLargeChainList(50),
      ]

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={corruptedItems}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid item data detected')
      )
    })

    it('should handle circular references in item data', () => {
      const circularItem: any = { 
        type: 'chain',
        metadata: { id: 'test', name: 'Test' }
      }
      circularItem.circular = circularItem // Create circular reference

      const itemsWithCircular = [
        ...generateLargeChainList(10),
        circularItem,
      ]

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={itemsWithCircular}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Circular reference detected')
      )
    })
  })

  describe('Scroll Event Errors', () => {
    it('should handle scroll container not being available', () => {
      const mockQuerySelector = vi.fn().mockReturnValue(null)
      vi.stubGlobal('document', { 
        ...document, 
        querySelector: mockQuerySelector 
      })

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Scroll container not found')
      )
    })

    it('should handle invalid scroll positions', () => {
      render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      const scrollContainer = screen.getByTestId('virtual-scroll-container')

      expect(() => {
        fireEvent.scroll(scrollContainer, { 
          target: { 
            scrollTop: NaN,
            scrollHeight: -1000 
          } 
        })
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid scroll position')
      )
    })

    it('should handle scroll events before component is ready', () => {
      // Mock useVirtualizer to throw during initialization
      const mockUseVirtualizer = vi.fn().mockImplementation(() => {
        throw new Error('Virtualizer not ready')
      })

      vi.doMock('@tanstack/react-virtual', () => ({
        useVirtualizer: mockUseVirtualizer,
      }))

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Virtualizer initialization failed')
      )
    })
  })

  describe('Memory and Performance Errors', () => {
    it('should handle memory allocation failures', () => {
      // Simulate out of memory condition
      const originalArrayFrom = Array.from
      vi.stubGlobal('Array', {
        ...Array,
        from: vi.fn().mockImplementation(() => {
          throw new Error('Maximum call stack size exceeded')
        })
      })

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(10000)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Memory allocation failed')
      )

      // Restore
      vi.stubGlobal('Array', { ...Array, from: originalArrayFrom })
    })

    it('should handle excessive cache size gracefully', () => {
      const excessiveCacheConfig = {
        ...baseVirtualListConfig,
        maxCacheSize: Number.MAX_SAFE_INTEGER,
      }

      render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={excessiveCacheConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Cache size too large')
      )
    })

    it('should handle ResizeObserver failures', () => {
      const mockResizeObserver = vi.fn().mockImplementation(() => {
        throw new Error('ResizeObserver failed')
      })

      vi.stubGlobal('ResizeObserver', mockResizeObserver)

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('ResizeObserver setup failed')
      )
    })
  })

  describe('Event Handler Errors', () => {
    it('should handle callback functions throwing errors', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })

      render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={baseVirtualListConfig}
          onItemClick={errorCallback}
        />
      )

      const firstItem = screen.getByTestId('virtual-item-0')

      expect(() => {
        fireEvent.click(firstItem)
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Item click handler failed')
      )
    })

    it('should handle null callback functions', () => {
      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={null}
            onItemHover={undefined}
          />
        )
      }).not.toThrow()

      const firstItem = screen.getByTestId('virtual-item-0')
      
      // Should not crash when clicking
      expect(() => {
        fireEvent.click(firstItem)
        fireEvent.mouseEnter(firstItem)
      }).not.toThrow()
    })

    it('should handle rapid callback invocations', () => {
      const slowCallback = vi.fn().mockImplementation(() => {
        // Simulate slow callback
        const start = Date.now()
        while (Date.now() - start < 100) { /* busy wait */ }
      })

      render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={baseVirtualListConfig}
          onItemClick={slowCallback}
        />
      )

      const firstItem = screen.getByTestId('virtual-item-0')

      // Rapidly fire clicks
      expect(() => {
        for (let i = 0; i < 10; i++) {
          fireEvent.click(firstItem)
        }
      }).not.toThrow()

      // Should throttle or queue callbacks appropriately
      expect(slowCallback).toHaveBeenCalled()
    })
  })

  describe('Dynamic Configuration Errors', () => {
    it('should handle configuration changes during active virtualization', () => {
      const { rerender } = render(
        <VirtualizedSidebarList
          items={generateLargeChainList(1000)}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      // Scroll to middle
      const scrollContainer = screen.getByTestId('virtual-scroll-container')
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 5000 } })

      // Change config dramatically
      const changedConfig = {
        ...baseVirtualListConfig,
        itemHeight: 120, // Double the height
        overscan: 20,    // Much larger overscan
      }

      expect(() => {
        rerender(
          <VirtualizedSidebarList
            items={generateLargeChainList(1000)}
            config={changedConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      // Should handle the reconfiguration gracefully
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('Configuration change failed')
      )
    })

    it('should handle item height calculation failures', () => {
      const faultyHeightCalculator = vi.fn().mockImplementation(() => {
        throw new Error('Height calculation failed')
      })

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            getItemHeight={faultyHeightCalculator}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Height calculation error')
      )
    })
  })

  describe('Browser Compatibility Errors', () => {
    it('should handle missing IntersectionObserver API', () => {
      vi.stubGlobal('IntersectionObserver', undefined)

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('IntersectionObserver not available')
      )
    })

    it('should handle missing requestAnimationFrame', () => {
      vi.stubGlobal('requestAnimationFrame', undefined)

      expect(() => {
        render(
          <VirtualizedSidebarList
            items={generateLargeChainList(100)}
            config={baseVirtualListConfig}
            onItemClick={mockSidebarCallbacks.onItemSelect}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('requestAnimationFrame not available')
      )
    })

    it('should handle CSS containment not supported', () => {
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        contain: '',
        contentVisibility: '',
      })

      vi.stubGlobal('getComputedStyle', mockGetComputedStyle)

      render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      // Should work but potentially with performance warning
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('CSS containment not supported')
      )
    })
  })

  describe('Cleanup and Memory Leak Prevention', () => {
    it('should handle cleanup failures gracefully', () => {
      const mockAddEventListener = vi.fn()
      const mockRemoveEventListener = vi.fn().mockImplementation(() => {
        throw new Error('Cleanup failed')
      })

      vi.stubGlobal('document', {
        ...document,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
      })

      const { unmount } = render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      expect(() => {
        unmount()
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup error')
      )
    })

    it('should handle multiple unmount calls', () => {
      const { unmount } = render(
        <VirtualizedSidebarList
          items={generateLargeChainList(100)}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      expect(() => {
        unmount()
        unmount() // Second call should be safe
      }).not.toThrow()
    })

    it('should detect and prevent memory leaks', () => {
      const mockWeakMap = new WeakMap()
      const items = generateLargeChainList(1000)

      const { unmount } = render(
        <VirtualizedSidebarList
          items={items}
          config={baseVirtualListConfig}
          onItemClick={mockSidebarCallbacks.onItemSelect}
        />
      )

      // Store references to track cleanup
      items.forEach(item => mockWeakMap.set(item, true))

      unmount()

      // Force garbage collection (if available)
      if (global.gc) {
        global.gc()
      }

      // Memory should be cleaned up (this is a conceptual test)
      expect(mockConsoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('Memory leak detected')
      )
    })
  })
})