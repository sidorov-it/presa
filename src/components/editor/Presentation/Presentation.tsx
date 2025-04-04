import { TipTapRefs, PresentationState } from "@/types";
import SlideEditor from "../SlideEditor";
import { useRef, memo } from "react";
import { usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow'

interface PresentationProps {
    presentationId: string;
    activeSlideId: string | null;
    onSlideSelect: (slideId: string) => void;
}

// Create a SlideEditorWrapper component to handle rendering individual slides
const SlideEditorWrapper = memo(({
    slideId,
    presentationId,
    isSelected,
    onSlideSelect,
    tiptapRefs
}: {
    slideId: string;
    presentationId: string;
    isSelected: boolean;
    onSlideSelect: (slideId: string) => void;
    tiptapRefs: React.RefObject<TipTapRefs>;
}) => {
    // Get only the specific slide data this component needs
    // Use a selector factory to avoid creating new functions on each render
    // const slideSelector = useCallback(
    //     (state: PresentationState) => {
    //         const presentation = state.presentations.find(p => p.id === presentationId);
    //         if (!presentation) return null;
    //         return presentation.slides.find(s => s.id === slideId) || null;
    //     },
    //     [presentationId, slideId]
    // );

    const slide = usePresentationStore(useShallow((state: PresentationState) => {
        const presentation = state.presentations.find(p => p.id === presentationId);
        if (!presentation) return null;
        return presentation.slides.find(s => s.id === slideId) || null;
    }));

    if (!slide) return null;

    return (
        <SlideEditor
            tiptapRefs={tiptapRefs}
            slide={slide}
            presentationId={presentationId}
            handleSelectSlide={onSlideSelect}
            isSelected={isSelected}
        />
    );
});

SlideEditorWrapper.displayName = 'SlideEditorWrapper';

function Presentation({
    presentationId,
    activeSlideId,
    onSlideSelect
}: PresentationProps) {
    // Store editor references to avoid recreation
    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: []
    });

    // Get only the slide IDs instead of full slide data
    // Use a selector factory to avoid creating a new function on each render
    // const slideIdsSelector = useCallback(
    //     (state: PresentationState) => {
    //         const presentation = state.presentations.find(p => p.id === presentationId);
    //         return presentation ? presentation.slides.map(slide => slide.id) : [];
    //     },
    //     [presentationId]
    // );

    const slideIds = usePresentationStore(useShallow((state: PresentationState) => {
        const presentation = state.presentations.find(p => p.id === presentationId);
        return presentation ? presentation.slides.map(slide => slide.id) : [];
    }));

    return (
        <div className="w-full">
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