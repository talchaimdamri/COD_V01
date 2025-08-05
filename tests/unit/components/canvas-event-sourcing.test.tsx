/**
 * Canvas Event Sourcing Integration Test
 * 
 * Tests the Canvas component with event sourcing integration
 * to ensure it properly uses the event-driven state management.
 */

import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Canvas from '../../../src/components/canvas/Canvas'

// Mock the event sourcing hook to avoid API calls in tests
vi.mock('../../../src/lib/eventSourcing', () => ({
  useCanvasEventSourcing: () => ({
    canvasState: {
      nodes: [],
      viewBox: { x: 0, y: 0, width: 1200, height: 800 },
      scale: 1,
      isPanning: false,
      selectedNodeId: null,
      dragState: {
        isDragging: false,
        nodeId: null,
        startPosition: null,
        currentPosition: null,
      },
    },
    eventHistory: [],
    currentEventIndex: -1,
    isLoading: false,
    error: null,
    canUndo: false,
    canRedo: false,
    addNode: vi.fn(),
    moveNode: vi.fn(),
    deleteNode: vi.fn(),
    selectElement: vi.fn(),
    panCanvas: vi.fn(),
    zoomCanvas: vi.fn(),
    resetView: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    replayEvents: vi.fn(),
    clearHistory: vi.fn(),
  })
}))

describe('Canvas Event Sourcing Integration', () => {
  test('should render canvas with event sourcing without crashing', () => {
    render(<Canvas />)
    
    // Verify canvas container is present
    const canvas = screen.getByTestId('canvas')
    expect(canvas).toBeInTheDocument()
    
    // Verify SVG element is present
    const svg = screen.getByTestId('canvas-svg')
    expect(svg).toBeInTheDocument()
    
    // Verify proper viewBox is set
    expect(svg).toHaveAttribute('viewBox', '0 0 1200 800')
  })

  test('should handle loading state', () => {
    // Mock loading state
    vi.mocked(vi.importMock('../../../src/lib/eventSourcing')).useCanvasEventSourcing.mockReturnValueOnce({
      canvasState: {
        nodes: [],
        viewBox: { x: 0, y: 0, width: 1200, height: 800 },
        scale: 1,
        isPanning: false,
        selectedNodeId: null,
        dragState: {
          isDragging: false,
          nodeId: null,
          startPosition: null,
          currentPosition: null,
        },
      },
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: true, // Set loading to true
      error: null,
      canUndo: false,
      canRedo: false,
      addNode: vi.fn(),
      moveNode: vi.fn(),
      deleteNode: vi.fn(),
      selectElement: vi.fn(),
      panCanvas: vi.fn(),
      zoomCanvas: vi.fn(),
      resetView: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      replayEvents: vi.fn(),
      clearHistory: vi.fn(),
    })

    render(<Canvas />)
    
    // Should show loading state for empty canvas
    expect(screen.getByText('Loading canvas...')).toBeInTheDocument()
  })

  test('should display error state', () => {
    // Mock error state
    vi.mocked(vi.importMock('../../../src/lib/eventSourcing')).useCanvasEventSourcing.mockReturnValueOnce({
      canvasState: {
        nodes: [],
        viewBox: { x: 0, y: 0, width: 1200, height: 800 },
        scale: 1,
        isPanning: false,
        selectedNodeId: null,
        dragState: {
          isDragging: false,
          nodeId: null,
          startPosition: null,
          currentPosition: null,
        },
      },
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: 'Failed to load events',
      canUndo: false,
      canRedo: false,
      addNode: vi.fn(),
      moveNode: vi.fn(),
      deleteNode: vi.fn(),
      selectElement: vi.fn(),
      panCanvas: vi.fn(),
      zoomCanvas: vi.fn(),
      resetView: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      replayEvents: vi.fn(),
      clearHistory: vi.fn(),
    })

    render(<Canvas />)
    
    // Should display error message
    expect(screen.getByText('Error: Failed to load events')).toBeInTheDocument()
  })

  test('should show undo/redo indicators when available', () => {
    // Mock undo/redo available state
    vi.mocked(vi.importMock('../../../src/lib/eventSourcing')).useCanvasEventSourcing.mockReturnValueOnce({
      canvasState: {
        nodes: [],
        viewBox: { x: 0, y: 0, width: 1200, height: 800 },
        scale: 1,
        isPanning: false,
        selectedNodeId: null,
        dragState: {
          isDragging: false,
          nodeId: null,
          startPosition: null,
          currentPosition: null,
        },
      },
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: true, // Undo available
      canRedo: true, // Redo available
      addNode: vi.fn(),
      moveNode: vi.fn(),
      deleteNode: vi.fn(),
      selectElement: vi.fn(),
      panCanvas: vi.fn(),
      zoomCanvas: vi.fn(),
      resetView: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      replayEvents: vi.fn(),
      clearHistory: vi.fn(),
    })

    render(<Canvas />)
    
    // Should show undo/redo indicators
    expect(screen.getByText('Ctrl+Z to undo')).toBeInTheDocument()
    expect(screen.getByText('Ctrl+Y to redo')).toBeInTheDocument()
  })

  test('should render nodes from event sourcing state', () => {
    // Mock state with nodes
    vi.mocked(vi.importMock('../../../src/lib/eventSourcing')).useCanvasEventSourcing.mockReturnValueOnce({
      canvasState: {
        nodes: [
          {
            id: 'node-1',
            type: 'document',
            position: { x: 100, y: 200 },
            title: 'Document 1',
          },
          {
            id: 'node-2',
            type: 'agent',
            position: { x: 300, y: 400 },
            title: 'Agent 1',
          },
        ],
        viewBox: { x: 0, y: 0, width: 1200, height: 800 },
        scale: 1,
        isPanning: false,
        selectedNodeId: 'node-1',
        dragState: {
          isDragging: false,
          nodeId: null,
          startPosition: null,
          currentPosition: null,
        },
      },
      eventHistory: [],
      currentEventIndex: -1,
      isLoading: false,
      error: null,
      canUndo: false,
      canRedo: false,
      addNode: vi.fn(),
      moveNode: vi.fn(),
      deleteNode: vi.fn(),
      selectElement: vi.fn(),
      panCanvas: vi.fn(),
      zoomCanvas: vi.fn(),
      resetView: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      replayEvents: vi.fn(),
      clearHistory: vi.fn(),
    })

    render(<Canvas />)
    
    // Should render both nodes
    const nodes = screen.getAllByTestId('canvas-node')
    expect(nodes).toHaveLength(2)
    
    // Verify node positions are set correctly
    expect(nodes[0]).toHaveAttribute('transform', 'translate(100, 200)')
    expect(nodes[1]).toHaveAttribute('transform', 'translate(300, 400)')
    
    // Verify node types
    expect(nodes[0]).toHaveAttribute('data-node-type', 'document')
    expect(nodes[1]).toHaveAttribute('data-node-type', 'agent')
    
    // Verify selected node styling
    expect(nodes[0]).toHaveClass('selected')
    expect(nodes[1]).not.toHaveClass('selected')
  })
})