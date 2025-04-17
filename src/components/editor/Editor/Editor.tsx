import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import SlidesList from '@/components/editor/SlidesList';
import ElementsPanel from '@/components/editor/ElementsPanel/ElementsPanel';
import { DndProvider } from '@/contexts/DragDropContext';
import Presentation from '../Presentation';
import DragDropIndicator from '@/components/DragDropIndicator';
import SlideMenu from '../SlideMenu/SlideMenu';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import BackgroundSettingsModal from './BackgroundSettingsModal';
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { useShallow } from 'zustand/react/shallow';

interface EditorProps {
    presentationId: string;
}

// Separate content component that only re-renders when its specific props change
const EditorContent: React.FC<{
    presentationId: string;
    activeSlideId: string | null;
    onSlideSelect: (slideId: string, scroll?: boolean) => void;
}> = React.memo(({ presentationId, activeSlideId, onSlideSelect }) => {
    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: [],
    });

    return (
        <div className="min-h-screen flex flex-col">
            <SlidesList presentationId={presentationId} activeSlideId={activeSlideId} onSlideSelect={onSlideSelect} />

            <div>
                {/* Main editing area */}
                <Presentation
                    presentationId={presentationId}
                    activeSlideId={activeSlideId}
                    onSlideSelect={onSlideSelect}
                    tiptapRefs={tiptapRefs}
                />

                {/* Tools panel */}
                {activeSlideId && <ElementsPanel presentationId={presentationId} slideId={activeSlideId} />}
            </div>
            <SlideMenu tiptapRefs={tiptapRefs} />
            {/* Global drag-drop indicator */}
            <DragDropIndicator />
        </div>
    );
});

const Editor: React.FC<EditorProps> = ({ presentationId }) => {
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
    // const [isBgModalOpen, setIsBgModalOpen] = useState(false);
    const backgroundSettings = usePresentationStore(useShallow(state => state.getBackgroundSettings(presentationId)));

    // const { getSlideIds, checkPresentationExists } = usePresentationStore();
    // Use specific selectors to only subscribe to needed state
    const slideIds = useMemo(() => usePresentationStore.getState().getSlideIds(presentationId), [presentationId]);
    const presentationExists = useMemo(
        () => usePresentationStore.getState().checkPresentationExists(presentationId),
        [presentationId]
    );

    useEffect(() => {
        const { setPresentationId } = useMenuStore.getState();
        setPresentationId(presentationId);
    }, [presentationId]);

    // Memoize not found UI
    const notFoundUI = useMemo(
        () => (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-gray-500">Презентация не найдена</p>
            </div>
        ),
        []
    );

    // Handle slide selection with useCallback
    const handleSlideSelect = useCallback((slideId: string, scroll: boolean = false) => {
        setActiveSlideId(slideId);

        if (scroll) {
            document.querySelector(`[data-slide-id="${slideId}"]`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
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

    // Формируем стили для фона
    const editorBgStyle: React.CSSProperties = {
        backgroundColor: backgroundSettings?.backgroundColor || undefined,
        backgroundImage: backgroundSettings?.backgroundImage ? `url(${backgroundSettings.backgroundImage})` : undefined,
        backgroundSize: backgroundSettings?.backgroundImage ? 'cover' : undefined,
        backgroundPosition: backgroundSettings?.backgroundImage ? 'center' : undefined,
        backgroundAttachment: backgroundSettings?.backgroundImage ? 'fixed' : undefined,
        minHeight: '100vh',
        transition: 'background 0.3s',
    };

    // const handleOpenBgModal = () => setIsBgModalOpen(true);
    // const handleCloseBgModal = () => setIsBgModalOpen(false);
    // const handleKeyDownCog = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    //     if (e.key === 'Enter' || e.key === ' ') {
    //         e.preventDefault();
    //         setIsBgModalOpen(true);
    //     }
    // };

    return (
        <DndProvider presentationId={presentationId}>
            {/* Header с кнопкой-шестерёнкой */}
            {/* <div className="flex items-center justify-between px-4 py-2 border-b bg-white/80 sticky top-0 z-30">
                <div className="font-semibold text-lg">Редактор презентации</div>
                <button
                    type="button"
                    className="ml-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Настроить фон презентации"
                    tabIndex={0}
                    onClick={handleOpenBgModal}
                    onKeyDown={handleKeyDownCog}
                >
                    <HiOutlineCog6Tooth className="w-6 h-6 text-gray-600" aria-hidden="true" />
                </button>
            </div> */}
            <div style={editorBgStyle} className="min-h-screen flex flex-col">
                <EditorContent
                    presentationId={presentationId}
                    activeSlideId={activeSlideId}
                    onSlideSelect={handleSlideSelect}
                />
            </div>
            {/* <BackgroundSettingsModal
                isOpen={isBgModalOpen}
                onClose={handleCloseBgModal}
                presentationId={presentationId}
            /> */}
        </DndProvider>
    );
};

EditorContent.displayName = 'EditorContent';

export default React.memo(Editor);
