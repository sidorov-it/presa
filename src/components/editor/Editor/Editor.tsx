import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import SlidesList from '@/components/editor/SlidesList';
import ElementsPanel from '@/components/editor/ElementsPanel/ElementsPanel';
import { DndProvider } from '@/contexts/DragDropContext';
import { SlideMenuProvider } from '@/contexts/SlideMenuContext';
import Presentation from '../Presentation';
import DragDropIndicator from '@/components/DragDropIndicator';
import { Slide, PresentationState } from '@/types';
import SlideMenu from '../SlideMenu/SlideMenu';

interface EditorProps {
    presentationId: string;
}

interface PresentationData {
    slideIds: string[];
    presentationExists: boolean;
}

const emptySlideIds: string[] = [];
const emptyPresentationExists = false;

const Editor: React.FC<EditorProps> = ({ presentationId }) => {
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

    // Get only the necessary data from the store using a memoized selector factory
    const presentationSelector = useCallback(
        (state: PresentationState) => {
            const presentation = state.presentations.find(p => p.id === presentationId);

            return {
                slideIds: presentation ? presentation.slides.map(slide => slide.id) : emptySlideIds,
                presentationExists: !!presentation
            };
        },
        [presentationId]
    );

    const slideIds = usePresentationStore.getState().getSlideIds(presentationId);
    const presentationExists = usePresentationStore.getState().checkPresentationExists(presentationId);

    // const slideIds = presentation ? presentation.slides.map(slide => slide.id) : [];
    // const presentationExists = !!presentation;

    // Create a memoized slide getter function
    const slideGetter = useCallback(
        (slideId: string) => {
            return usePresentationStore.getState().getSlide(presentationId, slideId);
        },
        [presentationId]
    );

    // Memoize not found UI
    const notFoundUI = useMemo(() => (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg text-gray-500">Презентация не найдена</p>
        </div>
    ), []);

    // Memoize the active slide
    const activeSlide = useMemo(() => 
        activeSlideId ? slideGetter(activeSlideId) : null,
    [activeSlideId, slideGetter]);

    // Handle slide selection
    const handleSlideSelect = useCallback((slideId: string, scroll: boolean = false) => {
        setActiveSlideId(slideId);

        if (scroll) {
            document.querySelector(`[data-slide-id="${slideId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);

    useEffect(() => {
        // Set the first slide as active by default if there are slides
        if (slideIds.length > 0 && !activeSlideId) {
            setActiveSlideId(slideIds[0]);
        }
    }, [slideIds, activeSlideId]);

    // Memoize the slide data for the SlidesList
    const slidesData = useMemo(() => 
        slideIds.map(id => slideGetter(id)).filter(Boolean) as Slide[],
    [slideIds, slideGetter]);

    if (!presentationExists) {
        return notFoundUI;
    }

    return (
        <DndProvider presentationId={presentationId}>
            <SlideMenuProvider presentationId={presentationId}>
                <div className="min-h-screen flex flex-col">
                    <SlidesList
                        slides={slidesData}
                        activeSlideId={activeSlideId}
                        onSlideSelect={handleSlideSelect}
                    />

                    <div>
                        {/* Main editing area */}
                        <Presentation
                            presentationId={presentationId}
                            activeSlideId={activeSlideId}
                            onSlideSelect={handleSlideSelect}
                        />

                        {/* Tools panel */}
                        {activeSlide && (
                            <ElementsPanel
                                presentationId={presentationId}
                                slideId={activeSlide.id}
                            />
                        )}
                    </div>
                    <SlideMenu />
                    {/* Global drag-drop indicator */}
                    <DragDropIndicator />
                </div>
            </SlideMenuProvider>
        </DndProvider>
    );
};

export default React.memo(Editor);