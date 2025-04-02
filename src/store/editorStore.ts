import { create } from 'zustand';
import { Editor } from '@tiptap/react';
import { devtools } from 'zustand/middleware'

interface EditorState {
    // Current active editor
    activeEditor: Editor | null;
    activeEditorId: string | null | undefined;
    // Whether the bubble menu should be shown
    showBubbleMenu: boolean;
    // Reference to the trigger element that was clicked
    triggerElement: HTMLElement | null;
    // Position of the bubble menu
    menuPosition: { x: number, y: number } | null;
    // Type of the active element
    activeElementType: string | null;
    // Element that should be focused next
    elementToFocus: {
        elementId: string;
        layoutId: string;
        cellId: string;
    } | null;

    // Actions
    getActiveEditorId: () => string | null | undefined;
    setActiveEditor: (editor: Editor | null, elementId?: string) => void;
    showMenu: (triggerElement: HTMLElement, elementType?: string) => void;
    hideMenu: () => void;
    setElementToFocus: (elementId: string, layoutId: string, cellId: string) => void;
    clearElementToFocus: () => void;
}

export const useEditorStore = create<EditorState>()(
    devtools(
        (set, get) => ({
            activeEditor: null,
            showBubbleMenu: false,
            triggerElement: null,
            menuPosition: null,
            activeElementType: null,
            elementToFocus: null,

            getActiveEditorId: () => get().activeEditorId,
            setActiveEditor: (editor, elementId = undefined) => set({ activeEditor: editor, activeEditorId: elementId }),

            showMenu: (triggerElement, elementType = undefined) => {
                // Calculate position based on the trigger element
                const rect = triggerElement.getBoundingClientRect();
                const menuPosition = {
                    x: rect.left + rect.width / 2, // Center horizontally
                    y: rect.top - 10 // Position slightly above the trigger
                };

                set({
                    showBubbleMenu: true,
                    triggerElement,
                    menuPosition,
                    activeElementType: elementType || null
                });
            },

            hideMenu: () => set({
                showBubbleMenu: false,
                triggerElement: null,
                menuPosition: null,
                activeElementType: null
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