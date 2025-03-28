"use client"

import React from 'react';
import { Editor } from '@tiptap/react';

interface BubbleMenuProps {
    editor: Editor;
}

const HeadingBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleBold = () => {
        editor.chain().focus().toggleBold().run();editor.isActive
    };

    const handleItalic = () => {
        editor.chain().focus().toggleItalic().run();
    };

    const handleH1 = () => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
    };

    const handleH2 = () => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
    };

    return (
        <div className="bg-white shadow-lg rounded-md p-2 flex gap-2">
            <button
                onClick={handleH1}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                aria-label="Heading 1"
            >
                H1
            </button>
            <button
                onClick={handleH2}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                aria-label="Heading 2"
            >
                H2
            </button>
            <button
                onClick={handleBold}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                aria-label="Bold"
            >
                Жирный
            </button>
            <button
                onClick={handleItalic}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                aria-label="Italic"
            >
                Курсив
            </button>
        </div>
    );
};

export default HeadingBubbleMenu; 