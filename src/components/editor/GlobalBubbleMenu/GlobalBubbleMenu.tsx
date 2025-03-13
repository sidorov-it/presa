"use client"

import React, { useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';

const GlobalBubbleMenu: React.FC = () => {
  const { activeEditor, showBubbleMenu, hideMenu } = useEditorStore();

  // Hide bubble menu when clicking outside
  useEffect(() => {
    if (showBubbleMenu) {
      const handleClickOutside = (e: MouseEvent) => {
        // Don't hide if clicking on the editor or the bubble menu itself
        const target = e.target as HTMLElement;
        if (target.closest('.tiptap-editor-wrapper') || target.closest('.bubble-menu')) {
          return;
        }
        hideMenu();
      };
      
    //   document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showBubbleMenu, hideMenu]);

  if (!activeEditor || !showBubbleMenu) {
    return null;
  }

  return (
    <BubbleMenu 
      editor={activeEditor} 
      tippyOptions={{ duration: 100 }}
      className="bubble-menu"
      shouldShow={() => showBubbleMenu}
    >
      <div className="bg-white shadow-lg rounded-md p-2 flex gap-2">
        <button
          onClick={() => activeEditor.chain().focus().toggleBold().run()}
          className={`p-1 hover:bg-gray-100 rounded ${activeEditor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          Жирный
        </button>
        <button
          onClick={() => activeEditor.chain().focus().toggleItalic().run()}
          className={`p-1 hover:bg-gray-100 rounded ${activeEditor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          Курсив
        </button>
      </div>
    </BubbleMenu>
  );
};

export default GlobalBubbleMenu; 