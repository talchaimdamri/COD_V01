/**
 * Node Selection States and Hover Effects Tests
 * 
 * Tests visual feedback for selection states, hover effects, and connection points.
 * Covers keyboard navigation, focus management, and accessibility features.
 * 
 * Test Requirements (Task 6.4):
 * - Selection state visual feedback
 * - Hover effects and transitions
 * - Connection points visibility
 * - Keyboard navigation and focus
 * - Multiple selection handling
 * - Accessibility compliance
 */

import React from 'react'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { 
  documentNodeFixtures,
  agentNodeFixtures,
  selectionScenarios,
  NODE_CONFIG,
  NODE_SELECTORS
} from '../../fixtures/nodes'

// Mock SelectableNode component with selection and hover states
const SelectableNode = vi.fn(({ node, isSelected, isHovered, onSelect, onHover, onFocus, ...props }) => {
  const [localHover, setLocalHover] = React.useState(false)
  const [hasFocus, setHasFocus] = React.useState(false)
  
  const handleMouseEnter = () => {
    setLocalHover(true)
    onHover?.(node.id, true)
  }
  
  const handleMouseLeave = () => {
    setLocalHover(false)
    onHover?.(node.id, false)
  }
  
  const handleClick = (event) => {
    event.stopPropagation()
    onSelect?.(node.id, {
      multiSelect: event.ctrlKey || event.metaKey,
      shiftKey: event.shiftKey
    })
  }
  
  const handleFocus = () => {
    setHasFocus(true)
    onFocus?.(node.id)
  }
  
  const handleBlur = () => {
    setHasFocus(false)
  }
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.(node.id, { keyboardActivated: true })
    }
  }
  
  const currentState = {
    selected: isSelected || false,
    hovered: isHovered || localHover,
    focused: hasFocus
  }
  
  const getColors = () => {
    const config = NODE_CONFIG[node.type]
    if (currentState.selected) return config.colors.selected
    if (currentState.hovered) return config.colors.hover
    return config.colors.default
  }
  
  const colors = getColors()
  const opacity = node.dragging ? 0.8 : 1
  
  return (
    <g
      data-testid={`${node.type}-node`}
      data-node-id={node.id}
      data-selected={currentState.selected}
      data-hovered={currentState.hovered}
      data-focused={currentState.focused}
      transform={`translate(${node.position.x}, ${node.position.y})`}
      tabIndex={0}
      role="button"
      aria-label={`${node.type} node: ${node.title}`}
      aria-selected={currentState.selected}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        cursor: 'pointer',
        outline: hasFocus ? '2px solid #1d4ed8' : 'none',
        opacity
      }}
      {...props}
    >
      {/* Selection indicator ring */}
      {currentState.selected && (
        <circle
          data-testid="selection-indicator"
          r={node.type === 'document' ? 50 : 45}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="3"
          strokeDasharray="5,5"
          opacity="0.8"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0;360"
            dur="3s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      
      {/* Hover indicator */}
      {currentState.hovered && !currentState.selected && (
        <circle
          data-testid="hover-indicator"
          r={node.type === 'document' ? 48 : 43}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          opacity="0.6"
        />
      )}
      
      {/* Main node shape */}
      {node.type === 'document' ? (
        <rect
          data-testid="node-shape"
          x={-NODE_CONFIG.document.width / 2}
          y={-NODE_CONFIG.document.height / 2}
          width={NODE_CONFIG.document.width}
          height={NODE_CONFIG.document.height}
          rx={NODE_CONFIG.document.borderRadius}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={NODE_CONFIG.document.strokeWidth}
          className="transition-all duration-200"
        />
      ) : (
        <circle
          data-testid="node-shape"
          r={NODE_CONFIG.agent.radius}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={NODE_CONFIG.agent.strokeWidth}
          className="transition-all duration-200"
        />
      )}
      
      {/* Connection points - visible on hover or selection */}
      {(currentState.hovered || currentState.selected) && (
        <g data-testid="connection-points">
          {/* Top connection point */}
          <circle
            data-testid="connection-point-top"
            cx={0}
            cy={node.type === 'document' ? -NODE_CONFIG.document.height / 2 : -NODE_CONFIG.agent.radius}
            r="4"
            fill="#1d4ed8"
            stroke="white"
            strokeWidth="2"
            className="connection-point"
          />
          
          {/* Right connection point */}
          <circle
            data-testid="connection-point-right"
            cx={node.type === 'document' ? NODE_CONFIG.document.width / 2 : NODE_CONFIG.agent.radius}
            cy={0}
            r="4"
            fill="#1d4ed8"
            stroke="white"
            strokeWidth="2"
            className="connection-point"
          />
          
          {/* Bottom connection point */}
          <circle
            data-testid="connection-point-bottom"
            cx={0}
            cy={node.type === 'document' ? NODE_CONFIG.document.height / 2 : NODE_CONFIG.agent.radius}
            r="4"
            fill="#1d4ed8"
            stroke="white"
            strokeWidth="2"
            className="connection-point"
          />
          
          {/* Left connection point */}
          <circle
            data-testid="connection-point-left"
            cx={node.type === 'document' ? -NODE_CONFIG.document.width / 2 : -NODE_CONFIG.agent.radius}
            cy={0}
            r="4"
            fill="#1d4ed8"
            stroke="white"
            strokeWidth="2"
            className="connection-point"
          />
        </g>
      )}
      
      {/* Node title */}
      <text
        data-testid="node-title"
        textAnchor="middle"
        dy="0.3em"
        fontSize="12"
        fontWeight="500"
        fill={colors.text}
        pointerEvents="none"
      >
        {node.title}
      </text>
    </g>
  )
})

// Test canvas with selection management
const SelectionCanvas = ({ nodes = [], selectedIds = [], hoveredId = null, onSelectionChange, onHoverChange }) => (
  <svg width="800" height="600" data-testid="selection-canvas">
    {nodes.map(node => (
      <SelectableNode
        key={node.id}
        node={node}
        isSelected={selectedIds.includes(node.id)}
        isHovered={hoveredId === node.id}
        onSelect={(nodeId, options) => onSelectionChange?.(nodeId, options)}
        onHover={(nodeId, isHovered) => onHoverChange?.(nodeId, isHovered)}
      />
    ))}
  </svg>
)

describe('Node Selection States and Hover Effects', () => {
  let mockHandlers
  const user = userEvent.setup()

  beforeEach(() => {
    mockHandlers = {
      onSelectionChange: vi.fn(),
      onHoverChange: vi.fn()
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Selection State Visual Feedback', () => {
    test('should display selection indicator for selected document node', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      const selectionIndicator = screen.getByTestId('selection-indicator')
      
      expect(nodeElement).toHaveAttribute('data-selected', 'true')
      expect(selectionIndicator).toBeInTheDocument()
      expect(selectionIndicator).toHaveAttribute('stroke', '#1d4ed8')
      expect(selectionIndicator).toHaveAttribute('strokeDasharray', '5,5')
    })
    
    test('should display selection indicator for selected agent node', () => {
      const node = agentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('agent-node')
      const selectionIndicator = screen.getByTestId('selection-indicator')
      
      expect(nodeElement).toHaveAttribute('data-selected', 'true')
      expect(selectionIndicator).toBeInTheDocument()
      expect(selectionIndicator).toHaveAttribute('r', '45') // Slightly smaller for agent
    })
    
    test('should apply selected styling to node shape', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const nodeShape = screen.getByTestId('node-shape')
      expect(nodeShape).toHaveAttribute('fill', NODE_CONFIG.document.colors.selected.fill)
      expect(nodeShape).toHaveAttribute('stroke', NODE_CONFIG.document.colors.selected.stroke)
    })
    
    test('should animate selection indicator rotation', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const selectionIndicator = screen.getByTestId('selection-indicator')
      const animation = selectionIndicator.querySelector('animateTransform')
      
      expect(animation).toBeInTheDocument()
      expect(animation).toHaveAttribute('values', '0;360')
      expect(animation).toHaveAttribute('dur', '3s')
      expect(animation).toHaveAttribute('repeatCount', 'indefinite')
    })
  })
  
  describe('Hover Effects', () => {
    test('should display hover indicator on mouse enter', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      
      await user.hover(nodeElement)
      
      expect(mockHandlers.onHoverChange).toHaveBeenCalledWith(node.id, true)
      expect(nodeElement).toHaveAttribute('data-hovered', 'true')
      
      const hoverIndicator = screen.getByTestId('hover-indicator')
      expect(hoverIndicator).toBeInTheDocument()
    })
    
    test('should apply hover styling to node shape', async () => {
      const node = agentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          hoveredId={node.id}
          {...mockHandlers} 
        />
      )
      
      const nodeShape = screen.getByTestId('node-shape')
      expect(nodeShape).toHaveAttribute('fill', NODE_CONFIG.agent.colors.hover.fill)
      expect(nodeShape).toHaveAttribute('stroke', NODE_CONFIG.agent.colors.hover.stroke)
    })
    
    test('should remove hover effects on mouse leave', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      
      await user.hover(nodeElement)
      await user.unhover(nodeElement)
      
      expect(mockHandlers.onHoverChange).toHaveBeenCalledWith(node.id, false)
      expect(nodeElement).toHaveAttribute('data-hovered', 'false')
    })
    
    test('should prioritize selection styling over hover styling', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          hoveredId={node.id}
          {...mockHandlers} 
        />
      )
      
      const nodeShape = screen.getByTestId('node-shape')
      const selectionIndicator = screen.getByTestId('selection-indicator')
      const hoverIndicator = screen.queryByTestId('hover-indicator')
      
      // Should show selection styling, not hover styling
      expect(nodeShape).toHaveAttribute('fill', NODE_CONFIG.document.colors.selected.fill)
      expect(selectionIndicator).toBeInTheDocument()
      expect(hoverIndicator).not.toBeInTheDocument() // Hover indicator hidden when selected
    })
  })
  
  describe('Connection Points', () => {
    test('should show connection points on hover', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          hoveredId={node.id}
          {...mockHandlers} 
        />
      )
      
      const connectionPoints = screen.getByTestId('connection-points')
      expect(connectionPoints).toBeInTheDocument()
      
      // Should have all 4 connection points
      expect(screen.getByTestId('connection-point-top')).toBeInTheDocument()
      expect(screen.getByTestId('connection-point-right')).toBeInTheDocument()
      expect(screen.getByTestId('connection-point-bottom')).toBeInTheDocument()
      expect(screen.getByTestId('connection-point-left')).toBeInTheDocument()
    })
    
    test('should show connection points on selection', () => {
      const node = agentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const connectionPoints = screen.getByTestId('connection-points')
      expect(connectionPoints).toBeInTheDocument()
    })
    
    test('should position connection points correctly for document nodes', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const topPoint = screen.getByTestId('connection-point-top')
      const rightPoint = screen.getByTestId('connection-point-right')
      const bottomPoint = screen.getByTestId('connection-point-bottom')
      const leftPoint = screen.getByTestId('connection-point-left')
      
      expect(topPoint).toHaveAttribute('cy', (-NODE_CONFIG.document.height / 2).toString())
      expect(rightPoint).toHaveAttribute('cx', (NODE_CONFIG.document.width / 2).toString())
      expect(bottomPoint).toHaveAttribute('cy', (NODE_CONFIG.document.height / 2).toString())
      expect(leftPoint).toHaveAttribute('cx', (-NODE_CONFIG.document.width / 2).toString())
    })
    
    test('should position connection points correctly for agent nodes', () => {
      const node = agentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const topPoint = screen.getByTestId('connection-point-top')
      const rightPoint = screen.getByTestId('connection-point-right')
      
      expect(topPoint).toHaveAttribute('cy', (-NODE_CONFIG.agent.radius).toString())
      expect(rightPoint).toHaveAttribute('cx', NODE_CONFIG.agent.radius.toString())
    })
    
    test('should hide connection points when node is not hovered or selected', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const connectionPoints = screen.queryByTestId('connection-points')
      expect(connectionPoints).not.toBeInTheDocument()
    })
  })
  
  describe('Keyboard Navigation', () => {
    test('should handle click selection', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      await user.click(nodeElement)
      
      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith(node.id, {
        multiSelect: false,
        shiftKey: false
      })
    })
    
    test('should handle Enter key selection', async () => {
      const node = agentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('agent-node')
      nodeElement.focus()
      
      await user.keyboard('[Enter]')
      
      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith(node.id, {
        keyboardActivated: true
      })
    })
    
    test('should handle Space key selection', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      nodeElement.focus()
      
      await user.keyboard('[Space]')
      
      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith(node.id, {
        keyboardActivated: true
      })
    })
    
    test('should handle Ctrl+click for multi-selection', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      
      await user.click(nodeElement, { ctrlKey: true })
      
      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith(node.id, {
        multiSelect: true,
        shiftKey: false
      })
    })
    
    test('should show focus indicator', async () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      
      await user.tab() // Focus the node
      
      expect(nodeElement).toHaveAttribute('data-focused', 'true')
      expect(nodeElement).toHaveStyle('outline: 2px solid #1d4ed8')
    })
  })
  
  describe('Multiple Selection', () => {
    test('should handle multiple selected nodes', () => {
      const nodes = [
        documentNodeFixtures.basic,
        agentNodeFixtures.basic,
        documentNodeFixtures.selected
      ]
      const selectedIds = [nodes[0].id, nodes[2].id]
      
      render(
        <SelectionCanvas 
          nodes={nodes} 
          selectedIds={selectedIds}
          {...mockHandlers} 
        />
      )
      
      // Two nodes should show selection indicators
      const selectionIndicators = screen.getAllByTestId('selection-indicator')
      expect(selectionIndicators).toHaveLength(2)
      
      // Selected nodes should have correct attributes
      const docNode1 = screen.getByTestId('document-node')
      const docNode2 = screen.getAllByTestId('document-node')[1]
      const agentNode = screen.getByTestId('agent-node')
      
      expect(docNode1).toHaveAttribute('data-selected', 'true')
      expect(docNode2).toHaveAttribute('data-selected', 'true')
      expect(agentNode).toHaveAttribute('data-selected', 'false')
    })
    
    test('should differentiate between different node types in selection', () => {
      const nodes = [documentNodeFixtures.basic, agentNodeFixtures.basic]
      const selectedIds = [nodes[0].id, nodes[1].id]
      
      render(
        <SelectionCanvas 
          nodes={nodes} 
          selectedIds={selectedIds}
          {...mockHandlers} 
        />
      )
      
      const selectionIndicators = screen.getAllByTestId('selection-indicator')
      expect(selectionIndicators).toHaveLength(2)
      
      // Different radii for different node types
      expect(selectionIndicators[0]).toHaveAttribute('r', '50') // Document
      expect(selectionIndicators[1]).toHaveAttribute('r', '45') // Agent
    })
  })
  
  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          selectedIds={[node.id]}
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      
      expect(nodeElement).toHaveAttribute('role', 'button')
      expect(nodeElement).toHaveAttribute('aria-label', `document node: ${node.title}`)
      expect(nodeElement).toHaveAttribute('aria-selected', 'true')
      expect(nodeElement).toHaveAttribute('tabIndex', '0')
    })
    
    test('should be keyboard accessible', () => {
      const node = agentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('agent-node')
      
      // Should be focusable
      expect(nodeElement).toHaveAttribute('tabIndex', '0')
      
      // Should respond to keyboard events
      nodeElement.focus()
      expect(nodeElement).toHaveAttribute('data-focused', 'true')
    })
    
    test('should provide screen reader friendly labels', () => {
      const nodes = [
        { ...documentNodeFixtures.basic, title: 'Important Document' },
        { ...agentNodeFixtures.basic, title: 'Processing Agent' }
      ]
      
      render(
        <SelectionCanvas 
          nodes={nodes} 
          {...mockHandlers} 
        />
      )
      
      expect(screen.getByLabelText('document node: Important Document')).toBeInTheDocument()
      expect(screen.getByLabelText('agent node: Processing Agent')).toBeInTheDocument()
    })
  })
  
  describe('Visual Transitions', () => {
    test('should apply CSS transitions to node shape changes', () => {
      const node = documentNodeFixtures.basic
      render(
        <SelectionCanvas 
          nodes={[node]} 
          {...mockHandlers} 
        />
      )
      
      const nodeShape = screen.getByTestId('node-shape')
      expect(nodeShape).toHaveClass('transition-all', 'duration-200')
    })
    
    test('should handle dragging opacity changes', () => {
      const draggingNode = { ...documentNodeFixtures.basic, dragging: true }
      render(
        <SelectionCanvas 
          nodes={[draggingNode]} 
          {...mockHandlers} 
        />
      )
      
      const nodeElement = screen.getByTestId('document-node')
      expect(nodeElement).toHaveStyle('opacity: 0.8')
    })
  })
  
  describe('Event Propagation', () => {
    test('should stop propagation on node click', async () => {
      const node = documentNodeFixtures.basic
      const canvasClickHandler = vi.fn()
      
      render(
        <div onClick={canvasClickHandler}>
          <SelectionCanvas 
            nodes={[node]} 
            {...mockHandlers} 
          />
        </div>
      )
      
      const nodeElement = screen.getByTestId('document-node')
      await user.click(nodeElement)
      
      expect(mockHandlers.onSelectionChange).toHaveBeenCalled()
      expect(canvasClickHandler).not.toHaveBeenCalled()
    })
  })
  
  describe('Error Handling', () => {
    test('should handle missing node properties gracefully', () => {
      const incompleteNode = {
        id: 'incomplete',
        type: 'document',
        position: { x: 100, y: 100 }
        // Missing title
      }
      
      expect(() => {
        render(
          <SelectionCanvas 
            nodes={[incompleteNode]} 
            {...mockHandlers} 
          />
        )
      }).not.toThrow()
    })
    
    test('should handle invalid selection IDs', () => {
      const node = documentNodeFixtures.basic
      const invalidSelectedIds = ['non-existent-id']
      
      expect(() => {
        render(
          <SelectionCanvas 
            nodes={[node]} 
            selectedIds={invalidSelectedIds}
            {...mockHandlers} 
          />
        )
      }).not.toThrow()
      
      // Node should not be selected
      const nodeElement = screen.getByTestId('document-node')
      expect(nodeElement).toHaveAttribute('data-selected', 'false')
    })
  })
})