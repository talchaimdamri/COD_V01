/**
 * SVG Path Calculation Utilities
 * 
 * Provides functions for calculating SVG paths for different edge types including
 * bezier curves, straight lines, and orthogonal routing. Used by edge components
 * for rendering and interaction calculations.
 */

import type { 
  Position, 
  EdgePath, 
  BezierControlPoints 
} from '../../schemas/events/canvas'

/**
 * Calculate SVG path string for a bezier curve
 */
export function calculateBezierPath(
  start: Position,
  end: Position,
  cp1?: Position,
  cp2?: Position
): string {
  // If no control points provided, generate defaults
  if (!cp1 || !cp2) {
    const generated = generateBezierControlPoints(start, end)
    cp1 = cp1 || generated.cp1
    cp2 = cp2 || generated.cp2
  }
  
  return `M ${start.x},${start.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${end.x},${end.y}`
}

/**
 * Calculate SVG path string for a straight line
 */
export function calculateStraightPath(start: Position, end: Position): string {
  return `M ${start.x},${start.y} L ${end.x},${end.y}`
}

/**
 * Calculate SVG path string for orthogonal routing
 */
export function calculateOrthogonalPath(
  start: Position,
  end: Position,
  waypoints?: Position[],
  cornerRadius: number = 0
): string {
  if (!waypoints || waypoints.length === 0) {
    // Generate default waypoints for orthogonal routing
    waypoints = generateOrthogonalWaypoints(start, end)
  }
  
  if (cornerRadius <= 0) {
    // Sharp corners
    let path = `M ${start.x},${start.y}`
    waypoints.forEach(point => {
      path += ` L ${point.x},${point.y}`
    })
    path += ` L ${end.x},${end.y}`
    return path
  } else {
    // Rounded corners
    return calculateRoundedOrthogonalPath(start, end, waypoints, cornerRadius)
  }
}

/**
 * Generate default bezier control points for smooth curves
 */
export function generateBezierControlPoints(
  start: Position, 
  end: Position,
  curvature: number = 0.5
): BezierControlPoints {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  
  // Calculate control point offset based on distance and curvature
  const offset = Math.min(distance * curvature, 200) // Max offset of 200px
  
  // Default to horizontal control points for smooth curves
  const cp1: Position = {
    x: start.x + offset,
    y: start.y
  }
  
  const cp2: Position = {
    x: end.x - offset,
    y: end.y
  }
  
  return { cp1, cp2 }
}

/**
 * Generate waypoints for orthogonal routing
 */
export function generateOrthogonalWaypoints(
  start: Position,
  end: Position
): Position[] {
  const midX = (start.x + end.x) / 2
  
  return [
    { x: midX, y: start.y },
    { x: midX, y: end.y }
  ]
}

/**
 * Calculate orthogonal path with rounded corners
 */
function calculateRoundedOrthogonalPath(
  start: Position,
  end: Position,
  waypoints: Position[],
  cornerRadius: number
): string {
  const allPoints = [start, ...waypoints, end]
  
  if (allPoints.length < 3) {
    return calculateStraightPath(start, end)
  }
  
  let path = `M ${allPoints[0].x},${allPoints[0].y}`
  
  for (let i = 1; i < allPoints.length - 1; i++) {
    const prev = allPoints[i - 1]
    const current = allPoints[i]
    const next = allPoints[i + 1]
    
    // Calculate vectors
    const v1 = { x: current.x - prev.x, y: current.y - prev.y }
    const v2 = { x: next.x - current.x, y: next.y - current.y }
    
    // Normalize vectors
    const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
    const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
    
    if (len1 === 0 || len2 === 0) continue
    
    v1.x /= len1
    v1.y /= len1
    v2.x /= len2
    v2.y /= len2
    
    // Calculate corner radius (limited by segment lengths)
    const actualRadius = Math.min(
      cornerRadius,
      len1 / 2,
      len2 / 2
    )
    
    // Calculate arc points
    const arcStart = {
      x: current.x - v1.x * actualRadius,
      y: current.y - v1.y * actualRadius
    }
    
    const arcEnd = {
      x: current.x + v2.x * actualRadius,
      y: current.y + v2.y * actualRadius
    }
    
    // Add line to arc start
    path += ` L ${arcStart.x},${arcStart.y}`
    
    // Add arc (using quadratic curve for simplicity)
    path += ` Q ${current.x},${current.y} ${arcEnd.x},${arcEnd.y}`
  }
  
  // Add final line to end
  path += ` L ${end.x},${end.y}`
  
  return path
}

/**
 * Calculate approximate path length
 */
export function calculatePathLength(path: EdgePath): number {
  switch (path.type) {
    case 'straight':
      return calculateDistance(path.start, path.end)
    
    case 'bezier':
      // Approximate bezier length using control points
      if (path.controlPoints) {
        const { cp1, cp2 } = path.controlPoints
        const seg1 = calculateDistance(path.start, cp1)
        const seg2 = calculateDistance(cp1, cp2) 
        const seg3 = calculateDistance(cp2, path.end)
        return (seg1 + seg2 + seg3) * 0.8 // Approximate bezier length
      } else {
        return calculateDistance(path.start, path.end) * 1.2
      }
    
    case 'orthogonal':
      if (path.waypoints) {
        const points = [path.start, ...path.waypoints, path.end]
        let totalLength = 0
        for (let i = 1; i < points.length; i++) {
          totalLength += calculateDistance(points[i - 1], points[i])
        }
        return totalLength
      } else {
        const waypoints = generateOrthogonalWaypoints(path.start, path.end)
        const points = [path.start, ...waypoints, path.end]
        let totalLength = 0
        for (let i = 1; i < points.length; i++) {
          totalLength += calculateDistance(points[i - 1], points[i])
        }
        return totalLength
      }
    
    default:
      return calculateDistance(path.start, path.end)
  }
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(p1: Position, p2: Position): number {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Get point at specific distance along path (approximation)
 */
export function getPointAtDistance(
  path: EdgePath, 
  distance: number
): Position {
  const totalLength = calculatePathLength(path)
  const ratio = Math.max(0, Math.min(1, distance / totalLength))
  
  return getPointAtRatio(path, ratio)
}

/**
 * Get point at specific ratio along path (0 = start, 1 = end)
 */
export function getPointAtRatio(
  path: EdgePath, 
  ratio: number
): Position {
  const t = Math.max(0, Math.min(1, ratio))
  
  switch (path.type) {
    case 'straight':
      return {
        x: path.start.x + (path.end.x - path.start.x) * t,
        y: path.start.y + (path.end.y - path.start.y) * t
      }
    
    case 'bezier':
      if (path.controlPoints) {
        return getBezierPoint(path.start, path.controlPoints.cp1, path.controlPoints.cp2, path.end, t)
      } else {
        // Fallback to straight line
        return {
          x: path.start.x + (path.end.x - path.start.x) * t,
          y: path.start.y + (path.end.y - path.start.y) * t
        }
      }
    
    case 'orthogonal':
      const waypoints = path.waypoints || generateOrthogonalWaypoints(path.start, path.end)
      const points = [path.start, ...waypoints, path.end]
      
      // Calculate total length of segments
      const segmentLengths = []
      let totalLength = 0
      for (let i = 1; i < points.length; i++) {
        const length = calculateDistance(points[i - 1], points[i])
        segmentLengths.push(length)
        totalLength += length
      }
      
      // Find which segment contains the target ratio
      const targetDistance = totalLength * t
      let accumulatedDistance = 0
      
      for (let i = 0; i < segmentLengths.length; i++) {
        const segmentLength = segmentLengths[i]
        if (accumulatedDistance + segmentLength >= targetDistance) {
          const segmentRatio = (targetDistance - accumulatedDistance) / segmentLength
          const start = points[i]
          const end = points[i + 1]
          
          return {
            x: start.x + (end.x - start.x) * segmentRatio,
            y: start.y + (end.y - start.y) * segmentRatio
          }
        }
        accumulatedDistance += segmentLength
      }
      
      // Fallback to end point
      return path.end
    
    default:
      return path.start
  }
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
 * Calculate tangent vector at specific ratio along path
 */
export function getTangentAtRatio(
  path: EdgePath, 
  ratio: number
): Position {
  const t = Math.max(0, Math.min(1, ratio))
  const epsilon = 0.001
  
  // Calculate two points very close together
  const point1 = getPointAtRatio(path, Math.max(0, t - epsilon))
  const point2 = getPointAtRatio(path, Math.min(1, t + epsilon))
  
  // Calculate tangent vector
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) {
    return { x: 1, y: 0 } // Default to horizontal
  }
  
  return {
    x: dx / length,
    y: dy / length
  }
}

/**
 * Check if a point is near a path within a given tolerance
 */
export function isPointNearPath(
  path: EdgePath,
  point: Position,
  tolerance: number = 10
): boolean {
  const pathLength = calculatePathLength(path)
  const steps = Math.max(10, Math.floor(pathLength / 20)) // Sample every 20 pixels
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps
    const pathPoint = getPointAtRatio(path, ratio)
    const distance = calculateDistance(point, pathPoint)
    
    if (distance <= tolerance) {
      return true
    }
  }
  
  return false
}

/**
 * Find closest point on path to a given point
 */
export function getClosestPointOnPath(
  path: EdgePath,
  point: Position
): { point: Position; ratio: number; distance: number } {
  const pathLength = calculatePathLength(path)
  const steps = Math.max(20, Math.floor(pathLength / 10)) // Fine sampling
  
  let closestPoint = path.start
  let closestRatio = 0
  let closestDistance = calculateDistance(point, path.start)
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps
    const pathPoint = getPointAtRatio(path, ratio)
    const distance = calculateDistance(point, pathPoint)
    
    if (distance < closestDistance) {
      closestDistance = distance
      closestPoint = pathPoint
      closestRatio = ratio
    }
  }
  
  return {
    point: closestPoint,
    ratio: closestRatio,
    distance: closestDistance
  }
}

/**
 * Calculate optimal control points for bezier curve avoiding obstacles
 */
export function calculateOptimalBezierControlPoints(
  start: Position,
  end: Position,
  obstacles: Array<{ x: number; y: number; width: number; height: number }> = [],
  curvature: number = 0.5
): BezierControlPoints {
  // Start with default control points
  let controlPoints = generateBezierControlPoints(start, end, curvature)
  
  if (obstacles.length === 0) {
    return controlPoints
  }
  
  // Check if default path intersects any obstacles
  const path: EdgePath = {
    type: 'bezier',
    start,
    end,
    controlPoints
  }
  
  // Simple obstacle avoidance - adjust control points vertically
  const hasCollision = obstacles.some(obstacle => {
    const centerX = obstacle.x + obstacle.width / 2
    const centerY = obstacle.y + obstacle.height / 2
    const margin = 50
    
    // Check if path passes through obstacle area
    const pathCenter = getPointAtRatio(path, 0.5)
    return (
      pathCenter.x >= obstacle.x - margin &&
      pathCenter.x <= obstacle.x + obstacle.width + margin &&
      pathCenter.y >= obstacle.y - margin &&
      pathCenter.y <= obstacle.y + obstacle.height + margin
    )
  })
  
  if (hasCollision) {
    // Adjust control points to go around obstacles
    const midY = (start.y + end.y) / 2
    const offset = curvature * 100
    
    controlPoints.cp1.y = midY - offset
    controlPoints.cp2.y = midY - offset
  }
  
  return controlPoints
}