/**
 * Unit Tests for Inspector Panel Base Component (Task 9.1) - Edge Cases
 * 
 * TDD tests for inspector panel edge cases and boundary conditions.
 * These are FAILING tests that define expected edge case behavior before implementation.
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
  viewportFixtures,
  performanceBenchmarks,
} from '../../../fixtures/inspector'

describe('Inspector Panel Base Component - Edge Cases', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock performance timing
    vi.spyOn(performance, 'now').mockReturnValue(0)
    
    // Mock intersection observer
    vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Extreme Layout Boundaries', () => {
    it('should handle minimum possible width', () => {
      const minLayout = {
        ...baseInspectorLayout,
        width: 1,
        minWidth: 1,
      }

      render(
        <InspectorPanel
          layout={minLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '1px' })
    })

    it('should handle maximum viewport width', () => {
      const maxLayout = {
        ...baseInspectorLayout,
        width: 9999,
        maxWidth: 9999,
      }

      // Mock very wide viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 9999,
      })

      render(
        <InspectorPanel
          layout={maxLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '9999px' })
    })

    it('should handle zero animation duration', () => {
      const instantLayout = {
        ...openInspectorLayout,
        animationDuration: 0,
      }

      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      rerender(
        <InspectorPanel
          layout={instantLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      // Should transition immediately without animation classes
      expect(panel).not.toHaveClass('inspector-panel-transitioning')
    })

    it('should handle maximum z-index value', () => {
      const maxZLayout = {
        ...openInspectorLayout,
        zIndex: 2147483647, // Maximum 32-bit integer
      }

      render(
        <InspectorPanel
          layout={maxZLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ zIndex: '2147483647' })
    })
  })

  describe('Rapid State Changes', () => {
    it('should handle rapid open/close cycles', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Rapidly cycle through states
      for (let i = 0; i < 10; i++) {
        rerender(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
        
        rerender(
          <InspectorPanel
            layout={baseInspectorLayout}
            selectedAgent={null}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('data-open', 'false')
    })

    it('should handle rapid width changes during animation', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Rapidly change width while panel is open
      const widths = [300, 400, 500, 350, 450]
      widths.forEach(width => {
        const newLayout = { ...openInspectorLayout, width }
        rerender(
          <InspectorPanel
            layout={newLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      })

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '450px' })
    })

    it('should handle agent switching during animation', async () => {
      const alternateAgent = {
        ...baseAgentConfig,
        id: 'alternate-agent',
        name: 'Alternate Agent',
      }

      const { rerender } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Switch agents rapidly
      const agents = [baseAgentConfig, alternateAgent, null, baseAgentConfig]
      agents.forEach(agent => {
        rerender(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={agent}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      })

      expect(screen.getByTestId('inspector-content')).toBeInTheDocument()
    })
  })

  describe('Extreme Viewport Conditions', () => {
    it('should handle portrait mobile viewport', async () => {
      const mobileViewport = viewportFixtures.find(v => v.name === 'mobile-portrait')!
      
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: mobileViewport.width,
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: mobileViewport.height,
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('data-viewport', 'mobile')
      expect(panel).toHaveClass('inspector-panel-mobile')
    })

    it('should handle ultra-wide desktop viewport', async () => {
      const ultraWideViewport = {
        width: 3440,
        height: 1440,
      }
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: ultraWideViewport.width,
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: ultraWideViewport.height,
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('data-viewport', 'desktop')
      // Should not exceed reasonable max width even on ultra-wide displays
      expect(parseInt(panel.style.width)).toBeLessThanOrEqual(800)
    })

    it('should handle viewport rotation', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Simulate device rotation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // Portrait width
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667, // Portrait height
      })

      // Trigger resize event
      fireEvent(window, new Event('resize'))
      
      rerender(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Rotate to landscape
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667, // Landscape width
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375, // Landscape height
      })

      fireEvent(window, new Event('resize'))
      
      rerender(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toBeInTheDocument()
    })

    it('should handle very small viewport', () => {
      // Mock tiny viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 200,
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 300,
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      // Should take full width on very small screens
      expect(panel).toHaveClass('inspector-panel-fullscreen')
    })
  })

  describe('Performance Edge Cases', () => {
    it('should handle many simultaneous animations', async () => {
      const animationElements = Array.from({ length: 100 }, (_, i) => (
        <InspectorPanel
          key={i}
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      ))

      const startTime = performance.now()
      
      expect(() => {
        render(<div>{animationElements}</div>)
      }).not.toThrow()

      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should complete within performance budget
      expect(renderTime).toBeLessThan(performanceBenchmarks.panelAnimation.expectedSlideInTime * 2)
    })

    it('should handle frequent layout measurements', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Trigger many layout measurements
      for (let i = 0; i < 50; i++) {
        const newLayout = {
          ...openInspectorLayout,
          width: 400 + (i % 10),
        }
        
        rerender(
          <InspectorPanel
            layout={newLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
        
        // Force layout measurement
        const panel = screen.getByTestId('inspector-panel')
        panel.getBoundingClientRect()
      }

      expect(screen.getByTestId('inspector-panel')).toBeInTheDocument()
    })

    it('should handle animation frame timing edge cases', async () => {
      let frameCallCount = 0
      const originalRAF = window.requestAnimationFrame
      
      // Mock requestAnimationFrame with irregular timing
      vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
        frameCallCount++
        const delay = frameCallCount % 3 === 0 ? 32 : 16 // Irregular frame timing
        return setTimeout(callback, delay)
      }))

      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      rerender(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      await waitFor(() => {
        const panel = screen.getByTestId('inspector-panel')
        expect(panel).not.toHaveClass('inspector-panel-transitioning')
      }, { timeout: 1000 })

      window.requestAnimationFrame = originalRAF
    })
  })

  describe('Memory Pressure Scenarios', () => {
    it('should handle low memory conditions', async () => {
      // Mock low memory scenario
      const memoryInfo = {
        usedJSHeapSize: 50000000, // 50MB
        totalJSHeapSize: 52000000, // 52MB (close to limit)
        jsHeapSizeLimit: 53000000, // 53MB
      }
      
      Object.defineProperty(performance, 'memory', {
        value: memoryInfo,
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

      const panel = screen.getByTestId('inspector-panel')
      // Should potentially enter memory-efficient mode
      expect(panel).toHaveAttribute('data-memory-mode', expect.any(String))
    })

    it('should handle many inspector instances', () => {
      const manyInstances = Array.from({ length: 50 }, (_, i) => (
        <InspectorPanel
          key={i}
          layout={{ ...baseInspectorLayout, zIndex: 1000 + i }}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      ))

      expect(() => {
        render(<div>{manyInstances}</div>)
      }).not.toThrow()

      const panels = screen.getAllByTestId('inspector-panel')
      expect(panels).toHaveLength(50)
    })

    it('should handle component cleanup under memory pressure', () => {
      const { unmount } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Mock memory pressure
      const mockGC = vi.fn()
      vi.stubGlobal('gc', mockGC)

      expect(() => {
        unmount()
      }).not.toThrow()

      // Verify cleanup doesn't retain references
      expect(screen.queryByTestId('inspector-panel')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility Edge Cases', () => {
    it('should handle screen reader announcements during rapid state changes', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Rapidly toggle states
      const states = [
        { layout: openInspectorLayout, agent: baseAgentConfig },
        { layout: baseInspectorLayout, agent: null },
        { layout: openInspectorLayout, agent: baseAgentConfig },
      ]

      states.forEach(({ layout, agent }, index) => {
        rerender(
          <InspectorPanel
            layout={layout}
            selectedAgent={agent}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      })

      // Should not overwhelm screen readers with announcements
      const announcements = screen.getAllByTestId('inspector-announcement')
      expect(announcements.length).toBeLessThanOrEqual(2) // Should throttle announcements
    })

    it('should handle high contrast mode', () => {
      // Mock high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query) => ({
          matches: query.includes('prefers-contrast: high'),
          addListener: vi.fn(),
          removeListener: vi.fn(),
        })),
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveClass('inspector-panel-high-contrast')
    })

    it('should handle reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          addListener: vi.fn(),
          removeListener: vi.fn(),
        })),
      })

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveClass('inspector-panel-reduced-motion')
      expect(panel).toHaveStyle({
        transition: 'none', // Animations should be disabled
      })
    })

    it('should handle focus trap with many focusable elements', async () => {
      const manyFocusableAgent = {
        ...baseAgentConfig,
        tools: Array.from({ length: 100 }, (_, i) => `tool-${i}`),
      }

      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={manyFocusableAgent}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const firstFocusable = screen.getAllByRole('button')[0]
      const lastFocusable = screen.getAllByRole('button').pop()!

      firstFocusable.focus()
      
      // Tab backward from first element should go to last
      await user.keyboard('{Shift>}{Tab}{/Shift}')
      expect(lastFocusable).toHaveFocus()

      // Tab forward from last element should go to first
      await user.keyboard('{Tab}')
      expect(firstFocusable).toHaveFocus()
    })
  })

  describe('Network and External Dependencies', () => {
    it('should handle offline conditions gracefully', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        value: false,
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

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('data-online', 'false')
    })

    it('should handle font loading failures', () => {
      // Mock font loading failure
      const mockFontFace = vi.fn(() => ({
        load: vi.fn().mockRejectedValue(new Error('Font load failed')),
      }))
      
      vi.stubGlobal('FontFace', mockFontFace)

      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={baseAgentConfig}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveClass('inspector-panel-fallback-fonts')
    })
  })
})