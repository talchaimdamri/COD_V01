import { z } from 'zod';
import { EventSchema } from './event';
/**
 * Document Event Schemas for Event Sourcing
 *
 * Defines event types for tracking document changes, version history,
 * and undo/redo functionality integrated with TipTap editor.
 */
/**
 * Position information for cursor/selection tracking
 */
export const DocumentPositionSchema = z.object({
    from: z.number().int().min(0).describe('Start position in document'),
    to: z.number().int().min(0).describe('End position in document'),
}).describe('Document position information');
/**
 * Content change event - tracks all document content modifications
 */
export const DocumentContentChangeEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_CONTENT_CHANGE'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        previousContent: z.string().describe('Content before change'),
        newContent: z.string().describe('Content after change'),
        changeType: z.enum(['insert', 'delete', 'replace', 'format']).describe('Type of content change'),
        position: DocumentPositionSchema.optional().describe('Position where change occurred'),
        changeSize: z.number().int().describe('Size of content change in characters'),
        contentLength: z.number().int().min(0).describe('Total content length after change'),
    }),
});
/**
 * Title change event
 */
export const DocumentTitleChangeEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_TITLE_CHANGE'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        previousTitle: z.string().describe('Previous document title'),
        newTitle: z.string().min(1).max(255).describe('New document title'),
    }),
});
/**
 * Version save event - creates a snapshot point
 */
export const DocumentVersionSaveEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_VERSION_SAVE'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        versionNumber: z.number().int().min(1).describe('Version number'),
        description: z.string().optional().describe('Optional version description'),
        contentSnapshot: z.string().describe('Full content at this version'),
        wordCount: z.number().int().min(0).describe('Word count at this version'),
        charCount: z.number().int().min(0).describe('Character count at this version'),
    }),
});
/**
 * Connection change event - tracks upstream/downstream connections
 */
export const DocumentConnectionChangeEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_CONNECTION_CHANGE'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        connectionId: z.string().min(1).describe('Connected document/agent ID'),
        connectionType: z.enum(['upstream', 'downstream']).describe('Type of connection'),
        action: z.enum(['add', 'remove']).describe('Connection action'),
        metadata: z.record(z.any()).optional().describe('Connection metadata'),
    }),
});
/**
 * Formatting change event - tracks rich text formatting
 */
export const DocumentFormattingChangeEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_FORMATTING_CHANGE'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        position: DocumentPositionSchema.describe('Position of formatting change'),
        formatType: z.enum([
            'bold', 'italic', 'underline', 'strike', 'code',
            'heading', 'paragraph', 'list', 'blockquote', 'codeblock'
        ]).describe('Type of formatting applied'),
        formatAction: z.enum(['apply', 'remove', 'toggle']).describe('Formatting action'),
        formatData: z.record(z.any()).optional().describe('Additional formatting data'),
    }),
});
/**
 * Selection change event - tracks cursor and selection changes
 */
export const DocumentSelectionChangeEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_SELECTION_CHANGE'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        previousSelection: DocumentPositionSchema.optional().describe('Previous selection'),
        newSelection: DocumentPositionSchema.describe('New selection'),
        selectionType: z.enum(['cursor', 'range', 'all']).describe('Type of selection'),
    }),
});
/**
 * Undo/Redo operation event
 */
export const DocumentUndoRedoEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_UNDO_REDO'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        operation: z.enum(['undo', 'redo']).describe('Undo or redo operation'),
        targetEventId: z.string().optional().describe('Target event being undone/redone'),
        contentBefore: z.string().describe('Content before undo/redo'),
        contentAfter: z.string().describe('Content after undo/redo'),
    }),
});
/**
 * Document session start/end events for tracking editing sessions
 */
export const DocumentSessionEventSchema = EventSchema.extend({
    type: z.literal('DOCUMENT_SESSION'),
    payload: z.object({
        documentId: z.string().min(1).describe('Document identifier'),
        sessionAction: z.enum(['start', 'end']).describe('Session action'),
        sessionId: z.string().optional().describe('Unique session identifier'),
        initialContent: z.string().optional().describe('Content at session start'),
        finalContent: z.string().optional().describe('Content at session end'),
        duration: z.number().int().optional().describe('Session duration in milliseconds'),
    }),
});
/**
 * Union of all document event types
 */
export const DocumentEventSchema = z.discriminatedUnion('type', [
    DocumentContentChangeEventSchema,
    DocumentTitleChangeEventSchema,
    DocumentVersionSaveEventSchema,
    DocumentConnectionChangeEventSchema,
    DocumentFormattingChangeEventSchema,
    DocumentSelectionChangeEventSchema,
    DocumentUndoRedoEventSchema,
    DocumentSessionEventSchema,
]);
/**
 * Document event factory for creating well-formed events
 */
export class DocumentEventFactory {
    /**
     * Create a content change event
     */
    static createContentChangeEvent(documentId, previousContent, newContent, changeType, options) {
        const changeSize = Math.abs(newContent.length - previousContent.length);
        return {
            type: 'DOCUMENT_CONTENT_CHANGE',
            payload: {
                documentId,
                previousContent,
                newContent,
                changeType,
                position: options?.position,
                changeSize,
                contentLength: newContent.length,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
    /**
     * Create a title change event
     */
    static createTitleChangeEvent(documentId, previousTitle, newTitle, options) {
        return {
            type: 'DOCUMENT_TITLE_CHANGE',
            payload: {
                documentId,
                previousTitle,
                newTitle,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
    /**
     * Create a version save event
     */
    static createVersionSaveEvent(documentId, versionNumber, contentSnapshot, options) {
        const wordCount = contentSnapshot.split(/\s+/).filter(word => word.length > 0).length;
        const charCount = contentSnapshot.length;
        return {
            type: 'DOCUMENT_VERSION_SAVE',
            payload: {
                documentId,
                versionNumber,
                description: options?.description,
                contentSnapshot,
                wordCount,
                charCount,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
    /**
     * Create a connection change event
     */
    static createConnectionChangeEvent(documentId, connectionId, connectionType, action, options) {
        return {
            type: 'DOCUMENT_CONNECTION_CHANGE',
            payload: {
                documentId,
                connectionId,
                connectionType,
                action,
                metadata: options?.metadata,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
    /**
     * Create a formatting change event
     */
    static createFormattingChangeEvent(documentId, position, formatType, formatAction, options) {
        return {
            type: 'DOCUMENT_FORMATTING_CHANGE',
            payload: {
                documentId,
                position,
                formatType,
                formatAction,
                formatData: options?.formatData,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
    /**
     * Create an undo/redo event
     */
    static createUndoRedoEvent(documentId, operation, contentBefore, contentAfter, options) {
        return {
            type: 'DOCUMENT_UNDO_REDO',
            payload: {
                documentId,
                operation,
                targetEventId: options?.targetEventId,
                contentBefore,
                contentAfter,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
    /**
     * Create a session event
     */
    static createSessionEvent(documentId, sessionAction, options) {
        return {
            type: 'DOCUMENT_SESSION',
            payload: {
                documentId,
                sessionAction,
                sessionId: options?.sessionId,
                initialContent: options?.initialContent,
                finalContent: options?.finalContent,
                duration: options?.duration,
            },
            timestamp: new Date(),
            userId: options?.userId,
        };
    }
}
/**
 * Document Event Utilities
 */
export class DocumentEventUtils {
    /**
     * Check if an event represents a content change
     */
    static isContentChangeEvent(event) {
        return event.type === 'DOCUMENT_CONTENT_CHANGE';
    }
    /**
     * Check if an event represents a structural change (title, connections)
     */
    static isStructuralChangeEvent(event) {
        return [
            'DOCUMENT_TITLE_CHANGE',
            'DOCUMENT_CONNECTION_CHANGE',
        ].includes(event.type);
    }
    /**
     * Check if an event represents a version milestone
     */
    static isVersionEvent(event) {
        return event.type === 'DOCUMENT_VERSION_SAVE';
    }
    /**
     * Calculate content statistics from events
     */
    static calculateContentStats(events) {
        let totalChanges = 0;
        let insertions = 0;
        let deletions = 0;
        let wordCount = 0;
        let charCount = 0;
        for (const event of events) {
            if (this.isContentChangeEvent(event)) {
                totalChanges++;
                const { newContent, changeType } = event.payload;
                if (changeType === 'insert')
                    insertions++;
                else if (changeType === 'delete')
                    deletions++;
                // Get final content length from last content change
                wordCount = newContent.split(/\s+/).filter(word => word.length > 0).length;
                charCount = newContent.length;
            }
        }
        return {
            totalChanges,
            insertions,
            deletions,
            wordCount,
            charCount,
        };
    }
    /**
     * Get version history from events
     */
    static getVersionHistory(events) {
        return events
            .filter(this.isVersionEvent)
            .map(event => ({
            version: event.payload.versionNumber,
            timestamp: event.timestamp,
            description: event.payload.description,
            wordCount: event.payload.wordCount,
            charCount: event.payload.charCount,
        }))
            .sort((a, b) => b.version - a.version);
    }
}
