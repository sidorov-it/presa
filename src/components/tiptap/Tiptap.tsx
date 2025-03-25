/* eslint-disable react/no-unknown-property */
'use client';

import { EditorContent } from '@tiptap/react'
import { useEditor } from '@tiptap/react'
import { useCallback, useEffect, RefObject, forwardRef, useImperativeHandle } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Extension } from '@tiptap/core'
import { useEditorStore } from '@/store/editorStore'
import { PluginKey, Plugin } from '@tiptap/pm/state'
import styles from './Tiptap.module.css'

export const pluginKey = new PluginKey('prevent-drop-from-outside');

export const preventDropFromOutsidePlugin = new Plugin({
    key: pluginKey,
    state: {
        init: () => false,
        apply: (tr, prev) => {
            const action = tr.getMeta(pluginKey);
            if (!action) {
                return prev;
            }

            switch (action) {
                case 'drag':
                    return true;
                case 'drop':
                default:
                    return false;
            }
        },
    },
    props: {
        handleDOMEvents: {
            dragstart(view) {
                const dragFromInsideActive = pluginKey.getState(view.state);
                if (!dragFromInsideActive) {
                    view.dispatch(view.state.tr.setMeta(pluginKey, 'drag'));
                }
            },
            drop(view, event) {
                const dragFromInsideActive = pluginKey.getState(view.state);
                if (dragFromInsideActive) {
                    view.dispatch(view.state.tr.setMeta(pluginKey, 'drop'));
                    return false;
                }
                event.preventDefault();
                return true;
            },
        },
    },
});

// Create a custom extension to add the preventDropFromOutsidePlugin
const PreventDropExtension = Extension.create({
    name: 'preventDrop',
    addProseMirrorPlugins() {
        return [preventDropFromOutsidePlugin];
    },
});

// Создаем расширение для обработки нажатия Enter и Backspace
const EnterHandlerExtension = (onEnterPressed: () => void, onBackspacePressed: () => void) => {
    return Extension.create({
        name: 'enterHandler',
        addKeyboardShortcuts() {
            return {
                'Enter': ({ editor }) => {
                    // Если курсор в конце документа и текущий узел пустой или содержит только один параграф
                    const { state } = editor
                    const { selection } = state
                    const { empty, $head } = selection

                    // Проверяем, находится ли курсор в конце документа
                    const isAtEnd = $head.pos === state.doc.content.size

                    // Проверяем, есть ли в документе только один параграф
                    const isSingleParagraph = state.doc.childCount === 1 && state.doc.firstChild?.type.name === 'paragraph'

                    // Проверяем, находится ли курсор в конце единственного параграфа
                    const isAtEndOfParagraph = isSingleParagraph && state.doc.firstChild && $head.pos === state.doc.firstChild.nodeSize - 1

                    // Если курсор в конце документа или это единственный параграф и курсор в его конце
                    if (empty && (isAtEnd || isAtEndOfParagraph)) {
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

                    // Если курсор в начале документа и документ пустой
                    if (empty && isAtStart && isEmpty) {
                        onBackspacePressed()
                        return true
                    }

                    return false
                },
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
    onBlur?: () => void;
    onContentChange?: (content: string) => void;
    autoFocus?: boolean;
    id?: string;
    placeholder?: string;
    customBubbleMenuTrigger?: RefObject<HTMLElement>;
}

// Define the ref type
export interface TiptapRef {
    focus: () => void;
    getText: () => string;
    isEmpty: () => boolean;
}

// Определяем массив расширений
const getExtensions = (onEnterPressed: () => void, onBackspacePressed: () => void, placeholder: string) => [
    // Configure StarterKit to disable dropcursor
    StarterKit.configure({
        dropcursor: false, // Disable the dropcursor extension
    }),
    // Document, 
    // Paragraph, 
    // Text, 
    // Heading, 
    // Bold, 
    // Italic, 
    // ListItem,
    PreventDropExtension,
    EnterHandlerExtension(onEnterPressed, onBackspacePressed),
    Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
    }),
]

const Tiptap = forwardRef<TiptapRef, TiptapProps>(({
    initialContent = '',
    onEnterPressed = () => { },
    onBackspacePressed = () => { },
    onFocus = () => { },
    onContentChange = () => { },
    onBlur = () => { },
    autoFocus = false,
    id = '',
    placeholder = '',
    customBubbleMenuTrigger
}, ref) => {
    // Use the global editor store instead of local state
    const { setActiveEditor, showMenu } = useEditorStore();

    const editor = useEditor({
        extensions: getExtensions(onEnterPressed, onBackspacePressed, placeholder),
        content: initialContent,
        autofocus: autoFocus,
        immediatelyRender: false,

        onBlur: () => {
            onBlur?.();
        },
        onFocus: () => {
            onFocus();
            // Set this editor as the active editor in the store
            // setActiveEditor(editor);
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onContentChange(html);
        },
        editorProps: {
            attributes: {
                class: `${styles.editor} custom-tiptap-editor no-dropcursor`,
            },
        },
    })

    useEffect(() => {
        if (editor) {
            editor.commands.setContent(initialContent);
        }
    }, [editor, initialContent])

    // Метод для программного фокуса на редакторе
    const focus = useCallback(() => {
        if (editor) {
            // Focus immediately without any delay
            editor.commands.focus('end');
        }
    }, [editor])

    // Expose the focus method via ref
    useImperativeHandle(ref, () => ({
        focus,
        getText: () => editor?.getText() ?? '',
        isEmpty: () => editor?.isEmpty ?? false
    }), [focus]);

    // Устанавливаем фокус при монтировании, если autoFocus = true
    useEffect(() => {
        if (autoFocus && editor) {
            // Focus immediately
            focus();
        }
    }, [autoFocus, editor, focus])

    // Add event listener for custom trigger
    useEffect(() => {
        if (customBubbleMenuTrigger?.current && editor) {
            const handleTriggerClick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                // Use the global store to show the menu
                setActiveEditor(editor);
                showMenu(customBubbleMenuTrigger.current as HTMLElement);

                // Focus the editor to ensure commands work
                editor.commands.focus();
                setTimeout(() => {
                    editor.commands.selectAll();
                }, 10);
            };

            const triggerElement = customBubbleMenuTrigger.current;
            triggerElement.addEventListener('click', handleTriggerClick);

            return () => {
                triggerElement.removeEventListener('click', handleTriggerClick);
            };
        }
    }, [customBubbleMenuTrigger, editor, setActiveEditor, showMenu]);

    // Update the active editor in the store when the editor changes
    useEffect(() => {
        if (editor) {
            return () => {
                // Clean up when component unmounts
                setActiveEditor(null);
            };
        }
    }, [editor, setActiveEditor]);

    return (
        <div className="relative w-full" data-editor-id={id}>
            {/* <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
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
      </FloatingMenu> */}

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
})

Tiptap.displayName = 'Tiptap';

export default Tiptap
