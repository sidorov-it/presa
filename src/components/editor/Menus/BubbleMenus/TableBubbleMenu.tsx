'use client';

import React from 'react';
import { Editor } from '@tiptap/react';

interface BubbleMenuProps {
    editor: Editor;
}

const TableBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleAddColumnBefore = () => {
        editor.chain().focus().addColumnBefore().run();
    };

    const handleAddColumnAfter = () => {
        editor.chain().focus().addColumnAfter().run();
    };

    const handleAddRowBefore = () => {
        editor.chain().focus().addRowBefore().run();
    };

    const handleAddRowAfter = () => {
        editor.chain().focus().addRowAfter().run();
    };

    const handleDeleteColumn = () => {
        editor.chain().focus().deleteColumn().run();
    };

    const handleDeleteRow = () => {
        editor.chain().focus().deleteRow().run();
    };

    return (
        <div className="bg-white shadow-lg rounded-md p-2 flex flex-wrap gap-2">
            <button
                onClick={handleAddColumnBefore}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Добавить столбец до"
            >
                Добавить столбец до
            </button>
            <button
                onClick={handleAddColumnAfter}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Добавить столбец после"
            >
                Добавить столбец после
            </button>
            <button onClick={handleAddRowBefore} className="p-1 hover:bg-gray-100 rounded" aria-label="Добавить строку до">
                Добавить строку до
            </button>
            <button onClick={handleAddRowAfter} className="p-1 hover:bg-gray-100 rounded" aria-label="Добавить строку после">
                Добавить строку после
            </button>
            <button
                onClick={handleDeleteColumn}
                className="p-1 hover:bg-gray-100 rounded text-red-500"
                aria-label="Удалить столбец"
            >
                Удалить столбец
            </button>
            <button
                onClick={handleDeleteRow}
                className="p-1 hover:bg-gray-100 rounded text-red-500"
                aria-label="Удалить строку"
            >
                Удалить строку
            </button>
        </div>
    );
};

export default TableBubbleMenu;
