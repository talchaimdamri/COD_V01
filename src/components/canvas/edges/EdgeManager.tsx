/**
 * EdgeManager Component
 * 
 * Manages drag-and-drop edge creation, validation, and preview.
 * Handles the complete workflow from anchor click to edge creation.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { BezierEdge, StraightEdge, OrthogonalEdge } from './index'
import type { 
  EdgeCreationState,
  EdgeType,
  EdgeProps,
  BezierEdgeProps,
  StraightEdgeProps,
  OrthogonalEdgeProps,
  NodeAnchor,
} from '../../../../schemas/api/edges'
import type { 
  Position, 
  ConnectionPoint, 
  EdgeStyle 
} from '../../../../schemas/events/canvas'
import { 
  calculateBezierPath, 
  calculateStraightPath, 
  calculateOrthogonalPath,
  generateBezierControlPoints
} from '../../../lib/svgPaths'
import { EdgeValidation } from '../../../../schemas/api/edges'

export interface EdgeManagerProps {
  /** Current edge creation state */
  creationState: EdgeCreationState
  /** Available nodes with their anchors */
  nodes: Array<{
    id: string
    type: 'document' | 'agent'
    position: Position
    anchors: NodeAnchor[]
  }>
  /** Callback when edge creation starts */
  onCreationStart: (sourceConnection: ConnectionPoint) => void
  /** Callback when mouse moves during creation */
  onCreationMove: (currentPosition: Position, validTarget?: ConnectionPoint) => void
  /** Callback when edge creation completes */
  onCreationComplete: (sourceConnection: ConnectionPoint, targetConnection: ConnectionPoint, edgeType: EdgeType) => void
  /** Callback when edge creation is cancelled */
  onCreationCancel: () => void
  /** Default edge type for new edges */
  defaultEdgeType?: EdgeType
  /** Default edge style */
  defaultStyle?: EdgeStyle
  /** Connection validation settings */
  connectionValidation?: {
    snapDistance?: number
    highlightRadius?: number
    allowSelfConnection?: boolean
    allowMultipleEdges?: boolean
  }
}

export const EdgeManager: React.FC<EdgeManagerProps> = ({
  creationState,
  nodes,
  onCreationStart,
  onCreationMove,
  onCreationComplete,
  onCreationCancel,
  defaultEdgeType = 'bezier',
  defaultStyle = {
    stroke: '#666666',
    strokeWidth: 2,
    opacity: 0.8,
    strokeDasharray: '5,5', // Dashed preview
  },
  connectionValidation = {
    snapDistance: 20,
    highlightRadius: 15,
    allowSelfConnection: false,
    allowMultipleEdges: true,
  },
}) => {
  const [hoveredAnchor, setHoveredAnchor] = useState<{
    nodeId: string
    anchorId: string
    position: Position
  } | null>(null)

  // Handle anchor click to start edge creation
  const handleAnchorClick = useCallback((
    nodeId: string, 
    anchorId: string, 
    anchorPosition: Position,
    connectionType: 'input' | 'output' | 'bidirectional' = 'bidirectional'
  ) => {
    if (creationState.isCreating) {
      // If already creating, try to complete the connection
      if (creationState.sourceConnection && hoveredAnchor) {
        const targetConnection: ConnectionPoint = {
          nodeId: hoveredAnchor.nodeId,
          anchorId: hoveredAnchor.anchorId,
          position: hoveredAnchor.position,
        }
        
        // Validate connection
        const sourceNode = nodes.find(n => n.id === creationState.sourceConnection!.nodeId)
        const targetNode = nodes.find(n => n.id === targetConnection.nodeId)
        
        if (sourceNode && targetNode) {
          const sourceAnchor = sourceNode.anchors.find(a => a.id === creationState.sourceConnection!.anchorId)
          const targetAnchor = targetNode.anchors.find(a => a.id === targetConnection.anchorId)
          
          if (sourceAnchor && targetAnchor) {
            const validation = EdgeValidation.validateConnection(sourceAnchor, targetAnchor)
            
            if (validation.valid) {
              // Check self-connection
              if (!connectionValidation.allowSelfConnection && sourceNode.id === targetNode.id) {
                console.warn('Self-connections not allowed')
                onCreationCancel()
                return
              }
              
              onCreationComplete(creationState.sourceConnection, targetConnection, defaultEdgeType)
              return
            } else {
              console.warn('Invalid connection:', validation.reason)
              onCreationCancel()
              return
            }
          }
        }
        
        onCreationCancel()
      }
    } else {
      // Start new edge creation
      const sourceConnection: ConnectionPoint = {
        nodeId,
        anchorId,
        position: anchorPosition,
      }
      
      onCreationStart(sourceConnection)
    }
  }, [
    creationState, 
    hoveredAnchor, 
    nodes, 
    onCreationStart, 
    onCreationComplete, 
    onCreationCancel, 
    defaultEdgeType,
    connectionValidation.allowSelfConnection
  ])

  // Handle mouse move during edge creation
  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!creationState.isCreating || !creationState.sourceConnection) return

    const rect = event.currentTarget.getBoundingClientRect()
    const svgElement = event.currentTarget as SVGSVGElement
    const svgRect = svgElement.getBoundingClientRect()
    const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number) || [0, 0, svgRect.width, svgRect.height]
    
    // Convert screen coordinates to SVG coordinates
    const scaleX = viewBox[2] / svgRect.width
    const scaleY = viewBox[3] / svgRect.height
    const currentPosition: Position = {
      x: viewBox[0] + (event.clientX - svgRect.left) * scaleX,
      y: viewBox[1] + (event.clientY - svgRect.top) * scaleY,
    }

    // Find nearest valid anchor for snapping
    let nearestAnchor: {
      nodeId: string
      anchorId: string
      position: Position
      distance: number
    } | null = null

    nodes.forEach(node => {
      node.anchors.forEach(anchor => {
        if (!anchor.visible || !anchor.connectable) return
        
        // Skip source anchor
        if (node.id === creationState.sourceConnection!.nodeId && 
            anchor.id === creationState.sourceConnection!.anchorId) return
        
        const anchorPosition = {
          x: node.position.x + (anchor.offset?.x || 0),
          y: node.position.y + (anchor.offset?.y || 0)
        }
        
        const distance = Math.sqrt(
          Math.pow(currentPosition.x - anchorPosition.x, 2) +
          Math.pow(currentPosition.y - anchorPosition.y, 2)
        )
        
        if (distance <= (connectionValidation.snapDistance || 20)) {
          if (!nearestAnchor || distance < nearestAnchor.distance) {
            nearestAnchor = {
              nodeId: node.id,
              anchorId: anchor.id,
              position: anchorPosition,
              distance,
            }
          }
        }
      })
    })

    // Update hovered anchor and creation state
    if (nearestAnchor) {
      setHoveredAnchor({
        nodeId: nearestAnchor.nodeId,
        anchorId: nearestAnchor.anchorId,
        position: nearestAnchor.position,
      })
      
      const validTarget: ConnectionPoint = {
        nodeId: nearestAnchor.nodeId,
        anchorId: nearestAnchor.anchorId,
        position: nearestAnchor.position,
      }
      
      onCreationMove(currentPosition, validTarget)
    } else {
      setHoveredAnchor(null)
      onCreationMove(currentPosition)
    }
  }, [
    creationState, 
    nodes, 
    onCreationMove, 
    connectionValidation.snapDistance
  ])

  // Handle click to cancel edge creation
  const handleCanvasClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (creationState.isCreating && !hoveredAnchor) {
      onCreationCancel()
    }
  }, [creationState.isCreating, hoveredAnchor, onCreationCancel])

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && creationState.isCreating) {
        onCreationCancel()
      }
    }

    if (creationState.isCreating) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [creationState.isCreating, onCreationCancel])

  // Generate preview edge path
  const generatePreviewEdge = useCallback((): EdgeProps | null => {
    if (!creationState.isCreating || 
        !creationState.sourceConnection || 
        !creationState.currentPosition) {
      return null
    }

    const targetPosition = creationState.validTarget?.position || creationState.currentPosition
    const edgeId = 'preview-edge'
    
    switch (defaultEdgeType) {
      case 'bezier':
        const controlPoints = generateBezierControlPoints(
          creationState.sourceConnection.position,
          targetPosition,
          0.5
        )
        
        return {
          id: edgeId,
          type: 'bezier',
          source: creationState.sourceConnection,
          target: {
            nodeId: creationState.validTarget?.nodeId || 'preview',
            anchorId: creationState.validTarget?.anchorId || 'preview',
            position: targetPosition,
          },
          path: {
            type: 'bezier',
            start: creationState.sourceConnection.position,
            end: targetPosition,
            controlPoints,
          },
          style: {
            ...defaultStyle,
            stroke: creationState.validTarget ? '#10b981' : '#ef4444',
          },
          controlPoints,
          curvature: 0.5,
          showControlPoints: false,
        } as BezierEdgeProps

      case 'straight':
        return {
          id: edgeId,
          type: 'straight',
          source: creationState.sourceConnection,
          target: {
            nodeId: creationState.validTarget?.nodeId || 'preview',
            anchorId: creationState.validTarget?.anchorId || 'preview',
            position: targetPosition,
          },
          path: {
            type: 'straight',
            start: creationState.sourceConnection.position,
            end: targetPosition,
          },
          style: {
            ...defaultStyle,
            stroke: creationState.validTarget ? '#10b981' : '#ef4444',
          },
          showMidpointHandle: false,
        } as StraightEdgeProps

      case 'orthogonal':
        return {
          id: edgeId,
          type: 'orthogonal',
          source: creationState.sourceConnection,
          target: {
            nodeId: creationState.validTarget?.nodeId || 'preview',
            anchorId: creationState.validTarget?.anchorId || 'preview',
            position: targetPosition,
          },
          path: {
            type: 'orthogonal',
            start: creationState.sourceConnection.position,
            end: targetPosition,
          },
          style: {
            ...defaultStyle,
            stroke: creationState.validTarget ? '#10b981' : '#ef4444',
          },
          cornerRadius: 5,
          showWaypoints: false,
        } as OrthogonalEdgeProps

      default:
        return null
    }
  }, [creationState, defaultEdgeType, defaultStyle])

  const previewEdge = generatePreviewEdge()

  return (
    <g data-testid="edge-manager">
      {/* Event capture layer */}
      <rect
        width="100%"
        height="100%"
        fill="transparent"
        style={{ pointerEvents: creationState.isCreating ? 'all' : 'none' }}
        onMouseMove={handleMouseMove}
        onClick={handleCanvasClick}
      />

      {/* Preview edge during creation */}
      {previewEdge && (
        <g data-testid="edge-preview">
          {previewEdge.type === 'bezier' && (
            <BezierEdge
              {...(previewEdge as BezierEdgeProps)}
              visualState={{ connecting: true }}
            />
          )}
          {previewEdge.type === 'straight' && (
            <StraightEdge
              {...(previewEdge as StraightEdgeProps)}
              visualState={{ connecting: true }}
            />
          )}
          {previewEdge.type === 'orthogonal' && (
            <OrthogonalEdge
              {...(previewEdge as OrthogonalEdgeProps)}
              visualState={{ connecting: true }}
            />
          )}
        </g>
      )}

      {/* Connection point highlights */}
      {nodes.map(node =>
        node.anchors.map(anchor => {
          const isHovered = hoveredAnchor?.nodeId === node.id && hoveredAnchor?.anchorId === anchor.id
          const isValidTarget = creationState.validTarget?.nodeId === node.id && 
                               creationState.validTarget?.anchorId === anchor.id
          
          if (!anchor.visible || !creationState.isCreating || 
              (node.id === creationState.sourceConnection?.nodeId && 
               anchor.id === creationState.sourceConnection?.anchorId)) {
            return null
          }

          const anchorPosition = {
            x: node.position.x + (anchor.offset?.x || 0),
            y: node.position.y + (anchor.offset?.y || 0)
          }

          return (
            <circle
              key={`${node.id}-${anchor.id}-highlight`}
              data-testid="connection-point-highlight"
              cx={anchorPosition.x}
              cy={anchorPosition.y}
              r={connectionValidation.highlightRadius || 15}
              fill="none"
              stroke={isValidTarget ? '#10b981' : isHovered ? '#3b82f6' : '#6b7280'}
              strokeWidth="2"
              strokeDasharray="3,3"
              opacity={isHovered || isValidTarget ? 0.8 : 0.4}
              style={{ pointerEvents: 'none' }}
              className="transition-all duration-200"
            />
          )
        })
      )}
    </g>
  )
}

export default EdgeManager