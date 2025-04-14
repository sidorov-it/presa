import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
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
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);
    const { closeMenu } = useMenuStore();

    const tableColumnElements = useMenuStore.getState().getTableColumnElements();

    const [headingLevelLocal, setHeadingLevelLocal] = useState<number>(tiptapRefs.current.editors[tableColumnElements[0]?.id]?.editor.getAttributes('heading').level || 0);

    useEffect(() => {
        const editor = tiptapRefs.current.editors[tableColumnElements[0]?.id]?.editor;
        if (editor && !editor.isEmpty) {
            setHeadingLevelLocal(editor.getAttributes('heading').level || 0);
        } else {
            setHeadingLevelLocal(0);
        }
    }, [tableColumnElements, tiptapRefs]);

    const isBoldActive = useMemo(() => {
        return !tableColumnElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('bold') && !editor.isEmpty;
            }
            return false;
        });
    }, [tableColumnElements]);

    const isItalicActive = useMemo(() => {
        return !tableColumnElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('italic') && !editor.isEmpty;
            }
            return true;
        });
    }, [tableColumnElements]);

    const isUnderlineActive = useMemo(() => {
        return !tableColumnElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('underline') && !editor.isEmpty;
            }
            return true;
        });
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

    const getCurrentHeadingLevel = useCallback(() => {
        return headingLevelLocal;
    }, [headingLevelLocal]);

    const handleHeadingChange = useCallback((level: number) => {
        tableColumnElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().setHeading({ level: level as Level }).run();
        });

        setHeadingLevelLocal(level);
    }, [tableColumnElements, tiptapRefs]);

    const handleToggleBold = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isBoldActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetBold().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setBold().blur().run();
                }
            }
        });
    }, [tableColumnElements, isBoldActive, tiptapRefs]);

    const handleToggleItalic = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isItalicActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetItalic().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setItalic().blur().run();
                }
            }
        });
    }, [tableColumnElements, isItalicActive, tiptapRefs]);

    const handleToggleUnderline = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isUnderlineActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetUnderline().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setUnderline().blur().run();
                }
            }
        });
    }, [tableColumnElements, isUnderlineActive, tiptapRefs]);

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

            <ColorPicker
                editors={tableColumnElements.map(element => tiptapRefs.current.editors[element.id]?.editor)}
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
