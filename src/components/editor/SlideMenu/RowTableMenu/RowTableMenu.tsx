import React, { useState, useRef, useEffect, useCallback, MutableRefObject, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiX,
    BiArrowToTop,
    BiArrowToBottom,
    BiTrash
} from 'react-icons/bi';
import styles from '../SlideMenu.module.css';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
interface RowTableMenuProps {
    slideId?: string;
    layoutId?: string;
    elementId?: string;
    tableRowIndex?: number;
    presentationId?: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const RowTableMenu: React.FC<RowTableMenuProps> = ({
    slideId,
    layoutId,
    presentationId,
    tableRowIndex,
    tiptapRefs
}) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableRowElements = useMenuStore.getState().getTableRowElements();
    const [headingLevelLocal, setHeadingLevelLocal] = useState<number>(tiptapRefs.current.editors[tableRowElements[0].id]?.editor.getAttributes('heading').level || 0);

    useEffect(() => {
        const editor = tiptapRefs.current.editors[tableRowElements[0].id]?.editor;
        if (editor && !editor.isEmpty) {
            setHeadingLevelLocal(editor.getAttributes('heading').level);
        } else {
            setHeadingLevelLocal(0);
        }
    }, [tableRowElements, tiptapRefs]);

    const isBoldActive = useMemo(() => {
        return !tableRowElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('bold') && !editor.isEmpty;
            }
            return false;
        });
    }, [tableRowElements]);

    const isItalicActive = useMemo(() => {
        return !tableRowElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('italic') && !editor.isEmpty;
            }
            return true;
        });
    }, [tableRowElements]);

    const isUnderlineActive = useMemo(() => {
        return !tableRowElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('underline') && !editor.isEmpty;
            }
            return true;
        });
    }, [tableRowElements]);

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
        return headingLevelLocal;
    }, [headingLevelLocal]);

    const handleHeadingChange = useCallback((level: number) => {
        tableRowElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().setHeading({ level: level as Level }).run();
        });

        setHeadingLevelLocal(level);
    }, [tableRowElements, tiptapRefs]);

    const handleToggleBold = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isBoldActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetBold().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setBold().blur().run();
                }
            }
        });
    }, [tableRowElements, isBoldActive, tiptapRefs]);

    const handleToggleItalic = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleItalic().blur().run();
            }
        });
    }, [tableRowElements, tiptapRefs]);

    const handleToggleUnderline = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleUnderline().blur().run();
            }
        });
    }, [tableRowElements, tiptapRefs]);

    const handleClearStyles = useCallback(() => {
        tableRowElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().clearNodes().unsetAllMarks().run();
        });
    }, [tableRowElements, tiptapRefs]);


    // Table row operations
    const handleAddRowAbove = useCallback(() => {
        usePresentationStore.getState().addRowToTable(presentationId!, slideId!, layoutId!, tableRowIndex!);
        useMenuStore.getState().closeMenu();
    }, []);

    const handleAddRowBelow = useCallback(() => {
        usePresentationStore.getState().addRowToTable(presentationId!, slideId!, layoutId!, tableRowIndex! + 1);
        useMenuStore.getState().closeMenu();
    }, []);

    const handleDeleteRow = useCallback(() => {
        usePresentationStore.getState().deleteRowFromTable(presentationId!, slideId!, layoutId!, tableRowIndex!);
        useMenuStore.getState().closeMenu();
    }, []);

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
        </>
    );
};

export default RowTableMenu;
