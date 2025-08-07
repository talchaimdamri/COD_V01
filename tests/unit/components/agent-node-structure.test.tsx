/**
 * AgentNode Component Structure Tests
 * 
 * Tests the visual structure and rendering of AgentNode components.
 * Focuses on hexagonal SVG shape, agent icon, and model indicator.
 * 
 * Test Requirements (Task 6.2):
 * - Hexagonal SVG shape with proper dimensions and geometry
 * - Agent/CPU icon rendering and positioning
 * - Model indicator display and positioning
 * - Status indicators and visual states
 * - Schema validation for props
 */

import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { z } from 'zod'
import { 
  agentNodeFixtures, 
  NODE_CONFIG, 
  NODE_SELECTORS,
  nodeTestUtils
} from '../../fixtures/nodes'
import { AgentNode } from '../../../src/components/canvas/nodes'

// Helper function to generate hexagon path
const generateHexagonPath = (radius: number) => {
  const angles = [0, 60, 120, 180, 240, 300]
  const points = angles.map(angle => {
    const radian = (angle * Math.PI) / 180
    return `${Math.cos(radian) * radius},${Math.sin(radian) * radius}`
  })
  return `M${points.join(' L')} Z`
}

// Convert fixtures to match AgentNode props
const convertFixtureToProps = (fixture) => ({
  id: fixture.id,
  type: fixture.type,
  position: fixture.position,
  title: fixture.title,
  data: fixture.data,
  visualState: {
    selected: fixture.selected || false,
    dragging: fixture.dragging || false,
    hovered: fixture.hovered || false,
    focused: false
  }
})
// Wrapper for SVG rendering
const AgentNodeWrapper = ({ node, ...props }) => {
  const nodeProps = convertFixtureToProps(node)
  return (
    <svg width="200" height="150" viewBox="0 0 200 150">
      <AgentNode {...nodeProps} {...props} />
    </svg>
  )
}

describe('AgentNode Component Structure', () => {
  describe('Basic Rendering', () => {
    test('should render agent node with basic structure', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      // Node container should be present
      const nodeElement = screen.getByTestId('agent-node')
      expect(nodeElement).toBeInTheDocument()
      expect(nodeElement).toHaveAttribute('data-node-id', node.id)
      expect(nodeElement).toHaveAttribute('data-node-type', 'agent')
      
      // Should have correct transform for positioning
      expect(nodeElement).toHaveAttribute(
        'transform', 
        `translate(${node.position.x}, ${node.position.y})`
      )
    })
    
    test('should render hexagonal shape with correct geometry', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const shape = screen.getByTestId('agent-shape')
      expect(shape).toBeInTheDocument()
      expect(shape.tagName).toBe('path')
      
      // Check hexagon path geometry
      const expectedPath = generateHexagonPath(NODE_CONFIG.agent.radius)
      expect(shape).toHaveAttribute('d', expectedPath)
      
      // Check stroke properties
      expect(shape).toHaveAttribute('strokeWidth', NODE_CONFIG.agent.strokeWidth.toString())
    })
    
    test('should render CPU/agent icon with proper structure', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const icon = screen.getByTestId('agent-icon')
      expect(icon).toBeInTheDocument()
      
      // Icon should be positioned correctly (centered)
      expect(icon).toHaveAttribute('transform', 'translate(-9, -12)')
      
      // Should contain CPU icon elements
      const iconRects = icon.querySelectorAll('rect')
      expect(iconRects.length).toBeGreaterThan(3) // Main body + pins
      
      // Main CPU body should be present
      const mainBody = Array.from(iconRects).find(rect => 
        rect.getAttribute('width') === '18' && rect.getAttribute('height') === '12'
      )
      expect(mainBody).toBeInTheDocument()
    })
    
    test('should render agent title with proper positioning', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const titleElement = screen.getByTestId('agent-title')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement.tagName).toBe('text')
      
      // Check title positioning (below the hexagon)
      expect(titleElement).toHaveAttribute('x', '0')
      expect(titleElement).toHaveAttribute('y', (NODE_CONFIG.agent.radius + 16).toString())
      expect(titleElement).toHaveAttribute('textAnchor', 'middle')
      
      // Should contain the node title
      expect(titleElement).toHaveTextContent(node.title)
    })
    
    test('should render model indicator', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const modelElement = screen.getByTestId('agent-model')
      expect(modelElement).toBeInTheDocument()
      expect(modelElement.tagName).toBe('text')
      
      // Check model positioning (below title)
      expect(modelElement).toHaveAttribute('x', '0')
      expect(modelElement).toHaveAttribute('y', (NODE_CONFIG.agent.radius + 30).toString())
      expect(modelElement).toHaveAttribute('textAnchor', 'middle')
      expect(modelElement).toHaveAttribute('fontSize', '9')
      
      // Should display the model name
      expect(modelElement).toHaveTextContent(node.data.model)
    })
  })
  
  describe('Visual States', () => {
    test('should apply correct styling for default state', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const shape = screen.getByTestId('agent-shape')
      expect(shape).toHaveAttribute('fill', NODE_CONFIG.agent.colors.default.fill)
      expect(shape).toHaveAttribute('stroke', NODE_CONFIG.agent.colors.default.stroke)
    })
    
    test('should apply correct styling for selected state', () => {
      const node = agentNodeFixtures.selected
      render(<AgentNodeWrapper node={node} />)
      
      const shape = screen.getByTestId('agent-shape')
      expect(shape).toHaveAttribute('fill', NODE_CONFIG.agent.colors.selected.fill)
      expect(shape).toHaveAttribute('stroke', NODE_CONFIG.agent.colors.selected.stroke)
    })
    
    test('should render status indicator with correct positioning', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const statusIndicator = screen.getByTestId('agent-status')
      expect(statusIndicator).toBeInTheDocument()
      expect(statusIndicator).toHaveAttribute('r', '5')
      
      // Should be positioned in top-right area of hexagon
      expect(statusIndicator).toHaveAttribute('cx', (NODE_CONFIG.agent.radius - 8).toString())
      expect(statusIndicator).toHaveAttribute('cy', (-NODE_CONFIG.agent.radius + 8).toString())
    })
    
    test.each([
      ['idle', '#10b981'],
      ['processing', '#f59e0b'],
      ['error', '#ef4444']
    ])('should display correct status color for %s status', (status, expectedColor) => {
      const node = { ...agentNodeFixtures.basic, data: { ...agentNodeFixtures.basic.data, status } }
      render(<AgentNodeWrapper node={node} />)
      
      const statusIndicator = screen.getByTestId('agent-status')
      expect(statusIndicator).toHaveAttribute('fill', expectedColor)
    })
    
    test('should show processing animation for processing status', () => {
      const node = agentNodeFixtures.processing
      render(<AgentNodeWrapper node={node} />)
      
      const processingIndicator = screen.getByTestId('processing-indicator')
      expect(processingIndicator).toBeInTheDocument()
      
      // Should have animation elements
      const animations = processingIndicator.querySelectorAll('animate')
      expect(animations.length).toBe(2) // radius and opacity animations
    })
    
    test('should not show processing animation for non-processing status', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const processingIndicator = screen.queryByTestId('processing-indicator')
      expect(processingIndicator).not.toBeInTheDocument()
    })
  })
  
  describe('Model Display', () => {
    test('should display different model names correctly', () => {
      const modelNames = ['gpt-4', 'claude-3-sonnet', 'gpt-3.5-turbo', 'llama-2']
      
      modelNames.forEach(modelName => {
        const node = { ...agentNodeFixtures.basic, data: { ...agentNodeFixtures.basic.data, model: modelName } }
        const { container } = render(<AgentNodeWrapper node={node} />)
        
        const modelElement = screen.getByTestId('agent-model')
        expect(modelElement).toHaveTextContent(modelName)
        
        container.remove()
      })
    })
    
    test('should handle long model names', () => {
      const longModelName = 'very-long-model-name-that-might-overflow'
      const node = { 
        ...agentNodeFixtures.basic, 
        data: { ...agentNodeFixtures.basic.data, model: longModelName } 
      }
      render(<AgentNodeWrapper node={node} />)
      
      const modelElement = screen.getByTestId('agent-model')
      expect(modelElement).toHaveTextContent(longModelName)
    })
  })
  
  describe('Hexagon Geometry', () => {
    test('should generate correct hexagon path', () => {
      const radius = 35
      const expectedPath = generateHexagonPath(radius)
      
      // Hexagon should have 6 points
      expect(expectedPath).toMatch(/M[\d.-]+,[\d.-]+/)
      expect((expectedPath.match(/L/g) || []).length).toBe(5) // 5 L commands + M command = 6 points
      expect(expectedPath).toMatch(/Z$/) // Should close the path
    })
    
    test('should handle different hexagon sizes', () => {
      const sizes = [20, 30, 40, 50]
      
      sizes.forEach(radius => {
        const path = generateHexagonPath(radius)
        
        // Path should contain coordinates roughly within the radius range
        const coords = path.match(/-?\d+\.?\d*/g)
        if (coords) {
          const maxCoord = Math.max(...coords.map(Math.abs))
          expect(maxCoord).toBeCloseTo(radius, 0)
        }
      })
    })
  })
  
  describe('Schema Validation', () => {
    test('should validate agent node props with Zod schema', () => {
      const schema = nodeTestUtils.createNodeFixtureSchema()
      
      // Valid agent node should pass validation
      const validResult = schema.safeParse(agentNodeFixtures.basic)
      expect(validResult.success).toBe(true)
      
      if (validResult.success) {
        // Type inference test
        const inferredType: z.infer<typeof schema> = validResult.data
        expect(inferredType.type).toBe('agent')
        expect(typeof inferredType.position.x).toBe('number')
        expect(typeof inferredType.position.y).toBe('number')
      }
    })
    
    test('should reject invalid agent node data', () => {
      const schema = nodeTestUtils.createNodeFixtureSchema()
      
      const invalidNode = {
        id: 'invalid-agent',
        type: 'agent',
        position: { x: 100, y: 100 },
        title: 'Invalid Agent',
        data: { 
          model: '', // Invalid empty model
          status: 'invalid-status' 
        }
      }
      
      const result = schema.safeParse(invalidNode)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('model') || issue.path.includes('status')
        )).toBe(true)
      }
    })
    
    test('should validate required agent data fields', () => {
      const schema = nodeTestUtils.createNodeFixtureSchema()
      
      const nodeWithoutModel = {
        ...agentNodeFixtures.basic,
        data: { status: 'idle' } // Missing required model field
      }
      
      const result = schema.safeParse(nodeWithoutModel)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('model')
        )).toBe(true)
      }
    })
  })
  
  describe('Accessibility', () => {
    test('should provide readable text content', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      // Title should be accessible
      const titleElement = screen.getByTestId('agent-title')
      expect(titleElement).toHaveTextContent(node.title)
      
      // Model should be accessible
      const modelElement = screen.getByTestId('agent-model')
      expect(modelElement).toHaveTextContent(node.data.model)
    })
    
    test('should have proper ARIA structure', () => {
      const node = agentNodeFixtures.basic
      render(<AgentNodeWrapper node={node} />)
      
      const nodeElement = screen.getByTestId('agent-node')
      expect(nodeElement).toBeInTheDocument()
      
      // Should have semantic text elements
      const titleElement = screen.getByTestId('agent-title')
      const modelElement = screen.getByTestId('agent-model')
      expect(titleElement).toBeInTheDocument()
      expect(modelElement).toBeInTheDocument()
    })
  })
  
  describe('Props Validation', () => {
    test('should handle all required props', () => {
      const node = agentNodeFixtures.minimal
      expect(() => {
        render(<AgentNodeWrapper node={node} />)
      }).not.toThrow()
      
      // Validate fixture structure
      expect(nodeTestUtils.validateNodeFixture(node)).toBe(true)
    })
    
    test('should handle optional props gracefully', () => {
      const nodeWithoutOptionalProps = {
        id: 'test-minimal-agent',
        type: 'agent' as const,
        position: { x: 100, y: 100 },
        title: 'Minimal Agent',
        data: { model: 'gpt-4', status: 'idle' as const }
      }
      
      expect(() => {
        render(<AgentNodeWrapper node={nodeWithoutOptionalProps} />)
      }).not.toThrow()
    })
  })
  
  describe('Integration with Fixtures', () => {
    test('should work with all agent node fixtures', () => {
      Object.values(agentNodeFixtures).forEach(fixture => {
        expect(() => {
          render(<AgentNodeWrapper node={fixture} />)
        }).not.toThrow()
        
        // Each fixture should be valid
        expect(nodeTestUtils.validateNodeFixture(fixture)).toBe(true)
      })
    })
    
    test('should maintain consistent structure across fixtures', () => {
      Object.entries(agentNodeFixtures).forEach(([fixtureName, fixture]) => {
        const { container } = render(<AgentNodeWrapper node={fixture} />)
        
        // All fixtures should render the same basic structure
        expect(screen.getByTestId('agent-node')).toBeInTheDocument()
        expect(screen.getByTestId('agent-shape')).toBeInTheDocument()
        expect(screen.getByTestId('agent-icon')).toBeInTheDocument()
        expect(screen.getByTestId('agent-title')).toBeInTheDocument()
        expect(screen.getByTestId('agent-model')).toBeInTheDocument()
        expect(screen.getByTestId('agent-status')).toBeInTheDocument()
        
        // Processing animation should only be present for processing status
        const processingIndicator = screen.queryByTestId('processing-indicator')
        if (fixture.data.status === 'processing') {
          expect(processingIndicator).toBeInTheDocument()
        } else {
          expect(processingIndicator).not.toBeInTheDocument()
        }
        
        container.remove()
      })
    })
  })
})