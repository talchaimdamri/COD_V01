/**
 * Unit Tests for Inspector Panel Base Component (Task 9.1) - Happy Path
 * 
 * TDD tests for inspector panel with slide animation from right side.
 * These are FAILING tests that define expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InspectorPanel } from '../../../../src/components/inspector/InspectorPanel'
import {
  baseInspectorLayout,
  openInspectorLayout,
  mobileInspectorLayout,
  desktopInspectorLayout,
  baseAnimationState,
  slideInAnimation,
  slideOutAnimation,
  mockInspectorCallbacks,
  baseAgentConfig,
} from '../../../fixtures/inspector'

describe('Inspector Panel Base Component - Happy Path', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.getComputedStyle for animation testing
    vi.stubGlobal('getComputedStyle', vi.fn().mockReturnValue({
      transform: 'translateX(0px)',
      opacity: '1',
      transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    }))
    // Mock requestAnimationFrame
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Initial Rendering', () => {
    it('should render inspector panel in closed state by default', () => {
      render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toBeInTheDocument()
      expect(panel).toHaveAttribute('data-open', 'false')
      expect(panel).toHaveStyle({ 
        transform: 'translateX(100%)',
        width: '400px'
      })
    })

    it('should render panel with correct dimensions and positioning', () => {
      render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({
        position: 'fixed',
        top: '0',
        right: '0',
        height: '100vh',
        width: '400px',
        zIndex: '1000',
      })
    })

    it('should render backdrop when panel is configured to show backdrop', () => {
      render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const backdrop = screen.queryByTestId('inspector-backdrop')
      expect(backdrop).not.toBeInTheDocument() // Hidden when panel is closed
    })

    it('should not render content when no agent is selected', () => {
      render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      expect(screen.queryByTestId('inspector-content')).not.toBeInTheDocument()
    })
  })

  describe('Panel Open/Close States', () => {
    it('should render panel in open state with slide-in transform', () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('data-open', 'true')
      expect(panel).toHaveStyle({ 
        transform: 'translateX(0%)',
      })
    })

    it('should render backdrop when panel is open', () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const backdrop = screen.getByTestId('inspector-backdrop')
      expect(backdrop).toBeInTheDocument()
      expect(backdrop).toHaveStyle({
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: '999',
      })
    })

    it('should render inspector content when agent is selected and panel is open', () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const content = screen.getByTestId('inspector-content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('inspector-content')
    })

    it('should show close button when panel is open', () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveAttribute('aria-label', expect.stringContaining('Close'))
    })
  })

  describe('Animation Behavior', () => {
    it('should apply transition classes during slide-in animation', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Trigger open state
      rerender(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveClass('inspector-panel-transitioning')
      expect(panel).toHaveClass('inspector-panel-entering')
    })

    it('should apply transition classes during slide-out animation', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Trigger close state
      rerender(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveClass('inspector-panel-transitioning')
      expect(panel).toHaveClass('inspector-panel-exiting')
    })

    it('should complete animation and remove transition classes', async () => {
      const { rerender } = render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      // Trigger animation
      rerender(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      
      // Wait for animation completion
      await waitFor(() => {
        expect(panel).not.toHaveClass('inspector-panel-transitioning')
        expect(panel).not.toHaveClass('inspector-panel-entering')
      }, { timeout: 500 })
    })

    it('should use correct animation duration from layout config', async () => {
      const customLayout = {
        ...openInspectorLayout,
        animationDuration: 500,
      }

      render(
        <InspectorPanel
          layout={customLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({
        transition: expect.stringContaining('500ms'),
      })
    })

    it('should animate backdrop opacity during panel transitions', async () => {
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

      const backdrop = screen.getByTestId('inspector-backdrop')
      expect(backdrop).toHaveClass('backdrop-transitioning')
    })
  })

  describe('User Interactions', () => {
    it('should close panel when close button is clicked', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      await user.click(closeButton)

      expect(mockInspectorCallbacks.onClose).toHaveBeenCalledWith({
        ...openInspectorLayout,
        isOpen: false,
      })
    })

    it('should close panel when backdrop is clicked', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const backdrop = screen.getByTestId('inspector-backdrop')
      await user.click(backdrop)

      expect(mockInspectorCallbacks.onClose).toHaveBeenCalledWith({
        ...openInspectorLayout,
        isOpen: false,
      })
    })

    it('should not close panel when clicking inside panel content', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const content = screen.getByTestId('inspector-content')
      await user.click(content)

      expect(mockInspectorCallbacks.onClose).not.toHaveBeenCalled()
    })

    it('should close panel with Escape key', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockInspectorCallbacks.onClose).toHaveBeenCalledWith({
        ...openInspectorLayout,
        isOpen: false,
      })
    })

    it('should trap focus within panel when open', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      closeButton.focus()

      // Tab should cycle within panel
      await user.keyboard('{Tab}')
      
      const focusedElement = document.activeElement
      expect(focusedElement).not.toBe(document.body)
    })
  })

  describe('Responsive Layout', () => {
    it('should render with mobile layout dimensions', () => {
      render(
        <InspectorPanel
          layout={mobileInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '320px' })
    })

    it('should render with desktop layout dimensions', () => {
      render(
        <InspectorPanel
          layout={desktopInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ width: '480px' })
    })

    it('should adjust panel width within min/max constraints', () => {
      const constrainedLayout = {
        ...openInspectorLayout,
        width: 250, // Below minWidth
      }

      render(
        <InspectorPanel
          layout={constrainedLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ 
        width: '300px', // Should be clamped to minWidth
      })
    })

    it('should handle full-width panels on small screens', () => {
      const fullWidthLayout = {
        ...openInspectorLayout,
        width: window.innerWidth,
      }

      // Mock small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <InspectorPanel
          layout={fullWidthLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ 
        width: '100vw',
      })
    })
  })

  describe('Z-Index and Layering', () => {
    it('should render panel with correct z-index from layout', () => {
      const customLayout = {
        ...openInspectorLayout,
        zIndex: 1500,
      }

      render(
        <InspectorPanel
          layout={customLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ zIndex: '1500' })
    })

    it('should render backdrop with z-index below panel', () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const backdrop = screen.getByTestId('inspector-backdrop')
      const panel = screen.getByTestId('inspector-panel')
      
      expect(backdrop).toHaveStyle({ zIndex: '999' })
      expect(panel).toHaveStyle({ zIndex: '1000' })
    })

    it('should handle z-index conflicts gracefully', () => {
      const conflictLayout = {
        ...openInspectorLayout,
        zIndex: -1, // Invalid z-index
      }

      render(
        <InspectorPanel
          layout={conflictLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveStyle({ zIndex: '1000' }) // Should fallback to default
    })
  })

  describe('Accessibility Features', () => {
    it('should have correct ARIA attributes when open', () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('role', 'dialog')
      expect(panel).toHaveAttribute('aria-modal', 'true')
      expect(panel).toHaveAttribute('aria-labelledby', expect.any(String))
    })

    it('should have correct ARIA attributes when closed', () => {
      render(
        <InspectorPanel
          layout={baseInspectorLayout}
          selectedAgent={null}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const panel = screen.getByTestId('inspector-panel')
      expect(panel).toHaveAttribute('aria-hidden', 'true')
    })

    it('should announce panel state changes to screen readers', async () => {
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

      const announcement = screen.getByTestId('inspector-announcement')
      expect(announcement).toHaveAttribute('aria-live', 'polite')
      expect(announcement).toHaveTextContent(expect.stringContaining('Inspector panel opened'))
    })

    it('should support keyboard navigation for close action', async () => {
      render(
        <InspectorPanel
          layout={openInspectorLayout}
          selectedAgent={baseAgentConfig}
          onLayoutChange={mockInspectorCallbacks.onClose}
        />
      )

      const closeButton = screen.getByTestId('inspector-close-button')
      closeButton.focus()

      await user.keyboard('{Enter}')
      expect(mockInspectorCallbacks.onClose).toHaveBeenCalled()

      // Reset and test spacebar
      vi.clearAllMocks()
      closeButton.focus()
      await user.keyboard(' ')
      expect(mockInspectorCallbacks.onClose).toHaveBeenCalled()
    })
  })

  describe('TypeScript Type Inference', () => {
    it('should infer correct types for inspector layout', () => {
      const layout = openInspectorLayout
      
      // Type assertions to verify schema inference
      const isOpenType: boolean = layout.isOpen
      const widthType: number = layout.width
      const positionType: 'left' | 'right' = layout.position
      const zIndexType: number = layout.zIndex
      
      expect(typeof isOpenType).toBe('boolean')
      expect(typeof widthType).toBe('number')
      expect(['left', 'right']).toContain(positionType)
      expect(typeof zIndexType).toBe('number')
    })

    it('should infer correct types for agent configuration', () => {
      const agent = baseAgentConfig
      
      // Type assertions to verify schema inference
      const idType: string = agent.id
      const nameType: string = agent.name
      const promptType: string = agent.prompt
      const modelType: string = agent.model
      const toolsType: string[] = agent.tools
      
      expect(typeof idType).toBe('string')
      expect(typeof nameType).toBe('string')
      expect(typeof promptType).toBe('string')
      expect(typeof modelType).toBe('string')
      expect(Array.isArray(toolsType)).toBe(true)
    })
  })

  describe('Component Props Validation', () => {
    it('should accept valid inspector panel props without errors', () => {
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

    it('should handle optional callback props gracefully', () => {
      expect(() => {
        render(
          <InspectorPanel
            layout={baseInspectorLayout}
            selectedAgent={null}
          />
        )
      }).not.toThrow()
    })

    it('should handle undefined selectedAgent gracefully', () => {
      expect(() => {
        render(
          <InspectorPanel
            layout={openInspectorLayout}
            selectedAgent={undefined}
            onLayoutChange={mockInspectorCallbacks.onClose}
          />
        )
      }).not.toThrow()
    })
  })
})