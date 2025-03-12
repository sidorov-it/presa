// src/Tiptap.tsx
import { EditorProvider, FloatingMenu, BubbleMenu, EditorContent, } from '@tiptap/react'
import { useEditor } from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import ListItem from '@tiptap/extension-list-item'


// define your extension array
const extensions = [StarterKit, Document, Paragraph, Text, Heading, Bold, Italic, ListItem]

const content = ''

const Tiptap = () => {
  const editor = useEditor({
    extensions,
    content,
  })
  
  return (
    <div className="relative p-4">
      {editor && (
        <>
          <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bg-white shadow-lg rounded-md p-2 flex gap-2">
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className="p-1 hover:bg-gray-100 rounded"
              >
                H1
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className="p-1 hover:bg-gray-100 rounded"
              >
                H2
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className="p-1 hover:bg-gray-100 rounded"
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

      {editor && <EditorContent editor={editor} />}
    </div>
  )
}

export default Tiptap
