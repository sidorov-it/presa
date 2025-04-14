import React, { useState, useRef, useEffect, useCallback, MutableRefObject, useMemo } from 'react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiX,
    BiArrowToTop,
    BiArrowToBottom,
    BiTrash
} from 'react-icons/bi';
import styles from './TableMenu.module.css';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import { Level } from '@tiptap/extension-heading';
interface TableMenuProps {
    slideId?: string;
    layoutId?: string;
    elementId?: string;
    presentationId?: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    position: { x: number, y: number };
}

const TableMenu: React.FC<TableMenuProps> = ({
    slideId,
    layoutId,
    presentationId,
    tiptapRefs,
    position
}) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableFirstElement = useMenuStore.getState().getTableFirstElement();
    const [headingLevelLocal, setHeadingLevelLocal] = useState<number>(tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.getAttributes('heading').level : 0);

    useEffect(() => {
        const editor = tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor : null;
        if (editor && !editor.isEmpty) {
            setHeadingLevelLocal(editor.getAttributes('heading').level || 0);
        } else {
            setHeadingLevelLocal(0);
        }
    }, [tableFirstElement, tiptapRefs]);

    const isBoldActive = useMemo(() => {
        return tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.isActive('bold') : false;
    }, [tableFirstElement]);

    const isItalicActive = useMemo(() => {
        return tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.isActive('italic') : false;
    }, [tableFirstElement]);

    const isUnderlineActive = useMemo(() => {
        return tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.isActive('underline') : false;
    }, [tableFirstElement]);

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
        return headingLevelLocal || 0;
    }, [headingLevelLocal]);

    const handleHeadingChange = useCallback((level: number) => {
        if (tableFirstElement?.id) {
            tiptapRefs.current.editors[tableFirstElement?.id]?.editor.chain().setHeading({ level: level as Level }).run();
        }

        setHeadingLevelLocal(level);
    }, [tableFirstElement, tiptapRefs]);

    const handleToggleBold = useCallback(() => {
        if (tableFirstElement?.id) {
            const editor = tiptapRefs.current.editors[tableFirstElement?.id]?.editor;
            if (editor) {
                if (isBoldActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetBold().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setBold().blur().run();
                }
            }
        }
    }, [tableFirstElement, isBoldActive, tiptapRefs]);

    const handleToggleItalic = useCallback(() => {
        if (tableFirstElement?.id) {
            const editor = tiptapRefs.current.editors[tableFirstElement?.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleItalic().blur().run();
            }
        }
    }, [tableFirstElement, tiptapRefs]);

    const handleToggleUnderline = useCallback(() => {
        if (tableFirstElement?.id) {
            const editor = tiptapRefs.current.editors[tableFirstElement?.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleUnderline().blur().run();
            }
        }
    }, [tableFirstElement, tiptapRefs]);

    const handleClearStyles = useCallback(() => {
        if (tableFirstElement?.id) {
            tiptapRefs.current.editors[tableFirstElement?.id]?.editor.chain().clearNodes().unsetAllMarks().run();
        }
    }, [tableFirstElement, tiptapRefs]);


    // Table row operations
    const handleAddRowAbove = useCallback(() => {
        // usePresentationStore.getState().addRowToTable(presentationId!, slideId!, layoutId!, tableRowIndex!);
        useMenuStore.getState().closeMenu();
    }, []);

    const handleAddRowBelow = useCallback(() => {
        // usePresentationStore.getState().addRowToTable(presentationId!, slideId!, layoutId!, tableRowIndex! + 1);
        useMenuStore.getState().closeMenu();
    }, []);

    const handleDeleteRow = useCallback(() => {
        // usePresentationStore.getState().deleteRowFromTable(presentationId!, slideId!, layoutId!, tableRowIndex!);
        useMenuStore.getState().closeMenu();
    }, []);

    return (
        <div className={`${styles.layoutMenu} layout-menu`} style={{
            top: position.y
        }}>
            <HeadingSelector
                headingMenuRef={headingMenuRef}
                isHeadingMenuOpen={isHeadingMenuOpen}
                setIsHeadingMenuOpen={setIsHeadingMenuOpen}
                getCurrentHeadingLevel={getCurrentHeadingLevel}
                handleHeadingChange={handleHeadingChange}
                lightThemeStyle={lightThemeStyle}
            />

            <ColorPicker
                editor={tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor : null}
                className={bubbleStyles.button}
            />

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
                onClick={handleAddRowAbove}
                className={styles.slideMenuButton}
                aria-label="Добавить строку сверху"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRowAbove()}
            >
                <BiArrowToTop size={16} />
            </button>

            <button
                onClick={handleAddRowBelow}
                className={styles.slideMenuButton}
                aria-label="Добавить строку снизу"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleAddRowBelow()}
            >
                <BiArrowToBottom size={16} />
            </button>

            <button
                onClick={handleDeleteRow}
                className={`${styles.slideMenuButton} ${styles.removeButton}`}
                aria-label="Удалить строку"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleDeleteRow()}
            >
                <BiTrash size={16} />
            </button>
        </div>
    );
};

export default TableMenu;
