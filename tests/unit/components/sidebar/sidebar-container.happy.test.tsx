/**
 * Unit Tests for Sidebar Container (Task 8.1) - Happy Path
 * 
 * TDD tests for collapsible sidebar container with resize functionality.
 * These are FAILING tests that define expected behavior before implementation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../../../../src/components/sidebar/Sidebar'
import {
  baseSidebarConfig,
  baseSidebarLayout,
  collapsedSidebarLayout,
  resizingSidebarLayout,
  mockSidebarCallbacks,
} from '../../../fixtures/sidebar'

describe('Sidebar Container - Happy Path', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('Initial Rendering', () => {
    it('should render sidebar with default width and expanded state', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const sidebar = screen.getByTestId('sidebar-container')
      expect(sidebar).toBeInTheDocument()
      expect(sidebar).toHaveStyle({ width: '320px' })
      expect(sidebar).toHaveAttribute('data-collapsed', 'false')
    })

    it('should render collapse/expand toggle button', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      expect(toggleButton).toBeInTheDocument()
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(toggleButton).toHaveAttribute('aria-label', expect.stringContaining('collapse'))
    })

    it('should render resize handle when not collapsed', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      expect(resizeHandle).toBeInTheDocument()
      expect(resizeHandle).toHaveStyle({ cursor: 'col-resize' })
    })

    it('should render configured sections', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      expect(screen.getByTestId('sidebar-section-chains')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-section-documents')).toBeInTheDocument()
      expect(screen.getByTestId('sidebar-section-agents')).toBeInTheDocument()
    })
  })

  describe('Collapse/Expand Functionality', () => {
    it('should collapse sidebar when toggle button is clicked', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      await user.click(toggleButton)

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          isCollapsed: true,
          width: 60,
        })
      )
    })

    it('should expand sidebar when toggle button is clicked in collapsed state', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={collapsedSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      await user.click(toggleButton)

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          isCollapsed: false,
          width: 320, // Should restore to previous width
        })
      )
    })

    it('should show smooth transition animation during collapse', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const sidebar = screen.getByTestId('sidebar-container')
      const toggleButton = screen.getByTestId('sidebar-toggle-button')

      await user.click(toggleButton)

      // Verify transition class is applied
      expect(sidebar).toHaveClass('sidebar-transitioning')
      
      // Wait for transition to complete
      await waitFor(() => {
        expect(sidebar).not.toHaveClass('sidebar-transitioning')
      }, { timeout: 1000 })
    })

    it('should hide sections content when collapsed', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={collapsedSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const chainsSection = screen.getByTestId('sidebar-section-chains')
      expect(chainsSection).toHaveAttribute('data-collapsed', 'true')
      
      // Section content should be hidden but accessible for screen readers
      const sectionContent = screen.getByTestId('chains-section-content')
      expect(sectionContent).toHaveStyle({ display: 'none' })
    })

    it('should show only section icons when collapsed', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={collapsedSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const chainsIcon = screen.getByTestId('sidebar-section-icon-chains')
      const chainsTitle = screen.queryByText('Chains')
      
      expect(chainsIcon).toBeVisible()
      expect(chainsTitle).not.toBeVisible()
    })

    it('should update accessibility attributes during state changes', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      const sidebar = screen.getByTestId('sidebar-container')

      // Initial expanded state
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      expect(sidebar).toHaveAttribute('aria-label', expect.stringContaining('expanded'))

      await user.click(toggleButton)

      // After collapse
      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
        expect(sidebar).toHaveAttribute('aria-label', expect.stringContaining('collapsed'))
      })
    })
  })

  describe('Resize Functionality', () => {
    it('should start resize operation on mouse down on resize handle', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')
      
      fireEvent.mouseDown(resizeHandle, { clientX: 320 })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          isResizing: true,
        })
      )
    })

    it('should resize sidebar width during drag operation', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={resizingSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      // Simulate drag sequence
      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 400 })

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          isResizing: true,
        })
      )
    })

    it('should end resize operation on mouse up', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={resizingSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 400 })
      fireEvent.mouseUp(document)

      expect(mockSidebarCallbacks.onResize).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isResizing: false,
        })
      )
    })

    it('should enforce minimum width constraint during resize', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 100 }) // Below minimum width

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 200, // Should be clamped to minWidth
        })
      )
    })

    it('should enforce maximum width constraint during resize', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const resizeHandle = screen.getByTestId('sidebar-resize-handle')

      fireEvent.mouseDown(resizeHandle, { clientX: 320 })
      fireEvent.mouseMove(document, { clientX: 800 }) // Above maximum width

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 600, // Should be clamped to maxWidth
        })
      )
    })

    it('should show resize cursor during resize operation', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={resizingSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      expect(document.body).toHaveStyle({ cursor: 'col-resize' })
    })

    it('should disable pointer events on sections during resize', () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={resizingSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const chainsSection = screen.getByTestId('sidebar-section-chains')
      expect(chainsSection).toHaveStyle({ pointerEvents: 'none' })
    })
  })

  describe('State Persistence', () => {
    it('should save layout state to localStorage when persistState is true', async () => {
      const mockSetItem = vi.fn()
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

      expect(mockSetItem).toHaveBeenCalledWith(
        'sidebar-layout-state',
        expect.stringContaining('"isCollapsed":true')
      )
    })

    it('should restore layout state from localStorage on mount', () => {
      const savedState = JSON.stringify({
        width: 400,
        isCollapsed: true,
      })

      vi.stubGlobal('localStorage', { 
        getItem: vi.fn().mockReturnValue(savedState),
        setItem: vi.fn(),
        clear: vi.fn()
      })

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      // Should call onLayoutChange with restored state
      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          isCollapsed: true,
        })
      )
    })

    it('should not persist state when persistState is false', async () => {
      const mockSetItem = vi.fn()
      const nonPersistentLayout = { ...baseSidebarLayout, persistState: false }

      vi.stubGlobal('localStorage', { 
        getItem: vi.fn(),
        setItem: mockSetItem,
        clear: vi.fn()
      })

      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={nonPersistentLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      await user.click(toggleButton)

      expect(mockSetItem).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for toggle button', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      toggleButton.focus()

      await user.keyboard('{Enter}')

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          isCollapsed: true,
        })
      )
    })

    it('should support spacebar activation for toggle button', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      toggleButton.focus()

      await user.keyboard(' ')

      expect(mockSidebarCallbacks.onResize).toHaveBeenCalledWith(
        expect.objectContaining({
          isCollapsed: true,
        })
      )
    })

    it('should maintain focus management during state transitions', async () => {
      render(
        <Sidebar
          config={baseSidebarConfig}
          layout={baseSidebarLayout}
          onLayoutChange={mockSidebarCallbacks.onResize}
        />
      )

      const toggleButton = screen.getByTestId('sidebar-toggle-button')
      toggleButton.focus()

      await user.click(toggleButton)

      // Focus should remain on toggle button after collapse
      await waitFor(() => {
        expect(toggleButton).toHaveFocus()
      })
    })
  })

  describe('TypeScript Type Inference', () => {
    it('should infer correct types for sidebar layout', () => {
      const layout = baseSidebarLayout
      
      // Type assertions to verify schema inference
      const widthType: number = layout.width
      const collapsedType: boolean = layout.isCollapsed
      const resizingType: boolean = layout.isResizing
      
      expect(typeof widthType).toBe('number')
      expect(typeof collapsedType).toBe('boolean')
      expect(typeof resizingType).toBe('boolean')
    })

    it('should infer correct types for sidebar config', () => {
      const config = baseSidebarConfig
      
      // Type assertions to verify schema inference
      const sectionsType = config.sections
      const themeType = config.theme
      const globalSearchType = config.globalSearch
      
      expect(Array.isArray(sectionsType)).toBe(true)
      expect(typeof themeType?.headerBackgroundColor).toBe('string')
      expect(typeof globalSearchType?.enabled).toBe('boolean')
    })
  })

  describe('Component Props Validation', () => {
    it('should accept valid sidebar props without errors', () => {
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

    it('should handle optional callback props gracefully', () => {
      expect(() => {
        render(
          <Sidebar
            config={baseSidebarConfig}
            layout={baseSidebarLayout}
          />
        )
      }).not.toThrow()
    })
  })
})