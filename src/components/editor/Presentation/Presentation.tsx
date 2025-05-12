import { TipTapRefs, IPresentation, Slide, Layout } from '@/types';
import SlideEditor from '../SlideEditor';
import { memo, MutableRefObject } from 'react';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import styles from './Presentation.module.css';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
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
        const isReadOnly = useReadOnly();
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
                isSelected={isSelected && !isReadOnly}
            />
        );
    }
);

SlideEditorWrapper.displayName = 'SlideEditorWrapper';

function Presentation({ presentationId, activeSlideId, onSlideSelect, tiptapRefs }: PresentationProps) {
    const isReadOnly = useReadOnly();

    const slideIds = usePresentationStore(
        useShallow((state: PresentationState) => {
            const presentation = state.presentations.find(p => p.id === presentationId);
            return presentation ? presentation.slides.map(slide => slide.id) : [];
        })
    );

    return (
        <div className={styles.presentation}>
            {!isReadOnly && slideIds.length === 0 && (
                <div className={styles.emptyContainer}>
                    <Button onClick={() => usePresentationStore.getState().addSlide(presentationId)}>
                        + Добавить слайд
                    </Button>
                </div>
            )}
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
