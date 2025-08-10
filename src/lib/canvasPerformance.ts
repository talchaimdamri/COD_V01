/**
 * Canvas Performance Optimization Hook
 * Provides optimizations for canvas rendering during sidebar operations
 */

import { useCallback, useRef, useEffect, useMemo } from 'react'
import { debounce, throttle } from './utils'

export interface PerformanceMetrics {
  renderTime: number
  frameRate: number
  memoryUsage?: number
  nodeCount: number
  edgeCount: number
  viewportNodes: number
}

export interface PerformanceOptimizations {
  // Rendering optimizations
  shouldSkipRender: boolean
  shouldUseSimplifiedRender: boolean
  shouldBatchUpdates: boolean
  cullingEnabled: boolean
  
  // Update optimizations  
  lastOptimizedUpdate: number
  pendingUpdates: boolean
  
  // Memory optimizations
  shouldCleanupOffscreenElements: boolean
  virtualizationLevel: 'none' | 'basic' | 'aggressive'
}

interface UseCanvasPerformanceOptions {
  // Performance thresholds
  maxRenderTime?: number
  targetFrameRate?: number
  memoryThreshold?: number
  
  // Optimization settings
  enableCulling?: boolean
  enableVirtualization?: boolean
  batchUpdateInterval?: number
  simplifiedRenderThreshold?: number
  
  // Debugging
  enableMetrics?: boolean
  logPerformance?: boolean
}

/**
 * Canvas Performance Hook
 */
export function useCanvasPerformance(options: UseCanvasPerformanceOptions = {}) {
  const {
    maxRenderTime = 16, // 60fps target
    targetFrameRate = 60,
    memoryThreshold = 100 * 1024 * 1024, // 100MB
    enableCulling = true,
    enableVirtualization = true,
    batchUpdateInterval = 100,
    simplifiedRenderThreshold = 1000,
    enableMetrics = true,
    logPerformance = false,
  } = options

  // Performance metrics
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    frameRate: 60,
    nodeCount: 0,
    edgeCount: 0,
    viewportNodes: 0,
  })

  const optimizationsRef = useRef<PerformanceOptimizations>({
    shouldSkipRender: false,
    shouldUseSimplifiedRender: false,
    shouldBatchUpdates: false,
    cullingEnabled: enableCulling,
    lastOptimizedUpdate: Date.now(),
    pendingUpdates: false,
    shouldCleanupOffscreenElements: false,
    virtualizationLevel: 'none',
  })

  // Frame rate tracking
  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef(Date.now())

  // Render performance tracking
  const renderStartTimeRef = useRef(0)
  const isRenderingRef = useRef(false)

  // Batched update handling
  const pendingUpdatesRef = useRef(new Set<string>())
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Viewport culling cache
  const cullingCacheRef = useRef({
    viewportBounds: { x: 0, y: 0, width: 0, height: 0 },
    visibleNodes: new Set<string>(),
    visibleEdges: new Set<string>(),
    lastCullingUpdate: 0,
  })

  /**
   * Start render performance measurement
   */
  const startRenderMeasurement = useCallback(() => {
    if (!enableMetrics) return

    renderStartTimeRef.current = performance.now()
    isRenderingRef.current = true
  }, [enableMetrics])

  /**
   * End render performance measurement
   */
  const endRenderMeasurement = useCallback(() => {
    if (!enableMetrics || !isRenderingRef.current) return

    const renderTime = performance.now() - renderStartTimeRef.current
    metricsRef.current.renderTime = renderTime
    isRenderingRef.current = false

    // Update frame rate
    const now = Date.now()
    const deltaTime = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    frameTimesRef.current.push(deltaTime)
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift()
    }

    // Calculate average frame rate
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
    metricsRef.current.frameRate = 1000 / avgFrameTime

    // Update optimizations based on performance
    updateOptimizations()

    if (logPerformance) {
      console.log('Canvas Performance:', {
        renderTime: renderTime.toFixed(2) + 'ms',
        frameRate: metricsRef.current.frameRate.toFixed(1) + 'fps',
        nodeCount: metricsRef.current.nodeCount,
        edgeCount: metricsRef.current.edgeCount,
        viewportNodes: metricsRef.current.viewportNodes,
      })
    }
  }, [enableMetrics, logPerformance])

  /**
   * Update performance optimizations based on current metrics
   */
  const updateOptimizations = useCallback(() => {
    const metrics = metricsRef.current
    const opts = optimizationsRef.current

    // Skip render if frame rate is too low
    opts.shouldSkipRender = metrics.frameRate < targetFrameRate * 0.5

    // Use simplified rendering for large scenes
    opts.shouldUseSimplifiedRender = metrics.nodeCount > simplifiedRenderThreshold

    // Enable batching if render time is high
    opts.shouldBatchUpdates = metrics.renderTime > maxRenderTime

    // Adjust virtualization level based on performance
    if (enableVirtualization) {
      if (metrics.nodeCount > 2000 || metrics.renderTime > maxRenderTime * 2) {
        opts.virtualizationLevel = 'aggressive'
      } else if (metrics.nodeCount > 500 || metrics.renderTime > maxRenderTime) {
        opts.virtualizationLevel = 'basic'
      } else {
        opts.virtualizationLevel = 'none'
      }
    }

    // Enable cleanup if memory pressure is detected
    if (performance.memory?.usedJSHeapSize > memoryThreshold) {
      opts.shouldCleanupOffscreenElements = true
    }

    opts.lastOptimizedUpdate = Date.now()
  }, [targetFrameRate, maxRenderTime, simplifiedRenderThreshold, enableVirtualization, memoryThreshold])

  /**
   * Update element counts for performance metrics
   */
  const updateElementCounts = useCallback((nodeCount: number, edgeCount: number, viewportNodes: number) => {
    metricsRef.current.nodeCount = nodeCount
    metricsRef.current.edgeCount = edgeCount
    metricsRef.current.viewportNodes = viewportNodes
  }, [])

  /**
   * Perform viewport culling calculation
   */
  const performViewportCulling = useCallback((
    viewBox: { x: number; y: number; width: number; height: number },
    nodes: Array<{ id: string; position: { x: number; y: number } }>,
    edges: Array<{ id: string; source: { position: { x: number; y: number } }; target: { position: { x: number; y: number } } }>,
    nodeRadius: number = 30
  ) => {
    if (!optimizationsRef.current.cullingEnabled) {
      return {
        visibleNodes: new Set(nodes.map(n => n.id)),
        visibleEdges: new Set(edges.map(e => e.id)),
      }
    }

    const cache = cullingCacheRef.current
    const now = Date.now()

    // Use cached result if viewport hasn't changed much and it's recent
    if (
      now - cache.lastCullingUpdate < 100 &&
      Math.abs(cache.viewportBounds.x - viewBox.x) < 10 &&
      Math.abs(cache.viewportBounds.y - viewBox.y) < 10 &&
      Math.abs(cache.viewportBounds.width - viewBox.width) < 10 &&
      Math.abs(cache.viewportBounds.height - viewBox.height) < 10
    ) {
      return {
        visibleNodes: cache.visibleNodes,
        visibleEdges: cache.visibleEdges,
      }
    }

    // Expand viewport bounds for culling margin
    const margin = Math.max(nodeRadius * 2, 100)
    const cullBounds = {
      left: viewBox.x - margin,
      right: viewBox.x + viewBox.width + margin,
      top: viewBox.y - margin,
      bottom: viewBox.y + viewBox.height + margin,
    }

    // Cull nodes
    const visibleNodes = new Set<string>()
    for (const node of nodes) {
      if (
        node.position.x >= cullBounds.left &&
        node.position.x <= cullBounds.right &&
        node.position.y >= cullBounds.top &&
        node.position.y <= cullBounds.bottom
      ) {
        visibleNodes.add(node.id)
      }
    }

    // Cull edges (only if both endpoints are visible or edge crosses viewport)
    const visibleEdges = new Set<string>()
    for (const edge of edges) {
      const sourceVisible = visibleNodes.has(edge.source.position.x >= cullBounds.left &&
        edge.source.position.x <= cullBounds.right &&
        edge.source.position.y >= cullBounds.top &&
        edge.source.position.y <= cullBounds.bottom ? 'true' : 'false')
      const targetVisible = visibleNodes.has(edge.target.position.x >= cullBounds.left &&
        edge.target.position.x <= cullBounds.right &&
        edge.target.position.y >= cullBounds.top &&
        edge.target.position.y <= cullBounds.bottom ? 'true' : 'false')

      if (sourceVisible || targetVisible) {
        visibleEdges.add(edge.id)
      }
    }

    // Update cache
    cache.viewportBounds = { ...viewBox }
    cache.visibleNodes = visibleNodes
    cache.visibleEdges = visibleEdges
    cache.lastCullingUpdate = now

    return { visibleNodes, visibleEdges }
  }, [])

  /**
   * Batched update system
   */
  const batchUpdate = useCallback((updateId: string, updateFn: () => void) => {
    if (!optimizationsRef.current.shouldBatchUpdates) {
      updateFn()
      return
    }

    pendingUpdatesRef.current.add(updateId)
    optimizationsRef.current.pendingUpdates = true

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current)
    }

    batchTimeoutRef.current = setTimeout(() => {
      // Execute all pending updates
      updateFn()
      
      pendingUpdatesRef.current.clear()
      optimizationsRef.current.pendingUpdates = false
      batchTimeoutRef.current = null
    }, batchUpdateInterval)
  }, [batchUpdateInterval])

  /**
   * Throttled resize handler for sidebar operations
   */
  const handleSidebarResize = useCallback(
    throttle((newWidth: number) => {
      // Update optimization settings for new sidebar width
      const canvasWidthReduction = newWidth / window.innerWidth
      
      if (canvasWidthReduction > 0.3) {
        // Sidebar takes up significant space, enable more optimizations
        optimizationsRef.current.shouldUseSimplifiedRender = true
        optimizationsRef.current.virtualizationLevel = 'basic'
      } else {
        // Normal sidebar size
        updateOptimizations()
      }
      
      // Force culling cache invalidation
      cullingCacheRef.current.lastCullingUpdate = 0
    }, 100),
    [updateOptimizations]
  )

  /**
   * Debounced cleanup handler
   */
  const performCleanup = useCallback(
    debounce(() => {
      if (!optimizationsRef.current.shouldCleanupOffscreenElements) return

      // Trigger garbage collection hint if available
      if (window.gc && typeof window.gc === 'function') {
        window.gc()
      }

      // Reset cleanup flag
      optimizationsRef.current.shouldCleanupOffscreenElements = false
    }, 1000),
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current)
      }
    }
  }, [])

  // Memoized optimization values
  const optimizations = useMemo(() => optimizationsRef.current, [])
  const metrics = useMemo(() => metricsRef.current, [])

  return {
    // Performance measurement
    startRenderMeasurement,
    endRenderMeasurement,
    
    // Element counting
    updateElementCounts,
    
    // Optimization functions
    performViewportCulling,
    batchUpdate,
    handleSidebarResize,
    performCleanup,
    
    // Current state
    optimizations,
    metrics,
    
    // Utility functions
    shouldSkipFrame: () => optimizations.shouldSkipRender,
    shouldSimplifyRender: () => optimizations.shouldUseSimplifiedRender,
    getVirtualizationLevel: () => optimizations.virtualizationLevel,
    
    // Performance status
    isPerformant: metrics.frameRate >= targetFrameRate * 0.8 && metrics.renderTime <= maxRenderTime,
    needsOptimization: metrics.frameRate < targetFrameRate * 0.6 || metrics.renderTime > maxRenderTime * 1.5,
  }
}