import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BaseElement } from '@/types';

interface ClipboardState {
    element: BaseElement | null;
    setElement: (element: BaseElement | null) => void;
}

export const useClipboardStore = create<ClipboardState>()(
    devtools(
        set => ({
            element: null,
            setElement: element => set({ element }),
        }),
        {
            name: 'clipboard-store',
            enabled: process.env.NODE_ENV === 'development',
        }
    )
);
