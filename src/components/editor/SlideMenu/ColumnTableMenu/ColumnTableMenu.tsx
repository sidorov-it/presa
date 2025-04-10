import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiChevronDown,
    BiX,
    BiArrowToLeft,
    BiArrowToRight,
    BiTrash
} from 'react-icons/bi';
import styles from '../SlideMenu.module.css';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';

interface ColumnTableMenuProps {
    slideId?: string;
    layoutId?: string;
    columnId?: string;
    elementId?: string;
    presentationId?: string;
    editor?: Editor;
}

const ColumnTableMenu: React.FC<ColumnTableMenuProps> = ({
    slideId,
    layoutId,
    columnId,
    elementId,
    presentationId,
    editor
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
        if (!editor) return 0;
        
        for (let i = 1; i <= 5; i++) {
            if (editor.isActive('heading', { level: i })) {
                return i;
            }
        }
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

    // Table column operations
    const handleAddColumnLeft = useCallback(() => {
        editor?.chain().focus().addColumnBefore().run();
        closeMenu();
    }, [editor, closeMenu]);

    const handleAddColumnRight = useCallback(() => {
        editor?.chain().focus().addColumnAfter().run();
        closeMenu();
    }, [editor, closeMenu]);

    const handleDeleteColumn = useCallback(() => {
        editor?.chain().focus().deleteColumn().run();
        closeMenu();
    }, [editor, closeMenu]);

    if (!editor) {
        return null;
    }

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
                className={`${styles.slideMenuButton} ${editor.isActive('bold') ? styles.active : ''}`}
                aria-label="Жирный"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleBold()}
            >
                <BiBold size={16} />
            </button>

            <button
                onClick={handleToggleItalic}
                className={`${styles.slideMenuButton} ${editor.isActive('italic') ? styles.active : ''}`}
                aria-label="Курсив"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleToggleItalic()}
            >
                <BiItalic size={16} />
            </button>

            <button
                onClick={handleToggleUnderline}
                className={`${styles.slideMenuButton} ${editor.isActive('underline') ? styles.active : ''}`}
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
