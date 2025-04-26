import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usePresentationStore } from './presentationStore';
import { BaseElement, GridCell, IPresentation, Layout, LayoutType, Slide } from '@/types';
import { ComponentStructureType } from '@/elements/registry';
import { MutableRefObject } from 'react';
import { TipTapRefs } from '@/types';

// Define menu element types
export type MenuElementType = 'element' | 'cell' | 'layout' | 'slide' | 'editor' | 'row' | 'table' | 'column';

export interface MenuState {
    // Table hover state
    hoveredRow: string | null;
    hoveredColumn: string | null;
    hoveredRowIndex: number | null;
    hoveredColumnIndex: number | null;
    hoveredTableId: string | null;
    selectedRowIndex: number | null;
    selectedColumnIndex: number | null;
    selectedTableId: string | null;
    selectedSmartLayoutItemId: string | null;
    smartLayoutItemId: string | null;

    presentationId: string | null;

    // Slide menu state
    isOpen: boolean;
    slideId: string | null;
    elementId: string | null;
    elementType: MenuElementType | null;
    layoutId: string | null;
    columnId: string | null;
    cellId: string | null;
    isTextEditor: boolean;
    componentStructure: ComponentStructureType | null;
    tableRowIndex: number | null;
    tableColumnIndex: number | null;
    tableId: string | null;

    focusedLayoutId: string | null;

    setPresentationId: (presentationId: string) => void;

    setSelectedSmartLayoutItemId: (layoutId: string, elementId: string, smartLayoutItemId: string) => void;
    // Table hover actions
    setSelectedRowIndex: (tableId: string, rowIndex: number | null) => void;
    setSelectedColumnIndex: (tableId: string, columnIndex: number | null) => void;

    // Menu control actions
    openMenu: (menuData: {
        slideId?: string | null;
        elementId?: string | null;
        elementType?: MenuElementType | null;
        layoutId?: string | null;
        columnId?: string | null;
        cellId?: string | null;
        isTextEditor?: boolean;
        componentStructure?: ComponentStructureType | null;
        tableRowIndex?: number | null;
        tableColumnIndex?: number | null;
        tableId?: string | null;
        smartLayoutItemId?: string | null;
    }) => void;
    closeMenu: () => void;
    checkSlideMenuIsOpen: (slideId: string | null) => boolean;

    // Slide actions
    duplicateSlide: () => void;
    deleteSlide: () => void;
    mergeSlideWithPrevious: () => void;

    // Layout actions
    deleteLayout: () => void;
    updateAlignLayout: (align: 'top' | 'center' | 'bottom') => void;
    changeTemplate: (template: LayoutType) => void;

    // Element actions
    duplicateElement: () => void;
    deleteElement: () => void;
    editElement: () => void;

    // Column actions
    addColumnLeft: (columnIndex: number) => void;
    addColumnRight: (columnIndex: number) => void;
    duplicateColumn: () => void;
    alignColumnTop: () => void;
    alignColumnCenter: () => void;
    alignColumnBottom: () => void;
    deleteColumn: () => void;
    // Getter methods
    getElement: (
        slideId: string | null,
        layoutId: string | null,
        elementId: string | null
    ) => BaseElement | null | undefined;
    getCell: (slideId: string | null, layoutId: string | null, columnId: string | null) => GridCell | null | undefined;
    getLayout: (slideId: string | null, layoutId: string | null) => Layout | null | undefined;
    getSlide: (slideId: string | null) => Slide | null | undefined;
    getPresentation: (presentationId: string) => IPresentation | null | undefined;

    // Add a combined action to batch updates
    hoverTableCell: (tableId: string, rowIndex: number | null, columnIndex: number | null) => void;

    getTableElements: () => BaseElement[];
    getTableColumnElements: () => BaseElement[];
    getTableRowElements: () => BaseElement[];
    getTableFirstElement: () => BaseElement | null;

    getCommonAlignment: () => string;
    addRowToTable: (tableRowIndex: number) => void;
    deleteRowFromTable: (tableRowIndex: number) => void;

    addColumnToTable: (tableColumnIndex: number) => void;
    deleteColumnFromTable: (tableColumnIndex: number) => void;

    setFocusedLayoutId: (layoutId: string) => void;
    resetFocusedLayoutId: () => void;

    getCommonHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
    getCommonTableHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
    getCommonRowHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
    getCommonColumnHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;

    deleteCell: () => void;

    equalizeTable: () => void;
}

export const useMenuStore = create<MenuState>()(
    devtools(
        (set, get) => ({
            // Initial table hover state
            hoveredRow: null,
            hoveredColumn: null,
            hoveredRowIndex: null,
            hoveredColumnIndex: null,
            hoveredTableId: null,
            selectedRowIndex: null,
            selectedColumnIndex: null,
            selectedTableId: null,
            selectedSmartLayoutItemId: null,

            // Initial slide menu state
            isOpen: false,
            slideId: null,
            elementId: null,
            elementType: null,
            layoutId: null,
            columnId: null,
            isTextEditor: false,
            componentStructure: null,
            tableRowIndex: null,
            tableColumnIndex: null,
            tableId: null,
            smartLayoutItemId: null,

            focusedLayoutId: null,

            setPresentationId: (presentationId: string) => set({ presentationId }),

            setSelectedSmartLayoutItemId: (layoutId: string, elementId: string, smartLayoutItemId: string) =>
                set({ selectedSmartLayoutItemId: smartLayoutItemId, focusedLayoutId: layoutId, elementId }),

            // Table hover actions
            setSelectedRowIndex: (tableId: string, rowIndex: number | null) => {
                const { selectedTableId } = get();
                if (selectedTableId !== tableId) {
                    set({ selectedRowIndex: rowIndex, selectedTableId: tableId });
                } else {
                    set({ selectedRowIndex: rowIndex });
                }
            },
            setSelectedColumnIndex: (tableId: string, columnIndex: number | null) => {
                const { selectedTableId } = get();
                if (selectedTableId !== tableId) {
                    set({ selectedColumnIndex: columnIndex, selectedTableId: tableId });
                } else {
                    set({ selectedColumnIndex: columnIndex });
                }
            },

            // Menu control actions
            openMenu: menuData => {
                console.log('openMenu', {
                    isOpen: true,
                    slideId: menuData.slideId ?? null,
                    elementId: menuData.elementId ?? null,
                    elementType: menuData.elementType ?? null,
                    layoutId: menuData.layoutId ?? null,
                    columnId: menuData.columnId ?? null,
                    cellId: menuData.cellId ?? null,
                    isTextEditor: menuData.isTextEditor ?? false,
                    componentStructure: menuData.componentStructure ?? null,
                    tableRowIndex: menuData.tableRowIndex ?? null,
                    tableColumnIndex: menuData.tableColumnIndex ?? null,
                    tableId: menuData.tableId ?? null,
                    smartLayoutItemId: menuData.smartLayoutItemId ?? null,
                });
                set({
                    isOpen: true,
                    slideId: menuData.slideId ?? null,
                    elementId: menuData.elementId ?? null,
                    elementType: menuData.elementType ?? null,
                    layoutId: menuData.layoutId ?? null,
                    columnId: menuData.columnId ?? null,
                    cellId: menuData.cellId ?? null,
                    isTextEditor: menuData.isTextEditor ?? false,
                    componentStructure: menuData.componentStructure ?? null,
                    tableRowIndex: menuData.tableRowIndex ?? null,
                    tableColumnIndex: menuData.tableColumnIndex ?? null,
                    tableId: menuData.tableId ?? null,
                    smartLayoutItemId: menuData.smartLayoutItemId ?? null,
                });
            },

            closeMenu: () => {
                console.log('closeMenu');
                set({
                    isOpen: false,
                    slideId: null,
                    elementId: null,
                    elementType: null,
                    layoutId: null,
                    columnId: null,
                    isTextEditor: false,
                    componentStructure: null,
                    tableRowIndex: null,
                    tableColumnIndex: null,
                    tableId: null,
                    cellId: null,
                    smartLayoutItemId: null,
                });
            },

            checkSlideMenuIsOpen: slideId => {
                const state = get();
                return (
                    state.slideId === slideId &&
                    state.elementId === null &&
                    state.layoutId === null &&
                    state.smartLayoutItemId === null
                );
            },

            // Slide actions
            duplicateSlide: () => {
                const { slideId, presentationId } = get();
                if (slideId && presentationId) {
                    const { duplicateSlide } = usePresentationStore.getState();
                    duplicateSlide(presentationId, slideId);
                    get().closeMenu();
                }
            },

            deleteSlide: () => {
                const { slideId, presentationId } = get();
                if (slideId && presentationId) {
                    const { deleteSlide } = usePresentationStore.getState();
                    deleteSlide(presentationId, slideId);
                    get().closeMenu();
                }
            },

            mergeSlideWithPrevious: () => {
                const { slideId, presentationId } = get();
                if (slideId && presentationId) {
                    const { mergeSlideWithPrevious } = usePresentationStore.getState();
                    mergeSlideWithPrevious(presentationId, slideId);
                    get().closeMenu();
                }
            },

            // Layout actions
            deleteLayout: () => {
                const { presentationId, slideId, layoutId } = get();
                if (slideId && layoutId && presentationId) {
                    const { deleteLayout } = usePresentationStore.getState();
                    deleteLayout(presentationId, slideId, layoutId);
                    get().closeMenu();
                }
            },

            updateAlignLayout: align => {
                const { updateAlignLayout: updateAlignLayoutInStore } = usePresentationStore.getState();
                const { presentationId, slideId, layoutId } = get();
                if (presentationId && slideId && layoutId) {
                    updateAlignLayoutInStore(presentationId, slideId, layoutId, align);
                }
            },

            changeTemplate: template => {
                const { presentationId, slideId, layoutId } = get();
                if (slideId && layoutId && presentationId) {
                    const { changeTemplate: changeTemplateInStore } = usePresentationStore.getState();
                    changeTemplateInStore(presentationId, slideId, layoutId, template);
                }
            },

            // Element actions
            duplicateElement: () => {
                const { presentationId, slideId, elementId } = get();
                if (slideId && elementId && presentationId) {
                    const { duplicateElement } = usePresentationStore.getState();
                    duplicateElement(presentationId, slideId, elementId);
                    get().closeMenu();
                }
            },

            deleteElement: () => {
                const { slideId, elementId, presentationId } = get();
                if (slideId && elementId && presentationId) {
                    const { findLayoutByElementId, deleteElement } = usePresentationStore.getState();
                    const layout = findLayoutByElementId(elementId);
                    if (layout) {
                        deleteElement(presentationId, slideId, layout.id, elementId);
                        get().closeMenu();
                    }
                }
            },

            editElement: () => {
                get().closeMenu();
            },

            // Column actions
            addColumnLeft: () => {
                const { presentationId, slideId, layoutId, tableColumnIndex } = get();
                if (presentationId && slideId && layoutId && Number.isInteger(tableColumnIndex)) {
                    const { addColumnLeft: addColumnLeftInStore } = usePresentationStore.getState();
                    addColumnLeftInStore(presentationId, slideId, layoutId, tableColumnIndex!);
                    get().closeMenu();
                }
            },

            addColumnRight: () => {
                const { presentationId, slideId, layoutId, tableColumnIndex } = get();
                if (presentationId && slideId && layoutId && Number.isInteger(tableColumnIndex)) {
                    const { addColumnRight: addColumnRightInStore } = usePresentationStore.getState();
                    addColumnRightInStore(presentationId, slideId, layoutId, tableColumnIndex!);
                    get().closeMenu();
                }
            },

            duplicateColumn: () => {
                const { presentationId, slideId, layoutId, columnId } = get();
                if (presentationId && slideId && layoutId && columnId) {
                    const { duplicateColumn: duplicateColumnInStore } = usePresentationStore.getState();
                    duplicateColumnInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            alignColumnTop: () => {
                const { presentationId, slideId, layoutId, columnId } = get();
                if (presentationId && slideId && layoutId && columnId) {
                    const { alignColumnTop: alignColumnTopInStore } = usePresentationStore.getState();
                    alignColumnTopInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            alignColumnCenter: () => {
                const { presentationId, slideId, layoutId, columnId } = get();
                if (presentationId && slideId && layoutId && columnId) {
                    const { alignColumnCenter: alignColumnCenterInStore } = usePresentationStore.getState();
                    alignColumnCenterInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            alignColumnBottom: () => {
                const { presentationId, slideId, layoutId, columnId } = get();
                if (presentationId && slideId && layoutId && columnId) {
                    const { alignColumnBottom: alignColumnBottomInStore } = usePresentationStore.getState();
                    alignColumnBottomInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            deleteCell: () => {
                const { presentationId, slideId, layoutId, cellId } = get();
                if (presentationId && slideId && layoutId && cellId) {
                    const { deleteCell: deleteCellInStore } = usePresentationStore.getState();
                    deleteCellInStore(presentationId, slideId, layoutId, cellId);
                    get().closeMenu();
                }
            },

            deleteColumn: () => {
                const { presentationId, slideId, layoutId, columnId } = get();
                if (presentationId && slideId && layoutId && columnId) {
                    const { deleteColumn: deleteColumnInStore } = usePresentationStore.getState();
                    deleteColumnInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            setFocusedLayoutId: (layoutId: string) => {
                set({ focusedLayoutId: layoutId, elementId: null, selectedSmartLayoutItemId: null });
            },

            resetFocusedLayoutId: () => {
                set({ focusedLayoutId: null });
            },

            // Getter methods
            getElement: (slideId, layoutId, elementId) => {
                const { presentationId } = get();
                if (!slideId || !layoutId || !elementId || !presentationId) return null;
                const { getElement } = usePresentationStore.getState();
                return getElement(presentationId, slideId, layoutId, elementId);
            },

            getCell: (slideId, layoutId, cellId) => {
                const { presentationId } = get();
                if (!slideId || !layoutId || !cellId || !presentationId) return null;
                const { getCell } = usePresentationStore.getState();
                return getCell(presentationId, slideId, layoutId, cellId);
            },

            getLayout: (slideId, layoutId) => {
                const { presentationId } = get();
                if (!slideId || !layoutId || !presentationId) return null;
                const { getLayout } = usePresentationStore.getState();
                return getLayout(presentationId, slideId, layoutId);
            },

            getSlide: slideId => {
                const { presentationId } = get();
                if (!slideId || !presentationId) return null;
                const { getSlide } = usePresentationStore.getState();
                return getSlide(presentationId, slideId);
            },

            getPresentation: presentationId => {
                const { getPresentation } = usePresentationStore.getState();
                return getPresentation(presentationId);
            },

            // Add a combined action to batch updates
            hoverTableCell: (tableId: string, rowIndex: number | null, columnIndex: number | null) =>
                set(state => {
                    if (
                        state.hoveredRowIndex === rowIndex &&
                        state.hoveredColumnIndex === columnIndex &&
                        state.hoveredTableId === tableId
                    ) {
                        return state; // No change needed
                    }
                    return {
                        hoveredRowIndex: rowIndex,
                        hoveredColumnIndex: columnIndex,
                        hoveredTableId: tableId,
                    };
                }),

            getTableElements: () => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { getTableElements } = usePresentationStore.getState();
                return getTableElements(presentationId, slideId, layoutId);
            },

            getTableColumnElements: () => {
                const { presentationId, slideId, layoutId, tableColumnIndex } = get();
                if (!presentationId || !slideId || !layoutId || !Number.isInteger(tableColumnIndex)) return [];
                const { getTableColumnElements } = usePresentationStore.getState();
                return getTableColumnElements(presentationId, slideId, layoutId, tableColumnIndex!);
            },

            getTableRowElements: () => {
                const { presentationId, slideId, layoutId, tableRowIndex } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { getTableRowElements } = usePresentationStore.getState();
                return getTableRowElements(presentationId, slideId, layoutId, tableRowIndex!);
            },

            getTableFirstElement: () => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return null;
                const { getTableFirstElement } = usePresentationStore.getState();
                return getTableFirstElement(presentationId, slideId, layoutId);
            },

            getCommonAlignment: () => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { getCommonAlignment } = usePresentationStore.getState();
                return getCommonAlignment(presentationId, slideId, layoutId);
            },

            getCommonTableHeadingLevel: tiptapRefs => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { getCommonTableHeadingLevel } = usePresentationStore.getState();
                return getCommonTableHeadingLevel(tiptapRefs, presentationId, slideId, layoutId);
            },
            getCommonRowHeadingLevel: tiptapRefs => {
                const { presentationId, slideId, layoutId, tableRowIndex } = get();
                if (!presentationId || !slideId || !layoutId || !Number.isInteger(tableRowIndex)) return [];
                const { getCommonRowHeadingLevel } = usePresentationStore.getState();
                return getCommonRowHeadingLevel(tiptapRefs, presentationId, slideId, layoutId, tableRowIndex!);
            },
            getCommonColumnHeadingLevel: tiptapRefs => {
                const { presentationId, slideId, layoutId, tableColumnIndex } = get();
                if (!presentationId || !slideId || !layoutId || !Number.isInteger(tableColumnIndex)) return [];
                const { getCommonColumnHeadingLevel } = usePresentationStore.getState();
                return getCommonColumnHeadingLevel(tiptapRefs, presentationId, slideId, layoutId, tableColumnIndex!);
            },
            addRowToTable: (tableRowIndex: number) => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId || !Number.isInteger(tableRowIndex)) return [];
                const { addRowToTable } = usePresentationStore.getState();
                addRowToTable(presentationId, slideId, layoutId, tableRowIndex!);
            },
            deleteRowFromTable: (tableRowIndex: number) => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { deleteRowFromTable } = usePresentationStore.getState();
                deleteRowFromTable(presentationId, slideId, layoutId, tableRowIndex);
            },
            addColumnToTable: (tableColumnIndex: number) => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { addColumnToTable } = usePresentationStore.getState();
                addColumnToTable(presentationId, slideId, layoutId, tableColumnIndex);
            },
            deleteColumnFromTable: (tableColumnIndex: number) => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { deleteColumnFromTable } = usePresentationStore.getState();
                deleteColumnFromTable(presentationId, slideId, layoutId, tableColumnIndex);
            },
            getCommonHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return null;
                const { getCommonHeadingLevel, getLayout } = usePresentationStore.getState();
                const layout = getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                const elements = layout.elements;
                return getCommonHeadingLevel(tiptapRefs, elements);
            },

            equalizeTable: () => {
                const { presentationId, slideId, layoutId } = get();
                if (!presentationId || !slideId || !layoutId) return [];
                const { equalizeTable } = usePresentationStore.getState();
                equalizeTable(presentationId, slideId, layoutId);
            },
        }),
        {
            name: 'menu-store',
            enabled: true,
        }
    )
);

// Create selector hooks to prevent unnecessary re-renders
export const useMenuIsOpen = () => useMenuStore(state => state.isOpen);
export const useMenuSelectedSlide = () => useMenuStore(state => state.slideId!);
export const useMenuSelectedElement = () => useMenuStore(state => state.elementId);
export const useMenuSelectedLayout = () => useMenuStore(state => state.layoutId);
export const useMenuSelectedColumn = () => useMenuStore(state => state.columnId);
export const useMenuSelectedCell = () => useMenuStore(state => state.cellId);

// Hook for checking if a specific slide has its menu open
export const useMenuCheckOpen = (slideId: string) =>
    useMenuStore(state => state.slideId === slideId && state.elementId === null && state.layoutId === null);
