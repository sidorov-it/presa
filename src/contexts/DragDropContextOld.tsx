import React, { createContext, useContext, useReducer, ReactNode, useEffect, useMemo, useCallback } from 'react';
import deepEqual from 'deep-equal';
import { BaseElement, GridCell, GridRow, GridStructure, Layout, Slide } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';
import { DragDropTransactionHelper } from './DragDropTransactionHelper';
import { DndState, DndAction, DropTarget, Position } from '@/types/DragDropTypes';
import { getNewEditorElement, getNewElement } from '@/elements/registry';
import { menuRegistry } from '@/elements/menuRegistry';

const initialState: DndState = {
    dragState: 'idle',
    source: {
        elementId: null,
        layoutId: null,
        cellId: null,
        tableId: null,
        rowIndex: null,
        columnIndex: null,
    },
    target: {
        elementId: null,
        layoutId: null,
        cellId: null,
        position: null,
    },
    indicators: {
        elementIndicator: null,
        elementPosition: null,
        layoutIndicator: null,
        layoutPosition: null,
        slideIndicator: null,
        cellIndicator: null,
        cellPosition: null,
        tableColumnIndicator: null,
        tableColumnPosition: null,
        tableRowIndicator: null,
        tableRowPosition: null,
        tableId: null,
        cellId: null,
    },
    newElement: {
        id: null,
        defaultProps: null,
    },
    isReadyToDrop: false,
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
                    cellId: action.payload.cellId,
                    tableId: action.payload.tableId,
                    rowIndex: action.payload.rowIndex,
                    columnIndex: action.payload.columnIndex,
                    smartLayoutItemId: action.payload.smartLayoutItemId,
                },
                // Clear any previous indicators and targets
                target: { ...initialState.target },
                indicators: { ...initialState.indicators },
                newElement: { ...initialState.newElement },
            };
            break;

        case 'START_DRAG_MENU_ITEM':
            updatedState = {
                ...state,
                dragState: 'dragging',
                target: { ...initialState.target },
                indicators: { ...initialState.indicators },
                newElement: action.payload,
            };
            break;
        case 'SET_DROP_TARGET':
            updatedState = {
                ...state,
                target: action.payload,
            };
            break;
        case 'SET_ELEMENT_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    elementIndicator: action.payload.elementId,
                    elementPosition: action.payload.position,
                },
            };
            break;
        case 'SET_LAYOUT_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    layoutIndicator: action.payload.layoutId,
                    layoutPosition: action.payload.position,
                },
            };
            break;
        case 'SET_SLIDE_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    slideIndicator: action.payload,
                },
            };
            break;

        case 'SET_CELL_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    cellIndicator: action.payload.cellId,
                    cellPosition: action.payload.position,
                },
            };
            break;
        case 'SET_TABLE_COLUMN_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    cellId: action.payload.cellId,
                    tableColumnIndicator: action.payload.columnIndex,
                    tableColumnPosition: action.payload.position,
                    tableId: action.payload.tableId,
                    tableRowIndicator: null,
                    tableRowPosition: null,
                },
            };
            break;
        case 'SET_TABLE_ROW_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    cellId: action.payload.cellId,
                    tableRowIndicator: action.payload.rowIndex,
                    tableRowPosition: action.payload.position,
                    tableId: action.payload.tableId,
                    tableColumnIndicator: null,
                    tableColumnPosition: null,
                },
            };
            break;

        case 'SET_COLUMN_INDICATOR':
            updatedState = {
                ...state,
                indicators: {
                    ...state.indicators,
                    tableColumnIndicator: action.payload.columnId,
                    tableColumnPosition: action.payload.position,
                },
            };
            break;
        case 'COMPLETE_DROP':
            updatedState = {
                ...initialState,
                dragState: 'dropping', // Temporary state for animations if needed
            };
            break;
        case 'CANCEL_DRAG':
            return initialState;
        case 'SET_READY_TO_DROP':
            updatedState = {
                ...state,
                isReadyToDrop: action.payload,
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
            rows: [
                {
                    id: generateId(),
                    cells: [],
                },
            ],
            columns: 1,
            columnWidths: [],
        },
    };
    return layout;
};

// Create context
type DndContextType = {
    state: DndState;
    startDrag: (elementId: string, layoutId: string, cellId?: string) => void;
    setDropTarget: (target: DropTarget) => void;
    setElementIndicator: (elementId: string | null, position: Position | null) => void;
    setCellIndicator: (cellId: string | null, position: Position | null) => void;
    setLayoutIndicator: (layoutId: string | null, position: Position | null) => void;
    setSlideIndicator: (slideId: string | null) => void;
    setColumnIndicator: (columnId: string | null, position: Position | null) => void;
    completeDrop: () => void;
    cancelDrag: () => void;
    handleDragStart: (
        e: React.DragEvent<HTMLDivElement>,
        {
            elementId,
            layoutId,
            cellId,
            tableId,
            rowIndex,
            columnIndex,
            smartLayoutItemId,
        }: {
            elementId: string | null;
            layoutId?: string;
            cellId?: string;
            tableId?: string;
            rowIndex?: number;
            columnIndex?: number;
            smartLayoutItemId?: string;
        }
    ) => void;
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
    const getLayoutSlide = useCallback(
        (layoutId: string) => {
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) return undefined;
            return presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
        },
        [presentationId]
    );

    const getLayout = useCallback(
        (layoutId: string): Layout | undefined => {
            const presentation = usePresentationStore.getState().getPresentation(presentationId);

            if (!presentation) return undefined;
            const slide = presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
            if (!slide) return undefined;
            return slide.layouts.find(l => l.id === layoutId);
        },
        [presentationId]
    );

    const getElement = useCallback(
        (elementId: string, layoutId: string): BaseElement | undefined => {
            const layout = getLayout(layoutId);
            if (!layout) return undefined;
            return layout.elements.find(e => e.id === elementId);
        },
        [getLayout]
    );

    const getCell = useCallback(
        (cellId: string, layoutId: string): GridCell | undefined => {
            const layout = getLayout(layoutId);
            if (!layout) return undefined;
            return layout.gridStructure.rows[0].cells.find(cell => cell.id === cellId);
        },
        [getLayout]
    );

    // Basic handler functions with useCallback to prevent recreating on each render
    const startDrag = useCallback(
        (
            elementId: string | null,
            layoutId: string,
            cellId?: string,
            tableId?: string,
            rowIndex?: number,
            columnIndex?: number,
            smartLayoutItemId?: string
        ) => {
            dispatch({
                type: 'START_DRAG',
                payload: { elementId, layoutId, cellId, tableId, rowIndex, columnIndex, smartLayoutItemId },
            });
        },
        []
    );

    const setDropTarget = useCallback((target: DropTarget) => {
        dispatch({ type: 'SET_DROP_TARGET', payload: target });
    }, []);

    const setElementIndicator = useCallback((elementId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_ELEMENT_INDICATOR', payload: { elementId, position } });
    }, []);

    const setCellIndicator = useCallback((cellId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_CELL_INDICATOR', payload: { cellId, position } });
    }, []);

    const setTableColumnIndicator = useCallback(
        (cellId: string | null, columnIndex: number | null, position: Position | null, tableId: string | null) => {
            dispatch({ type: 'SET_TABLE_COLUMN_INDICATOR', payload: { cellId, columnIndex, position, tableId } });
        },
        []
    );

    const setTableRowIndicator = useCallback(
        (cellId: string | null, rowIndex: number | null, position: Position | null, tableId: string | null) => {
            dispatch({ type: 'SET_TABLE_ROW_INDICATOR', payload: { cellId, rowIndex, position, tableId } });
        },
        []
    );

    const setLayoutIndicator = useCallback((layoutId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_LAYOUT_INDICATOR', payload: { layoutId, position } });
    }, []);

    const setSlideIndicator = useCallback((slideId: string | null) => {
        dispatch({ type: 'SET_SLIDE_INDICATOR', payload: slideId });
    }, []);

    const setColumnIndicator = useCallback((columnId: string | null, position: Position | null) => {
        dispatch({ type: 'SET_COLUMN_INDICATOR', payload: { columnId, position } });
    }, []);

    const cancelDrag = useCallback(() => {
        dispatch({ type: 'CANCEL_DRAG' });
    }, []);

    const isDragging = useCallback(() => state.dragState === 'dragging', [state.dragState]);

    const setReadyToDrop = useCallback((isReady: boolean) => {
        dispatch({ type: 'SET_READY_TO_DROP', payload: isReady });
    }, []);

    // Event handlers with useCallback
    const handleDragStart = useCallback(
        (
            e: React.DragEvent<HTMLDivElement>,
            {
                elementId,
                layoutId,
                cellId,
                tableId,
                rowIndex,
                columnIndex,
                smartLayoutItemId,
            }: {
                elementId: string | null;
                layoutId: string;
                cellId?: string;
                tableId?: string;
                rowIndex?: number;
                columnIndex?: number;
                smartLayoutItemId?: string;
            }
        ) => {
            e.stopPropagation();

            startDrag(elementId, layoutId, cellId, tableId, rowIndex, columnIndex, smartLayoutItemId);

            prevStateRef.current.source = {
                elementId,
                layoutId,
                cellId,
                tableId,
                rowIndex,
                columnIndex,
            };

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
                })
            );
        },
        [dispatch]
    );

    const getNewElementFromTypeId = useCallback((elementTypeId: string) => {
        // Find the MenuItem in the registry based on elementTypeId
        const menuItem = menuRegistry
            .flatMap(category =>
                category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements || []
            )
            .find(element => element?.elementTypeId === elementTypeId);

        if (!menuItem) {
            console.error(`Element with type ${elementTypeId} not found in registry`);
            return null;
        }

        return getNewElement(menuItem);
    }, []);

    const handleNewElementDragStart = useCallback(
        (e: React.DragEvent<HTMLDivElement>, elementTypeId: string, defaultProps: any) => {
            const newElement = getNewElementFromTypeId(elementTypeId);
            if (!newElement) {
                console.error(`Element with type ${elementTypeId} not found in registry`);
                return;
            }
            e.stopPropagation();
            dispatch({ type: 'START_DRAG_MENU_ITEM', payload: newElement });
        },
        []
    );

    // Centralized drag over handling with document-level listeners
    const processAddElementToCell = useCallback(
        ({
            element,
            targetLayout,
            targetElement,
            targetSlide,
            position,
        }: {
            element: Omit<BaseElement, 'cellId'>;
            targetLayout: Layout;
            targetElement: BaseElement;
            targetSlide: Slide;
            position: Position;
        }) => {
            if (position === 'left' || position === 'right') {
                // Change the position of source cell
                const updatedElements = [...targetLayout.elements];
                const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

                if (targetIndex !== -1) {
                    updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, {
                        ...element,
                        cellId: targetElement.cellId,
                    });

                    DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                        elements: updatedElements,
                    });
                }
            } else {
                const targetElementIndex = targetLayout.elements.findIndex(e => e.id === targetElement.id);

                const updatedElement = {
                    ...element,
                    cellId: targetElement.cellId,
                };

                const targetIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;
                const updatedTargetElements = [...targetLayout.elements].filter(el => el.id !== element.id);
                updatedTargetElements.splice(targetIndex, 0, updatedElement);

                console.log('updatedTargetElements', updatedTargetElements);
                DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                    elements: updatedTargetElements,
                });
            }
        },
        [presentationId]
    );

    const processMoveCellToCellInCurrentLayoutVertical = useCallback(
        ({
            sourceLayout,
            targetLayout,
            draggedCell,
            targetSlide,
            position,
        }: {
            sourceLayout: Layout;
            targetLayout: Layout;
            draggedCell: GridCell;
            targetSlide: Slide;
            position: Position;
        }) => {
            const targetElement = targetLayout.elements.find(c => c.id === prevStateRef.current.target.elementId!);
            if (!targetElement) return;

            const targetCellId = targetElement.cellId;

            const updatedSourceElements = sourceLayout.elements
                .filter(e => e.cellId === draggedCell.id)
                .map(el => ({ ...el, cellId: targetCellId }));
            const updatedLayoutElements = sourceLayout.elements.filter(e => e.cellId !== draggedCell.id);

            const updatedElements =
                position === 'top'
                    ? [...updatedSourceElements, ...updatedLayoutElements]
                    : [...updatedLayoutElements, ...updatedSourceElements];

            const editor = getNewEditorElement(draggedCell.id);

            updatedElements.push(editor);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, sourceLayout.id, {
                elements: updatedElements,
            });
        },
        [presentationId]
    );

    const processMoveCellToCellInOtherLayoutVertical = useCallback(
        ({
            sourceLayout,
            targetLayout,
            draggedCell,
            targetSlide,
            sourceSlide,
            position,
        }: {
            sourceLayout: Layout;
            targetLayout: Layout;
            draggedCell: GridCell;
            targetSlide: Slide;
            sourceSlide: Slide;
            position: Position;
        }) => {
            const targetElement = targetLayout.elements.find(c => c.id === prevStateRef.current.target.elementId!);
            if (!targetElement) return;

            const targetCellId = targetElement.cellId;

            const updatedSourceDraggedElements = sourceLayout.elements
                .filter(e => e.cellId === draggedCell.id)
                .map(el => ({ ...el, cellId: targetCellId }));

            const elementsInTargetCell = targetLayout.elements.filter(e => e.cellId === targetCellId);
            const targetElementIndex = elementsInTargetCell.findIndex(e => e.id === targetElement.id);

            const positionIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;

            const updatedElements = [...targetLayout.elements];
            updatedElements.splice(positionIndex, 0, ...updatedSourceDraggedElements);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                elements: updatedElements,
            });

            const updatedSourceLayoutElements = sourceLayout.elements.filter(e => e.cellId !== draggedCell.id);

            const editor = getNewEditorElement(draggedCell.id);

            updatedSourceLayoutElements.push(editor);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                elements: updatedSourceLayoutElements,
            });
        },
        [presentationId]
    );

    const processMoveCellToElementVertical = useCallback(
        ({
            sourceLayout,
            targetLayout,
            targetElement,
            draggedElement,
            targetSlide,
            sourceSlide,
            position,
        }: {
            sourceLayout: Layout;
            sourceSlide: Slide;
            targetLayout: Layout;
            targetElement: BaseElement;
            draggedElement: BaseElement;
            targetSlide: Slide;
            position: Position;
        }) => {
            // Create a new layout for each element in the cell
            const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === draggedElement.cellId);
            if (!sourceCell) return;

            if (targetLayout.id === sourceLayout.id) {
                const elementsInSourceCell = sourceLayout.elements.filter(
                    e => e.cellId === sourceCell.id && e.id !== draggedElement.id
                );
                const targetElementIndex = targetLayout.elements.findIndex(e => e.id === targetElement.id);

                const updatedElement: BaseElement = {
                    ...draggedElement,
                    cellId: targetElement.cellId,
                };

                const targetIndex = position === 'top' ? targetElementIndex : targetElementIndex + 1;
                const updatedTargetElements = [...targetLayout.elements].filter(el => el.id !== draggedElement.id);
                updatedTargetElements.splice(targetIndex, 0, updatedElement);

                if (elementsInSourceCell.length === 0) {
                    const editor = getNewEditorElement(draggedElement.cellId);

                    updatedTargetElements.push(editor);
                }
                DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                    elements: updatedTargetElements,
                });
            } else {
                const targetElementIndex = targetLayout.elements.findIndex(e => e.id === targetElement.id);

                const updatedElement = {
                    ...draggedElement,
                    cellId: targetElement.cellId,
                };

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
                    const editor = getNewEditorElement(draggedElement.cellId);

                    updatedSourceElements.push(editor);
                    DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                        elements: updatedSourceElements,
                    });
                }
            }
        },
        [presentationId]
    );

    const processMoveElementToElementHorizontal = useCallback(
        ({
            draggedElement,
            targetLayout,
            targetElement,
            targetSlide,
            position,
        }: {
            draggedElement: Omit<BaseElement, 'cellId'>;
            targetLayout: Layout;
            targetElement: BaseElement;
            targetSlide: Slide;
            position: Position;
        }) => {
            // Change the position of source cell
            const updatedElements = [...targetLayout.elements];
            const sourceIndex = updatedElements.findIndex(e => e.id === draggedElement!.id);
            const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                const [movedElement] = updatedElements.splice(sourceIndex, 1);
                updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, movedElement);

                DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                    elements: updatedElements,
                });
            }
        },
        [presentationId]
    );

    const processAddElementToSiblingCell = useCallback(
        ({
            targetLayout,
            targetSlide,
            elementTypeId,
        }: {
            targetLayout: Layout;
            targetSlide: Slide;
            elementTypeId: string;
        }) => {
            const newElement = getNewElementFromTypeId(elementTypeId);

            if (!newElement) {
                return;
            }
            const targetCell = targetLayout.gridStructure.rows[0].cells.find(
                c => c.id === prevStateRef.current.target.cellId
            );

            if (!targetCell) return;

            const newCellId = generateId();
            const newCell: GridCell = {
                id: newCellId,
                row: 1,
                column: 1,
            };

            const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));

            const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.target.cellId
            );

            const newCellPosition =
                prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
            targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

            const updatedTargetElements = [...targetLayout.elements];
            updatedTargetElements.splice(newCellPosition, 0, {
                ...newElement,
                cellId: newCellId,
            } as BaseElement);

            targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
                c.column = index + 1;
            });

            targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                gridStructure: {
                    ...targetGridStructure,
                    columns: targetGridStructure.columns + 1,
                    columnWidths: getColumnWidths(targetGridStructure.columns + 1),
                },
                elements: updatedTargetElements,
            });
        },
        [presentationId]
    );

    const processMoveCellToCellInOtherLayout = useCallback(
        ({
            sourceLayout,
            targetLayout,
            targetGridStructure,
            targetSlide,
            sourceSlide,
        }: {
            sourceLayout: Layout;
            targetLayout: Layout;
            targetGridStructure: GridStructure;
            targetSlide: Slide;
            sourceSlide: Slide;
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

            const targetCell = targetLayout.gridStructure.rows[0].cells.find(
                c => c.id === prevStateRef.current.target.cellId
            );

            if (!sourceElement || !sourceCell || !targetCell) return;

            const newCellId = generateId();
            const newCell: GridCell = {
                id: newCellId,
                row: 1,
                column: 1,
            };

            const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.target.cellId
            );

            const newCellPosition =
                prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
            targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

            const updatedTargetElements = [...targetLayout.elements];

            const elementsInSourceCell = sourceLayout.elements.filter(e => e.cellId === sourceCell.id);

            elementsInSourceCell.forEach(e => {
                updatedTargetElements.push({
                    ...e,
                    cellId: newCellId,
                });
            });

            targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
                c.column = index + 1;
            });

            targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                gridStructure: {
                    ...targetGridStructure,
                    columns: targetGridStructure.columns + 1,
                    columnWidths: getColumnWidths(targetGridStructure.columns + 1),
                },
                elements: updatedTargetElements,
            });

            const updatedSourceElements = sourceLayout.elements.filter(
                sourceElement => !elementsInSourceCell.find(el => el.id === sourceElement.id)
            );

            const updatedSourceCells = sourceLayout.gridStructure.rows[0].cells.filter(c => c.id !== sourceCell.id);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                elements: updatedSourceElements,
                gridStructure: {
                    ...sourceLayout.gridStructure,
                    rows: [
                        {
                            ...sourceLayout.gridStructure.rows[0],
                            cells: updatedSourceCells,
                        },
                    ],
                    columns: sourceLayout.gridStructure.columns - 1,
                    columnWidths: getColumnWidths(sourceLayout.gridStructure.columns - 1),
                },
            });
        },
        [presentationId]
    );

    const processMoveElementToCellToOtherLayout = useCallback(
        ({
            sourceLayout,
            targetLayout,
            targetGridStructure,
            targetSlide,
            sourceSlide,
        }: {
            sourceLayout: Layout;
            targetLayout: Layout;
            targetGridStructure: GridStructure;
            targetSlide: Slide;
            sourceSlide: Slide;
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

            const targetCell = targetLayout.gridStructure.rows[0].cells.find(
                c => c.id === prevStateRef.current.target.cellId
            );

            if (!sourceElement || !sourceCell || !targetCell) return;

            const newCellId = generateId();
            const newCell: GridCell = {
                id: newCellId,
                row: 1,
                column: 1,
            };

            const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.target.cellId
            );

            const newCellPosition =
                prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
            targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

            const updatedTargetElements = [...targetLayout.elements];
            updatedTargetElements.splice(newCellPosition, 0, {
                ...sourceElement,
                cellId: newCellId,
            });

            targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
                c.column = index + 1;
            });

            targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                gridStructure: {
                    ...targetGridStructure,
                    columns: targetGridStructure.columns + 1,
                    columnWidths: getColumnWidths(targetGridStructure.columns + 1),
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
                const editor = getNewEditorElement(sourceElement.cellId);

                updatedSourceElements.push(editor);
            }

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                elements: updatedSourceElements,
            });
        },
        [presentationId]
    );

    const processMoveElementToCellInCurrentLayout = useCallback(
        ({
            sourceLayout,
            targetLayout,
            targetGridStructure,
            targetSlide,
        }: {
            sourceLayout: Layout;
            targetLayout: Layout;
            targetGridStructure: GridStructure;
            targetSlide: Slide;
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
                        cellId: newCellId,
                    };
                }
                return el;
            });

            const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.target.cellId
            );

            const newCellPosition =
                prevStateRef.current.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
            targetGridStructure.rows[0].cells.splice(newCellPosition, 0, newCell);

            targetGridStructure.rows[0].cells.forEach((c: GridCell, index: number) => {
                c.column = index + 1;
            });

            targetGridStructure.rows[0].cells.sort((a: GridCell, b: GridCell) => a.column - b.column);

            const elementsInCell = updatedElements.filter(e => e.cellId === sourceElement.cellId);
            if (elementsInCell.length === 0) {
                const editor = getNewEditorElement(sourceElement.cellId);

                updatedElements.push(editor);
            }

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                gridStructure: {
                    ...targetGridStructure,
                    columns: targetGridStructure.columns + 1,
                    columnWidths: getColumnWidths(targetGridStructure.columns + 1),
                },
                elements: updatedElements,
            });
        },
        [presentationId]
    );

    const processMoveCellToCellInCurrentLayout = useCallback(
        ({
            targetLayout,
            targetGridStructure,
            targetSlide,
        }: {
            targetLayout: Layout;
            targetGridStructure: GridStructure;
            targetSlide: Slide;
        }) => {
            // перемещение ячейки
            const sourceCellIndex = targetGridStructure.rows[0].cells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.source.cellId
            );
            const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.target.cellId
            );

            const sourceCell = targetGridStructure.rows[0].cells[sourceCellIndex];
            const updatedCells = targetGridStructure.rows[0].cells.filter(
                (c: GridCell) => c.id !== prevStateRef.current.source.cellId
            );
            const newTargetCellIndex = updatedCells.findIndex(
                (c: GridCell) => c.id === prevStateRef.current.target.cellId
            );

            const newCellPosition =
                (prevStateRef.current.indicators.cellPosition === 'left'
                    ? newTargetCellIndex
                    : newTargetCellIndex + 1) + 1;
            updatedCells.splice(newCellPosition - 1, 0, {
                ...sourceCell,
                column: newCellPosition,
            });

            updatedCells.forEach((c: GridCell, index: number) => {
                c.column = index + 1;
            });

            updatedCells.sort((a: GridCell, b: GridCell) => a.column - b.column);

            const sourceCellWidth = targetGridStructure.columnWidths[sourceCellIndex];
            const targetCellWidth = targetGridStructure.columnWidths[targetCellIndex];

            targetGridStructure.columnWidths[sourceCellIndex] = targetCellWidth;
            targetGridStructure.columnWidths[targetCellIndex] = sourceCellWidth;

            targetGridStructure.rows[0].cells = updatedCells;
            DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, targetLayout.id, {
                gridStructure: {
                    ...targetGridStructure,
                    columnWidths: targetGridStructure.columnWidths,
                },
            });
        },
        [presentationId]
    );

    // Implementation of processElementDrop
    const processElementDrop = useCallback(() => {
        const isSourceElementInSlide =
            prevStateRef.current.source.layoutId &&
            (prevStateRef.current.source.elementId || prevStateRef.current.source.cellId);
        const isNewElement = !!prevStateRef.current.newElement.id;

        if (
            !prevStateRef.current.target.elementId ||
            !prevStateRef.current.target.layoutId ||
            !prevStateRef.current.indicators.elementPosition ||
            (!isSourceElementInSlide && !isNewElement)
        ) {
            return;
        }

        if (isNewElement) {
            console.log('drop new element', prevStateRef.current.newElement);

            if (!prevStateRef.current.newElement.id) {
                console.warn('No element id found for new element');
                return;
            }

            const targetLayout = getLayout(prevStateRef.current.target.layoutId);

            const newElement = getNewElementFromTypeId(prevStateRef.current.newElement.id);

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
                position,
            });
        } else {
            if (!prevStateRef.current.source.layoutId) {
                return;
            }

            const sourceLayout = getLayout(prevStateRef.current.source.layoutId);
            const targetLayout = getLayout(prevStateRef.current.target.layoutId);
            let draggedElement;
            if (prevStateRef.current.source.elementId) {
                draggedElement = getElement(
                    prevStateRef.current.source.elementId,
                    prevStateRef.current.source.layoutId
                );
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
                        position,
                    });
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
                        position,
                    });
                }
            } else if (draggedCell) {
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
                            position,
                        });
                    }
                } else {
                    processMoveCellToCellInOtherLayoutVertical({
                        sourceLayout,
                        targetLayout,
                        draggedCell: draggedCell!,
                        targetSlide,
                        sourceSlide,
                        position,
                    });
                }
            }
        }
    }, [
        getCell,
        getElement,
        getLayout,
        getLayoutSlide,
        processAddElementToCell,
        processMoveCellToCellInCurrentLayoutVertical,
        processMoveCellToCellInOtherLayoutVertical,
        processMoveCellToElementVertical,
        processMoveElementToElementHorizontal,
    ]);

    const processTableColumnDrop = useCallback(() => {
        if (!prevStateRef.current.source.tableId || !prevStateRef.current.target.tableId) {
            return;
        }

        const sourceLayout = getLayout(prevStateRef.current.source.tableId);
        const targetLayout = getLayout(prevStateRef.current.target.tableId);

        if (!sourceLayout || !targetLayout) {
            return;
        }

        const tableColumnPosition = prevStateRef.current.indicators.tableColumnPosition;
        // const targetIndex = tableColumnPosition === 'left' ? prevStateRef.current.target.columnIndex : prevStateRef.current.target.columnIndex! + 1;

        if (sourceLayout.id === targetLayout.id) {
            const updatedGridStructure = sourceLayout.gridStructure;

            const updatedRows = updatedGridStructure.rows.map(row => {
                const targetCellId = row.cells[prevStateRef.current.target.columnIndex!].id;

                const updatedCells = [...row.cells];

                const movedCell = updatedCells.splice(prevStateRef.current.source.columnIndex!, 1)[0];

                const targetCellIndex = updatedCells.findIndex(cell => cell.id === targetCellId);

                const targetIndex = tableColumnPosition === 'left' ? targetCellIndex : targetCellIndex + 1;

                updatedCells.splice(targetIndex!, 0, movedCell);

                updatedCells.forEach((cell, index) => {
                    cell.column = index;
                });

                return {
                    ...row,
                    cells: updatedCells,
                };
            });

            updatedGridStructure.rows = updatedRows;
            const sourceSlide = getLayoutSlide(prevStateRef.current.source.tableId);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide!.id, sourceLayout.id, {
                gridStructure: updatedGridStructure,
            });
        } else {
            const updatedSourceGridStructure = { ...sourceLayout.gridStructure };

            const movedCells: GridCell[] = [];

            const movedElementsInfo: {
                cellId: string;
                elements: BaseElement[];
                rowIndex: number;
            }[] = [];

            const updatedSourceRows = updatedSourceGridStructure.rows.map((row, index) => {
                const updatedCells = [...row.cells];

                const movedCell = updatedCells.splice(prevStateRef.current.source.columnIndex!, 1)[0];
                movedCells.push(movedCell);

                const movedElements = sourceLayout.elements.filter(element => element.cellId === movedCell.id);

                if (movedElements.length > 0) {
                    movedElementsInfo.push({
                        cellId: movedCell.id,
                        elements: movedElements,
                        rowIndex: index,
                    });
                }

                updatedCells.forEach((cell, index) => {
                    cell.column = index;
                });

                return {
                    ...row,
                    cells: updatedCells,
                };
            });

            updatedSourceGridStructure.rows = updatedSourceRows;
            // TODO: нужен кейс, когда остается 1 столбец
            updatedSourceGridStructure.columns = updatedSourceGridStructure.columns - 1;
            updatedSourceGridStructure.columnWidths = getColumnWidths(updatedSourceGridStructure.columns);

            const sourceSlide = getLayoutSlide(prevStateRef.current.source.tableId);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide!.id, sourceLayout.id, {
                gridStructure: updatedSourceGridStructure,
                elements: sourceLayout.elements.filter(element => !movedCells.find(cell => cell.id === element.cellId)),
            });

            // проверяем кол-во строк. если в movedElementsInfo больше строк, чем в targetLayout, то добавляем новые строки
            // проходим по каждой строке. добавляем новую ячейку по индексу target.columnIndex
            // добавляем в эту ячейку элементы из movedElementsInfo по индексу rowIndex
            // обновляем elements в target layout
            // обновляем gridStructure в target layout
            // пересчитываем columnWidths в target layout

            const updatedTargetGridStructure = { ...targetLayout.gridStructure };
            const countRows = updatedTargetGridStructure.rows.length;

            const newEditors: BaseElement[] = [];

            if (movedElementsInfo.length > countRows) {
                for (let i = countRows; i < movedElementsInfo.length; i++) {
                    // добавляем новые строки
                    const newRow = {
                        id: generateId(),
                        cells: Array.from({ length: updatedTargetGridStructure.columns }, (_, index) => ({
                            id: generateId(),
                            row: index,
                            column: index,
                        })),
                    };

                    updatedTargetGridStructure.rows.push(newRow);

                    newRow.cells.forEach(cell => {
                        newEditors.push(getNewEditorElement(cell.id));
                    });
                }
            }

            const updatedTargetElements = [...targetLayout.elements, ...newEditors] as BaseElement[];

            const targetSlide = getLayoutSlide(prevStateRef.current.target.tableId);

            if (!targetSlide) return;

            const updatedTargetRows = updatedTargetGridStructure.rows.map((row, index) => {
                const targetCellId = row.cells[prevStateRef.current.target.columnIndex!].id;

                const updatedCells = [...row.cells];

                const targetCellIndex = updatedCells.findIndex(cell => cell.id === targetCellId);

                const targetIndex = tableColumnPosition === 'left' ? targetCellIndex : targetCellIndex + 1;

                const newCellId = generateId();

                // в перетаскиваемом столбце меньше строк, чем в targetLayout
                if (!movedElementsInfo[index]) {
                    const newEditor = getNewEditorElement(newCellId);
                    updatedTargetElements.push(newEditor);
                } else {
                    movedElementsInfo[index].elements.map(element => {
                        updatedTargetElements.push({
                            ...element,
                            cellId: newCellId,
                        });
                    });
                }

                updatedCells.splice(targetIndex!, 0, {
                    id: newCellId,
                    row: index,
                    column: targetIndex,
                });

                updatedCells.forEach((cell, index) => {
                    cell.column = index;
                });

                return {
                    ...row,
                    cells: updatedCells,
                };
            });

            updatedTargetGridStructure.rows = updatedTargetRows;
            updatedTargetGridStructure.columns = updatedTargetGridStructure.columns + 1;
            updatedTargetGridStructure.columnWidths = getColumnWidths(updatedTargetGridStructure.columns);

            DragDropTransactionHelper.updateLayout(presentationId, targetSlide!.id, targetLayout.id, {
                gridStructure: updatedTargetGridStructure,
                elements: updatedTargetElements,
            });
        }
    }, [getLayout, getLayoutSlide, presentationId]);

    const processAddElementToLayout = useCallback(
        ({
            targetLayout,
            targetSlide,
            position,
            elementTypeId,
        }: {
            targetLayout: Layout;
            targetSlide: Slide;
            position: Position;
            elementTypeId: string;
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
                cellId: newCellId,
            } as BaseElement);

            const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);
            if (targetLayoutIndex === -1) return;

            const newLayoutIndex = position === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;
            DragDropTransactionHelper.addLayout(presentationId, targetSlide.id, newLayout, newLayoutIndex);
        },
        [presentationId]
    );

    const processSlideDrop = useCallback(() => {
        // TODO: Implement slide drop
    }, []);

    // Implementation of processLayoutDrop
    const processLayoutDrop = useCallback(() => {
        const isSourceElementInSlide =
            prevStateRef.current.source.layoutId &&
            (prevStateRef.current.source.elementId || prevStateRef.current.source.cellId);
        const isNewElement = !!prevStateRef.current.newElement.id;
        const isSourceLayoutOnly =
            prevStateRef.current.source.layoutId &&
            !prevStateRef.current.source.elementId &&
            !prevStateRef.current.source.cellId;

        if (
            !prevStateRef.current.indicators.layoutIndicator ||
            !prevStateRef.current.indicators.layoutPosition ||
            !prevStateRef.current.target.layoutId ||
            (!isSourceElementInSlide && !isNewElement && !isSourceLayoutOnly)
        ) {
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
            if (
                prevStateRef.current.indicators.layoutPosition === 'top' ||
                prevStateRef.current.indicators.layoutPosition === 'bottom'
            ) {
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
                        layouts: sourceLayouts,
                    });
                } else {
                    targetLayouts.splice(sourceIndex, 1);
                }

                // Add the layout to the target position
                const targetIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);
                if (targetIndex === -1) return;

                const insertPosition =
                    prevStateRef.current.indicators.layoutPosition === 'top' ? targetIndex : targetIndex + 1;

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
                    layouts: targetLayouts,
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
                    const draggedElement = sourceLayout.elements.find(
                        e => e.id === prevStateRef.current.source.elementId
                    );

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
                                layouts: sourceLayouts,
                            });
                        } else {
                            // переносим на новую позицию в другом слайде
                            const targetLayouts = JSON.parse(JSON.stringify(targetSlide.layouts));

                            const indexTargetLayout = targetLayouts.findIndex((l: Layout) => l.id === targetLayout.id);
                            const targetIndex = position === 'top' ? indexTargetLayout : indexTargetLayout + 1;
                            targetLayouts.splice(targetIndex, 0, sourceLayout);

                            DragDropTransactionHelper.updateSlide(presentationId, targetSlide.id, {
                                ...targetSlide,
                                layouts: targetLayouts,
                            });

                            if (sourceSlide.id !== targetSlide.id) {
                                if (sourceLayouts.length === 0) {
                                    DragDropTransactionHelper.deleteSlide(presentationId, sourceSlide.id);
                                } else {
                                    DragDropTransactionHelper.deleteLayout(
                                        presentationId,
                                        sourceSlide.id,
                                        sourceLayout.id
                                    );
                                }
                            }
                        }
                    } else {
                        if (elementsSourceCell.length === 1 && sourceLayout.gridStructure.columns > 1) {
                            // переносим только элемент. на его месте создаем пустой редактор
                            // из elements в source layout удаляем элемент
                            // в source layout добавляем пустой редактор
                            // обновляем elements in source layout
                            // в target layout фильтруем элементы от элементов целевой ячейки
                            // вставляем между целевыми элементами элементы из source layout
                            // обновляем elements in target layout
                            const updatedSourceElements = sourceLayout.elements.filter(e => e.id !== draggedElement.id);

                            const editor = getNewEditorElement(draggedElement.cellId);

                            updatedSourceElements.push(editor);

                            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                                elements: updatedSourceElements,
                            });

                            const newCellId = generateId();
                            const newLayout: Layout = {
                                id: generateId(),
                                gridStructure: {
                                    rows: [
                                        {
                                            id: generateId(),
                                            cells: [
                                                {
                                                    id: newCellId,
                                                    row: 1,
                                                    column: 1,
                                                },
                                            ],
                                        },
                                    ],
                                    columns: 1,
                                    columnWidths: getColumnWidths(1),
                                },
                                elements: [
                                    {
                                        ...draggedElement,
                                        cellId: newCellId,
                                    },
                                ],
                                type: 'single-column',
                                style: {},
                            };

                            const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

                            const newLayoutsOffset =
                                prevStateRef.current.indicators.layoutPosition === 'top'
                                    ? targetLayoutIndex
                                    : targetLayoutIndex + 1;

                            DragDropTransactionHelper.addLayout(
                                presentationId,
                                targetSlide.id,
                                newLayout,
                                newLayoutsOffset
                            );
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
                                    rows: [
                                        {
                                            id: generateId(),
                                            cells: [
                                                {
                                                    id: newCellId,
                                                    row: 1,
                                                    column: 1,
                                                },
                                            ],
                                        },
                                    ],
                                    columns: 1,
                                    columnWidths: getColumnWidths(1),
                                },
                                elements: [
                                    {
                                        ...draggedElement,
                                        cellId: newCellId,
                                    },
                                ],
                                type: 'single-column',
                                style: {},
                            };

                            const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

                            const newLayoutsOffset =
                                prevStateRef.current.indicators.layoutPosition === 'top'
                                    ? targetLayoutIndex
                                    : targetLayoutIndex + 1;

                            DragDropTransactionHelper.addLayout(
                                presentationId,
                                targetSlide.id,
                                newLayout,
                                newLayoutsOffset
                            );
                        }
                    }
                }
            } else if (prevStateRef.current.source.cellId) {
                // перетаскиваем ячейку сверху/снизу layout
                const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

                const newLayoutsOffset =
                    prevStateRef.current.indicators.layoutPosition === 'top'
                        ? targetLayoutIndex
                        : targetLayoutIndex + 1;

                const sourceCellElements = sourceLayout.elements.filter(
                    e => e.cellId === prevStateRef.current.source.cellId
                );

                const newLayouts = sourceCellElements.map(element => {
                    const newLayoutId = generateId();
                    const newCellId = generateId();

                    return {
                        id: newLayoutId,
                        gridStructure: {
                            rows: [
                                {
                                    id: generateId(),
                                    cells: [
                                        {
                                            id: newCellId,
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columns: 1,
                            columnWidths: getColumnWidths(1),
                        },
                        elements: [
                            {
                                ...element,
                                cellId: newCellId,
                            },
                        ],
                        type: 'single-column',
                        style: {},
                    } as Layout;
                });
                const targetLayouts = [...targetSlide.layouts];

                targetLayouts.splice(newLayoutsOffset, 0, ...newLayouts);

                // ?????
                DragDropTransactionHelper.updateSlide(presentationId, targetSlide.id, {
                    ...targetSlide,
                    layouts: targetLayouts,
                });

                const updatedSourceGridStructure = JSON.parse(JSON.stringify(sourceLayout.gridStructure));
                updatedSourceGridStructure.rows[0].cells = updatedSourceGridStructure.rows[0].cells.filter(
                    (c: GridCell) => c.id !== prevStateRef.current.source.cellId
                );
                updatedSourceGridStructure.columns = updatedSourceGridStructure.columns - 1;
                const updatedSourceColumnWidths = getColumnWidths(updatedSourceGridStructure.columns);
                const updatedSourceElements = sourceLayout.elements.filter(
                    e => e.cellId !== prevStateRef.current.source.cellId
                );
                DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                    gridStructure: { ...updatedSourceGridStructure, columnWidths: updatedSourceColumnWidths },
                    elements: updatedSourceElements,
                });
            }
        }
    }, [getLayout, getLayoutSlide, presentationId, processAddElementToLayout]);

    const processCellDrop = useCallback(() => {
        const isSourceElementInSlide =
            prevStateRef.current.source.layoutId &&
            (prevStateRef.current.source.elementId || prevStateRef.current.source.cellId);
        const isNewElement = !!prevStateRef.current.newElement.id;

        if (
            !prevStateRef.current.target.cellId ||
            !prevStateRef.current.target.layoutId ||
            (!isSourceElementInSlide && !isNewElement)
        ) {
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
            });
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
                        targetSlide: targetSlide!,
                    });
                } else if (prevStateRef.current.source.cellId) {
                    processMoveCellToCellInCurrentLayout({
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                    });
                }
            } else {
                if (prevStateRef.current.source.elementId) {
                    processMoveElementToCellToOtherLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                        sourceSlide: sourceSlide!,
                    });
                } else if (prevStateRef.current.source.cellId) {
                    processMoveCellToCellInOtherLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                        sourceSlide: sourceSlide!,
                    });
                }
            }
        }
    }, [
        getLayout,
        getLayoutSlide,
        processAddElementToSiblingCell,
        processMoveCellToCellInCurrentLayout,
        processMoveCellToCellInOtherLayout,
        processMoveElementToCellInCurrentLayout,
        processMoveElementToCellToOtherLayout,
    ]);

    // Implementation of processColumnDrop
    const processColumnDrop = useCallback(() => {
        if (!prevStateRef.current.source.cellId || !prevStateRef.current.source.layoutId) {
            return;
        }

        // Check if it's a column by checking if cellId starts with "column-"
        if (!prevStateRef.current.source.cellId.startsWith('column-')) {
            return;
        }

        // Extract column info from the cellId
        const sourceColumnInfo = prevStateRef.current.source.cellId.split('-');
        if (sourceColumnInfo.length !== 3) {
            return;
        }

        const sourceLayoutId = sourceColumnInfo[1];
        const sourceColumnIndex = parseInt(sourceColumnInfo[2], 10);

        // Get target info
        const targetLayoutId = prevStateRef.current.target.layoutId;
        let targetColumnIndex = -1;

        if (prevStateRef.current.target.cellId?.startsWith('column-')) {
            const targetColumnInfo = prevStateRef.current.target.cellId.split('-');
            if (targetColumnInfo.length === 3) {
                targetColumnIndex = parseInt(targetColumnInfo[2], 10);
            }
        }

        if (targetColumnIndex === -1 || !targetLayoutId) {
            return;
        }

        // Restrict movement to only within the same table
        if (sourceLayoutId !== targetLayoutId) {
            console.warn('Column movement between different tables is not allowed');
            return;
        }

        // Check if we're trying to move a column to itself
        if (sourceColumnIndex === targetColumnIndex) {
            return;
        }

        const sourceLayout = getLayout(sourceLayoutId);
        const targetSlide = getLayoutSlide(sourceLayoutId);

        if (!sourceLayout || !targetSlide) {
            return;
        }

        // Begin transaction
        DragDropTransactionHelper.beginDragOperation(presentationId, 'Move column');

        // Clone the grid structures to avoid mutating the original
        const sourceGridStructure = JSON.parse(JSON.stringify(sourceLayout.gridStructure));

        // Moving a column within the same table
        // Create a new copy of the elements for the update
        const updatedRows = sourceGridStructure.rows.map((row: GridRow) => {
            // Remove the source column cell
            const updatedCells = [...row.cells];
            const sourceCell = updatedCells.splice(sourceColumnIndex, 1)[0];

            // Insert it at the target position
            const insertIndex =
                sourceColumnIndex < targetColumnIndex
                    ? targetColumnIndex - 1 // Adjust for removal
                    : targetColumnIndex;
            updatedCells.splice(insertIndex, 0, sourceCell);

            // Update cell column positions
            updatedCells.forEach((cell, colIndex) => {
                cell.column = colIndex;
            });

            return {
                ...row,
                cells: updatedCells,
            };
        });

        // Update the layout
        DragDropTransactionHelper.updateLayout(presentationId, targetSlide.id, sourceLayoutId, {
            gridStructure: {
                ...sourceGridStructure,
                rows: updatedRows,
            },
        });

        // Clear column indicator
        setColumnIndicator(null, null);

        // Commit the transaction
        DragDropTransactionHelper.commitDragOperation(presentationId);
    }, [getLayout, getLayoutSlide, presentationId, setColumnIndicator]);

    const processTableRowDrop = useCallback(() => {
        if (!prevStateRef.current.source.tableId || !prevStateRef.current.target.tableId) {
            return;
        }

        const sourceLayout = getLayout(prevStateRef.current.source.tableId);
        const targetLayout = getLayout(prevStateRef.current.target.tableId);

        if (!sourceLayout || !targetLayout) {
            return;
        }

        const tableRowPosition = prevStateRef.current.indicators.tableRowPosition;

        if (sourceLayout.id === targetLayout.id) {
            // Moving rows within the same table
            const updatedGridStructure = { ...sourceLayout.gridStructure };
            const sourceRowIndex = prevStateRef.current.source.rowIndex!;
            const targetRowIndex = prevStateRef.current.target.rowIndex!;

            // Don't do anything if source and target are the same
            if (sourceRowIndex === targetRowIndex) {
                return;
            }

            // Move the row
            const [movedRow] = updatedGridStructure.rows.splice(sourceRowIndex, 1);
            const insertIndex = tableRowPosition === 'top' ? targetRowIndex - 1 : targetRowIndex;
            updatedGridStructure.rows.splice(insertIndex, 0, movedRow);

            // Update row indices
            updatedGridStructure.rows.forEach((row, index) => {
                row.cells.forEach(cell => {
                    cell.row = index;
                });
            });

            const sourceSlide = getLayoutSlide(prevStateRef.current.source.tableId);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide!.id, sourceLayout.id, {
                gridStructure: updatedGridStructure,
            });
        } else {
            // Moving rows between different tables
            const updatedSourceGridStructure = { ...sourceLayout.gridStructure };
            const updatedTargetGridStructure = { ...targetLayout.gridStructure };

            const sourceRowIndex = prevStateRef.current.source.rowIndex!;
            const targetRowIndex = prevStateRef.current.target.rowIndex!;

            // Get the row being moved
            const [movedRow] = updatedSourceGridStructure.rows.splice(sourceRowIndex, 1);

            // Get elements in the moved row
            const movedElements = sourceLayout.elements.filter(element =>
                movedRow.cells.some(cell => cell.id === element.cellId)
            );

            // если размер перемещаемой строки больше, чем размер целевой строки, то добавляем новые колонки во все ячейки
            if (movedRow.cells.length > targetLayout.gridStructure.columns) {
                updatedTargetGridStructure.columns = movedRow.cells.length;

                updatedTargetGridStructure.rows.forEach(row => {
                    const newCells = Array.from({ length: movedRow.cells.length - row.cells.length }, (_, index) => ({
                        id: generateId(),
                        row: index,
                        column: row.cells.length + index,
                    }));

                    const newEditors = newCells.map(cell => getNewEditorElement(cell.id));

                    row.cells = [...row.cells, ...newCells];
                    targetLayout.elements = [...targetLayout.elements, ...newEditors];
                });

                updatedTargetGridStructure.columns = movedRow.cells.length;
                updatedTargetGridStructure.columnWidths = getColumnWidths(updatedTargetGridStructure.columns);
            } else if (movedRow.cells.length < updatedTargetGridStructure.columns) {
                // добавляем в строку новые ячейки и создаем новые элементы в них
                const newCells = movedRow.cells.concat(
                    Array.from({ length: updatedTargetGridStructure.columns - movedRow.cells.length }, (_, index) => ({
                        id: generateId(),
                        row: index,
                        // TODO: нужно проверить. скорее всего непраивльный column
                        column: index,
                    }))
                );

                movedRow.cells = newCells;

                const newEditors = newCells.map(cell => getNewEditorElement(cell.id));

                targetLayout.elements = [...targetLayout.elements, ...newEditors];
            }

            // если размер перемещаемой строки меньше, чем размер целевой строки, то добавляем в строку новые ячейки и создаем новые элементы в них

            // Create new cells for the target table with new IDs
            const newRow = {
                ...movedRow,
                cells: movedRow.cells.map((cell, index) => ({
                    ...cell,
                    id: generateId(),
                    column: index,
                })),
            };

            // Insert the row in the target table
            const insertIndex = tableRowPosition === 'top' ? targetRowIndex : targetRowIndex + 1;
            updatedTargetGridStructure.rows.splice(insertIndex, 0, newRow);

            // Update row indices in both tables
            updatedSourceGridStructure.rows.forEach((row, index) => {
                row.cells.forEach(cell => {
                    cell.row = index;
                });
            });

            updatedTargetGridStructure.rows.forEach((row, index) => {
                row.cells.forEach(cell => {
                    cell.row = index;
                });
            });

            // Update elements with new cell IDs
            const updatedTargetElements = [...targetLayout.elements];
            movedElements.forEach(element => {
                const oldCell = movedRow.cells.find(cell => cell.id === element.cellId);
                if (oldCell) {
                    const newCell = newRow.cells[oldCell.column];
                    updatedTargetElements.push({
                        ...element,
                        cellId: newCell.id,
                    });
                }
            });

            const sourceSlide = getLayoutSlide(prevStateRef.current.source.tableId);
            const targetSlide = getLayoutSlide(prevStateRef.current.target.tableId);

            // Update source table
            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide!.id, sourceLayout.id, {
                gridStructure: updatedSourceGridStructure,
                elements: sourceLayout.elements.filter(
                    element => !movedElements.some(movedElement => movedElement.id === element.id)
                ),
            });

            // Update target table
            DragDropTransactionHelper.updateLayout(presentationId, targetSlide!.id, targetLayout.id, {
                gridStructure: updatedTargetGridStructure,
                elements: updatedTargetElements,
            });
        }
    }, [getLayout, getLayoutSlide, presentationId]);

    const completeDrop = useCallback(() => {
        if (prevStateRef.current.dragState !== 'dragging') {
            return;
        }

        // Check if source cellId is a column
        if (prevStateRef.current.source.cellId?.startsWith('column-')) {
            processColumnDrop();
        } else if (Number.isInteger(prevStateRef.current.source.rowIndex)) {
            processTableRowDrop();
        } else if (prevStateRef.current.indicators.elementIndicator) {
            processElementDrop();
        } else if (prevStateRef.current.indicators.cellIndicator) {
            processCellDrop();
        } else if (prevStateRef.current.indicators.layoutIndicator) {
            processLayoutDrop();
        } else if (prevStateRef.current.indicators.slideIndicator) {
            processSlideDrop();
        }

        dispatch({ type: 'COMPLETE_DROP' });
    }, [
        processCellDrop,
        processElementDrop,
        processLayoutDrop,
        processSlideDrop,
        processColumnDrop,
        processTableRowDrop,
    ]);
    // ... existing code ...

    useEffect(() => {
        let lastProcessedTime = 0;
        const THROTTLE_INTERVAL = 50; // milliseconds

        /**************************
         *  Event  : Drag Over
         **************************/
        const handleDocumentDragOver = (e: DragEvent) => {
            // console.log('[DragDropContext] dragover', {
            //     x: e.clientX,
            //     y: e.clientY,
            //     dragState: state.dragState,
            // });

            e.preventDefault();

            // Only process if we're dragging
            if (state.dragState !== 'dragging') return;

            // Apply throttling to improve performance
            const now = Date.now();
            if (now - lastProcessedTime < THROTTLE_INTERVAL) return;
            lastProcessedTime = now;

            // Get element under cursor
            const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
            // console.warn('[DragDropContext] dragover – elemBelow', elemBelow);

            if (!elemBelow) {
                console.log('[DragDropContext] dragover – nothing under cursor');
                return;
            }

            // Find target elements with data attributes
            const elementNode = elemBelow.closest('[data-element-id]');
            const cellNode = elemBelow.closest('[data-cell-id]');
            const rowNode = elemBelow.closest('[data-row-id]');
            const layoutNode = elemBelow.closest('[data-layout-id]');
            const slideNode = elemBelow.closest('[data-slide-id]');

            const elementId = elementNode?.getAttribute('data-element-id');
            const layoutId = layoutNode?.getAttribute('data-layout-id');
            const cellId = cellNode?.getAttribute('data-cell-id');
            const slideId = slideNode?.getAttribute('data-slide-id');

            // console.log('[DragDropContext] dragover targets', {
            //     elementId,
            //     cellId,
            //     layoutId,
            //     slideId,
            // });

            // Check if we're over a slide container or similar with no direct elements below
            // This means we're in the empty space between elements
            // We need to find the closest layout by position
            if (!elementNode && !cellNode && slideNode && state.dragState === 'dragging' && state.source.elementId) {
                console.log('[DragDropContext] dragover – in empty space between elements');

                // Find all layouts on the current slide
                const slideLayouts = Array.from(slideNode.querySelectorAll('[data-layout-id]'));
                if (slideLayouts.length === 0) {
                    console.log('[DragDropContext] dragover – no layouts found on slide');
                    return;
                }

                // Calculate distances from mouse to each layout's boundaries
                const layoutsWithDistance: Array<{
                    node: Element;
                    layoutId: string;
                    distanceY: number;
                    distanceX: number;
                    distance: number; // Combined distance metric
                    isAbove: boolean;
                    isToLeft: boolean;
                    isToRight: boolean;
                    nearestElementId: string | null;
                }> = [];

                // Current mouse position
                const mouseY = e.clientY;
                const mouseX = e.clientX;

                slideLayouts.forEach(node => {
                    const layoutRect = node.getBoundingClientRect();
                    const layoutId = node.getAttribute('data-layout-id');

                    if (!layoutId) return;

                    // Get all elements in this layout
                    const layoutElements = Array.from(node.querySelectorAll('[data-element-id]'));
                    if (layoutElements.length === 0) return;

                    // Find the closest element in this layout
                    let closestElement: Element | null = null;
                    let minDistanceY = Number.MAX_VALUE;
                    let minDistanceX = Number.MAX_VALUE;
                    let isAbove = false;
                    let isToLeft = false;
                    let isToRight = false;

                    layoutElements.forEach(el => {
                        const elRect = el.getBoundingClientRect();

                        // Check if element is above or below mouse
                        if (mouseY < elRect.top) {
                            // Mouse is above element
                            const distance = elRect.top - mouseY;
                            if (distance < minDistanceY) {
                                minDistanceY = distance;
                                closestElement = el;
                                isAbove = false; // Mouse is above, so element is below
                            }
                        } else if (mouseY > elRect.bottom) {
                            // Mouse is below element
                            const distance = mouseY - elRect.bottom;
                            if (distance < minDistanceY) {
                                minDistanceY = distance;
                                closestElement = el;
                                isAbove = true; // Mouse is below, so element is above
                            }
                        } else {
                            // Mouse is inside element vertically
                            minDistanceY = 0;
                            closestElement = el;
                            isAbove = mouseY < elRect.top + elRect.height / 2;
                        }

                        // Check if element is to left or right of mouse
                        if (mouseX < elRect.left) {
                            // Mouse is to the left of element
                            const distance = elRect.left - mouseX;
                            if (distance < minDistanceX) {
                                minDistanceX = distance;
                                closestElement = el;
                                isToLeft = false; // Mouse is to left, element is to right
                                isToRight = true;
                            }
                        } else if (mouseX > elRect.right) {
                            // Mouse is to the right of element
                            const distance = mouseX - elRect.right;
                            if (distance < minDistanceX) {
                                minDistanceX = distance;
                                closestElement = el;
                                isToLeft = true; // Mouse is to right, element is to left
                                isToRight = false;
                            }
                        } else {
                            // Mouse is inside element horizontally
                            minDistanceX = 0;
                            closestElement = el;
                            isToLeft = mouseX < elRect.left + elRect.width / 2;
                            isToRight = !isToLeft;
                        }
                    });

                    if (closestElement) {
                        // Calculate combined distance for better sorting
                        // Using squared distance for more accurate calculations
                        const distance = Math.sqrt(minDistanceX * minDistanceX + minDistanceY * minDistanceY);

                        layoutsWithDistance.push({
                            node,
                            layoutId,
                            distanceY: minDistanceY,
                            distanceX: minDistanceX,
                            distance,
                            isAbove,
                            isToLeft,
                            isToRight,
                            nearestElementId: closestElement.getAttribute('data-element-id'),
                        });
                    }
                });

                // Sort by combined distance (distance) ascending
                layoutsWithDistance.sort((a, b) => a.distance - b.distance);

                // Use the closest layout and element
                if (layoutsWithDistance.length > 0) {
                    const closest = layoutsWithDistance[0];
                    console.log('[DragDropContext] dragover – found closest element', closest);

                    if (closest.nearestElementId && closest.nearestElementId !== state.source.elementId) {
                        // Get the element node
                        // const nearestElementNode = slideNode.querySelector(
                        //     `[data-element-id="${closest.nearestElementId}"]`
                        // );

                        const nearestLayoutNode = slideNode.querySelector(`[data-layout-id="${closest.layoutId}"]`);

                        if (nearestLayoutNode) {
                            // Process the drop target as if we were hovering over this element
                            // with a position based on whether it's above or below
                            let position: Position;

                            // Determine if we should use vertical or horizontal positioning
                            // If horizontal distance is significantly smaller than vertical, prefer horizontal positioning
                            if (closest.distanceX < closest.distanceY * 0.8) {
                                // Horizontal positioning takes precedence
                                position = closest.isToLeft ? 'left' : 'right';
                            } else {
                                // Vertical positioning
                                position = closest.isAbove ? 'bottom' : 'top';
                            }

                            // Only update if needed
                            if (
                                prevStateRef.current.indicators.elementIndicator !== closest.nearestElementId ||
                                prevStateRef.current.indicators.elementPosition !== position
                            ) {
                                console.log('[DragDropContext] dragover – setting nearest element indicator', {
                                    elementId: closest.nearestElementId,
                                    position,
                                });

                                setLayoutIndicator(closest.layoutId, position);
                                setElementIndicator(null, null);
                                setSlideIndicator(null);

                                // Update target state
                                setDropTarget({
                                    elementId: null,
                                    layoutId: closest.layoutId,
                                    position,
                                });
                            }

                            return;
                        }
                    }
                }
            }

            if (
                // Hover on source element
                (elementId && elementId === state.source.elementId) ||
                // Hover on source layout but not on another element
                (layoutId && layoutId === state.source.layoutId && !elementId) ||
                // Hover inside same cell
                (cellId && cellId === state.source.cellId && layoutId === state.source.layoutId)
            ) {
                console.log('[DragDropContext] dragover – reset indicators');
                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);
                setTableColumnIndicator(null, null, null, null);
                setTableRowIndicator(null, null, null, null);
                setDropTarget({
                    elementId: null,
                    layoutId: null,
                    cellId: null,
                    position: null,
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
                        slideIndicator: null,
                        tableColumnIndicator: null,
                        tableColumnPosition: null,
                        tableRowIndicator: null,
                        tableRowPosition: null,
                    },
                };

                return;
            }

            const targetLayout = layoutId ? getLayout(layoutId) : undefined;

            // Get layout information to determine the appropriate target
            if (
                state.source.layoutId &&
                layoutId &&
                state.source.layoutId !== layoutId &&
                targetLayout?.hasSameCellsCount
            ) {
                const sourceLayout = getLayout(state.source.layoutId);
                const targetLayout = getLayout(layoutId);

                if (!sourceLayout || !targetLayout) {
                    console.log('[DragDropContext] dragover – no sourceLayout or targetLayout');
                    return;
                }
            }

            if (!targetLayout) {
                console.log('[DragDropContext] dragover – no targetLayout found for id', layoutId);
                return;
            }

            // Determine context of the drag
            const isSingleCellSingleElement =
                targetLayout.type === 'single-column' && targetLayout.elements.length <= 1;
            const isMultiCellRow = targetLayout.gridStructure.rows[0].cells.length > 1;
            const isTable = !!targetLayout.isTable;

            // Prioritize targets based on the context
            // console.log('[DragDropContext] dragover context', {
            //     isSingleCellSingleElement,
            //     isMultiCellRow,
            //     isTable,
            // });

            // Case 1: If we're over a single cell with a single element, we can drop on any side
            if (isSingleCellSingleElement && elementId && elementId !== state.source.elementId) {
                // console.log('[DragDropContext] dragover – processLayoutTarget (single cell / single element)');
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            } else if (isTable) {
                // console.log('[DragDropContext] dragover – processTableTarget');
                processTableTarget(e, layoutId, cellNode as HTMLElement);
            }
            // Case 2: If we're over a cell in a multi-cell row, we can drop on left/right of cell
            else if (isMultiCellRow && cellId && cellId !== state.source.cellId) {
                // console.log('[DragDropContext] dragover – processCellTarget (multi-cell row)');
                processCellTarget(e, cellId, layoutId, cellNode as HTMLElement, elementNode as HTMLElement, elementId);
            } else if (isMultiCellRow && cellId !== state.source.cellId) {
                // console.log('[DragDropContext] dragover – processLayoutTarget (multi-cell row)');
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }

            // Case 3: If we're over an element, we can drop top/bottom of that element
            else if (elementId && elementId !== state.source.elementId) {
                // console.log('[DragDropContext] dragover – processElementTarget');
                processElementTarget(e, elementId, layoutId, elementNode as HTMLElement);
            } else if (layoutId && layoutId !== state.source.layoutId) {
                // console.log('[DragDropContext] dragover – processLayoutTarget (default)');
                processLayoutTarget(e, layoutId, layoutNode as HTMLElement, isMultiCellRow);
            }
            // Case 5: If we're over a slide, we can drop on the slide
            else if (slideId && (!state.source.layoutId || getLayoutSlide(state.source.layoutId)?.id !== slideId)) {
                console.log('[DragDropContext] dragover – setSlideIndicator', slideId);
                setSlideIndicator(slideId);
                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setDropTarget({
                    elementId: null,
                    layoutId: null,
                    cellId: null,
                    slideId,
                    position: null,
                });
            } else {
                // Not over a valid target
                console.log('[DragDropContext] dragover – no valid target');
                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);
                setDropTarget({
                    elementId: null,
                    layoutId: null,
                    cellId: null,
                    position: null,
                });
            }
        };

        const processElementTarget = (e: DragEvent, elementId: string, layoutId: string, elementNode: HTMLElement) => {
            // Get element dimensions
            console.log('[DragDropContext] processElementTarget', { elementId, layoutId });
            const rect = elementNode.getBoundingClientRect();

            // Get layout to determine number of cells
            const layout = getLayout(layoutId);
            if (!layout) return;

            const targetElement = layout.elements.find(el => el.id === elementId);
            if (!targetElement) return;

            // Find all elements in the same cell for better drop zone calculation
            const cellId = targetElement.cellId;
            const cellElements = layout.elements.filter(el => el.cellId === cellId);

            // Sort elements by their vertical position
            const elementsWithNodes = cellElements
                .map(el => {
                    const node = document.querySelector(`[data-element-id="${el.id}"]`);
                    if (!node) return null;
                    return {
                        element: el,
                        rect: node.getBoundingClientRect(),
                    };
                })
                .filter(item => item !== null) as { element: BaseElement; rect: DOMRect }[];

            // Sort by vertical position (top to bottom)
            elementsWithNodes.sort((a, b) => a.rect.top - b.rect.top);

            // Find current element index in the sorted list
            const currentElementIndex = elementsWithNodes.findIndex(item => item.element.id === elementId);

            // For single-cell layouts with one element, allow drops on all sides
            const isSingleCellLayout = layout.gridStructure.rows[0].cells.length === 1;

            // Calculate distances from edges
            const distanceFromTop = e.clientY - rect.top;
            const distanceFromBottom = rect.bottom - e.clientY;
            const distanceFromLeft = e.clientX - rect.left;
            const distanceFromRight = rect.right - e.clientX;

            // Determine position based on mouse location and element gaps
            let position: Position | null = null;

            // Check which distance is smallest - this helps determine if we should
            // prefer horizontal or vertical positioning
            const minHorizontalDistance = Math.min(distanceFromLeft, distanceFromRight);
            const minVerticalDistance = Math.min(distanceFromTop, distanceFromBottom);

            // If horizontal distance is significantly smaller than vertical, use horizontal positioning
            const shouldUseHorizontalPosition = minHorizontalDistance < minVerticalDistance * 0.7;

            // If we're significantly closer to left/right edges than top/bottom,
            // prefer left/right positioning
            if (shouldUseHorizontalPosition) {
                if (distanceFromLeft < distanceFromRight) {
                    position = 'left';
                } else {
                    position = 'right';
                }
            } else {
                // Otherwise, use the vertical positioning logic (existing code)
                // Enhance the detection logic for top/bottom positions
                if (currentElementIndex > 0 && currentElementIndex < elementsWithNodes.length) {
                    // Check if we're between elements
                    const prevElement = elementsWithNodes[currentElementIndex - 1];
                    const currElement = elementsWithNodes[currentElementIndex];

                    // Calculate and use the gap to create a more precise drop zone
                    const gapAbove = currElement.rect.top - prevElement.rect.bottom;
                    const halfGapAbove = prevElement.rect.bottom + gapAbove / 2;

                    // If mouse is in the upper half of the element or in the gap above
                    if (
                        e.clientY < rect.top + rect.height / 2 ||
                        (gapAbove > 0 && e.clientY >= prevElement.rect.bottom && e.clientY <= halfGapAbove)
                    ) {
                        position = 'top';
                    }
                }

                if (currentElementIndex >= 0 && currentElementIndex < elementsWithNodes.length - 1) {
                    // Check below the current element
                    const currElement = elementsWithNodes[currentElementIndex];
                    const nextElement = elementsWithNodes[currentElementIndex + 1];

                    // Calculate and use the gap to create a more precise drop zone
                    const gapBelow = nextElement.rect.top - currElement.rect.bottom;
                    const halfGapBelow = currElement.rect.bottom + gapBelow / 2;

                    // If mouse is in the lower half of the element or in the gap below
                    if (
                        position === null &&
                        (e.clientY > rect.top + rect.height / 2 ||
                            (gapBelow > 0 && e.clientY >= currElement.rect.bottom && e.clientY <= halfGapBelow))
                    ) {
                        position = 'bottom';
                    }
                }

                // Handle edge cases (first or last element)
                if (position === null) {
                    // Increase detection area by adding a threshold for top/bottom
                    const threshold = rect.height * 0.3; // Use 30% of element height as threshold

                    // For the first element
                    if (currentElementIndex === 0 && distanceFromTop < threshold) {
                        position = 'top';
                    }
                    // For the last element
                    else if (currentElementIndex === elementsWithNodes.length - 1 && distanceFromBottom < threshold) {
                        position = 'bottom';
                    }
                    // For elements without clear position yet
                    else {
                        if (distanceFromTop < distanceFromBottom) {
                            position = 'top';
                        } else {
                            position = 'bottom';
                        }
                    }
                }
            }

            // If a position still hasn't been determined (unlikely at this point),
            // fallback to the nearest edge
            if (!position) {
                // Find minimum distance from all edges
                const minDistance = Math.min(distanceFromTop, distanceFromBottom, distanceFromLeft, distanceFromRight);

                if (minDistance === distanceFromTop) {
                    position = 'top';
                } else if (minDistance === distanceFromBottom) {
                    position = 'bottom';
                } else if (minDistance === distanceFromLeft) {
                    position = 'left';
                } else if (minDistance === distanceFromRight) {
                    position = 'right';
                }
            }

            if (!position) return;

            // Only update if state changed
            if (
                prevStateRef.current.indicators.elementIndicator === elementId &&
                prevStateRef.current.indicators.elementPosition === position
            ) {
                return;
            }

            console.log('[DragDropContext] processElementTarget – set indicator', { position });

            // Set indicators
            setElementIndicator(elementId, position);
            setLayoutIndicator(null, null);
            setSlideIndicator(null);

            // Update target state
            setDropTarget({
                elementId,
                layoutId,
                cellId: targetElement.cellId,
                position,
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
                    slideIndicator: null,
                },
            };
        };

        const processTableTarget = (e: DragEvent, tableId: string, cellNode: HTMLElement) => {
            console.log('[DragDropContext] processTableTarget', { tableId });

            const layout = getLayout(tableId);

            if (!layout || !layout.isTable || !cellNode) {
                console.log('[DragDropContext] processTableTarget – invalid layout/cell');
                return;
            }

            const cellId = cellNode.getAttribute('data-cell-id');

            // Handle row drag
            if (prevStateRef.current.source.rowIndex !== undefined) {
                const targetRowIndex = layout.gridStructure.rows.findIndex(row =>
                    row.cells.some(cell => cell.id === cellId)
                );

                const firstCellInRow = layout.gridStructure.rows[targetRowIndex]?.cells[0];
                if (!firstCellInRow) return;

                const firstNodeInRow = document.querySelector(`[data-cell-id="${firstCellInRow.id}"]`);
                if (!firstNodeInRow) return;

                const rectCell = firstNodeInRow.getBoundingClientRect();
                const distanceFromCellTop = e.clientY - rectCell.top;
                const distanceFromCellBottom = rectCell.bottom - e.clientY;

                const minDistance = Math.min(distanceFromCellTop, distanceFromCellBottom);

                let position: Position | null = null;
                if (minDistance === distanceFromCellTop) {
                    position = 'top';
                } else if (minDistance === distanceFromCellBottom) {
                    position = 'bottom';
                }

                setElementIndicator(null, null);
                setCellIndicator(null, null);
                setLayoutIndicator(null, null);
                setSlideIndicator(null);
                setTableColumnIndicator(null, null, null, null);

                setTableRowIndicator(firstCellInRow.id, targetRowIndex, position, tableId);

                setDropTarget({
                    elementId: null,
                    tableId,
                    rowIndex: targetRowIndex,
                    position,
                });

                prevStateRef.current = {
                    ...state,
                    target: {
                        elementId: null,
                        tableId,
                        rowIndex: targetRowIndex,
                        position,
                    },
                    indicators: {
                        ...state.indicators,
                        elementIndicator: null,
                        elementPosition: null,
                        cellIndicator: cellId,
                        cellPosition: position,
                        layoutIndicator: null,
                        layoutPosition: null,
                        slideIndicator: null,
                        tableColumnIndicator: null,
                        tableColumnPosition: null,
                        tableRowIndicator: targetRowIndex,
                        tableRowPosition: position,
                        tableId,
                    },
                };
                return;
            }

            // Handle column drag (existing code)
            const targetColumnIndex: number =
                layout.gridStructure.rows.flatMap(row => row.cells).find(cell => cell.id === cellId)?.column || 0;

            const firstCellInColumn = layout.gridStructure.rows[0].cells[targetColumnIndex];

            if (!firstCellInColumn) {
                return;
            }

            const firstNodeInColumn = document.querySelector(`[data-cell-id="${firstCellInColumn.id}"]`);
            if (!firstNodeInColumn) {
                return;
            }

            const rectCell = firstNodeInColumn.getBoundingClientRect();
            const distanceFromCellLeft = e.clientX - rectCell.left;
            const distanceFromCellRight = rectCell.right - e.clientX;

            const minDistance = Math.min(distanceFromCellLeft, distanceFromCellRight);

            let position: Position | null = null;
            if (minDistance === distanceFromCellLeft) {
                position = 'left';
            } else if (minDistance === distanceFromCellRight) {
                position = 'right';
            }

            setElementIndicator(null, null);
            setCellIndicator(null, null);
            setLayoutIndicator(null, null);
            setSlideIndicator(null);
            setTableRowIndicator(null, null, null, null);

            setTableColumnIndicator(firstCellInColumn.id, firstCellInColumn.column, position, tableId);

            setDropTarget({
                elementId: null,
                tableId,
                columnIndex: targetColumnIndex,
                position,
            });

            prevStateRef.current = {
                ...state,
                target: {
                    elementId: null,
                    tableId,
                    columnIndex: targetColumnIndex,
                    position,
                },
                indicators: {
                    ...state.indicators,
                    elementIndicator: null,
                    elementPosition: null,
                    cellIndicator: cellId,
                    cellPosition: position,
                    layoutIndicator: null,
                    layoutPosition: null,
                    slideIndicator: null,
                    tableColumnIndicator: targetColumnIndex,
                    tableColumnPosition: position,
                    tableRowIndicator: null,
                    tableRowPosition: null,
                    tableId,
                },
            };
        };

        const processCellTarget = (
            e: DragEvent,
            cellId: string,
            layoutId: string,
            cellNode: HTMLElement,
            elementNode?: HTMLElement,
            elementId?: string | null
        ) => {
            console.log('[DragDropContext] processCellTarget', { cellId, layoutId });
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
            console.log('[DragDropContext] processCellTarget – elementNode', { elementNode });
            if (elementNode) {
                // For cell targets, we're primarily interested in left/right position

                const rectElement = elementNode?.getBoundingClientRect();
                const distanceFromElementLeft = e.clientX - rectElement.left;
                const distanceFromElementRight = rectElement.right - e.clientX;
                const distanceFromElementTop = e.clientY - rectElement.top;
                const distanceFromElementBottom = rectElement.bottom - e.clientY;

                minDistance = Math.min(
                    distanceFromCellLeft,
                    distanceFromCellRight,
                    distanceFromCellTop,
                    distanceFromCellBottom,
                    distanceFromElementLeft,
                    distanceFromElementRight,
                    distanceFromElementTop,
                    distanceFromElementBottom
                );

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
                const distanceFromCellLeft = e.clientX - rectCell.left;
                const distanceFromCellRight = rectCell.right - e.clientX;
                const distanceFromCellTop = e.clientY - rectCell.top;
                const distanceFromCellBottom = rectCell.bottom - e.clientY;

                const onePercentWidth = rectCell.width / 100;
                if (distanceFromCellLeft / onePercentWidth < 20) {
                    position = 'left';
                    targetElement = 'cell';
                } else if (distanceFromCellRight / onePercentWidth < 20) {
                    position = 'right';
                    targetElement = 'cell';
                } else {
                    minDistance = Math.min(distanceFromCellTop, distanceFromCellBottom);
                    if (minDistance === distanceFromCellTop) {
                        position = 'top';
                        targetElement = 'cell';
                    } else if (minDistance === distanceFromCellBottom) {
                        position = 'bottom';
                        targetElement = 'cell';
                    }
                }
            }

            if (targetElement === 'cell') {
                console.log('[DragDropContext] processCellTarget – target is cell', { position });
                // Set indicators and clear others
                setElementIndicator(null, null);
                const layout = getLayout(layoutId);
                if (!layout) return;
                const cellElements = layout.elements.filter(el => el.cellId === cellId);

                const lastElementInCell = cellElements[cellElements.length - 1];

                if (position === 'top' || position === 'bottom') {
                    setElementIndicator(lastElementInCell.id, position);
                    setCellIndicator(null, null);
                } else {
                    setElementIndicator(null, null);
                    setCellIndicator(cellId, position);
                }
                setLayoutIndicator(null, null);
                setSlideIndicator(null);

                // Update target state
                setDropTarget({
                    elementId: null,
                    layoutId,
                    cellId,
                    position,
                });

                // Update previous state reference
                prevStateRef.current = {
                    ...state,
                    target: {
                        elementId: null,
                        layoutId,
                        cellId,
                        position,
                    },
                    indicators: {
                        ...state.indicators,
                        elementIndicator: null,
                        elementPosition: null,
                        cellIndicator: cellId,
                        cellPosition: position,
                        layoutIndicator: null,
                        layoutPosition: null,
                        slideIndicator: null,
                    },
                };
            } else if (targetElement === 'element' && elementId) {
                console.log('[DragDropContext] processCellTarget – target is element', { position });
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
                    position,
                });

                // Update previous state reference
                prevStateRef.current = {
                    ...state,
                    target: {
                        elementId,
                        layoutId,
                        cellId: null,
                        position,
                    },
                    indicators: {
                        ...state.indicators,
                        elementIndicator: elementId,
                        elementPosition: position,
                        layoutIndicator: null,
                        layoutPosition: null,
                        slideIndicator: null,
                    },
                };
            }
        };

        const processCellInLayoutTarget = (
            e: DragEvent,
            cellId: string,
            layoutId: string,
            cellNode: HTMLElement,
            position: Position
        ) => {
            console.log('[DragDropContext] processCellInLayoutTarget – target is cell', { position });
            // Set indicators and clear others
            setElementIndicator(null, null);
            const layout = getLayout(layoutId);
            if (!layout) return;
            const cellElements = layout.elements.filter(el => el.cellId === cellId);

            const lastElementInCell = cellElements[cellElements.length - 1];

            if (position === 'top' || position === 'bottom') {
                setElementIndicator(lastElementInCell.id, position);
                setCellIndicator(null, null);
            } else {
                setElementIndicator(null, null);
                setCellIndicator(cellId, position);
            }
            setLayoutIndicator(null, null);
            setSlideIndicator(null);

            // Update target state
            setDropTarget({
                elementId: null,
                layoutId,
                cellId,
                position,
            });

            // Update previous state reference
            prevStateRef.current = {
                ...state,
                target: {
                    elementId: null,
                    layoutId,
                    cellId,
                    position,
                },
                indicators: {
                    ...state.indicators,
                    elementIndicator: null,
                    elementPosition: null,
                    cellIndicator: cellId,
                    cellPosition: position,
                    layoutIndicator: null,
                    layoutPosition: null,
                    slideIndicator: null,
                },
            };
        };

        const processLayoutTarget = (
            e: DragEvent,
            layoutId: string,
            layoutNode: HTMLElement,
            isMultiCellRow?: boolean
        ) => {
            console.log('[DragDropContext] processLayoutTarget', { layoutId, isMultiCellRow, date: Date.now() });

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

            if (
                !position ||
                (prevStateRef.current.indicators.layoutIndicator === layoutId &&
                    prevStateRef.current.indicators.layoutPosition === position)
            ) {
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

                processCellInLayoutTarget(e, cellId, layoutId, cellNode as HTMLElement, position);
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
                position,
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
                    slideIndicator: null,
                },
            };
        };

        // Document-level drop handler
        const handleDocumentDrop = (e: DragEvent) => {
            e.preventDefault();

            if (prevStateRef.current.dragState === 'dragging') {
                // Process drop based on current indicators
                if (prevStateRef.current.indicators.slideIndicator) {
                    DragDropTransactionHelper.wrapInTransaction(presentationId, 'Move content to slide', () =>
                        processSlideDrop()
                    );
                } else if (
                    prevStateRef.current.indicators.layoutIndicator &&
                    prevStateRef.current.indicators.layoutPosition
                ) {
                    DragDropTransactionHelper.wrapInTransaction(presentationId, 'Move content between layouts', () =>
                        processLayoutDrop()
                    );
                } else if (
                    prevStateRef.current.indicators.cellIndicator &&
                    prevStateRef.current.indicators.cellPosition &&
                    !prevStateRef.current.indicators.tableId
                ) {
                    DragDropTransactionHelper.wrapInTransaction(presentationId, 'Move content between cells', () =>
                        processCellDrop()
                    );
                } else if (
                    prevStateRef.current.indicators.elementIndicator &&
                    prevStateRef.current.indicators.elementPosition
                ) {
                    DragDropTransactionHelper.wrapInTransaction(presentationId, 'Reposition element', () =>
                        processElementDrop()
                    );
                } else if (
                    Number.isInteger(prevStateRef.current.indicators.tableColumnIndicator) &&
                    prevStateRef.current.indicators.tableColumnPosition
                ) {
                    DragDropTransactionHelper.wrapInTransaction(presentationId, 'Reposition tables column', () =>
                        processTableColumnDrop()
                    );
                }

                // Complete the drop operation
                completeDrop();
            }
        };

        // Escape key handler
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && state.dragState === 'dragging') {
                console.log('[DragDropContext] escape pressed – cancelling drag');
                cancelDrag();
            }
        };

        // Add global event listeners
        console.log('[DragDropContext] adding global listeners');
        document.addEventListener('dragover', handleDocumentDragOver);
        document.addEventListener('drop', handleDocumentDrop);
        document.addEventListener('keydown', handleKeyDown);

        // Cleanup
        return () => {
            console.log('[DragDropContext] removing global listeners (cleanup)');
            document.removeEventListener('dragover', handleDocumentDragOver);
            document.removeEventListener('drop', handleDocumentDrop);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        state.dragState,
        state.source,
        state.newElement,
        state,
        getLayout,
        getLayoutSlide,
        setElementIndicator,
        setCellIndicator,
        setLayoutIndicator,
        setSlideIndicator,
        setDropTarget,
        completeDrop,
        presentationId,
        processSlideDrop,
        processLayoutDrop,
        processCellDrop,
        processElementDrop,
        cancelDrag,
        setColumnIndicator,
        setTableColumnIndicator,
        setTableRowIndicator,
        processTableColumnDrop,
    ]);

    // Memoize the context value to prevent unnecessary re-renders
    const contextValue = useMemo(
        () => ({
            state,
            startDrag,
            setDropTarget,
            setElementIndicator,
            setCellIndicator,
            setLayoutIndicator,
            setSlideIndicator,
            setColumnIndicator,
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
            setReadyToDrop,
        }),
        [
            state,
            startDrag,
            setDropTarget,
            setElementIndicator,
            setCellIndicator,
            setLayoutIndicator,
            setSlideIndicator,
            setColumnIndicator,
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
            setReadyToDrop,
        ]
    );

    return <DndContext.Provider value={contextValue}>{children}</DndContext.Provider>;
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
