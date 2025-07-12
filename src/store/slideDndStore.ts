import { create } from 'zustand';
import { Position } from '@/types/DragDropTypes';
import { usePresentationStore } from './presentationStore';

interface SlideDndIndicators {
    slideIndicator: string | null;
    slidePosition: Position | null;
}

interface SlideDndState {
    dragState: 'idle' | 'dragging';
    sourceSlideId: string | null;
    indicators: SlideDndIndicators;
    presentationId: string | null;
}

interface SlideDndStore extends SlideDndState {
    setPresentationId: (id: string) => void;
    startDrag: (slideId: string) => void;
    setIndicators: (indicators: Partial<SlideDndIndicators>) => void;
    completeDrop: () => void;
    reset: () => void;
    handleDocumentDrop: (e: DragEvent) => void;
}

export const useSlideDndStore = create<SlideDndStore>(set => ({
    dragState: 'idle',
    sourceSlideId: null,
    indicators: { slideIndicator: null, slidePosition: null },
    presentationId: null,

    setPresentationId: id => set({ presentationId: id }),

    startDrag: slideId => set({ dragState: 'dragging', sourceSlideId: slideId }),

    setIndicators: indicators =>
        set(state => ({
            indicators: {
                slideIndicator: indicators.slideIndicator ?? state.indicators.slideIndicator,
                slidePosition: indicators.slidePosition ?? state.indicators.slidePosition,
            },
        })),

    completeDrop: () =>
        set(state => {
            if (
                state.dragState === 'dragging' &&
                state.sourceSlideId &&
                state.indicators.slideIndicator &&
                state.presentationId
            ) {
                const presentation = usePresentationStore.getState().getPresentation(state.presentationId);

                if (presentation) {
                    const sourceIndex = presentation.slides.findIndex(s => s.id === state.sourceSlideId);
                    const targetIndex = presentation.slides.findIndex(s => s.id === state.indicators.slideIndicator);

                    if (sourceIndex !== -1 && targetIndex !== -1) {
                        let insertIndex = state.indicators.slidePosition === 'top' ? targetIndex : targetIndex + 1;
                        if (sourceIndex < targetIndex) insertIndex -= 1;
                        usePresentationStore.getState().reorderSlides(state.presentationId!, sourceIndex, insertIndex);
                    }
                }
            }

            return {
                dragState: 'idle' as const,
                sourceSlideId: null,
                indicators: { slideIndicator: null, slidePosition: null },
            } as SlideDndState;
        }),

    reset: () =>
        set({
            dragState: 'idle',
            sourceSlideId: null,
            indicators: { slideIndicator: null, slidePosition: null },
        }),

    handleDocumentDrop: (e: DragEvent) => {
        const state = useSlideDndStore.getState();

        if (state.dragState === 'dragging' && state.indicators.slideIndicator && state.indicators.slidePosition) {
            e.preventDefault();
            state.completeDrop();
        }
    },
}));
