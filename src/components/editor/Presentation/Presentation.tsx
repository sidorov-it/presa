import { TipTapRefs, IPresentation, Slide, Layout } from '@/types';
import SlideEditor from '../SlideEditor';
import { memo, MutableRefObject } from 'react';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow';

interface PresentationProps {
    presentationId: string;
    activeSlideId: string | null;
    onSlideSelect: (slideId: string) => void;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

// Create a SlideEditorWrapper component to handle rendering individual slides
const SlideEditorWrapper = memo(
    ({
        slideId,
        presentationId,
        isSelected,
        onSlideSelect,
        tiptapRefs,
    }: {
        slideId: string;
        presentationId: string;
        isSelected: boolean;
        onSlideSelect: (slideId: string) => void;
        tiptapRefs: MutableRefObject<TipTapRefs>;
    }) => {
        const slideLayoutIds = usePresentationStore(
            useShallow((state: PresentationState) => {
                const presentation = state.presentations.find((p: IPresentation) => p.id === presentationId);
                if (!presentation) return null;
                return (
                    presentation.slides.find((s: Slide) => s.id === slideId)?.layouts.map((l: Layout) => l.id) || null
                );
            })
        );

        if (!slideLayoutIds) return null;

        return (
            <SlideEditor
                tiptapRefs={tiptapRefs}
                slideLayoutIds={slideLayoutIds}
                presentationId={presentationId}
                slideId={slideId}
                handleSelectSlide={onSlideSelect}
                isSelected={isSelected}
            />
        );
    }
);

SlideEditorWrapper.displayName = 'SlideEditorWrapper';

function Presentation({ presentationId, activeSlideId, onSlideSelect, tiptapRefs }: PresentationProps) {
    // Store editor references to avoid recreation

    // Get only the slide IDs instead of full slide data
    // Use a selector factory to avoid creating a new function on each render
    // const slideIdsSelector = useCallback(
    //     (state: PresentationState) => {
    //         const presentation = state.presentations.find(p => p.id === presentationId);
    //         return presentation ? presentation.slides.map(slide => slide.id) : [];
    //     },
    //     [presentationId]
    // );

    const slideIds = usePresentationStore(
        useShallow((state: PresentationState) => {
            const presentation = state.presentations.find(p => p.id === presentationId);
            return presentation ? presentation.slides.map(slide => slide.id) : [];
        })
    );

    return (
        <div style={{ width: '100%' }}>
            {slideIds.map(slideId => (
                <SlideEditorWrapper
                    key={slideId}
                    slideId={slideId}
                    presentationId={presentationId}
                    isSelected={activeSlideId === slideId}
                    onSlideSelect={onSlideSelect}
                    tiptapRefs={tiptapRefs}
                />
            ))}
        </div>
    );
}

export default memo(Presentation);
