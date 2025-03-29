"use client"

import React from 'react';
import { Editor } from '@tiptap/react';
import { BiAlignLeft, BiAlignMiddle, BiAlignRight, BiAlignJustify, BiX } from 'react-icons/bi';
import { FaInfoCircle, FaExclamationTriangle, FaExclamationCircle, FaCheck, FaQuestion, FaBook, FaBox } from 'react-icons/fa';

interface BubbleMenuProps {
    editor: Editor;
}

const BoxBubbleMenu: React.FC<BubbleMenuProps> = ({ editor }) => {
    const handleBold = () => {
        editor.chain().focus().toggleBold().run();
    };

    const handleItalic = () => {
        editor.chain().focus().toggleItalic().run();
    };

    const handleCode = () => {
        editor.chain().focus().toggleCode().run();
    };

    const handleAlignment = (alignment: 'left' | 'center' | 'right' | 'justify') => {
        editor.chain().focus().setTextAlign(alignment).run();
    };

    const handleClearStyles = () => {
        editor.chain().focus().unsetAllMarks().run();
    };

    const changeBoxType = (boxType: string) => {
        // First get the current content of the node
        const content = editor.getHTML();
        const wrappedContent = content.replace(/<div[^>]*>|<\/div>/g, '');

        // Replace the current node with the new box type
        editor.chain().focus().clearContent().run();
        
        // Insert with the new box type
        let newContent = '';
        switch (boxType) {
            case 'box':
                newContent = `<div data-type="box" class="box">${wrappedContent}</div>`;
                break;
            case 'note-box':
                newContent = `<div data-type="note-box" class="note-box">${wrappedContent}</div>`;
                break;
            case 'info-box':
                newContent = `<div data-type="info-box" class="info-box">${wrappedContent}</div>`;
                break;
            case 'warning-box':
                newContent = `<div data-type="warning-box" class="warning-box">${wrappedContent}</div>`;
                break;
            case 'caution-box':
                newContent = `<div data-type="caution-box" class="caution-box">${wrappedContent}</div>`;
                break;
            case 'success-box':
                newContent = `<div data-type="success-box" class="success-box">${wrappedContent}</div>`;
                break;
            case 'question-box':
                newContent = `<div data-type="question-box" class="question-box">${wrappedContent}</div>`;
                break;
            default:
                newContent = `<div data-type="box" class="box">${wrappedContent}</div>`;
                break;
        }
        
        editor.chain().focus().insertContent(newContent).run();
    };

    const isBoxType = (boxType: string): boolean => {
        // Try to determine if current node is of the given box type
        const content = editor.getHTML();
        const regex = new RegExp(`data-type=["']${boxType}["']`, 'i');
        return regex.test(content);
    };

    return (
        <div className="bg-white shadow-lg rounded-md p-2 flex flex-wrap gap-2">
            {/* Text styling controls */}
            <div className="flex gap-1 mr-2 border-r pr-2">
                <button
                    onClick={handleBold}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                    aria-label="Bold"
                >
                    <span className="font-bold">Ж</span>
                </button>
                <button
                    onClick={handleItalic}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                    aria-label="Italic"
                >
                    <span className="italic">К</span>
                </button>
                <button
                    onClick={handleCode}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive('code') ? 'bg-gray-200' : ''}`}
                    aria-label="Code"
                >
                    <span className="font-mono">{'</>'}</span>
                </button>
            </div>

            {/* Box type selection */}
            <div className="flex gap-1 mr-2 border-r pr-2">
                <button
                    onClick={() => changeBoxType('box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('box') ? 'bg-gray-200' : ''}`}
                    aria-label="Standard Box"
                    title="Стандартный блок"
                >
                    <FaBox size={16} />
                </button>
                <button
                    onClick={() => changeBoxType('note-box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('note-box') ? 'bg-gray-200' : ''}`}
                    aria-label="Note Box"
                    title="Блок с заметкой"
                >
                    <FaBook size={16} />
                </button>
                <button
                    onClick={() => changeBoxType('info-box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('info-box') ? 'bg-gray-200' : ''}`}
                    aria-label="Info Box"
                    title="Блок с информацией"
                >
                    <FaInfoCircle size={16} />
                </button>
                <button
                    onClick={() => changeBoxType('warning-box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('warning-box') ? 'bg-gray-200' : ''}`}
                    aria-label="Warning Box"
                    title="Блок с предупреждением"
                >
                    <FaExclamationTriangle size={16} />
                </button>
                <button
                    onClick={() => changeBoxType('caution-box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('caution-box') ? 'bg-gray-200' : ''}`}
                    aria-label="Caution Box"
                    title="Блок с предостережением"
                >
                    <FaExclamationCircle size={16} />
                </button>
                <button
                    onClick={() => changeBoxType('success-box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('success-box') ? 'bg-gray-200' : ''}`}
                    aria-label="Success Box"
                    title="Блок с успехом"
                >
                    <FaCheck size={16} />
                </button>
                <button
                    onClick={() => changeBoxType('question-box')}
                    className={`p-1 hover:bg-gray-100 rounded ${isBoxType('question-box') ? 'bg-gray-200' : ''}`}
                    aria-label="Question Box"
                    title="Блок с вопросом"
                >
                    <FaQuestion size={16} />
                </button>
            </div>

            {/* Alignment options */}
            <div className="flex gap-1 mr-2">
                <button
                    onClick={() => handleAlignment('left')}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
                    aria-label="Align Left"
                    title="По левому краю"
                >
                    <BiAlignLeft size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('center')}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
                    aria-label="Align Center"
                    title="По центру"
                >
                    <BiAlignMiddle size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('right')}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
                    aria-label="Align Right"
                    title="По правому краю"
                >
                    <BiAlignRight size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('justify')}
                    className={`p-1 hover:bg-gray-100 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}`}
                    aria-label="Justify"
                    title="По ширине"
                >
                    <BiAlignJustify size={16} />
                </button>
            </div>

            {/* Clear styles */}
            <button
                onClick={handleClearStyles}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="Clear Formatting"
                title="Очистить форматирование"
            >
                <BiX size={16} />
            </button>
        </div>
    );
};

export default BoxBubbleMenu; 