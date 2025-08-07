/**
 * Drag-and-Drop Edge Creation Happy Path Tests
 * 
 * Tests successful edge creation workflows from anchor to anchor.
 * Following TDD methodology - these tests define expected behavior before implementation.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EdgeCreator } from '../../../../src/components/edges/EdgeCreator'
import { creationStates, baseConnectionPoints, edgeStyles } from '../../../fixtures/edges'

// Mock pointer events for drag simulation
const mockPointerEvents = () => {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
}

describe('Drag-and-Drop Edge Creation - Happy Path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPointerEvents()
  })

  test('should initiate edge creation on anchor drag start', () => {
    const onCreationStart = vi.fn()
    const props = {
      creationState: creationStates.inactive,
      onCreationStart,
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    expect(creator).toBeInTheDocument()
    
    // Simulate drag start from an anchor
    fireEvent.pointerDown(creator, {
      pointerId: 1,
      clientX: 200,
      clientY: 150,
    })
    
    expect(onCreationStart).toHaveBeenCalledWith({
      sourceConnection: null,
      startPosition: { x: 200, y: 150 },
      event: expect.any(Object),
    })
  })

  test('should show preview edge during creation', () => {
    const props = {
      creationState: creationStates.started,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    // Should render preview edge from source to current position
    const previewEdge = screen.getByTestId('connection-preview')
    expect(previewEdge).toBeInTheDocument()
    expect(previewEdge).toHaveAttribute('stroke-dasharray', '5,5')
    expect(previewEdge).toHaveAttribute('opacity', '0.6')
    
    // Should start from source connection
    const pathData = previewEdge.getAttribute('d')
    expect(pathData).toContain('M 200,150') // Source position
    expect(pathData).toContain('L 300,150') // Current position
  })

  test('should update preview edge on mouse move', () => {
    const onCreationMove = vi.fn()
    const props = {
      creationState: creationStates.started,
      onCreationStart: vi.fn(),
      onCreationMove,
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    
    // Simulate mouse move during creation
    fireEvent.pointerMove(creator, {
      pointerId: 1,
      clientX: 350,
      clientY: 200,
    })
    
    expect(onCreationMove).toHaveBeenCalledWith({
      currentPosition: { x: 350, y: 200 },
      sourceConnection: creationStates.started.sourceConnection,
      validTarget: null,
      event: expect.any(Object),
    })
  })

  test('should highlight valid target during hover', () => {
    const props = {
      creationState: creationStates.hovering,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    // Should render preview edge to valid target
    const previewEdge = screen.getByTestId('connection-preview')
    expect(previewEdge).toHaveClass('preview-valid')
    expect(previewEdge).toHaveAttribute('stroke', '#10b981') // Valid color
    
    // Path should end at valid target position
    const pathData = previewEdge.getAttribute('d')
    expect(pathData).toContain('L 400,150') // Target position
  })

  test('should show invalid state when hovering incompatible anchor', () => {
    const props = {
      creationState: creationStates.invalidTarget,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const previewEdge = screen.getByTestId('connection-preview')
    expect(previewEdge).toHaveClass('preview-invalid')
    expect(previewEdge).toHaveAttribute('stroke', '#ef4444') // Invalid color
  })

  test('should complete edge creation on valid target drop', () => {
    const onCreationEnd = vi.fn()
    const props = {
      creationState: creationStates.hovering,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd,
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    
    // Simulate drop on valid target
    fireEvent.pointerUp(creator, {
      pointerId: 1,
      clientX: 400,
      clientY: 150,
    })
    
    expect(onCreationEnd).toHaveBeenCalledWith({
      sourceConnection: creationStates.hovering.sourceConnection,
      targetConnection: creationStates.hovering.validTarget,
      success: true,
      event: expect.any(Object),
    })
  })

  test('should cancel creation on invalid drop', () => {
    const onCreationEnd = vi.fn()
    const props = {
      creationState: creationStates.invalidTarget,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd,
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    
    // Simulate drop on invalid area
    fireEvent.pointerUp(creator, {
      pointerId: 1,
      clientX: 350,
      clientY: 200,
    })
    
    expect(onCreationEnd).toHaveBeenCalledWith({
      sourceConnection: creationStates.invalidTarget.sourceConnection,
      targetConnection: null,
      success: false,
      event: expect.any(Object),
    })
  })

  test('should cancel creation on escape key', () => {
    const onCreationEnd = vi.fn()
    const props = {
      creationState: creationStates.started,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd,
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    // Press escape to cancel
    fireEvent.keyDown(document, { key: 'Escape' })
    
    expect(onCreationEnd).toHaveBeenCalledWith({
      sourceConnection: creationStates.started.sourceConnection,
      targetConnection: null,
      success: false,
      cancelled: true,
      event: expect.any(Object),
    })
  })

  test('should handle bezier preview during creation', () => {
    const props = {
      creationState: {
        ...creationStates.started,
        previewType: 'bezier' as const,
      },
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const previewEdge = screen.getByTestId('connection-preview')
    
    // Should render as bezier curve
    const pathData = previewEdge.getAttribute('d')
    expect(pathData).toContain('C') // Bezier curve command
    expect(pathData).toMatch(/M \d+,\d+ C \d+,\d+ \d+,\d+ \d+,\d+/)
  })

  test('should provide visual feedback during creation process', () => {
    const props = {
      creationState: creationStates.started,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    // Should show cursor change
    const creator = screen.getByTestId('edge-creator')
    expect(creator).toHaveAttribute('cursor', 'crosshair')
    
    // Should show creation indicators
    const creationIndicator = screen.getByTestId('creation-indicator')
    expect(creationIndicator).toBeInTheDocument()
    expect(creationIndicator).toHaveTextContent('Creating connection...')
  })

  test('should handle multi-touch scenarios', () => {
    const onCreationEnd = vi.fn()
    const props = {
      creationState: creationStates.started,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd,
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    
    // Start first touch
    fireEvent.pointerDown(creator, {
      pointerId: 1,
      clientX: 200,
      clientY: 150,
    })
    
    // Start second touch (should be ignored during creation)
    fireEvent.pointerDown(creator, {
      pointerId: 2,
      clientX: 300,
      clientY: 200,
    })
    
    // End first touch
    fireEvent.pointerUp(creator, {
      pointerId: 1,
      clientX: 400,
      clientY: 150,
    })
    
    // Should only handle the primary pointer
    expect(onCreationEnd).toHaveBeenCalledTimes(1)
  })

  test('should snap to nearby connection points', () => {
    const onCreationMove = vi.fn()
    const props = {
      creationState: creationStates.started,
      snapDistance: 20,
      onCreationStart: vi.fn(),
      onCreationMove,
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
      nearbyConnections: [
        {
          nodeId: 'nearby-node',
          anchorId: 'left',
          position: { x: 395, y: 155 }, // Close to current position
        },
      ],
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    
    // Move near a connection point
    fireEvent.pointerMove(creator, {
      pointerId: 1,
      clientX: 390,
      clientY: 150,
    })
    
    // Should snap to nearby connection
    expect(onCreationMove).toHaveBeenCalledWith({
      currentPosition: { x: 395, y: 155 }, // Snapped position
      sourceConnection: creationStates.started.sourceConnection,
      validTarget: expect.objectContaining({
        nodeId: 'nearby-node',
        anchorId: 'left',
        position: { x: 395, y: 155 },
      }),
      snapped: true,
      event: expect.any(Object),
    })
  })

  test('should handle creation with touch events', () => {
    const onCreationStart = vi.fn()
    const onCreationEnd = vi.fn()
    const props = {
      creationState: creationStates.inactive,
      onCreationStart,
      onCreationMove: vi.fn(),
      onCreationEnd,
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    
    // Simulate touch start
    fireEvent.touchStart(creator, {
      touches: [{ clientX: 200, clientY: 150 }],
    })
    
    expect(onCreationStart).toHaveBeenCalled()
    
    // Simulate touch end
    fireEvent.touchEnd(creator, {
      changedTouches: [{ clientX: 400, clientY: 150 }],
    })
    
    expect(onCreationEnd).toHaveBeenCalled()
  })

  test('should provide accessibility features for creation', () => {
    const props = {
      creationState: creationStates.started,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    const creator = screen.getByTestId('edge-creator')
    expect(creator).toHaveAttribute('role', 'application')
    expect(creator).toHaveAttribute('aria-label', 'Edge creation area')
    
    // Should announce creation state
    const announcement = screen.getByTestId('creation-announcement')
    expect(announcement).toHaveAttribute('aria-live', 'polite')
    expect(announcement).toHaveTextContent('Creating edge connection')
  })

  test('should handle creation state transitions correctly', async () => {
    const props = {
      creationState: creationStates.inactive,
      onCreationStart: vi.fn(),
      onCreationMove: vi.fn(),
      onCreationEnd: vi.fn(),
      previewStyle: edgeStyles.dashed,
    }
    
    const { rerender } = render(
      <svg>
        <EdgeCreator {...props} />
      </svg>
    )
    
    // Start creation
    rerender(
      <svg>
        <EdgeCreator {...props} creationState={creationStates.started} />
      </svg>
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('connection-preview')).toBeInTheDocument()
    })
    
    // Move to hovering valid target
    rerender(
      <svg>
        <EdgeCreator {...props} creationState={creationStates.hovering} />
      </svg>
    )
    
    await waitFor(() => {
      const preview = screen.getByTestId('connection-preview')
      expect(preview).toHaveClass('preview-valid')
    })
    
    // Complete creation
    rerender(
      <svg>
        <EdgeCreator {...props} creationState={creationStates.inactive} />
      </svg>
    )
    
    await waitFor(() => {
      expect(screen.queryByTestId('connection-preview')).not.toBeInTheDocument()
    })
  })
})