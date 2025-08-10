/**
 * Unit Tests for Inspector Panel Base Component (Task 9.1) - Error Cases
 * 
 * TDD tests for inspector panel error handling and validation.
 * These are FAILING tests that define expected error behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InspectorPanel } from '../../../../src/components/inspector/InspectorPanel'
import {
  baseInspectorLayout,
  openInspectorLayout,
  mockInspectorCallbacks,
  baseAgentConfig,
  errorScenarios,
} from '../../../fixtures/inspector'

describe('Inspector Panel Base Component - Error Cases', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.error to test error handling
    vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock performance.now for animation timing
    vi.spyOn(performance, 'now').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Invalid Layout Configuration', () => {
    it('should handle negative width gracefully', () => {
      const invalidLayout = {
        ...baseInspectorLayout,
        width: -100,
      }

      expect(() => {
        render(
          <InspectorPanel
            layout={invalidLayout}
            selectedAgent={null}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '300px' }) // Should fallback to minWidth
    })

    it('should handle width exceeding maximum constraints', () => {
      const invalidLayout = {
        ...baseInspectorLayout,
        width: 2000, // Exceeds maxWidth
      }

      render(
        <InspectorPanel
          layout={invalidLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '600px' }) // Should clamp to maxWidth
    })

    it('should handle invalid z-index values', () => {
      const invalidLayout = {
        ...baseInspectorLayout,
        zIndex: -999,
      }

      render(
        <InspectorPanel
          layout={invalidLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ zIndex: '1000' }) // Should fallback to default
    })

    it('should handle invalid animation duration', () => {
      const invalidLayout = {
        ...baseInspectorLayout,
        animationDuration: -300,
      }

      render(
        <InspectorPanel
          layout={invalidLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({
        transition: expect.stringContaining('300ms'), // Should fallback to default
      })
    })

    it('should handle invalid position values', () => {
      const invalidLayout = {
        ...baseInspectorLayout,
        position: 'invalid-position' as any,
      }

      render(
        <InspectorPanel
          layout={invalidLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ right: '0' }) // Should fallback to 'right'
    })
  })

  describe('Animation System Errors', () => {
    it('should handle CSS transform failures gracefully', async () => {
      // Mock getComputedStyle to return null
      vi.stubGlobal('getComputedStyle', vi.fn().mockReturnValue(null))

      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      expect(() => {
        rerender(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      // Panel should still be accessible
      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toBeInTheDocument()
    })

    it('should handle requestAnimationFrame failures', async () => {
      // Mock requestAnimationFrame to throw error
      vi.stubGlobal('requestAnimationFrame', vi.fn(() => {
        throw new Error('Animation frame error')
      }))

      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      expect(() => {
        rerender(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      // Should fallback to setTimeout or immediate execution
      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('data-open', 'true')
    })

    it('should handle transition event listener failures', async () => {
      // Mock addEventListener to throw error
      const originalAddEventListener = Element.prototype.addEventListener
      Element.prototype.addEventListener = vi.fn(() => {
        throw new Error('Event listener error')
      })

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      // Restore original method
      Element.prototype.addEventListener = originalAddEventListener
    })

    it('should handle interrupted animations gracefully', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Start opening animation
      rerender(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Immediately interrupt with close
      rerender(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      
      // Should handle state transition without errors
      await waitFor(() => {
        expect(panel).toHaveAttribute('data-open', 'false')
      })
    })
  })

  describe('Event Handling Errors', () => {
    it('should handle missing onLayoutChange callback gracefully', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          // onLayoutChange prop is missing
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      
      expect(() => {
        user.click(closeButton)
      }).not.toThrow()
    })

    it('should handle callback execution errors', async () => {
      const throwingCallback = vi.fn(() => {
        throw new Error('Callback execution error')
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={throwingCallback}
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      
      expect(() => {
        user.click(closeButton)
      }).not.toThrow()

      expect(throwingCallback).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Inspector panel callback error'),
        expect.any(Error)
      )
    })

    it('should handle keyboard event failures', async () => {
      // Mock keyboard event handling to fail
      const originalKeyDown = document.addEventListener
      vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
        if (event === 'keydown' && typeof handler === 'function') {
          // Simulate error in keyboard handler
          const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' })
          try {
            handler(mockEvent)
          } catch (error) {
            console.error('Keyboard handler error:', error)
          }
        } else {
          originalKeyDown.call(document, event, handler)
        }
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      await user.keyboard('{Escape}')

      // Panel should still be accessible despite keyboard handling errors
      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toBeInTheDocument()
    })

    it('should handle backdrop click event propagation issues', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const backdrop = screen.getByTestId('inspector-backdrop')
      
      // Mock stopPropagation to fail
      const mockEvent = {
        ...new MouseEvent('click'),
        stopPropagation: vi.fn(() => {
          throw new Error('stopPropagation error')
        }),
        preventDefault: vi.fn(),
      }

      expect(() => {
        fireEvent.click(backdrop, mockEvent)
      }).not.toThrow()
    })
  })

  describe('DOM Manipulation Errors', () => {
    it('should handle body style manipulation failures', async () => {
      // Mock document.body.style to be read-only
      Object.defineProperty(document.body, 'style', {
        value: {},
        writable: false,
        configurable: false,
      })

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()
    })

    it('should handle focus management failures', async () => {
      // Mock focus methods to fail
      const mockFocus = vi.fn(() => {
        throw new Error('Focus error')
      })
      
      Element.prototype.focus = mockFocus

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      
      expect(() => {
        closeButton.focus()
      }).toThrow() // This should throw but be handled by the component
    })

    it('should handle missing DOM elements gracefully', async () => {
      // Mock querySelector to return null
      const originalQuerySelector = document.querySelector
      vi.spyOn(document, 'querySelector').mockReturnValue(null)

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      document.querySelector = originalQuerySelector
    })
  })

  describe('Memory and Performance Errors', () => {
    it('should handle memory cleanup failures during unmount', () => {
      const { unmount } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Mock cleanup methods to fail
      const originalRemoveEventListener = document.removeEventListener
      vi.spyOn(document, 'removeEventListener').mockImplementation(() => {
        throw new Error('Cleanup error')
      })

      expect(() => {
        unmount()
      }).not.toThrow()

      document.removeEventListener = originalRemoveEventListener
    })

    it('should handle excessive re-renders gracefully', async () => {
      let renderCount = 0
      const CountingPanel = () => {
        renderCount++
        if (renderCount > 100) {
          throw new Error('Too many re-renders')
        }
        return (
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }

      expect(() => {
        render(<CountingPanel />)
      }).not.toThrow()

      // Should still render within reasonable bounds
      expect(renderCount).toBeLessThan(50)
    })

    it('should handle animation frame stack overflow', async () => {
      let frameCount = 0
      const originalRAF = window.requestAnimationFrame
      
      vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
        frameCount++
        if (frameCount > 1000) {
          throw new Error('Stack overflow in animation frames')
        }
        return originalRAF(callback)
      }))

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Invalid Agent Data Handling', () => {
    it('should handle malformed agent configuration', () => {
      const malformedAgent = {
        ...baseAgentConfig,
        name: null, // Invalid type
        tools: 'not-an-array', // Invalid type
        config: 'invalid-config', // Invalid type
      } as any

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={malformedAgent}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      // Should show error state or fallback content
      const content = screen.getByTestId('inspector-content')
      expect(content).toBeInTheDocument()
    })

    it('should handle circular reference in agent config', () => {
      const circularAgent = { ...baseAgentConfig }
      circularAgent.config = { self: circularAgent } // Circular reference

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={circularAgent}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()
    })

    it('should handle extremely large agent data', () => {
      const largeAgent = {
        ...baseAgentConfig,
        prompt: 'x'.repeat(10000), // Very large prompt
        tools: Array(1000).fill('large-tool'), // Many tools
        config: Object.fromEntries(
          Array(1000).fill(0).map((_, i) => [`key${i}`, `value${i}`])
        ), // Large config
      }

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={largeAgent}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()
    })
  })

  describe('Browser Compatibility Errors', () => {
    it('should handle missing CSS transform support', () => {
      // Mock missing transform support
      const originalGetComputedStyle = window.getComputedStyle
      vi.stubGlobal('getComputedStyle', vi.fn().mockReturnValue({
        transform: undefined,
        webkitTransform: undefined,
      }))

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      window.getComputedStyle = originalGetComputedStyle
    })

    it('should handle missing backdrop-filter support', () => {
      // Mock missing backdrop-filter support
      const mockStyle = document.createElement('div').style
      Object.defineProperty(mockStyle, 'backdropFilter', {
        value: undefined,
        configurable: true,
      })

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()
    })

    it('should handle missing resize observer', () => {
      // Mock missing ResizeObserver
      const originalResizeObserver = window.ResizeObserver
      vi.stubGlobal('ResizeObserver', undefined)

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      window.ResizeObserver = originalResizeObserver
    })
  })
})