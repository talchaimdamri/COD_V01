import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import CodeBlock from '@tiptap/extension-code-block'
import Blockquote from '@tiptap/extension-blockquote'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'

export interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  onSave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  editable?: boolean
  placeholder?: string
  className?: string
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onSave,
  onFocus,
  onBlur,
  editable = true,
  placeholder = 'Start writing...',
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default extensions we want to configure individually
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        codeBlock: false,
        blockquote: false,
        // Keep other StarterKit extensions enabled
        history: {
          depth: 100,
          newGroupDelay: 500,
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'tiptap-heading',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'tiptap-bullet-list',
        },
        keepMarks: true,
        keepAttributes: false,
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'tiptap-ordered-list',
        },
        keepMarks: true,
        keepAttributes: false,
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'tiptap-list-item',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
        languageClassPrefix: 'language-',
        exitOnTripleEnter: true,
        exitOnArrowDown: true,
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'tiptap-blockquote',
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'tiptap-underline',
        },
      }),
      Strike.configure({
        HTMLAttributes: {
          class: 'tiptap-strike',
        },
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    onFocus: () => {
      onFocus?.()
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-full p-6',
        'data-testid': 'tiptap-editor-content',
        spellcheck: 'true',
      },
      handlePaste: (view, event) => {
        // Custom paste handling can be added here
        return false // Let TipTap handle paste normally
      },
      handleDrop: (view, event, slice, moved) => {
        // Custom drop handling can be added here
        return false // Let TipTap handle drop normally
      },
    },
  })

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default browser shortcuts and use our custom ones
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        onSave?.()
        return
      }
      
      // Additional shortcuts for productivity
      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        if (event.key === 'a' || event.key === 'A') {
          event.preventDefault()
          // This would trigger Ask Agent functionality if implemented
          return
        }
      }
    }

    if (editor) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, onSave])

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  if (!editor) {
    return (
      <div 
        data-testid="tiptap-editor-container"
        className={`flex items-center justify-center h-full ${className}`}
      >
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div 
      data-testid="tiptap-editor-container"
      className={`tiptap-editor-container h-full overflow-auto ${className}`}
    >
      <EditorContent 
        editor={editor} 
        className="h-full min-h-full"
      />
      
      {/* Custom styles for TipTap content */}
      <style dangerouslySetInnerHTML={{__html: `
        .ProseMirror {
          min-height: 200px;
          padding: 1.5rem;
          outline: none;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: "${placeholder}";
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.25;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.25;
        }
        
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        .ProseMirror ul {
          list-style-type: disc;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
        }
        
        .ProseMirror li {
          margin: 0.5rem 0;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .ProseMirror pre {
          background-color: #f3f4f6;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
          overflow-x: auto;
        }
        
        .ProseMirror pre code {
          background: transparent;
          padding: 0;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .ProseMirror code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
        }
        
        .ProseMirror strong {
          font-weight: 700;
        }
        
        .ProseMirror em {
          font-style: italic;
        }
        
        .ProseMirror u {
          text-decoration: underline;
        }
        
        .ProseMirror s {
          text-decoration: line-through;
        }
        
        .ProseMirror p {
          margin: 0.75rem 0;
          line-height: 1.6;
        }
      `}} />
    </div>
  )
}

export default TipTapEditor