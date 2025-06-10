/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable react/no-unknown-property */
'use client';

import { EditorContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { useCallback, useEffect, RefObject, useState, useRef } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
// import TextStyle from '@tiptap/extension-text-style';
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
    CustomCodeExtension,
    ParagraphExtension,
    TextStyleExtension,
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
import { ElementConfig, TipTapRefs, SmartLayoutElement, SmartLayoutItem } from '@/types';
import CommonBubbleMenu from './CommonBubbleMenu';
import Link from '@tiptap/extension-link';
import Details from '@tiptap-pro/extension-details';
import DetailsContent from '@tiptap-pro/extension-details-content';
import DetailsSummary from '@tiptap-pro/extension-details-summary';
import { BlockquoteExtension } from './extensions/BlockquoteExtension';
import { usePresentationStore } from '@/store/presentationStore';
import { EditorElement } from '@/types';
import { MenuItem } from '@/types/templates';
import getHeadingLevel from '@/utils/getHeadingLevel';
import { NORMAL_TEXT_LEVEL } from '@/consts';

// Определяем типы пропсов
interface TiptapProps {
    // initialContent?: string;
    autoFocus?: boolean;
    id?: string;
    placeholder?: string;
    defaultContent?: string;
    customBubbleMenuTrigger?: RefObject<HTMLElement>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    elementId: string;
    elementConfig?: ElementConfig;
    customRefKey?: string;
    standardEnterBehavior?: boolean;
    isReadOnly?: boolean;
    isInTable?: boolean;
    isHideSlashMenu?: boolean;
    onEnterPressed?: (content?: any) => void;
    onBackspacePressed?: (isEmpty: boolean, textContent: string) => void;
    onBlur?: () => void;
    onContentChange?: (content: string, isEnterPress?: boolean, isTransaction?: boolean) => void;
    onAddElement?: (menuItem: MenuItem) => void;
}

// Define the ref type
export interface TiptapRef {
    focus: () => void;
    getText: () => string;
    isEmpty: () => boolean;
}

interface GetExtensionsProps {
    placeholder: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    elementId?: string;
    tiptapRefs?: RefObject<{
        editors: Record<string, EditorWithMethods>;
        editorRefs: React.RefObject<HTMLDivElement>[];
    }>;
    standardEnterBehavior?: boolean;
    isHideSlashMenu?: boolean;
    onEnterPressed: (contentBeforeCursor?: string, contentAfterCursor?: string) => void;
    onBackspacePressed: (isEmpty: boolean, textContent: string) => void;
    onAddElement?: (menuItem: MenuItem) => void;
}
// Определяем массив расширений
const getExtensions = ({
    placeholder,
    presentationId,
    slideId,
    layoutId,
    elementId,
    tiptapRefs,
    standardEnterBehavior,
    isHideSlashMenu,
    onEnterPressed,
    onBackspacePressed,
    onAddElement,
}: GetExtensionsProps) => [
    // Базовый набор расширений
    StarterKit.configure({
        dropcursor: false,
        history: false,
        // heading: {
        //     levels: [1, 2, 3, 4],
        //     HTMLAttributes: {
        //         class: 'heading-text',
        //     },
        // },
        blockquote: false,
        heading: false,
        bulletList: {
            keepMarks: true,
            keepAttributes: false,
        },
        orderedList: {
            keepMarks: true,
            keepAttributes: false,
        },
        // Disable the built-in code extension
        code: false,
        codeBlock: false,
        paragraph: false,
    }),
    CustomCodeExtension.configure({
        HTMLAttributes: {
            class: 'custom-code',
        },
    }),
    BlockquoteExtension.configure({
        HTMLAttributes: {
            class: 'blockquote',
        },
    }),
    // Text style extensions
    TextStyleExtension.configure({ mergeNestedSpanStyles: true }),
    FontSizeExtension.configure({
        types: ['textStyle'],
    }),
    ParagraphExtension,
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
                getExtensions({ onEnterPressed, onBackspacePressed, placeholder, onAddElement, isHideSlashMenu })
            );
            const htmlAfterCursor = generateHTML(
                contentAfterCursor!,
                getExtensions({ onEnterPressed, onBackspacePressed, placeholder, onAddElement, isHideSlashMenu })
            );
            onEnterPressed(htmlBeforeCursor, htmlAfterCursor);
        },
        (isEmpty, textContent) => {
            onBackspacePressed(isEmpty, textContent);
        },
        standardEnterBehavior
    ),

    // Arrow key navigation between editors
    ...(presentationId && slideId && layoutId && elementId && tiptapRefs
        ? [ArrowNavigationExtension(presentationId, slideId, layoutId, elementId, tiptapRefs)]
        : []),
    // Slash command
    ...(isHideSlashMenu
        ? []
        : [
            SlashCommandExtension.configure({
                onAddElement: onAddElement || (() => {}),
            }),
        ]),
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
    isInTable = false,
    isHideSlashMenu = false,
    id = '',
    autoFocus = false,
    customBubbleMenuTrigger,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    elementId,
    elementConfig,
    customRefKey,
    standardEnterBehavior = false,
    isReadOnly = false,
    defaultContent,
    placeholder,
    onEnterPressed = () => {},
    onBackspacePressed = () => {},
    onContentChange = () => {},
    onBlur = () => {},
    onAddElement,
}: TiptapProps) => {
    const [hasInteraction, setHasInteraction] = useState(false);
    const lastStyleRef = useRef({
        level: NORMAL_TEXT_LEVEL,
        color: null as string | null,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
    });
    const applyingStoredMarksRef = useRef(false);
    const element = usePresentationStore.getState().getElement(presentationId, slideId, layoutId, elementId);
    const isTempEditor = (element as EditorElement)?.tempEditor;
    const isTempLayout = (element as EditorElement)?.tempLayout;
    let initialContent;
    if (customRefKey) {
        const [key, , itemId] = customRefKey.split('-');
        const item = (element as SmartLayoutElement)?.items.find(item => item.id === itemId) as SmartLayoutItem;
        initialContent = item?.[key as keyof SmartLayoutItem] || '';
    } else {
        initialContent = (element as EditorElement)?.content || '';
    }

    if (!isHideSlashMenu && defaultContent) {
        initialContent = defaultContent;
    }

    const editor = useEditor({
        extensions: getExtensions({
            onEnterPressed,
            onBackspacePressed,
            placeholder: placeholder || 'Введите текст или / для выбора готового шаблона',
            onAddElement,
            presentationId,
            slideId,
            layoutId,
            elementId,
            tiptapRefs,
            standardEnterBehavior,
            isHideSlashMenu,
        }),
        content: initialContent,
        editorProps: {
            attributes: {
                class: `${styles.editor} custom-tiptap-editor no-dropcursor not-prose`,
                'data-is-in-table': String(isInTable),
            },
        },
        editable: !isReadOnly,
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
            const isTransaction = transaction.getMeta('transaction');

            // Consider it an interaction only if content actually changed
            if (html !== initialContent) {
                setHasInteraction(true);
            }

            onContentChange(html, isEnterPress, isTransaction);
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

    // Preserve text styles when content is cleared
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            if (applyingStoredMarksRef.current) {
                applyingStoredMarksRef.current = false;
                return;
            }

            if (editor.isEmpty) {
                const { level, color, bold, italic, underline, strike } = lastStyleRef.current;

                if (level !== undefined || color || bold || italic || underline || strike) {
                    const chain = editor.chain();
                    if (level !== undefined && level !== null) chain.setFontSize(level);
                    if (color) chain.setColor(color);
                    if (bold) chain.setBold();
                    if (italic) chain.setItalic();
                    if (underline) chain.setUnderline();
                    if (strike) chain.setStrike();

                    applyingStoredMarksRef.current = true;
                    chain.run();
                }
            } else {
                lastStyleRef.current = {
                    level: getHeadingLevel(editor),
                    color: editor.getAttributes('color').color || null,
                    bold: editor.isActive('bold'),
                    italic: editor.isActive('italic'),
                    underline: editor.isActive('underline'),
                    strike: editor.isActive('strike'),
                };
            }
        };

        editor.on('update', handleUpdate);
        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor]);

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
        tiptapRefs.current.editors[customRefKey || elementId] = {
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

    const handleBlur = useCallback(() => {
        if (editor) {
            const content = editor.getHTML();
            const isEmpty = content === '<p></p>' || content === '';

            // Remove editor only if:
            // 1. It's a temporary editor (added by clicking between elements)
            // 2. It's empty
            // 3. No content changes were made
            if (isEmpty && !hasInteraction) {
                if (isTempEditor) {
                    usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                } else if (isTempLayout) {
                    usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                }
            }

            onBlur?.();
        }
    }, [editor, elementId, hasInteraction, isTempEditor, isTempLayout, layoutId, onBlur, presentationId, slideId]);

    return (
        <div className="not-prose" style={{ position: 'relative', width: '100%' }} data-editor-id={id}>
            {!elementConfig?.customMenu && <CommonBubbleMenu editor={editor} data-element-id={elementId} />}
            <div className="tiptap-editor-wrapper" style={{ width: '100%' }}>
                {editor && (
                    <EditorContent
                        editor={editor}
                        autoFocus={autoFocus}
                        className={`cursor-text ${styles.editor}`}
                        style={{ width: '100%' }}
                        onBlur={handleBlur}
                    />
                )}
            </div>
        </div>
    );
};

Tiptap.displayName = 'Tiptap';

export default Tiptap;
