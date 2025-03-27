/* eslint-disable react/no-unknown-property */
'use client';

import { EditorContent } from '@tiptap/react'
import { useEditor } from '@tiptap/react'
import { useCallback, useEffect, RefObject, forwardRef, useImperativeHandle } from 'react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import { Extension } from '@tiptap/core'
import { useEditorStore } from '@/store/editorStore'
import { PluginKey, Plugin } from '@tiptap/pm/state'
import styles from './Tiptap.module.css'
import { ButtonNode, ToggleNode } from './extensions'

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
    // Базовый набор расширений
    StarterKit.configure({
        dropcursor: false,
        heading: {
            levels: [1, 2, 3, 4, 5]
        },
        bulletList: {
            keepMarks: true,
            keepAttributes: false,
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false,
        },
    }),

    // Таблицы
    Table.configure({
        resizable: true,
        HTMLAttributes: {
            class: 'tiptap-table',
        },
    }),
    TableRow,
    TableHeader,
    TableCell,

    // Списки задач
    TaskList.configure({
        HTMLAttributes: {
            class: 'task-list',
        },
    }),
    TaskItem.configure({
        nested: true,
    }),

    // Кастомные блоки
    Extension.create({
        name: 'customBox',
        addGlobalAttributes() {
            return [
                {
                    types: ['paragraph'],
                    attributes: {
                        class: {
                            default: null,
                            parseHTML: element => {
                                const classes = ['box', 'note-box', 'info-box', 'warning-box', 
                                               'caution-box', 'success-box', 'question-box'];
                                const className = element.className;
                                return classes.find(c => className.includes(c)) || null;
                            },
                            renderHTML: attributes => {
                                if (!attributes.class) return {};
                                return { class: attributes.class };
                            },
                        },
                    },
                },
            ];
        },
    }),

    // Интерактивные элементы
    Extension.create({
        name: 'interactiveElements',
        addGlobalAttributes() {
            return [
                {
                    types: ['paragraph'],
                    attributes: {
                        'data-type': {
                            default: null,
                            parseHTML: element => element.getAttribute('data-type'),
                            renderHTML: attributes => {
                                if (!attributes['data-type']) return {};
                                return {
                                    'data-type': attributes['data-type'],
                                    class: attributes['data-type'] === 'button' 
                                        ? 'interactive-button' 
                                        : 'toggle-wrapper'
                                };
                            },
                        },
                    },
                },
            ];
        },
    }),

    // Предотвращение дропа извне
    PreventDropExtension,

    // Обработка Enter и Backspace
    EnterHandlerExtension(onEnterPressed, onBackspacePressed),

    // Плейсхолдер
    Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
    }),

    // Добавляем кнопку и переключатель
    ButtonNode,
    ToggleNode,
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
        editorProps: {
            attributes: {
                class: `${styles.editor} custom-tiptap-editor no-dropcursor`,
            },
            handleClick: (view, pos, event) => {
                const target = event.target as HTMLElement;
                const toggleHeader = target.closest('.toggle-header');
                
                if (toggleHeader) {
                    const toggleWrapper = toggleHeader.closest('.toggle-wrapper');
                    if (toggleWrapper) {
                        const isOpen = toggleHeader.getAttribute('data-open') === 'true';
                        const newState = !isOpen;
                        
                        // Обновляем состояние в DOM
                        toggleHeader.setAttribute('data-open', String(newState));
                        toggleHeader.classList.add('open', String(newState));

                        const content = toggleWrapper.querySelector('.toggle-content');
                        if (content) {
                            content.classList.add('open', String(newState));
                        }
                        const icon = toggleHeader.querySelector('.toggle-icon');
                        if (icon) {
                            icon.textContent = newState ? '▼' : '▶';
                        }
                    }
                    return true;
                }
                return false;
            },
        },
        immediatelyRender: true,
        onContentError: (error) => {
            console.log('contentError', error)

            return false;
        },
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
    })

    useEffect(() => {
        if (editor) {
            console.log('initialContent', initialContent)
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

        /* Стили для кнопки */
        button[data-type="button"] {
            @apply px-4 py-2 bg-blue-500 text-white rounded-md 
                   hover:bg-blue-600 active:bg-blue-700 
                   transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
        }

        /* Стили для переключателя */
        .toggle-wrapper {
            @apply border rounded-lg mb-4;

            .toggle-header {
                @apply flex items-center gap-2 p-3 cursor-pointer 
                       hover:bg-gray-50 select-none;

                .toggle-icon {
                    @apply text-gray-500 transition-transform duration-200;
                }

                .toggle-title {
                    @apply font-medium;
                }
            }

            .toggle-content {
                @apply hidden px-4 pb-4;
                
                &.open {
                    @apply block;
                }
            }

            /* Темная тема */
            .dark & {
                @apply border-gray-700;

                .toggle-header {
                    @apply hover:bg-gray-800;
                }
            }
        }
      `}</style>
        </div>
    )
})

Tiptap.displayName = 'Tiptap';

export default Tiptap
