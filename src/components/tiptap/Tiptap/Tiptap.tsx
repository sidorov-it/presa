/* eslint-disable prettier/prettier */
/* eslint-disable jsx-a11y/no-autofocus */
/* eslint-disable react/no-unknown-property */
'use client';

import { EditorContent } from '@tiptap/react';
import { useEditor } from '@tiptap/react';
import { useCallback, useEffect, RefObject, useState, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import styles from './Tiptap.module.css';

import { ElementConfig, TipTapRefs, SmartLayoutElement, SmartLayoutItem } from '@/types';
import CommonBubbleMenu from '../CommonBubbleMenu';
import { usePresentationStore } from '@/store/presentationStore';
import { EditorElement } from '@/types';
import { MenuItem } from '@/types/templates';
import getHeadingLevel from '@/utils/getHeadingLevel';
import { NORMAL_TEXT_LEVEL } from '@/constants/consts';
import getExtensions from './getExtensions';

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
    tiptapRefs: RefObject<TipTapRefs> | null;
    elementId: string;
    elementConfig?: ElementConfig;
    customRefKey?: string;
    standardEnterBehavior?: boolean;
    isReadOnly?: boolean;
    isInTable?: boolean;
    isHideSlashMenu?: boolean;
    onEnterPressed?: (content?: any) => void;
    onBackspacePressed?: (isEmpty: boolean, textContent: string) => void;
    onDeletePressed?: (isEmpty: boolean, textContent: string) => void;
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
    onDeletePressed = () => {},
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
    let initialContent: string;
    if (customRefKey) {
        const [key, , itemId] = customRefKey.split('-');
        const item = (element as SmartLayoutElement)?.items.find(item => item.id === itemId) as SmartLayoutItem;
        initialContent = item?.[key as keyof SmartLayoutItem] as string || '';
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
            onDeletePressed,
            placeholder: placeholder || 'Введите текст или / для выбора готового шаблона',
            onAddElement,
            presentationId,
            slideId,
            layoutId,
            elementId,
            tiptapRefs,
            standardEnterBehavior,
            isHideSlashMenu,
            editor: undefined,
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

            // Если редактор пустой и нет сохраненных стилей, устанавливаем дефолтные
            if (editor?.isEmpty) {
                const { level, color, bold, italic, underline, strike } = lastStyleRef.current;

                if (level === NORMAL_TEXT_LEVEL && !color && !bold && !italic && !underline && !strike) {
                    setTimeout(() => {
                        if (editor && editor.isEmpty) {
                            const chain = editor.chain();
                            chain.setMark('textStyle', { class: 'body-text normal-text', fontSize: null });
                            applyingStoredMarksRef.current = true;
                            chain.run();
                        }
                    }, 0);
                }
            }
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

    // After editor is created, update extensions with editor instance
    useEffect(() => {
        if (editor) {
            editor.setOptions({
                extensions: getExtensions({
                    onEnterPressed,
                    onBackspacePressed,
                    onDeletePressed,
                    placeholder: placeholder || 'Введите текст или / для выбора готового шаблона',
                    onAddElement,
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    tiptapRefs,
                    standardEnterBehavior,
                    isHideSlashMenu,
                    editor,
                }),
            });
        }
    }, [editor]);

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

            const { empty } = editor.state.selection;

            if (editor.isEmpty) {
                const { level, color, bold, italic, underline, strike } = lastStyleRef.current;

                // Если нет сохраненных стилей, устанавливаем дефолтные
                if (level === NORMAL_TEXT_LEVEL && !color && !bold && !italic && !underline && !strike) {
                    const chain = editor.chain();
                    chain.setMark('textStyle', { class: 'body-text normal-text', fontSize: null });
                    applyingStoredMarksRef.current = true;
                    chain.run();
                } else if (level !== undefined || color || bold || italic || underline || strike) {
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
            } else if (empty) {
                lastStyleRef.current = {
                    level: getHeadingLevel(editor),
                    color: editor.getAttributes('textStyle').color || null,
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
