'use client';

import React from 'react';
import { Editor } from '@tiptap/react';

import styles from './DefaultBubbleMenu.module.css';

interface BubbleMenuProps {
    editor: Editor;
}

const DefaultBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleBold = () => {
        editor.chain().focus().toggleBold().run();
    };

    const handleItalic = () => {
        editor.chain().focus().toggleItalic().run();
    };

    return (
        <div className={styles.defaultBubbleMenu}>
            <button
                onClick={handleBold}
                className={`${styles.defaultBubbleMenuButton} ${editor.isActive('bold') ? styles.activeButton : ''}`}
                aria-label="Bold"
            >
                Жирный
            </button>
            <button
                onClick={handleItalic}
                className={`${styles.defaultBubbleMenuButton} ${editor.isActive('italic') ? styles.activeButton : ''}`}
                aria-label="Italic"
            >
                Курсив
            </button>
        </div>
    );
};

export default DefaultBubbleMenu;
