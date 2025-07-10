import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usePresentationStore } from './presentationStore';
import { BaseElement, GridCell, IPresentation, Layout, LayoutType, Slide } from '@/types';
import { MutableRefObject } from 'react';
import { TipTapRefs } from '@/types';

// Define UI element types for context menus
export type UIElementType = 'element' | 'cell' | 'layout' | 'slide' | 'editor' | 'row' | 'table' | 'column' | 'chart';

export interface UIState {
    // Selection state - tracks what elements are currently selected/focused
    selectedSlideId: string | null;
    selectedElementId: string | null;
    selectedLayoutId: string | null;
    selectedCellId: string | null;
    selectedSmartLayoutItemId: string | null;
    focusedLayoutId: string | null;

    // Table selection state
    selectedTableId: string | null;
    selectedRowIndex: number | null;
    selectedColumnIndex: number | null;

    // Table hover state
    hoveredTableId: string | null;
    hoveredRowIndex: number | null;
    hoveredColumnIndex: number | null;

    // Context menu state
    isContextMenuOpen: boolean;
    contextMenuElementType: UIElementType | null;
    contextMenuTableRowIndex: number | null;
    contextMenuTableColumnIndex: number | null;
    contextMenuTableId: string | null;
    contextMenuColumnIndex: number | null;
    contextMenuSmartLayoutItemId: string | null;
    isContextMenuOnTextEditor: boolean;
    isContextMenuInTable: boolean;

    // Side menu state
    sideMenuState: {
        isOpen: boolean;
        sideMenuId: string | null;
        sideMenuData: any;
    };

    // Presentation context
    currentPresentationId: string | null;

    // Actions for presentation context
    setCurrentPresentationId: (presentationId: string) => void;

    // Actions for element selection
    setSelectedSmartLayoutItemId: (layoutId: string, elementId: string, smartLayoutItemId: string) => void;
    setSelectedRowIndex: (tableId: string, rowIndex: number | null) => void;
    setSelectedColumnIndex: (tableId: string, columnIndex: number | null) => void;
    setFocusedLayoutId: (layoutId: string) => void;
    resetFocusedLayoutId: () => void;

    // Actions for context menu control
    openContextMenu: (menuData: {
        slideId?: string | null;
        elementId?: string | null;
        elementType?: UIElementType | null;
        layoutId?: string | null;
        cellId?: string | null;
        isTextEditor?: boolean;
        isInTable?: boolean;
        tableRowIndex?: number | null;
        tableColumnIndex?: number | null;
        tableId?: string | null;
        smartLayoutItemId?: string | null;
        columnIndex?: number | null;
    }) => void;
    closeContextMenu: () => void;
    checkSlideContextMenuIsOpen: (slideId: string | null) => boolean;

    // Actions for side menu control
    openSideMenu: (sideMenuId: string, sideMenuData: any) => void;
    closeSideMenu: () => void;

    // Actions for table hover state
    hoverTableCell: (tableId: string, rowIndex: number | null, columnIndex: number | null) => void;

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
    deleteCell: () => void;

    // Table actions
    addRowToTable: (tableRowIndex: number) => void;
    deleteRowFromTable: (tableRowIndex: number) => void;
    addColumnToTable: (tableColumnIndex: number) => void;
    deleteColumnFromTable: (tableColumnIndex: number) => void;
    equalizeTable: () => void;

    // Getter methods for accessing presentation data
    getElement: (
        slideId: string | null,
        layoutId: string | null,
        elementId: string | null
    ) => BaseElement | null | undefined;
    getCell: (slideId: string | null, layoutId: string | null, cellId: string | null) => GridCell | null | undefined;
    getLayout: (slideId: string | null, layoutId: string | null) => Layout | null | undefined;
    getSlide: (slideId: string | null) => Slide | null | undefined;
    getPresentation: (presentationId: string) => IPresentation | null | undefined;

    // Getter methods for table data
    getTableElements: () => BaseElement[];
    getTableColumnElements: () => BaseElement[];
    getTableRowElements: () => BaseElement[];
    getTableFirstElement: () => BaseElement | null;

    // Getter methods for common properties
    getCommonAlignment: () => string;
    getCommonHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
    getCommonTableHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
    getCommonRowHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
    getCommonColumnHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => number | null;
}

export const useUIStateStore = create<UIState>()(
    devtools(
        (set, get) => ({
            // Initial selection state
            selectedSlideId: null,
            selectedElementId: null,
            selectedLayoutId: null,
            selectedCellId: null,
            selectedSmartLayoutItemId: null,
            focusedLayoutId: null,

            // Initial table selection state
            selectedTableId: null,
            selectedRowIndex: null,
            selectedColumnIndex: null,

            // Initial table hover state
            hoveredTableId: null,
            hoveredRowIndex: null,
            hoveredColumnIndex: null,

            // Initial context menu state
            isContextMenuOpen: false,
            contextMenuElementType: null,
            contextMenuTableRowIndex: null,
            contextMenuTableColumnIndex: null,
            contextMenuTableId: null,
            contextMenuColumnIndex: null,
            contextMenuSmartLayoutItemId: null,
            isContextMenuOnTextEditor: false,
            isContextMenuInTable: false,

            // Initial side menu state
            sideMenuState: {
                isOpen: false,
                sideMenuId: null,
                sideMenuData: null,
            },

            // Initial presentation context
            currentPresentationId: null,

            // Actions for presentation context
            setCurrentPresentationId: (presentationId: string) => set({ currentPresentationId: presentationId }),

            // Actions for element selection
            setSelectedSmartLayoutItemId: (layoutId: string, elementId: string, smartLayoutItemId: string) =>
                set({
                    selectedSmartLayoutItemId: smartLayoutItemId,
                    focusedLayoutId: layoutId,
                    selectedElementId: elementId,
                }),

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

            setFocusedLayoutId: (layoutId: string) => {
                set({ focusedLayoutId: layoutId, selectedElementId: null, selectedSmartLayoutItemId: null });
            },

            resetFocusedLayoutId: () => {
                set({ focusedLayoutId: null });
            },

            // Actions for context menu control
            openContextMenu: menuData => {
                const presentationState = usePresentationStore.getState();
                const currentPresentationId = get().currentPresentationId;
                const layout = presentationState.getLayout(
                    currentPresentationId!,
                    menuData.slideId!,
                    menuData.layoutId!
                );
                const isInTable = layout?.isTable;

                console.log('openContextMenu', {
                    isContextMenuOpen: true,
                    selectedSlideId: menuData.slideId ?? null,
                    selectedElementId: menuData.elementId ?? null,
                    contextMenuElementType: menuData.elementType ?? null,
                    selectedLayoutId: menuData.layoutId ?? null,
                    selectedCellId: menuData.cellId ?? null,
                    isContextMenuOnTextEditor: menuData.isTextEditor ?? false,
                    contextMenuTableRowIndex: menuData.tableRowIndex ?? null,
                    contextMenuTableColumnIndex: menuData.tableColumnIndex ?? null,
                    contextMenuTableId: menuData.tableId ?? null,
                    contextMenuSmartLayoutItemId: menuData.smartLayoutItemId ?? null,
                    isContextMenuInTable: isInTable ?? false,
                    contextMenuColumnIndex: menuData.columnIndex ?? null,
                    currentPresentationId: currentPresentationId ?? null,
                });

                set({
                    isContextMenuOpen: true,
                    selectedSlideId: menuData.slideId ?? null,
                    selectedElementId: menuData.elementId ?? null,
                    contextMenuElementType: menuData.elementType ?? null,
                    selectedLayoutId: menuData.layoutId ?? null,
                    selectedCellId: menuData.cellId ?? null,
                    isContextMenuOnTextEditor: menuData.isTextEditor ?? false,
                    contextMenuTableRowIndex: menuData.tableRowIndex ?? null,
                    contextMenuTableColumnIndex: menuData.tableColumnIndex ?? null,
                    contextMenuTableId: menuData.tableId ?? null,
                    contextMenuSmartLayoutItemId: menuData.smartLayoutItemId ?? null,
                    isContextMenuInTable: isInTable ?? false,
                    contextMenuColumnIndex: menuData.columnIndex ?? null,
                    currentPresentationId: currentPresentationId ?? null,
                });
            },

            closeContextMenu: () => {
                console.log('closeContextMenu');
                set({
                    isContextMenuOpen: false,
                    selectedSlideId: null,
                    selectedElementId: null,
                    contextMenuElementType: null,
                    selectedLayoutId: null,
                    isContextMenuOnTextEditor: false,
                    contextMenuTableRowIndex: null,
                    contextMenuTableColumnIndex: null,
                    contextMenuTableId: null,
                    selectedCellId: null,
                    contextMenuSmartLayoutItemId: null,
                    contextMenuColumnIndex: null,
                });
            },

            checkSlideContextMenuIsOpen: slideId => {
                const state = get();
                return (
                    state.selectedSlideId === slideId &&
                    state.selectedElementId === null &&
                    state.selectedLayoutId === null &&
                    state.selectedSmartLayoutItemId === null
                );
            },

            // Actions for side menu control
            openSideMenu: (sideMenuId: string, sideMenuData: any) => {
                console.log('openSideMenu', {
                    sideMenuId,
                    sideMenuData,
                });
                set({
                    sideMenuState: {
                        isOpen: true,
                        sideMenuId,
                        sideMenuData,
                    },
                });
            },

            closeSideMenu: () => {
                set({
                    sideMenuState: {
                        isOpen: false,
                        sideMenuId: null,
                        sideMenuData: null,
                    },
                });
            },

            // Actions for table hover state
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

            // Slide actions
            duplicateSlide: () => {
                const { selectedSlideId, currentPresentationId } = get();
                if (selectedSlideId && currentPresentationId) {
                    const { duplicateSlide } = usePresentationStore.getState();
                    duplicateSlide(currentPresentationId, selectedSlideId);
                    get().closeContextMenu();
                }
            },

            deleteSlide: () => {
                const { selectedSlideId, currentPresentationId } = get();
                if (selectedSlideId && currentPresentationId) {
                    const { deleteSlide } = usePresentationStore.getState();
                    deleteSlide(currentPresentationId, selectedSlideId);
                    get().closeContextMenu();
                }
            },

            mergeSlideWithPrevious: () => {
                const { selectedSlideId, currentPresentationId } = get();
                if (selectedSlideId && currentPresentationId) {
                    const { mergeSlideWithPrevious } = usePresentationStore.getState();
                    mergeSlideWithPrevious(currentPresentationId, selectedSlideId);
                    get().closeContextMenu();
                }
            },

            // Layout actions
            deleteLayout: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (selectedSlideId && selectedLayoutId && currentPresentationId) {
                    const { deleteLayout } = usePresentationStore.getState();
                    deleteLayout(currentPresentationId, selectedSlideId, selectedLayoutId);
                    get().closeContextMenu();
                }
            },

            updateAlignLayout: align => {
                const { updateAlignLayout: updateAlignLayoutInStore } = usePresentationStore.getState();
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId) {
                    updateAlignLayoutInStore(currentPresentationId, selectedSlideId, selectedLayoutId, align);
                }
            },

            changeTemplate: template => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (selectedSlideId && selectedLayoutId && currentPresentationId) {
                    const { changeTemplate: changeTemplateInStore } = usePresentationStore.getState();
                    changeTemplateInStore(currentPresentationId, selectedSlideId, selectedLayoutId, template);
                }
            },

            // Element actions
            duplicateElement: () => {
                const { currentPresentationId, selectedSlideId, selectedElementId } = get();
                if (selectedSlideId && selectedElementId && currentPresentationId) {
                    const { duplicateElement } = usePresentationStore.getState();
                    duplicateElement(currentPresentationId, selectedSlideId, selectedElementId);
                    get().closeContextMenu();
                }
            },

            deleteElement: () => {
                const { selectedSlideId, selectedElementId, currentPresentationId } = get();
                if (selectedSlideId && selectedElementId && currentPresentationId) {
                    const { findLayoutByElementId, deleteElement } = usePresentationStore.getState();
                    const layout = findLayoutByElementId(selectedElementId);
                    if (layout) {
                        deleteElement(currentPresentationId, selectedSlideId, layout.id, selectedElementId);
                        get().closeContextMenu();
                    }
                }
            },

            editElement: () => {
                get().closeContextMenu();
            },

            // Column actions
            addColumnLeft: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, contextMenuColumnIndex } = get();
                if (
                    currentPresentationId &&
                    selectedSlideId &&
                    selectedLayoutId &&
                    Number.isInteger(contextMenuColumnIndex)
                ) {
                    const { addColumnLeft: addColumnLeftInStore } = usePresentationStore.getState();
                    addColumnLeftInStore(
                        currentPresentationId,
                        selectedSlideId,
                        selectedLayoutId,
                        contextMenuColumnIndex!
                    );
                    get().closeContextMenu();
                }
            },

            addColumnRight: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, contextMenuColumnIndex } = get();
                if (
                    currentPresentationId &&
                    selectedSlideId &&
                    selectedLayoutId &&
                    Number.isInteger(contextMenuColumnIndex)
                ) {
                    const { addColumnRight: addColumnRightInStore } = usePresentationStore.getState();
                    addColumnRightInStore(
                        currentPresentationId,
                        selectedSlideId,
                        selectedLayoutId,
                        contextMenuColumnIndex!
                    );
                    get().closeContextMenu();
                }
            },

            duplicateColumn: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId && selectedCellId) {
                    const { duplicateColumn: duplicateColumnInStore } = usePresentationStore.getState();
                    duplicateColumnInStore(currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId);
                    get().closeContextMenu();
                }
            },

            alignColumnTop: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId && selectedCellId) {
                    const { alignColumnTop: alignColumnTopInStore } = usePresentationStore.getState();
                    alignColumnTopInStore(currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId);
                    get().closeContextMenu();
                }
            },

            alignColumnCenter: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId && selectedCellId) {
                    const { alignColumnCenter: alignColumnCenterInStore } = usePresentationStore.getState();
                    alignColumnCenterInStore(currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId);
                    get().closeContextMenu();
                }
            },

            alignColumnBottom: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId && selectedCellId) {
                    const { alignColumnBottom: alignColumnBottomInStore } = usePresentationStore.getState();
                    alignColumnBottomInStore(currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId);
                    get().closeContextMenu();
                }
            },

            deleteCell: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId && selectedCellId) {
                    const { deleteCell: deleteCellInStore } = usePresentationStore.getState();
                    deleteCellInStore(currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId);
                    get().closeContextMenu();
                }
            },

            deleteColumn: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId } = get();
                if (currentPresentationId && selectedSlideId && selectedLayoutId && selectedCellId) {
                    const { deleteCell: deleteCellInStore } = usePresentationStore.getState();
                    deleteCellInStore(currentPresentationId, selectedSlideId, selectedLayoutId, selectedCellId);
                    get().closeContextMenu();
                }
            },

            // Table actions
            addRowToTable: (tableRowIndex: number) => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId || !Number.isInteger(tableRowIndex))
                    return;
                const { addRowToTable } = usePresentationStore.getState();
                addRowToTable(currentPresentationId, selectedSlideId, selectedLayoutId, tableRowIndex);
            },

            deleteRowFromTable: (tableRowIndex: number) => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return;
                const { deleteRowFromTable } = usePresentationStore.getState();
                deleteRowFromTable(currentPresentationId, selectedSlideId, selectedLayoutId, tableRowIndex);
            },

            addColumnToTable: (tableColumnIndex: number) => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return;
                const { addColumnToTable } = usePresentationStore.getState();
                addColumnToTable(currentPresentationId, selectedSlideId, selectedLayoutId, tableColumnIndex);
            },

            deleteColumnFromTable: (tableColumnIndex: number) => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return;
                const { deleteColumnFromTable } = usePresentationStore.getState();
                deleteColumnFromTable(currentPresentationId, selectedSlideId, selectedLayoutId, tableColumnIndex);
            },

            equalizeTable: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return;
                const { equalizeTable } = usePresentationStore.getState();
                equalizeTable(currentPresentationId, selectedSlideId, selectedLayoutId);
            },

            // Getter methods for accessing presentation data
            getElement: (slideId, layoutId, elementId) => {
                const { currentPresentationId } = get();
                if (!slideId || !layoutId || !elementId || !currentPresentationId) return null;
                const { getElement } = usePresentationStore.getState();
                return getElement(currentPresentationId, slideId, layoutId, elementId);
            },

            getCell: (slideId, layoutId, cellId) => {
                const { currentPresentationId } = get();
                if (!slideId || !layoutId || !cellId || !currentPresentationId) return null;
                const { getCell } = usePresentationStore.getState();
                return getCell(currentPresentationId, slideId, layoutId, cellId);
            },

            getLayout: (slideId, layoutId) => {
                const { currentPresentationId } = get();
                if (!slideId || !layoutId || !currentPresentationId) return null;
                const { getLayout } = usePresentationStore.getState();
                return getLayout(currentPresentationId, slideId, layoutId);
            },

            getSlide: slideId => {
                const { currentPresentationId } = get();
                if (!slideId || !currentPresentationId) return null;
                const { getSlide } = usePresentationStore.getState();
                return getSlide(currentPresentationId, slideId);
            },

            getPresentation: presentationId => {
                const { getPresentation } = usePresentationStore.getState();
                return getPresentation(presentationId);
            },

            // Getter methods for table data
            getTableElements: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return [];
                const { getTableElements } = usePresentationStore.getState();
                return getTableElements(currentPresentationId, selectedSlideId, selectedLayoutId);
            },

            getTableColumnElements: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, contextMenuTableColumnIndex } = get();
                if (
                    !currentPresentationId ||
                    !selectedSlideId ||
                    !selectedLayoutId ||
                    !Number.isInteger(contextMenuTableColumnIndex)
                )
                    return [];
                const { getTableColumnElements } = usePresentationStore.getState();
                return getTableColumnElements(
                    currentPresentationId,
                    selectedSlideId,
                    selectedLayoutId,
                    contextMenuTableColumnIndex!
                );
            },

            getTableRowElements: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, contextMenuTableRowIndex } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return [];
                const { getTableRowElements } = usePresentationStore.getState();
                return getTableRowElements(
                    currentPresentationId,
                    selectedSlideId,
                    selectedLayoutId,
                    contextMenuTableRowIndex!
                );
            },

            getTableFirstElement: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return null;
                const { getTableFirstElement } = usePresentationStore.getState();
                return getTableFirstElement(currentPresentationId, selectedSlideId, selectedLayoutId);
            },

            // Getter methods for common properties
            getCommonAlignment: () => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return '';
                const { getCommonAlignment } = usePresentationStore.getState();
                return getCommonAlignment(currentPresentationId, selectedSlideId, selectedLayoutId);
            },

            getCommonHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>) => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return null;
                const { getCommonHeadingLevel, getLayout } = usePresentationStore.getState();
                const layout = getLayout(currentPresentationId, selectedSlideId, selectedLayoutId);
                if (!layout) return null;
                const elements = layout.elements;
                return getCommonHeadingLevel(tiptapRefs, elements);
            },

            getCommonTableHeadingLevel: tiptapRefs => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId } = get();
                if (!currentPresentationId || !selectedSlideId || !selectedLayoutId) return null;
                const { getCommonTableHeadingLevel } = usePresentationStore.getState();
                return getCommonTableHeadingLevel(tiptapRefs, currentPresentationId, selectedSlideId, selectedLayoutId);
            },

            getCommonRowHeadingLevel: tiptapRefs => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, contextMenuTableRowIndex } = get();
                if (
                    !currentPresentationId ||
                    !selectedSlideId ||
                    !selectedLayoutId ||
                    !Number.isInteger(contextMenuTableRowIndex)
                )
                    return null;
                const { getCommonRowHeadingLevel } = usePresentationStore.getState();
                return getCommonRowHeadingLevel(
                    tiptapRefs,
                    currentPresentationId,
                    selectedSlideId,
                    selectedLayoutId,
                    contextMenuTableRowIndex!
                );
            },

            getCommonColumnHeadingLevel: tiptapRefs => {
                const { currentPresentationId, selectedSlideId, selectedLayoutId, contextMenuTableColumnIndex } = get();
                if (
                    !currentPresentationId ||
                    !selectedSlideId ||
                    !selectedLayoutId ||
                    !Number.isInteger(contextMenuTableColumnIndex)
                )
                    return null;
                const { getCommonColumnHeadingLevel } = usePresentationStore.getState();
                return getCommonColumnHeadingLevel(
                    tiptapRefs,
                    currentPresentationId,
                    selectedSlideId,
                    selectedLayoutId,
                    contextMenuTableColumnIndex!
                );
            },
        }),
        {
            name: 'ui-state-store',
            enabled: true,
        }
    )
);

// Create selector hooks to prevent unnecessary re-renders
export const useIsContextMenuOpen = () => useUIStateStore(state => state.isContextMenuOpen);
export const useSelectedSlideId = () => useUIStateStore(state => state.selectedSlideId!);
export const useSelectedElementId = () => useUIStateStore(state => state.selectedElementId);
export const useSelectedLayoutId = () => useUIStateStore(state => state.selectedLayoutId);
export const useSelectedCellId = () => useUIStateStore(state => state.selectedCellId);

// Hook for checking if a specific slide has its context menu open
export const useCheckSlideContextMenuOpen = (slideId: string) =>
    useUIStateStore(
        state =>
            state.selectedSlideId === slideId && state.selectedElementId === null && state.selectedLayoutId === null
    );
