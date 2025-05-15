/* eslint-disable indent */
import { create } from 'zustand';
import { BaseElement, DragElementType, GridCell, GridRow, GridStructure, Layout, Slide } from '@/types';
import { DndState, Position } from '@/types/DragDropTypes';
import { getNewEditorElement, getNewElement } from '@/elements/registry';
import { usePresentationStore } from './presentationStore';
import { MenuItem, menuRegistry } from '@/elements/menuRegistry';
import { DragDropTransactionHelper } from '@/contexts/DragDropTransactionHelper';
import { calculateDropPosition } from '@/utils/dragDropCalculations';
import { generateId } from '@/utils/id';
import getColumnWidths from '@/utils/getColumnWidths';

const cloneDeep = (obj: any) => JSON.parse(JSON.stringify(obj));

const initialState: DndState = {
    dragState: 'idle',
    source: {
        elementId: null,
        layoutId: null,
        cellId: null,
        tableId: null,
        rowIndex: null,
        columnIndex: null,
        slideId: null,
        smartLayoutItemId: null,
    },
    target: {
        elementId: null,
        layoutId: null,
        cellId: null,
        position: null,
        tableId: null,
        columnIndex: null,
        rowIndex: null,
        slideId: null,
    },
    indicators: {
        elementIndicator: null,
        elementPosition: null,
        layoutIndicator: null,
        layoutPosition: null,
        slideIndicator: null,
        slidePosition: null,
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
        elementTypeId: null,
        elementVariant: null,
    },
    isReadyToDrop: false,
    lastMousePosition: null,
};

// const getEmptyLayout = () => {
//     const layout: Layout = {
//         id: generateId(),
//         type: 'single-column',
//         elements: [],
//         style: {},
//         gridStructure: {
//             rows: [
//                 {
//                     id: generateId(),
//                     cells: [],
//                 },
//             ],
//             columns: 1,
//             columnWidths: [],
//         },
//     };
//     return layout;
// };

// Keep track of state between actions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let prevState = initialState;

const getUpdatedIndicators = (indicators: Partial<DndState['indicators']>) => {
    return {
        cellId: indicators.cellId ?? null,
        tableRowIndicator: indicators.tableRowIndicator ?? null,
        tableRowPosition: indicators.tableRowPosition ?? null,
        tableId: indicators.tableId ?? null,
        elementIndicator: indicators.elementIndicator ?? null,
        elementPosition: indicators.elementPosition ?? null,
        layoutIndicator: indicators.layoutIndicator ?? null,
        layoutPosition: indicators.layoutPosition ?? null,
        slideIndicator: indicators.slideIndicator ?? null,
        slidePosition: indicators.slidePosition ?? null,
        cellIndicator: indicators.cellIndicator ?? null,
        cellPosition: indicators.cellPosition ?? null,
        tableColumnIndicator: indicators.tableColumnIndicator ?? null,
        tableColumnPosition: indicators.tableColumnPosition ?? null,
    };
};

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

const findClosestElementsInCell = (state: DndState, cellNode: HTMLElement, mouseX: number, mouseY: number) => {
    if (!cellNode) return null;

    // Get all elements in the cell
    const elements = Array.from(cellNode.querySelectorAll('[data-element-id]'))
        .map(el => ({
            node: el as HTMLElement,
            rect: el.getBoundingClientRect(),
            id: el.getAttribute('data-element-id'),
        }))
        .filter(el => el.id && el.id !== state.source.elementId); // Exclude source element

    if (elements.length === 0) return null;

    // Sort by vertical position (top to bottom)
    elements.sort((a, b) => a.rect.top - b.rect.top);

    // Find elements above and below mouse position
    const elementsAbove = elements.filter(el => el.rect.bottom < mouseY);
    const elementsBelow = elements.filter(el => el.rect.top > mouseY);

    const closestAbove = elementsAbove.length > 0 ? elementsAbove[elementsAbove.length - 1] : null;
    const closestBelow = elementsBelow.length > 0 ? elementsBelow[0] : null;

    // Calculate gap sizes
    const gapAbove = closestAbove ? mouseY - closestAbove.rect.bottom : null;
    const gapBelow = closestBelow ? closestBelow.rect.top - mouseY : null;

    // Determine best position based on gaps
    if (gapAbove !== null && gapBelow !== null) {
        // Mouse is between two elements
        if (gapAbove < gapBelow) {
            return { element: closestAbove, position: 'bottom', gapSize: gapAbove };
        } else {
            return { element: closestBelow, position: 'top', gapSize: gapBelow };
        }
    } else if (gapAbove !== null) {
        // Mouse is below all elements
        return { element: closestAbove, position: 'bottom', gapSize: gapAbove };
    } else if (gapBelow !== null) {
        // Mouse is above all elements
        return { element: closestBelow, position: 'top', gapSize: gapBelow };
    }

    // Fallback to closest element by euclidean distance
    let closestElement = null;
    let minDistance = Number.MAX_VALUE;
    let position: Position | null = null;

    elements.forEach(el => {
        // Calculate distance to each edge
        const distToTop = Math.abs(mouseY - el.rect.top);
        const distToBottom = Math.abs(mouseY - el.rect.bottom);
        const distToLeft = Math.abs(mouseX - el.rect.left);
        const distToRight = Math.abs(mouseX - el.rect.right);

        // Find minimum distance
        const minEdgeDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);

        if (minEdgeDist < minDistance) {
            minDistance = minEdgeDist;
            closestElement = el;

            // Determine position relative to closest edge
            if (minEdgeDist === distToTop) position = 'top';
            else if (minEdgeDist === distToBottom) position = 'bottom';
            else if (minEdgeDist === distToLeft) position = 'left';
            else if (minEdgeDist === distToRight) position = 'right';
        }
    });

    return closestElement && position ? { element: closestElement, position, gapSize: minDistance } : null;
};

export const useDndStore = create<{
    state: DndState;
    presentationId: string | null;
    setPresentationId: (id: string) => void;
    startDrag: (
        elementId: string | null,
        layoutId: string,
        cellId?: string,
        tableId?: string,
        rowIndex?: number,
        columnIndex?: number,
        smartLayoutItemId?: string,
        slideId?: string,
        dragElementType?: DragElementType
    ) => void;
    startNewElementDrag: (element: MenuItem) => void;
    completeDrop: () => void;
    cancelDrag: () => void;
    setReadyToDrop: (isReady: boolean) => void;
    setMousePosition: (position: { x: number; y: number }) => void;
    getElement: (elementId: string, layoutId: string) => BaseElement | undefined;
    getLayout: (layoutId: string) => Layout | undefined;
    getLayoutSlide: (layoutId: string) => Slide | undefined;
    getCell: (cellId: string, layoutId: string) => GridCell | undefined;
    getNewElementFromTypeId: (elementTypeId: string, elementVariant?: string | null) => BaseElement | null;
    processElementDrop: () => void;
    processLayoutDrop: () => void;
    processSlideDrop: () => void;
    processCellDrop: () => void;
    processTableColumnDrop: () => void;
    processTableTarget: (e: React.DragEvent, tableId: string, cellNode: HTMLElement) => void;
    processTableRowDrop: () => void;
    processAddElementToCell: ({
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
    }) => void;
    processMoveElementToElementHorizontal: ({
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
    }) => void;
    processMoveCellToElementVertical: ({
        sourceLayout,
        targetLayout,
        targetElement,
        draggedElement,
        targetSlide,
        sourceSlide,
        position,
    }: {
        sourceLayout: Layout;
        targetLayout: Layout;
        targetElement: BaseElement;
        draggedElement: BaseElement;
        targetSlide: Slide;
        sourceSlide: Slide;
        position: Position;
    }) => void;

    processMoveCellToCellInCurrentLayoutVertical: ({
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
    }) => void;
    processMoveCellToCellInOtherLayoutVertical: ({
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
    }) => void;
    resetAllIndicators: () => void;
    handleDragTarget: (
        e: React.DragEvent,
        nodes: {
            elementNode?: HTMLElement | null;
            cellNode?: HTMLElement | null;
            layoutNode?: HTMLElement | null;
            slideNode?: HTMLElement | null;
        }
    ) => void;

    processAddElementToLayout: ({
        targetLayout,
        targetSlide,
        position,
        elementTypeId,
        elementVariant,
    }: {
        targetLayout: Layout;
        targetSlide: Slide;
        position: Position;
        elementTypeId: string;
        elementVariant?: string | null;
    }) => void;
    processAddElementToSiblingCell: ({
        targetLayout,
        targetSlide,
        elementTypeId,
        elementVariant,
    }: {
        targetLayout: Layout;
        targetSlide: Slide;
        elementTypeId: string;
        elementVariant?: string | null;
    }) => void;
    handleDocumentDrop: (e: React.DragEvent) => void;

    processMoveElementToCellInCurrentLayout: ({
        sourceLayout,
        targetLayout,
        targetGridStructure,
        targetSlide,
    }: {
        sourceLayout: Layout;
        targetLayout: Layout;
        targetGridStructure: GridStructure;
        targetSlide: Slide;
    }) => void;

    processMoveCellToCellInCurrentLayout: ({
        targetLayout,
        targetGridStructure,
        targetSlide,
    }: {
        targetLayout: Layout;
        targetGridStructure: GridStructure;
        targetSlide: Slide;
    }) => void;

    processMoveElementToCellToOtherLayout: ({
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
    }) => void;

    processMoveCellToCellInOtherLayout: ({
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
    }) => void;
    updatePrevStateRef: () => void;
}>((set, get) => ({
    state: initialState,
    presentationId: null,

    setPresentationId: (id: string) => set({ presentationId: id }),

    startDrag: (
        elementId: string | null,
        layoutId: string,
        cellId?: string,
        tableId?: string,
        rowIndex?: number,
        columnIndex?: number,
        smartLayoutItemId?: string,
        slideId?: string,
        dragElementType?: DragElementType
    ) => {
        set(state => {
            const newState = {
                ...state,
                state: {
                    ...state.state,
                    dragState: 'dragging' as const,
                    source: {
                        elementId,
                        layoutId,
                        cellId,
                        tableId,
                        rowIndex,
                        columnIndex,
                        smartLayoutItemId,
                        slideId,
                        dragElementType,
                    },
                    target: cloneDeep(initialState.target),
                    indicators: cloneDeep(initialState.indicators),
                    newElement: cloneDeep(initialState.newElement),
                },
            };

            prevState = newState.state;
            return newState;
        });
    },

    startNewElementDrag: (element: MenuItem) => {
        const newElement = getNewElement(element) as {
            id: string | null;
            elementTypeId: string | null;
            elementVariant: string | null;
            defaultProps: any;
        };

        if (!newElement) {
            console.error(`Element with type ${element.elementTypeId} not found in registry`);
            return;
        }

        set(state => {
            const newState = {
                ...state,
                state: {
                    ...state.state,
                    dragState: 'dragging' as const,
                    target: cloneDeep(initialState.target),
                    indicators: cloneDeep(initialState.indicators),
                    dragElementType: 'element',
                    newElement,
                },
            };

            prevState = newState.state;
            return newState;
        });
    },

    completeDrop: () => {
        set(state => {
            const newState = {
                ...state,
                state: {
                    ...initialState,
                    dragState: 'dropping' as const,
                },
            };

            prevState = newState.state;
            return newState;
        });
    },

    cancelDrag: () => {
        set(state => {
            const newState = {
                ...state,
                state: initialState,
            };

            prevState = newState.state;
            return newState;
        });
    },

    setReadyToDrop: (isReady: boolean) => {
        set(state => {
            const newState = {
                ...state,
                state: {
                    ...state.state,
                    isReadyToDrop: isReady,
                },
            };

            prevState = newState.state;
            return newState;
        });
    },

    setMousePosition: (position: { x: number; y: number }) => {
        set(state => {
            const newState = {
                ...state,
                state: {
                    ...state.state,
                    lastMousePosition: position,
                },
            };

            prevState = newState.state;
            return newState;
        });
    },

    getElement: (elementId: string, layoutId: string) => {
        const layout = get().getLayout(layoutId);
        if (!layout) return undefined;
        return layout.elements.find(e => e.id === elementId);
    },

    getLayout: (layoutId: string) => {
        const presentationId = get().presentationId;
        if (!presentationId) return undefined;

        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return undefined;

        const slide = presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
        if (!slide) return undefined;

        return slide.layouts.find(l => l.id === layoutId);
    },

    getLayoutSlide: (layoutId: string) => {
        const presentationId = get().presentationId;
        if (!presentationId) return undefined;

        const presentation = usePresentationStore.getState().getPresentation(presentationId);
        if (!presentation) return undefined;

        return presentation.slides.find(slide => slide.layouts.find(l => l.id === layoutId));
    },

    getNewElementFromTypeId: (elementTypeId: string, elementVariant?: string | null): BaseElement | null => {
        // Find the MenuItem in the registry based on elementTypeId
        const items = menuRegistry.flatMap(category =>
            category.subCategories ? category.subCategories.flatMap(sub => sub.elements) : category.elements || []
        );

        let menuItem;
        if (elementVariant) {
            menuItem = items.find(
                element => element?.elementTypeId === elementTypeId && element?.elementVariant === elementVariant
            );
        } else {
            menuItem = items.find(element => element?.elementTypeId === elementTypeId);
        }

        if (!menuItem) {
            console.error(`Element with type ${elementTypeId} not found in registry`);
            return null;
        }

        return getNewElement(menuItem) as BaseElement;
    },

    getCell: (cellId: string, layoutId: string): GridCell | undefined => {
        const layout = get().getLayout(layoutId);
        if (!layout) return undefined;
        return layout.gridStructure.rows[0].cells.find(cell => cell.id === cellId);
    },

    processAddElementToCell: ({
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
        const presentationId = get().presentationId;
        if (position === 'left' || position === 'right') {
            // Change the position of source cell
            const updatedElements = [...targetLayout.elements];
            const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

            if (targetIndex !== -1) {
                updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, {
                    ...element,
                    cellId: targetElement.cellId,
                });

                DragDropTransactionHelper.updateLayout(presentationId!, targetSlide.id, targetLayout.id, {
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

            // console.log('updatedTargetElements', updatedTargetElements);
            DragDropTransactionHelper.updateLayout(presentationId!, targetSlide.id, targetLayout.id, {
                elements: updatedTargetElements,
            });
        }
    },

    processTableTarget: (e: React.DragEvent, tableId: string, cellNode: HTMLElement) => {
        const layout = get().getLayout(tableId);

        if (!layout || !layout.isTable || !cellNode) {
            return;
        }

        const cellId = cellNode.getAttribute('data-cell-id');

        const source = get().state.source;

        // Handle row drag
        if (source.dragElementType === 'table-row') {
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

            const updatedIndicators = getUpdatedIndicators({
                cellId: firstCellInRow.id,
                tableRowIndicator: targetRowIndex,
                tableRowPosition: position,
                tableId: tableId,
            });

            const updatedTarget = {
                elementId: null,
                tableId,
                rowIndex: targetRowIndex,
                position,
            };

            set(state => ({
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedTarget,
                },
            }));

            prevState = {
                ...prevState,
                target: updatedTarget,
                indicators: updatedIndicators,
            };
            return;
        } else if (source.dragElementType === 'table-column') {
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

            // setElementIndicator(null, null);
            // setCellIndicator(null, null);
            // setLayoutIndicator(null, null);
            // setSlideIndicator(null, null);
            // setTableRowIndicator(null, null, null, null);

            // setTableColumnIndicator(firstCellInColumn.id, firstCellInColumn.column, position, tableId);

            const updatedIndicators = getUpdatedIndicators({
                cellId: firstCellInColumn.id,
                tableColumnIndicator: firstCellInColumn.column,
                tableColumnPosition: position,
                tableId: tableId,
            });

            const updatedTarget = {
                elementId: null,
                tableId,
                columnIndex: targetColumnIndex,
                position,
            };

            set(state => ({
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedTarget,
                },
            }));

            prevState = {
                ...prevState,
                target: updatedTarget,
                indicators: updatedIndicators,
            };
        } else {
            // TODO: определяем ячейку таблицы под курсором
            // смотрим, какие есть элементы в этой ячейке и определяем над или под каким элементов нужно отрисовать DropIndicator
            const cellElements = Array.from(cellNode.querySelectorAll('[data-element-id]'))
                .map(el => ({
                    node: el as HTMLElement,
                    rect: el.getBoundingClientRect(),
                    id: el.getAttribute('data-element-id'),
                }))
                .filter(el => el.id !== get().state.source.elementId); // Exclude source element

            if (cellElements.length === 0) {
                // If cell is empty, just show indicator in the middle of the cell
                // const cellRect = cellNode.getBoundingClientRect();
                const updatedIndicators = getUpdatedIndicators({
                    elementIndicator: null,
                    elementPosition: null,
                    cellIndicator: cellNode.getAttribute('data-cell-id'),
                    cellPosition: 'top',
                    tableId: tableId,
                });

                const updatedTarget = {
                    elementId: null,
                    layoutId: tableId,
                    cellId: cellNode.getAttribute('data-cell-id'),
                    position: 'top' as Position,
                };

                set(state => ({
                    state: {
                        ...state.state,
                        indicators: updatedIndicators,
                        target: updatedTarget,
                    },
                }));

                prevState = {
                    ...prevState,
                    target: updatedTarget,
                    indicators: updatedIndicators,
                };
                return;
            }

            // Sort elements by vertical position
            cellElements.sort((a, b) => a.rect.top - b.rect.top);

            // Find elements above and below mouse position
            const elementsAbove = cellElements.filter(el => el.rect.bottom < e.clientY);
            const elementsBelow = cellElements.filter(el => el.rect.top > e.clientY);

            const closestAbove = elementsAbove.length > 0 ? elementsAbove[elementsAbove.length - 1] : null;
            const closestBelow = elementsBelow.length > 0 ? elementsBelow[0] : null;

            // Calculate gaps
            const gapAbove = closestAbove ? e.clientY - closestAbove.rect.bottom : null;
            const gapBelow = closestBelow ? closestBelow.rect.top - e.clientY : null;

            let targetElement;
            let position: Position;

            // Determine best position based on gaps
            if (gapAbove !== null && gapBelow !== null) {
                // Mouse is between two elements
                if (gapAbove < gapBelow) {
                    targetElement = closestAbove;
                    position = 'bottom';
                } else {
                    targetElement = closestBelow;
                    position = 'top';
                }
            } else if (gapAbove !== null) {
                // Mouse is below all elements
                targetElement = closestAbove;
                position = 'bottom';
            } else if (gapBelow !== null) {
                // Mouse is above all elements
                targetElement = closestBelow;
                position = 'top';
            } else {
                // Fallback to closest element by euclidean distance
                let minDistance = Number.MAX_VALUE;
                let closestElement = null;
                let closestPosition: Position | null = null;

                cellElements.forEach(el => {
                    // Calculate distance to each edge
                    const distToTop = Math.abs(e.clientY - el.rect.top);
                    const distToBottom = Math.abs(e.clientY - el.rect.bottom);

                    // Find minimum distance
                    const minEdgeDist = Math.min(distToTop, distToBottom);

                    if (minEdgeDist < minDistance) {
                        minDistance = minEdgeDist;
                        closestElement = el;
                        closestPosition = minEdgeDist === distToTop ? 'top' : 'bottom';
                    }
                });

                targetElement = closestElement;
                position = closestPosition!;
            }

            if (targetElement && position) {
                const updatedIndicators = getUpdatedIndicators({
                    elementIndicator: targetElement.id,
                    elementPosition: position,
                    tableId: tableId,
                });

                const updatedTarget = {
                    elementId: targetElement.id,
                    layoutId: tableId,
                    cellId: cellNode.getAttribute('data-cell-id'),
                    position: position,
                };

                set(state => ({
                    state: {
                        ...state.state,
                        indicators: updatedIndicators,
                        target: updatedTarget,
                    },
                }));

                prevState = {
                    ...prevState,
                    target: updatedTarget,
                    indicators: updatedIndicators,
                };
            }
        }
    },

    processMoveElementToElementHorizontal: ({
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
        const presentationId = get().presentationId;

        // Change the position of source cell
        const updatedElements = [...targetLayout.elements];
        const sourceIndex = updatedElements.findIndex(e => e.id === draggedElement!.id);
        const targetIndex = updatedElements.findIndex(e => e.id === targetElement.id);

        if (sourceIndex !== -1 && targetIndex !== -1) {
            const [movedElement] = updatedElements.splice(sourceIndex, 1);
            updatedElements.splice(position === 'left' ? targetIndex : targetIndex + 1, 0, movedElement);

            DragDropTransactionHelper.updateLayout(presentationId!, targetSlide.id, targetLayout.id, {
                elements: updatedElements,
            });
        }
    },

    processMoveCellToElementVertical: ({
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
        const presentationId = get().presentationId;
        if (!presentationId) return;

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

            // console.log('updatedTargetElements', updatedTargetElements);
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

    processMoveCellToCellInOtherLayoutVertical: ({
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
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const targetElement = targetLayout.elements.find(c => c.id === prevState.target.elementId!);
        if (!targetElement) return;

        const targetCellId = targetElement.cellId;

        const updatedSourceDraggedElements = sourceLayout.elements
            .filter(e => e.cellId === draggedCell.id)
            .map(el => cloneDeep({ ...el, cellId: targetCellId }));

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

    processMoveCellToCellInCurrentLayoutVertical: ({
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
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const targetElement = targetLayout.elements.find(c => c.id === prevState.target.elementId!);
        if (!targetElement) return;

        const targetCellId = targetElement.cellId;

        const updatedSourceElements = sourceLayout.elements
            .filter(e => e.cellId === draggedCell.id)
            .map(el => cloneDeep({ ...el, cellId: targetCellId }));
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
    // Complex processing functions that handle actual drop logic
    // These would be moved from the original context
    processElementDrop: () => {
        // Early return if trying to drop a smartLayout item outside its parent
        if (prevState.source.dragElementType === 'smart-layout-item') {
            const sourceElementId = prevState.source.elementId;
            const sourceLayoutId = prevState.source.layoutId;
            const targetElementId = prevState.target.elementId;
            const targetLayoutId = prevState.target.layoutId;

            // Only allow drops within the same smartLayout
            if (sourceElementId !== targetElementId || sourceLayoutId !== targetLayoutId) {
                return;
            }
        }

        const isSourceElementInSlide =
            prevState.source.layoutId && (prevState.source.elementId || prevState.source.cellId);
        const isNewElement = !!prevState.newElement.id;

        if (
            !prevState.target.elementId ||
            !prevState.target.layoutId ||
            !prevState.indicators.elementPosition ||
            (!isSourceElementInSlide && !isNewElement)
        ) {
            return;
        }

        if (isNewElement) {
            // console.log('drop new element', prevState.newElement);

            if (!prevState.newElement.id) {
                console.warn('No element id found for new element');
                return;
            }

            const targetLayout = get().getLayout(prevState.target.layoutId);

            const newElement = get().getNewElementFromTypeId(
                prevState.newElement.elementTypeId!,
                prevState.newElement.elementVariant
            );

            if (!targetLayout || !newElement) {
                return;
            }

            const position = prevState.indicators.elementPosition;
            const targetSlide = get().getLayoutSlide(targetLayout.id);

            if (!targetSlide) return;

            const targetElement = targetLayout.elements.find(e => e.id === prevState.target.elementId);
            if (!targetElement) return;

            // Добавляем проверку на тип newElement перед вызовом processAddElementToCell
            if ('elementTypeId' in newElement) {
                get().processAddElementToCell({
                    element: newElement,
                    targetLayout,
                    targetElement,
                    targetSlide,
                    position,
                });
            }
        } else {
            if (!prevState.source.layoutId) {
                return;
            }

            const sourceLayout = get().getLayout(prevState.source.layoutId);
            const targetLayout = get().getLayout(prevState.target.layoutId);
            let draggedElement;
            if (prevState.source.elementId) {
                draggedElement = get().getElement(prevState.source.elementId, prevState.source.layoutId);
            }
            let draggedCell;
            if (prevState.source.cellId) {
                draggedCell = get().getCell(prevState.source.cellId, prevState.source.layoutId);
            }

            if (!sourceLayout || !targetLayout) {
                return;
            }

            // Ensure we have either a valid element or cell to drag
            if (!draggedElement && !draggedCell) {
                console.warn('No valid element or cell found for dragging');
                return;
            }

            const position = prevState.indicators.elementPosition;
            const targetSlide = get().getLayoutSlide(targetLayout.id);
            const sourceSlide = get().getLayoutSlide(sourceLayout.id);

            if (!targetSlide || !sourceSlide) return;

            if (draggedElement) {
                const targetElement = targetLayout.elements.find(e => e.id === prevState.target.elementId);
                if (!targetElement) return;

                // Case 2.1: left/right of element
                if (position === 'left' || position === 'right') {
                    // Change the position of source cell
                    get().processMoveElementToElementHorizontal({
                        draggedElement,
                        targetLayout,
                        targetElement,
                        targetSlide,
                        position,
                    });
                }
                // Cse 2.2: top/bottom
                else if (position === 'top' || position === 'bottom') {
                    get().processMoveCellToElementVertical({
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
                        get().processMoveCellToCellInCurrentLayoutVertical({
                            sourceLayout,
                            targetLayout,
                            draggedCell,
                            targetSlide,
                            position,
                        });
                    }
                } else {
                    get().processMoveCellToCellInOtherLayoutVertical({
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
    },

    processAddElementToLayout: ({
        targetLayout,
        targetSlide,
        position,
        elementTypeId,
        elementVariant,
    }: {
        targetLayout: Layout;
        targetSlide: Slide;
        position: Position;
        elementTypeId: string;
        elementVariant?: string | null;
    }) => {
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const newElement = get().getNewElementFromTypeId(elementTypeId, elementVariant);
        if (!newElement) return;

        // Проверяем, имеет ли newElement свойство elementTypeId
        if ('elementTypeId' in newElement && newElement.elementTypeId.startsWith('table')) {
            const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);
            if (targetLayoutIndex === -1) return;

            const newLayoutIndex = position === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

            DragDropTransactionHelper.addLayout(presentationId, targetSlide.id, newElement, newLayoutIndex);
            return;
        }

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

    processLayoutDrop: () => {
        // This function would contain the logic from the original processLayoutDrop
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const isSourceElementInSlide =
            prevState.source.layoutId && (prevState.source.elementId || prevState.source.cellId);
        const isNewElement = !!prevState.newElement.id;
        const isSourceLayoutOnly = prevState.source.layoutId && !prevState.source.elementId && !prevState.source.cellId;

        if (
            !prevState.indicators.layoutIndicator ||
            !prevState.indicators.layoutPosition ||
            !prevState.target.layoutId ||
            (!isSourceElementInSlide && !isNewElement && !isSourceLayoutOnly)
        ) {
            return;
        }

        if (isNewElement) {
            const targetLayout = get().getLayout(prevState.indicators.layoutIndicator);
            const targetSlide = get().getLayoutSlide(prevState.target.layoutId);

            if (!targetLayout || !targetSlide || !prevState.newElement.id) {
                return;
            }

            get().processAddElementToLayout({
                targetLayout,
                targetSlide,
                position: prevState.indicators.layoutPosition,
                elementTypeId: prevState.newElement.elementTypeId!,
                elementVariant: prevState.newElement.elementVariant,
            });
            return;
        } else if (isSourceLayoutOnly) {
            // Handle layout-to-layout dragging
            if (!prevState.source.layoutId) {
                return;
            }

            const sourceLayout = get().getLayout(prevState.source.layoutId);
            const targetLayout = get().getLayout(prevState.indicators.layoutIndicator);

            if (!sourceLayout || !targetLayout) {
                return;
            }

            const targetSlide = get().getLayoutSlide(prevState.target.layoutId);
            const sourceSlide = get().getLayoutSlide(prevState.source.layoutId);

            if (!targetSlide || !sourceSlide) return;

            // Check if we're reordering layouts (moving a layout to another position)
            if (prevState.indicators.layoutPosition === 'top' || prevState.indicators.layoutPosition === 'bottom') {
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

                const insertPosition = prevState.indicators.layoutPosition === 'top' ? targetIndex : targetIndex + 1;

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
            if (!prevState.source.layoutId) {
                return;
            }

            const sourceLayout = get().getLayout(prevState.source.layoutId);
            const targetLayout = get().getLayout(prevState.indicators.layoutIndicator);

            if (!sourceLayout || !targetLayout) {
                return;
            }

            const targetSlide = get().getLayoutSlide(prevState.target.layoutId);
            const sourceSlide = get().getLayoutSlide(prevState.source.layoutId);
            if (!targetSlide || !sourceSlide) return;

            if (prevState.source.elementId) {
                const draggedElement = sourceLayout.elements.find(e => e.id === prevState.source.elementId);
                if (!draggedElement) {
                    console.warn('No valid element found for dragging in processLayoutDrop');
                    return;
                }

                const position = prevState.indicators.layoutPosition;

                // const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));
                // Case 3: cell move by 1 element
                if (position === 'left' || position === 'right') {
                    console.warn('processLayoutDrop: position is left or right');
                }
                // Case 3.2: top/bottom
                else if (position === 'top' || position === 'bottom') {
                    const draggedElement = sourceLayout.elements.find(e => e.id === prevState.source.elementId);

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
                                prevState.indicators.layoutPosition === 'top'
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
                                prevState.indicators.layoutPosition === 'top'
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
            } else if (prevState.source.cellId) {
                // перетаскиваем ячейку сверху/снизу layout
                const targetLayoutIndex = targetSlide.layouts.findIndex(l => l.id === targetLayout.id);

                const newLayoutsOffset =
                    prevState.indicators.layoutPosition === 'top' ? targetLayoutIndex : targetLayoutIndex + 1;

                const sourceCellElements = sourceLayout.elements.filter(e => e.cellId === prevState.source.cellId);

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
                    (c: GridCell) => c.id !== prevState.source.cellId
                );
                updatedSourceGridStructure.columns = updatedSourceGridStructure.columns - 1;
                const updatedSourceColumnWidths = getColumnWidths(updatedSourceGridStructure.columns);
                const updatedSourceElements = sourceLayout.elements.filter(e => e.cellId !== prevState.source.cellId);
                DragDropTransactionHelper.updateLayout(presentationId, sourceSlide.id, sourceLayout.id, {
                    gridStructure: cloneDeep({
                        ...updatedSourceGridStructure,
                        columnWidths: updatedSourceColumnWidths,
                    }),
                    elements: updatedSourceElements,
                });
            }
        }
    },

    processSlideDrop: () => {
        // This function would contain the logic from the original processSlideDrop
        const presentationId = get().presentationId;
        if (!presentationId) return;

        if (!prevState.source.slideId || !prevState.indicators.slideIndicator) {
            return;
        }

        const sourceSlideId = prevState.source.slideId;
        const targetSlideId = prevState.indicators.slideIndicator;
        const position = prevState.indicators.slidePosition;

        // Don't do anything if source and target are the same
        if (sourceSlideId === targetSlideId) {
            return;
        }

        const presentation = usePresentationStore.getState().getPresentation(presentationId);

        if (!presentation) {
            console.warn('Presentation not found');
            return;
        }

        // Find the indices of source and target slides
        const sourceIndex = presentation.slides.findIndex(slide => slide.id === sourceSlideId);
        const targetIndex = presentation.slides.findIndex(slide => slide.id === targetSlideId);

        if (sourceIndex === -1 || targetIndex === -1) {
            console.warn('Source or target slide not found');
            return;
        }

        // Calculate the insertion index based on the position
        const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;

        // Clone and reorder the slides
        const updatedSlides = [...presentation.slides];
        const [movedSlide] = updatedSlides.splice(sourceIndex, 1);

        // If moving from before to after, adjust index for the removed item
        let adjustedInsertIndex = insertIndex;
        if (sourceIndex < targetIndex) {
            adjustedInsertIndex -= 1;
        }

        updatedSlides.splice(adjustedInsertIndex, 0, movedSlide);

        // Update the presentation with the new slide order
        usePresentationStore.getState().reorderSlides(presentationId, sourceIndex, adjustedInsertIndex);
    },

    processAddElementToSiblingCell: ({
        targetLayout,
        targetSlide,
        elementTypeId,
        elementVariant,
    }: {
        targetLayout: Layout;
        targetSlide: Slide;
        elementTypeId: string;
        elementVariant?: string | null;
    }) => {
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const newElement = get().getNewElementFromTypeId(elementTypeId, elementVariant);

        if (!newElement) {
            return;
        }
        const targetCell = targetLayout.gridStructure.rows[0].cells.find(c => c.id === prevState.target.cellId);

        if (!targetCell) return;

        const newCellId = generateId();
        const newCell: GridCell = {
            id: newCellId,
            row: 1,
            column: 1,
        };

        const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
            (c: GridCell) => c.id === prevState.target.cellId
        );

        const newCellPosition = prevState.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
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

    processMoveElementToCellInCurrentLayout: ({
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
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const sourceElement = sourceLayout.elements.find(e => e.id === prevState.source.elementId);
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
            (c: GridCell) => c.id === prevState.target.cellId
        );

        const newCellPosition = prevState.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
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
    processMoveCellToCellInCurrentLayout: ({
        targetLayout,
        targetGridStructure,
        targetSlide,
    }: {
        targetLayout: Layout;
        targetGridStructure: GridStructure;
        targetSlide: Slide;
    }) => {
        const presentationId = get().presentationId;
        if (!presentationId) return;

        // перемещение ячейки
        const sourceCellIndex = targetGridStructure.rows[0].cells.findIndex(
            (c: GridCell) => c.id === prevState.source.cellId
        );
        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
            (c: GridCell) => c.id === prevState.target.cellId
        );

        if (sourceCellIndex === targetCellIndex) {
            return;
        }

        const sourceCell = targetGridStructure.rows[0].cells[sourceCellIndex];
        const updatedCells = targetGridStructure.rows[0].cells.filter(
            (c: GridCell) => c.id !== prevState.source.cellId
        );
        const newTargetCellIndex = updatedCells.findIndex((c: GridCell) => c.id === prevState.target.cellId);

        const newCellPosition =
            (prevState.indicators.cellPosition === 'left' ? newTargetCellIndex : newTargetCellIndex + 1) + 1;
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

    processMoveElementToCellToOtherLayout: ({
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
        const presentationId = get().presentationId;
        if (!presentationId) return;

        // перемещение элемента
        // в target layout создаем новую ячейку
        // в source layout удаляем элемент
        // обновляем elements в target layout
        // обновляем cells в target layout
        // если в source layout была 1 ячейка, то удаляем layout
        // если в source layout больше 1 ячейки, то обновляем cells в source layout
        // и если это был 1 элемент в ячейке, то создаем пустой редактор в source cell
        const sourceElement = sourceLayout.elements.find(e => e.id === prevState.source.elementId);
        const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === sourceElement?.cellId);

        const targetCell = targetLayout.gridStructure.rows[0].cells.find(c => c.id === prevState.target.cellId);

        if (!sourceElement || !sourceCell || !targetCell) return;

        const newCellId = generateId();
        const newCell: GridCell = {
            id: newCellId,
            row: 1,
            column: 1,
        };

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
            (c: GridCell) => c.id === prevState.target.cellId
        );

        const newCellPosition = prevState.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
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

    processMoveCellToCellInOtherLayout: ({
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
        const presentationId = get().presentationId;
        if (!presentationId) return;

        // перемещение элемента
        // в target layout создаем новую ячейку
        // в source layout удаляем элемент
        // обновляем elements в target layout
        // обновляем cells в target layout
        // если в source layout была 1 ячейка, то удаляем layout
        // если в source layout больше 1 ячейки, то обновляем cells в source layout
        // и если это был 1 элемент в ячейке, то создаем пустой редактор в source cell
        // const sourceCell = sourceLayout.elements.find(e => e.id === prevState.source.cellId);
        const sourceCell = sourceLayout.gridStructure.rows[0].cells.find(c => c.id === prevState.source.cellId);

        const targetCell = targetLayout.gridStructure.rows[0].cells.find(c => c.id === prevState.target.cellId);

        if (!sourceCell || !targetCell) return;

        const newCellId = generateId();
        const newCell: GridCell = {
            id: newCellId,
            row: 1,
            column: 1,
        };

        const targetCellIndex = targetGridStructure.rows[0].cells.findIndex(
            (c: GridCell) => c.id === prevState.target.cellId
        );

        const newCellPosition = prevState.indicators.cellPosition === 'left' ? targetCellIndex : targetCellIndex + 1;
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

        const sourceLayoutIndex = sourceSlide.layouts.findIndex(l => l.id === sourceLayout.id);

        if (updatedSourceCells.length === 1) {
            updatedSourceElements.forEach((element, index) => {
                const newLayout: Layout = getEmptyLayout();

                const newCellId = generateId();
                const newCell: GridCell = {
                    id: newCellId,
                    row: 1,
                    column: 1,
                };

                newLayout.gridStructure.rows[0].cells.push(newCell);
                newLayout.elements.push({
                    ...element,
                    cellId: newCellId,
                } as BaseElement);

                DragDropTransactionHelper.addLayout(
                    presentationId,
                    sourceSlide.id,
                    newLayout,
                    sourceLayoutIndex + index
                );
            });

            DragDropTransactionHelper.deleteLayout(presentationId, sourceSlide.id, sourceLayout.id);
            // осталась 1 ячейка. все элементы ячейки раскладываем в отдельные layout
        } else {
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
        }
    },

    processCellDrop: () => {
        // This function would contain the logic from the original processCellDrop
        const presentationId = get().presentationId;
        if (!presentationId) return;

        const isSourceElementInSlide =
            prevState.source.layoutId && (prevState.source.elementId || prevState.source.cellId);
        const isNewElement = !!prevState.newElement.id;

        if (!prevState.target.cellId || !prevState.target.layoutId || (!isSourceElementInSlide && !isNewElement)) {
            return;
        }

        const targetLayout = get().getLayout(prevState.target.layoutId);

        if (!targetLayout) {
            return;
        }

        const targetSlide = get().getLayoutSlide(targetLayout.id);

        if (!targetSlide) {
            return;
        }

        if (isNewElement) {
            get().processAddElementToSiblingCell({
                targetLayout,
                targetSlide,
                elementTypeId: prevState.newElement.elementTypeId!,
                elementVariant: prevState.newElement.elementVariant!,
            });
            // console.log('drop new element', prevState.newElement);
        } else {
            if (!prevState.source.layoutId) {
                return;
            }

            const sourceLayout = get().getLayout(prevState.source.layoutId);

            if (!sourceLayout) {
                return;
            }

            const sourceSlide = get().getLayoutSlide(sourceLayout.id);
            if (!sourceSlide) return;

            // const targetGridStructure = { ...targetLayout.gridStructure };
            const targetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));

            if (sourceLayout.id === targetLayout.id) {
                // перемещение внутри одного layout
                if (prevState.source.elementId) {
                    get().processMoveElementToCellInCurrentLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                    });
                } else if (prevState.source.cellId) {
                    get().processMoveCellToCellInCurrentLayout({
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                    });
                }
            } else {
                if (prevState.source.elementId) {
                    get().processMoveElementToCellToOtherLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                        sourceSlide: sourceSlide!,
                    });
                } else if (prevState.source.cellId) {
                    get().processMoveCellToCellInOtherLayout({
                        sourceLayout,
                        targetLayout,
                        targetGridStructure,
                        targetSlide: targetSlide!,
                        sourceSlide: sourceSlide!,
                    });
                }
            }
        }
    },

    processTableColumnDrop: () => {
        // This function would contain the logic from the original processTableColumnDrop
        const presentationId = get().presentationId;
        if (!presentationId) return;

        if (!prevState.source.tableId || !prevState.target.tableId) {
            return;
        }

        const sourceLayout = get().getLayout(prevState.source.tableId);
        const targetLayout = get().getLayout(prevState.target.tableId);

        if (!sourceLayout || !targetLayout) {
            return;
        }

        const tableColumnPosition = prevState.indicators.tableColumnPosition;
        // const targetIndex = tableColumnPosition === 'left' ? prevState.target.columnIndex : prevState.target.columnIndex! + 1;

        if (sourceLayout.id === targetLayout.id) {
            const updatedGridStructure = cloneDeep(sourceLayout.gridStructure);

            const updatedRows = updatedGridStructure.rows.map((row: GridRow) => {
                const targetCellId = row.cells[prevState.target.columnIndex!].id;

                const updatedCells = [...row.cells];

                const movedCell = updatedCells.splice(prevState.source.columnIndex!, 1)[0];

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
            const sourceSlide = get().getLayoutSlide(prevState.source.tableId);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide!.id, sourceLayout.id, {
                gridStructure: updatedGridStructure,
            });
        } else {
            const updatedSourceGridStructure = JSON.parse(JSON.stringify(sourceLayout.gridStructure));

            const movedCells: GridCell[] = [];

            const movedElementsInfo: {
                cellId: string;
                elements: BaseElement[];
                rowIndex: number;
            }[] = [];

            const updatedSourceRows = updatedSourceGridStructure.rows.map((row: GridRow, index: number) => {
                const updatedCells = [...row.cells];

                const movedCell = updatedCells.splice(prevState.source.columnIndex!, 1)[0];
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

            const sourceSlide = get().getLayoutSlide(prevState.source.tableId);

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

            const updatedTargetGridStructure = cloneDeep(targetLayout.gridStructure);
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

            const targetSlide = get().getLayoutSlide(prevState.target.tableId);

            if (!targetSlide) return;

            const updatedTargetRows = updatedTargetGridStructure.rows.map((row: GridRow, index: number) => {
                const targetCellId = row.cells[prevState.target.columnIndex!].id;

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
    },

    processTableRowDrop: () => {
        // This function would contain the logic from the original processTableRowDrop
        const presentationId = get().presentationId;
        if (!presentationId) return;

        if (!prevState.source.tableId || !prevState.target.tableId) {
            return;
        }

        const sourceLayout = get().getLayout(prevState.source.tableId);
        const targetLayout = get().getLayout(prevState.target.tableId);

        if (!sourceLayout || !targetLayout) {
            return;
        }

        const tableRowPosition = prevState.indicators.tableRowPosition;

        if (sourceLayout.id === targetLayout.id) {
            // Moving rows within the same table
            const updatedGridStructure = JSON.parse(JSON.stringify(sourceLayout.gridStructure));
            const sourceRowIndex = prevState.source.rowIndex!;
            const targetRowIndex = prevState.target.rowIndex!;

            // Don't do anything if source and target are the same
            if (sourceRowIndex === targetRowIndex) {
                return;
            }

            // Move the row
            const [movedRow] = updatedGridStructure.rows.splice(sourceRowIndex, 1);
            const insertIndex = tableRowPosition === 'top' ? targetRowIndex : targetRowIndex + 1;
            updatedGridStructure.rows.splice(insertIndex, 0, movedRow);

            // Update row indices
            updatedGridStructure.rows.forEach((row: GridRow, index: number) => {
                row.cells.forEach((cell: GridCell) => {
                    cell.row = index;
                });
            });

            const sourceSlide = get().getLayoutSlide(prevState.source.tableId);

            DragDropTransactionHelper.updateLayout(presentationId, sourceSlide!.id, sourceLayout.id, {
                gridStructure: updatedGridStructure,
            });
        } else {
            // Moving rows between different tables
            const updatedSourceGridStructure = JSON.parse(JSON.stringify(sourceLayout.gridStructure));
            const updatedTargetGridStructure = JSON.parse(JSON.stringify(targetLayout.gridStructure));

            const sourceRowIndex = prevState.source.rowIndex!;
            const targetRowIndex = prevState.target.rowIndex!;

            // Get the row being moved
            const [movedRow] = updatedSourceGridStructure.rows.splice(sourceRowIndex, 1);

            // Get elements in the moved row
            const movedElements = sourceLayout.elements.filter(element =>
                movedRow.cells.some((cell: GridCell) => cell.id === element.cellId)
            );

            // если размер перемещаемой строки больше, чем размер целевой строки, то добавляем новые колонки во все ячейки
            if (movedRow.cells.length > targetLayout.gridStructure.columns) {
                updatedTargetGridStructure.columns = movedRow.cells.length;

                updatedTargetGridStructure.rows.forEach((row: GridRow) => {
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

                const newEditors = newCells.map((cell: GridCell) => getNewEditorElement(cell.id));

                targetLayout.elements = [...targetLayout.elements, ...newEditors];
            }

            // если размер перемещаемой строки меньше, чем размер целевой строки, то добавляем в строку новые ячейки и создаем новые элементы в них

            // Create new cells for the target table with new IDs
            const newRow = {
                ...movedRow,
                cells: movedRow.cells.map((cell: GridCell, index: number) => ({
                    ...cell,
                    id: generateId(),
                    column: index,
                })),
            };

            // Insert the row in the target table
            const insertIndex = tableRowPosition === 'top' ? targetRowIndex : targetRowIndex + 1;
            updatedTargetGridStructure.rows.splice(insertIndex, 0, newRow);

            // Update row indices in both tables
            updatedSourceGridStructure.rows.forEach((row: GridRow, index: number) => {
                row.cells.forEach((cell: GridCell) => {
                    cell.row = index;
                });
            });

            updatedTargetGridStructure.rows.forEach((row: GridRow, index: number) => {
                row.cells.forEach((cell: GridCell) => {
                    cell.row = index;
                });
            });

            // Update elements with new cell IDs
            const updatedTargetElements = [...targetLayout.elements];
            movedElements.forEach(element => {
                const oldCell = movedRow.cells.find((cell: GridCell) => cell.id === element.cellId);
                if (oldCell) {
                    const newCell = newRow.cells[oldCell.column];
                    updatedTargetElements.push({
                        ...element,
                        cellId: newCell.id,
                    });
                }
            });

            const sourceSlide = get().getLayoutSlide(prevState.source.tableId);
            const targetSlide = get().getLayoutSlide(prevState.target.tableId);

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
    },

    updatePrevStateRef: () => {
        const elementIndicator = document
            .querySelector('[data-element-indicator="true"]')
            ?.getAttribute('data-element-id');
        const layoutIndicator = document
            .querySelector('[data-layout-indicator="true"]')
            ?.getAttribute('data-layout-id');
        const slideIndicator = document
            .querySelector('[data-slide-id].active-slide-drop-target')
            ?.getAttribute('data-slide-id');
        const cellIndicator = document.querySelector('[data-cell-indicator="true"]')?.getAttribute('data-cell-id');

        // Определяем позицию индикатора по классам или атрибутам
        let elementPosition = null;
        let layoutPosition = null;
        let slidePosition = null;
        let cellPosition = null;

        // Определяем позиции на основе классов индикаторов
        if (elementIndicator) {
            const elementNode = document.querySelector(`[data-element-id="${elementIndicator}"]`);
            elementPosition = elementNode?.getAttribute('data-indicator-position') || null;
        }

        if (slideIndicator) {
            const slideRect = document.querySelector(`[data-slide-id="${slideIndicator}"]`)?.getBoundingClientRect();
            if (slideRect) {
                const mouseY = get().state.lastMousePosition?.y || 0;
                slidePosition = mouseY < slideRect.top + slideRect.height / 2 ? 'top' : 'bottom';
            }
        }

        if (layoutIndicator) {
            const layoutNode = document.querySelector(`[data-layout-id="${layoutIndicator}"]`);
            layoutPosition = layoutNode?.getAttribute('data-indicator-position') || null;
        }

        if (cellIndicator) {
            const cellNode = document.querySelector(`[data-cell-id="${cellIndicator}"]`);
            cellPosition = cellNode?.getAttribute('data-indicator-position') || null;
        }

        // Объединяем текущее состояние с новыми индикаторами
        const state = get().state;
        prevState = {
            ...state,
            indicators: {
                ...state.indicators,
                elementIndicator: elementIndicator || state.indicators.elementIndicator,
                elementPosition: (elementPosition as Position) || state.indicators.elementPosition,
                layoutIndicator: layoutIndicator || state.indicators.layoutIndicator,
                layoutPosition: (layoutPosition as Position) || state.indicators.layoutPosition,
                slideIndicator: slideIndicator || state.indicators.slideIndicator,
                slidePosition: (slidePosition as Position) || state.indicators.slidePosition,
                cellIndicator: cellIndicator || state.indicators.cellIndicator,
                cellPosition: (cellPosition as Position) || state.indicators.cellPosition,
            },
        };
    },

    resetAllIndicators: () => {
        set(state => ({
            ...state,
            indicators: getUpdatedIndicators({}),
            target: {
                elementId: null,
                layoutId: null,
                cellId: null,
                position: null,
            },
        }));
    },

    handleDragTarget: (
        e: React.DragEvent,
        nodes: {
            elementNode?: HTMLElement | null;
            cellNode?: HTMLElement | null;
            layoutNode?: HTMLElement | null;
            slideNode?: HTMLElement | null;
        }
    ) => {
        const { slideNode, layoutNode, cellNode, elementNode } = nodes;
        const state = get().state;

        // Early return if we're dragging a smartLayout item and target is not in the same smartLayout
        if (state.source.dragElementType === 'smart-layout-item') {
            const targetSmartLayoutElement = elementNode?.closest('[data-smart-layout-item-id]');
            if (!targetSmartLayoutElement) {
                // Not over a smartLayout item, clear indicators
                get().resetAllIndicators();
                return;
            }

            const targetElementId = layoutNode?.getAttribute('data-element-id');
            const targetLayoutId = layoutNode?.getAttribute('data-layout-id');

            // Only allow drops within the same smartLayout
            if (targetElementId !== state.source.elementId || targetLayoutId !== state.source.layoutId) {
                get().resetAllIndicators();
                return;
            }
        }

        const layoutId = layoutNode?.getAttribute('data-layout-id');

        // Handle slide dragging
        if (state.source.slideId && slideNode) {
            if (state.source.slideId === slideNode.getAttribute('data-slide-id')) {
                console.log('return slidenode');
                return;
            }

            const targetSlideId = slideNode.getAttribute('data-slide-id');
            const slideRect = slideNode.getBoundingClientRect();
            const position = (e.clientY < slideRect.top + slideRect.height / 2 ? 'top' : 'bottom') as Position;

            const updatedIndicators = getUpdatedIndicators({
                slideIndicator: targetSlideId,
                slidePosition: position,
            });

            const updatedDropTarget = {
                elementId: null,
                layoutId: null,
                cellId: null,
                slideId: targetSlideId,
                position,
            };

            set(state => ({
                ...state,
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedDropTarget,
                },
            }));

            return;
        }

        // Если мы перетаскиваем не слайд, но находимся над слайдом - нам нужно найти элементы внутри слайда
        // Если нет layoutId, но есть слайд, проверим, есть ли элементы внутри слайда
        if (!layoutId && slideNode && !state.source.slideId) {
            // Возможно мы только начали наводить на слайд, поищем элементы внутри него
            const layoutsInSlide = slideNode.querySelectorAll('[data-layout-id]');
            if (layoutsInSlide.length > 0) {
                const handleFindedLayout = (layout: Element, foundLayoutId: string) => {
                    const foundLayoutNode = layout as HTMLElement;

                    // Получаем информацию о макете и продолжаем с новыми переменными
                    const targetLayout = foundLayoutId ? get().getLayout(foundLayoutId) : undefined;
                    if (!targetLayout) {
                        // console.log('[DragDropContext] dragover – no targetLayout found for id', foundLayoutId);
                        return;
                    }

                    // Determine context of the drag for special handling
                    const isSingleCellSingleElement = targetLayout.elements.length === 1;
                    const isMultiCellRow = targetLayout?.gridStructure.rows[0].cells.length > 1;
                    const isTargetTable = !!targetLayout?.isTable;

                    if (
                        (state.source.dragElementType === 'table-row' ||
                            state.source.dragElementType === 'table-column') &&
                        !isTargetTable
                    ) {
                        console.log('return');
                        return;
                    }

                    // Special case handling for table
                    if (isTargetTable) {
                        // Only check for table exclusion if we're trying to drop inside a cell
                        if (cellNode) {
                            let isExcluded = false;

                            if (state.newElement.id && state.newElement.elementTypeId) {
                                // Check for new elements being dragged from menu
                                isExcluded = isElementExcludedFromTable(
                                    state.newElement.elementTypeId,
                                    state.newElement.elementVariant
                                );
                            } else if (state.source.layoutId && state.source.elementId) {
                                // Check for existing elements being dragged from elsewhere
                                const sourceLayout = get().getLayout(state.source.layoutId);
                                const sourceElement = sourceLayout?.elements.find(e => e.id === state.source.elementId);
                                if (sourceElement?.elementTypeId) {
                                    isExcluded = isElementExcludedFromTable(
                                        sourceElement.elementTypeId,
                                        sourceElement.elementVariant
                                    );
                                }
                            }

                            if (isExcluded) {
                                // Reset only element and cell indicators, allowing layout-level drops
                                const updatedIndicators = getUpdatedIndicators({
                                    elementIndicator: null,
                                    elementPosition: null,
                                    cellIndicator: null,
                                    cellPosition: null,
                                });

                                set(state => ({
                                    ...state,
                                    state: {
                                        ...state.state,
                                        indicators: updatedIndicators,
                                    },
                                }));
                                return;
                            }
                        }

                        get().processTableTarget(e, foundLayoutId, cellNode as HTMLElement);
                    }

                    // Use the helper function to calculate drop position with our new node
                    const dropPosition = calculateDropPosition(
                        e,
                        { elementNode, cellNode, layoutNode: foundLayoutNode, slideNode },
                        { isSingleCellSingleElement, isMultiCellRow },
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        cellNode ? findClosestElementsInCellLocal : undefined
                    );

                    // Apply the calculated position by updating appropriate indicators using the new values
                    // ... обработка dropPosition аналогично уже существующему коду
                    if (dropPosition.targetType === 'element' && dropPosition.targetId) {
                        // Set element indicator and clear others
                        const updatedIndicators = getUpdatedIndicators({
                            elementIndicator: dropPosition.targetId,
                            elementPosition: dropPosition.position,
                        });

                        const updatedDropTarget = {
                            elementId: dropPosition.targetId,
                            layoutId: foundLayoutId,
                            cellId: elementNode?.closest('[data-cell-id]')?.getAttribute('data-cell-id') || null,
                            position: dropPosition.position,
                        };

                        set(state => ({
                            ...state,
                            state: {
                                ...state.state,
                                indicators: updatedIndicators,
                                target: updatedDropTarget,
                            },
                        }));
                    } else if (dropPosition.targetType === 'cell' && dropPosition.targetId) {
                        // Set cell indicator and clear others
                        const updatedIndicators = getUpdatedIndicators({
                            cellIndicator: dropPosition.targetId,
                            cellPosition: dropPosition.position,
                        });

                        const updatedDropTarget = {
                            elementId: null,
                            layoutId: foundLayoutId,
                            cellId: dropPosition.targetId,
                            position: dropPosition.position,
                        };

                        set(state => ({
                            ...state,
                            state: {
                                ...state.state,
                                indicators: updatedIndicators,
                                target: updatedDropTarget,
                            },
                        }));
                    } else if (dropPosition.targetType === 'layout' && dropPosition.targetId) {
                        const updatedIndicators = getUpdatedIndicators({
                            layoutIndicator: dropPosition.targetId,
                            layoutPosition: dropPosition.position,
                        });

                        const updatedDropTarget = {
                            elementId: null,
                            layoutId: dropPosition.targetId,
                            cellId: null,
                            position: dropPosition.position,
                        };

                        // Update drop target state
                        set(state => ({
                            ...state,
                            state: {
                                ...state.state,
                                indicators: updatedIndicators,
                                target: updatedDropTarget,
                            },
                        }));
                    } else if (dropPosition.targetType === 'slide' && dropPosition.targetId) {
                        // Set slide indicator and clear others
                        const updatedIndicators = getUpdatedIndicators({
                            slideIndicator: dropPosition.targetId,
                            slidePosition: dropPosition.position,
                        });

                        const updatedDropTarget = {
                            elementId: null,
                            layoutId: null,
                            cellId: null,
                            slideId: dropPosition.targetId,
                            position: dropPosition.position,
                        };

                        set(state => ({
                            ...state,
                            state: {
                                ...state.state,
                                indicators: updatedIndicators,
                                target: updatedDropTarget,
                            },
                        }));
                    } else {
                        // Not over a valid target or in empty space
                        // console.log('[DragDropContext] dragover – no valid target');
                        get().resetAllIndicators();
                    }

                    get().updatePrevStateRef();
                    return; // После обработки выходим из функции
                };

                let isFound = false;

                // Проверим каждый макет, может быть мы находимся над ним
                for (const layout of Array.from(layoutsInSlide)) {
                    const layoutRect = layout.getBoundingClientRect();
                    // Если мышь находится над макетом
                    if (
                        e.clientX >= layoutRect.left &&
                        e.clientX <= layoutRect.right &&
                        e.clientY >= layoutRect.top &&
                        e.clientY <= layoutRect.bottom
                    ) {
                        // Используем этот макет, но не изменяем константы
                        const foundLayoutId = layout.getAttribute('data-layout-id');
                        if (foundLayoutId) {
                            handleFindedLayout(layout, foundLayoutId);
                            // Используем узлы с новыми именами
                            isFound = true;
                        }
                    }

                    if (!isFound) {
                        // Find the closest layout to mouse position
                        let closestLayout: Element | null = null;
                        let minDistance = Infinity;

                        for (const layout of Array.from(layoutsInSlide)) {
                            const layoutRect = layout.getBoundingClientRect();
                            const layoutCenter = {
                                x: layoutRect.left + layoutRect.width / 2,
                                y: layoutRect.top + layoutRect.height / 2,
                            };

                            // Calculate Euclidean distance from mouse to layout center
                            const distance = Math.sqrt(
                                Math.pow(e.clientX - layoutCenter.x, 2) + Math.pow(e.clientY - layoutCenter.y, 2)
                            );

                            if (distance < minDistance) {
                                minDistance = distance;
                                closestLayout = layout;
                            }
                        }

                        if (closestLayout) {
                            handleFindedLayout(closestLayout, closestLayout.getAttribute('data-layout-id') as string);
                        }
                    }
                }
            }
        }

        const targetLayout = layoutId ? get().getLayout(layoutId) : undefined;
        if (!targetLayout) {
            return;
        }

        const isSingleCellSingleElement = targetLayout.elements.length === 1;
        const isMultiCellRow = targetLayout?.gridStructure.rows[0].cells.length > 1;
        const isTargetTable = !!targetLayout?.isTable;
        const isSourceTable = state.source.dragElementType === 'table';

        if (
            (state.source.dragElementType === 'table-row' || state.source.dragElementType === 'table-column') &&
            !isTargetTable
        ) {
            console.log('return');
            return;
        }

        if (isTargetTable && !isSourceTable) {
            // Only check for table exclusion if we're trying to drop inside a cell
            if (cellNode) {
                let isExcluded = false;

                if (state.newElement.id && state.newElement.elementTypeId) {
                    // Check for new elements being dragged from menu
                    isExcluded = isElementExcludedFromTable(
                        state.newElement.elementTypeId,
                        state.newElement.elementVariant
                    );
                } else if (state.source.layoutId && state.source.elementId) {
                    // Check for existing elements being dragged from elsewhere
                    const sourceLayout = get().getLayout(state.source.layoutId);
                    const sourceElement = sourceLayout?.elements.find(e => e.id === state.source.elementId);
                    if (sourceElement?.elementTypeId) {
                        isExcluded = isElementExcludedFromTable(
                            sourceElement.elementTypeId,
                            sourceElement.elementVariant
                        );
                    }
                }

                if (isExcluded) {
                    // Reset only element and cell indicators, allowing layout-level drops
                    const updatedIndicators = getUpdatedIndicators({
                        elementIndicator: null,
                        elementPosition: null,
                        cellIndicator: null,
                        cellPosition: null,
                    });

                    set(state => ({
                        ...state,
                        state: {
                            ...state.state,
                            indicators: updatedIndicators,
                        },
                    }));
                    return;
                }
            }

            get().processTableTarget(e, layoutId!, cellNode as HTMLElement);
            return;
        }

        if (isSourceTable) {
            // When dragging a table, we only want to show layout-level indicators
            const layoutRect = layoutNode?.getBoundingClientRect();
            if (!layoutRect) return;

            // Calculate position relative to layout center
            const position = e.clientY < layoutRect.top + layoutRect.height / 2 ? 'top' : 'bottom';

            const updatedIndicators = getUpdatedIndicators({
                layoutIndicator: layoutId,
                layoutPosition: position,
                // Clear all other indicators
                elementIndicator: null,
                elementPosition: null,
                cellIndicator: null,
                cellPosition: null,
            });

            const updatedDropTarget = {
                elementId: null,
                layoutId,
                cellId: null,
                position: position as Position,
            };

            set(state => ({
                ...state,
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedDropTarget,
                },
            }));

            get().updatePrevStateRef();
            return;
        }

        const findClosestElementsInCellLocal = (cellNode: HTMLElement, mouseX: number, mouseY: number) =>
            findClosestElementsInCell(get().state, cellNode, mouseX, mouseY);

        // Use the helper function to calculate drop position
        const dropPosition = calculateDropPosition(
            e,
            { elementNode, cellNode, layoutNode, slideNode },
            { isSingleCellSingleElement, isMultiCellRow },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            cellNode ? findClosestElementsInCellLocal : undefined
        );

        // TODO: если перетаскивается новый элемент, и isTargetTable === true, то нужно учитывать ограничение на добавление в таблицу из menuRegistry (excludeFromTable)
        // Apply the calculated position by updating appropriate indicators
        if (dropPosition.targetType === 'element' && dropPosition.targetId) {
            // Set element indicator and clear others
            const updatedIndicators = getUpdatedIndicators({
                elementIndicator: dropPosition.targetId,
                elementPosition: dropPosition.position,
            });
            // Update drop target state
            const updatedDropTarget = {
                elementId: dropPosition.targetId,
                layoutId,
                cellId: elementNode?.closest('[data-cell-id]')?.getAttribute('data-cell-id') || null,
                position: dropPosition.position,
            };

            set(state => ({
                ...state,
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedDropTarget,
                },
            }));
        } else if (dropPosition.targetType === 'cell' && dropPosition.targetId) {
            // Set cell indicator and clear others
            const updatedIndicators = getUpdatedIndicators({
                cellIndicator: dropPosition.targetId,
                cellPosition: dropPosition.position,
            });

            // Update drop target state
            const updatedDropTarget = {
                elementId: null,
                layoutId,
                cellId: dropPosition.targetId,
                position: dropPosition.position,
            };

            set(state => ({
                ...state,
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedDropTarget,
                },
            }));
        } else if (dropPosition.targetType === 'layout' && dropPosition.targetId) {
            const updatedIndicators = getUpdatedIndicators({
                layoutIndicator: dropPosition.targetId,
                layoutPosition: dropPosition.position,
            });

            // Update drop target state
            const updatedDropTarget = {
                elementId: null,
                layoutId: dropPosition.targetId,
                cellId: null,
                position: dropPosition.position,
            };

            set(state => ({
                ...state,
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedDropTarget,
                },
            }));
        } else if (dropPosition.targetType === 'slide' && dropPosition.targetId) {
            // Set slide indicator and clear others
            const updatedIndicators = getUpdatedIndicators({
                slideIndicator: dropPosition.targetId,
                slidePosition: dropPosition.position,
            });

            const updatedDropTarget = {
                elementId: null,
                layoutId: null,
                cellId: null,
                slideId: dropPosition.targetId,
                position: dropPosition.position,
            };

            set(state => ({
                ...state,
                state: {
                    ...state.state,
                    indicators: updatedIndicators,
                    target: updatedDropTarget,
                },
            }));
        } else {
            // Not over a valid target or in empty space
            // console.log('[DragDropContext] dragover – no valid target');
            get().resetAllIndicators();
        }
    },

    handleDocumentDrop: (e: React.DragEvent) => {
        e.preventDefault();

        const state = get().state;

        if (state.dragState === 'dragging') {
            // Process drop based on indicators
            if (state.indicators.slideIndicator) {
                get().processSlideDrop();
            } else if (state.indicators.layoutIndicator && state.indicators.layoutPosition) {
                get().processLayoutDrop();
            } else if (state.indicators.cellIndicator && state.indicators.cellPosition && !state.indicators.tableId) {
                get().processCellDrop();
            } else if (state.indicators.elementIndicator && state.indicators.elementPosition) {
                get().processElementDrop();
            } else if (
                Number.isInteger(state.indicators.tableColumnIndicator as number) &&
                state.indicators.tableColumnPosition
            ) {
                get().processTableColumnDrop();
            } else if (Number.isInteger(state.source.rowIndex as number)) {
                get().processTableRowDrop();
            }

            // Complete the drop operation
            get().completeDrop();
        }
    },
}));

// Helper functions that could be moved here from the original context

const isElementExcludedFromTable = (elementTypeId: string, elementVariant?: string | null): boolean => {
    // Find the menu item in the registry
    const findMenuItem = (items: MenuItem[]): MenuItem | undefined => {
        return items.find(
            item => item.elementTypeId === elementTypeId && (!elementVariant || item.elementVariant === elementVariant)
        );
    };

    // Search through all categories and subcategories
    for (const category of menuRegistry) {
        // Check if category is excluded
        if (category.excludeFromTable) {
            if (category.elements) {
                const found = findMenuItem(category.elements);
                if (found) return true;
            }
        }

        // Check subcategories
        if (category.subCategories) {
            for (const subCategory of category.subCategories) {
                if (subCategory.excludeFromTable) {
                    const found = findMenuItem(subCategory.elements);
                    if (found) return true;
                }
            }
        }
    }

    return false;
};
