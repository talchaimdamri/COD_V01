import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { DocumentEventFactory, DocumentEvent } from '../../../schemas/events/document'

/**
 * TipTap Extension for Event Sourcing Integration
 * 
 * Captures document changes and formatting operations as events
 * for comprehensive change tracking and undo/redo functionality.
 */

interface EventSourcingOptions {
  documentId: string
  onEvent: (event: DocumentEvent) => void
  debounceMs?: number
  trackSelections?: boolean
  trackFormatting?: boolean
  isVersionRestoring?: boolean
  enableAutoVersioning?: boolean
  autoVersioningThreshold?: number
}

interface EventSourcingStorage {
  documentId: string
  previousContent: string
  previousSelection: { from: number; to: number } | null
  changeCounter: number
  lastAutoVersionTime: number
  isVersionRestoring: boolean
}

export const TipTapEventSourcingExtension = Extension.create<EventSourcingOptions, EventSourcingStorage>({
  name: 'eventSourcing',

  addOptions() {
    return {
      documentId: '',
      onEvent: () => {},
      debounceMs: 500,
      trackSelections: false,
      trackFormatting: true,
      isVersionRestoring: false,
      enableAutoVersioning: false,
      autoVersioningThreshold: 100, // Changes before auto-version
    }
  },

  addStorage() {
    return {
      documentId: this.options.documentId,
      previousContent: '',
      previousSelection: null,
      changeCounter: 0,
      lastAutoVersionTime: Date.now(),
      isVersionRestoring: this.options.isVersionRestoring || false,
    }
  },

  addProseMirrorPlugins() {
    const self = this
    let debounceTimer: NodeJS.Timeout | null = null
    let changeBuffer: {
      content?: string
      from?: number
      to?: number
      changeType?: 'insert' | 'delete' | 'replace'
    } | null = null
    
    const createContentChangeEvent = (
      previousContent: string,
      newContent: string,
      changeType: 'insert' | 'delete' | 'replace',
      position?: { from: number; to: number }
    ) => {
      const event = DocumentEventFactory.createContentChangeEvent(
        self.options.documentId,
        previousContent,
        newContent,
        changeType,
        { position }
      )
      self.options.onEvent(event)
    }
    
    const handleContentChange = (_oldState: any, newState: any, tr: any) => {
      const previousContent = self.storage.previousContent
      const newContent = newState.doc.textContent

      // Skip if content hasn't actually changed
      if (previousContent === newContent) {
        return
      }

      // Skip if version is being restored to prevent event loops
      if (self.storage.isVersionRestoring) {
        self.storage.previousContent = newContent
        return
      }

      // Determine change type based on content length
      let changeType: 'insert' | 'delete' | 'replace' = 'replace'
      if (newContent.length > previousContent.length) {
        changeType = 'insert'
      } else if (newContent.length < previousContent.length) {
        changeType = 'delete'
      }

      // Increment change counter for auto-versioning
      self.storage.changeCounter++

      // Buffer the change for debouncing
      changeBuffer = {
        content: newContent,
        changeType,
        from: tr.selection?.from,
        to: tr.selection?.to,
      }

      // Debounce the event creation
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(() => {
        if (changeBuffer && !self.storage.isVersionRestoring) {
          createContentChangeEvent(
            previousContent,
            changeBuffer.content!,
            changeBuffer.changeType!,
            changeBuffer.from && changeBuffer.to
              ? { from: changeBuffer.from, to: changeBuffer.to }
              : undefined
          )
          
          // Check for auto-versioning
          if (self.options.enableAutoVersioning && 
              self.storage.changeCounter >= self.options.autoVersioningThreshold!) {
            const now = Date.now()
            const timeSinceLastVersion = now - self.storage.lastAutoVersionTime
            
            // Auto-version if enough changes and time has passed (5 minutes)
            if (timeSinceLastVersion > 5 * 60 * 1000) {
              const autoVersionEvent = DocumentEventFactory.createVersionSaveEvent(
                self.options.documentId,
                Math.floor(now / 1000), // Use timestamp as version number
                changeBuffer.content!,
                {
                  description: `Auto-version after ${self.storage.changeCounter} changes`,
                }
              )
              
              self.options.onEvent(autoVersionEvent)
              self.storage.changeCounter = 0
              self.storage.lastAutoVersionTime = now
            }
          }
          
          changeBuffer = null
        }
      }, self.options.debounceMs)

      // Update previous content
      self.storage.previousContent = newContent
    }
    
    return [
      new Plugin({
        key: new PluginKey('eventSourcing'),

        state: {
          init: (_, state) => {
            self.storage.previousContent = state.doc.textContent
            self.storage.isVersionRestoring = self.options.isVersionRestoring || false
            return {}
          },

          apply: (tr, value, oldState, newState) => {
            // Update version restoring state if changed
            if (self.options.isVersionRestoring !== self.storage.isVersionRestoring) {
              self.storage.isVersionRestoring = self.options.isVersionRestoring || false
            }
            
            // Track content changes
            if (tr.docChanged) {
              handleContentChange(oldState, newState, tr)
            }

            return value
          },
        },

        // Handle paste events
        props: {
          handlePaste: (view, _event, slice) => {
            const content = slice.content.textBetween(0, slice.content.size, ' ')
            if (content.trim()) {
              createContentChangeEvent(
                self.storage.previousContent,
                view.state.doc.textContent,
                'insert',
                { from: view.state.selection.from, to: view.state.selection.to }
              )
            }
            return false
          },

          // Handle drop events
          handleDrop: (view, _event, slice, moved) => {
            if (slice && slice.content.size > 0) {
              const content = slice.content.textBetween(0, slice.content.size, ' ')
              if (content.trim()) {
                createContentChangeEvent(
                  self.storage.previousContent,
                  view.state.doc.textContent,
                  moved ? 'replace' : 'insert',
                  { from: view.state.selection.from, to: view.state.selection.to }
                )
              }
            }
            return false
          },
        },

        destroy: () => {
          if (debounceTimer) {
            clearTimeout(debounceTimer)
          }
        },
      }),
    ]
  },

  onDestroy() {
    // Cleanup handled by plugin destroy method
  },
})

export default TipTapEventSourcingExtension