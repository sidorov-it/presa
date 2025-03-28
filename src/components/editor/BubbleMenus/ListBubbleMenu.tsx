"use client"

import React from 'react';
import { Editor } from '@tiptap/react';

interface BubbleMenuProps {
    editor: Editor;
}

const ListBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleBulletList = () => {
        editor.chain().focus().toggleBulletList().run();
    };

    const handleOrderedList = () => {
        editor.chain().focus().toggleOrderedList().run();
    };

    const handleTaskList = () => {
        editor.chain().focus().toggleTaskList().run();
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
                onClick={handleBulletList}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                aria-label="Bullet list"
            >
                Маркированный
            </button>
            <button
                onClick={handleOrderedList}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                aria-label="Ordered list"
            >
                Нумерованный
            </button>
            <button
                onClick={handleTaskList}
                className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('taskList') ? 'bg-gray-200' : ''}`}
                aria-label="Task list"
            >
                Задачи
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

export default ListBubbleMenu; 