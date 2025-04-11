import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usePresentationStore } from './presentationStore';
import { BaseElement, GridCell, IPresentation, Layout, LayoutType, Slide } from '@/types';
import { ComponentStructureType } from '@/elements/registry';

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

    setPresentationId: (presentationId: string) => void;

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
    }) => void;
    closeMenu: () => void;
    checkSlideMenuIsOpen: (slideId: string | null) => boolean;

    // Slide actions
    duplicateSlide: () => void;
    deleteSlide: () => void;
    mergeSlideWithPrevious: () => void;

    // Layout actions
    deleteLayout: (slideId: string, layoutId: string) => void;
    updateAlignLayout: (slideId: string, layoutId: string, align: 'top' | 'center' | 'bottom') => void;
    changeTemplate: (slideId: string, layoutId: string, template: LayoutType) => void;

    // Element actions
    duplicateElement: () => void;
    deleteElement: () => void;
    editElement: () => void;

    // Column actions
    addColumnLeft: (slideId: string, layoutId: string, columnIndex: number) => void;
    addColumnRight: (slideId: string, layoutId: string, columnIndex: number) => void;
    duplicateColumn: (slideId: string, layoutId: string, columnId: string) => void;
    alignColumnTop: (slideId: string, layoutId: string, columnId: string) => void;
    alignColumnCenter: (slideId: string, layoutId: string, columnId: string) => void;
    alignColumnBottom: (slideId: string, layoutId: string, columnId: string) => void;
    deleteColumn: (slideId: string, layoutId: string, columnId: string) => void;
    toggleBoldOnColumn: () => void;
    // Getter methods
    getElement: (slideId: string | null, layoutId: string | null, elementId: string | null) => BaseElement | null | undefined;
    getCell: (slideId: string | null, layoutId: string | null, columnId: string | null) => GridCell | null | undefined;
    getLayout: (slideId: string | null, layoutId: string | null) => Layout | null | undefined;
    getSlide: (slideId: string | null) => Slide | null | undefined;
    getPresentation: (presentationId: string) => IPresentation | null | undefined;

    // Add a combined action to batch updates
    hoverTableCell: (tableId: string, rowIndex: number | null, columnIndex: number | null) => void;

    getTableColumnElements: () => BaseElement[];
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

            setPresentationId: (presentationId: string) => set({ presentationId }),

            // Table hover actions
            setSelectedRowIndex: (tableId: string, rowIndex: number | null) => {
                const { selectedTableId } = get();
                if (selectedTableId !== tableId) {
                    set({ selectedRowIndex: rowIndex, selectedTableId: tableId })
                } else {
                    set({ selectedRowIndex: rowIndex })
                }
            },
            setSelectedColumnIndex: (tableId: string, columnIndex: number | null) => {
                const { selectedTableId } = get();
                if (selectedTableId !== tableId) {
                    set({ selectedColumnIndex: columnIndex, selectedTableId: tableId })
                } else {
                    set({ selectedColumnIndex: columnIndex })
                }
            },

            // Menu control actions
            openMenu: (menuData) => {
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
                })
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
                })
            },

            checkSlideMenuIsOpen: (slideId) => {
                const state = get();
                return state.slideId === slideId && state.elementId === null && state.layoutId === null;
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
            deleteLayout: (slideId, layoutId) => {
                const { presentationId } = get();
                if (slideId && layoutId && presentationId) {
                    const { deleteLayout } = usePresentationStore.getState();
                    deleteLayout(presentationId, slideId, layoutId);
                    get().closeMenu();
                }
            },

            updateAlignLayout: (slideId, layoutId, align) => {
                const { updateAlignLayout: updateAlignLayoutInStore } = usePresentationStore.getState();
                const { presentationId } = get();
                if (presentationId) {
                    updateAlignLayoutInStore(presentationId, layoutId, align);
                }
            },

            changeTemplate: (slideId, layoutId, template) => {
                const { presentationId } = get();
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
            addColumnLeft: (slideId, layoutId) => {
                const { presentationId, tableColumnIndex } = get();
                if (presentationId) {
                    const { addColumnLeft: addColumnLeftInStore } = usePresentationStore.getState();
                    addColumnLeftInStore(presentationId, slideId, layoutId, tableColumnIndex!);
                    get().closeMenu();
                }
            },

            addColumnRight: (slideId, layoutId) => {
                const { presentationId, tableColumnIndex } = get();
                if (presentationId) {
                    const { addColumnRight: addColumnRightInStore } = usePresentationStore.getState();
                    addColumnRightInStore(presentationId, slideId, layoutId, tableColumnIndex!);
                    get().closeMenu();
                }
            },

            duplicateColumn: (slideId, layoutId, columnId) => {
                const { presentationId } = get();
                if (presentationId) {
                    const { duplicateColumn: duplicateColumnInStore } = usePresentationStore.getState();
                    duplicateColumnInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            alignColumnTop: (slideId, layoutId, columnId) => {
                const { presentationId } = get();
                if (presentationId) {
                    const { alignColumnTop: alignColumnTopInStore } = usePresentationStore.getState();
                    alignColumnTopInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            alignColumnCenter: (slideId, layoutId, columnId) => {
                const { presentationId } = get();
                if (presentationId) {
                    const { alignColumnCenter: alignColumnCenterInStore } = usePresentationStore.getState();
                    alignColumnCenterInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            alignColumnBottom: (slideId, layoutId, columnId) => {
                const { presentationId } = get();
                if (presentationId) {
                    const { alignColumnBottom: alignColumnBottomInStore } = usePresentationStore.getState();
                    alignColumnBottomInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            deleteColumn: (slideId, layoutId, columnId) => {
                const { presentationId } = get();
                if (presentationId) {
                    const { deleteColumn: deleteColumnInStore } = usePresentationStore.getState();
                    deleteColumnInStore(presentationId, slideId, layoutId, columnId);
                    get().closeMenu();
                }
            },

            toggleBoldOnColumn: () => {
                const { presentationId, slideId, layoutId, tableColumnIndex } = get();
                if (presentationId && slideId && layoutId) {
                    const { toggleBoldOnColumn: toggleBoldOnColumnInStore } = usePresentationStore.getState();
                    toggleBoldOnColumnInStore(presentationId, slideId, layoutId, tableColumnIndex!);
                }
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

            getSlide: (slideId) => {
                const { presentationId } = get();
                if (!slideId || !presentationId) return null;
                const { getSlide } = usePresentationStore.getState();
                return getSlide(presentationId, slideId);
            },

            getPresentation: (presentationId) => {
                const { getPresentation } = usePresentationStore.getState();
                return getPresentation(presentationId);
            },

            // Add a combined action to batch updates
            hoverTableCell: (tableId: string, rowIndex: number | null, columnIndex: number | null) =>
                set((state) => {
                    if (state.hoveredRowIndex === rowIndex &&
                    state.hoveredColumnIndex === columnIndex &&
                    state.hoveredTableId === tableId) {
                        return state; // No change needed
                    }
                    return {
                        hoveredRowIndex: rowIndex,
                        hoveredColumnIndex: columnIndex,
                        hoveredTableId: tableId
                    };
                }),

            getTableColumnElements: () => {
                const { presentationId, slideId, layoutId, tableColumnIndex } = get();
                if (!presentationId || !slideId || !layoutId || !tableColumnIndex) return [];
                const { getTableColumnElements } = usePresentationStore.getState();
                return getTableColumnElements(presentationId, slideId, layoutId, tableColumnIndex);
            }
        }),
        {
            name: 'menu-store',
            enabled: true,
        }
    )
);

// Create selector hooks to prevent unnecessary re-renders
export const useMenuIsOpen = () => useMenuStore(state => state.isOpen);
export const useMenuSelectedSlide = () => useMenuStore(state => state.slideId);
export const useMenuSelectedElement = () => useMenuStore(state => state.elementId);
export const useMenuSelectedLayout = () => useMenuStore(state => state.layoutId);
export const useMenuSelectedColumn = () => useMenuStore(state => state.columnId);
export const useMenuSelectedCell = () => useMenuStore(state => state.cellId);

// Hook for checking if a specific slide has its menu open
export const useMenuCheckOpen = (slideId: string) =>
    useMenuStore(state => state.slideId === slideId && state.elementId === null && state.layoutId === null);
