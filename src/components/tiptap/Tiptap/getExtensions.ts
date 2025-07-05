/* eslint-disable indent */
import { RefObject } from 'react';
import { ArrowNavigationExtension, EditorWithMethods } from '../extensions/ArrowNavigationExtension';
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
import Link from '@tiptap/extension-link';

import {
    CustomCodeExtension,
    TextStyleExtension,
    FontSizeExtension,
    ParagraphExtension,
    PreventDropExtension,
    EnterHandlerExtension,
    SlashCommandExtension,
    EmptySpanExtension,
} from '../extensions';
import { BlockquoteExtension } from '../extensions/BlockquoteExtension';
import {
    ButtonNode,
    BoxNode,
    NoteBoxNode,
    InfoBoxNode,
    WarningBoxNode,
    CautionBoxNode,
    SuccessBoxNode,
    QuestionBoxNode,
} from '../nodes';
import { MenuItem } from '@/types/templates';

interface GetExtensionsProps {
    placeholder: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    elementId?: string;
    tiptapRefs?: RefObject<{
        editors: Record<string, EditorWithMethods>;
        editorRefs: React.RefObject<HTMLDivElement>[];
    }> | null;
    standardEnterBehavior?: boolean;
    isHideSlashMenu?: boolean;
    onEnterPressed: (contentBeforeCursor?: string, contentAfterCursor?: string) => void;
    onDeletePressed: (isEmpty: boolean, textContent: string) => void;
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
    onDeletePressed,
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
    EmptySpanExtension,
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
                getExtensions({
                    onEnterPressed,
                    onBackspacePressed,
                    onDeletePressed,
                    placeholder,
                    onAddElement,
                    isHideSlashMenu,
                })
            );
            const htmlAfterCursor = generateHTML(
                contentAfterCursor!,
                getExtensions({
                    onEnterPressed,
                    onBackspacePressed,
                    onDeletePressed,
                    placeholder,
                    onAddElement,
                    isHideSlashMenu,
                })
            );
            onEnterPressed(htmlBeforeCursor, htmlAfterCursor);
        },
        (isEmpty, textContent) => {
            onBackspacePressed(isEmpty, textContent);
        },
        (isEmpty, textContent) => {
            onDeletePressed(isEmpty, textContent);
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
    // Details.configure({
    //     persist: true,
    //     HTMLAttributes: {
    //         class: 'details',
    //     },
    // }),
    // DetailsSummary,
    // DetailsContent,
    // Добавляем блоки разных типов
    BoxNode,
    NoteBoxNode,
    InfoBoxNode,
    WarningBoxNode,
    CautionBoxNode,
    SuccessBoxNode,
    QuestionBoxNode,
];

export default getExtensions;
