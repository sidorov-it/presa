import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from 'react';
import deepEqual from 'deep-equal';
import { Element, GridCell, Layout } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';

// Define DnD types
type DragSource = {
    elementId: string | null;
    layoutId: string | null;
    cellId?: string | null;
};

type Position = 'top' | 'bottom' | 'left' | 'right';

type DropTarget = {
    elementId: string | null;
    layoutId: string | null;
    cellId?: string | null;
    position: Position | null;
};

type DragState = 'idle' | 'dragging' | 'dropping';

type DndState = {
    dragState: DragState;
    source: DragSource;
    target: DropTarget;
    indicators: {
        elementIndicator: string | null;
        elementPosition: Position | null;
        layoutIndicator: string | null;
        layoutPosition: Position | null;
        slideIndicator: string | null;
        cellIndicator: string | null;
        cellPosition: Position | null;
    };
    isReadyToDrop: boolean;
};

type DndAction =
    | { type: 'START_DRAG'; payload: { elementId: string | null; layoutId: string; cellId?: string } }
    | { type: 'SET_DROP_TARGET'; payload: DropTarget }
    | { type: 'SET_ELEMENT_INDICATOR'; payload: { elementId: string | null; position: Position | null } }
    | { type: 'SET_CELL_INDICATOR'; payload: { cellId: string | null; position: Position | null } }
    | { type: 'SET_LAYOUT_INDICATOR'; payload: { layoutId: string | null; position: Position | null } }
    | { type: 'SET_SLIDE_INDICATOR'; payload: string | null }
    | { type: 'COMPLETE_DROP' }
    | { type: 'CANCEL_DRAG' }
    | { type: 'SET_READY_TO_DROP'; payload: boolean };

const initialState: DndState = {
    dragState: 'idle',
    source: {
        elementId: null,
        layoutId: null,
        cellId: null
    },
    target: {
        elementId: null,
        layoutId: null,
        cellId: null,
        position: null
    },
    indicators: {
        elementIndicator: null,
        elementPosition: null,
        layoutIndicator: null,
        layoutPosition: null,
        slideIndicator: null,
        cellIndicator: null,
        cellPosition: null
    },
    isReadyToDrop: false
};

const prevStateRef = {
    current: initialState,
};

function dndReducer(state: DndState, action: DndAction): DndState {
    let updatedState;
    switch (action.type) {
        case 'START_DRAG':
            updatedState = {
                ...state,
                dragState: 'dragging',
                source: {
                    elementId: action.payload.elementId,
                    layoutId: action.payload.layoutId,
                    cellId: action.payload.cellId
                },
                // Clear any previous indicators and targets
                target: { ...initialState.target },
                indicators: { ...initialState.indicators }
            };
            break;
        case 'SET_DROP_TARGET':
            updatedState = {
                ...state,
                target: action.payload
            };
            break;
        case 'SET_ELEMENT_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    elementIndicator: action.payload.elementId,
                    elementPosition: action.payload.position,
                }
            };
            break;
        case 'SET_LAYOUT_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    layoutIndicator: action.payload.layoutId,
                    layoutPosition: action.payload.position,
                }
            };
            break;
        case 'SET_SLIDE_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    slideIndicator: action.payload
                }
            };
            break;

        case 'SET_CELL_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    cellIndicator: action.payload.cellId,
                    cellPosition: action.payload.position
                }
            };
            break;
        case 'COMPLETE_DROP':
            updatedState = {
                ...initialState,
                dragState: 'dropping' // Temporary state for animations if needed
            };
            break;
        case 'CANCEL_DRAG':
            return initialState;
            break;
        case 'SET_READY_TO_DROP':
            updatedState = {
                ...state,
                isReadyToDrop: action.payload
            };
            break;

        default:
            return state;
    }

    if (deepEqual(updatedState, state)) {
        return state;
    }

    prevStateRef.current = updatedState as DndState;
    return updatedState as DndState;
}

// Create context
type DndContextType = {
    state: DndState;
    startDrag: (elementId: string, layoutId: string, cellId?: string) => void;
    setDropTarget: (target: DropTarget) => void;
    setElementIndicator: (elementId: string | null, position: Position | null) => void;
    setCellIndicator: (cellId: string | null, position: Position | null) => void;
    setLayoutIndicator: (layoutId: string | null, position: Position | null) => void;
    setSlideIndicator: (slideId: string | null) => void;
    completeDrop: () => void;
    cancelDrag: () => void;
    handleDragStart: (e: React.DragEvent<HTMLDivElement>, elementId: string, layoutId: string, cellId?: string) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    isDragging: () => boolean;
    getElement: (elementId: string, layoutId: string) => Element | undefined;
    getLayout: (layoutId: string) => Layout | undefined;
    processElementDrop: () => void;
    processLayoutDrop: () => void;
    processSlideDrop: () => void;
    setReadyToDrop: (isReady: boolean) => void;
};

const DndContext = createContext<DndContextType | undefined>(undefined);

// Provider component
export const DndProvider: React.FC<{ children: ReactNode; presentationId: string }> = ({
    children,
    presentationId,
}) => {
    const [state, dispatch1] = useReducer(dndReducer, initialState);

    const dispatch = (action: DndAction) => {
        dispatch1(action);
    };

    // Import required functions from your store
    const {
        updateLayout,
        addLayout,
        deleteLayout,
        getPresentation,
        updateSlide
    } = usePresentationStore();

    const getLayoutSlide = (layoutId: string) => {
        const slide = getPresentation(presentationId)?.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
        if (!slide) return undefined;
        return slide;
    };

    const getLayout = (layoutId: string): Layout | undefined => {
        const slide = getPresentation(presentationId)?.slides.find(slide => slide.layouts.find(l => l.id === layoutId));

        if (!slide) return undefined;
        return slide.layouts.find(l => l.id === layoutId);
    };

    const getElement = (elementId: string, layoutId: string): Element | undefined => {
        const layout = getLayout(layoutId);
        if (!layout) return undefined;
        return layout.elements.find(e => e.id === elementId);
    };

    const getCell = (cellId: string, layoutId: string): GridCell | undefined => {
        const layout = getLayout(layoutId);
        if (!layout) return undefined;
        return layout.gridStructure.rows[0].cells.find(cell => cell.id === cellId)
    };


    // Basic handler functions
    const startDrag = (elementId: string | null, layoutId: string, cellId?: string) => {
        dispatch({ type: 'START_DRAG', payload: { elementId, layoutId, cellId } });
    };

    const setDropTarget = (target: DropTarget) => {
        dispatch({ type: 'SET_DROP_TARGET', payload: target });
    };

    const setElementIndicator = (elementId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_ELEMENT_INDICATOR', payload: { elementId, position } });
    };

    const setCellIndicator = (cellId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_CELL_INDICATOR', payload: { cellId, position } });
    };

    const setLayoutIndicator = (layoutId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_LAYOUT_INDICATOR', payload: { layoutId, position } });
    };

    const setSlideIndicator = (slideId: string | null) => {
        dispatch({ type: 'SET_SLIDE_INDICATOR', payload: slideId });
    };

    const completeDrop = () => {
        dispatch({ type: 'COMPLETE_DROP' });
    };

    const cancelDrag = () => {
        dispatch({ type: 'CANCEL_DRAG' });
    };

    const isDragging = () => state.dragState === 'dragging';

    const setReadyToDrop = (isReady: boolean) => {
        dispatch({ type: 'SET_READY_TO_DROP', payload: isReady });
    };

    // Event handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, elementId: string | null, layoutId: string, cellId?: string) => {
        e.stopPropagation();
        startDrag(elementId, layoutId, cellId);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            elementId,
            layoutId,
            cellId
        }));
    };

    // Centralized drag over handling with document-level listeners
    useEffect(() => {
        let lastProcessedTime = 0;
        const THROTTLE_INTERVAL = 50; // milliseconds

        const handleDocumentDragOver = (e: DragEvent) => {
            e.preventDefault();

            // Only process if we're dragging
            if (state.dragState !== 'dragging') return;

            // Apply throttling to improve performance
            const now = Date.now();
            if (now - lastProcessedTime < THROTTLE_INTERVAL) return;
            lastProcessedTime = now;

            // Get element under cursor
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            if (!elemBelow) return;

            // Find target elements with data attributes
            const elementNode = elemBelow.closest('[data-element-id]');
            const cellNode = elemBelow.closest('[data-cell-id]');
            const rowNode = elemBelow.closest('[data-row-id]');
            const layoutNode = elemBelow.closest('[data-layout-id]');
            const slideNode = elemBelow.closest('[data-slide-id]');

            // Get all necessary IDs'
            const elementId = elementNode?.getAttribute('data-element-id');
            const cellId = cellNode?.getAttribute('data-cell-id');
            const layoutId = elementNode?.getAttribute('data-layout-id') ||
                cellNode?.getAttribute('data-layout-id') ||
                rowNode?.getAttribute('data-layout-id') ||
                layoutNode?.getAttribute('data-layout-id');
            const slideId = slideNode?.getAttribute('data-slide-id');

            // If we're over the same element we're dragging or no valid target, clear indicators
            if (!layoutId ||
                (elementId && elementId === state.source.elementId && layoutId === state.source.layoutId) ||
                (cellId && cellId === state.source.cellId && layoutId === state.source.layoutId)) {
                // Clear all indicators
                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);
                setDropTarget({
                    elementId: null,
                    layoutId: null,
                    cellId: null,
                    position: null
                });

                prevStateRef.current = {
                    ...state,
                    indicators: {
                        ...state.indicators,
                        elementIndicator: null,
                        elementPosition: null,
                        cellIndicator: null,
                        cellPosition: null,
                        layoutIndicator: null,
                        layoutPosition: null,
                        slideIndicator: null
                    }
                };

                console.log('clear indicators')
                return;
            }

            // Get layout information to determine the appropriate target
            const sourceLayout = layoutId ? getLayout(state.source.layoutId || '') : undefined;
            const targetLayout = layoutId ? getLayout(layoutId) : undefined;

            // If we can't find layouts, exit early
            if (!sourceLayout || !targetLayout) {
                return;
            }

            // Check if we're dealing with a layout that has a single cell with a single element
            const isSingleCellSingleElement =
                targetLayout.gridStructure.rows.length === 1 &&
                targetLayout.gridStructure.rows[0].cells.length === 1 &&
                targetLayout.elements.length === 1;

            // Check if we're dealing with a layout that has multiple cells in a row
            const isMultiCellRow = targetLayout.gridStructure.rows[0].cells.length > 1;

            // Prioritize targets based on the context

            // Case 1: If we're over a single cell with a single element, we can drop on any side
            if (isSingleCellSingleElement && elementId && elementId !== state.source.elementId) {
                console.log('isSingleCellSingleElement', elementId, layoutId);

                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }
            // Case 2: If we're over a cell in a multi-cell row, we can drop on left/right of cell
            else if (isMultiCellRow && cellId && cellId !== state.source.cellId) {
                console.log('isMultiCellRow', cellId, layoutId);

                // высчитывает позицию мыши относительно элемнта и layout.
                processCellTarget(e, cellId, layoutId, cellNode as HTMLElement, elementNode as HTMLElement, elementId);
            }
            else if (isMultiCellRow && cellId !== state.source.cellId) {
                console.log('isMultiCellRow', cellId, layoutId);

                // высчитывает позицию мыши относительно элемнта и layout.
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }

            // Case 3: If we're over an element, we can drop top/bottom of that element
            else if (elementId && elementId !== state.source.elementId) {
                console.log('elementId', elementId, layoutId);
                processElementTarget(e, elementId, layoutId, elementNode as HTMLElement);
            }
            else if (layoutId && layoutId !== state.source.layoutId) {
                console.log('layoutId', layoutId, layoutId);
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }
            // Case 5: If we're over a slide, we can drop on the slide
            else if (slideId && (!state.source.layoutId || getLayoutSlide(state.source.layoutId)?.id !== slideId)) {
                console.log('slideId', slideId, layoutId);
                setSlideIndicator(slideId);
                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setDropTarget({
                    elementId: null,
                    layoutId: null,
                    cellId: null,
                    position: null
                });
            } else {
                // Not over a valid target
                console.log('Not over a valid target');
                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);
                setDropTarget({
                    elementId: null,
                    layoutId: null,
                    cellId: null,
                    position: null
                });
            }
        };

        const processElementTarget = (e: DragEvent, elementId: string, layoutId: string, elementNode: HTMLElement) => {
            // Get element dimensions
            console.log('processElementTarget', elementId);
            const rect = elementNode.getBoundingClientRect();

            // Get layout to determine number of cells
            const layout = getLayout(layoutId);
            if (!layout) return;

            const targetElement = layout.elements.find(el => el.id === elementId);
            if (!targetElement) return;

            // For single-cell layouts with one element, allow drops on all sides
            const isSingleCellLayout = layout.gridStructure.rows[0].cells.length === 1;

            // Calculate distances from edges
            const distanceFromTop = e.clientY - rect.top;
            const distanceFromBottom = rect.bottom - e.clientY;
            const distanceFromLeft = e.clientX - rect.left;
            const distanceFromRight = rect.right - e.clientX;

            // Find minimum distance
            let minDistance: number;
            let position: Position | null = null;

            if (isSingleCellLayout) {
                // All sides are valid targets for single-cell layouts
                minDistance = Math.min(distanceFromTop, distanceFromBottom, distanceFromLeft, distanceFromRight);

                if (minDistance === distanceFromTop) {
                    position = 'top';
                } else if (minDistance === distanceFromBottom) {
                    position = 'bottom';
                } else if (minDistance === distanceFromLeft) {
                    position = 'left';
                } else if (minDistance === distanceFromRight) {
                    position = 'right';
                }
            } else {
                // For multi-cell layouts, only top/bottom are valid for elements
                minDistance = Math.min(distanceFromTop, distanceFromBottom);

                if (minDistance === distanceFromTop) {
                    position = 'top';
                } else if (minDistance === distanceFromBottom) {
                    position = 'bottom';
                }
            }

            if (!position) return;

            // Only update if state changed
            if (prevStateRef.current.indicators.elementIndicator === elementId &&
                prevStateRef.current.indicators.elementPosition === position) {
                return;
            }

            // Set indicators
            setElementIndicator(elementId, position);
            setLayoutIndicator(null, null);
            setSlideIndicator(null);

            // Update target state
            setDropTarget({
                elementId,
                layoutId,
                cellId: targetElement.cellId,
                position
            });

            // Update reference to previous state
            prevStateRef.current = {
                ...state,
                indicators: {
                    ...state.indicators,
                    elementIndicator: elementId,
                    elementPosition: position,
                    layoutIndicator: null,
                    layoutPosition: null,
                    slideIndicator: null
                }
            };
        };

        const processCellTarget = (e: DragEvent, cellId: string, layoutId: string, cellNode: HTMLElement, elementNode?: HTMLElement, elementId?: string | null) => {
            // Get cell dimensions
            const rectCell = cellNode.getBoundingClientRect();
            const distanceFromCellLeft = e.clientX - rectCell.left;
            const distanceFromCellRight = rectCell.right - e.clientX;
            const distanceFromCellTop = e.clientY - rectCell.top;
            const distanceFromCellBottom = rectCell.bottom - e.clientY;

            // Determine position based on closest edge
            let position: Position | null = null;
            let targetElement: 'cell' | 'element' | null = null;

            let minDistance: number;
            if (elementNode) {
                // For cell targets, we're primarily interested in left/right position

                const rectElement = elementNode?.getBoundingClientRect();
                const distanceFromElementLeft = e.clientX - rectElement.left;
                const distanceFromElementRight = rectElement.right - e.clientX;
                const distanceFromElementTop = e.clientY - rectElement.top;
                const distanceFromElementBottom = rectElement.bottom - e.clientY;

                minDistance = Math.min(distanceFromCellLeft, distanceFromCellRight, distanceFromCellTop, distanceFromCellBottom, distanceFromElementLeft, distanceFromElementRight, distanceFromElementTop, distanceFromElementBottom);

                if (minDistance === distanceFromCellTop) {
                    position = 'top';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromCellBottom) {
                    position = 'bottom';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromCellLeft) {
                    position = 'left';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromCellRight) {
                    position = 'right';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromElementTop) {
                    position = 'top';
                    targetElement = 'element';
                } else if (minDistance === distanceFromElementBottom) {
                    position = 'bottom';
                    targetElement = 'element';
                }
            } else {
                minDistance = Math.min(distanceFromCellLeft, distanceFromCellRight, distanceFromCellTop, distanceFromCellBottom);

                if (minDistance === distanceFromCellTop) {
                    position = 'top';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromCellBottom) {
                    position = 'bottom';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromCellLeft) {
                    position = 'left';
                    targetElement = 'cell';
                } else if (minDistance === distanceFromCellRight) {
                    position = 'right';
                    targetElement = 'cell';
                }
            }

            if (targetElement === 'cell') {
                // Set indicators and clear others
                setElementIndicator(null, null);
                setCellIndicator(cellId, position);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);

                // Update target state
                setDropTarget({
                    elementId: null,
                    layoutId,
                    cellId,
                    position
                });

                // Update previous state reference
                prevStateRef.current = {
                    ...state,
                    target: {
                        elementId: null,
                        layoutId,
                        cellId,
                        position
                    },
                    indicators: {
                        ...state.indicators,
                        elementIndicator: null,
                        elementPosition: null,
                        cellIndicator: cellId,
                        cellPosition: position,
                        layoutIndicator: null,
                        layoutPosition: null,
                        slideIndicator: null
                    }
                };
            } else if (targetElement === 'element' && elementId) {
                // Set indicators and clear others
                setElementIndicator(elementId, position);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);

                // Update target state
                setDropTarget({
                    elementId,
                    layoutId,
                    cellId: null,
                    position
                });

                // Update previous state reference
                prevStateRef.current = {
                    ...state,
                    target: {
                        elementId,
                        layoutId,
                        cellId: null,
                        position
                    },
                    indicators: {
                        ...state.indicators,
                        elementIndicator: elementId,
                        elementPosition: position,
                        layoutIndicator: null,
                        layoutPosition: null,
                        slideIndicator: null
                    }
                };
            }
        };

        const processLayoutTarget = (e: DragEvent, layoutId: string, layoutNode: HTMLElement, isMultiCellRow?: boolean) => {
            // Get layout dimensions
            const rect = layoutNode.getBoundingClientRect();
            const layout = getLayout(layoutId);
            if (!layout) return;

            // Calculate distances from edges
            const distanceFromTop = e.clientY - rect.top;
            const distanceFromBottom = rect.bottom - e.clientY;
            const distanceFromLeft = e.clientX - rect.left;
            const distanceFromRight = rect.right - e.clientX;

            // Find minimum distance
            const minDistance = Math.min(distanceFromTop, distanceFromBottom, distanceFromLeft, distanceFromRight);

            // Determine position based on closest edge
            let position: Position | null = null;

            if (minDistance === distanceFromTop) {
                position = 'top';
            } else if (minDistance === distanceFromBottom) {
                position = 'bottom';
            } else if (minDistance === distanceFromLeft) {
                position = 'left';
            } else if (minDistance === distanceFromRight) {
                position = 'right';
            }

            if (!position ||
                (prevStateRef.current.indicators.layoutIndicator === layoutId &&
                    prevStateRef.current.indicators.layoutPosition === position)) {
                return;
            }
            // Only update if position is valid and state changed

            if (position === 'left' || position === 'right') {
                const layout = getLayout(layoutId);
                if (!layout) return;

                let cellIndex: number = 0;

                if (isMultiCellRow) {
                    cellIndex = position === 'left' ? 0 : layout.gridStructure.rows[0].cells.length - 1;
                }

                const cellId = layout.gridStructure.rows[0].cells[cellIndex].id;
                const cellNode = document.querySelector(`[data-cell-id="${cellId}"]`);

                if (!cellNode) return;

                processCellTarget(e, cellId, layoutId, cellNode as HTMLElement);
                return;
            }
            // Set indicators
            setLayoutIndicator(layoutId, position);
            setElementIndicator(null, null);
            setSlideIndicator(null);

            // Update target state
            setDropTarget({
                elementId: null,
                layoutId,
                cellId: null,
                position
            });

            // Update reference to previous state
            prevStateRef.current = {
                ...state,
                indicators: {
                    ...state.indicators,
                    layoutIndicator: layoutId,
                    layoutPosition: position,
                    elementIndicator: null,
                    elementPosition: null,
                    slideIndicator: null
                }
            };
        }


        // Document-level drop handler
        const handleDocumentDrop = (e: DragEvent) => {
            e.preventDefault();

            if (prevStateRef.current.dragState === 'dragging') {
                // Process drop based on current indicators
                if (prevStateRef.current.indicators.slideIndicator) {
                    processSlideDrop();
                } else if (prevStateRef.current.indicators.layoutIndicator && prevStateRef.current.indicators.layoutPosition) {
                    processLayoutDrop();
                } else if (prevStateRef.current.indicators.cellIndicator && prevStateRef.current.indicators.cellPosition) {
                    processCellDrop();
                } else if (prevStateRef.current.indicators.elementIndicator && prevStateRef.current.indicators.elementPosition) {
                    processElementDrop();
                }

                // Complete the drop operation
                completeDrop();
            }
        };

        // Escape key handler
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && state.dragState === 'dragging') {
                cancelDrag();
            }
        };

        // Add global event listeners
        document.addEventListener('dragover', handleDocumentDragOver);
        document.addEventListener('drop', handleDocumentDrop);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener('dragover', handleDocumentDragOver);
            document.removeEventListener('drop', handleDocumentDrop);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [state.dragState, state.source]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Logic moved to document-level handler
    };

    // Implementation of processElementDrop
    const processElementDrop = () => {
        if (!prevStateRef.current.target.elementId || !prevStateRef.current.target.layoutId || !prevStateRef.current.indicators.elementPosition || !prevStateRef.current.source.layoutId
        ) {
            return;
        }

        const sourceLayout = getLayout(prevStateRef.current.source.layoutId);
        const targetLayout = getLayout(prevStateRef.current.target.layoutId);
        let draggedElement;
        if (prevStateRef.current.source.elementId) {
            draggedElement = getElement(prevStateRef.current.source.elementId, prevStateRef.current.source.layoutId);
        }
        let draggedCell;
        if (prevStateRef.current.source.cellId) {
            draggedCell = getCell(prevStateRef.current.source.cellId, prevStateRef.current.source.layoutId);
        }

        if (!sourceLayout || !targetLayout) {
            return;
        }

        // Ensure we have either a valid element or cell to drag
        if (!draggedElement && !draggedCell) {
            console.warn('No valid element or cell found for dragging');
            return;
        }

        const position = prevStateRef.current.indicators.elementPosition;
        const slide = getLayoutSlide(targetLayout.id);
        if (!slide) return;


        if (draggedElement) {
            const targetElement = targetLayout.elements.find(e => e.id === prevStateRef.current.target.elementId);
            if (!targetElement) return;

            // Case 2.1: left/right of element
            if (position === 'left' || position === 'right') {
                // Change the position of source cell
                const updatedElements = [...targetLayout.elements];
                const sourceIndex = updatedElements.findIndex(e => e.id === draggedElement!.id);
                const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

                if (sourceIndex !== -1 && targetIndex !== -1) {
                    const [movedElement] = updatedElements.splice(sourceIndex, 1);
                    updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, movedElement);

                    updateLayout(presentationId, slide.id, targetLayout.id, {
                        elements: updatedElements
                    });
                }
            }
            // Case 2.2: top/bottom
            else if ((position === 'top' || position === 'bottom') && draggedCell) {
                // Create a new layout for each element in the cell
                const elementsInSourceCell = sourceLayout.elements.filter(e => e.cellId === draggedCell.id);

                const updatedNewElements = elementsInSourceCell.map(e => ({ ...e, cellId: targetElement.cellId }));
                const updatedTargetElements = position === 'top' ? [...updatedNewElements, ...targetLayout.elements] : [...targetLayout.elements, ...updatedNewElements];
                const updatedSourceElements = sourceLayout.elements.filter(e => e.cellId !== draggedCell.id);

                const targetGridStructure = { ...targetLayout.gridStructure }
                const sourceGridStructure = { ...sourceLayout.gridStructure }

                // Delete source cell
                updateLayout(presentationId, slide.id, targetLayout.id, {
                    elements: updatedTargetElements,
                    gridStructure: targetGridStructure
                });

                const updatedSourceGridStructure = { ...sourceGridStructure };
                updatedSourceGridStructure.rows[0].cells = updatedSourceGridStructure.rows[0].cells.filter(c => c.id !== draggedCell.id);
                if (updatedSourceGridStructure.rows[0].cells.length === 0) {
                    deleteLayout(presentationId, slide.id, sourceLayout.id);
                } else {
                    updatedSourceGridStructure.columns = updatedSourceGridStructure.columns - 1;
                    const updatedSourceColumnWidths = getColumnWidths(updatedSourceGridStructure.columns);

                    updateLayout(presentationId, slide.id, sourceLayout.id, {
                        elements: updatedSourceElements,
                        gridStructure: {
                            ...updatedSourceGridStructure,
                            columnWidths: updatedSourceColumnWidths
                        }
                    });
                }
            }
        } else if (draggedCell) {
            // перетаскивание внутри одного layout
            if (targetLayout.id === sourceLayout.id) {
                if (position === 'top' || position === 'bottom') {
                    // меняем celId у элементов
                    // обновляем elements в target cell
                    // в sorce cell добавляем пустой редактор
                    const targetElement = targetLayout.elements.find(c => c.id === prevStateRef.current.target.elementId!);
                    if (!targetElement) return;

                    const targetCellId = targetElement.cellId;

                    const updatedSourceElements = sourceLayout.elements.filter(e => e.cellId === draggedCell.id).map(el => ({ ...el, cellId: targetCellId }));
                    const updatedLayoutElements = sourceLayout.elements.filter(e => e.cellId !== draggedCell.id);

                    const updatedElements = position === 'top' ? [...updatedSourceElements, ...updatedLayoutElements] : [...updatedLayoutElements, ...updatedSourceElements];

                    const editor: Element = {
                        id: generateId(8),
                        type: 'editor',
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        cellId: draggedCell.id,
                        style: {},
                        zIndex: 1,
                    }

                    updatedElements.push(editor);

                    updateLayout(presentationId, slide.id, sourceLayout.id, {
                        elements: updatedElements
                    });
                }
            }
        }
    };

    const processSlideDrop = () => {
        // TODO: Implement slide drop
    }

    // Implementation of processLayoutDrop
    const processLayoutDrop = () => {
        if (!prevStateRef.current.indicators.layoutIndicator || !prevStateRef.current.indicators.layoutPosition || !prevStateRef.current.source.layoutId ||
            (!prevStateRef.current.source.elementId
                && !prevStateRef.current.source.cellId
            )
        ) {
            return;
        }

        const sourceLayout = getLayout(prevStateRef.current.source.layoutId);
        const targetLayout = getLayout(prevStateRef.current.indicators.layoutIndicator);

        if (!sourceLayout || !targetLayout) {
            return;
        }
        const slide = getLayoutSlide(prevStateRef.current.source.layoutId);
        if (!slide) return;

        if (prevStateRef.current.source.elementId) {
            const draggedElement = sourceLayout.elements.find(e => e.id === prevStateRef.current.source.elementId);
            if (!draggedElement) {
                console.warn('No valid element found for dragging in processLayoutDrop');
                return;
            }

            const position = prevStateRef.current.indicators.layoutPosition;

            const targetGridStructure = { ...targetLayout.gridStructure };
            // Case 3: cell move by 1 element
            if (position === 'left' || position === 'right') {
                // создаём новую ячейку
                // обновляем cellId у элемента
                // обновляем columnWidths в целевой gridStructure
                // обновляем elements в целевой layout
                // обновляем cells в целевой gridStructure
                // удаляеми сходную сетку

                // будем создавать новую ячейку в целевой сетке. считаем новое количество колонок
                const newColumnCount = targetGridStructure.columns + 1;
                // считаем новые ширины колонок
                const newColumnWidths = getColumnWidths(newColumnCount);
                // определяем позицию новой ячейки
                const newCellPosition = position === 'left' ? 0 : 1;

                const newCellId = generateId();
                const newCell = {
                    id: newCellId,
                    column: newCellPosition + 1,
                    row: 1,
                };

                const updatedDraggedElement: Element = {
                    ...draggedElement,
                    cellId: newCellId
                };

                const updatedTargetLayoutElements = [...targetLayout.elements];
                updatedTargetLayoutElements.splice(newCellPosition, 0, updatedDraggedElement);

                targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

                targetGridStructure.rows[0].cells.forEach(c => {
                    if (c.column >= newCellPosition && c.id !== newCellId) {
                        c.column = c.column + 1;
                    }
                })
                targetGridStructure.rows[0].cells.sort((a, b) => a.column - b.column);

                // Update target layout
                updateLayout(presentationId, slide.id, targetLayout.id, {
                    gridStructure: {
                        ...targetGridStructure,
                        // rows: [{
                        //     ...targetLayout.gridStructure.rows[0],
                        //     cells: position === 'left' ? [newCell, ...targetLayout.gridStructure.rows[0].cells] : [...targetLayout.gridStructure.rows[0].cells, newCell]
                        // }],
                        columnWidths: newColumnWidths,
                        columns: newColumnCount
                    },
                    elements: updatedTargetLayoutElements,
                });

                if (sourceLayout.elements.length === 1) {
                    deleteLayout(presentationId, slide.id, sourceLayout.id);
                } else {
                    const updatedElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);
                    const elementsInCell = updatedElements.filter(e => e.cellId === draggedElement.cellId);

                    if (elementsInCell.length === 0) {
                        const updatedCells = sourceLayout.gridStructure.rows[0].cells.filter(c => c.id !== draggedElement.cellId);
                        const updatedColumnWidthsSourceLayout = getColumnWidths(sourceLayout.gridStructure.columns - 1);

                        updateLayout(presentationId, slide.id, sourceLayout.id, {
                            gridStructure: {
                                ...sourceLayout.gridStructure,
                                columns: sourceLayout.gridStructure.columns - 1,
                                rows: [{
                                    ...sourceLayout.gridStructure.rows[0],
                                    cells: updatedCells
                                }],
                                columnWidths: updatedColumnWidthsSourceLayout
                            },
                            elements: updatedElements
                        });
                    } else {
                        updateLayout(presentationId, slide.id, sourceLayout.id, {
                            elements: updatedElements
                        });
                    }
                    // Delete source cell
                }
            }
            // Case 3.2: top/bottom
            else if (position === 'top' || position === 'bottom') {
                const draggedElement = sourceLayout.elements.find(e => e.id === prevStateRef.current.source.elementId);

                if (!draggedElement) {
                    console.warn('No valid element found for dragging in processLayoutDrop');
                    return;
                }

                const elementsSourceCell = sourceLayout.elements.filter(e => e.cellId === draggedElement.cellId);

                if (sourceLayout.elements.length === 1) {
                    // элемент 1. переносим на новую позицию
                    const indexSourceLayout = slide.layouts.findIndex(l => l.id === sourceLayout.id);
                    slide.layouts.splice(indexSourceLayout, 1);

                    const indexTargetLayout = slide.layouts.findIndex(l => l.id === targetLayout.id);
                    const targetIndex = position === 'top' ? indexTargetLayout : indexTargetLayout + 1;
                    slide.layouts.splice(targetIndex, 0, sourceLayout);

                    updateSlide(presentationId, slide.id, slide);
                } else {
                    if (elementsSourceCell.length === 1) {
                        // переносим только элемент. на его месте создаем пустой редактор
                        // из elements в source layout удаляем элемент
                        // в source layout добавляем пустой редактор
                        // обновляем elements в source layout
                        // в target layout фильтруем элементы от элементов целевой ячейки
                        // вставляем между целевыми элементами элементы из source layout
                        // обновляем elements в target layout
                        const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);

                        const editor: Element = {
                            id: generateId(8),
                            type: 'editor',
                            content: '',
                            position: { x: 0, y: 0 },
                            size: { width: 100, height: 100 },
                            cellId: draggedElement.cellId,
                            style: {},
                            zIndex: 1,
                        }

                        updatedSourceElements.push(editor);

                        updateLayout(presentationId, slide.id, sourceLayout.id, {
                            elements: updatedSourceElements,
                        });

                        const newCellId = generateId();
                        const newLayout: Layout = {
                            id: generateId(),
                            gridStructure: {
                                rows: [{
                                    id: generateId(),
                                    cells: [{
                                        id: newCellId,
                                        row: 1,
                                        column: 1,
                                    }],
                                }],
                                columns: 1,
                                columnWidths: getColumnWidths(1)
                            },
                            elements: [{
                                ...draggedElement,
                                cellId: newCellId
                            }],
                            type: 'single-column',
                            style: {}
                        }

                        const targetLayoutIndex = slide.layouts.findIndex(l => l.id === targetLayout.id);

                        const newLayoutsOffset = prevStateRef.current.indicators.layoutPosition === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

                        addLayout(presentationId, slide.id, newLayout, newLayoutsOffset);
                    } else {
                        // элементов несколько. только переносим source element
                        const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);
                        updateLayout(presentationId, slide.id, sourceLayout.id, {
                            elements: updatedSourceElements,
                        });

                        const newCellId = generateId();
                        const newLayout: Layout = {
                            id: generateId(),
                            gridStructure: {
                                rows: [{
                                    id: generateId(),
                                    cells: [{
                                        id: newCellId,
                                        row: 1,
                                        column: 1,
                                    }],
                                }],
                                columns: 1,
                                columnWidths: getColumnWidths(1)
                            },
                            elements: [{
                                ...draggedElement,
                                cellId: newCellId
                            }],
                            type: 'single-column',
                            style: {}
                        }

                        const targetLayoutIndex = slide.layouts.findIndex(l => l.id === targetLayout.id);

                        const newLayoutsOffset = prevStateRef.current.indicators.layoutPosition === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

                        addLayout(presentationId, slide.id, newLayout, newLayoutsOffset);
                    }
                }
            }
        } else if (prevStateRef.current.source.cellId) {
            // перетаскиваем ячейку сверху/снизу layout
            const targetLayoutIndex = slide.layouts.findIndex(l => l.id === targetLayout.id);

            const newLayoutsOffset = prevStateRef.current.indicators.layoutPosition === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

            const sourceCellElements = sourceLayout.elements.filter(e => e.cellId === prevStateRef.current.source.cellId);

            const newLayouts = sourceCellElements.map((element) => {
                const newLayoutId = generateId();
                const newCellId = generateId();

                return {
                    id: newLayoutId,
                    gridStructure: {
                        rows: [{
                            id: generateId(),
                            cells: [{
                                id: newCellId,
                                row: 1,
                                column: 1,
                            }]
                        }],
                        columns: 1,
                        columnWidths: getColumnWidths(1)
                    },
                    elements: [{
                        ...element,
                        cellId: newCellId
                    }],
                    type: 'single-column',
                    style: {}
                } as Layout
            })

            slide.layouts.splice(newLayoutsOffset, 0, ...newLayouts);

            updateSlide(presentationId, slide.id, slide);

            const updatedSourceGridStructure = { ...sourceLayout.gridStructure };
            updatedSourceGridStructure.rows[0].cells = updatedSourceGridStructure.rows[0].cells.filter(c => c.id !== prevStateRef.current.source.cellId);
            updatedSourceGridStructure.columns = updatedSourceGridStructure.columns - 1;
            const updatedSourceColumnWidths = getColumnWidths(updatedSourceGridStructure.columns);
            const updatedSourceElements = sourceLayout.elements.filter(e => e.cellId !== prevStateRef.current.source.cellId);
            updateLayout(presentationId, slide.id, sourceLayout.id, {
                gridStructure: { ...updatedSourceGridStructure, columnWidths: updatedSourceColumnWidths },
                elements: updatedSourceElements
            });
        }
    };

    const processCellDrop = () => {
        if (!prevStateRef.current.target.cellId || (!prevStateRef.current.source.elementId && !prevStateRef.current.source.cellId) ||
            !prevStateRef.current.source.layoutId || !prevStateRef.current.target.layoutId
        ) {
            return;
        }

        const sourceLayout = getLayout(prevStateRef.current.source.layoutId);
        const targetLayout = getLayout(prevStateRef.current.target.layoutId);

        if (!sourceLayout || !targetLayout) {
            return;
        }

        const slide = getLayoutSlide(targetLayout.id);
        if (!slide) return;

        const targetGridStructure = { ...targetLayout.gridStructure };
        if (sourceLayout.id === targetLayout.id) {
            // перемещение внутри одного layout
            if (prevStateRef.current.source.elementId) {
                // перемещение элемента
                // создаем новую ячейку в целевой сетке
                // обновляем cellId у элемента
                // если элемент был единственным в ячейке, то создаем пустой редактор в source cell
                // обновляем elements в целевой сетке
                // обновляем cells в целевой сетке
                // обновляем широты колонок в целевой сетке

                const sourceElement = sourceLayout.elements.find(e => e.id === prevStateRef.current.source.elementId);
                const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === sourceElement?.cellId);
                if (!sourceElement || !sourceCell) return;

                const newCellId = generateId();
                const newCell: GridCell = {
                    id: newCellId,
                    row: 1,
                    column: 1,
                };

                const updatedElements = targetLayout.elements.map(el => {
                    if (el.id === sourceElement.id) {
                        return {
                            ...el,
                            cellId: newCellId
                        }
                    }
                    return el;
                })

                const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(c => c.id === prevStateRef.current.target.cellId);

                const newCellPosition = prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
                targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

                targetGridStructure.rows[0].cells.forEach((c, index) => {
                    c.column = index + 1;
                })

                targetGridStructure.rows[0].cells.sort((a, b) => a.column - b.column);

                const elementsInCell = updatedElements.filter(e => e.cellId === sourceElement.cellId);
                if (elementsInCell.length === 0) {
                    const editor: Element = {
                        id: generateId(8),
                        type: 'editor',
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        style: { fontSize: '16px', color: '#333333' },
                        zIndex: 1,
                        placeholder: 'Левая колонка...',
                        cellId: sourceElement.cellId
                    };
                    updatedElements.push(editor);
                }

                updateLayout(presentationId, slide.id, targetLayout.id, {
                    gridStructure: {
                        ...targetGridStructure,
                        columns: targetGridStructure.columns + 1,
                        columnWidths: getColumnWidths(targetGridStructure.columns + 1)
                    },
                    elements: updatedElements,
                });
            } else if (prevStateRef.current.source.cellId) {
                // перемещение ячейки
                const sourceCellIndex = targetGridStructure.rows[0].cells.findIndex(c => c.id === prevStateRef.current.source.cellId);
                const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(c => c.id === prevStateRef.current.target.cellId);

                const sourceCell = targetGridStructure.rows[0].cells[sourceCellIndex];
                const updatedCells = targetGridStructure.rows[0].cells.filter(c => c.id !== prevStateRef.current.source.cellId);
                const newTargetCellIndex = updatedCells.findIndex(c => c.id === prevStateRef.current.target.cellId);

                const newCellPosition = (prevStateRef.current.indicators.cellPosition === 'left' ? newTargetCellIndex : newTargetCellIndex + 1) + 1;
                updatedCells.splice(newCellPosition - 1, 0, {
                    ...sourceCell,
                    column: newCellPosition
                });

                updatedCells.forEach((c, index) => {
                    c.column = index + 1;
                })

                updatedCells.sort((a, b) => a.column - b.column);

                const sourceCellWidth = targetGridStructure.columnWidths[sourceCellIndex];
                const targetCellWidth = targetGridStructure.columnWidths[targetCellIndex];

                targetGridStructure.columnWidths[sourceCellIndex] = targetCellWidth;
                targetGridStructure.columnWidths[targetCellIndex] = sourceCellWidth;

                targetGridStructure.rows[0].cells = updatedCells;
                updateLayout(presentationId, slide.id, targetLayout.id, {
                    gridStructure: {
                        ...targetGridStructure,
                        columnWidths: targetGridStructure.columnWidths
                    },
                });
            }
        } else {
            if (prevStateRef.current.source.elementId) {
                // перемещение элемента
                // в target layout создаем новую ячейку
                // в source layout удаляем элемент
                // обновляем elements в target layout
                // обновляем cells в target layout
                // если в source layout была 1 ячейка, то удаляем layout
                // если в source layout больше 1 ячейки, то обновляем cells в source layout
                // и если это был 1 элемент в ячейке, то создаем пустой редактор в source cell
                const sourceElement = sourceLayout.elements.find(e => e.id === prevStateRef.current.source.elementId);
                const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === sourceElement?.cellId);

                const targetCell = targetLayout.gridStructure.rows[0].cells.find(c => c.id === prevStateRef.current.target.cellId);

                if (!sourceElement || !sourceCell || !targetCell) return;

                const newCellId = generateId();
                const newCell: GridCell = {
                    id: newCellId,
                    row: 1,
                    column: 1,
                };

                const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(c => c.id === prevStateRef.current.target.cellId);

                const newCellPosition = prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
                targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

                const updatedTargetElements = [...targetLayout.elements];
                updatedTargetElements.splice(newCellPosition, 0, {
                    ...sourceElement,
                    cellId: newCellId
                });

                targetGridStructure.rows[0].cells.forEach((c, index) => {
                    c.column = index + 1;
                })

                targetGridStructure.rows[0].cells.sort((a, b) => a.column - b.column);

                updateLayout(presentationId, slide.id, targetLayout.id, {
                    gridStructure: {
                        ...targetGridStructure,
                        columns: targetGridStructure.columns + 1,
                        columnWidths: getColumnWidths(targetGridStructure.columns + 1)
                    },
                    elements: updatedTargetElements,
                });

                const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== sourceElement.id);

                if (sourceLayout.gridStructure.rows[0].cells.length === 1) {
                    deleteLayout(presentationId, slide.id, sourceLayout.id);
                    return;
                }

                const elementsInSourceCell = updatedSourceElements.filter(e => e.cellId === sourceElement.cellId);
                if (elementsInSourceCell.length === 0) {
                    const editor: Element = {
                        id: generateId(8),
                        type: 'editor',
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        style: { fontSize: '16px', color: '#333333' },
                        zIndex: 1,
                        placeholder: 'Левая колонка...',
                        cellId: sourceElement.cellId
                    };
                    updatedSourceElements.push(editor);
                }

                updateLayout(presentationId, slide.id, sourceLayout.id, {
                    elements: updatedSourceElements,
                });
            } else if (prevStateRef.current.source.cellId) {
                // перемещение ячейки из одного layout в другой
                // в target layout создаем новую ячейку
                // в source layout удаляем ячейку
                // обновляем elements в target layout
                // обновляем cells в target layout
                // обновляем elements в source layout
                const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === prevStateRef.current.source.cellId);

                const targetCell = targetLayout.gridStructure.rows[0].cells.find(c => c.id === prevStateRef.current.target.cellId);

                if (!sourceCell || !targetCell) return;

                const newCellId = generateId();
                const newCell: GridCell = {
                    id: newCellId,
                    row: 1,
                    column: 1,
                };

                const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(c => c.id === prevStateRef.current.target.cellId);

                const newCellPosition = prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
                targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

                const updatedTargetElements = [...targetLayout.elements];

                const elementsInSourceCell = sourceLayout.elements.filter(e => e.cellId === sourceCell.id);

                elementsInSourceCell.forEach(e => {
                    updatedTargetElements.push({
                        ...e,
                        cellId: newCellId
                    })
                })

                targetGridStructure.rows[0].cells.forEach((c, index) => {
                    c.column = index + 1;
                })

                targetGridStructure.rows[0].cells.sort((a, b) => a.column - b.column);

                updateLayout(presentationId, slide.id, targetLayout.id, {
                    gridStructure: {
                        ...targetGridStructure,
                        columns: targetGridStructure.columns + 1,
                        columnWidths: getColumnWidths(targetGridStructure.columns + 1)
                    },
                    elements: updatedTargetElements,
                });

                const updatedSourceElements = sourceLayout.elements.filter(sourceElement => !elementsInSourceCell.find(el => el.id === sourceElement.id));

                const updatedSourceCells = sourceLayout.gridStructure.rows[0].cells.filter(c => c.id !== sourceCell.id);

                updateLayout(presentationId, slide.id, sourceLayout.id, {
                    elements: updatedSourceElements,
                    gridStructure: {
                        ...sourceLayout.gridStructure,
                        rows: [{
                            ...sourceLayout.gridStructure.rows[0],
                            cells: updatedSourceCells
                        }],
                        columns: sourceLayout.gridStructure.columns - 1,
                        columnWidths: getColumnWidths(sourceLayout.gridStructure.columns - 1)
                    }
                });
            }
        }
    }

    // Provide the context value
    const contextValue: DndContextType = {
        state,
        startDrag,
        setDropTarget,
        setElementIndicator,
        setCellIndicator,
        setLayoutIndicator,
        setSlideIndicator,
        completeDrop,
        cancelDrag,
        handleDragStart,
        handleDrop,
        isDragging,
        getElement,
        getLayout,
        processElementDrop,
        processLayoutDrop,
        processSlideDrop,
        setReadyToDrop
    };

    return (
        <DndContext.Provider value={contextValue}>
            {children}
        </DndContext.Provider>
    );
};

// Custom hook for using the DnD context
export const useDnd = () => {
    const context = useContext(DndContext);
    if (context === undefined) {
        throw new Error('useDnd must be used within a DndProvider');
    }
    return context;
}; 