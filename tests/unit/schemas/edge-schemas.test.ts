/**
 * Edge Schema Validation Tests
 * 
 * Tests for all edge-related Zod schemas to ensure proper validation,
 * type safety, and error handling. Following TDD methodology.
 */

import { describe, test, expect } from 'vitest'
import {
  // Schema imports
  NodeAnchorSchema,
  EdgeVisualStateSchema,
  BezierEdgePropsSchema,
  StraightEdgePropsSchema,
  OrthogonalEdgePropsSchema,
  EdgePropsSchema,
  EdgeCreationStateSchema,
  EdgeRoutingConfigSchema,
  EdgeAnimationSchema,
  
  // Validation utilities
  EdgeValidation,
  EdgePropsFactory,
  
  // Types
  type BezierEdgeProps,
  type StraightEdgeProps,
  type OrthogonalEdgeProps,
} from '../../../schemas/api/edges'

import {
  // Canvas event schemas
  ConnectionPointSchema,
  EdgeTypeSchema,
  EdgeStyleSchema,
  EdgeLabelSchema,
  BezierControlPointsSchema,
  EdgePathSchema,
  
  // Event factory
  CanvasEventFactory,
} from '../../../schemas/events/canvas'

import { 
  nodeAnchors, 
  baseConnectionPoints, 
  edgeStyles,
  edgeLabels,
  bezierControlPoints,
  edgePaths,
  visualStates,
  creationStates,
  routingConfigs,
  animations,
  errorScenarios,
} from '../../fixtures/edges'

describe('Edge Schema Validation', () => {
  describe('NodeAnchorSchema', () => {
    test('should validate valid node anchor', () => {
      const result = NodeAnchorSchema.safeParse(nodeAnchors.bidirectional)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.id).toBe('bi-anchor')
        expect(result.data.position).toBe('center')
        expect(result.data.connectionType).toBe('bidirectional')
        expect(result.data.connectable).toBe(true)
        expect(result.data.visible).toBe(true)
      }
    })

    test('should validate anchor with offset', () => {
      const result = NodeAnchorSchema.safeParse(nodeAnchors.withOffset)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.offset).toEqual({ x: 10, y: -5 })
      }
    })

    test('should reject invalid position', () => {
      const invalidAnchor = {
        ...nodeAnchors.bidirectional,
        position: 'invalid-position',
      }
      
      const result = NodeAnchorSchema.safeParse(invalidAnchor)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('position')
      }
    })

    test('should reject invalid connection type', () => {
      const invalidAnchor = {
        ...nodeAnchors.bidirectional,
        connectionType: 'invalid-type',
      }
      
      const result = NodeAnchorSchema.safeParse(invalidAnchor)
      expect(result.success).toBe(false)
    })
  })

  describe('ConnectionPointSchema', () => {
    test('should validate valid connection point', () => {
      const result = ConnectionPointSchema.safeParse(baseConnectionPoints.documentNode)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.nodeId).toBe('doc-1')
        expect(result.data.anchorId).toBe('right')
        expect(result.data.position).toEqual({ x: 200, y: 150 })
      }
    })

    test('should reject empty node ID', () => {
      const invalid = {
        ...baseConnectionPoints.documentNode,
        nodeId: '',
      }
      
      const result = ConnectionPointSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    test('should reject invalid position', () => {
      const invalid = {
        ...baseConnectionPoints.documentNode,
        position: { x: 'not-number', y: 150 },
      }
      
      const result = ConnectionPointSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('EdgeTypeSchema', () => {
    test('should validate valid edge types', () => {
      const validTypes = ['bezier', 'straight', 'orthogonal']
      
      validTypes.forEach(type => {
        const result = EdgeTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid edge type', () => {
      const result = EdgeTypeSchema.safeParse('invalid-type')
      expect(result.success).toBe(false)
    })
  })

  describe('EdgeStyleSchema', () => {
    test('should validate default edge style', () => {
      const result = EdgeStyleSchema.safeParse(edgeStyles.default)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.stroke).toBe('#666666')
        expect(result.data.strokeWidth).toBe(2)
        expect(result.data.opacity).toBe(1)
      }
    })

    test('should validate style with markers', () => {
      const result = EdgeStyleSchema.safeParse(edgeStyles.withMarkers)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.markerStart).toBe('url(#arrow-start)')
        expect(result.data.markerEnd).toBe('url(#arrow-end)')
      }
    })

    test('should reject invalid color format', () => {
      const invalid = {
        ...edgeStyles.default,
        stroke: 'not-a-color',
      }
      
      const result = EdgeStyleSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    test('should reject negative stroke width', () => {
      const invalid = {
        ...edgeStyles.default,
        strokeWidth: -1,
      }
      
      const result = EdgeStyleSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('EdgeLabelSchema', () => {
    test('should validate simple edge label', () => {
      const result = EdgeLabelSchema.safeParse(edgeLabels.simple)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.text).toBe('Edge Label')
        expect(result.data.position).toBe(0.5)
        expect(result.data.fontSize).toBe(12)
      }
    })

    test('should validate label at different positions', () => {
      const positions = [0, 0.25, 0.5, 0.75, 1]
      
      positions.forEach(position => {
        const label = { ...edgeLabels.simple, position }
        const result = EdgeLabelSchema.safeParse(label)
        expect(result.success).toBe(true)
      })
    })

    test('should reject empty label text', () => {
      const invalid = {
        ...edgeLabels.simple,
        text: '',
      }
      
      const result = EdgeLabelSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    test('should reject position outside range', () => {
      const invalid = {
        ...edgeLabels.simple,
        position: 1.5, // Outside 0-1 range
      }
      
      const result = EdgeLabelSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('BezierControlPointsSchema', () => {
    test('should validate bezier control points', () => {
      const result = BezierControlPointsSchema.safeParse(bezierControlPoints.gentle)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.cp1).toEqual({ x: 250, y: 150 })
        expect(result.data.cp2).toEqual({ x: 350, y: 150 })
      }
    })

    test('should validate dramatic control points', () => {
      const result = BezierControlPointsSchema.safeParse(bezierControlPoints.dramatic)
      expect(result.success).toBe(true)
    })

    test('should reject invalid control point coordinates', () => {
      const invalid = {
        cp1: { x: 'not-number', y: 150 },
        cp2: { x: 350, y: 150 },
      }
      
      const result = BezierControlPointsSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('EdgePathSchema', () => {
    test('should validate bezier edge path', () => {
      const result = EdgePathSchema.safeParse(edgePaths.bezier)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.type).toBe('bezier')
        expect(result.data.controlPoints).toBeTruthy()
      }
    })

    test('should validate straight edge path', () => {
      const result = EdgePathSchema.safeParse(edgePaths.straight)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.type).toBe('straight')
        expect(result.data.controlPoints).toBeUndefined()
      }
    })

    test('should validate orthogonal edge path', () => {
      const result = EdgePathSchema.safeParse(edgePaths.orthogonal)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.type).toBe('orthogonal')
        expect(result.data.waypoints).toBeTruthy()
        expect(Array.isArray(result.data.waypoints)).toBe(true)
      }
    })
  })

  describe('EdgeVisualStateSchema', () => {
    test('should validate all visual states', () => {
      Object.entries(visualStates).forEach(([name, state]) => {
        const result = EdgeVisualStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })
    })

    test('should default to false for all flags', () => {
      const result = EdgeVisualStateSchema.safeParse({})
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.selected).toBe(false)
        expect(result.data.hovered).toBe(false)
        expect(result.data.dragging).toBe(false)
        expect(result.data.connecting).toBe(false)
        expect(result.data.animated).toBe(false)
      }
    })
  })

  describe('BezierEdgePropsSchema', () => {
    test('should validate complete bezier edge props', () => {
      const props = {
        id: 'test-bezier',
        type: 'bezier' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.bezier,
        style: edgeStyles.default,
        label: edgeLabels.simple,
        controlPoints: bezierControlPoints.gentle,
        curvature: 0.5,
        showControlPoints: false,
      }
      
      const result = BezierEdgePropsSchema.safeParse(props)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.type).toBe('bezier')
        expect(result.data.curvature).toBe(0.5)
      }
    })

    test('should reject invalid curvature', () => {
      const invalid = {
        id: 'test',
        type: 'bezier' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.bezier,
        curvature: -1, // Invalid
        showControlPoints: false,
      }
      
      const result = BezierEdgePropsSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('StraightEdgePropsSchema', () => {
    test('should validate straight edge props', () => {
      const props = {
        id: 'test-straight',
        type: 'straight' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.straight,
        showMidpointHandle: false,
      }
      
      const result = StraightEdgePropsSchema.safeParse(props)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.type).toBe('straight')
        expect(result.data.showMidpointHandle).toBe(false)
      }
    })
  })

  describe('OrthogonalEdgePropsSchema', () => {
    test('should validate orthogonal edge props', () => {
      const props = {
        id: 'test-orthogonal',
        type: 'orthogonal' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.orthogonal,
        cornerRadius: 5,
        waypoints: edgePaths.orthogonal.waypoints,
        showWaypoints: false,
      }
      
      const result = OrthogonalEdgePropsSchema.safeParse(props)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.type).toBe('orthogonal')
        expect(result.data.cornerRadius).toBe(5)
      }
    })

    test('should reject negative corner radius', () => {
      const invalid = {
        id: 'test',
        type: 'orthogonal' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.orthogonal,
        cornerRadius: -1, // Invalid
        showWaypoints: false,
      }
      
      const result = OrthogonalEdgePropsSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('EdgePropsSchema Union', () => {
    test('should validate any valid edge type', () => {
      const edgeTypes = [
        {
          id: 'bezier-test',
          type: 'bezier' as const,
          source: baseConnectionPoints.documentNode,
          target: baseConnectionPoints.agentNode,
          path: edgePaths.bezier,
          curvature: 0.5,
          showControlPoints: false,
        },
        {
          id: 'straight-test',
          type: 'straight' as const,
          source: baseConnectionPoints.documentNode,
          target: baseConnectionPoints.agentNode,
          path: edgePaths.straight,
          showMidpointHandle: false,
        },
        {
          id: 'orthogonal-test',
          type: 'orthogonal' as const,
          source: baseConnectionPoints.documentNode,
          target: baseConnectionPoints.agentNode,
          path: edgePaths.orthogonal,
          cornerRadius: 5,
          showWaypoints: false,
        },
      ]
      
      edgeTypes.forEach(props => {
        const result = EdgePropsSchema.safeParse(props)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('EdgeCreationStateSchema', () => {
    test('should validate all creation states', () => {
      Object.entries(creationStates).forEach(([name, state]) => {
        const result = EdgeCreationStateSchema.safeParse(state)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('EdgeRoutingConfigSchema', () => {
    test('should validate all routing configs', () => {
      Object.entries(routingConfigs).forEach(([name, config]) => {
        const result = EdgeRoutingConfigSchema.safeParse(config)
        expect(result.success).toBe(true)
      })
    })

    test('should use defaults for optional fields', () => {
      const minimal = { algorithm: 'bezier' as const }
      const result = EdgeRoutingConfigSchema.safeParse(minimal)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.avoidNodes).toBe(true)
        expect(result.data.cornerRadius).toBe(5)
        expect(result.data.padding).toBe(20)
        expect(result.data.smoothing).toBe(0.5)
      }
    })
  })

  describe('EdgeAnimationSchema', () => {
    test('should validate all animation configs', () => {
      Object.entries(animations).forEach(([name, animation]) => {
        const result = EdgeAnimationSchema.safeParse(animation)
        expect(result.success).toBe(true)
      })
    })

    test('should reject invalid animation type', () => {
      const invalid = {
        ...animations.flow,
        type: 'invalid-type',
      }
      
      const result = EdgeAnimationSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('EdgeValidation Utilities', () => {
    test('should validate edge props with detailed errors', () => {
      const validProps = {
        id: 'test-edge',
        type: 'bezier' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.bezier,
        curvature: 0.5,
        showControlPoints: false,
      }
      
      const result = EdgeValidation.validateEdgeProps(validProps)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should return errors for invalid props', () => {
      const invalid = {
        id: '', // Invalid
        type: 'invalid-type', // Invalid
        source: null, // Invalid
      }
      
      const result = EdgeValidation.validateEdgeProps(invalid)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('should validate connection compatibility', () => {
      // Valid connections
      expect(
        EdgeValidation.validateConnection(nodeAnchors.outputOnly, nodeAnchors.inputOnly)
      ).toEqual({ valid: true })
      
      // Invalid connections
      expect(
        EdgeValidation.validateConnection(nodeAnchors.inputOnly, nodeAnchors.inputOnly)
      ).toEqual({
        valid: false,
        reason: 'Cannot connect two input anchors'
      })
    })

    test('should check type guards correctly', () => {
      const bezierProps = {
        id: 'test',
        type: 'bezier' as const,
        source: baseConnectionPoints.documentNode,
        target: baseConnectionPoints.agentNode,
        path: edgePaths.bezier,
        curvature: 0.5,
        showControlPoints: false,
      }
      
      expect(EdgeValidation.isBezierEdgeProps(bezierProps)).toBe(true)
      expect(EdgeValidation.isStraightEdgeProps(bezierProps)).toBe(false)
      expect(EdgeValidation.isOrthogonalEdgeProps(bezierProps)).toBe(false)
    })
  })

  describe('EdgePropsFactory', () => {
    test('should create bezier edge props with defaults', () => {
      const props = EdgePropsFactory.createBezierEdgeProps(
        baseConnectionPoints.documentNode,
        baseConnectionPoints.agentNode
      )
      
      expect(props.type).toBe('bezier')
      expect(props.id).toMatch(/^edge-\d+$/)
      expect(props.source).toEqual(baseConnectionPoints.documentNode)
      expect(props.target).toEqual(baseConnectionPoints.agentNode)
    })

    test('should create straight edge props with defaults', () => {
      const props = EdgePropsFactory.createStraightEdgeProps(
        baseConnectionPoints.documentNode,
        baseConnectionPoints.agentNode
      )
      
      expect(props.type).toBe('straight')
      expect(props.path.type).toBe('straight')
    })

    test('should create orthogonal edge props with defaults', () => {
      const props = EdgePropsFactory.createOrthogonalEdgeProps(
        baseConnectionPoints.documentNode,
        baseConnectionPoints.agentNode
      )
      
      expect(props.type).toBe('orthogonal')
      expect(props.path.type).toBe('orthogonal')
    })

    test('should apply overrides correctly', () => {
      const props = EdgePropsFactory.createBezierEdgeProps(
        baseConnectionPoints.documentNode,
        baseConnectionPoints.agentNode,
        {
          id: 'custom-id',
          style: edgeStyles.colored,
          curvature: 0.8,
        }
      )
      
      expect(props.id).toBe('custom-id')
      expect(props.style).toEqual(edgeStyles.colored)
      expect(props.curvature).toBe(0.8)
    })
  })

  describe('Canvas Event Integration', () => {
    test('should create CREATE_EDGE event', () => {
      const event = CanvasEventFactory.createCreateEdgeEvent(
        'test-edge',
        baseConnectionPoints.documentNode,
        baseConnectionPoints.agentNode,
        {
          edgeType: 'bezier',
          style: edgeStyles.default,
        }
      )
      
      expect(event.type).toBe('CREATE_EDGE')
      expect(event.payload.edgeId).toBe('test-edge')
      expect(event.payload.sourceConnection).toEqual(baseConnectionPoints.documentNode)
      expect(event.payload.targetConnection).toEqual(baseConnectionPoints.agentNode)
      expect(event.payload.edgeType).toBe('bezier')
    })

    test('should create DELETE_EDGE event', () => {
      const event = CanvasEventFactory.createDeleteEdgeEvent('test-edge', {
        sourceConnection: baseConnectionPoints.documentNode,
        targetConnection: baseConnectionPoints.agentNode,
        edgeType: 'bezier',
      })
      
      expect(event.type).toBe('DELETE_EDGE')
      expect(event.payload.edgeId).toBe('test-edge')
      expect(event.payload.sourceConnection).toEqual(baseConnectionPoints.documentNode)
    })

    test('should create UPDATE_EDGE_PATH event', () => {
      const event = CanvasEventFactory.createUpdateEdgePathEvent(
        'test-edge',
        edgePaths.bezier,
        { ...edgePaths.bezier, start: { x: 150, y: 150 } },
        'node_moved'
      )
      
      expect(event.type).toBe('UPDATE_EDGE_PATH')
      expect(event.payload.edgeId).toBe('test-edge')
      expect(event.payload.reason).toBe('node_moved')
    })
  })
})