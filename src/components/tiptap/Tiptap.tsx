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
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Strike from '@tiptap/extension-strike'
import { Extension, generateHTML } from '@tiptap/core'
import { useEditorStore } from '@/store/editorStore'
import styles from './Tiptap.module.css'
import { SlashCommandExtension, PreventDropExtension, EnterHandlerExtension, ArrowNavigationExtension, EditorWithMethods } from './extensions/index'
import { 
    ButtonNode, 
    ToggleNode, 
    BoxNode, 
    NoteBoxNode, 
    InfoBoxNode, 
    WarningBoxNode, 
    CautionBoxNode, 
    SuccessBoxNode, 
    QuestionBoxNode 
} from './nodes'
import { TipTapRefs } from '@/types';
import CommonBubbleMenu from './CommonBubbleMenu';
import Link from '@tiptap/extension-link';

// Определяем типы пропсов
interface TiptapProps {
    initialContent?: string;
    onEnterPressed?: (content?: any) => void;
    onBackspacePressed?: (isEmpty: boolean) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onContentChange?: (content: string) => void;
    autoFocus?: boolean;
    id?: string;
    placeholder?: string;
    customBubbleMenuTrigger?: RefObject<HTMLElement>;
    onAddElement?: (type: string) => void;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    tiptapRefs: RefObject<TipTapRefs>;
    elementId: string;
}

// Define the ref type
export interface TiptapRef {
    focus: () => void;
    getText: () => string;
    isEmpty: () => boolean;
}

// Определяем массив расширений
const getExtensions = (
    onEnterPressed: (contentBeforeCursor?: string, contentAfterCursor?: string) => void,
    onBackspacePressed: (isEmpty: boolean) => void,
    placeholder: string,
    onAddElement?: (type: string) => void,
    presentationId?: string,
    slideId?: string,
    layoutId?: string,
    elementId?: string,
    tiptapRefs?: RefObject<{
        editors: Record<string, EditorWithMethods>;
        editorRefs: React.RefObject<HTMLDivElement>[];
    }>
) => [
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
        TextStyle,
        Color,
        Underline,
        TextAlign.configure({
            types: ['heading', 'paragraph'],
        }),
        Strike,
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

        Link.configure({
            openOnClick: false,
            autolink: true,
            defaultProtocol: 'https',
            protocols: ['http', 'https'],
            isAllowedUri: (url, ctx) => {
              try {
                // construct URL
                const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`)
    
                // use default validation
                if (!ctx.defaultValidate(parsedUrl.href)) {
                  return false
                }
    
                // disallowed protocols
                const disallowedProtocols = ['ftp', 'file', 'mailto']
                const protocol = parsedUrl.protocol.replace(':', '')
    
                if (disallowedProtocols.includes(protocol)) {
                  return false
                }
    
                // only allow protocols specified in ctx.protocols
                const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme))
    
                if (!allowedProtocols.includes(protocol)) {
                  return false
                }
    
                // disallowed domains
                const disallowedDomains = ['example-phishing.com', 'malicious-site.net']
                const domain = parsedUrl.hostname
    
                if (disallowedDomains.includes(domain)) {
                  return false
                }
    
                // all checks have passed
                return true
              } catch {
                return false
              }
            },
            shouldAutoLink: url => {
              try {
                // construct URL
                const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`)
    
                // only auto-link if the domain is not in the disallowed list
                const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com']
                const domain = parsedUrl.hostname
    
                return !disallowedDomains.includes(domain)
              } catch {
                return false
              }
            },
    
          }),
        // BubbleMenu.configure({
        //     element: document.querySelector('.menu'),
        //   }),


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

        EnterHandlerExtension((contentBeforeCursor, contentAfterCursor) => {
            if (!contentBeforeCursor && !contentAfterCursor) return;
            const htmlBeforeCursor = generateHTML(contentBeforeCursor!, getExtensions(onEnterPressed, onBackspacePressed, placeholder, onAddElement))
            const htmlAfterCursor = generateHTML(contentAfterCursor!, getExtensions(onEnterPressed, onBackspacePressed, placeholder, onAddElement))
            console.log('htmlAfterCursor', htmlAfterCursor)
            console.log('htmlBeforeCursor', htmlBeforeCursor)
            onEnterPressed(htmlBeforeCursor, htmlAfterCursor)
        }, (isEmpty) => {
            onBackspacePressed(isEmpty)
        }),

        // Slash command
        SlashCommandExtension.configure({
            onAddElement: onAddElement || (() => { }),
        }),

        // Arrow key navigation between editors
        ...(presentationId && slideId && layoutId && elementId && tiptapRefs ? [
            ArrowNavigationExtension(
                presentationId,
                slideId,
                layoutId,
                elementId,
                tiptapRefs
            )
        ] : []),

        // Плейсхолдер
        Placeholder.configure({
            placeholder,
            emptyEditorClass: 'is-editor-empty',
        }),
        // Добавляем кнопку и переключатель
        ButtonNode,
        ToggleNode,
        // Добавляем блоки разных типов
        BoxNode,
        NoteBoxNode,
        InfoBoxNode,
        WarningBoxNode,
        CautionBoxNode,
        SuccessBoxNode,
        QuestionBoxNode,
    ]

const Tiptap = forwardRef<TiptapRef, TiptapProps>(({
    initialContent = '',
    onEnterPressed = () => { },
    onBackspacePressed = () => { },
    onFocus = () => { },
    onContentChange = () => { },
    onBlur = () => { },
    id = '',
    placeholder = '',
    customBubbleMenuTrigger,
    onAddElement,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    elementId,
}, ref) => {
    // Use the global editor store instead of local state
    const { setActiveEditor, showMenu } = useEditorStore();

    const editor = useEditor({
        extensions: getExtensions(
            onEnterPressed,
            onBackspacePressed,
            placeholder,
            onAddElement,
            presentationId,
            slideId,
            layoutId,
            elementId,
            tiptapRefs
        ),
        content: initialContent,
        // autofocus: autoFocus,
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
    }, [editor])

    // Метод для программного фокуса на редакторе
    const focus = useCallback((position: 'start' | 'end' = 'end') => {
        if (editor) {
            // Focus immediately without any delay
            editor.commands.focus(position);
        }
    }, [editor])

    // Expose the focus method via ref
    // useImperativeHandle(ref, () => {
    if (tiptapRefs?.current) {
        // tiptapRefs.current.editors[elementId] = editor;
        tiptapRefs.current.editors[elementId] = {
            editor,
            focus,
            getText: () => editor?.getText() ?? '',
            isEmpty: editor?.isEmpty || false
        };
    }

    // Устанавливаем фокус при монтировании, если autoFocus = true
    // useEffect(() => {
    //     if (autoFocus && editor) {
    //         // Focus immediately
    //         focus();
    //     }
    // }, [autoFocus, editor, focus])

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
            <CommonBubbleMenu editor={editor} />
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

        /* Slash Command Menu Styles */
            .slash-menu {
                overflow-y: auto; 
                z-index: 50; 
                padding-top: 0.5rem;
                padding-bottom: 0.5rem; 
                border-radius: 0.375rem; 
                width: 100%; 
                background-color: #ffffff; 
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); 
                max-height: 300px;
                border: 1px solid #3b82f6; /* Blue outline */
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.3);
                min-width: 200px;
            }

            /* Element focus styles for keyboard navigation */
            .element-focus {
                outline: 3px solid #3b82f6 !important; /* Blue outline */
                border-radius: 4px;
                position: relative;
                z-index: 10;
                animation: pulse-focus 1s ease-in-out;
            }

            @keyframes pulse-focus {
                0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
                70% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
                100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
            }

            .slash-menu-item {
                display: flex; 
                padding-top: 0.5rem;
                padding-bottom: 0.5rem; 
                padding-left: 0.75rem;
                padding-right: 0.75rem; 
                gap: 0.5rem; 
                font-size: 0.875rem;
                line-height: 1.25rem; 
                color: #374151; 
                transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                transition-duration: 300ms; 
                cursor: pointer; 
            }

            .slash-menu-item:hover {
                background-color: #EFF6FF; 
            }

            .slash-menu-item.selected {
                color: #2563EB; 
                background-color: #EFF6FF;
            }

            .slash-menu-item-icon {
                display: flex; 
                justify-content: center; 
                align-items: center; 
                color: #3B82F6; 
                width: 20px;
                height: 20px;
            }

            .slash-menu-item-label {
                flex-grow: 1; 
                font-weight: 500; 
            }

            .slash-menu-no-results {
                padding: 0.75rem; 
                font-size: 0.875rem;
                line-height: 1.25rem; 
                text-align: center; 
                color: #6B7280; 
            }

            /* Dark mode support */
            .dark .slash-menu {
                border-color: #3B82F6; 
                background-color: #1F2937; 
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.4);
            }

            .dark .slash-menu-item {
                color: #D1D5DB; 
            }

            .dark .slash-menu-item:hover {
                background-color: #1E3A8A; 
                --bg-opacity: 0.3; 
            }

            .dark .slash-menu-item.selected {
                color: #60A5FA; 
                background-color: #1E3A8A; 
                --bg-opacity: 0.3; 
            }

            .dark .slash-menu-item-icon {
                color: #60A5FA; 
            }

            .dark .slash-menu-no-results {
                color: #9CA3AF;
            }

            .tiptap-editor-wrapper .tippy-box[data-theme~='light'] {
                border-radius: 0.375rem; 
                background-color: #ffffff; 
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border: none;
                box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.1);
            }

            /* Tippy theme override */
            .tippy-box[data-theme~='light'] {
                border-radius: 0.375rem; 
                background-color: #ffffff; 
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                border: 1px solid #3b82f6;
                box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.1);
            }

            .tippy-box[data-theme~='light'] .tippy-content {
                padding: 0; ;
            }

            .dark .tippy-box[data-theme~='light'] {
                background-color: #1F2937; 
                border: 1px solid #3b82f6;
            }

            .slash-menu-item.selected {
                background-color: #EFF6FF; 
            }
      `}</style>
        </div>
    )
})

Tiptap.displayName = 'Tiptap';

export default Tiptap
