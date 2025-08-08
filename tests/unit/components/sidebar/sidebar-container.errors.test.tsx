/**
 * Unit Tests for Sidebar Container (Task 8.1) - Error Cases
 * 
 * TDD tests for error handling in sidebar container functionality.
 * These are FAILING tests that define expected error behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../../../../src/components/sidebar/Sidebar'
import {
  baseSidebarConfig,
  baseSidebarLayout,
  invalidSidebarData,
  mockSidebarCallbacks,
} from '../../../fixtures/sidebar'

// Mock console.error to track error calls
const mockConsoleError = vi.fn()
vi.stubGlobal('console', { ...console, error: mockConsoleError })

describe('Sidebar Container - Error Cases', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    mockConsoleError.mockClear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Invalid Props Handling', () => {
    it('should handle invalid layout configuration gracefully', () => {
      const invalidLayout = {
        ...baseSidebarLayout,
        width: -100, // Invalid negative width
      }

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={invalidLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      // Should log error about invalid layout
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid sidebar layout')
      )
    })

    it('should handle missing required props', () => {
      expect(() => {
        render(
          <Sidebar />
        )
      }).not.toThrow()

      // Should render with default configuration
      expect(screen.getByTestId('sidebar-container')).toBeInTheDocument()
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Missing required props')
      )
    })

    it('should handle invalid section configuration', () => {
      const invalidConfig = {
        ...baseSidebarConfig,
        sections: [
          {
            id: '', // Empty ID is invalid
            title: 'Invalid Section',
            order: 0,
          },
        ],
      }

      expect(() => {
        render(
          <Sidebar
            config={invalidConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid section configuration')
      )
    })

    it('should handle malformed theme colors', () => {
      const invalidConfig = {
        ...baseSidebarConfig,
        theme: {
          headerBackgroundColor: 'not-a-color',
          sectionBackgroundColor: 'invalid',
          borderColor: '#gggggg', // Invalid hex
          textColor: '#374151',
          accentColor: '#3b82f6',
        },
      }

      expect(() => {
        render(
          <Sidebar
            config={invalidConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      // Should fallback to default colors and log warning
      const sidebar = screen.getByTestId('sidebar-container')
      expect(sidebar).toBeInTheDocument()
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid theme colors')
      )
    })
  })

  describe('localStorage Error Handling', () => {
    it('should handle localStorage not available gracefully', async () => {
      // Simulate localStorage throwing error
      const mockGetItem = vi.fn().mockImplementation(() => {
        throw new Error('localStorage not available')
      })
      
      vi.stubGlobal('localStorage', { 
        getItem: mockGetItem,
        setItem: vi.fn(),
        clear: vi.fn()
      })

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load sidebar state')
      )
    })

    it('should handle corrupted localStorage data', () => {
      const corruptedData = '{"invalid json'
      
      vi.stubGlobal('localStorage', { 
        getItem: vi.fn().mockReturnValue(corruptedData),
        setItem: vi.fn(),
        clear: vi.fn()
      })

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse saved sidebar state')
      )
    })

    it('should handle localStorage setItem failure', async () => {
      const mockSetItem = vi.fn().mockImplementation(() => {
        throw new Error('Quota exceeded')
      })
      
      vi.stubGlobal('localStorage', { 
        getItem: vi.fn(),
        setItem: mockSetItem,
        clear: vi.fn()
      })

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      await user.click(toggleButton)

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save sidebar state')
      )
    })
  })

  describe('Event Handling Errors', () => {
    it('should handle resize callback throwing error', async () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={errorCallback}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      
      expect(async () => {
        await user.click(toggleButton)
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error in layout change callback')
      )
    })

    it('should handle mouse event errors during resize', async () => {
      // Mock getBoundingClientRect to throw error
      const mockGetBoundingClientRect = vi.fn().mockImplementation(() => {
        throw new Error('DOM error')
      })

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      resizeHandle.getBoundingClientRect = mockGetBoundingClientRect

      expect(() => {
        fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Error handling resize')
      )
    })

    it('should handle window resize event errors', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      // Simulate window resize with invalid dimensions
      Object.defineProperty(window, 'innerWidth', {
        value: -1,
        writable: true
      })

      expect(() => {
        fireEvent(window, new Event('resize'))
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid window dimensions')
      )
    })
  })

  describe('Animation and Transition Errors', () => {
    it('should handle CSS transition errors gracefully', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const sidebar = screen.getByTestId('sidebar-container')
      const toggleButton = screen.getByTestId('sidebar-toggle-button')

      // Mock transitionend event with error
      const mockTransitionEnd = new Event('transitionend')
      Object.defineProperty(mockTransitionEnd, 'propertyName', {
        value: 'invalid-property',
      })

      await user.click(toggleButton)

      expect(() => {
        fireEvent(sidebar, mockTransitionEnd)
      }).not.toThrow()

      // Should not break functionality
      expect(sidebar).toBeInTheDocument()
    })

    it('should handle animation frame cancellation errors', async () => {
      // Mock requestAnimationFrame to fail
      const mockRAF = vi.fn().mockImplementation(() => {
        throw new Error('Animation frame error')
      })
      vi.stubGlobal('requestAnimationFrame', mockRAF)

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      
      expect(async () => {
        await user.click(toggleButton)
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Animation error')
      )
    })
  })

  describe('Boundary Constraint Errors', () => {
    it('should handle extreme width values during resize', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      // Simulate extreme mouse position
      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: Number.MAX_SAFE_INTEGER })

      // Should clamp to maximum width without throwing
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 600, // Should be clamped to maxWidth
        })
      )
    })

    it('should handle NaN or undefined mouse coordinates', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      expect(() => {
        fireEvent.mouseDown(resizeHandle, { clientX: NaN })
        fireEvent.mouseMove(document, { clientX: undefined })
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid mouse coordinates')
      )
    })
  })

  describe('Memory Leak Prevention', () => {
    it('should clean up event listeners on unmount', () => {
      const mockRemoveEventListener = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function))
    })

    it('should cancel pending animation frames on unmount', () => {
      const mockCancelAnimationFrame = vi.fn()
      vi.stubGlobal('cancelAnimationFrame', mockCancelAnimationFrame)

      const { unmount } = render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      unmount()

      expect(mockCancelAnimationFrame).toHaveBeenCalled()
    })

    it('should clear timeout handlers on unmount', () => {
      const mockClearTimeout = vi.fn()
      vi.stubGlobal('clearTimeout', mockClearTimeout)

      const { unmount } = render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      unmount()

      expect(mockClearTimeout).toHaveBeenCalled()
    })
  })

  describe('Accessibility Error Recovery', () => {
    it('should maintain accessibility when DOM structure is modified externally', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      
      // Simulate external DOM modification
      toggleButton.removeAttribute('aria-expanded')
      
      // Component should restore accessibility attributes
      fireEvent.focus(toggleButton)

      expect(toggleButton).toHaveAttribute('aria-expanded')
    })

    it('should handle keyboard navigation when elements are disabled', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      
      // Simulate button being disabled externally
      toggleButton.setAttribute('disabled', 'true')

      expect(async () => {
        await user.keyboard('{Tab}')
        await user.keyboard('{Enter}')
      }).not.toThrow()

      // Should not trigger collapse when disabled
      expect(mockSidebarCallbacks.onResize).not.toHaveBeenCalled()
    })
  })

  describe('Performance Error Handling', () => {
    it('should handle excessive resize events gracefully', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })

      // Simulate rapid resize events
      for (let i = 0; i < 1000; i++) {
        fireEvent.mouseMove(document, { clientX: 320 + i })
      }

      // Should throttle events and not break
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledTimes(
        expect.any(Number)
      )
      expect(mockSidebarCallbacks.onResize.mock.calls.length).toBeLessThan(1000)
    })

    it('should handle component re-renders during resize', async () => {
      let layoutState = baseSidebarLayout

      const { rerender } = render(
        <Sidebar
          config={baseSidebarConfig}
          layout={layoutState}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })

      // Force re-render during resize
      layoutState = { ...layoutState, width: 400 }
      rerender(
        <Sidebar
          config={baseSidebarConfig}
          layout={layoutState}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      expect(() => {
        fireEvent.mouseMove(document, { clientX: 450 })
        fireEvent.mouseUp(document)
      }).not.toThrow()
    })
  })

  describe('Schema Validation Error Cases', () => {
    it('should validate layout schema and show helpful error messages', () => {
      const invalidLayout = invalidSidebarData.invalidLayout

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={invalidLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringMatching(/width.*cannot be less than/i)
      )
    })

    it('should provide specific validation error for each invalid field', () => {
      const multipleErrorsLayout = {
        width: -100,
        minWidth: 50,
        maxWidth: 2000,
        isCollapsed: 'not-boolean',
        collapsedWidth: 10,
      }

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={multipleErrorsLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      // Should log multiple validation errors
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('width: Expected number, received')
      )
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('isCollapsed: Expected boolean')
      )
    })
  })
})