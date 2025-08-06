import React, { useState, useEffect } from 'react'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Code, Quote, Undo, Redo, Bot, Save } from 'lucide-react'

// Types for TipTap editor (enhanced for better integration)
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
  editor: Editor | null
  onAskAgent: () => void
  onSaveVersion: () => void
  canUndo?: boolean
  canRedo?: boolean
  isSaving?: boolean
  isAskAgentLoading?: boolean
}

const DocumentEditorToolbar: React.FC<DocumentEditorToolbarProps> = ({
  editor,
  onAskAgent,
  onSaveVersion,
  canUndo = false,
  canRedo = false,
  isSaving = false,
  isAskAgentLoading = false,
}) => {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({})

  // Update active states when editor changes
  useEffect(() => {
    if (!editor) return

    const updateActiveStates = () => {
      setActiveStates({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        strike: editor.isActive('strike'),
        heading1: editor.isActive('heading', { level: 1 }),
        heading2: editor.isActive('heading', { level: 2 }),
        heading3: editor.isActive('heading', { level: 3 }),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        codeBlock: editor.isActive('codeBlock'),
        blockquote: editor.isActive('blockquote'),
      })
    }

    // Update active states initially and when editor changes
    updateActiveStates()

    // Set up interval to check active states (TipTap doesn't always emit events)
    const interval = setInterval(updateActiveStates, 100)

    return () => clearInterval(interval)
  }, [editor])

  // Helper function to create toolbar buttons
  const ToolbarButton = ({ 
    testId, 
    onClick, 
    isActive, 
    icon: Icon, 
    label, 
    shortcut, 
    disabled = false,
    size = 16 
  }: {
    testId: string
    onClick: () => void
    isActive?: boolean
    icon: React.ComponentType<{ size: number }>
    label: string
    shortcut?: string
    disabled?: boolean
    size?: number
  }) => (
    <button
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded transition-all duration-200 relative group
        ${isActive 
          ? 'bg-purple-100 text-purple-700 shadow-sm active' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed hover:bg-transparent' 
          : 'hover:shadow-sm'
        }
        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1
      `}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      aria-pressed={isActive}
    >
      <Icon size={size} />
      
      {/* Tooltip with keyboard shortcut */}
      {shortcut && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
          px-2 py-1 bg-gray-900 text-white text-xs rounded 
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          pointer-events-none whitespace-nowrap z-10
        ">
          {label}
          <div className="text-gray-300 text-[10px] mt-0.5">{shortcut}</div>
        </div>
      )}
    </button>
  )

  // Helper function for heading buttons
  const HeadingButton = ({ level, testId }: { level: 1 | 2 | 3, testId: string }) => (
    <button
      data-testid={testId}
      onClick={() => editor?.commands.toggleHeading({ level })}
      disabled={!editor}
      className={`
        px-2 py-1 rounded text-sm font-semibold transition-all duration-200 relative group
        ${activeStates[`heading${level}`] 
          ? 'bg-purple-100 text-purple-700 shadow-sm active' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
        ${!editor 
          ? 'opacity-50 cursor-not-allowed hover:bg-transparent' 
          : 'hover:shadow-sm'
        }
        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1
      `}
      title={`Heading ${level}`}
      aria-label={`Heading ${level}`}
      aria-pressed={activeStates[`heading${level}`]}
    >
      H{level}
    </button>
  )

  if (!editor) {
    return (
      <div 
        data-testid="editor-toolbar"
        className="border-b border-gray-200 p-3 bg-white"
      >
        <div className="flex items-center justify-center py-2 text-gray-500">
          <div className="animate-pulse">Loading editor toolbar...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      data-testid="editor-toolbar"
      className="border-b border-gray-200 p-3 bg-white sticky top-0 z-20"
      role="toolbar"
      aria-label="Document formatting toolbar"
    >
      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
        {/* Text Formatting Group */}
        <div 
          data-testid="toolbar-group"
          className="flex items-center gap-1"
          role="group"
          aria-label="Text formatting"
        >
          <ToolbarButton
            testId="toolbar-bold"
            onClick={() => editor.commands.toggleBold()}
            isActive={activeStates.bold}
            icon={Bold}
            label="Bold"
            shortcut="Ctrl+B"
          />
          
          <ToolbarButton
            testId="toolbar-italic"
            onClick={() => editor.commands.toggleItalic()}
            isActive={activeStates.italic}
            icon={Italic}
            label="Italic"
            shortcut="Ctrl+I"
          />
          
          <ToolbarButton
            testId="toolbar-underline"
            onClick={() => editor.commands.toggleUnderline()}
            isActive={activeStates.underline}
            icon={Underline}
            label="Underline"
            shortcut="Ctrl+U"
          />
          
          <ToolbarButton
            testId="toolbar-strike"
            onClick={() => editor.commands.toggleStrike()}
            isActive={activeStates.strike}
            icon={Strikethrough}
            label="Strikethrough"
          />
        </div>

        {/* Separator */}
        <div className="border-l border-gray-300 h-6 mx-2 hidden sm:block" />

        {/* Heading Group */}
        <div 
          data-testid="toolbar-group"
          className="flex items-center gap-1"
          role="group"
          aria-label="Headings"
        >
          <HeadingButton level={1} testId="toolbar-h1" />
          <HeadingButton level={2} testId="toolbar-h2" />
          <HeadingButton level={3} testId="toolbar-h3" />
        </div>

        {/* Separator */}
        <div className="border-l border-gray-300 h-6 mx-2 hidden sm:block" />

        {/* List Group */}
        <div 
          data-testid="toolbar-group"
          className="flex items-center gap-1"
          role="group"
          aria-label="Lists"
        >
          <ToolbarButton
            testId="toolbar-bullet-list"
            onClick={() => editor.commands.toggleBulletList()}
            isActive={activeStates.bulletList}
            icon={List}
            label="Bullet List"
          />
          
          <ToolbarButton
            testId="toolbar-ordered-list"
            onClick={() => editor.commands.toggleOrderedList()}
            isActive={activeStates.orderedList}
            icon={ListOrdered}
            label="Numbered List"
          />
        </div>

        {/* Separator */}
        <div className="border-l border-gray-300 h-6 mx-2 hidden md:block" />

        {/* Block Elements Group */}
        <div 
          data-testid="toolbar-group"
          className="flex items-center gap-1"
          role="group"
          aria-label="Block elements"
        >
          <ToolbarButton
            testId="toolbar-code-block"
            onClick={() => editor.commands.toggleCodeBlock()}
            isActive={activeStates.codeBlock}
            icon={Code}
            label="Code Block"
          />
          
          <ToolbarButton
            testId="toolbar-blockquote"
            onClick={() => editor.commands.toggleBlockquote()}
            isActive={activeStates.blockquote}
            icon={Quote}
            label="Quote"
          />
        </div>

        {/* Separator */}
        <div className="border-l border-gray-300 h-6 mx-2 hidden lg:block" />

        {/* History Group */}
        <div 
          data-testid="toolbar-group"
          className="flex items-center gap-1"
          role="group"
          aria-label="History"
        >
          <ToolbarButton
            testId="toolbar-undo"
            onClick={() => editor.commands.undo()}
            disabled={!canUndo}
            icon={Undo}
            label="Undo"
            shortcut="Ctrl+Z"
          />
          
          <ToolbarButton
            testId="toolbar-redo"
            onClick={() => editor.commands.redo()}
            disabled={!canRedo}
            icon={Redo}
            label="Redo"
            shortcut="Ctrl+Y"
          />
        </div>

        {/* Flexible spacer */}
        <div className="flex-1 min-w-4" />

        {/* Action Buttons Group */}
        <div 
          data-testid="toolbar-group"
          className="flex items-center gap-2"
          role="group"
          aria-label="Actions"
        >
          <button 
            data-testid="toolbar-ask-agent" 
            onClick={onAskAgent}
            disabled={isAskAgentLoading}
            className="
              px-3 py-2 bg-purple-600 text-white rounded text-sm font-medium
              hover:bg-purple-700 focus:bg-purple-700 
              transition-all duration-200 flex items-center gap-2
              focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600
              shadow-sm hover:shadow
            "
            title="Ask Agent for help with your document (Ctrl+Shift+A)"
            aria-label="Ask Agent for help with your document"
          >
            {isAskAgentLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Processing...</span>
              </>
            ) : (
              <>
                <Bot size={16} />
                <span className="hidden sm:inline">Ask Agent</span>
              </>
            )}
          </button>
          
          <button 
            data-testid="toolbar-save-version" 
            onClick={onSaveVersion}
            disabled={isSaving}
            className="
              px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium
              hover:bg-blue-700 focus:bg-blue-700 
              transition-all duration-200 flex items-center gap-2
              focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
              shadow-sm hover:shadow
            "
            title="Save current version of the document (Ctrl+S)"
            aria-label="Save current version of the document"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span className="hidden sm:inline">Save Version</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile overflow menu could be added here in the future */}
      <div className="sm:hidden mt-2 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Swipe toolbar horizontally to see more options
        </div>
      </div>
    </div>
  )
}

export default DocumentEditorToolbar