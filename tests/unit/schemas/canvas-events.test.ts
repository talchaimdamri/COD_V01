import { describe, it, expect } from 'vitest'
import {
  // Schema imports
  AddNodeEventSchema,
  MoveNodeEventSchema,
  DeleteNodeEventSchema,
  SelectElementEventSchema,
  PanCanvasEventSchema,
  ZoomCanvasEventSchema,
  ResetViewEventSchema,
  CanvasEventSchema,
  CanvasEventTypeSchema,
  
  // Type imports
  CanvasEvent,
  Position,
  ViewBox,
  
  // Utility imports
  CanvasEventUtils,
  CanvasEventFactory,
  CANVAS_LIMITS,
} from '../../../schemas/events/canvas'

describe('Canvas Event Schemas', () => {
  describe('Position Schema', () => {
    it('should validate valid positions', () => {
      const validPositions: Position[] = [
        { x: 0, y: 0 },
        { x: 100.5, y: 200.7 },
        { x: -50, y: -100 },
        { x: 5000, y: 5000 }, // Within MAX_DISTANCE of 10000
      ]

      validPositions.forEach(pos => {
        expect(() => CanvasEventUtils.isValidPosition(pos)).not.toThrow()
        expect(CanvasEventUtils.isValidPosition(pos)).toBe(true)
      })
    })

    it('should reject invalid positions', () => {
      const invalidPositions = [
        { x: NaN, y: 0 },
        { x: 0, y: Infinity },
        { x: -Infinity, y: 0 },
        { x: CANVAS_LIMITS.PAN.MAX_DISTANCE + 1, y: 0 },
      ]

      invalidPositions.forEach(pos => {
        expect(CanvasEventUtils.isValidPosition(pos as Position)).toBe(false)
      })
    })
  })

  describe('ADD_NODE Event', () => {
    it('should validate a proper ADD_NODE event', () => {
      const event = {
        type: 'ADD_NODE',
        payload: {
          nodeId: 'test-node-1',
          nodeType: 'document',
          position: { x: 100, y: 200 },
          title: 'Test Document',
          data: { content: 'test content' },
        },
        timestamp: new Date('2024-01-01T12:00:00.000Z'),
        userId: 'user-123',
      }

      const result = AddNodeEventSchema.safeParse(event)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.type).toBe('ADD_NODE')
        expect(result.data.payload.nodeId).toBe('test-node-1')
        expect(result.data.payload.nodeType).toBe('document')
      }
    })

    it('should reject ADD_NODE with invalid node type', () => {
      const event = {
        type: 'ADD_NODE',
        payload: {
          nodeId: 'test-node-1',
          nodeType: 'invalid-type',
          position: { x: 100, y: 200 },
        },
        timestamp: new Date(),
      }

      const result = AddNodeEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })

    it('should reject ADD_NODE with empty node ID', () => {
      const event = {
        type: 'ADD_NODE',
        payload: {
          nodeId: '',
          nodeType: 'document',
          position: { x: 100, y: 200 },
        },
        timestamp: new Date(),
      }

      const result = AddNodeEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })

    it('should create valid ADD_NODE event with factory', () => {
      const event = CanvasEventFactory.createAddNodeEvent(
        'test-node',
        'agent',
        { x: 300, y: 400 },
        { title: 'Test Agent', userId: 'user-456' }
      )

      expect(event.type).toBe('ADD_NODE')
      expect(event.payload.nodeId).toBe('test-node')
      expect(event.payload.nodeType).toBe('agent')
      expect(event.payload.position).toEqual({ x: 300, y: 400 })
      expect(event.payload.title).toBe('Test Agent')
      expect(event.userId).toBe('user-456')
    })
  })

  describe('MOVE_NODE Event', () => {
    it('should validate a proper MOVE_NODE event', () => {
      const event = {
        type: 'MOVE_NODE',
        payload: {
          nodeId: 'node-123',
          fromPosition: { x: 100, y: 100 },
          toPosition: { x: 200, y: 200 },
          isDragging: true,
        },
        timestamp: new Date(),
      }

      const result = MoveNodeEventSchema.safeParse(event)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.payload.fromPosition).toEqual({ x: 100, y: 100 })
        expect(result.data.payload.toPosition).toEqual({ x: 200, y: 200 })
      }
    })

    it('should create valid MOVE_NODE event with factory', () => {
      const fromPos = { x: 50, y: 60 }
      const toPos = { x: 150, y: 160 }
      
      const event = CanvasEventFactory.createMoveNodeEvent(
        'move-node',
        fromPos,
        toPos,
        { isDragging: false, userId: 'user-789' }
      )

      expect(event.type).toBe('MOVE_NODE')
      expect(event.payload.fromPosition).toEqual(fromPos)
      expect(event.payload.toPosition).toEqual(toPos)
      expect(event.payload.isDragging).toBe(false)
      expect(event.userId).toBe('user-789')
    })
  })

  describe('DELETE_NODE Event', () => {
    it('should validate a proper DELETE_NODE event', () => {
      const event = {
        type: 'DELETE_NODE',
        payload: {
          nodeId: 'node-to-delete',
          nodeType: 'document',
          position: { x: 150, y: 250 },
          data: { title: 'Deleted Document' },
        },
        timestamp: new Date(),
      }

      const result = DeleteNodeEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })

    it('should validate minimal DELETE_NODE event', () => {
      const event = {
        type: 'DELETE_NODE',
        payload: {
          nodeId: 'minimal-delete',
        },
        timestamp: new Date(),
      }

      const result = DeleteNodeEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })
  })

  describe('SELECT_ELEMENT Event', () => {
    it('should validate element selection', () => {
      const event = {
        type: 'SELECT_ELEMENT',
        payload: {
          elementId: 'selected-node',
          elementType: 'node',
          previousSelection: 'previous-node',
          multiSelect: false,
        },
        timestamp: new Date(),
      }

      const result = SelectElementEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })

    it('should validate element deselection', () => {
      const event = {
        type: 'SELECT_ELEMENT',
        payload: {
          elementId: null,
          previousSelection: 'was-selected',
        },
        timestamp: new Date(),
      }

      const result = SelectElementEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })
  })

  describe('PAN_CANVAS Event', () => {
    it('should validate canvas panning', () => {
      const fromViewBox: ViewBox = { x: 0, y: 0, width: 800, height: 600 }
      const toViewBox: ViewBox = { x: 50, y: 30, width: 800, height: 600 }

      const event = {
        type: 'PAN_CANVAS',
        payload: {
          fromViewBox,
          toViewBox,
          deltaX: 50,
          deltaY: 30,
          isPanning: true,
        },
        timestamp: new Date(),
      }

      const result = PanCanvasEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })

    it('should reject invalid ViewBox dimensions', () => {
      const event = {
        type: 'PAN_CANVAS',
        payload: {
          fromViewBox: { x: 0, y: 0, width: -100, height: 600 }, // Invalid negative width
          toViewBox: { x: 0, y: 0, width: 800, height: 600 },
          deltaX: 0,
          deltaY: 0,
        },
        timestamp: new Date(),
      }

      const result = PanCanvasEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })
  })

  describe('ZOOM_CANVAS Event', () => {
    it('should validate canvas zooming', () => {
      const viewBox: ViewBox = { x: 0, y: 0, width: 800, height: 600 }

      const event = {
        type: 'ZOOM_CANVAS',
        payload: {
          fromZoom: 1.0,
          toZoom: 1.5,
          fromViewBox: viewBox,
          toViewBox: { ...viewBox, width: 533, height: 400 }, // Scaled down
          zoomCenter: { x: 400, y: 300 },
          zoomDelta: 0.5,
        },
        timestamp: new Date(),
      }

      const result = ZoomCanvasEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })

    it('should reject invalid zoom levels', () => {
      const viewBox: ViewBox = { x: 0, y: 0, width: 800, height: 600 }

      const event = {
        type: 'ZOOM_CANVAS',
        payload: {
          fromZoom: 1.0,
          toZoom: 10.0, // Exceeds max zoom of 5.0
          fromViewBox: viewBox,
          toViewBox: viewBox,
        },
        timestamp: new Date(),
      }

      const result = ZoomCanvasEventSchema.safeParse(event)
      expect(result.success).toBe(false)
    })

    it('should create valid ZOOM_CANVAS event with factory', () => {
      const fromViewBox: ViewBox = { x: 0, y: 0, width: 1200, height: 800 }
      const toViewBox: ViewBox = { x: 0, y: 0, width: 600, height: 400 }

      const event = CanvasEventFactory.createZoomCanvasEvent(
        1.0,
        2.0,
        fromViewBox,
        toViewBox,
        { zoomCenter: { x: 600, y: 400 }, userId: 'zoom-user' }
      )

      expect(event.type).toBe('ZOOM_CANVAS')
      expect(event.payload.fromZoom).toBe(1.0)
      expect(event.payload.toZoom).toBe(2.0)
      expect(event.payload.zoomCenter).toEqual({ x: 600, y: 400 })
      expect(event.userId).toBe('zoom-user')
    })
  })

  describe('RESET_VIEW Event', () => {
    it('should validate view reset', () => {
      const event = {
        type: 'RESET_VIEW',
        payload: {
          fromViewBox: { x: 100, y: 100, width: 400, height: 300 },
          fromZoom: 2.0,
          toViewBox: { x: 0, y: 0, width: 1200, height: 800 },
          toZoom: 1.0,
          resetType: 'keyboard',
        },
        timestamp: new Date(),
      }

      const result = ResetViewEventSchema.safeParse(event)
      expect(result.success).toBe(true)
    })

    it('should default resetType to keyboard', () => {
      const event = {
        type: 'RESET_VIEW',
        payload: {
          fromViewBox: { x: 0, y: 0, width: 800, height: 600 },
          fromZoom: 1.5,
          toViewBox: { x: 0, y: 0, width: 1200, height: 800 },
          toZoom: 1.0,
        },
        timestamp: new Date(),
      }

      const result = ResetViewEventSchema.safeParse(event)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.payload.resetType).toBe('keyboard')
      }
    })
  })

  describe('Canvas Event Union', () => {
    it('should accept all valid canvas event types', () => {
      const events = [
        {
          type: 'ADD_NODE',
          payload: { nodeId: 'n1', nodeType: 'document', position: { x: 0, y: 0 } },
          timestamp: new Date(),
        },
        {
          type: 'MOVE_NODE',
          payload: {
            nodeId: 'n1',
            fromPosition: { x: 0, y: 0 },
            toPosition: { x: 10, y: 10 },
          },
          timestamp: new Date(),
        },
        {
          type: 'DELETE_NODE',
          payload: { nodeId: 'n1' },
          timestamp: new Date(),
        },
        {
          type: 'SELECT_ELEMENT',
          payload: { elementId: 'n1' },
          timestamp: new Date(),
        },
        {
          type: 'PAN_CANVAS',
          payload: {
            fromViewBox: { x: 0, y: 0, width: 800, height: 600 },
            toViewBox: { x: 10, y: 10, width: 800, height: 600 },
            deltaX: 10,
            deltaY: 10,
          },
          timestamp: new Date(),
        },
        {
          type: 'ZOOM_CANVAS',
          payload: {
            fromZoom: 1.0,
            toZoom: 1.5,
            fromViewBox: { x: 0, y: 0, width: 800, height: 600 },
            toViewBox: { x: 0, y: 0, width: 533, height: 400 },
          },
          timestamp: new Date(),
        },
        {
          type: 'RESET_VIEW',
          payload: {
            fromViewBox: { x: 10, y: 10, width: 533, height: 400 },
            fromZoom: 1.5,
            toViewBox: { x: 0, y: 0, width: 800, height: 600 },
            toZoom: 1.0,
          },
          timestamp: new Date(),
        },
      ] as const

      events.forEach(event => {
        const result = CanvasEventSchema.safeParse(event)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid event types', () => {
      const invalidEvent = {
        type: 'INVALID_CANVAS_EVENT',
        payload: {},
        timestamp: new Date(),
      }

      const result = CanvasEventSchema.safeParse(invalidEvent)
      expect(result.success).toBe(false)
    })
  })

  describe('Canvas Event Type Schema', () => {
    it('should validate all canvas event types', () => {
      const validTypes = [
        'ADD_NODE',
        'MOVE_NODE', 
        'DELETE_NODE',
        'SELECT_ELEMENT',
        'PAN_CANVAS',
        'ZOOM_CANVAS',
        'RESET_VIEW',
      ]

      validTypes.forEach(type => {
        const result = CanvasEventTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid event types', () => {
      const invalidTypes = [
        'INVALID_TYPE',
        'add_node', // lowercase
        'ADD_DOCUMENT', // not a canvas event
        '',
        null,
        undefined,
      ]

      invalidTypes.forEach(type => {
        const result = CanvasEventTypeSchema.safeParse(type)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Canvas Event Utils', () => {
    describe('clampZoom', () => {
      it('should clamp zoom to valid range', () => {
        expect(CanvasEventUtils.clampZoom(0.05)).toBe(0.1) // Below min
        expect(CanvasEventUtils.clampZoom(10.0)).toBe(5.0) // Above max
        expect(CanvasEventUtils.clampZoom(1.5)).toBe(1.5) // Valid range
      })
    })

    describe('createViewBox', () => {
      it('should create valid ViewBox with constraints', () => {
        const viewBox = CanvasEventUtils.createViewBox(10, 20, 800, 600)
        expect(viewBox).toEqual({ x: 10, y: 20, width: 800, height: 600 })
      })

      it('should handle invalid inputs', () => {
        const viewBox = CanvasEventUtils.createViewBox(NaN, Infinity, 50, 30)
        expect(viewBox.x).toBe(0) // NaN → 0
        expect(viewBox.y).toBe(0) // Infinity → 0
        expect(viewBox.width).toBe(CANVAS_LIMITS.VIEWPORT.MIN_WIDTH) // Too small
        expect(viewBox.height).toBe(CANVAS_LIMITS.VIEWPORT.MIN_HEIGHT) // Too small
      })
    })

    describe('distance', () => {
      it('should calculate distance between positions', () => {
        const pos1: Position = { x: 0, y: 0 }
        const pos2: Position = { x: 3, y: 4 }
        expect(CanvasEventUtils.distance(pos1, pos2)).toBe(5) // 3-4-5 triangle
      })
    })

    describe('isCanvasEvent', () => {
      it('should identify canvas events', () => {
        const canvasEvent = { type: 'ADD_NODE', payload: {}, timestamp: new Date() }
        const nonCanvasEvent = { type: 'OTHER_EVENT', payload: {}, timestamp: new Date() }

        expect(CanvasEventUtils.isCanvasEvent(canvasEvent)).toBe(true)
        expect(CanvasEventUtils.isCanvasEvent(nonCanvasEvent)).toBe(false)
        expect(CanvasEventUtils.isCanvasEvent(null)).toBe(false)
        expect(CanvasEventUtils.isCanvasEvent({})).toBe(false)
      })
    })
  })

  describe('Canvas Event Factory', () => {
    it('should create events with proper timestamps', () => {
      const beforeTime = Date.now()
      const event = CanvasEventFactory.createAddNodeEvent(
        'time-test',
        'document',
        { x: 0, y: 0 }
      )
      const afterTime = Date.now()

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime)
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterTime)
    })

    it('should use custom timestamps when provided', () => {
      const customTime = new Date('2024-06-15T10:30:00.000Z')
      const event = CanvasEventFactory.createAddNodeEvent(
        'custom-time',
        'agent',
        { x: 100, y: 200 },
        { timestamp: customTime }
      )

      expect(event.timestamp).toEqual(customTime)
    })
  })

  describe('Canvas Limits Constants', () => {
    it('should have expected limit values', () => {
      expect(CANVAS_LIMITS.ZOOM.MIN).toBe(0.1)
      expect(CANVAS_LIMITS.ZOOM.MAX).toBe(5.0)
      expect(CANVAS_LIMITS.ZOOM.DEFAULT).toBe(1.0)
      
      expect(CANVAS_LIMITS.PAN.MAX_DISTANCE).toBe(10000)
      expect(CANVAS_LIMITS.PAN.STEP).toBe(50)
      
      expect(CANVAS_LIMITS.VIEWPORT.MIN_WIDTH).toBe(100)
      expect(CANVAS_LIMITS.VIEWPORT.MIN_HEIGHT).toBe(100)
      expect(CANVAS_LIMITS.VIEWPORT.DEFAULT_WIDTH).toBe(1200)
      expect(CANVAS_LIMITS.VIEWPORT.DEFAULT_HEIGHT).toBe(800)
    })
  })
})