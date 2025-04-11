import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import SlidesList from '@/components/editor/SlidesList';
import ElementsPanel from '@/components/editor/ElementsPanel/ElementsPanel';
import { DndProvider } from '@/contexts/DragDropContext';
import Presentation from '../Presentation';
import DragDropIndicator from '@/components/DragDropIndicator';
import SlideMenu from '../SlideMenu/SlideMenu';
import { useMenuStore } from '@/store/menuStore';
// import { useHistoryStore } from '@/store/historyStore';

interface EditorProps {
    presentationId: string;
}

// Separate content component that only re-renders when its specific props change
const EditorContent: React.FC<{
    presentationId: string;
    activeSlideId: string | null;
    onSlideSelect: (slideId: string, scroll?: boolean) => void;
}> = React.memo(({
    presentationId,
    activeSlideId,
    onSlideSelect,
}) => {
    return (
        <div className="min-h-screen flex flex-col">
            <SlidesList
                presentationId={presentationId}
                activeSlideId={activeSlideId}
                onSlideSelect={onSlideSelect}
            />

            <div>
                {/* Main editing area */}
                <Presentation
                    presentationId={presentationId}
                    activeSlideId={activeSlideId}
                    onSlideSelect={onSlideSelect}
                />

                {/* Tools panel */}
                {activeSlideId && (
                    <ElementsPanel
                        presentationId={presentationId}
                        slideId={activeSlideId}
                    />
                )}
            </div>
            <SlideMenu />
            {/* Global drag-drop indicator */}
            <DragDropIndicator />
        </div>
    );
});

const Editor: React.FC<EditorProps> = ({ presentationId }) => {
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);

    // const { getSlideIds, checkPresentationExists } = usePresentationStore();
    // Use specific selectors to only subscribe to needed state
    const slideIds = useMemo(() => usePresentationStore.getState().getSlideIds(presentationId), []);
    const presentationExists = useMemo(() => usePresentationStore.getState().checkPresentationExists(presentationId), []);

    useEffect(() => {
        const { setPresentationId } = useMenuStore.getState();
        setPresentationId(presentationId);
    }, [presentationId]);

    // Memoize not found UI
    const notFoundUI = useMemo(() => (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-lg text-gray-500">Презентация не найдена</p>
        </div>
    ), []);

    // Handle slide selection with useCallback
    const handleSlideSelect = useCallback((slideId: string, scroll: boolean = false) => {
        setActiveSlideId(slideId);

        if (scroll) {
            document.querySelector(`[data-slide-id="${slideId}"]`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, []);

    useEffect(() => {
        // Set the first slide as active by default if there are slides
        if (slideIds.length > 0 && !activeSlideId) {
            setActiveSlideId(slideIds[0]);
        }
    }, [slideIds, activeSlideId]);

    if (!presentationExists) {
        return notFoundUI;
    }

    return (
        <DndProvider presentationId={presentationId}>
            {/* <SlideMenuProvider presentationId={presentationId}> */}
            {/* <button
                    onClick={() => {
                        console.log(useHistoryStore.getState().getHistoryDiff(presentationId))
                    }}
                >show diff history past</button>
                <button
                    onClick={() => {
                        console.log(useHistoryStore.getState().getHistoryDiff(presentationId, true))
                    }}
                >show diff history future</button> */}
            <EditorContent
                presentationId={presentationId}
                activeSlideId={activeSlideId}
                onSlideSelect={handleSlideSelect}
            />
            {/* </SlideMenuProvider> */}
        </DndProvider>
    );
};

EditorContent.displayName = 'EditorContent';

export default React.memo(Editor);