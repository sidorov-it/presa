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
import Details from '@tiptap-pro/extension-details'
import DetailsContent from '@tiptap-pro/extension-details-content'
import DetailsSummary from '@tiptap-pro/extension-details-summary'

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
        ButtonNode,
        Details.configure({
            persist: true,
            HTMLAttributes: {
              class: 'details',
            },
        }),
        DetailsSummary,
        DetailsContent,
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
            'Введите текст или / для выбора готового шаблона',
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
            setActiveEditor(editor, elementId);
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onContentChange(html);
        },
    })

    useEffect(() => {
        if (editor) {
            editor.commands.setContent(initialContent);
        }
    }, [editor])

    useEffect(() => {
        if (editor) {
            document.addEventListener('focus_editor', (e: CustomEvent) => {
                if (e.detail.editorId === elementId) {
                    editor.commands.focus();
                    setActiveEditor(editor, elementId);
                }
            })
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

            
        </div>
    )
})

Tiptap.displayName = 'Tiptap';

export default Tiptap
