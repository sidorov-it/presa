'use client';

import React from 'react';
import { Editor } from '@tiptap/react';

interface BubbleMenuProps {
    editor: Editor;
}

const QuoteBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleToggleQuote = () => {
        editor.chain().focus().toggleBlockquote().run();
    };

    const handleBold = () => {
        editor.chain().focus().toggleBold().run();
    };

    const handleItalic = () => {
        editor.chain().focus().toggleItalic().run();
    };

    return (
        <div className="bg-white shadow-lg rounded-md p-2 flex gap-2">
            <button
                onClick={handleToggleQuote}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
                aria-label="Цитата"
            >
                Цитата
            </button>
            <button
                onClick={handleBold}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                aria-label="Жирный"
            >
                Жирный
            </button>
            <button
                onClick={handleItalic}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                aria-label="Курсив"
            >
                Курсив
            </button>
        </div>
    );
};

export default QuoteBubbleMenu;
