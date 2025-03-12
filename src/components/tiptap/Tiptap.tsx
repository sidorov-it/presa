// src/Tiptap.tsx
import { EditorProvider, FloatingMenu, BubbleMenu, EditorContent } from '@tiptap/react'
import { useEditor, Editor } from '@tiptap/react'
import { useCallback, useEffect } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import ListItem from '@tiptap/extension-list-item'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'

// Создаем расширение для обработки нажатия Enter и Backspace
const EnterHandlerExtension = (onEnterPressed: () => void, onBackspacePressed: () => void) => {
  return Extension.create({
    name: 'enterHandler',
    addKeyboardShortcuts() {
      return {
        'Enter': ({ editor }) => {
          // Если курсор в конце документа и текущий узел пустой
          const { state } = editor
          const { selection } = state
          const { empty, $head } = selection
          
          // Проверяем, находится ли курсор в конце документа
          const isAtEnd = $head.pos === state.doc.content.size
          
          if (empty && isAtEnd) {
            onEnterPressed()
            return true
          }
          
          return false
        },
        'Backspace': ({ editor }) => {
          // Если курсор в начале документа и документ пустой
          const { state } = editor
          const { selection } = state
          const { empty, $head } = selection
          
          // Проверяем, находится ли курсор в начале документа
          const isAtStart = $head.pos === 1
          
          // Проверяем, пустой ли документ
          const isEmpty = state.doc.textContent.trim() === ''
          
          if (empty && isAtStart && isEmpty) {
            onBackspacePressed()
            return true
          }
          
          return false
        }
      }
    },
  })
}

// Определяем типы пропсов
interface TiptapProps {
  initialContent?: string;
  onEnterPressed?: () => void;
  onBackspacePressed?: () => void;
  onFocus?: () => void;
  onContentChange?: (content: string) => void;
  autoFocus?: boolean;
  id?: string;
  placeholder?: string;
}

// Определяем массив расширений
const getExtensions = (onEnterPressed: () => void, onBackspacePressed: () => void, placeholder: string) => [
  StarterKit, 
  Document, 
  Paragraph, 
  Text, 
  Heading, 
  Bold, 
  Italic, 
  ListItem,
  EnterHandlerExtension(onEnterPressed, onBackspacePressed),
  Placeholder.configure({
    placeholder,
    emptyEditorClass: 'is-editor-empty',
  }),
]

const Tiptap: React.FC<TiptapProps> = ({ 
  initialContent = '', 
  onEnterPressed = () => {}, 
  onBackspacePressed = () => {},
  onFocus = () => {},
  onContentChange = () => {},
  autoFocus = false,
  id = '',
  placeholder = 'Введите текст...'
}) => {
  const editor = useEditor({
    extensions: getExtensions(onEnterPressed, onBackspacePressed, placeholder),
    content: initialContent,
    autofocus: autoFocus,
    onFocus: () => onFocus(),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange(html);
    },
  })
  
  // Метод для программного фокуса на редакторе
  const focus = useCallback(() => {
    if (editor) {
      editor.commands.focus('end')
    }
  }, [editor])
  
  // Устанавливаем фокус при монтировании, если autoFocus = true
  useEffect(() => {
    if (autoFocus && editor) {
      setTimeout(() => {
        focus()
      }, 0)
    }
  }, [autoFocus, editor, focus])
  
  return (
    <div className="relative w-full" data-editor-id={id}>
      {editor && (
        <>
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bg-white shadow-lg rounded-md p-2 flex gap-2">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
              >
                Список
              </button>
            </div>
          </FloatingMenu>

          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bg-white shadow-lg rounded-md p-2 flex gap-2">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
              >
                Жирный
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
              >
                Курсив
              </button>
            </div>
          </BubbleMenu>
        </>
      )}

      <div className="tiptap-editor-wrapper w-full min-h-[40px]">
        {editor && (
          <EditorContent 
            editor={editor} 
            className="cursor-text w-full focus:outline-none"
          />
        )}
      </div>

      <style jsx global>{`
        .ProseMirror {
          padding: 0.5rem;
          min-height: 40px;
          outline: none;
          cursor: text;
          width: 100%;
        }
        
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        .ProseMirror:focus {
          outline: none;
        }
      `}</style>
    </div>
  )
}

export default Tiptap
