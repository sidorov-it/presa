import { create } from 'zustand';
import { Editor } from '@tiptap/react';
import { devtools } from 'zustand/middleware'

interface EditorState {
  // Current active editor
  activeEditor: Editor | null;
  // Whether the bubble menu should be shown
  showBubbleMenu: boolean;
  // Reference to the trigger element that was clicked
  triggerElement: HTMLElement | null;
  // Position of the bubble menu
  menuPosition: { x: number, y: number } | null;
  // Element that should be focused next
  elementToFocus: {
    elementId: string;
    layoutId: string;
    cellId: string;
  } | null;
  
  // Actions
  setActiveEditor: (editor: Editor | null) => void;
  showMenu: (triggerElement: HTMLElement) => void;
  hideMenu: () => void;
  setElementToFocus: (elementId: string, layoutId: string, cellId: string) => void;
  clearElementToFocus: () => void;
}

export const useEditorStore = create<EditorState>()(
    devtools(
        (set) => ({
            activeEditor: null,
            showBubbleMenu: false,
            triggerElement: null,
            menuPosition: null,
            elementToFocus: null,
      
            setActiveEditor: (editor) => set({ activeEditor: editor }),
      
            showMenu: (triggerElement) => {
                // Calculate position based on the trigger element
                const rect = triggerElement.getBoundingClientRect();
                const menuPosition = {
                    x: rect.left + rect.width / 2, // Center horizontally
                    y: rect.top - 10 // Position slightly above the trigger
                };
        
                set({ 
                    showBubbleMenu: true, 
                    triggerElement,
                    menuPosition
                });
            },
      
            hideMenu: () => set({ 
                showBubbleMenu: false, 
                triggerElement: null,
                menuPosition: null
            }),

            setElementToFocus: (elementId, layoutId, cellId) => set({
                elementToFocus: { elementId, layoutId, cellId }
            }),

            clearElementToFocus: () => set({ elementToFocus: null }),
        }),
        {
            name: 'editor-store',
            enabled: process.env.NODE_ENV === 'development',
        }
    )
); 