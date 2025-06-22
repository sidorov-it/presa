import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useDndStore } from '@/store/dndStore';
import { DragElementType } from '@/types';

// Create a minimal context for essential functions
type DndContextType = {
    handleDragStart: (
        e: React.DragEvent<HTMLDivElement>,
        params: {
            elementId: string | null;
            layoutId?: string;
            cellId?: string;
            tableId?: string;
            rowIndex?: number;
            columnIndex?: number;
            smartLayoutItemId?: string;
            slideId?: string;
            dragElementType?: DragElementType;
        }
    ) => void;
};

const DndContext = createContext<DndContextType | undefined>(undefined);

// Provider component with minimal dependencies
export const DndProvider: React.FC<{ children: ReactNode; presentationId: string }> = ({
    children,
    presentationId,
}) => {
    useEffect(() => {
        useDndStore.getState().setPresentationId(presentationId);
    }, [presentationId]);

    // Define context functions
    const handleDragStart = (
        e: React.DragEvent<HTMLDivElement>,
        {
            elementId,
            layoutId,
            cellId,
            tableId,
            rowIndex,
            columnIndex,
            smartLayoutItemId,
            slideId,
            dragElementType,
        }: {
            elementId: string | null;
            layoutId?: string;
            cellId?: string;
            tableId?: string;
            rowIndex?: number;
            columnIndex?: number;
            smartLayoutItemId?: string;
            slideId?: string;
            dragElementType?: DragElementType;
        }
    ) => {
        e.stopPropagation();

        if (slideId) {
            // If slideId is provided, we're dragging a slide
            useDndStore
                .getState()
                .startDrag(null, '', undefined, undefined, undefined, undefined, undefined, slideId, dragElementType);
        } else {
            // Otherwise handle normal element/layout/cell dragging
            useDndStore
                .getState()
                .startDrag(
                    elementId,
                    layoutId || '',
                    cellId,
                    tableId,
                    rowIndex,
                    columnIndex,
                    smartLayoutItemId,
                    undefined,
                    dragElementType
                );
        }

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData(
            'application/json',
            JSON.stringify({
                elementId,
                layoutId,
                cellId,
                tableId,
                rowIndex,
                columnIndex,
                smartLayoutItemId,
                slideId,
                dragElementType,
            })
        );
    };
    // const getLayout = useCallback(
    //     (layoutId: string): Layout | undefined => {
    //         const presentation = usePresentationStore.getState().getPresentation(presentationId);

    //         if (!presentation) return undefined;
    //         const slide = presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
    //         if (!slide) return undefined;
    //         return slide.layouts.find(l => l.id === layoutId);
    //     },
    //     [presentationId]
    // );

    // Set up document-level event listeners for drag operations
    useEffect(() => {
        let lastProcessedTime = 0;
        const THROTTLE_INTERVAL = 50; // milliseconds

        const handleDocumentDragOver = (e: React.DragEvent) => {
            e.preventDefault();

            const state = useDndStore.getState().state;

            // Only process if we're dragging
            if (state.dragState !== 'dragging') return;

            // Save mouse position
            useDndStore.getState().setMousePosition({ x: e.clientX, y: e.clientY });

            // Apply throttling to improve performance
            const now = Date.now();
            if (now - lastProcessedTime < THROTTLE_INTERVAL) return;
            lastProcessedTime = now;

            // Auto scroll when cursor nears top or bottom of the viewport
            const SCROLL_THRESHOLD = 75 + 40; // header + 40px from edge
            const SCROLL_SPEED = 20; // amount to scroll
            if (e.clientY < SCROLL_THRESHOLD) {
                window.scrollBy({ top: -SCROLL_SPEED });
            } else if (e.clientY > window.innerHeight - SCROLL_THRESHOLD) {
                window.scrollBy({ top: SCROLL_SPEED });
            }

            // Get element under cursor
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (!elemBelow) return;

            // Find target elements with data attributes
            const elementNode = elemBelow.closest('[data-element-id]') as HTMLElement;
            const cellNode = elemBelow.closest('[data-cell-id]') as HTMLElement;
            const layoutNode = elemBelow.closest('[data-layout-id]') as HTMLElement;
            const slideNode = elemBelow.closest('[data-slide-id]') as HTMLElement;

            useDndStore.getState().handleDragTarget(e, { elementNode, cellNode, layoutNode, slideNode });
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const state = useDndStore.getState().state;
            if (e.key === 'Escape' && state.dragState === 'dragging') {
                useDndStore.getState().cancelDrag();
            }
        };

        // Add event listeners – cast handlers to native `EventListener` to satisfy TS
        document.addEventListener(
            'dragover',
            handleDocumentDragOver as unknown as EventListener,
            { passive: false } // allow `preventDefault` inside the handler
        );
        document.addEventListener('drop', useDndStore.getState().handleDocumentDrop as unknown as EventListener);
        document.addEventListener('keydown', handleKeyDown as unknown as EventListener);

        return () => {
            document.removeEventListener('dragover', handleDocumentDragOver as unknown as EventListener);
            document.removeEventListener('drop', useDndStore.getState().handleDocumentDrop as unknown as EventListener);
            document.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
        };
    }, []);

    // Update DOM attributes for drop indicators
    useEffect(() => {
        const state = useDndStore.getState().state;
        // Clear previous attributes
        document.querySelectorAll('[data-element-indicator="true"]').forEach(el => {
            el.removeAttribute('data-element-indicator');
            el.removeAttribute('data-indicator-position');
        });
        document.querySelectorAll('[data-layout-indicator="true"]').forEach(el => {
            el.removeAttribute('data-layout-indicator');
            el.removeAttribute('data-indicator-position');
        });
        document.querySelectorAll('[data-cell-indicator="true"]').forEach(el => {
            el.removeAttribute('data-cell-indicator');
            el.removeAttribute('data-indicator-position');
        });

        // Set new attributes
        if (state.indicators.elementIndicator) {
            const element = document.querySelector(`[data-element-id="${state.indicators.elementIndicator}"]`);
            if (element) {
                element.setAttribute('data-element-indicator', 'true');
                if (state.indicators.elementPosition) {
                    element.setAttribute('data-indicator-position', state.indicators.elementPosition);
                }
            }
        }

        if (state.indicators.layoutIndicator) {
            const layout = document.querySelector(`[data-layout-id="${state.indicators.layoutIndicator}"]`);
            if (layout) {
                layout.setAttribute('data-layout-indicator', 'true');
                if (state.indicators.layoutPosition) {
                    layout.setAttribute('data-indicator-position', state.indicators.layoutPosition);
                }
            }
        }

        if (state.indicators.cellIndicator) {
            const cell = document.querySelector(`[data-cell-id="${state.indicators.cellIndicator}"]`);
            if (cell) {
                cell.setAttribute('data-cell-indicator', 'true');
                if (state.indicators.cellPosition) {
                    cell.setAttribute('data-indicator-position', state.indicators.cellPosition);
                }
            }
        }
    }, []);

    // Provide minimal context
    const contextValue: DndContextType = {
        handleDragStart,
    };

    return <DndContext.Provider value={contextValue}>{children}</DndContext.Provider>;
};

// Custom hook for using the DnD context
export const useDnd = () => {
    const context = useContext(DndContext);
    if (context === undefined) {
        throw new Error('useDnd must be used within a DndProvider');
    }
    return context;
};

// Custom hook for drag start
export const useHandleDragStart = () => {
    const { handleDragStart } = useDnd();
    return handleDragStart;
};
