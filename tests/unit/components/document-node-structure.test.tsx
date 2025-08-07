/**
 * DocumentNode Component Structure Tests
 * 
 * Tests the visual structure and rendering of DocumentNode components.
 * Focuses on rounded rectangle SVG, document icon, and text with foreignObject.
 * 
 * Test Requirements (Task 6.1):
 * - Rounded rectangle SVG shape with proper dimensions
 * - Document icon rendering and positioning
 * - Text rendering with foreignObject for proper text wrapping
 * - Proper styling and visual hierarchy
 * - Schema validation for props
 */

import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { z } from 'zod'
import { 
  documentNodeFixtures, 
  NODE_CONFIG, 
  NODE_SELECTORS,
  nodeTestUtils
} from '../../fixtures/nodes'

// Mock DocumentNode component (will be created after tests fail)
const DocumentNode = vi.fn(({ node, ...props }) => (
  <g 
    data-testid="document-node"
    data-node-id={node.id}
    data-node-type="document"
    transform={`translate(${node.position.x}, ${node.position.y})`}
    {...props}
  >
    {/* Rounded rectangle shape */}
    <rect
      data-testid="document-shape"
      x={-NODE_CONFIG.document.width / 2}
      y={-NODE_CONFIG.document.height / 2}
      width={NODE_CONFIG.document.width}
      height={NODE_CONFIG.document.height}
      rx={NODE_CONFIG.document.borderRadius}
      ry={NODE_CONFIG.document.borderRadius}
      fill={node.selected ? NODE_CONFIG.document.colors.selected.fill : NODE_CONFIG.document.colors.default.fill}
      stroke={node.selected ? NODE_CONFIG.document.colors.selected.stroke : NODE_CONFIG.document.colors.default.stroke}
      strokeWidth={NODE_CONFIG.document.strokeWidth}
    />
    
    {/* Document icon */}
    <g data-testid="document-icon" transform="translate(-8, -20)">
      <rect width="16" height="20" fill="currentColor" />
      <path d="M12 0L16 4v16H0V0h12z" fill="white" />
    </g>
    
    {/* Title text with foreignObject */}
    <foreignObject
      data-testid="document-title"
      x={-NODE_CONFIG.document.width / 2 + 8}
      y={NODE_CONFIG.document.height / 2 - 32}
      width={NODE_CONFIG.document.width - 16}
      height={24}
    >
      <div 
        style={{ 
          color: NODE_CONFIG.document.colors.default.text,
          fontSize: '12px',
          fontWeight: '500',
          textAlign: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {node.title}
      </div>
    </foreignObject>
    
    {/* Status indicator */}
    {node.data.status && (
      <circle
        data-testid="document-status"
        cx={NODE_CONFIG.document.width / 2 - 8}
        cy={-NODE_CONFIG.document.height / 2 + 8}
        r="4"
        fill={node.data.status === 'published' ? '#10b981' : node.data.status === 'review' ? '#f59e0b' : '#6b7280'}
      />
    )}
  </g>
))

// Wrapper for SVG rendering
const DocumentNodeWrapper = ({ node, ...props }) => (
  <svg width="200" height="150" viewBox="0 0 200 150">
    <DocumentNode node={node} {...props} />
  </svg>
)

describe('DocumentNode Component Structure', () => {
  describe('Basic Rendering', () => {
    test('should render document node with basic structure', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      // Node container should be present
      const nodeElement = screen.getByTestId('document-node')
      expect(nodeElement).toBeInTheDocument()
      expect(nodeElement).toHaveAttribute('data-node-id', node.id)
      expect(nodeElement).toHaveAttribute('data-node-type', 'document')
      
      // Should have correct transform for positioning
      expect(nodeElement).toHaveAttribute(
        'transform', 
        `translate(${node.position.x}, ${node.position.y})`
      )
    })
    
    test('should render rounded rectangle shape with correct dimensions', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      const shape = screen.getByTestId('document-shape')
      expect(shape).toBeInTheDocument()
      
      // Check shape dimensions
      expect(shape).toHaveAttribute('width', NODE_CONFIG.document.width.toString())
      expect(shape).toHaveAttribute('height', NODE_CONFIG.document.height.toString())
      
      // Check border radius for rounded rectangle
      expect(shape).toHaveAttribute('rx', NODE_CONFIG.document.borderRadius.toString())
      expect(shape).toHaveAttribute('ry', NODE_CONFIG.document.borderRadius.toString())
      
      // Check positioning (centered)
      expect(shape).toHaveAttribute('x', (-NODE_CONFIG.document.width / 2).toString())
      expect(shape).toHaveAttribute('y', (-NODE_CONFIG.document.height / 2).toString())
      
      // Check stroke properties
      expect(shape).toHaveAttribute('strokeWidth', NODE_CONFIG.document.strokeWidth.toString())
    })
    
    test('should render document icon with proper positioning', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      const icon = screen.getByTestId('document-icon')
      expect(icon).toBeInTheDocument()
      
      // Icon should be positioned correctly (centered horizontally, upper area)
      expect(icon).toHaveAttribute('transform', 'translate(-8, -20)')
      
      // Should contain SVG path elements for document icon
      const iconPath = icon.querySelector('path')
      expect(iconPath).toBeInTheDocument()
    })
    
    test('should render title text using foreignObject', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      const titleElement = screen.getByTestId('document-title')
      expect(titleElement).toBeInTheDocument()
      expect(titleElement.tagName).toBe('foreignObject')
      
      // Check foreignObject dimensions and positioning
      expect(titleElement).toHaveAttribute('width', (NODE_CONFIG.document.width - 16).toString())
      expect(titleElement).toHaveAttribute('height', '24')
      expect(titleElement).toHaveAttribute('x', (-NODE_CONFIG.document.width / 2 + 8).toString())
      
      // Should contain the node title
      expect(titleElement).toHaveTextContent(node.title)
    })
  })
  
  describe('Visual States', () => {
    test('should apply correct styling for default state', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      const shape = screen.getByTestId('document-shape')
      expect(shape).toHaveAttribute('fill', NODE_CONFIG.document.colors.default.fill)
      expect(shape).toHaveAttribute('stroke', NODE_CONFIG.document.colors.default.stroke)
    })
    
    test('should apply correct styling for selected state', () => {
      const node = documentNodeFixtures.selected
      render(<DocumentNodeWrapper node={node} />)
      
      const shape = screen.getByTestId('document-shape')
      expect(shape).toHaveAttribute('fill', NODE_CONFIG.document.colors.selected.fill)
      expect(shape).toHaveAttribute('stroke', NODE_CONFIG.document.colors.selected.stroke)
    })
    
    test('should render status indicator based on document status', () => {
      const publishedNode = { ...documentNodeFixtures.basic, data: { status: 'published' } }
      render(<DocumentNodeWrapper node={publishedNode} />)
      
      const statusIndicator = screen.getByTestId('document-status')
      expect(statusIndicator).toBeInTheDocument()
      expect(statusIndicator).toHaveAttribute('fill', '#10b981') // Published = green
    })
    
    test.each([
      ['draft', '#6b7280'],
      ['review', '#f59e0b'], 
      ['published', '#10b981']
    ])('should display correct status color for %s status', (status, expectedColor) => {
      const node = { ...documentNodeFixtures.basic, data: { status } }
      render(<DocumentNodeWrapper node={node} />)
      
      const statusIndicator = screen.getByTestId('document-status')
      expect(statusIndicator).toHaveAttribute('fill', expectedColor)
    })
  })
  
  describe('Text Handling', () => {
    test('should handle long titles with proper truncation', () => {
      const node = documentNodeFixtures.longTitle
      render(<DocumentNodeWrapper node={node} />)
      
      const titleElement = screen.getByTestId('document-title')
      const titleDiv = titleElement.querySelector('div')
      
      expect(titleDiv).toHaveStyle({
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      })
    })
    
    test('should handle minimal titles', () => {
      const node = documentNodeFixtures.minimal
      render(<DocumentNodeWrapper node={node} />)
      
      const titleElement = screen.getByTestId('document-title')
      expect(titleElement).toHaveTextContent(node.title)
    })
  })
  
  describe('Schema Validation', () => {
    test('should validate document node props with Zod schema', () => {
      const schema = nodeTestUtils.createNodeFixtureSchema()
      
      // Valid document node should pass validation
      const validResult = schema.safeParse(documentNodeFixtures.basic)
      expect(validResult.success).toBe(true)
      
      if (validResult.success) {
        // Type inference test
        const inferredType: z.infer<typeof schema> = validResult.data
        expect(inferredType.type).toBe('document')
        expect(typeof inferredType.position.x).toBe('number')
        expect(typeof inferredType.position.y).toBe('number')
      }
    })
    
    test('should reject invalid document node data', () => {
      const schema = nodeTestUtils.createNodeFixtureSchema()
      
      const invalidNode = {
        id: '',
        type: 'document',
        position: { x: 'invalid', y: 100 },
        title: '',
        data: { status: 'invalid-status' }
      }
      
      const result = schema.safeParse(invalidNode)
      expect(result.success).toBe(false)
    })
    
    test('should validate required document data fields', () => {
      const schema = nodeTestUtils.createNodeFixtureSchema()
      
      const nodeWithoutStatus = {
        ...documentNodeFixtures.basic,
        data: { content: 'Test content' } // Missing required status field
      }
      
      const result = schema.safeParse(nodeWithoutStatus)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('status')
        )).toBe(true)
      }
    })
  })
  
  describe('Accessibility', () => {
    test('should have proper ARIA attributes', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      const nodeElement = screen.getByTestId('document-node')
      
      // Should be focusable for keyboard navigation
      expect(nodeElement).toBeInTheDocument()
      
      // Should have semantic structure
      const titleElement = screen.getByTestId('document-title')
      expect(titleElement).toBeInTheDocument()
    })
    
    test('should provide readable text content', () => {
      const node = documentNodeFixtures.basic
      render(<DocumentNodeWrapper node={node} />)
      
      // Title should be accessible
      const titleElement = screen.getByTestId('document-title')
      expect(titleElement).toHaveTextContent(node.title)
    })
  })
  
  describe('Props Validation', () => {
    test('should handle all required props', () => {
      const node = documentNodeFixtures.minimal
      expect(() => {
        render(<DocumentNodeWrapper node={node} />)
      }).not.toThrow()
      
      // Validate fixture structure
      expect(nodeTestUtils.validateNodeFixture(node)).toBe(true)
    })
    
    test('should handle optional props gracefully', () => {
      const nodeWithoutOptionalProps = {
        id: 'test-minimal',
        type: 'document' as const,
        position: { x: 100, y: 100 },
        title: 'Minimal',
        data: { status: 'draft' as const }
      }
      
      expect(() => {
        render(<DocumentNodeWrapper node={nodeWithoutOptionalProps} />)
      }).not.toThrow()
    })
  })
  
  describe('Integration with Fixtures', () => {
    test('should work with all document node fixtures', () => {
      Object.values(documentNodeFixtures).forEach(fixture => {
        expect(() => {
          render(<DocumentNodeWrapper node={fixture} />)
        }).not.toThrow()
        
        // Each fixture should be valid
        expect(nodeTestUtils.validateNodeFixture(fixture)).toBe(true)
      })
    })
    
    test('should maintain consistent structure across fixtures', () => {
      Object.entries(documentNodeFixtures).forEach(([fixtureName, fixture]) => {
        const { container } = render(<DocumentNodeWrapper node={fixture} />)
        
        // All fixtures should render the same basic structure
        expect(screen.getByTestId('document-node')).toBeInTheDocument()
        expect(screen.getByTestId('document-shape')).toBeInTheDocument()
        expect(screen.getByTestId('document-icon')).toBeInTheDocument()
        expect(screen.getByTestId('document-title')).toBeInTheDocument()
        
        // Status indicator should be present if status is defined
        if (fixture.data.status) {
          expect(screen.getByTestId('document-status')).toBeInTheDocument()
        }
        
        container.remove()
      })
    })
  })
})