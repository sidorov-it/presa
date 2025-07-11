import { TipTapRefs, IPresentation, Slide, Layout } from '@/types';
import SlideEditor from '../SlideEditor';
import { memo, MutableRefObject } from 'react';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@/components/ui/Button';
import styles from './Presentation.module.css';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import SlidesList from '../SlidesList';
import SlideDropIndicator from '@/components/SlideDropIndicator';
interface PresentationProps {
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

// Create a SlideEditorWrapper component to handle rendering individual slides
const SlideEditorWrapper = memo(
    ({
        slideId,
        presentationId,
        tiptapRefs,
        isLast,
    }: {
        slideId: string;
        presentationId: string;
        tiptapRefs: MutableRefObject<TipTapRefs>;
        isLast: boolean;
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
                isLast={isLast}
            />
        );
    }
);

SlideEditorWrapper.displayName = 'SlideEditorWrapper';

function Presentation({ presentationId, tiptapRefs }: PresentationProps) {
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
                    <Button onClick={() => usePresentationStore.getState().addEmptySlide(presentationId)}>
                        + Добавить слайд
                    </Button>
                </div>
            )}
            {slideIds.map((slideId, index) => (
                <SlideEditorWrapper
                    key={slideId}
                    slideId={slideId}
                    presentationId={presentationId}
                    tiptapRefs={tiptapRefs}
                    isLast={index === slideIds.length - 1}
                />
            ))}

            {!isReadOnly && (
                <>
                    <SlidesList presentationId={presentationId} />
                    <SlideDropIndicator />
                </>
            )}
        </div>
    );
}

export default memo(Presentation);
