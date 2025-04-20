'use client';

import React from 'react';
import { Editor } from '@tiptap/react';
import styles from './ButtonBubbleMenu.module.css';
interface BubbleMenuProps {
    editor: Editor;
}

const ButtonBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleBold = () => {
        editor.chain().focus().toggleBold().run();
    };

    const handleItalic = () => {
        editor.chain().focus().toggleItalic().run();
    };

    return (
        <div className={styles.buttonBubbleMenu}>
            <button
                onClick={handleBold}
                className={`${styles.buttonBubbleMenuButton} ${editor.isActive('bold') ? styles.activeButton : ''}`}
                aria-label="Bold"
            >
                Жирный
            </button>
            <button
                onClick={handleItalic}
                className={`${styles.buttonBubbleMenuButton} ${editor.isActive('italic') ? styles.activeButton : ''}`}
                aria-label="Italic"
            >
                Курсив
            </button>
        </div>
    );
};

export default ButtonBubbleMenu;
