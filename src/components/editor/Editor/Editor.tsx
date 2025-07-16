import React, { useState, useEffect, useCallback, useMemo, MutableRefObject } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import ElementsPanel from '@/components/editor/ElementsPanel/ElementsPanel';
import { DndProvider } from '@/contexts/DragDropContext';
import Presentation from '../Presentation';
import DragDropIndicator from '@/components/DragDropIndicator';
import SlideMenu from '../SlideMenu/SlideMenu';
import { useMenuStore } from '@/store/menuStore';
import { useEditorStore } from '@/store/editorStore';
import { useClipboardStore } from '@/store/clipboardStore';
import { generateId } from '@/utils/id';
import getColumnWidths from '@/utils/getColumnWidths';
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
    activeSlideId: string | null;
    onSlideSelect: (slideId: string, scroll?: boolean) => void;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}> = React.memo(({ presentationId, activeSlideId, onSlideSelect, tiptapRefs }) => {
    const isReadOnly = useReadOnly();

    return (
        <div className={styles.editorContainer}>
            {/* <SlidesList presentationId={presentationId} activeSlideId={activeSlideId} onSlideSelect={onSlideSelect} /> */}

            <div>
                {/* Main editing area */}
                <Presentation
                    presentationId={presentationId}
                    activeSlideId={activeSlideId}
                    onSlideSelect={onSlideSelect}
                    tiptapRefs={tiptapRefs}
                />

                {/* Tools panel */}
                {!isReadOnly && activeSlideId && (
                    <ElementsPanel presentationId={presentationId} slideId={activeSlideId} />
                )}
            </div>
            {!isReadOnly && <SlideMenu tiptapRefs={tiptapRefs} />}
            {!isReadOnly && <DragDropIndicator />}
        </div>
    );
});

const Editor: React.FC<EditorProps> = ({ presentationId, tiptapRefs }) => {
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
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
        const { setPresentationId } = useMenuStore.getState();
        setPresentationId(presentationId);
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
    const handleSlideSelect = useCallback(
        (slideId: string, scroll: boolean = false) => {
            if (isReadOnly) {
                return;
            }

            setActiveSlideId(slideId);

            if (scroll) {
                document.querySelector(`[data-slide-id="${slideId}"]`)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        },
        [isReadOnly]
    );

    useEffect(() => {
        // Set the first slide as active by default if there are slides
        if (slideIds.length > 0 && !activeSlideId) {
            setActiveSlideId(slideIds[0]);
        }
    }, [slideIds, activeSlideId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Delete' && e.key !== 'Backspace') return;

            const {
                elementId,
                slideId,
                layoutId,
                presentationId: menuPresentationId,
                isTextEditor,
                selectedSmartLayoutItemId,
            } = useMenuStore.getState();
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
                useMenuStore.getState().closeMenu();
            } else {
                usePresentationStore.getState().deleteElement(menuPresentationId, slideId, layoutId, elementId);
                useMenuStore.getState().closeMenu();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isReadOnly]);

    useEffect(() => {
        const handleCopyPaste = (e: KeyboardEvent) => {
            const isModifier = e.metaKey || e.ctrlKey;
            if (!isModifier) return;

            const key = e.key.toLowerCase();
            const clipboard = useClipboardStore.getState();

            if (key === 'c') {
                const {
                    elementId,
                    slideId,
                    layoutId,
                    presentationId: menuPresentationId,
                    isTextEditor,
                } = useMenuStore.getState();
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
                const element = usePresentationStore
                    .getState()
                    .getElement(menuPresentationId, slideId, layoutId, elementId);
                if (element) {
                    clipboard.setElement(JSON.parse(JSON.stringify(element)));
                }
                return;
            }

            if (key === 'v') {
                const element = clipboard.element;
                if (!element) return;

                e.preventDefault();

                const activeEditorId = useEditorStore.getState().activeEditorId;
                const { elementId, slideId: menuSlideId, presentationId: menuPresentationId, isTextEditor } =
                    useMenuStore.getState();

                const presId = menuPresentationId || presentationId;

                if (activeEditorId && activeSlideId) {
                    insertAfter(activeEditorId, activeSlideId, presId);
                } else if (elementId && !isTextEditor && menuSlideId) {
                    insertAfter(elementId, menuSlideId, presId);
                } else if (!elementId && activeSlideId) {
                    usePresentationStore.getState().addLayoutWithElement(presId, activeSlideId, element);
                }
            }
        };

        const insertAfter = (
            referenceElementId: string,
            slideId: string,
            presId: string
        ) => {
            const targetPresentationId = presId;
            const slide = usePresentationStore
                .getState()
                .getSlide(targetPresentationId, slideId);
            if (!slide) return;
            const layout = slide.layouts.find(l =>
                l.elements.some(el => el.id === referenceElementId)
            );
            if (!layout) return;
            const refElement = layout.elements.find(el => el.id === referenceElementId);
            if (!refElement) return;

            const newElement = { ...clipboard.element!, id: generateId() };

            if (layout.gridStructure.columns > 1) {
                const updatedElements = [...layout.elements];
                const index = updatedElements.findIndex(el => el.id === referenceElementId);
                newElement.cellId = refElement.cellId;
                updatedElements.splice(index + 1, 0, newElement);
                usePresentationStore
                    .getState()
                    .updateLayout(targetPresentationId, slideId, layout.id, {
                        elements: updatedElements,
                    });
            } else {
                const cellId = generateId();
                newElement.cellId = cellId;
                const newLayout = {
                    id: generateId(),
                    gridStructure: {
                        columns: 1,
                        columnWidths: getColumnWidths(1),
                        rows: [
                            {
                                id: generateId(),
                                cells: [
                                    {
                                        id: cellId,
                                        row: 0,
                                        column: 1,
                                    },
                                ],
                            },
                        ],
                    },
                    type: layout.type,
                    elements: [newElement],
                    style: layout.style,
                };
                const layouts = [...slide.layouts];
                const index = layouts.findIndex(l => l.id === layout.id);
                layouts.splice(index + 1, 0, newLayout);
                usePresentationStore
                    .getState()
                    .updateSlide(targetPresentationId, slideId, { layouts }, true);
            }
        };

        window.addEventListener('keydown', handleCopyPaste);
        return () => {
            window.removeEventListener('keydown', handleCopyPaste);
        };
    }, [activeSlideId, isReadOnly]);

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
                    activeSlideId={activeSlideId}
                    tiptapRefs={tiptapRefs}
                    onSlideSelect={handleSlideSelect}
                />
            </div>
        </DndProvider>
    );
};

EditorContent.displayName = 'EditorContent';

export default React.memo(Editor);
