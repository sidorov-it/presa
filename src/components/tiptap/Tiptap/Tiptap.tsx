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
import {
    NORMAL_TEXT_LEVEL,
    SMALL_TEXT_LEVEL,
    BIG_TEXT_LEVEL,
    HEADING_4_LEVEL,
    HEADING_3_LEVEL,
    HEADING_2_LEVEL,
    HEADING_1_LEVEL,
    TITLE_LEVEL,
    BIG_HEADING_LEVEL,
    VERY_BIG_HEADING_LEVEL,
} from '@/constants/consts';
import getExtensions from './getExtensions';

// Helper function to get CSS classes from level for editor
const getEditorClassFromLevel = (level: number): string => {
    switch (level) {
        case SMALL_TEXT_LEVEL:
            return 'body-text small-text';
        case BIG_TEXT_LEVEL:
            return 'body-text big-text';
        case HEADING_4_LEVEL:
            return 'heading-text heading-4';
        case HEADING_3_LEVEL:
            return 'heading-text heading-3';
        case HEADING_2_LEVEL:
            return 'heading-text heading-2';
        case HEADING_1_LEVEL:
            return 'heading-text heading-1';
        case TITLE_LEVEL:
            return 'heading-text title-text';
        case BIG_HEADING_LEVEL:
            return 'heading-text big-heading';
        case VERY_BIG_HEADING_LEVEL:
            return 'heading-text very-big-heading';
        case NORMAL_TEXT_LEVEL:
        default:
            return 'body-text normal-text';
    }
};

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
    smartLayoutItemId?: string;
    elementConfig?: ElementConfig;
    customRefKey?: string;
    standardEnterBehavior?: boolean;
    isReadOnly?: boolean;
    isInTable?: boolean;
    isHideSlashMenu?: boolean;
    // флаг, что редактор внутри другого элемента, например, smart layout
    isInnerTiptap?: boolean;
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
    id = '',
    isInTable = false,
    isHideSlashMenu = false,
    autoFocus = false,
    customBubbleMenuTrigger,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    elementId,
    smartLayoutItemId,
    elementConfig,
    customRefKey,
    standardEnterBehavior = false,
    isReadOnly = false,
    defaultContent,
    placeholder,
    isInnerTiptap = false,
    onEnterPressed = () => {},
    onBackspacePressed = () => {},
    onDeletePressed = () => {},
    onContentChange = () => {},
    onBlur = () => {},
    onAddElement,
}: TiptapProps) => {
    const [hasInteraction, setHasInteraction] = useState(false);
    
    // Helper function to extract styles from initialContent
    const extractStylesFromInitialContent = (content: string) => {
        if (!content) return null;
        
        // Parse HTML to extract classes from span tags
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        const spans = doc.querySelectorAll('span');
        
        if (spans.length === 0) return null;
        
        // Get classes from the first span (assuming it contains the styling info)
        const firstSpan = spans[0];
        const classList = Array.from(firstSpan.classList);
        
        if (classList.length === 0) return null;
        
        // Map classes to level
        let level = NORMAL_TEXT_LEVEL;
        if (classList.includes('heading-text')) {
            if (classList.includes('very-big-heading')) level = VERY_BIG_HEADING_LEVEL;
            else if (classList.includes('big-heading')) level = BIG_HEADING_LEVEL;
            else if (classList.includes('title-text')) level = TITLE_LEVEL;
            else if (classList.includes('heading-1')) level = HEADING_1_LEVEL;
            else if (classList.includes('heading-2')) level = HEADING_2_LEVEL;
            else if (classList.includes('heading-3')) level = HEADING_3_LEVEL;
            else if (classList.includes('heading-4')) level = HEADING_4_LEVEL;
        } else if (classList.includes('body-text')) {
            if (classList.includes('big-text')) level = BIG_TEXT_LEVEL;
            else if (classList.includes('small-text')) level = SMALL_TEXT_LEVEL;
            else level = NORMAL_TEXT_LEVEL;
        }
        
        // Extract color from style attribute
        const style = firstSpan.getAttribute('style');
        let color = null;
        if (style) {
            const colorMatch = style.match(/color:\s*([^;]+)/);
            if (colorMatch) {
                color = colorMatch[1].trim();
            }
        }
        
        // Extract other styles (bold, italic, etc.)
        const bold = classList.includes('font-bold') || (style && style.includes('font-weight: bold'));
        const italic = classList.includes('italic') || (style && style.includes('font-style: italic'));
        const underline = classList.includes('underline') || (style && style.includes('text-decoration: underline'));
        const strike = classList.includes('line-through') || (style && style.includes('text-decoration: line-through'));
        
        return {
            level,
            color,
            bold,
            italic,
            underline,
            strike,
        };
    };
    
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

    // Extract styles from initialContent and initialize lastStyleRef
    const extractedStyles = extractStylesFromInitialContent(initialContent);
    if (extractedStyles) {
        lastStyleRef.current = extractedStyles;
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
            smartLayoutItemId,
            editor: undefined,
            initialStyle: extractedStyles,
        }),
        content: initialContent,
        editorProps: {
            attributes: {
                class: `${styles.editor} tiptap ProseMirror custom-tiptap-editor no-dropcursor not-prose`,
                'data-is-in-table': String(isInTable),
            },
        },
        editable: !isReadOnly,
        immediatelyRender: typeof window !== 'undefined',
        onContentError: error => {
            console.log('contentError', error);
            return false;
        },
        onBlur: () => {
            onBlur?.();
        },
        onFocus: () => {
            useEditorStore.getState().setActiveEditor(editor, elementId);

            // Apply stored styles when focusing empty editor
            if (editor?.isEmpty) {
                const { level, color, bold, italic, underline, strike } = lastStyleRef.current;

                // Sync with CustomPlaceholderExtension storage
                if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
                    editor.commands.updatePlaceholderStyle({
                        level,
                        color,
                        bold,
                        italic,
                        underline,
                        strike,
                    });
                }

                // Always apply stored styles to ensure new text inherits them
                setTimeout(() => {
                    if (editor && editor.isEmpty) {
                        const chain = editor.chain();

                        // Set font size (including normal level)
                        chain.setFontSize(level);

                        if (color) chain.setColor(color);
                        if (bold) chain.setBold();
                        if (italic) chain.setItalic();
                        if (underline) chain.setUnderline();
                        if (strike) chain.setStrike();

                        applyingStoredMarksRef.current = true;
                        chain.run();

                        // Force focus to ensure cursor is positioned correctly
                        setTimeout(() => {
                            if (editor && !editor.isFocused) {
                                editor.commands.focus();
                            }
                        }, 10);
                    }
                }, 0);
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
                    smartLayoutItemId,
                    tiptapRefs,
                    standardEnterBehavior,
                    isHideSlashMenu,
                    editor,
                    initialStyle: extractedStyles,
                }),
            });
        }
    }, [editor, elementId, isHideSlashMenu, layoutId, onAddElement, onBackspacePressed, onDeletePressed, onEnterPressed, placeholder, presentationId, slideId, smartLayoutItemId, standardEnterBehavior, tiptapRefs, extractedStyles, extractStylesFromInitialContent]);

    // Update editor content when initialContent changes (including undo/redo operations)
    useEffect(() => {
        if (editor && initialContent) {
            const currentContent = editor.getHTML();
            // Only update if content actually changed to avoid cursor position issues
            if (currentContent !== initialContent) {
                editor.commands.setContent(initialContent, false);
                
                // Update lastStyleRef with styles from new content
                const newExtractedStyles = extractStylesFromInitialContent(initialContent);
                if (newExtractedStyles) {
                    lastStyleRef.current = newExtractedStyles;
                    
                    // Update CustomPlaceholderExtension with new styles
                    if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
                        editor.commands.updatePlaceholderStyle(newExtractedStyles);
                    }
                }
            }
        }
    }, [editor, initialContent]);

    // Initialize CustomPlaceholderExtension with styles from initialContent
    useEffect(() => {
        if (!editor) return;

        // Initialize placeholder extension with styles from initialContent or default styles
        if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
            editor.commands.updatePlaceholderStyle(lastStyleRef.current);
        }
    }, [editor]);

    // Update editor classes based on stored styles when empty
    useEffect(() => {
        if (!editor) return;

        const updateEditorClasses = () => {
            const editorElement = editor.view.dom as HTMLElement;
            if (!editorElement) return;

            const baseClasses = `${styles.editor} tiptap ProseMirror custom-tiptap-editor no-dropcursor not-prose`;

            if (editor.isEmpty) {
                const { level } = lastStyleRef.current;
                const sizeClasses = getEditorClassFromLevel(level);
                editorElement.className = `${baseClasses} ${sizeClasses}`;
            } else {
                editorElement.className = baseClasses;
            }
        };

        // Update classes immediately
        updateEditorClasses();

        const handleUpdate = () => {
            if (applyingStoredMarksRef.current) {
                applyingStoredMarksRef.current = false;
                return;
            }

            const { empty } = editor.state.selection;

            if (editor.isEmpty) {
                // Update editor classes for placeholder styling
                updateEditorClasses();

                // Update placeholder with current stored styles
                const { level, color, bold, italic, underline, strike } = lastStyleRef.current;

                // Update the custom placeholder extension with stored styles
                if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
                    editor.commands.updatePlaceholderStyle({
                        level,
                        color,
                        bold,
                        italic,
                        underline,
                        strike,
                    });
                }

                // Apply stored marks to empty editor so new text inherits them
                if (level !== undefined || color || bold || italic || underline || strike) {
                    // Use setTimeout to ensure the editor is ready for mark application
                    setTimeout(() => {
                        if (editor && editor.isEmpty) {
                            const chain = editor.chain();

                            // Always set font size, even if it's normal level
                            chain.setFontSize(level);

                            if (color) chain.setColor(color);
                            if (bold) chain.setBold();
                            if (italic) chain.setItalic();
                            if (underline) chain.setUnderline();
                            if (strike) chain.setStrike();

                            applyingStoredMarksRef.current = true;
                            chain.run();
                        }
                    }, 0);
                }
            } else {
                // Reset editor classes when not empty
                updateEditorClasses();

                if (empty) {
                    // Store current styles when cursor is positioned but editor has content
                    const currentLevel = getHeadingLevel(editor);
                    const currentColor = editor.getAttributes('textStyle').color || null;
                    const currentBold = editor.isActive('bold');
                    const currentItalic = editor.isActive('italic');
                    const currentUnderline = editor.isActive('underline');
                    const currentStrike = editor.isActive('strike');

                    const newStyles = {
                        level: currentLevel,
                        color: currentColor,
                        bold: currentBold,
                        italic: currentItalic,
                        underline: currentUnderline,
                        strike: currentStrike,
                    };

                    lastStyleRef.current = newStyles;

                    // Sync with CustomPlaceholderExtension storage
                    if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
                        editor.commands.updatePlaceholderStyle(newStyles);
                    }
                }
            }
        };

        const handleSelectionUpdate = () => {
            // Update stored styles when selection changes (but not when applying stored marks)
            if (!applyingStoredMarksRef.current && !editor.isEmpty) {
                const { empty } = editor.state.selection;
                if (empty) {
                    const currentLevel = getHeadingLevel(editor);
                    const currentColor = editor.getAttributes('textStyle').color || null;
                    const currentBold = editor.isActive('bold');
                    const currentItalic = editor.isActive('italic');
                    const currentUnderline = editor.isActive('underline');
                    const currentStrike = editor.isActive('strike');

                    const newStyles = {
                        level: currentLevel,
                        color: currentColor,
                        bold: currentBold,
                        italic: currentItalic,
                        underline: currentUnderline,
                        strike: currentStrike,
                    };

                    lastStyleRef.current = newStyles;

                    // Sync with CustomPlaceholderExtension storage
                    if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
                        editor.commands.updatePlaceholderStyle(newStyles);
                    }
                }
            }
        };

        const handleBeforeInput = () => {
            // Apply stored styles right before user starts typing in empty editor
            if (editor.isEmpty && !applyingStoredMarksRef.current) {
                // Clear parent element classes immediately to prevent doubling with child span classes
                const editorElement = editor.view.dom as HTMLElement;
                if (editorElement) {
                    const baseClasses = `${styles.editor} tiptap ProseMirror custom-tiptap-editor no-dropcursor not-prose`;
                    editorElement.className = baseClasses;
                }

                const { level, color, bold, italic, underline, strike } = lastStyleRef.current;

                if (level !== undefined || color || bold || italic || underline || strike) {
                    const chain = editor.chain();

                    // Set font size first
                    chain.setFontSize(level);

                    if (color) chain.setColor(color);
                    if (bold) chain.setBold();
                    if (italic) chain.setItalic();
                    if (underline) chain.setUnderline();
                    if (strike) chain.setStrike();

                    applyingStoredMarksRef.current = true;
                    chain.run();

                    // Reset the flag after a short delay
                    setTimeout(() => {
                        applyingStoredMarksRef.current = false;
                    }, 50);
                }
            }
        };

        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', handleSelectionUpdate);

        // Add DOM event listener for beforeinput to catch typing events
        const editorElement = editor.view.dom;
        editorElement.addEventListener('beforeinput', handleBeforeInput);

        return () => {
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', handleSelectionUpdate);
            editorElement.removeEventListener('beforeinput', handleBeforeInput);
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
    if (tiptapRefs?.current && editor) {
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
                } else if (isTempLayout && !isInnerTiptap) {
                    usePresentationStore.getState().deleteLayout(presentationId, slideId, layoutId);
                }
            }

            onBlur?.();
        }
    }, [editor, elementId, hasInteraction, isTempEditor, isTempLayout, isInnerTiptap, layoutId, onBlur, presentationId, slideId]);

    return (
        <div className="not-prose" style={{ position: 'relative', width: '100%' }} data-editor-id={id}>
            {!elementConfig?.customMenu && editor && <CommonBubbleMenu editor={editor} data-element-id={elementId} />}
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
