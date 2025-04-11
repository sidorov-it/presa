import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiX,
    BiArrowToLeft,
    BiArrowToRight,
    BiTrash
} from 'react-icons/bi';
import styles from '../SlideMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import { MutableRefObject } from 'react';
import { Level } from '@tiptap/extension-heading';
interface ColumnTableMenuProps {
    slideId?: string;
    layoutId?: string;
    elementId?: string;
    presentationId?: string;
    tableColumnIndex?: number;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const ColumnTableMenu: React.FC<ColumnTableMenuProps> = ({
    slideId,
    layoutId,
    tableColumnIndex,
    presentationId,
    tiptapRefs
}) => {
    const [refresh, setRefresh] = useState(Date.now());

    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);
    const { closeMenu } = useMenuStore();

    const tableColumnElements = useMenuStore.getState().getTableColumnElements();

    const isBoldActive = useMemo(() => {
        return !tableColumnElements.some(element => !tiptapRefs.current.editors[element.id].editor.isActive('bold'));
    }, [tableColumnElements]);

    const isItalicActive = useMemo(() => {
        return !tableColumnElements.some(element => !tiptapRefs.current.editors[element.id].editor.isActive('italic'));
    }, [tableColumnElements]);

    const isUnderlineActive = useMemo(() => {
        return !tableColumnElements.some(element => !tiptapRefs.current.editors[element.id].editor.isActive('underline'));
    }, [tableColumnElements]);

    // Light theme styles
    const lightThemeStyle = {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    };

    // Close the heading dropdown menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
                setIsHeadingMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Get current heading level from editor
    const getCurrentHeadingLevel = useCallback(() => {
        return 0;
    }, []);

    // Handle heading change
    const handleHeadingChange = useCallback((level: number) => {
        tableColumnElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().setHeading({ level: level as Level }).run();
        });
    }, [tableColumnElements, tiptapRefs]);

    // Handle text formatting
    const handleToggleBold = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                const content = editor.getHTML();
                if (isBoldActive) {
                    // Remove bold from all content
                    editor.commands.setContent(content.replace(/<strong>/g, '').replace(/<\/strong>/g, ''));
                } else {
                    // Add bold to all content
                    editor.commands.setContent(content.replace(/(<p[^>]*>)(.*?)(<\/p>)/g, '$1<strong>$2</strong>$3'));
                }
            }
        });
    }, [tableColumnElements, isBoldActive, tiptapRefs]);

    const handleToggleItalic = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                const content = editor.getHTML();
                // Toggle italic for all content
                if (content.includes('<em>')) {
                    editor.commands.setContent(content.replace(/<em>/g, '').replace(/<\/em>/g, ''));
                } else {
                    editor.commands.setContent(content.replace(/(<p[^>]*>)(.*?)(<\/p>)/g, '$1<em>$2</em>$3'));
                }
            }
        });
    }, [tableColumnElements, tiptapRefs]);

    const handleToggleUnderline = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                const content = editor.getHTML();
                // Toggle underline for all content
                if (content.includes('<u>')) {
                    editor.commands.setContent(content.replace(/<u>/g, '').replace(/<\/u>/g, ''));
                } else {
                    editor.commands.setContent(content.replace(/(<p[^>]*>)(.*?)(<\/p>)/g, '$1<u>$2</u>$3'));
                }
            }
        });
    }, [tableColumnElements, tiptapRefs]);

    const handleClearStyles = useCallback(() => {
        tableColumnElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().clearNodes().unsetAllMarks().run();
        });
    }, [tableColumnElements, tiptapRefs]);

    // Table column operations
    const handleAddColumnLeft = useCallback(() => {
        if (presentationId && slideId && layoutId && (tableColumnIndex || tableColumnIndex === 0)) {
            usePresentationStore.getState().addColumnToTable(presentationId, slideId, layoutId, tableColumnIndex);
        }
        closeMenu();
    }, [presentationId, slideId, layoutId, tableColumnIndex, closeMenu]);

    const handleAddColumnRight = useCallback(() => {
        if (presentationId && slideId && layoutId && (tableColumnIndex || tableColumnIndex === 0)) {
            usePresentationStore.getState().addColumnToTable(presentationId, slideId, layoutId, tableColumnIndex + 1);
        }
        closeMenu();
    }, [presentationId, slideId, layoutId, tableColumnIndex, closeMenu]);

    const handleDeleteColumn = useCallback(() => {
        if (presentationId && slideId && layoutId && (tableColumnIndex || tableColumnIndex === 0)) {
            usePresentationStore.getState().deleteColumnFromTable(presentationId, slideId, layoutId, tableColumnIndex);
        }
        closeMenu();
    }, [presentationId, slideId, layoutId, tableColumnIndex, closeMenu]);

    return (
        <>
            <HeadingSelector
                headingMenuRef={headingMenuRef}
                isHeadingMenuOpen={isHeadingMenuOpen}
                setIsHeadingMenuOpen={setIsHeadingMenuOpen}
                getCurrentHeadingLevel={getCurrentHeadingLevel}
                handleHeadingChange={handleHeadingChange}
                lightThemeStyle={lightThemeStyle}
            />

            {/* <ColorPicker
                editor={editor}
                className={bubbleStyles.button}
            /> */}

            <button
                onClick={handleToggleBold}
                className={`${styles.slideMenuButton} ${isBoldActive ? styles.active : ''}`}
                aria-label="Жирный"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleBold()}
            >
                <BiBold size={16} />
            </button>

            <button
                onClick={handleToggleItalic}
                className={`${styles.slideMenuButton} ${isItalicActive ? styles.active : ''}`}
                aria-label="Курсив"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleItalic()}
            >
                <BiItalic size={16} />
            </button>

            <button
                onClick={handleToggleUnderline}
                className={`${styles.slideMenuButton} ${isUnderlineActive ? styles.active : ''}`}
                aria-label="Подчеркнутый"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleUnderline()}
            >
                <BiUnderline size={16} />
            </button>

            <button
                onClick={handleClearStyles}
                className={styles.slideMenuButton}
                aria-label="Очистить форматирование"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleClearStyles()}
            >
                <BiX size={16} />
            </button>

            <button
                onClick={handleAddColumnLeft}
                className={styles.slideMenuButton}
                aria-label="Добавить колонку слева"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumnLeft()}
            >
                <BiArrowToLeft size={16} />
            </button>

            <button
                onClick={handleAddColumnRight}
                className={styles.slideMenuButton}
                aria-label="Добавить колонку справа"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddColumnRight()}
            >
                <BiArrowToRight size={16} />
            </button>

            <button
                onClick={handleDeleteColumn}
                className={`${styles.slideMenuButton} ${styles.removeButton}`}
                aria-label="Удалить колонку"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleDeleteColumn()}
            >
                <BiTrash size={16} />
            </button>
        </>
    );
};

export default ColumnTableMenu;
