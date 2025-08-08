/**
 * Unit Tests for Sidebar Container (Task 8.1) - Edge Cases
 * 
 * TDD tests for edge cases and boundary conditions in sidebar container.
 * These are FAILING tests that define expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../../../../src/components/sidebar/Sidebar'
import {
  baseSidebarConfig,
  baseSidebarLayout,
  minimumWidthSidebarLayout,
  maximumWidthSidebarLayout,
  mockSidebarCallbacks,
} from '../../../fixtures/sidebar'

describe('Sidebar Container - Edge Cases', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock performance.now for testing
    vi.stubGlobal('performance', {
      now: vi.fn(() => Date.now())
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Boundary Width Values', () => {
    it('should handle minimum width boundary exactly', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={minimumWidthSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const sidebar = screen.getByTestId('sidebar-container')
      expect(sidebar).toHaveStyle({ width: '200px' })

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      
      // Try to resize below minimum
      fireEvent.mouseDown(resizeHandle, { clientX: 200 })
      fireEvent.mouseMove(document, { clientX: 199 })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 200, // Should stay at minimum
        })
      )
    })

    it('should handle maximum width boundary exactly', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={maximumWidthSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const sidebar = screen.getByTestId('sidebar-container')
      expect(sidebar).toHaveStyle({ width: '600px' })

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      
      // Try to resize above maximum
      fireEvent.mouseDown(resizeHandle, { clientX: 600 })
      fireEvent.mouseMove(document, { clientX: 601 })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 600, // Should stay at maximum
        })
      )
    })

    it('should handle collapsed width transition edge case', async () => {
      const customLayout = {
        ...baseSidebarLayout,
        width: 200, // Minimum width
        collapsedWidth: 60,
      }

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={customLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      await user.click(toggleButton)

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 60,
          isCollapsed: true,
        })
      )
    })

    it('should handle width calculation with decimal precision', () => {
      const precisionLayout = {
        ...baseSidebarLayout,
        width: 320.5,
      }

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={precisionLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320.5 })
      fireEvent.mouseMove(document, { clientX: 350.7 })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: expect.closeTo(350.7, 1),
        })
      )
    })
  })

  describe('Rapid State Changes', () => {
    it('should handle rapid collapse/expand toggles without breaking', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')

      // Rapidly toggle multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(toggleButton)
      }

      // Should end up collapsed (odd number of clicks)
      await waitFor(() => {
        expect(mockSidebarCallbacks.onResize).toHaveBeenLastCalledWith(
          expect.objectContaining({
            isCollapsed: true,
          })
        )
      })
    })

    it('should debounce resize events during rapid mouse movements', () => {
      vi.useFakeTimers()

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })

      // Simulate 100 rapid mouse moves
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(document, { clientX: 320 + i })
      }

      // Should have throttled the events
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledTimes(
        expect.any(Number)
      )
      expect(mockSidebarCallbacks.onResize.mock.calls.length).toBeLessThan(100)

      vi.useRealTimers()
    })

    it('should handle simultaneous resize and collapse operations', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      const toggleButton = screen.getByTestId('sidebar-toggle-button')

      // Start resize operation
      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 400 })

      // Try to toggle during resize
      await user.click(toggleButton)

      // Should handle gracefully - either complete resize or ignore toggle
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalled()
    })
  })

  describe('Browser Compatibility Edge Cases', () => {
    it('should handle touch events on resize handle', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      // Simulate touch start
      fireEvent.touchStart(resizeHandle, {
        touches: [{ clientX: 320 }]
      })

      fireEvent.touchMove(document, {
        touches: [{ clientX: 400 }]
      })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          isResizing: true,
        })
      )

      fireEvent.touchEnd(document)

      expect(mockSidebarCallbacks.onResize).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isResizing: false,
        })
      )
    })

    it('should handle right-click context menu during resize', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320, button: 0 })
      
      // Right click during resize
      fireEvent.contextMenu(resizeHandle, { clientX: 320, button: 2 })

      // Should not interfere with resize operation
      fireEvent.mouseMove(document, { clientX: 400 })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
        })
      )
    })

    it('should handle window blur events during resize', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 400 })

      // Simulate window losing focus during resize
      fireEvent.blur(window)

      // Should end resize operation cleanly
      expect(mockSidebarCallbacks.onResize).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isResizing: false,
        })
      )
    })

    it('should handle browser zoom affecting mouse coordinates', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      // Mock devicePixelRatio change (zoom)
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 2,
        writable: true
      })

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 400 })

      // Should still work correctly with zoom
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: expect.any(Number),
        })
      )
    })
  })

  describe('Animation Frame Edge Cases', () => {
    it('should handle animation frame callback timing issues', async () => {
      let rafCallback: FrameRequestCallback | null = null
      
      const mockRAF = vi.fn().mockImplementation((callback: FrameRequestCallback) => {
        rafCallback = callback
        return 1
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
      await user.click(toggleButton)

      // Manually trigger animation frame
      if (rafCallback) {
        act(() => {
          rafCallback(performance.now())
        })
      }

      expect(mockRAF).toHaveBeenCalled()
    })

    it('should handle multiple animation frames queued simultaneously', async () => {
      const rafCallbacks: FrameRequestCallback[] = []
      
      const mockRAF = vi.fn().mockImplementation((callback: FrameRequestCallback) => {
        rafCallbacks.push(callback)
        return rafCallbacks.length
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

      // Trigger multiple state changes rapidly
      await user.click(toggleButton)
      await user.click(toggleButton)
      await user.click(toggleButton)

      // Execute all queued animation frames
      act(() => {
        rafCallbacks.forEach(callback => {
          callback(performance.now())
        })
      })

      // Should handle all frames without errors
      expect(rafCallbacks.length).toBeGreaterThan(0)
    })

    it('should handle animation frame cancellation during unmount', () => {
      const mockCAF = vi.fn()
      vi.stubGlobal('cancelAnimationFrame', mockCAF)

      const { unmount } = render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      // Unmount before animation completes
      unmount()

      expect(mockCAF).toHaveBeenCalled()
    })
  })

  describe('LocalStorage Edge Cases', () => {
    it('should handle localStorage quota exceeded gracefully', async () => {
      const mockConsoleWarn = vi.fn()
      vi.stubGlobal('console', { ...console, warn: mockConsoleWarn })

      // Mock localStorage to throw quota exceeded error
      const mockSetItem = vi.fn().mockImplementation(() => {
        const error = new Error('Quota exceeded')
        error.name = 'QuotaExceededError'
        throw error
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

      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save sidebar state: Quota exceeded')
      )
    })

    it('should handle localStorage disabled in private browsing', () => {
      // Simulate private browsing mode
      vi.stubGlobal('localStorage', undefined)

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      // Should still render correctly
      expect(screen.getByTestId('sidebar-container')).toBeInTheDocument()
    })

    it('should handle localStorage with non-standard behavior', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        clear: vi.fn(),
        // Non-standard property
        _mockData: {},
      }

      vi.stubGlobal('localStorage', mockLocalStorage)

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()
    })
  })

  describe('CSS and Styling Edge Cases', () => {
    it('should handle missing CSS transitions gracefully', async () => {
      // Mock CSS transitions not supported
      const mockGetComputedStyle = vi.fn().mockReturnValue({
        transitionDuration: '0s',
        transitionProperty: 'none',
      })
      
      vi.stubGlobal('getComputedStyle', mockGetComputedStyle)

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      await user.click(toggleButton)

      // Should still function without transitions
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          isCollapsed: true,
        })
      )
    })

    it('should handle dynamic theme color changes', () => {
      const initialConfig = {
        ...baseSidebarConfig,
        theme: {
          headerBackgroundColor: '#000000',
          sectionBackgroundColor: '#ffffff',
          borderColor: '#cccccc',
          textColor: '#333333',
          accentColor: '#ff0000',
        },
      }

      const { rerender } = render(
        <Sidebar
          config={initialConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const sidebar = screen.getByTestId('sidebar-container')
      expect(sidebar).toBeInTheDocument()

      // Update theme colors
      const updatedConfig = {
        ...initialConfig,
        theme: {
          headerBackgroundColor: '#ffffff',
          sectionBackgroundColor: '#000000',
          borderColor: '#999999',
          textColor: '#ffffff',
          accentColor: '#00ff00',
        },
      }

      rerender(
        <Sidebar
          config={updatedConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      // Should handle theme change without errors
      expect(sidebar).toBeInTheDocument()
    })

    it('should handle custom CSS properties (CSS variables)', () => {
      const customThemeConfig = {
        ...baseSidebarConfig,
        theme: {
          headerBackgroundColor: 'var(--sidebar-header-bg)',
          sectionBackgroundColor: 'var(--sidebar-section-bg)',
          borderColor: 'var(--sidebar-border)',
          textColor: 'var(--sidebar-text)',
          accentColor: 'var(--sidebar-accent)',
        },
      }

      expect(() => {
        render(
          <Sidebar
            config={customThemeConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      const sidebar = screen.getByTestId('sidebar-container')
      expect(sidebar).toBeInTheDocument()
    })
  })

  describe('Event Timing Edge Cases', () => {
    it('should handle events fired before component mounts', () => {
      // Pre-fire some global events
      fireEvent(document, new MouseEvent('mouseup', { clientX: 400 }))
      fireEvent(document, new MouseEvent('mousemove', { clientX: 350 }))

      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()

      // Should not have called resize callback for pre-mount events
      expect(mockSidebarCallbacks.onResize).not.toHaveBeenCalled()
    })

    it('should handle events fired during component unmounting', () => {
      const { unmount } = render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      fireEvent.mouseDown(resizeHandle, { clientX: 320 })

      // Start unmount process
      unmount()

      // Fire events during unmount
      expect(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 400 }))
        fireEvent(document, new MouseEvent('mouseup', { clientX: 400 }))
      }).not.toThrow()
    })

    it('should handle overlapping event sequences', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      // Start first resize sequence
      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 350 })

      // Start second resize sequence without finishing first
      fireEvent.mouseDown(resizeHandle, { clientX: 350 })
      fireEvent.mouseMove(document, { clientX: 400 })

      // End both sequences
      fireEvent.mouseUp(document)

      // Should handle overlapping sequences gracefully
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalled()
    })
  })

  describe('TypeScript Edge Cases', () => {
    it('should handle union type props correctly', () => {
      const config = {
        ...baseSidebarConfig,
        sections: baseSidebarConfig.sections.map(section => ({
          ...section,
          icon: Math.random() > 0.5 ? 'string-icon' : undefined,
        })),
      }

      expect(() => {
        render(
          <Sidebar
            config={config}
            layout={baseSidebarLayout}
            onLayoutChange={mockSidebarCallbacks.onResize}
          />
        )
      }).not.toThrow()
    })

    it('should handle optional callback props edge cases', () => {
      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
            onLayoutChange={undefined}
          />
        )
      }).not.toThrow()

      // Should render without callbacks
      expect(screen.getByTestId('sidebar-container')).toBeInTheDocument()
    })

    it('should infer generic types correctly from config', () => {
      const typedConfig = baseSidebarConfig
      
      // TypeScript should infer these types correctly
      const sectionType = typedConfig.sections[0]
      const themeType = typedConfig.theme
      const globalSearchType = typedConfig.globalSearch

      expect(typeof sectionType.id).toBe('string')
      expect(typeof themeType?.accentColor).toBe('string')
      expect(typeof globalSearchType?.enabled).toBe('boolean')
    })
  })
})