import { prisma } from '../db/client'
import { z } from 'zod'
import crypto from 'crypto'
import { DocumentEvent, DocumentEventFactory, DocumentEventUtils } from '../../schemas/events/document'
import { Event as PrismaEvent, DocumentVersion as PrismaDocumentVersion } from '@prisma/client'

/**
 * Enhanced Event Sourcing Service for Document Version History
 * Provides backend infrastructure for version management, snapshots, and event replay
 */

export interface DocumentState {
  id: string
  title: string
  content: string
  version: number
  wordCount: number
  charCount: number
  createdAt: Date
  updatedAt: Date
}

export interface VersionSnapshot {
  id: string
  documentId: string
  versionNumber: number
  title: string
  content: string
  description?: string
  wordCount: number
  charCount: number
  contentHash: string
  isSnapshot: boolean
  createdBy?: string
  createdAt: Date
}

export interface CreateVersionSnapshotOptions {
  description?: string
  userId?: string
  forceSnapshot?: boolean
}

export interface EventReplayOptions {
  fromEventSeq?: number
  toEventSeq?: number
  includeMetadata?: boolean
}

/**
 * Enhanced Event Sourcing Service Class
 */
export class DocumentEventSourcingService {
  private readonly SNAPSHOT_INTERVAL = 50 // Create snapshot every 50 events
  private readonly MAX_EVENTS_WITHOUT_SNAPSHOT = 100
  
  /**
   * Create a document event with enhanced tracking
   */
  async createEvent(
    event: DocumentEvent,
    options: { correlationId?: string } = {}
  ): Promise<PrismaEvent> {
    const documentId = this.extractDocumentId(event)
    const versionId = this.generateVersionId()
    
    return await prisma.event.create({
      data: {
        eventType: event.type,
        payload: event.payload,
        timestamp: event.timestamp || new Date(),
        actorId: event.userId || 'anonymous',
        documentId,
        versionId,
        correlationId: options.correlationId,
      },
    })
  }

  /**
   * Get document events with enhanced filtering
   */
  async getDocumentEvents(
    documentId: string,
    options: {
      fromEventSeq?: number
      toEventSeq?: number
      eventTypes?: string[]
      limit?: number
      includePayload?: boolean
    } = {}
  ): Promise<PrismaEvent[]> {
    const where: any = { documentId }
    
    if (options.fromEventSeq || options.toEventSeq) {
      where.seq = {}
      if (options.fromEventSeq) where.seq.gte = options.fromEventSeq
      if (options.toEventSeq) where.seq.lte = options.toEventSeq
    }
    
    if (options.eventTypes?.length) {
      where.eventType = { in: options.eventTypes }
    }
    
    return await prisma.event.findMany({
      where,
      orderBy: { seq: 'asc' },
      take: options.limit || 1000,
      select: {
        seq: true,
        timestamp: true,
        actorId: true,
        eventType: true,
        payload: options.includePayload !== false,
        documentId: true,
        versionId: true,
        correlationId: true,
        createdAt: true,
      },
    })
  }

  /**
   * Create a version snapshot
   */
  async createVersionSnapshot(
    documentId: string,
    state: DocumentState,
    options: CreateVersionSnapshotOptions = {}
  ): Promise<VersionSnapshot> {
    const contentHash = this.calculateContentHash(state.content)
    
    // Check if we already have a snapshot with this content hash
    const existingSnapshot = await prisma.documentVersion.findFirst({
      where: {
        documentId,
        contentHash,
      },
    })
    
    if (existingSnapshot && !options.forceSnapshot) {
      return this.mapPrismaVersionToSnapshot(existingSnapshot)
    }
    
    // Get the latest version number
    const latestVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    })
    
    const versionNumber = (latestVersion?.versionNumber || 0) + 1
    
    // Get event sequence range for this version
    const eventRange = await this.getEventSequenceRange(documentId)
    
    const snapshot = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber,
        title: state.title,
        content: state.content,
        contentHash,
        description: options.description || `Version ${versionNumber}`,
        wordCount: state.wordCount,
        charCount: state.charCount,
        isSnapshot: options.forceSnapshot || this.shouldCreateSnapshot(versionNumber),
        eventSeqStart: eventRange.start,
        eventSeqEnd: eventRange.end,
        createdBy: options.userId,
      },
    })
    
    return this.mapPrismaVersionToSnapshot(snapshot)
  }

  /**
   * Get version history for a document
   */
  async getVersionHistory(
    documentId: string,
    options: { limit?: number; includeContent?: boolean } = {}
  ): Promise<VersionSnapshot[]> {
    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      take: options.limit || 50,
      select: {
        id: true,
        documentId: true,
        versionNumber: true,
        title: true,
        content: options.includeContent !== false,
        contentHash: true,
        description: true,
        wordCount: true,
        charCount: true,
        isSnapshot: true,
        createdBy: true,
        createdAt: true,
      },
    })
    
    return versions.map(this.mapPrismaVersionToSnapshot)
  }

  /**
   * Get a specific version by ID or version number
   */
  async getVersion(
    documentId: string,
    versionIdentifier: string | number
  ): Promise<VersionSnapshot | null> {
    const where: any = { documentId }
    
    if (typeof versionIdentifier === 'string') {
      where.id = versionIdentifier
    } else {
      where.versionNumber = versionIdentifier
    }
    
    const version = await prisma.documentVersion.findFirst({ where })
    
    if (!version) return null
    
    return this.mapPrismaVersionToSnapshot(version)
  }

  /**
   * Restore document to a specific version
   */
  async restoreToVersion(
    documentId: string,
    versionId: string,
    userId?: string
  ): Promise<{ restoredState: DocumentState; newVersion: VersionSnapshot }> {
    const targetVersion = await prisma.documentVersion.findFirst({
      where: { id: versionId, documentId },
    })
    
    if (!targetVersion) {
      throw new Error(`Version ${versionId} not found for document ${documentId}`)
    }
    
    // Create restore event
    const restoreEvent = DocumentEventFactory.createUndoRedoEvent(
      documentId,
      'redo', // Restoration is technically a redo to a previous state
      '', // We don't have current content here
      targetVersion.content,
      {
        targetEventId: versionId,
        userId,
      }
    )
    
    await this.createEvent(restoreEvent)
    
    // Create new version snapshot for the restored state
    const restoredState: DocumentState = {
      id: documentId,
      title: targetVersion.title,
      content: targetVersion.content,
      version: targetVersion.versionNumber,
      wordCount: targetVersion.wordCount,
      charCount: targetVersion.charCount,
      createdAt: targetVersion.createdAt,
      updatedAt: new Date(),
    }
    
    const newVersion = await this.createVersionSnapshot(
      documentId,
      restoredState,
      {
        description: `Restored to version ${targetVersion.versionNumber}`,
        userId,
        forceSnapshot: true,
      }
    )
    
    return { restoredState, newVersion }
  }

  /**
   * Replay events to reconstruct document state
   */
  async replayEvents(
    documentId: string,
    options: EventReplayOptions = {}
  ): Promise<DocumentState> {
    const events = await this.getDocumentEvents(documentId, {
      fromEventSeq: options.fromEventSeq,
      toEventSeq: options.toEventSeq,
      includePayload: true,
    })
    
    // Start with a base state or find the closest snapshot
    let baseState = await this.findClosestSnapshot(
      documentId,
      options.fromEventSeq
    )
    
    if (!baseState) {
      baseState = {
        id: documentId,
        title: 'New Document',
        content: '',
        version: 1,
        wordCount: 0,
        charCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }
    
    // Apply events to reconstruct state
    return this.reduceEventsToState(events, baseState)
  }

  /**
   * Delete old versions based on retention policy
   */
  async cleanupVersions(
    documentId: string,
    retentionPolicy: {
      keepSnapshots: number // Keep N snapshots
      keepRecentVersions: number // Keep N recent versions regardless
      olderThanDays?: number // Delete versions older than N days
    }
  ): Promise<number> {
    // Keep snapshots
    const snapshotsToKeep = await prisma.documentVersion.findMany({
      where: { documentId, isSnapshot: true },
      orderBy: { createdAt: 'desc' },
      take: retentionPolicy.keepSnapshots,
      select: { id: true },
    })
    
    // Keep recent versions
    const recentVersionsToKeep = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      take: retentionPolicy.keepRecentVersions,
      select: { id: true },
    })
    
    const keepIds = new Set([
      ...snapshotsToKeep.map(v => v.id),
      ...recentVersionsToKeep.map(v => v.id),
    ])
    
    // Build deletion criteria
    const where: any = {
      documentId,
      id: { notIn: Array.from(keepIds) },
    }
    
    if (retentionPolicy.olderThanDays) {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionPolicy.olderThanDays)
      where.createdAt = { lt: cutoffDate }
    }
    
    const result = await prisma.documentVersion.deleteMany({ where })
    return result.count
  }

  /**
   * Get performance metrics for document
   */
  async getDocumentMetrics(documentId: string): Promise<{
    totalEvents: number
    totalVersions: number
    totalSnapshots: number
    eventsByType: Record<string, number>
    avgTimeBetweenVersions: number
    storageSize: number
  }> {
    const [
      eventCount,
      versionCount,
      snapshotCount,
      eventsByType,
      versions,
    ] = await Promise.all([
      prisma.event.count({ where: { documentId } }),
      prisma.documentVersion.count({ where: { documentId } }),
      prisma.documentVersion.count({ where: { documentId, isSnapshot: true } }),
      this.getEventTypeDistribution(documentId),
      prisma.documentVersion.findMany({
        where: { documentId },
        select: { createdAt: true, content: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    
    // Calculate average time between versions
    let avgTimeBetweenVersions = 0
    if (versions.length > 1) {
      const totalTime = versions[versions.length - 1].createdAt.getTime() - 
                       versions[0].createdAt.getTime()
      avgTimeBetweenVersions = totalTime / (versions.length - 1)
    }
    
    // Estimate storage size (rough calculation)
    const storageSize = versions.reduce(
      (total, version) => total + (version.content?.length || 0),
      0
    )
    
    return {
      totalEvents: eventCount,
      totalVersions: versionCount,
      totalSnapshots: snapshotCount,
      eventsByType,
      avgTimeBetweenVersions,
      storageSize,
    }
  }

  // Private helper methods

  private extractDocumentId(event: DocumentEvent): string | undefined {
    switch (event.type) {
      case 'DOCUMENT_CONTENT_CHANGE':
      case 'DOCUMENT_TITLE_CHANGE':
      case 'DOCUMENT_VERSION_SAVE':
      case 'DOCUMENT_CONNECTION_CHANGE':
      case 'DOCUMENT_FORMATTING_CHANGE':
      case 'DOCUMENT_SELECTION_CHANGE':
      case 'DOCUMENT_UNDO_REDO':
      case 'DOCUMENT_SESSION':
        return event.payload.documentId
      default:
        return undefined
    }
  }

  private generateVersionId(): string {
    return `ver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private calculateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  private shouldCreateSnapshot(versionNumber: number): boolean {
    return versionNumber % this.SNAPSHOT_INTERVAL === 0
  }

  private async getEventSequenceRange(documentId: string): Promise<{ start: number | null; end: number | null }> {
    const result = await prisma.event.aggregate({
      where: { documentId },
      _min: { seq: true },
      _max: { seq: true },
    })
    
    return {
      start: result._min.seq,
      end: result._max.seq,
    }
  }

  private mapPrismaVersionToSnapshot(version: PrismaDocumentVersion): VersionSnapshot {
    return {
      id: version.id,
      documentId: version.documentId,
      versionNumber: version.versionNumber,
      title: version.title,
      content: version.content,
      description: version.description || undefined,
      wordCount: version.wordCount,
      charCount: version.charCount,
      contentHash: version.contentHash,
      isSnapshot: version.isSnapshot,
      createdBy: version.createdBy || undefined,
      createdAt: version.createdAt,
    }
  }

  private async findClosestSnapshot(
    documentId: string,
    fromEventSeq?: number
  ): Promise<DocumentState | null> {
    if (!fromEventSeq) return null
    
    const snapshot = await prisma.documentVersion.findFirst({
      where: {
        documentId,
        isSnapshot: true,
        eventSeqStart: { lte: fromEventSeq },
      },
      orderBy: { eventSeqStart: 'desc' },
    })
    
    if (!snapshot) return null
    
    return {
      id: documentId,
      title: snapshot.title,
      content: snapshot.content,
      version: snapshot.versionNumber,
      wordCount: snapshot.wordCount,
      charCount: snapshot.charCount,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.createdAt,
    }
  }

  private reduceEventsToState(events: PrismaEvent[], initialState: DocumentState): DocumentState {
    let state = { ...initialState }
    
    for (const prismaEvent of events) {
      const event = this.convertPrismaEventToDocumentEvent(prismaEvent)
      if (!event) continue
      
      switch (event.type) {
        case 'DOCUMENT_CONTENT_CHANGE':
          state.content = event.payload.newContent
          state.charCount = event.payload.contentLength
          state.wordCount = event.payload.newContent.split(/\s+/).filter(word => word.length > 0).length
          state.updatedAt = event.timestamp
          break
          
        case 'DOCUMENT_TITLE_CHANGE':
          state.title = event.payload.newTitle
          state.updatedAt = event.timestamp
          break
          
        case 'DOCUMENT_VERSION_SAVE':
          state.version = Math.max(state.version, event.payload.versionNumber)
          state.updatedAt = event.timestamp
          break
      }
    }
    
    return state
  }

  private convertPrismaEventToDocumentEvent(prismaEvent: PrismaEvent): DocumentEvent | null {
    try {
      const event = {
        type: prismaEvent.eventType as any,
        payload: prismaEvent.payload,
        timestamp: prismaEvent.timestamp,
        userId: prismaEvent.actorId,
      }
      
      // Validate against schema
      return event as DocumentEvent
    } catch (error) {
      console.warn('Invalid event format:', error)
      return null
    }
  }

  private async getEventTypeDistribution(documentId: string): Promise<Record<string, number>> {
    const results = await prisma.event.groupBy({
      by: ['eventType'],
      where: { documentId },
      _count: { eventType: true },
    })
    
    const distribution: Record<string, number> = {}
    for (const result of results) {
      distribution[result.eventType] = result._count.eventType
    }
    
    return distribution
  }
}

/**
 * Singleton instance for use throughout the application
 */
export const documentEventSourcingService = new DocumentEventSourcingService()