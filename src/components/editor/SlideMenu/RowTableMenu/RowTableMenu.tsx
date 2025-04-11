import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiChevronDown,
    BiX,
    BiArrowToTop,
    BiArrowToBottom,
    BiTrash
} from 'react-icons/bi';
import styles from '../SlideMenu.module.css';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { usePresentationStore } from '@/store/presentationStore';

interface RowTableMenuProps {
    slideId?: string;
    layoutId?: string;
    columnId?: string;
    elementId?: string;
    tableRowIndex?: number;
    presentationId?: string;
    editor?: Editor;
}

const RowTableMenu: React.FC<RowTableMenuProps> = ({
    slideId,
    layoutId,
    columnId,
    elementId,
    presentationId,
    editor,
    tableRowIndex
}) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);
    const { closeMenu } = useSlideMenu();

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

        return 0; // Default to paragraph
    }, [editor]);

    // Handle heading change
    const handleHeadingChange = useCallback((level: number) => {
        if (!editor) return;
        
        if (level === 0) {
            editor.chain().focus().setParagraph().run();
        } else {
            editor.chain().focus().setHeading({ level }).run();
        }
        setIsHeadingMenuOpen(false);
    }, [editor]);

    // Handle text formatting
    const handleToggleBold = useCallback(() => {
        editor?.chain().focus().toggleBold().run();
    }, [editor]);

    const handleToggleItalic = useCallback(() => {
        editor?.chain().focus().toggleItalic().run();
    }, [editor]);

    const handleToggleUnderline = useCallback(() => {
        editor?.chain().focus().toggleUnderline().run();
    }, [editor]);

    const handleClearStyles = useCallback(() => {
        editor?.chain().focus().clearNodes().unsetAllMarks().run();
    }, [editor]);

    // Table row operations
    const handleAddRowAbove = useCallback(() => {
        usePresentationStore.getState().addRowToTable(presentationId!, slideId!, layoutId!, tableRowIndex!);
        closeMenu();
    }, [editor, closeMenu]);

    const handleAddRowBelow = useCallback(() => {
        usePresentationStore.getState().addRowToTable(presentationId!, slideId!, layoutId!, tableRowIndex! + 1);
        closeMenu();
    }, [editor, closeMenu]);

    const handleDeleteRow = useCallback(() => {
        usePresentationStore.getState().deleteRowFromTable(presentationId!, slideId!, layoutId!, tableRowIndex!);
        closeMenu();
    }, [editor, closeMenu]);

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
                editor={editor}
                className={bubbleStyles.button}
            />

            <button
                onClick={handleToggleBold}
                className={`${styles.slideMenuButton}`}
                aria-label="Жирный"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleBold()}
            >
                <BiBold size={16} />
            </button>

            <button
                onClick={handleToggleItalic}
                className={`${styles.slideMenuButton}`}
                aria-label="Курсив"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleItalic()}
            >
                <BiItalic size={16} />
            </button>

            <button
                onClick={handleToggleUnderline}
                className={`${styles.slideMenuButton}`}
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
