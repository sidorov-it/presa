import React, { useEffect, useMemo, MutableRefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import ElementsPanel from '@/components/editor/ElementsPanel/ElementsPanel';
import { DndProvider } from '@/contexts/DragDropContext';
import Presentation from '../Presentation';
import DragDropIndicator from '@/components/DragDropIndicator';
import SlideMenu from '../SlideMenu/SlideMenu';
import { useUIStateStore } from '@/store/uiStateStore';
import { useEditorStore } from '@/store/editorStore';
import { TipTapRefs } from '@/types';
import { useShallow } from 'zustand/react/shallow';

import styles from './Editor.module.css';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface EditorProps {
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

// Separate content component that only re-renders when its specific props change
const EditorContent: React.FC<{
    presentationId: string;
    // activeSlideId: string | null;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}> = React.memo(({ presentationId, tiptapRefs }) => {
    const isReadOnly = useReadOnly();

    return (
        <div className={styles.editorContainer}>
            {/* <SlidesList presentationId={presentationId} activeSlideId={activeSlideId} onSlideSelect={onSlideSelect} /> */}

            <div>
                {/* Main editing area */}
                <Presentation presentationId={presentationId} tiptapRefs={tiptapRefs} />

                {/* Tools panel */}
                {!isReadOnly && <ElementsPanel />}
            </div>
            {!isReadOnly && <SlideMenu tiptapRefs={tiptapRefs} />}
            {!isReadOnly && <DragDropIndicator />}
        </div>
    );
});

const Editor: React.FC<EditorProps> = ({ presentationId, tiptapRefs }) => {
    // const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
    const isReadOnly = useReadOnly();

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
        const { setCurrentPresentationId } = useUIStateStore.getState();
        setCurrentPresentationId(presentationId);
    }, [presentationId]);

    // Memoize not found UI
    const notFoundUI = useMemo(
        () => (
            <div className={styles.notFoundUI}>
                <p className={styles.notFoundUIText}>Презентация не найдена</p>
            </div>
        ),
        []
    );

    // Handle slide selection with useCallback
    // const handleSlideSelect = useCallback(
    //     (slideId: string, scroll: boolean = false) => {
    //         if (isReadOnly) {
    //             return;
    //         }

    //         useUIStateStore.getState().setSelectedSlideId(slideId);
    //         // setActiveSlideId(slideId);

    //         if (scroll) {
    //             document.querySelector(`[data-slide-id="${slideId}"]`)?.scrollIntoView({
    //                 behavior: 'smooth',
    //                 block: 'center',
    //             });
    //         }
    //     },
    //     [isReadOnly]
    // );

    useEffect(() => {
        // Set the first slide as active by default if there are slides
        if (slideIds.length > 0 && !useUIStateStore.getState().selectedSlideId) {
            useUIStateStore.getState().setSelectedSlideId(slideIds[0]);
        }
    }, [slideIds]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;

            const {
                selectedElementId: elementId,
                selectedSlideId: slideId,
                selectedLayoutId: layoutId,
                currentPresentationId: menuPresentationId,
                isContextMenuOnTextEditor: isTextEditor,
                selectedSmartLayoutItemId,
            } = useUIStateStore.getState();
            const activeEditor = useEditorStore.getState().activeEditor;

            if (
                activeEditor ||
                isReadOnly ||
                !elementId ||
                !slideId ||
                !layoutId ||
                !menuPresentationId ||
                isTextEditor
            ) {
                return;
            }

            e.preventDefault();

            if (selectedSmartLayoutItemId) {
                usePresentationStore
                    .getState()
                    .removeSmartLayoutItem(menuPresentationId, slideId, layoutId, elementId, selectedSmartLayoutItemId);
                useUIStateStore.getState().closeContextMenu();
            } else {
                usePresentationStore.getState().deleteElement(menuPresentationId, slideId, layoutId, elementId);
                useUIStateStore.getState().closeContextMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isReadOnly]);

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
        minHeight: 'calc(100vh - 75px - 38px)',
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
            <div style={editorBgStyle}>
                <EditorContent
                    presentationId={presentationId}
                    // activeSlideId={activeSlideId}
                    tiptapRefs={tiptapRefs}
                    // onSlideSelect={handleSlideSelect}
                />
            </div>
        </DndProvider>
    );
};

EditorContent.displayName = 'EditorContent';

export default React.memo(Editor);
