/**
 * Edge Routing Algorithms and Collision Detection
 * 
 * Advanced routing algorithms for edges to avoid node overlaps and create
 * aesthetically pleasing connections between nodes on the canvas.
 */

import type { Position, EdgePath, EdgeType } from '../../schemas/events/canvas'
import type { EdgeRoutingConfig } from '../../schemas/api/edges'
import { 
  generateBezierControlPoints, 
  generateOrthogonalWaypoints,
  calculateDistance,
  isPointNearPath
} from './svgPaths'

export interface NodeBounds {
  id: string
  x: number
  y: number
  width: number
  height: number
  type: 'rectangle' | 'circle' | 'hexagon'
}

export interface RoutingObstacle {
  x: number
  y: number
  width: number
  height: number
  padding: number
}

/**
 * Create node bounds from canvas nodes
 */
export function createNodeBounds(nodes: Array<{
  id: string
  type: 'document' | 'agent'
  position: Position
  dimensions?: { width?: number; height?: number; radius?: number }
}>): NodeBounds[] {
  return nodes.map(node => {
    if (node.type === 'document') {
      const width = node.dimensions?.width || 120
      const height = node.dimensions?.height || 80
      return {
        id: node.id,
        x: node.position.x - width / 2,
        y: node.position.y - height / 2,
        width,
        height,
        type: 'rectangle' as const,
      }
    } else {
      const radius = node.dimensions?.radius || 35
      return {
        id: node.id,
        x: node.position.x - radius,
        y: node.position.y - radius,
        width: radius * 2,
        height: radius * 2,
        type: node.type === 'agent' ? 'hexagon' : 'circle' as const,
      }
    }
  })
}

/**
 * Convert node bounds to routing obstacles
 */
export function createRoutingObstacles(
  nodeBounds: NodeBounds[],
  excludeNodes: string[] = [],
  padding: number = 20
): RoutingObstacle[] {
  return nodeBounds
    .filter(node => !excludeNodes.includes(node.id))
    .map(node => ({
      x: node.x - padding,
      y: node.y - padding,
      width: node.width + padding * 2,
      height: node.height + padding * 2,
      padding,
    }))
}

/**
 * Check if a point is inside a rectangular obstacle
 */
export function isPointInObstacle(point: Position, obstacle: RoutingObstacle): boolean {
  return point.x >= obstacle.x &&
         point.x <= obstacle.x + obstacle.width &&
         point.y >= obstacle.y &&
         point.y <= obstacle.y + obstacle.height
}

/**
 * Check if a line segment intersects with an obstacle
 */
export function doesLineIntersectObstacle(
  start: Position,
  end: Position,
  obstacle: RoutingObstacle
): boolean {
  // Check if endpoints are inside obstacle
  if (isPointInObstacle(start, obstacle) || isPointInObstacle(end, obstacle)) {
    return true
  }

  // Check line-rectangle intersection using separating axis theorem
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  // Parametric line equation: P = start + t * (end - start)
  // Check intersection with each edge of the rectangle
  
  const tValues: number[] = []
  
  // Left edge (x = obstacle.x)
  if (dx !== 0) {
    const t = (obstacle.x - start.x) / dx
    if (t >= 0 && t <= 1) {
      const y = start.y + t * dy
      if (y >= obstacle.y && y <= obstacle.y + obstacle.height) {
        tValues.push(t)
      }
    }
  }
  
  // Right edge (x = obstacle.x + obstacle.width)
  if (dx !== 0) {
    const t = (obstacle.x + obstacle.width - start.x) / dx
    if (t >= 0 && t <= 1) {
      const y = start.y + t * dy
      if (y >= obstacle.y && y <= obstacle.y + obstacle.height) {
        tValues.push(t)
      }
    }
  }
  
  // Top edge (y = obstacle.y)
  if (dy !== 0) {
    const t = (obstacle.y - start.y) / dy
    if (t >= 0 && t <= 1) {
      const x = start.x + t * dx
      if (x >= obstacle.x && x <= obstacle.x + obstacle.width) {
        tValues.push(t)
      }
    }
  }
  
  // Bottom edge (y = obstacle.y + obstacle.height)
  if (dy !== 0) {
    const t = (obstacle.y + obstacle.height - start.y) / dy
    if (t >= 0 && t <= 1) {
      const x = start.x + t * dx
      if (x >= obstacle.x && x <= obstacle.x + obstacle.width) {
        tValues.push(t)
      }
    }
  }
  
  return tValues.length > 0
}

/**
 * Smart bezier routing with obstacle avoidance
 */
export function calculateSmartBezierPath(
  start: Position,
  end: Position,
  obstacles: RoutingObstacle[],
  config: EdgeRoutingConfig = {}
): EdgePath {
  const { padding = 20, smoothing = 0.5 } = config
  
  // Start with default control points
  let controlPoints = generateBezierControlPoints(start, end, smoothing)
  
  // Check if default path intersects any obstacles
  const hasIntersection = obstacles.some(obstacle => {
    // Sample the bezier curve at multiple points
    for (let t = 0; t <= 1; t += 0.1) {
      const point = getBezierPoint(start, controlPoints.cp1, controlPoints.cp2, end, t)
      if (isPointInObstacle(point, obstacle)) {
        return true
      }
    }
    return false
  })
  
  if (hasIntersection) {
    // Try different control point strategies
    const strategies = [
      // Strategy 1: Move control points vertically
      () => {
        const midY = (start.y + end.y) / 2
        const offset = Math.max(100, padding * 2)
        const above = midY - offset
        const below = midY + offset
        
        // Try above first
        let testCP = {
          cp1: { x: controlPoints.cp1.x, y: above },
          cp2: { x: controlPoints.cp2.x, y: above }
        }
        
        if (!testPathIntersectsObstacles(start, end, testCP, obstacles)) {
          return testCP
        }
        
        // Try below
        testCP = {
          cp1: { x: controlPoints.cp1.x, y: below },
          cp2: { x: controlPoints.cp2.x, y: below }
        }
        
        if (!testPathIntersectsObstacles(start, end, testCP, obstacles)) {
          return testCP
        }
        
        return null
      },
      
      // Strategy 2: Wide arc around obstacles
      () => {
        const direction = end.x > start.x ? 1 : -1
        const arcRadius = Math.max(150, padding * 3)
        
        return {
          cp1: { 
            x: start.x + direction * arcRadius * 0.7, 
            y: start.y - arcRadius 
          },
          cp2: { 
            x: end.x - direction * arcRadius * 0.7, 
            y: end.y - arcRadius 
          }
        }
      },
      
      // Strategy 3: S-curve routing
      () => {
        const midX = (start.x + end.x) / 2
        const offsetY = (end.y - start.y) * 0.3
        
        return {
          cp1: { x: midX, y: start.y + offsetY },
          cp2: { x: midX, y: end.y - offsetY }
        }
      }
    ]
    
    // Try each strategy
    for (const strategy of strategies) {
      const newCP = strategy()
      if (newCP && !testPathIntersectsObstacles(start, end, newCP, obstacles)) {
        controlPoints = newCP
        break
      }
    }
  }
  
  return {
    type: 'bezier',
    start,
    end,
    controlPoints
  }
}

/**
 * Smart orthogonal routing with obstacle avoidance
 */
export function calculateSmartOrthogonalPath(
  start: Position,
  end: Position,
  obstacles: RoutingObstacle[],
  config: EdgeRoutingConfig = {}
): EdgePath {
  const { padding = 20, cornerRadius = 5 } = config
  
  // Use A* pathfinding for complex obstacle avoidance
  const waypoints = findOrthogonalPath(start, end, obstacles, padding)
  
  return {
    type: 'orthogonal',
    start,
    end,
    waypoints
  }
}

/**
 * A* pathfinding for orthogonal routing
 */
function findOrthogonalPath(
  start: Position,
  end: Position,
  obstacles: RoutingObstacle[],
  padding: number
): Position[] {
  // Simple orthogonal routing - can be enhanced with proper A* algorithm
  const waypoints: Position[] = []
  
  // Check if direct horizontal then vertical path is clear
  const midpoint1 = { x: end.x, y: start.y }
  if (!obstacles.some(obs => 
    doesLineIntersectObstacle(start, midpoint1, obs) ||
    doesLineIntersectObstacle(midpoint1, end, obs)
  )) {
    waypoints.push(midpoint1)
    return waypoints
  }
  
  // Check if direct vertical then horizontal path is clear
  const midpoint2 = { x: start.x, y: end.y }
  if (!obstacles.some(obs => 
    doesLineIntersectObstacle(start, midpoint2, obs) ||
    doesLineIntersectObstacle(midpoint2, end, obs)
  )) {
    waypoints.push(midpoint2)
    return waypoints
  }
  
  // More complex routing - go around obstacles
  const dx = end.x - start.x
  const dy = end.y - start.y
  
  // Find the largest obstacle in the path
  let largestObstacle: RoutingObstacle | null = null
  let largestArea = 0
  
  obstacles.forEach(obstacle => {
    const area = obstacle.width * obstacle.height
    if (area > largestArea) {
      // Check if obstacle is roughly in the path
      const centerX = obstacle.x + obstacle.width / 2
      const centerY = obstacle.y + obstacle.height / 2
      
      if ((dx > 0 && centerX > start.x && centerX < end.x) ||
          (dx < 0 && centerX < start.x && centerX > end.x) ||
          (dy > 0 && centerY > start.y && centerY < end.y) ||
          (dy < 0 && centerY < start.y && centerY > end.y)) {
        largestObstacle = obstacle
        largestArea = area
      }
    }
  })
  
  if (largestObstacle) {
    // Route around the largest obstacle
    const obs = largestObstacle
    
    // Decide whether to go over/under or left/right
    if (Math.abs(dx) > Math.abs(dy)) {
      // More horizontal movement - go over or under
      const goUp = start.y > obs.y + obs.height / 2
      const routeY = goUp ? obs.y - padding : obs.y + obs.height + padding
      
      waypoints.push(
        { x: start.x, y: routeY },
        { x: end.x, y: routeY }
      )
    } else {
      // More vertical movement - go left or right
      const goLeft = start.x > obs.x + obs.width / 2
      const routeX = goLeft ? obs.x - padding : obs.x + obs.width + padding
      
      waypoints.push(
        { x: routeX, y: start.y },
        { x: routeX, y: end.y }
      )
    }
  } else {
    // Default L-shaped path
    waypoints.push({ x: end.x, y: start.y })
  }
  
  return waypoints
}

/**
 * Test if bezier path intersects obstacles
 */
function testPathIntersectsObstacles(
  start: Position,
  end: Position,
  controlPoints: { cp1: Position; cp2: Position },
  obstacles: RoutingObstacle[]
): boolean {
  // Sample the bezier curve at multiple points
  for (let t = 0; t <= 1; t += 0.05) {
    const point = getBezierPoint(start, controlPoints.cp1, controlPoints.cp2, end, t)
    if (obstacles.some(obs => isPointInObstacle(point, obs))) {
      return true
    }
  }
  return false
}

/**
 * Calculate point on cubic bezier curve at parameter t
 */
function getBezierPoint(
  p0: Position,
  p1: Position,
  p2: Position,
  p3: Position,
  t: number
): Position {
  const oneMinusT = 1 - t
  const oneMinusT2 = oneMinusT * oneMinusT
  const oneMinusT3 = oneMinusT2 * oneMinusT
  const t2 = t * t
  const t3 = t2 * t
  
  return {
    x: oneMinusT3 * p0.x + 3 * oneMinusT2 * t * p1.x + 3 * oneMinusT * t2 * p2.x + t3 * p3.x,
    y: oneMinusT3 * p0.y + 3 * oneMinusT2 * t * p1.y + 3 * oneMinusT * t2 * p2.y + t3 * p3.y
  }
}

/**
 * Calculate optimal edge path based on routing algorithm
 */
export function calculateOptimalEdgePath(
  start: Position,
  end: Position,
  edgeType: EdgeType,
  obstacles: RoutingObstacle[],
  config: EdgeRoutingConfig = {}
): EdgePath {
  const { algorithm = 'bezier', avoidNodes = true } = config
  
  const activeObstacles = avoidNodes ? obstacles : []
  
  switch (algorithm) {
    case 'straight':
      return {
        type: 'straight',
        start,
        end
      }
    
    case 'orthogonal':
      return calculateSmartOrthogonalPath(start, end, activeObstacles, config)
    
    case 'smart':
      // Smart algorithm chooses best routing based on context
      const distance = calculateDistance(start, end)
      const hasObstacles = activeObstacles.length > 0
      
      if (!hasObstacles || distance < 100) {
        return {
          type: 'bezier',
          start,
          end,
          controlPoints: generateBezierControlPoints(start, end, config.smoothing)
        }
      } else {
        return calculateSmartBezierPath(start, end, activeObstacles, config)
      }
    
    case 'bezier':
    default:
      return calculateSmartBezierPath(start, end, activeObstacles, config)
  }
}

/**
 * Find edge intersections for layout optimization
 */
export function findEdgeIntersections(edges: EdgePath[]): Array<{
  edge1Index: number
  edge2Index: number
  intersection: Position
}> {
  const intersections: Array<{
    edge1Index: number
    edge2Index: number
    intersection: Position
  }> = []
  
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const intersection = findPathIntersection(edges[i], edges[j])
      if (intersection) {
        intersections.push({
          edge1Index: i,
          edge2Index: j,
          intersection
        })
      }
    }
  }
  
  return intersections
}

/**
 * Find intersection point between two paths (simplified)
 */
function findPathIntersection(path1: EdgePath, path2: EdgePath): Position | null {
  // For simplicity, only handle straight line intersections
  if (path1.type === 'straight' && path2.type === 'straight') {
    return findLineIntersection(
      path1.start, path1.end,
      path2.start, path2.end
    )
  }
  
  // For curves, use approximate sampling
  const samples1 = samplePath(path1, 20)
  const samples2 = samplePath(path2, 20)
  
  for (let i = 0; i < samples1.length - 1; i++) {
    for (let j = 0; j < samples2.length - 1; j++) {
      const intersection = findLineIntersection(
        samples1[i], samples1[i + 1],
        samples2[j], samples2[j + 1]
      )
      if (intersection) {
        return intersection
      }
    }
  }
  
  return null
}

/**
 * Find intersection of two line segments
 */
function findLineIntersection(
  p1: Position, p2: Position,
  p3: Position, p4: Position
): Position | null {
  const x1 = p1.x, y1 = p1.y
  const x2 = p2.x, y2 = p2.y
  const x3 = p3.x, y3 = p3.y
  const x4 = p4.x, y4 = p4.y
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  
  if (Math.abs(denom) < 1e-10) {
    return null // Parallel lines
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    }
  }
  
  return null
}

/**
 * Sample points along a path for intersection testing
 */
function samplePath(path: EdgePath, samples: number): Position[] {
  const points: Position[] = []
  
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    
    switch (path.type) {
      case 'straight':
        points.push({
          x: path.start.x + t * (path.end.x - path.start.x),
          y: path.start.y + t * (path.end.y - path.start.y)
        })
        break
      
      case 'bezier':
        if (path.controlPoints) {
          points.push(getBezierPoint(
            path.start, 
            path.controlPoints.cp1, 
            path.controlPoints.cp2, 
            path.end, 
            t
          ))
        }
        break
      
      case 'orthogonal':
        // Sample orthogonal path segments
        const waypoints = [path.start, ...(path.waypoints || []), path.end]
        let totalLength = 0
        const segmentLengths: number[] = []
        
        for (let j = 1; j < waypoints.length; j++) {
          const length = calculateDistance(waypoints[j - 1], waypoints[j])
          segmentLengths.push(length)
          totalLength += length
        }
        
        const targetDistance = t * totalLength
        let accumulatedDistance = 0
        
        for (let j = 0; j < segmentLengths.length; j++) {
          if (accumulatedDistance + segmentLengths[j] >= targetDistance) {
            const segmentT = (targetDistance - accumulatedDistance) / segmentLengths[j]
            const start = waypoints[j]
            const end = waypoints[j + 1]
            
            points.push({
              x: start.x + segmentT * (end.x - start.x),
              y: start.y + segmentT * (end.y - start.y)
            })
            break
          }
          accumulatedDistance += segmentLengths[j]
        }
        break
    }
  }
  
  return points
}