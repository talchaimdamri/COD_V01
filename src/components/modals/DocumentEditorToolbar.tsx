import React from 'react'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Code, Quote, Undo, Redo } from 'lucide-react'

// Types for TipTap editor (simplified for testing)
export interface Editor {
  commands: {
    toggleBold: () => void
    toggleItalic: () => void
    toggleUnderline: () => void
    toggleStrike: () => void
    toggleHeading: (options: { level: number }) => void
    toggleBulletList: () => void
    toggleOrderedList: () => void
    toggleCodeBlock: () => void
    toggleBlockquote: () => void
    undo: () => void
    redo: () => void
  }
  isActive: (format: string, options?: any) => boolean
  can: () => {
    undo: () => boolean
    redo: () => boolean
  }
}

export interface DocumentEditorToolbarProps {
  editor: Editor
  onAskAgent: () => void
  onSaveVersion: () => void
  canUndo?: boolean
  canRedo?: boolean
}

const DocumentEditorToolbar: React.FC<DocumentEditorToolbarProps> = ({
  editor,
  onAskAgent,
  onSaveVersion,
  canUndo = false,
  canRedo = false,
}) => {
  if (!editor) {
    return null
  }

  return (
    <div 
      data-testid="editor-toolbar"
      className="border-b border-gray-200 p-3 bg-white"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {/* Formatting buttons */}
        <div data-testid="toolbar-group" className="flex items-center gap-1">
          <button
            data-testid="toolbar-bold"
            onClick={() => editor.commands.toggleBold()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('bold') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          
          <button
            data-testid="toolbar-italic"
            onClick={() => editor.commands.toggleItalic()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('italic') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          
          <button
            data-testid="toolbar-underline"
            onClick={() => editor.commands.toggleUnderline()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('underline') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline size={16} />
          </button>
          
          <button
            data-testid="toolbar-strike"
            onClick={() => editor.commands.toggleStrike()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('strike') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        <div className="border-l border-gray-300 h-6 mx-2" />

        {/* Heading buttons */}
        <div data-testid="toolbar-group" className="flex items-center gap-1">
          <button
            data-testid="toolbar-h1"
            onClick={() => editor.commands.toggleHeading({ level: 1 })}
            className={`px-2 py-1 hover:bg-gray-100 rounded text-sm font-semibold transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Heading 1"
          >
            H1
          </button>
          
          <button
            data-testid="toolbar-h2"
            onClick={() => editor.commands.toggleHeading({ level: 2 })}
            className={`px-2 py-1 hover:bg-gray-100 rounded text-sm font-semibold transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Heading 2"
          >
            H2
          </button>
          
          <button
            data-testid="toolbar-h3"
            onClick={() => editor.commands.toggleHeading({ level: 3 })}
            className={`px-2 py-1 hover:bg-gray-100 rounded text-sm font-semibold transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Heading 3"
          >
            H3
          </button>
        </div>

        <div className="border-l border-gray-300 h-6 mx-2" />

        {/* List buttons */}
        <div data-testid="toolbar-group" className="flex items-center gap-1">
          <button
            data-testid="toolbar-bullet-list"
            onClick={() => editor.commands.toggleBulletList()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('bulletList') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          
          <button
            data-testid="toolbar-ordered-list"
            onClick={() => editor.commands.toggleOrderedList()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('orderedList') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
        </div>

        <div className="border-l border-gray-300 h-6 mx-2" />

        {/* Block buttons */}
        <div data-testid="toolbar-group" className="flex items-center gap-1">
          <button
            data-testid="toolbar-code-block"
            onClick={() => editor.commands.toggleCodeBlock()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('codeBlock') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Code Block"
          >
            <Code size={16} />
          </button>
          
          <button
            data-testid="toolbar-blockquote"
            onClick={() => editor.commands.toggleBlockquote()}
            className={`p-2 hover:bg-gray-100 rounded transition-colors ${
              editor.isActive('blockquote') ? 'bg-purple-100 text-purple-700 active' : ''
            }`}
            title="Quote"
          >
            <Quote size={16} />
          </button>
        </div>

        <div className="border-l border-gray-300 h-6 mx-2" />

        {/* History buttons */}
        <div data-testid="toolbar-group" className="flex items-center gap-1">
          <button
            data-testid="toolbar-undo"
            onClick={() => editor.commands.undo()}
            disabled={!canUndo}
            className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          
          <button
            data-testid="toolbar-redo"
            onClick={() => editor.commands.redo()}
            disabled={!canRedo}
            className="p-2 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div data-testid="toolbar-group" className="flex items-center gap-2">
          <button 
            data-testid="toolbar-ask-agent" 
            onClick={onAskAgent}
            className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
            title="Ask Agent (Ctrl+Shift+A)"
          >
            <span>🤖</span>
            Ask Agent
          </button>
          
          <button 
            data-testid="toolbar-save-version" 
            onClick={onSaveVersion}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            title="Save Version (Ctrl+S)"
          >
            <span>💾</span>
            Save Version
          </button>
        </div>
      </div>
    </div>
  )
}

export default DocumentEditorToolbar