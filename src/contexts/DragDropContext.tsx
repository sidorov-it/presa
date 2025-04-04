import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo, useCallback } from 'react';
import deepEqual from 'deep-equal';
import { BaseElement, GridCell, GridStructure, Layout, Slide, TextElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';
import { DragDropTransactionHelper } from './DragDropTransactionHelper';
import { DndState, DndAction, DropTarget, Position } from '@/types/DragDropTypes';
import { getNewElement } from '@/elements/registry';

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
    newElement: {
        id: null,
        defaultProps: null
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
                indicators: { ...initialState.indicators },
                newElement: { ...initialState.newElement }
            };
            break;

        case 'START_DRAG_MENU_ITEM':
            updatedState = {
                ...state,
                dragState: 'dragging',
                target: { ...initialState.target },
                indicators: { ...initialState.indicators },
                newElement: action.payload
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

const getEmptyLayout = () => {
    const layout: Layout = {
        id: generateId(),
        type: 'single-column',
        elements: [],
        style: {},
        gridStructure: {
            rows: [{
                id: generateId(),
                cells: []
            }],
            columns: 1,
            columnWidths: [],
        }
    }
    return layout;
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
    handleNewElementDragStart: (e: React.DragEvent<HTMLDivElement>, elementId: string, defaultProps: any) => void;
    isDragging: () => boolean;
    getElement: (elementId: string, layoutId: string) => BaseElement | undefined;
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
    const [state, dispatch] = useReducer(dndReducer, initialState);

    // Use a selector to only get the specific presentation data needed
    // const { getPresentation } = usePresentationStore();

    // Memoize these helper functions to prevent recreation on each render
    const getLayoutSlide = useCallback((layoutId: string) => {
        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return undefined;
        return presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
    }, [presentationId]);

    const getLayout = useCallback((layoutId: string): Layout | undefined => {
        const presentation = usePresentationStore.getState().getPresentation(presentationId);

        if (!presentation) return undefined;
        const slide = presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
        if (!slide) return undefined;
        return slide.layouts.find(l => l.id === layoutId);
    }, []);

    const getElement = useCallback((elementId: string, layoutId: string): BaseElement | undefined => {
        const layout = getLayout(layoutId);
        if (!layout) return undefined;
        return layout.elements.find(e => e.id === elementId);
    }, [getLayout]);

    const getCell = useCallback((cellId: string, layoutId: string): GridCell | undefined => {
        const layout = getLayout(layoutId);
        if (!layout) return undefined;
        return layout.gridStructure.rows[0].cells.find(cell => cell.id === cellId)
    }, [getLayout]);

    // Basic handler functions with useCallback to prevent recreating on each render
    const startDrag = useCallback((elementId: string | null, layoutId: string, cellId?: string) => {
        dispatch({ type: 'START_DRAG', payload: { elementId, layoutId, cellId } });
    }, []);

    const setDropTarget = useCallback((target: DropTarget) => {
        dispatch({ type: 'SET_DROP_TARGET', payload: target });
    }, []);

    const setElementIndicator = useCallback((elementId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_ELEMENT_INDICATOR', payload: { elementId, position } });
    }, []);

    const setCellIndicator = useCallback((cellId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_CELL_INDICATOR', payload: { cellId, position } });
    }, []);

    const setLayoutIndicator = useCallback((layoutId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_LAYOUT_INDICATOR', payload: { layoutId, position } });
    }, []);

    const setSlideIndicator = useCallback((slideId: string | null) => {
        dispatch({ type: 'SET_SLIDE_INDICATOR', payload: slideId });
    }, []);

    const completeDrop = useCallback(() => {
        dispatch({ type: 'COMPLETE_DROP' });
    }, []);

    const cancelDrag = useCallback(() => {
        dispatch({ type: 'CANCEL_DRAG' });
    }, []);

    const isDragging = useCallback(() => state.dragState === 'dragging', [state.dragState]);

    const setReadyToDrop = useCallback((isReady: boolean) => {
        dispatch({ type: 'SET_READY_TO_DROP', payload: isReady });
    }, []);

    // Event handlers with useCallback
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, elementId: string | null, layoutId: string, cellId?: string) => {
        e.stopPropagation();
        startDrag(elementId, layoutId, cellId);

        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
            elementId,
            layoutId,
            cellId
        }));
    }, [startDrag]);

    const handleNewElementDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string, defaultProps: any) => {
        e.stopPropagation();
        dispatch({ type: 'START_DRAG_MENU_ITEM', payload: { id, defaultProps } });
    }, []);

    // Centralized drag over handling with document-level listeners
    const processAddElementToCell = useCallback(({
        element,
        targetLayout,
        targetElement,
        targetSlide,
        position
    }: {
        element: Omit<BaseElement, 'cellId'>,
        targetLayout: Layout,
        targetElement: BaseElement,
        targetSlide: Slide,
        position: Position
    }) => {
        if (position === 'left' || position === 'right') {
            // Change the position of source cell
            const updatedElements = [...targetLayout.elements];
            const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

            if (targetIndex !== -1) {
                updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, {
                    ...element,
                    cellId: targetElement.cellId
                });

                DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                    elements: updatedElements
                });
            }
        } else {
            const targetElementIndex = targetLayout.elements.findIndex(e => e.id === targetElement.id);

            const updatedElement = {
                ...element,
                cellId: targetElement.cellId
            }

            const targetIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;
            const updatedTargetElements = [...targetLayout.elements].filter(el => el.id !== element.id);
            updatedTargetElements.splice(targetIndex, 0, updatedElement);

            console.log('updatedTargetElements', updatedTargetElements);
            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                elements: updatedTargetElements,
            });
        }
    }, [presentationId]);

    const processMoveCellToCellInCurrentLayoutVertical = useCallback(({
        sourceLayout,
        targetLayout,
        draggedCell,
        targetSlide,
        position
    }: {
        sourceLayout: Layout,
        targetLayout: Layout,
        draggedCell: GridCell,
        targetSlide: Slide,
        position: Position
    }) => {
        const targetElement = targetLayout.elements.find(c => c.id === prevStateRef.current.target.elementId!);
        if (!targetElement) return;

        const targetCellId = targetElement.cellId;

        const updatedSourceElements = sourceLayout.elements.filter(e => e.cellId === draggedCell.id).map(el => ({ ...el, cellId: targetCellId }));
        const updatedLayoutElements = sourceLayout.elements.filter(e => e.cellId !== draggedCell.id);

        const updatedElements = position === 'top' ? [...updatedSourceElements, ...updatedLayoutElements] : [...updatedLayoutElements, ...updatedSourceElements];

        const editor: TextElement = {
            id: generateId(8),
            type: 'editor',
            textType: 'text',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            cellId: draggedCell.id,
            style: {},
            zIndex: 1,
        }

        updatedElements.push(editor);

        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, sourceLayout.id, {
            elements: updatedElements
        });
    }, [presentationId]);

    const processMoveCellToCellInOtherLayoutVertical = useCallback(({
        sourceLayout,
        targetLayout,
        draggedCell,
        targetSlide,
        sourceSlide,
        position
    }: {
        sourceLayout: Layout,
        targetLayout: Layout,
        draggedCell: GridCell,
        targetSlide: Slide,
        sourceSlide: Slide,
        position: Position
    }) => {
        const targetElement = targetLayout.elements.find(c => c.id === prevStateRef.current.target.elementId!);
        if (!targetElement) return;

        const targetCellId = targetElement.cellId;

        const updatedSourceDraggedElements = sourceLayout.elements.filter(e => e.cellId === draggedCell.id).map(el => ({ ...el, cellId: targetCellId }));

        const elementsInTargetCell = targetLayout.elements.filter(e => e.cellId === targetCellId);
        const targetElementIndex = elementsInTargetCell.findIndex(e => e.id === targetElement.id);

        const positionIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;


        const updatedElements = [...targetLayout.elements];
        updatedElements.splice(positionIndex, 0, ...updatedSourceDraggedElements);

        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
            elements: updatedElements
        });

        const updatedSourceLayoutElements = sourceLayout.elements.filter(e => e.cellId !== draggedCell.id);

        const editor: TextElement = {
            id: generateId(8),
            type: 'editor',
            textType: 'text',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 100 },
            cellId: draggedCell.id,
            style: {},
            zIndex: 1,
        }

        updatedSourceLayoutElements.push(editor);

        DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
            elements: updatedSourceLayoutElements
        });
    }, [presentationId]);

    const processMoveCellToElementVertical = useCallback(({
        sourceLayout,
        targetLayout,
        targetElement,
        draggedElement,
        targetSlide,
        sourceSlide,
        position
    }: {
        sourceLayout: Layout,
        sourceSlide: Slide,
        targetLayout: Layout,
        targetElement: BaseElement,
        draggedElement: BaseElement,
        targetSlide: Slide,
        position: Position
    }) => {
        // Create a new layout for each element in the cell
        const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === draggedElement.cellId);
        if (!sourceCell) return;

        if (targetLayout.id === sourceLayout.id) {
            const elementsInSourceCell = sourceLayout.elements.filter(e => e.cellId === sourceCell.id && e.id !== draggedElement.id);
            const targetElementIndex = targetLayout.elements.findIndex(e => e.id === targetElement.id);

            const updatedElement = {
                ...draggedElement,
                cellId: targetElement.cellId
            }

            const targetIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;
            const updatedTargetElements = [...targetLayout.elements].filter(el => el.id !== draggedElement.id);
            updatedTargetElements.splice(targetIndex, 0, updatedElement);

            if (elementsInSourceCell.length === 0) {
                const editor: TextElement = {
                    id: generateId(8),
                    type: 'editor',
                    textType: 'text',
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    cellId: draggedElement.cellId,
                    style: {},
                    zIndex: 1,
                }

                updatedTargetElements.push(editor);
            }
            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                elements: updatedTargetElements,
            });
        } else {
            const targetElementIndex = targetLayout.elements.findIndex(e => e.id === targetElement.id);

            const updatedElement = {
                ...draggedElement,
                cellId: targetElement.cellId
            }

            const targetIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;
            const updatedTargetElements = [...targetLayout.elements].filter(el => el.id !== draggedElement.id);
            updatedTargetElements.splice(targetIndex, 0, updatedElement);

            console.log('updatedTargetElements', updatedTargetElements);
            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                elements: updatedTargetElements,
            });

            const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);
            const elementsInSourceCell = updatedSourceElements.filter(e => e.cellId === sourceCell.id);
            if (updatedSourceElements.length === 0) {
                if (sourceSlide.layouts.length === 1) {
                    DragDropTransactionHelper.deleteSlide(presentationId, sourceSlide.id);
                } else {
                    DragDropTransactionHelper.deleteLayout(presentationId, sourceSlide.id, sourceLayout.id);
                }
            } else if (elementsInSourceCell.length === 0 && sourceLayout.gridStructure.columns > 1) {
                const editor: TextElement = {
                    id: generateId(8),
                    type: 'editor',
                    textType: 'text',
                    content: '',
                    position: { x: 0, y: 0 },
                    size: { width: 100, height: 100 },
                    cellId: draggedElement.cellId,
                    style: {},
                    zIndex: 1,
                }

                updatedSourceElements.push(editor);
                DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                    elements: updatedSourceElements,
                });
            }

        }
    }, [presentationId]);

    const processMoveElementToElementHorizontal = useCallback(({
        draggedElement,
        targetLayout,
        targetElement,
        targetSlide,
        position
    }: {
        draggedElement: Omit<BaseElement, 'cellId'>,
        targetLayout: Layout,
        targetElement: BaseElement,
        targetSlide: Slide,
        position: Position
    }) => {
        // Change the position of source cell
        const updatedElements = [...targetLayout.elements];
        const sourceIndex = updatedElements.findIndex(e => e.id === draggedElement!.id);
        const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

        if (sourceIndex !== -1 && targetIndex !== -1) {
            const [movedElement] = updatedElements.splice(sourceIndex, 1);
            updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, movedElement);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                elements: updatedElements
            });
        }
    }, [presentationId]);


    const processAddElementToSiblingCell = useCallback(({
        targetLayout,
        targetSlide,
        elementTypeId,
    }: {
        targetLayout: Layout,
        targetSlide: Slide,
        elementTypeId: string,
    }) => {
        const newElement = getNewElement(elementTypeId);

        if (!newElement) {
            return;
        }
        const targetCell = targetLayout.gridStructure.rows[0].cells.find(c => c.id === prevStateRef.current.target.cellId);

        if (!targetCell) return;

        const newCellId = generateId();
        const newCell: GridCell = {
            id: newCellId,
            row: 1,
            column: 1,
        };

        const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex((c: GridCell) => c.id === prevStateRef.current.target.cellId);

        const newCellPosition = prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
        targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

        const updatedTargetElements = [...targetLayout.elements];
        updatedTargetElements.splice(newCellPosition, 0, {
            ...newElement,
            cellId: newCellId
        });

        targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
            c.column = index + 1;
        })

        targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
            gridStructure: {
                ...targetGridStructure,
                columns: targetGridStructure.columns + 1,
                columnWidths: getColumnWidths(targetGridStructure.columns + 1)
            },
            elements: updatedTargetElements,
        });
    }, [presentationId]);

    const processMoveCellToCellInOtherLayout = useCallback(({
        sourceLayout,
        targetLayout,
        targetGridStructure,
        targetSlide,
        sourceSlide
    }: {
        sourceLayout: Layout,
        targetLayout: Layout,
        targetGridStructure: GridStructure,
        targetSlide: Slide,
        sourceSlide: Slide
    }) => {
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

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex((c: GridCell) => c.id === prevStateRef.current.target.cellId);

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

        targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
            c.column = index + 1;
        })

        targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
            gridStructure: {
                ...targetGridStructure,
                columns: targetGridStructure.columns + 1,
                columnWidths: getColumnWidths(targetGridStructure.columns + 1)
            },
            elements: updatedTargetElements,
        });

        const updatedSourceElements = sourceLayout.elements.filter(sourceElement => !elementsInSourceCell.find(el => el.id === sourceElement.id));

        const updatedSourceCells = sourceLayout.gridStructure.rows[0].cells.filter(c => c.id !== sourceCell.id);

        DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
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
    }, [presentationId]);

    const processMoveElementToCellToOtherLayout = useCallback(({
        sourceLayout,
        targetLayout,
        targetGridStructure,
        targetSlide,
        sourceSlide
    }: {
        sourceLayout: Layout,
        targetLayout: Layout,
        targetGridStructure: GridStructure,
        targetSlide: Slide,
        sourceSlide: Slide
    }) => {
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

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex((c: GridCell) => c.id === prevStateRef.current.target.cellId);

        const newCellPosition = prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
        targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

        const updatedTargetElements = [...targetLayout.elements];
        updatedTargetElements.splice(newCellPosition, 0, {
            ...sourceElement,
            cellId: newCellId
        });

        targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
            c.column = index + 1;
        })

        targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
            gridStructure: {
                ...targetGridStructure,
                columns: targetGridStructure.columns + 1,
                columnWidths: getColumnWidths(targetGridStructure.columns + 1)
            },
            elements: updatedTargetElements,
        });

        const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== sourceElement.id);

        if (sourceLayout.gridStructure.rows[0].cells.length === 1) {
            if (sourceSlide.layouts.length === 1) {
                DragDropTransactionHelper.deleteSlide(presentationId, sourceSlide.id);
            } else {
                DragDropTransactionHelper.deleteLayout(presentationId, sourceSlide.id, sourceLayout.id);
            }
            return;
        }

        const elementsInSourceCell = updatedSourceElements.filter(e => e.cellId === sourceElement.cellId);
        if (elementsInSourceCell.length === 0) {
            const editor: TextElement = {
                id: generateId(8),
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                cellId: sourceElement.cellId,
                textType: 'text',
            };
            updatedSourceElements.push(editor);
        }

        DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
            elements: updatedSourceElements,
        });
    }, [presentationId]);

    const processMoveElementToCellInCurrentLayout = useCallback(({
        sourceLayout,
        targetLayout,
        targetGridStructure,
        targetSlide
    }: {
        sourceLayout: Layout,
        targetLayout: Layout,
        targetGridStructure: GridStructure,
        targetSlide: Slide
    }) => {
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

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex((c: GridCell) => c.id === prevStateRef.current.target.cellId);

        const newCellPosition = prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
        targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

        targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
            c.column = index + 1;
        })

        targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

        const elementsInCell = updatedElements.filter(e => e.cellId === sourceElement.cellId);
        if (elementsInCell.length === 0) {
            const editor: TextElement = {
                id: generateId(8),
                type: 'editor',
                content: '',
                position: { x: 0, y: 0 },
                size: { width: 100, height: 100 },
                style: { fontSize: '16px', color: '#333333' },
                zIndex: 1,
                cellId: sourceElement.cellId,
                textType: 'text',
            };
            updatedElements.push(editor);
        }

        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
            gridStructure: {
                ...targetGridStructure,
                columns: targetGridStructure.columns + 1,
                columnWidths: getColumnWidths(targetGridStructure.columns + 1)
            },
            elements: updatedElements,
        });
    }, [presentationId]);

    const processMoveCellToCellInCurrentLayout = useCallback(({
        targetLayout,
        targetGridStructure,
        targetSlide,
    }: {
        targetLayout: Layout,
        targetGridStructure: GridStructure,
        targetSlide: Slide,
    }) => {
        // перемещение ячейки
        const sourceCellIndex = targetGridStructure.rows[0].cells.findIndex((c: GridCell) => c.id === prevStateRef.current.source.cellId);
        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex((c: GridCell) => c.id === prevStateRef.current.target.cellId);

        const sourceCell = targetGridStructure.rows[0].cells[sourceCellIndex];
        const updatedCells = targetGridStructure.rows[0].cells.filter((c: GridCell) => c.id !== prevStateRef.current.source.cellId);
        const newTargetCellIndex = updatedCells.findIndex((c: GridCell) => c.id === prevStateRef.current.target.cellId);

        const newCellPosition = (prevStateRef.current.indicators.cellPosition === 'left' ? newTargetCellIndex : newTargetCellIndex + 1) + 1;
        updatedCells.splice(newCellPosition - 1, 0, {
            ...sourceCell,
            column: newCellPosition
        });

        updatedCells.forEach((c: GridCell, index: number) => {
            c.column = index + 1;
        })

        updatedCells.sort((a: GridCell, b: GridCell) => a.column - b.column);

        const sourceCellWidth = targetGridStructure.columnWidths[sourceCellIndex];
        const targetCellWidth = targetGridStructure.columnWidths[targetCellIndex];

        targetGridStructure.columnWidths[sourceCellIndex] = targetCellWidth;
        targetGridStructure.columnWidths[targetCellIndex] = sourceCellWidth;

        targetGridStructure.rows[0].cells = updatedCells;
        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
            gridStructure: {
                ...targetGridStructure,
                columnWidths: targetGridStructure.columnWidths
            },
        });
    }, [presentationId]);

    // Implementation of processElementDrop
    const processElementDrop = useCallback(() => {
        const isSourceElementInSlide = prevStateRef.current.source.layoutId && (prevStateRef.current.source.elementId || prevStateRef.current.source.cellId);
        const isNewElement = !!prevStateRef.current.newElement.id;

        if (!prevStateRef.current.target.elementId || !prevStateRef.current.target.layoutId || !prevStateRef.current.indicators.elementPosition || (!isSourceElementInSlide && !isNewElement)) {
            return;
        }

        if (isNewElement) {
            console.log('drop new element', prevStateRef.current.newElement);

            if (!prevStateRef.current.newElement.id) {
                console.warn('No element id found for new element');
                return;
            }

            const targetLayout = getLayout(prevStateRef.current.target.layoutId);

            const newElement = getNewElement(prevStateRef.current.newElement.id);


            if (!targetLayout || !newElement) {
                return;
            }

            const position = prevStateRef.current.indicators.elementPosition;
            const targetSlide = getLayoutSlide(targetLayout.id);

            if (!targetSlide) return;

            const targetElement = targetLayout.elements.find(e => e.id === prevStateRef.current.target.elementId);
            if (!targetElement) return;

            // Change the position of source cell
            processAddElementToCell({
                element: newElement,
                targetLayout,
                targetElement,
                targetSlide,
                position
            })
        } else {
            if (!prevStateRef.current.source.layoutId) {
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
            const targetSlide = getLayoutSlide(targetLayout.id);
            const sourceSlide = getLayoutSlide(sourceLayout.id);

            if (!targetSlide || !sourceSlide) return;

            if (draggedElement) {
                const targetElement = targetLayout.elements.find(e => e.id === prevStateRef.current.target.elementId);
                if (!targetElement) return;

                // Case 2.1: left/right of element
                if (position === 'left' || position === 'right') {
                    // Change the position of source cell
                    processMoveElementToElementHorizontal({
                        draggedElement,
                        targetLayout,
                        targetElement,
                        targetSlide,
                        position
                    })
                }
                // Cse 2.2: top/bottom
                else if (position === 'top' || position === 'bottom') {
                    processMoveCellToElementVertical({
                        sourceLayout,
                        targetLayout,
                        targetElement,
                        draggedElement,
                        targetSlide,
                        sourceSlide,
                        position
                    })
                }
            }
            else if (draggedCell) {
                // перетаскивание внутри одного layout
                if (targetLayout.id === sourceLayout.id) {
                    if (position === 'top' || position === 'bottom') {
                        // меняем celId у элементов
                        // обновляем elements в target cell
                        // в sorce cell добавляем пустой редактор
                        processMoveCellToCellInCurrentLayoutVertical({
                            sourceLayout,
                            targetLayout,
                            draggedCell,
                            targetSlide,
                            position
                        })
                    }
                } else {
                    processMoveCellToCellInOtherLayoutVertical({
                        sourceLayout,
                        targetLayout,
                        draggedCell: draggedCell!,
                        targetSlide,
                        sourceSlide,
                        position
                    })
                }
            }
        }
    }, [getCell, getElement, getLayout, getLayoutSlide, processAddElementToCell, processMoveCellToCellInCurrentLayoutVertical, processMoveCellToCellInOtherLayoutVertical, processMoveCellToElementVertical, processMoveElementToElementHorizontal]);


    const processAddElementToLayout = useCallback(({
        targetLayout,
        targetSlide,
        position,
        elementTypeId
    }: {
        targetLayout: Layout,
        targetSlide: Slide,
        position: Position,
        elementTypeId: string
    }) => {
        const newElement = getNewElement(elementTypeId);
        if (!newElement) return;

        const newLayout: Layout = getEmptyLayout();

        const newCellId = generateId();
        const newCell: GridCell = {
            id: newCellId,
            row: 1,
            column: 1,
        };

        newLayout.gridStructure.rows[0].cells.push(newCell);
        newLayout.elements.push({
            ...newElement,
            cellId: newCellId
        });

        const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);
        if (targetLayoutIndex === -1) return;

        const newLayoutIndex = position === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;
        DragDropTransactionHelper.addLayout(presentationId, targetSlide.id, newLayout, newLayoutIndex);
    }, [presentationId]);


    const processSlideDrop = useCallback(() => {
        // TODO: Implement slide drop
    }, []);

    // Implementation of processLayoutDrop
    const processLayoutDrop = useCallback(() => {
        const isSourceElementInSlide = prevStateRef.current.source.layoutId && (prevStateRef.current.source.elementId || prevStateRef.current.source.cellId);
        const isNewElement = !!prevStateRef.current.newElement.id;
        const isSourceLayoutOnly = prevStateRef.current.source.layoutId && !prevStateRef.current.source.elementId && !prevStateRef.current.source.cellId;

        if (!prevStateRef.current.indicators.layoutIndicator || !prevStateRef.current.indicators.layoutPosition || !prevStateRef.current.target.layoutId || (!isSourceElementInSlide && !isNewElement && !isSourceLayoutOnly)) {
            return;
        }

        if (isNewElement) {
            const targetLayout = getLayout(prevStateRef.current.indicators.layoutIndicator);
            const targetSlide = getLayoutSlide(prevStateRef.current.target.layoutId);

            if (!targetLayout || !targetSlide || !prevStateRef.current.newElement.id) {
                return;
            }

            processAddElementToLayout({
                targetLayout,
                targetSlide,
                position: prevStateRef.current.indicators.layoutPosition,
                elementTypeId: prevStateRef.current.newElement.id,
            });
            return;
        } else if (isSourceLayoutOnly) {
            // Handle layout-to-layout dragging
            if (!prevStateRef.current.source.layoutId) {
                return;
            }

            const sourceLayout = getLayout(prevStateRef.current.source.layoutId);
            const targetLayout = getLayout(prevStateRef.current.indicators.layoutIndicator);

            if (!sourceLayout || !targetLayout) {
                return;
            }

            const targetSlide = getLayoutSlide(prevStateRef.current.target.layoutId);
            const sourceSlide = getLayoutSlide(prevStateRef.current.source.layoutId);

            if (!targetSlide || !sourceSlide) return;

            // Check if we're reordering layouts (moving a layout to another position)
            if (prevStateRef.current.indicators.layoutPosition === 'top' || prevStateRef.current.indicators.layoutPosition === 'bottom') {
                // Don't do anything if source and target are the same and target's position is right after the source
                if (sourceLayout.id === targetLayout.id) {
                    return;
                }

                // Remove the source layout from its current position
                const sourceIndex = sourceSlide.layouts.findIndex(l => l.id === sourceLayout.id);
                if (sourceIndex === -1) return;

                const sourceLayouts = [...sourceSlide.layouts];
                const [movedLayout] = sourceLayouts.splice(sourceIndex, 1);

                const targetLayouts = [...targetSlide.layouts];

                // If source and target slides are different, update the source slide
                if (sourceSlide.id !== targetSlide.id) {
                    DragDropTransactionHelper.updateSlide(presentationId, sourceSlide.id, {
                        ...sourceSlide,
                        layouts: sourceLayouts
                    });
                } else {
                    targetLayouts.splice(sourceIndex, 1);
                }

                // Add the layout to the target position
                const targetIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);
                if (targetIndex === -1) return;

                const insertPosition = prevStateRef.current.indicators.layoutPosition === 'top' ? targetIndex : targetIndex + 1;

                // If source and target slides are the same, and the source index is before the target index,
                // we need to adjust the insert position
                let adjustedInsertPosition = insertPosition;
                if (sourceSlide.id === targetSlide.id && sourceIndex < insertPosition) {
                    adjustedInsertPosition -= 1;
                }

                targetLayouts.splice(adjustedInsertPosition, 0, movedLayout);

                // Update the target slide
                DragDropTransactionHelper.updateSlide(presentationId, targetSlide.id, {
                    ...targetSlide,
                    layouts: targetLayouts
                });

                return;
            }
        } else if (isSourceElementInSlide) {
            if (!prevStateRef.current.source.layoutId) {
                return;
            }

            const sourceLayout = getLayout(prevStateRef.current.source.layoutId);
            const targetLayout = getLayout(prevStateRef.current.indicators.layoutIndicator);

            if (!sourceLayout || !targetLayout) {
                return;
            }

            const targetSlide = getLayoutSlide(prevStateRef.current.target.layoutId);
            const sourceSlide = getLayoutSlide(prevStateRef.current.source.layoutId);
            if (!targetSlide || !sourceSlide) return;

            if (prevStateRef.current.source.elementId) {
                const draggedElement = sourceLayout.elements.find(e => e.id === prevStateRef.current.source.elementId);
                if (!draggedElement) {
                    console.warn('No valid element found for dragging in processLayoutDrop');
                    return;
                }

                const position = prevStateRef.current.indicators.layoutPosition;

                // const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));
                // Case 3: cell move by 1 element
                if (position === 'left' || position === 'right') {
                    console.warn('processLayoutDrop: position is left or right');
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
                        const indexSourceLayout = sourceSlide.layouts.findIndex(l => l.id === sourceLayout.id);
                        const sourceLayouts = JSON.parse(JSON.stringify(sourceSlide.layouts));
                        sourceLayouts.splice(indexSourceLayout, 1);

                        if (sourceSlide.id === targetSlide.id) {
                            // переносим на новую позицию в одном слайде
                            const indexTargetLayout = sourceLayouts.findIndex((l: Layout) => l.id === targetLayout.id);
                            const targetIndex = position === 'top' ? indexTargetLayout : indexTargetLayout + 1;
                            sourceLayouts.splice(targetIndex, 0, sourceLayout);

                            DragDropTransactionHelper.updateSlide(presentationId, targetSlide.id, {
                                ...targetSlide,
                                layouts: sourceLayouts
                            });
                        } else {
                            // переносим на новую позицию в другом слайде
                            const targetLayouts = JSON.parse(JSON.stringify(targetSlide.layouts));

                            const indexTargetLayout = targetLayouts.findIndex((l: Layout) => l.id === targetLayout.id);
                            const targetIndex = position === 'top' ? indexTargetLayout : indexTargetLayout + 1;
                            targetLayouts.splice(targetIndex, 0, sourceLayout);

                            DragDropTransactionHelper.updateSlide(presentationId, targetSlide.id, {
                                ...targetSlide,
                                layouts: targetLayouts
                            });

                            if (sourceSlide.id !== targetSlide.id) {
                                if (sourceLayouts.length === 0) {
                                    DragDropTransactionHelper.deleteSlide(presentationId, sourceSlide.id);
                                } else {
                                    DragDropTransactionHelper.deleteLayout(presentationId, sourceSlide.id, sourceLayout.id);
                                }
                            }
                        }
                    } else {
                        if (elementsSourceCell.length === 1 && sourceLayout.gridStructure.columns > 1) {
                            // переносим только элемент. на его месте создаем пустой редактор
                            // из elements в source layout удаляем элемент
                            // в source layout добавляем пустой редактор
                            // обновляем elements в source layout
                            // в target layout фильтруем элементы от элементов целевой ячейки
                            // вставляем между целевыми элементами элементы из source layout
                            // обновляем elements в target layout
                            const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);

                            const editor: TextElement = {
                                id: generateId(8),
                                type: 'editor',
                                textType: 'text',
                                content: '',
                                position: { x: 0, y: 0 },
                                size: { width: 100, height: 100 },
                                cellId: draggedElement.cellId,
                                style: {},
                                zIndex: 1,
                            }

                            updatedSourceElements.push(editor);

                            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
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

                            const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

                            const newLayoutsOffset = prevStateRef.current.indicators.layoutPosition === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

                            DragDropTransactionHelper.addLayout(presentationId, targetSlide.id, newLayout, newLayoutsOffset);
                        } else {
                            // элементов несколько. только переносим source element
                            const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);
                            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
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

                            const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

                            const newLayoutsOffset = prevStateRef.current.indicators.layoutPosition === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

                            DragDropTransactionHelper.addLayout(presentationId, targetSlide.id, newLayout, newLayoutsOffset);
                        }
                    }
                }
            } else if (prevStateRef.current.source.cellId) {
                // перетаскиваем ячейку сверху/снизу layout
                const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

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
                const targetLayouts = [...targetSlide.layouts];

                targetLayouts.splice(newLayoutsOffset, 0, ...newLayouts);

                // ?????
                DragDropTransactionHelper.updateSlide(presentationId, targetSlide.id, {
                    ...targetSlide,
                    layouts: targetLayouts
                });

                const updatedSourceGridStructure = JSON.parse(JSON.stringify(sourceLayout.gridStructure));
                updatedSourceGridStructure.rows[0].cells = updatedSourceGridStructure.rows[0].cells.filter((c: GridCell) => c.id !== prevStateRef.current.source.cellId);
                updatedSourceGridStructure.columns = updatedSourceGridStructure.columns - 1;
                const updatedSourceColumnWidths = getColumnWidths(updatedSourceGridStructure.columns);
                const updatedSourceElements = sourceLayout.elements.filter(e => e.cellId !== prevStateRef.current.source.cellId);
                DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                    gridStructure: { ...updatedSourceGridStructure, columnWidths: updatedSourceColumnWidths },
                    elements: updatedSourceElements
                });
            }
        }
    }, [getLayout, getLayoutSlide, presentationId, processAddElementToLayout]);

    const processCellDrop = useCallback(() => {
        const isSourceElementInSlide = prevStateRef.current.source.layoutId && (prevStateRef.current.source.elementId || prevStateRef.current.source.cellId);
        const isNewElement = !!prevStateRef.current.newElement.id;

        if (!prevStateRef.current.target.cellId || !prevStateRef.current.target.layoutId || (!isSourceElementInSlide && !isNewElement)) {
            return;
        }

        const targetLayout = getLayout(prevStateRef.current.target.layoutId);

        if (!targetLayout) {
            return;
        }

        const targetSlide = getLayoutSlide(targetLayout.id);

        if (!targetSlide) {
            return;
        }

        if (isNewElement) {
            processAddElementToSiblingCell({
                targetLayout,
                targetSlide,
                elementTypeId: prevStateRef.current.newElement.id!,
            })
            console.log('drop new element', prevStateRef.current.newElement);
        } else {
            if (!prevStateRef.current.source.layoutId) {
                return;
            }

            const sourceLayout = getLayout(prevStateRef.current.source.layoutId);

            if (!sourceLayout) {
                return;
            }

            const sourceSlide = getLayoutSlide(sourceLayout.id);
            if (!sourceSlide) return;

            // const targetGridStructure = { ...targetLayout.gridStructure };
            const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));

            if (sourceLayout.id === targetLayout.id) {
                // перемещение внутри одного layout
                if (prevStateRef.current.source.elementId) {
                    processMoveElementToCellInCurrentLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!
                    })
                } else if (prevStateRef.current.source.cellId) {
                    processMoveCellToCellInCurrentLayout({
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!
                    })
                }
            } else {
                if (prevStateRef.current.source.elementId) {
                    processMoveElementToCellToOtherLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                        sourceSlide: sourceSlide!
                    })
                } else if (prevStateRef.current.source.cellId) {
                    processMoveCellToCellInOtherLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                        sourceSlide: sourceSlide!
                    })
                }
            }
        }
    }, [getLayout, getLayoutSlide, processAddElementToSiblingCell, processMoveCellToCellInCurrentLayout, processMoveCellToCellInOtherLayout, processMoveElementToCellInCurrentLayout, processMoveElementToCellToOtherLayout]);


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

                return;
            }

            const targetLayout = layoutId ? getLayout(layoutId) : undefined;

            // Get layout information to determine the appropriate target
            if (!state.newElement) {
                const sourceLayout = layoutId ? getLayout(state.source.layoutId || '') : undefined;

                if (!sourceLayout || !targetLayout) {
                    return;
                }
            }

            if (!targetLayout) {
                return;
            }

            // If we can't find layouts, exit early

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
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }
            // Case 2: If we're over a cell in a multi-cell row, we can drop on left/right of cell
            else if (isMultiCellRow && cellId && cellId !== state.source.cellId) {
                // высчитывает позицию мыши относительно элемнта и layout.
                processCellTarget(e, cellId, layoutId, cellNode as HTMLElement, elementNode as HTMLElement, elementId);
            }
            else if (isMultiCellRow && cellId !== state.source.cellId) {
                // высчитывает позицию мыши относительно элемнта и layout.
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }

            // Case 3: If we're over an element, we can drop top/bottom of that element
            else if (elementId && elementId !== state.source.elementId) {
                processElementTarget(e, elementId, layoutId, elementNode as HTMLElement);
            }
            else if (layoutId && layoutId !== state.source.layoutId) {
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }
            // Case 5: If we're over a slide, we can drop on the slide
            else if (slideId && (!state.source.layoutId || getLayoutSlide(state.source.layoutId)?.id !== slideId)) {
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

            // Increase detection area by adding a threshold for top/bottom
            const threshold = rect.height * 0.25; // Use 25% of element height as threshold
            
            // Find minimum distance with threshold applied for top and bottom
            let minDistance: number;
            let position: Position | null = null;

            if (isSingleCellLayout) {
                // All sides are valid targets for single-cell layouts
                // Apply threshold to top and bottom distances
                const adjustedDistanceFromTop = distanceFromTop < threshold ? 0 : distanceFromTop;
                const adjustedDistanceFromBottom = distanceFromBottom < threshold ? 0 : distanceFromBottom;
                
                minDistance = Math.min(adjustedDistanceFromTop, adjustedDistanceFromBottom, distanceFromLeft, distanceFromRight);

                if (minDistance === adjustedDistanceFromTop || distanceFromTop < threshold) {
                    position = 'top';
                } else if (minDistance === adjustedDistanceFromBottom || distanceFromBottom < threshold) {
                    position = 'bottom';
                } else if (minDistance === distanceFromLeft) {
                    position = 'left';
                } else if (minDistance === distanceFromRight) {
                    position = 'right';
                }
            } else {
                // For multi-cell layouts, only top/bottom are valid for elements
                // Apply threshold to top and bottom distances
                const adjustedDistanceFromTop = distanceFromTop < threshold ? 0 : distanceFromTop;
                const adjustedDistanceFromBottom = distanceFromBottom < threshold ? 0 : distanceFromBottom;
                
                minDistance = Math.min(adjustedDistanceFromTop, adjustedDistanceFromBottom);

                if (minDistance === adjustedDistanceFromTop || distanceFromTop < threshold) {
                    position = 'top';
                } else if (minDistance === adjustedDistanceFromBottom || distanceFromBottom < threshold) {
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

            // Increase detection area with threshold
            const verticalThreshold = rect.height * 0.25; // 25% of height for top/bottom
            const horizontalThreshold = rect.width * 0.15; // 15% of width for left/right
            
            // Adjust distances with thresholds
            const adjustedDistanceFromTop = distanceFromTop < verticalThreshold ? 0 : distanceFromTop;
            const adjustedDistanceFromBottom = distanceFromBottom < verticalThreshold ? 0 : distanceFromBottom;
            const adjustedDistanceFromLeft = distanceFromLeft < horizontalThreshold ? 0 : distanceFromLeft;
            const adjustedDistanceFromRight = distanceFromRight < horizontalThreshold ? 0 : distanceFromRight;

            // Find minimum distance with thresholds applied
            const minDistance = Math.min(
                adjustedDistanceFromTop, 
                adjustedDistanceFromBottom, 
                adjustedDistanceFromLeft, 
                adjustedDistanceFromRight
            );

            // Determine position based on closest edge
            let position: Position | null = null;

            if (minDistance === adjustedDistanceFromTop || distanceFromTop < verticalThreshold) {
                position = 'top';
            } else if (minDistance === adjustedDistanceFromBottom || distanceFromBottom < verticalThreshold) {
                position = 'bottom';
            } else if (minDistance === adjustedDistanceFromLeft || distanceFromLeft < horizontalThreshold) {
                position = 'left';
            } else if (minDistance === adjustedDistanceFromRight || distanceFromRight < horizontalThreshold) {
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
                    DragDropTransactionHelper.wrapInTransaction(
                        presentationId,
                        'Move content to slide',
                        () => processSlideDrop()
                    );
                } else if (prevStateRef.current.indicators.layoutIndicator && prevStateRef.current.indicators.layoutPosition) {
                    DragDropTransactionHelper.wrapInTransaction(
                        presentationId,
                        'Move content between layouts',
                        () => processLayoutDrop()
                    );
                } else if (prevStateRef.current.indicators.cellIndicator && prevStateRef.current.indicators.cellPosition) {
                    DragDropTransactionHelper.wrapInTransaction(
                        presentationId,
                        'Move content between cells',
                        () => processCellDrop()
                    );
                } else if (prevStateRef.current.indicators.elementIndicator && prevStateRef.current.indicators.elementPosition) {
                    DragDropTransactionHelper.wrapInTransaction(
                        presentationId,
                        'Reposition element',
                        () => processElementDrop()
                    );
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
    }, [state.dragState, state.source, state.newElement, state, getLayout, getLayoutSlide, setElementIndicator, setCellIndicator, setLayoutIndicator, setSlideIndicator, setDropTarget, completeDrop, presentationId, processSlideDrop, processLayoutDrop, processCellDrop, processElementDrop, cancelDrag]);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
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
        handleNewElementDragStart,
        isDragging,
        getElement,
        getLayout,
        processElementDrop,
        processLayoutDrop,
        processSlideDrop,
        setReadyToDrop
    }), [
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
        handleNewElementDragStart,
        isDragging,
        getElement,
        getLayout,
        processElementDrop,
        processLayoutDrop,
        processSlideDrop,
        setReadyToDrop
    ]);

    return (
        <DndContext.Provider value={contextValue}>
            {children}
        </DndContext.Provider>
    );
};

export const useHandleDragStart = () => {
    const { handleDragStart } = useDnd();
    return handleDragStart;
};

// Custom hook for using the DnD context
export const useDnd = () => {
    const context = useContext(DndContext);
    if (context === undefined) {
        throw new Error('useDnd must be used within a DndProvider');
    }
    return context;
};