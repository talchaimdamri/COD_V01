import * as DiffMatchPatch from 'diff-match-patch'
import { z } from 'zod'

/**
 * Diff Calculation Service for Document Version Comparison
 * Uses diff-match-patch library for high-performance text diff calculations
 */

// Diff operation types
export interface DiffOperation {
  operation: 'equal' | 'delete' | 'insert'
  text: string
}

export interface DiffResult {
  diffs: DiffOperation[]
  insertions: number
  deletions: number
  commonLength: number
  similarity: number // 0-1 score
  htmlDiff: string
}

export interface PatchResult {
  patches: string[] // Serialized patches
  canApply: boolean
  metadata: {
    sourceHash: string
    targetHash: string
    created: Date
  }
}

export interface DiffOptions {
  timeout?: number // Timeout in seconds for diff calculation
  checkLines?: boolean // Line-based diff for better readability
  cleanupSemantic?: boolean // Post-process for semantic cleanup
  ignoreWhitespace?: boolean // Ignore whitespace differences
  contextLines?: number // Number of context lines around changes
}

export interface PatchOptions {
  fuzzyFactor?: number // 0-1, tolerance for inexact matches
  deleteThreshold?: number // 0-1, threshold for deleting text
  addThreshold?: number // 0-1, threshold for adding text
}

/**
 * Text Diff Service with Performance Optimizations
 */
export class DiffService {
  private dmp: DiffMatchPatch
  private readonly DEFAULT_TIMEOUT = 10 // 10 seconds
  private readonly CACHE_SIZE = 1000
  private diffCache = new Map<string, DiffResult>()

  constructor() {
    this.dmp = new DiffMatchPatch()
    this.dmp.Diff_Timeout = this.DEFAULT_TIMEOUT
  }

  /**
   * Calculate diff between two text versions
   */
  calculateDiff(
    sourceText: string,
    targetText: string,
    options: DiffOptions = {}
  ): DiffResult {
    // Generate cache key
    const cacheKey = this.generateCacheKey(sourceText, targetText, options)
    
    // Check cache first
    if (this.diffCache.has(cacheKey)) {
      return this.diffCache.get(cacheKey)!
    }

    // Configure DMP for this operation
    this.configureDMP(options)

    // Preprocess text if needed
    const processedSource = this.preprocessText(sourceText, options)
    const processedTarget = this.preprocessText(targetText, options)

    // Calculate raw diff
    let rawDiffs: [number, string][]
    
    if (options.checkLines) {
      rawDiffs = this.dmp.diff_lineMode_(processedSource, processedTarget, this.dmp.Diff_Timeout)
    } else {
      rawDiffs = this.dmp.diff_main(processedSource, processedTarget)
    }

    // Post-process diff for better readability
    if (options.cleanupSemantic !== false) {
      this.dmp.diff_cleanupSemantic(rawDiffs)
    }

    // Convert to our format and calculate statistics
    const diffs = this.convertDiffs(rawDiffs)
    const stats = this.calculateDiffStats(diffs, sourceText.length, targetText.length)
    const htmlDiff = this.generateHtmlDiff(diffs, options)

    const result: DiffResult = {
      diffs,
      insertions: stats.insertions,
      deletions: stats.deletions,
      commonLength: stats.commonLength,
      similarity: stats.similarity,
      htmlDiff,
    }

    // Cache result with size limit
    this.cacheResult(cacheKey, result)

    return result
  }

  /**
   * Generate patches for applying changes
   */
  generatePatches(
    sourceText: string,
    targetText: string,
    options: PatchOptions = {}
  ): PatchResult {
    // Calculate diff first
    const diffs = this.dmp.diff_main(sourceText, targetText)
    this.dmp.diff_cleanupSemantic(diffs)

    // Configure patch settings
    this.dmp.Match_Threshold = options.fuzzyFactor || 0.5
    this.dmp.Patch_DeleteThreshold = options.deleteThreshold || 0.5
    this.dmp.Match_Distance = 1000

    // Generate patches
    const patches = this.dmp.patch_make(sourceText, diffs)
    const serializedPatches = patches.map(patch => this.dmp.patch_toText(patch))

    // Test if patches can be applied
    const [appliedText, results] = this.dmp.patch_apply(patches, sourceText)
    const canApply = results.every(result => result === true)

    return {
      patches: serializedPatches,
      canApply,
      metadata: {
        sourceHash: this.calculateHash(sourceText),
        targetHash: this.calculateHash(targetText),
        created: new Date(),
      },
    }
  }

  /**
   * Apply patches to source text
   */
  applyPatches(
    sourceText: string,
    serializedPatches: string[],
    options: PatchOptions = {}
  ): { success: boolean; result: string; errors: string[] } {
    try {
      // Configure patch settings
      this.dmp.Match_Threshold = options.fuzzyFactor || 0.5
      this.dmp.Patch_DeleteThreshold = options.deleteThreshold || 0.5

      // Parse patches
      const patches = serializedPatches.map(patch => this.dmp.patch_fromText(patch))

      // Apply patches
      const [result, results] = this.dmp.patch_apply(patches, sourceText)
      
      const errors: string[] = []
      results.forEach((success, index) => {
        if (!success) {
          errors.push(`Patch ${index} failed to apply`)
        }
      })

      return {
        success: errors.length === 0,
        result,
        errors,
      }
    } catch (error) {
      return {
        success: false,
        result: sourceText,
        errors: [error instanceof Error ? error.message : 'Unknown error applying patches'],
      }
    }
  }

  /**
   * Calculate similarity score between two texts
   */
  calculateSimilarity(text1: string, text2: string): number {
    if (text1 === text2) return 1.0
    if (!text1 || !text2) return 0.0

    const diffs = this.dmp.diff_main(text1, text2)
    this.dmp.diff_cleanupSemantic(diffs)

    let commonLength = 0
    let totalLength = 0

    for (const [op, text] of diffs) {
      if (op === DiffMatchPatch.DIFF_EQUAL) {
        commonLength += text.length
      }
      totalLength += text.length
    }

    return totalLength > 0 ? commonLength / totalLength : 0
  }

  /**
   * Get word-level diff for better readability
   */
  calculateWordDiff(
    sourceText: string,
    targetText: string,
    options: DiffOptions = {}
  ): DiffResult {
    // Split into words but preserve spaces
    const sourceWords = this.tokenizeWords(sourceText)
    const targetWords = this.tokenizeWords(targetText)

    // Join words for diff calculation
    const sourceForDiff = sourceWords.join('\n')
    const targetForDiff = targetWords.join('\n')

    // Calculate diff with line mode (each word is a "line")
    return this.calculateDiff(sourceForDiff, targetForDiff, {
      ...options,
      checkLines: true,
    })
  }

  /**
   * Generate a visual HTML diff with syntax highlighting
   */
  generateVisualDiff(
    sourceText: string,
    targetText: string,
    options: {
      showContext?: number
      inline?: boolean
      theme?: 'light' | 'dark'
    } = {}
  ): string {
    const diffResult = this.calculateDiff(sourceText, targetText, {
      cleanupSemantic: true,
      contextLines: options.showContext,
    })

    const theme = options.theme || 'light'
    const inline = options.inline !== false

    return this.renderHtmlDiff(diffResult.diffs, { theme, inline })
  }

  /**
   * Clear the diff cache
   */
  clearCache(): void {
    this.diffCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.diffCache.size,
      maxSize: this.CACHE_SIZE,
      // Note: hit rate would require additional tracking
    }
  }

  // Private helper methods

  private configureDMP(options: DiffOptions): void {
    this.dmp.Diff_Timeout = options.timeout || this.DEFAULT_TIMEOUT
    this.dmp.Diff_EditCost = 4 // Cost of an edit operation in terms of chars
  }

  private preprocessText(text: string, options: DiffOptions): string {
    if (options.ignoreWhitespace) {
      return text.replace(/\s+/g, ' ').trim()
    }
    return text
  }

  private convertDiffs(rawDiffs: [number, string][]): DiffOperation[] {
    return rawDiffs.map(([op, text]) => ({
      operation: op === DiffMatchPatch.DIFF_DELETE ? 'delete' 
               : op === DiffMatchPatch.DIFF_INSERT ? 'insert' 
               : 'equal',
      text,
    }))
  }

  private calculateDiffStats(
    diffs: DiffOperation[],
    sourceLength: number,
    targetLength: number
  ): {
    insertions: number
    deletions: number
    commonLength: number
    similarity: number
  } {
    let insertions = 0
    let deletions = 0
    let commonLength = 0

    for (const diff of diffs) {
      switch (diff.operation) {
        case 'insert':
          insertions += diff.text.length
          break
        case 'delete':
          deletions += diff.text.length
          break
        case 'equal':
          commonLength += diff.text.length
          break
      }
    }

    const totalLength = Math.max(sourceLength, targetLength)
    const similarity = totalLength > 0 ? commonLength / totalLength : 1

    return { insertions, deletions, commonLength, similarity }
  }

  private generateHtmlDiff(diffs: DiffOperation[], options: DiffOptions): string {
    const html: string[] = []

    for (const diff of diffs) {
      const escapedText = this.escapeHtml(diff.text)
      
      switch (diff.operation) {
        case 'insert':
          html.push(`<ins class="diff-insert">${escapedText}</ins>`)
          break
        case 'delete':
          html.push(`<del class="diff-delete">${escapedText}</del>`)
          break
        case 'equal':
          // For context, we might want to truncate long equal sections
          if (options.contextLines && escapedText.length > 100) {
            const lines = escapedText.split('\n')
            if (lines.length > options.contextLines * 2) {
              const start = lines.slice(0, options.contextLines).join('\n')
              const end = lines.slice(-options.contextLines).join('\n')
              html.push(`${start}<span class="diff-ellipsis">...</span>${end}`)
            } else {
              html.push(escapedText)
            }
          } else {
            html.push(escapedText)
          }
          break
      }
    }

    return html.join('')
  }

  private renderHtmlDiff(
    diffs: DiffOperation[],
    options: { theme: string; inline: boolean }
  ): string {
    const { theme, inline } = options
    const themeClass = `diff-theme-${theme}`
    const layoutClass = inline ? 'diff-inline' : 'diff-side-by-side'

    const html = this.generateHtmlDiff(diffs, {})

    return `
      <div class="diff-container ${themeClass} ${layoutClass}">
        <style>
          .diff-container { font-family: 'Monaco', 'Menlo', monospace; line-height: 1.4; }
          .diff-insert { background-color: #d1e7dd; text-decoration: none; }
          .diff-delete { background-color: #f8d7da; text-decoration: line-through; }
          .diff-ellipsis { color: #6c757d; font-style: italic; }
          .diff-theme-dark { background-color: #1e1e1e; color: #d4d4d4; }
          .diff-theme-dark .diff-insert { background-color: #1b5e20; }
          .diff-theme-dark .diff-delete { background-color: #d32f2f; }
        </style>
        <div class="diff-content">${html}</div>
      </div>
    `
  }

  private tokenizeWords(text: string): string[] {
    // Split on word boundaries but preserve whitespace
    return text.match(/\S+|\s+/g) || []
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  private calculateHash(text: string): string {
    // Simple hash for identification (not cryptographic)
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  private generateCacheKey(
    sourceText: string,
    targetText: string,
    options: DiffOptions
  ): string {
    const sourceHash = this.calculateHash(sourceText)
    const targetHash = this.calculateHash(targetText)
    const optionsHash = this.calculateHash(JSON.stringify(options))
    return `${sourceHash}-${targetHash}-${optionsHash}`
  }

  private cacheResult(key: string, result: DiffResult): void {
    // Implement LRU-style cache with size limit
    if (this.diffCache.size >= this.CACHE_SIZE) {
      // Remove oldest entries
      const keysToRemove = Array.from(this.diffCache.keys()).slice(0, Math.floor(this.CACHE_SIZE * 0.1))
      keysToRemove.forEach(k => this.diffCache.delete(k))
    }
    
    this.diffCache.set(key, result)
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const diffService = new DiffService()

// Zod schemas for API validation

export const DiffOptionsSchema = z.object({
  timeout: z.number().min(1).max(60).optional(),
  checkLines: z.boolean().optional(),
  cleanupSemantic: z.boolean().optional(),
  ignoreWhitespace: z.boolean().optional(),
  contextLines: z.number().min(0).max(50).optional(),
}).optional()

export const PatchOptionsSchema = z.object({
  fuzzyFactor: z.number().min(0).max(1).optional(),
  deleteThreshold: z.number().min(0).max(1).optional(),
  addThreshold: z.number().min(0).max(1).optional(),
}).optional()

export const CalculateDiffRequestSchema = z.object({
  sourceText: z.string(),
  targetText: z.string(),
  options: DiffOptionsSchema,
})

export const GeneratePatchesRequestSchema = z.object({
  sourceText: z.string(),
  targetText: z.string(),
  options: PatchOptionsSchema,
})

export const ApplyPatchesRequestSchema = z.object({
  sourceText: z.string(),
  patches: z.array(z.string()),
  options: PatchOptionsSchema,
})

// Types for external use
export type DiffOptionsType = z.infer<typeof DiffOptionsSchema>
export type PatchOptionsType = z.infer<typeof PatchOptionsSchema>