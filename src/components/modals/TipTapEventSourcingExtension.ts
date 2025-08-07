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
}

interface EventSourcingStorage {
  documentId: string
  previousContent: string
  previousSelection: { from: number; to: number } | null
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
    }
  },

  addStorage() {
    return {
      documentId: this.options.documentId,
      previousContent: '',
      previousSelection: null,
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

      // Determine change type based on content length
      let changeType: 'insert' | 'delete' | 'replace' = 'replace'
      if (newContent.length > previousContent.length) {
        changeType = 'insert'
      } else if (newContent.length < previousContent.length) {
        changeType = 'delete'
      }

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
        if (changeBuffer) {
          createContentChangeEvent(
            previousContent,
            changeBuffer.content!,
            changeBuffer.changeType!,
            changeBuffer.from && changeBuffer.to
              ? { from: changeBuffer.from, to: changeBuffer.to }
              : undefined
          )
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
            return {}
          },

          apply: (tr, value, oldState, newState) => {
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