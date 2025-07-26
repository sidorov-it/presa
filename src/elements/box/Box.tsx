import { RefObject } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePresentationStore } from '@/store/presentationStore';
import { useThemeStore } from '@/store/themeStore';
import { BoxElement, TipTapRefs } from '@/types';
import BoxComponent from './BoxComponent';

interface BoxProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    dragHandleRef?: RefObject<HTMLDivElement>;
    slideBackground?: string;
}

export default function Box({
    elementId,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    dragHandleRef,
    slideBackground,
}: BoxProps) {
    const element = usePresentationStore(
        useShallow(state => state.getElement(presentationId, slideId, layoutId, elementId) as BoxElement)
    );
    const updateElement = usePresentationStore(state => state.updateElement);
    const currentTheme = useThemeStore(state => state.currentTheme);

    return (
        <BoxComponent
            element={element}
            presentationId={presentationId}
            slideId={slideId}
            layoutId={layoutId}
            tiptapRefs={tiptapRefs}
            dragHandleRef={dragHandleRef}
            theme={currentTheme}
            slideBackground={slideBackground}
            onContentChange={content =>
                updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: { content },
                    createHistoryEntry: true,
                    isTextElement: true,
                })
            }
        />
    );
}
