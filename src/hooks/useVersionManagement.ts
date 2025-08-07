import { useState, useCallback, useRef } from 'react'
import { 
  Version, 
  DiffResult,
  ListVersionsResponse,
  GetVersionResponse,
  RestoreVersionResponse,
  DiffVersionsResponse,
  CreateVersionSnapshotResponse,
  DeleteVersionResponse,
} from '../../schemas/api/versions'

export interface UseVersionManagementOptions {
  documentId: string
  onVersionRestored?: (version: Version) => void
  onVersionDeleted?: (versionId: string) => void
  onError?: (error: string) => void
}

export interface UseVersionManagementReturn {
  // State
  versions: Version[]
  currentVersion: Version | null
  isLoading: boolean
  error: string | null
  hasMore: boolean
  
  // Version operations
  loadVersions: (options?: { page?: number; limit?: number; reset?: boolean }) => Promise<void>
  getVersion: (versionId: string) => Promise<Version | null>
  createSnapshot: (description?: string) => Promise<Version | null>
  restoreVersion: (versionId: string, description?: string) => Promise<boolean>
  deleteVersion: (versionId: string) => Promise<boolean>
  
  // Diff operations
  compareVersions: (fromVersionId: string, toVersionId: string) => Promise<DiffResult | null>
  
  // State management
  clearError: () => void
  refresh: () => Promise<void>
}

export function useVersionManagement({
  documentId,
  onVersionRestored,
  onVersionDeleted,
  onError,
}: UseVersionManagementOptions): UseVersionManagementReturn {
  const [versions, setVersions] = useState<Version[]>([])
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const loadingRef = useRef(false)

  // Helper function to handle API errors
  const handleError = useCallback((error: unknown, fallbackMessage: string) => {
    const errorMessage = error instanceof Error ? error.message : fallbackMessage
    setError(errorMessage)
    if (onError) {
      onError(errorMessage)
    }
    console.error(fallbackMessage, error)
  }, [onError])

  // Helper function to make API requests
  const apiRequest = useCallback(async <T>(
    url: string, 
    options?: RequestInit
  ): Promise<T> => {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }, [])

  // Load versions with pagination
  const loadVersions = useCallback(async (options: { 
    page?: number
    limit?: number 
    reset?: boolean 
  } = {}) => {
    const { page = 1, limit = 20, reset = false } = options
    
    // Prevent multiple concurrent requests
    if (loadingRef.current) return
    
    loadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        includeContent: 'false',
      })

      const result = await apiRequest<ListVersionsResponse>(
        `/api/documents/${documentId}/versions?${params}`
      )

      const newVersions = result.data.versions
      
      if (reset || page === 1) {
        setVersions(newVersions)
      } else {
        setVersions(prev => [...prev, ...newVersions])
      }

      // Update pagination state
      setCurrentPage(page)
      setHasMore(newVersions.length === limit)
      
      // Set current version if available
      if (result.data.currentVersion && newVersions.length > 0) {
        const current = newVersions.find(v => v.versionNumber === result.data.currentVersion)
        if (current) {
          setCurrentVersion(current)
        }
      }

    } catch (err) {
      handleError(err, 'Failed to load version history')
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [documentId, apiRequest, handleError])

  // Get specific version with full content
  const getVersion = useCallback(async (versionId: string): Promise<Version | null> => {
    setError(null)
    
    try {
      const result = await apiRequest<GetVersionResponse>(
        `/api/documents/${documentId}/versions/${versionId}`
      )
      
      return result.data
    } catch (err) {
      handleError(err, 'Failed to get version details')
      return null
    }
  }, [documentId, apiRequest, handleError])

  // Create version snapshot
  const createSnapshot = useCallback(async (description?: string): Promise<Version | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiRequest<CreateVersionSnapshotResponse>(
        `/api/documents/${documentId}/versions/snapshot`,
        {
          method: 'POST',
          body: JSON.stringify({
            description: description || `Snapshot created on ${new Date().toLocaleString()}`,
            forceSnapshot: true,
          }),
        }
      )

      const newVersion = result.data
      
      // Update versions list
      setVersions(prev => [newVersion, ...prev])
      setCurrentVersion(newVersion)
      
      return newVersion
    } catch (err) {
      handleError(err, 'Failed to create version snapshot')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [documentId, apiRequest, handleError])

  // Restore version
  const restoreVersion = useCallback(async (
    versionId: string, 
    description?: string
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await apiRequest<RestoreVersionResponse>(
        `/api/documents/${documentId}/versions/${versionId}/restore`,
        {
          method: 'POST',
          body: JSON.stringify({
            description: description || `Restored from version`,
          }),
        }
      )

      const { restoredVersion, newVersion } = result.data
      
      // Update versions list with the new version
      setVersions(prev => [newVersion, ...prev])
      setCurrentVersion(newVersion)
      
      if (onVersionRestored) {
        onVersionRestored(restoredVersion)
      }
      
      return true
    } catch (err) {
      handleError(err, 'Failed to restore version')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [documentId, apiRequest, handleError, onVersionRestored])

  // Delete version
  const deleteVersion = useCallback(async (versionId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      await apiRequest<DeleteVersionResponse>(
        `/api/documents/${documentId}/versions/${versionId}`,
        {
          method: 'DELETE',
        }
      )

      // Remove version from list
      setVersions(prev => prev.filter(v => v.id !== versionId))
      
      // Update current version if it was deleted
      if (currentVersion?.id === versionId) {
        setCurrentVersion(versions[0] || null)
      }
      
      if (onVersionDeleted) {
        onVersionDeleted(versionId)
      }
      
      return true
    } catch (err) {
      handleError(err, 'Failed to delete version')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [documentId, apiRequest, handleError, onVersionDeleted, currentVersion, versions])

  // Compare versions
  const compareVersions = useCallback(async (
    fromVersionId: string, 
    toVersionId: string
  ): Promise<DiffResult | null> => {
    setError(null)
    
    try {
      const result = await apiRequest<DiffVersionsResponse>(
        `/api/documents/${documentId}/versions/${fromVersionId}/diff?toId=${toVersionId}&format=json&type=text`
      )
      
      return result.data
    } catch (err) {
      handleError(err, 'Failed to compare versions')
      return null
    }
  }, [documentId, apiRequest, handleError])

  // Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Refresh - reload current page
  const refresh = useCallback(async () => {
    await loadVersions({ page: 1, reset: true })
  }, [loadVersions])

  return {
    // State
    versions,
    currentVersion,
    isLoading,
    error,
    hasMore,
    
    // Version operations
    loadVersions,
    getVersion,
    createSnapshot,
    restoreVersion,
    deleteVersion,
    
    // Diff operations
    compareVersions,
    
    // State management
    clearError,
    refresh,
  }
}

export default useVersionManagement