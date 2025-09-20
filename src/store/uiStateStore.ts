import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usePresentationStore } from './presentationStore';
import { useShallow } from 'zustand/react/shallow';

// Define UI element types for context menus
export type UIElementType =
    | 'element'
    | 'cell'
    | 'layout'
    | 'slide'
    | 'editor'
    | 'row'
    | 'table'
    | 'column'
    | 'chart'
    | 'smart-layout-item';

export interface UIState {
    // Selection state - tracks what elements are currently selected/focused
    selectedSlideId: string | null;
    selectedElementId: string | null;
    selectedLayoutId: string | null;
    selectedCellId: string | null;
    selectedSmartLayoutItemId: string | null;
    // focusedLayoutId: string | null;

    // Table selection state
    // selectedTableId: string | null;
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
    // contextMenuSmartLayoutItemId: string | null;
    isContextMenuOnTextEditor: boolean;
    isContextMenuInTable: boolean;

    // Side menu state
    sideMenuState: {
        isOpen: boolean;
        sideMenuId: string | null;
        sideMenuData: any;
    };

    // Header/Footer modal state
    isHeaderFooterModalOpen: boolean;
    isGlobalHeaderFooterModalOpen: boolean;
    currentSlideId: string | null;

    // Subscription modal state
    isSubscriptionModalOpen: boolean;

    // Presentation context
    currentPresentationId: string | null;

    setSelectedSlideId: (slideId: string) => void;
    setSelectedData: (data: any) => void;

    // Actions for presentation context
    setCurrentPresentationId: (presentationId: string) => void;

    // Actions for element selection
    setSelectedSmartLayoutItemId: (layoutId: string, elementId: string, smartLayoutItemId: string) => void;
    setSelectedRowIndex: (tableId: string, rowIndex: number | null) => void;
    setSelectedColumnIndex: (tableId: string, columnIndex: number | null) => void;
    setSelectedLayoutId: (layoutId: string) => void;
    resetSelectedLayoutId: () => void;

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

    // Actions for header/footer modal control
    setHeaderFooterModalOpen: (isOpen: boolean) => void;
    setGlobalHeaderFooterModalOpen: (isOpen: boolean) => void;
    setCurrentSlideId: (slideId: string | null) => void;

    // Actions for subscription modal control
    openSubscriptionModal: () => void;
    closeSubscriptionModal: () => void;

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

// Add logger middleware
const logger = (config: any) => (set: any, get: any, api: any) => {
    const result = config(set, get, api);
    return Object.fromEntries(
        Object.entries(result).map(([key, value]) => {
            if (typeof value === 'function') {
                return [
                    key,
                    (...args: any[]) => {
                        if (key === 'checkSlideContextMenuIsOpen') {
                            return value(...args);
                        }
                        console.log(`[Zustand] Calling action: ${key} with args:`, args);
                        return value(...args);
                    },
                ];
            }
            return [key, value];
        })
    );
};

export const useUIStateStore = create<UIState>()(
    devtools(
        logger((set: any, get: any) => ({
            // Initial selection state
            selectedSlideId: null,
            selectedElementId: null,
            selectedLayoutId: null,
            selectedCellId: null,
            selectedSmartLayoutItemId: null,
            // focusedLayoutId: null,

            // Initial table selection state
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
            // contextMenuSmartLayoutItemId: null,
            isContextMenuOnTextEditor: false,
            isContextMenuInTable: false,

            // Initial side menu state
            sideMenuState: {
                isOpen: false,
                sideMenuId: null,
                sideMenuData: null,
            },

            // Initial header/footer modal state
            isHeaderFooterModalOpen: false,
            isGlobalHeaderFooterModalOpen: false,
            currentSlideId: null,

            // Initial subscription modal state
            isSubscriptionModalOpen: false,

            // Initial presentation context
            currentPresentationId: null,

            // Actions for presentation context
            setCurrentPresentationId: (presentationId: string) => set({ currentPresentationId: presentationId }),

            // Actions for element selection
            setSelectedSmartLayoutItemId: (layoutId: string, elementId: string, smartLayoutItemId: string) =>
                set({
                    selectedSmartLayoutItemId: smartLayoutItemId,
                    selectedLayoutId: layoutId,
                    selectedElementId: elementId,
                }),

            setSelectedRowIndex: (tableId: string, rowIndex: number | null) => {
                set({ selectedRowIndex: rowIndex });
            },

            setSelectedColumnIndex: (tableId: string, columnIndex: number | null) => {
                set({ selectedColumnIndex: columnIndex });
            },

            setSelectedLayoutId: (layoutId: string) => {
                set({
                    selectedLayoutId: layoutId,
                    selectedCellId: null,
                    selectedRowIndex: null,
                    selectedColumnIndex: null,
                    selectedSmartLayoutItemId: null,
                    selectedElementId: null,
                });
            },

            // setFocusedLayoutId: (layoutId: string) => {
            //     set({ focusedLayoutId: layoutId, selectedElementId: null, selectedSmartLayoutItemId: null });
            // },

            resetSelectedLayoutId: () => {
                set({ selectedLayoutId: null });
            },

            setSelectedSlideId: (slideId: string) => {
                set({ selectedSlideId: slideId });
            },

            // Actions for context menu control
            openContextMenu: (menuData: any) => {
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
                    selectedSmartLayoutItemId: menuData.smartLayoutItemId ?? null,
                    isContextMenuOnTextEditor: menuData.isTextEditor ?? false,
                    contextMenuTableRowIndex: menuData.tableRowIndex ?? null,
                    contextMenuTableColumnIndex: menuData.tableColumnIndex ?? null,
                    contextMenuTableId: menuData.tableId ?? null,
                    // contextMenuSmartLayoutItemId: menuData.smartLayoutItemId ?? null,
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
                    selectedSmartLayoutItemId: menuData.smartLayoutItemId ?? null,
                    // contextMenuSmartLayoutItemId: menuData.smartLayoutItemId ?? null,
                    isContextMenuInTable: isInTable ?? false,
                    contextMenuColumnIndex: menuData.columnIndex ?? null,
                    currentPresentationId: currentPresentationId ?? null,
                    elementType: menuData.elementType ?? null,
                });
            },

            setSelectedData: (data: {
                slideId: string | null;
                elementId: string | null;
                layoutId: string | null;
                cellId: string | null;
            }) => {
                set({
                    selectedSlideId: data.slideId ?? null,
                    selectedElementId: data.elementId ?? null,
                    selectedLayoutId: data.layoutId ?? null,
                    selectedCellId: data.cellId ?? null,
                });
            },
            closeContextMenu: () => {
                console.log('closeContextMenu');
                set({
                    isContextMenuOpen: false,
                    // selectedSlideId: null,
                    selectedElementId: null,
                    contextMenuElementType: null,
                    selectedLayoutId: null,
                    isContextMenuOnTextEditor: false,
                    contextMenuTableRowIndex: null,
                    contextMenuTableColumnIndex: null,
                    contextMenuTableId: null,
                    selectedCellId: null,
                    // contextMenuSmartLayoutItemId: null,
                    contextMenuColumnIndex: null,
                });
            },

            checkSlideContextMenuIsOpen: (slideId: string) => {
                const state = get();
                return (
                    state.selectedSlideId === slideId &&
                    state.selectedElementId === null &&
                    state.selectedLayoutId === null &&
                    state.selectedSmartLayoutItemId === null &&
                    state.isContextMenuOpen
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

            // Actions for header/footer modal control
            setHeaderFooterModalOpen: (isOpen: boolean) => {
                set({ isHeaderFooterModalOpen: isOpen });
            },

            setGlobalHeaderFooterModalOpen: (isOpen: boolean) => {
                set({ isGlobalHeaderFooterModalOpen: isOpen });
            },

            setCurrentSlideId: (slideId: string | null) => {
                set({ currentSlideId: slideId });
            },

            // Actions for subscription modal control
            openSubscriptionModal: () => {
                set({
                    isSubscriptionModalOpen: true,
                });
            },

            closeSubscriptionModal: () => {
                set({
                    isSubscriptionModalOpen: false,
                });
            },

            // Actions for table hover state
            hoverTableCell: (tableId: string, rowIndex: number | null, columnIndex: number | null) =>
                set((state: UIState) => {
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
        })),
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
            // focusedLayoutId: state.focusedLayoutId,
            presentationId: state.currentPresentationId,
        }))
    );
