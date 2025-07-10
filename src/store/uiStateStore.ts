import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usePresentationStore } from './presentationStore';
import { useShallow } from 'zustand/react/shallow';

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
}

export interface SelectedState {
    selectedSlideId: string | null;
    selectedElementId: string | null;
    selectedLayoutId: string | null;
    selectedCellId: string | null;
    selectedSmartLayoutItemId: string | null;
    presentationId: string | null;
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

export const useSelectedState = () =>
    useUIStateStore(
        useShallow(state => ({
            selectedSlideId: state.selectedSlideId,
            selectedElementId: state.selectedElementId,
            selectedLayoutId: state.selectedLayoutId,
            selectedCellId: state.selectedCellId,
            selectedSmartLayoutItemId: state.selectedSmartLayoutItemId,
            focusedLayoutId: state.focusedLayoutId,
            presentationId: state.currentPresentationId,
        }))
    );
