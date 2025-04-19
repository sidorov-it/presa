/* eslint-disable react/no-unknown-property */
'use client';

import { EditorContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { useCallback, useEffect, RefObject } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Extension, generateHTML } from '@tiptap/core';
import { useEditorStore } from '@/store/editorStore';
import styles from './Tiptap.module.css';
import {
    SlashCommandExtension,
    PreventDropExtension,
    EnterHandlerExtension,
    ArrowNavigationExtension,
    EditorWithMethods,
    FontSizeExtension,
} from './extensions/index';
import {
    ButtonNode,
    BoxNode,
    NoteBoxNode,
    InfoBoxNode,
    WarningBoxNode,
    CautionBoxNode,
    SuccessBoxNode,
    QuestionBoxNode,
} from './nodes';
import { ElementConfig, TipTapRefs } from '@/types';
import CommonBubbleMenu from './CommonBubbleMenu';
import Link from '@tiptap/extension-link';
import Details from '@tiptap-pro/extension-details';
import DetailsContent from '@tiptap-pro/extension-details-content';
import DetailsSummary from '@tiptap-pro/extension-details-summary';

// Определяем типы пропсов
interface TiptapProps {
    initialContent?: string;
    onEnterPressed?: (content?: any) => void;
    onBackspacePressed?: (isEmpty: boolean, textContent: string) => void;
    onBlur?: () => void;
    onContentChange?: (content: string, isEnterPress?: boolean) => void;
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
    elementConfig: ElementConfig;
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
    onBackspacePressed: (isEmpty: boolean, textContent: string) => void,
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
        history: false,
        heading: {
            levels: [1, 2, 3, 4],
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
    // Text style extensions
    TextStyle.configure(),
    FontSizeExtension.configure({
        types: ['textStyle'],
    }),
    Color,
    Underline,
    TextAlign.configure({
        types: ['heading', 'paragraph'],
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
            class: 'task-list [&>li]:flex [&>li]:items-start [&>li]:gap-2 list-none pl-0',
        },
    }),
    TaskItem.configure({
        nested: true,
        HTMLAttributes: {
            class: 'flex items-start gap-2 list-none',
        },
    }),

    Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['http', 'https'],
        isAllowedUri: (url, ctx) => {
            try {
                // construct URL
                const parsedUrl = url.includes(':') ? new URL(url) : new URL(`${ctx.defaultProtocol}://${url}`);

                // use default validation
                if (!ctx.defaultValidate(parsedUrl.href)) {
                    return false;
                }

                // disallowed protocols
                const disallowedProtocols = ['ftp', 'file', 'mailto'];
                const protocol = parsedUrl.protocol.replace(':', '');

                if (disallowedProtocols.includes(protocol)) {
                    return false;
                }

                // only allow protocols specified in ctx.protocols
                const allowedProtocols = ctx.protocols.map(p => (typeof p === 'string' ? p : p.scheme));

                if (!allowedProtocols.includes(protocol)) {
                    return false;
                }

                // disallowed domains
                const disallowedDomains = ['example-phishing.com', 'malicious-site.net'];
                const domain = parsedUrl.hostname;

                if (disallowedDomains.includes(domain)) {
                    return false;
                }

                // all checks have passed
                return true;
            } catch {
                return false;
            }
        },
        shouldAutoLink: url => {
            try {
                // construct URL
                const parsedUrl = url.includes(':') ? new URL(url) : new URL(`https://${url}`);

                // only auto-link if the domain is not in the disallowed list
                const disallowedDomains = ['example-no-autolink.com', 'another-no-autolink.com'];
                const domain = parsedUrl.hostname;

                return !disallowedDomains.includes(domain);
            } catch {
                return false;
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
                                    class:
                                        attributes['data-type'] === 'button' ? 'interactive-button' : 'toggle-wrapper',
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

    EnterHandlerExtension(
        (contentBeforeCursor, contentAfterCursor) => {
            if (!contentBeforeCursor && !contentAfterCursor) return;
            const htmlBeforeCursor = generateHTML(
                contentBeforeCursor!,
                getExtensions(onEnterPressed, onBackspacePressed, placeholder, onAddElement)
            );
            const htmlAfterCursor = generateHTML(
                contentAfterCursor!,
                getExtensions(onEnterPressed, onBackspacePressed, placeholder, onAddElement)
            );
            onEnterPressed(htmlBeforeCursor, htmlAfterCursor);
        },
        (isEmpty, textContent) => {
            onBackspacePressed(isEmpty, textContent);
        }
    ),

    // Arrow key navigation between editors
    ...(presentationId && slideId && layoutId && elementId && tiptapRefs
        ? [ArrowNavigationExtension(presentationId, slideId, layoutId, elementId, tiptapRefs)]
        : []),
    // Slash command
    SlashCommandExtension.configure({
        onAddElement: onAddElement || (() => {}),
    }),
    // Плейсхолдер
    Placeholder.configure({
        placeholder,
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
];

const Tiptap = ({
    initialContent = '',
    onEnterPressed = () => {},
    onBackspacePressed = () => {},
    onContentChange = () => {},
    onBlur = () => {},
    id = '',
    autoFocus = false,
    customBubbleMenuTrigger,
    onAddElement,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    elementId,
    elementConfig,
}: TiptapProps) => {
    const editor = useEditor({
        // autoFocus: !!autoFocus,
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
        editorProps: {
            attributes: {
                class: `${styles.editor} custom-tiptap-editor no-dropcursor not-prose themed-text`,
            },
        },
        immediatelyRender: true,
        onContentError: error => {
            console.log('contentError', error);
            return false;
        },
        onBlur: () => {
            onBlur?.();
        },
        onFocus: () => {
            useEditorStore.getState().setActiveEditor(editor, elementId);
        },
        onUpdate: ({ editor, transaction }) => {
            const html = editor.getHTML();
            const isEnterPress = transaction.getMeta('handleEnter');
            onContentChange(html, isEnterPress);
        },
    });

    // Update editor content when initialContent changes (including undo/redo operations)
    useEffect(() => {
        if (editor && initialContent) {
            const currentContent = editor.getHTML();
            // Only update if content actually changed to avoid cursor position issues
            if (currentContent !== initialContent) {
                editor.commands.setContent(initialContent, false);
            }
        }
    }, [editor, initialContent]);

    useEffect(() => {
        if (editor) {
            const handleFocusEditor = (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail && customEvent.detail.editorId === elementId) {
                    editor.commands.focus();
                    useEditorStore.getState().setActiveEditor(editor, elementId);
                }
            };

            document.addEventListener('focus_editor', handleFocusEditor);

            return () => {
                document.removeEventListener('focus_editor', handleFocusEditor);
            };
        }
    }, [editor, elementId]);

    // Метод для программного фокуса на редакторе
    const focus = useCallback(
        (position: 'start' | 'end' = 'end') => {
            if (editor) {
                // Focus immediately without any delay
                editor.commands.focus(position);
            }
        },
        [editor]
    );

    // Expose the focus method via ref
    // useImperativeHandle(ref, () => {
    if (tiptapRefs?.current) {
        // tiptapRefs.current.editors[elementId] = editor;
        tiptapRefs.current.editors[elementId] = {
            editor,
            focus,
            getText: () => editor?.getText() ?? '',
            isEmpty: editor?.isEmpty || false,
        };
    }

    // Устанавливаем фокус при монтировании, если autoFocus = true
    useEffect(() => {
        if (autoFocus && editor) {
            // Focus immediately
            focus();
        }
    }, [autoFocus, editor, focus]);

    // Add event listener for custom trigger
    useEffect(() => {
        if (customBubbleMenuTrigger?.current && editor) {
            const handleTriggerClick = (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();

                // Use the global store to show the menu
                useEditorStore.getState().setActiveEditor(editor);
                useEditorStore.getState().showMenu(customBubbleMenuTrigger.current as HTMLElement);

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
    }, [customBubbleMenuTrigger, editor]);

    // Update the active editor in the store when the editor changes
    useEffect(() => {
        if (editor) {
            return () => {
                // Clean up when component unmounts
                useEditorStore.getState().setActiveEditor(null);
            };
        }
    }, [editor]);

    return (
        <div className="relative w-full not-prose" data-editor-id={id}>
            {!elementConfig?.customMenu && <CommonBubbleMenu editor={editor} />}
            <div className="tiptap-editor-wrapper w-full">
                {editor && (
                    <EditorContent
                        editor={editor}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={autoFocus}
                        className="cursor-text w-full focus:outline-none themed-text"
                    />
                )}
            </div>
        </div>
    );
};

Tiptap.displayName = 'Tiptap';

export default Tiptap;
