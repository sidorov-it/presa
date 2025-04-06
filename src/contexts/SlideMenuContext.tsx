import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { BaseElement, GridCell, IPresentation, Layout, LayoutType, Slide } from '@/types';
import { ComponentStructureType } from '@/elements/registry';

// Define menu element types
export type MenuElementType = 'element' | 'column' | 'layout' | 'slide' | 'editor';

// Define slide menu state types
type SlideMenuState = {
    isOpen: boolean;
    slideId: string | null;
    elementId: string | null;
    elementType: MenuElementType | null;
    layoutId: string | null;
    columnId: string | null;
    isTextEditor: boolean;
    componentStructure: ComponentStructureType | null;
};

type SlideMenuAction =
    | { type: 'OPEN_MENU'; payload: { slideId?: string | null; elementId?: string | null; elementType?: MenuElementType | null; layoutId?: string | null; columnId?: string | null; isTextEditor?: boolean; componentStructure?: ComponentStructureType | null } }
    | { type: 'CLOSE_MENU' };

const initialState: SlideMenuState = {
    isOpen: false,
    slideId: null,
    elementId: null,
    elementType: null,
    layoutId: null,
    columnId: null,
    isTextEditor: false,
    componentStructure: null,
};

// Reducer for managing slide menu state
const slideMenuReducer = (state: SlideMenuState, action: SlideMenuAction): SlideMenuState => {
    switch (action.type) {
        case 'OPEN_MENU':
            return {
                isOpen: true,
                slideId: action.payload.slideId ?? null,
                elementId: action.payload.elementId ?? null,
                elementType: action.payload.elementType ?? null,
                layoutId: action.payload.layoutId ?? null,
                columnId: action.payload.columnId ?? null,
                isTextEditor: action.payload.isTextEditor ?? false,
                componentStructure: action.payload.componentStructure ?? null,
            };
        case 'CLOSE_MENU':
            return initialState;
        default:
            return state;
    }
};

// Create context
type SlideMenuContextType = {
    state: SlideMenuState;
    openMenu: (menuData: { slideId?: string | null, elementId?: string | null, elementType?: MenuElementType | null, layoutId?: string | null, columnId?: string | null, isTextEditor?: boolean, componentStructure?: ComponentStructureType | null }) => void;
    closeMenu: () => void;

    checkSlideMenuIsOpen: (slideId: string | null) => boolean;
    getPresentation: () => IPresentation | null | undefined;

    duplicateSlide: () => void;
    deleteSlide: () => void;

    deleteLayout: () => void;
    updateAlignLayout: (layoutId: string, align: 'top' | 'center' | 'bottom') => void;

    changeTemplate: (template: LayoutType) => void;

    duplicateElement: () => void;
    deleteElement: () => void;
    editElement: () => void;

    addColumnLeft: (slideId: string, layoutId: string, columnId: string) => void;
    addColumnRight: (slideId: string, layoutId: string, columnId: string) => void;
    duplicateColumn: (slideId: string, layoutId: string, columnId: string) => void;
    alignColumnTop: (slideId: string, layoutId: string, columnId: string) => void;
    alignColumnCenter: (slideId: string, layoutId: string, columnId: string) => void;
    alignColumnBottom: (slideId: string, layoutId: string, columnId: string) => void;
    deleteColumn: (slideId: string, layoutId: string, columnId: string) => void;

    getElement: (slideId: string | null, layoutId: string | null, elementId: string | null) => BaseElement | null | undefined;
    getCell: (slideId: string | null, layoutId: string | null, columnId: string | null) => GridCell | null | undefined;
    getLayout: (slideId: string | null, layoutId: string | null) => Layout | null | undefined;
    getSlide: (slideId: string | null) => Slide | null | undefined;
    mergeSlideWithPrevious: () => void;
};

const SlideMenuContext = createContext<SlideMenuContextType | undefined>(undefined);

// Provider component
export const SlideMenuProvider: React.FC<{ children: ReactNode; presentationId: string }> = ({
    children,
    presentationId,
}) => {
    const [state, dispatch] = useReducer(slideMenuReducer, initialState);
    const {
        findLayoutByElementId,
        duplicateSlide: duplicateSlideInStore,
        deleteSlide: deleteSlideInStore,
        duplicateElement: duplicateElementInStore,
        deleteElement: deleteElementInStore,
        deleteLayout: deleteLayoutInStore,
        addColumnLeft: addColumnLeftInStore,
        addColumnRight: addColumnRightInStore,
        duplicateColumn: duplicateColumnInStore,
        alignColumnTop: alignColumnTopInStore,
        alignColumnCenter: alignColumnCenterInStore,
        alignColumnBottom: alignColumnBottomInStore,
        deleteColumn: deleteColumnInStore,
        getElement: getElementInStore,
        getCell: getCellInStore,
        getLayout: getLayoutInStore,
        getSlide: getSlideInStore,
        getPresentation: getPresentationInStore,
        mergeSlideWithPrevious: mergeSlideWithPreviousInStore,
        updateAlignLayout: updateAlignLayoutInStore,
        changeTemplate: changeTemplateInStore,
    } = usePresentationStore();

    // Menu control functions
    const menuControlFunctions = useMemo(() => {
        const openMenu = ({
            slideId,
            elementId,
            elementType,
            layoutId,
            columnId,
            isTextEditor,
            componentStructure
        }: {
            slideId?: string | null,
            elementId?: string | null,
            elementType?: MenuElementType | null,
            layoutId?: string | null,
            columnId?: string | null,
            isTextEditor?: boolean,
            componentStructure?: ComponentStructureType | null
        }) => {
            dispatch({
                type: 'OPEN_MENU',
                payload: {
                    slideId,
                    elementId,
                    elementType,
                    layoutId,
                    columnId,
                    isTextEditor,
                    componentStructure
                }
            });
        };

        const closeMenu = () => {
            dispatch({ type: 'CLOSE_MENU' });
        };

        const checkSlideMenuIsOpen = (slideId: string | null) => {
            return state.slideId === slideId && state.elementId === null && state.layoutId === null;
        };

        const getPresentation = () => {
            return getPresentationInStore(presentationId);
        };

        return {
            openMenu,
            closeMenu,
            checkSlideMenuIsOpen,
            getPresentation
        };
    }, [dispatch, state.slideId, state.elementId, state.layoutId, getPresentationInStore, presentationId]);

    // Slide functions
    const slideFunctions = useMemo(() => {
        const duplicateSlide = () => {
            if (state.slideId) {
                duplicateSlideInStore(presentationId, state.slideId);
                menuControlFunctions.closeMenu();
            }
        };

        const deleteSlide = () => {
            if (state.slideId) {
                deleteSlideInStore(presentationId, state.slideId);
                menuControlFunctions.closeMenu();
            }
        };

        const mergeSlideWithPrevious = () => {
            if (state.slideId) {
                mergeSlideWithPreviousInStore(presentationId, state.slideId);
                menuControlFunctions.closeMenu();
            }
        };

        return {
            duplicateSlide,
            deleteSlide,
            mergeSlideWithPrevious
        };
    }, [state.slideId, duplicateSlideInStore, deleteSlideInStore, mergeSlideWithPreviousInStore, presentationId, menuControlFunctions.closeMenu]);

    // Element functions
    const elementFunctions = useMemo(() => {
        const duplicateElement = () => {
            if (state.slideId && state.elementId) {
                duplicateElementInStore(presentationId, state.slideId, state.elementId);
                menuControlFunctions.closeMenu();
            }
        };

        const deleteElement = () => {
            if (state.slideId && state.elementId) {
                const layout = findLayoutByElementId(state.elementId);
                if (layout) {
                    deleteElementInStore(presentationId, state.slideId, layout.id, state.elementId);
                    menuControlFunctions.closeMenu();
                }
            }
        };

        const editElement = () => {
            // This will be implemented later when we have element editing functionality
            // For now it just closes the menu
            menuControlFunctions.closeMenu();
        };

        return {
            duplicateElement,
            deleteElement,
            editElement
        };
    }, [state.slideId, state.elementId, duplicateElementInStore, deleteElementInStore, findLayoutByElementId, presentationId, menuControlFunctions.closeMenu]);

    // Layout functions
    const layoutFunctions = useMemo(() => {
        const deleteLayout = () => {
            if (state.slideId && state.layoutId) {
                deleteLayoutInStore(presentationId, state.slideId, state.layoutId);
                menuControlFunctions.closeMenu();
            }
        };

        const updateAlignLayout = (layoutId: string, align: 'top' | 'center' | 'bottom') => {
            updateAlignLayoutInStore(presentationId, layoutId, align);
        };

        const changeTemplate = (template: LayoutType) => {
            if (state.slideId && state.layoutId) {
                changeTemplateInStore(presentationId, state.slideId, state.layoutId, template);
            }
        };

        return {
            deleteLayout,
            updateAlignLayout,
            changeTemplate
        };
    }, [state.slideId, state.layoutId, deleteLayoutInStore, updateAlignLayoutInStore, changeTemplateInStore, presentationId, menuControlFunctions.closeMenu]);

    // Column functions
    const columnFunctions = useMemo(() => {
        const addColumnLeft = (slideId: string, layoutId: string, columnId: string) => {
            addColumnLeftInStore(presentationId, slideId, layoutId, columnId);
            menuControlFunctions.closeMenu();
        };

        const addColumnRight = (slideId: string, layoutId: string, columnId: string) => {
            addColumnRightInStore(presentationId, slideId, layoutId, columnId);
            menuControlFunctions.closeMenu();
        };

        const duplicateColumn = (slideId: string, layoutId: string, columnId: string) => {
            duplicateColumnInStore(presentationId, slideId, layoutId, columnId);
            menuControlFunctions.closeMenu();
        };

        const alignColumnTop = (slideId: string, layoutId: string, columnId: string) => {
            alignColumnTopInStore(presentationId, slideId, layoutId, columnId);
        };

        const alignColumnCenter = (slideId: string, layoutId: string, columnId: string) => {
            alignColumnCenterInStore(presentationId, slideId, layoutId, columnId);
        };

        const alignColumnBottom = (slideId: string, layoutId: string, columnId: string) => {
            alignColumnBottomInStore(presentationId, slideId, layoutId, columnId);
        };

        const deleteColumn = (slideId: string, layoutId: string, columnId: string) => {
            deleteColumnInStore(presentationId, slideId, layoutId, columnId);
            menuControlFunctions.closeMenu();
        };

        return {
            addColumnLeft,
            addColumnRight,
            duplicateColumn,
            alignColumnTop,
            alignColumnCenter,
            alignColumnBottom,
            deleteColumn
        };
    }, [
        addColumnLeftInStore,
        addColumnRightInStore,
        duplicateColumnInStore,
        alignColumnTopInStore,
        alignColumnCenterInStore,
        alignColumnBottomInStore,
        deleteColumnInStore,
        presentationId,
        menuControlFunctions.closeMenu
    ]);

    // Getter functions
    const getterFunctions = useMemo(() => {
        const getElement = (slideId: string | null, layoutId: string | null, elementId: string | null) => {
            if (!slideId || !layoutId || !elementId) return null;
            return getElementInStore(presentationId, slideId, layoutId, elementId);
        };

        const getCell = (slideId: string | null, layoutId: string | null, columnId: string | null) => {
            if (!slideId || !layoutId || !columnId) return null;
            return getCellInStore(presentationId, slideId, layoutId, columnId);
        };

        const getLayout = (slideId: string | null, layoutId: string | null) => {
            if (!slideId || !layoutId) return null;
            return getLayoutInStore(presentationId, slideId, layoutId);
        };

        const getSlide = (slideId: string | null) => {
            if (!slideId) return null;
            return getSlideInStore(presentationId, slideId);
        };

        return {
            getElement,
            getCell,
            getLayout,
            getSlide
        };
    }, [getElementInStore, getCellInStore, getLayoutInStore, getSlideInStore, presentationId]);

    const contextValue = useMemo(() => ({
        state,
        ...menuControlFunctions,
        ...slideFunctions,
        ...elementFunctions,
        ...layoutFunctions,
        ...columnFunctions,
        ...getterFunctions
    }), [
        state,
        menuControlFunctions,
        slideFunctions,
        elementFunctions,
        layoutFunctions,
        columnFunctions,
        getterFunctions
    ]);

    return (
        <SlideMenuContext.Provider value={contextValue}>
            {children}
        </SlideMenuContext.Provider>
    );
};

// Custom hooks for using specific parts of the context to prevent unnecessary re-renders
type UseSlideMenuStateSelector<T> = (state: SlideMenuState) => T;

// Base hook that allows selection of specific state parts
const useSlideMenuState = <T,>(selector: UseSlideMenuStateSelector<T>): T => {
    const context = useContext(SlideMenuContext);
    if (!context) {
        throw new Error('useSlideMenuState must be used within a SlideMenuProvider');
    }

    // Use useMemo to prevent unnecessary recalculations
    return useMemo(() => selector(context.state), [selector, context.state]);
};

// Specific selectors for common use cases
export const useSlideMenuIsOpen = () => useSlideMenuState(state => state.isOpen);
export const useSlideMenuSelectedSlide = () => useSlideMenuState(state => state.slideId);
export const useSlideMenuSelectedElement = () => useSlideMenuState(state => state.elementId);
export const useSlideMenuSelectedLayout = () => useSlideMenuState(state => state.layoutId);
export const useSlideMenuSelectedColumn = () => useSlideMenuState(state => state.columnId);

// Hook for checking if a specific slide has its menu open
export const useSlideMenuCheckOpen = (slideId: string) => {
    const context = useContext(SlideMenuContext);
    if (!context) {
        throw new Error('useSlideMenuCheckOpen must be used within a SlideMenuProvider');
    }

    return useMemo(
        () => context.checkSlideMenuIsOpen(slideId),
        [context.state.slideId, context.state.elementId, context.state.layoutId, slideId]
    );
};

// Hook for menu actions only (without state subscription)
export const useSlideMenuActions = () => {
    const context = useContext(SlideMenuContext);
    if (!context) {
        throw new Error('useSlideMenuActions must be used within a SlideMenuProvider');
    }

    return useMemo(() => {
        const { state: _state, ...actions } = context;
        return actions;
    }, [context]);
};

// Main hook for backward compatibility - but now developers should prefer the more specific hooks
export const useSlideMenu = () => {
    const context = useContext(SlideMenuContext);
    if (!context) {
        throw new Error('useSlideMenu must be used within a SlideMenuProvider');
    }
    return context;
};
