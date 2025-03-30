import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { BaseElement, GridCell, IPresentation, Layout, Slide } from '@/types';

// Define menu element types
export type MenuElementType = 'element' | 'column' | 'layout' | 'slide';

// Define slide menu state types
type SlideMenuState = {
    isOpen: boolean;
    slideId: string | null;
    elementId: string | null;
    elementType: MenuElementType | null;
    layoutId: string | null;
    columnId: string | null;
    isTextEditor: boolean;
};

type SlideMenuAction =
    | { type: 'OPEN_MENU'; payload: { slideId?: string | null; elementId?: string | null; elementType?: MenuElementType | null; layoutId?: string | null; columnId?: string | null; isTextEditor?: boolean } }
    | { type: 'CLOSE_MENU' };

const initialState: SlideMenuState = {
    isOpen: false,
    slideId: null,
    elementId: null,
    elementType: null,
    layoutId: null,
    columnId: null,
    isTextEditor: false,
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
    openMenu: (slideId?: string | null, elementId?: string | null, elementType?: MenuElementType | null, layoutId?: string | null, columnId?: string | null, isTextEditor?: boolean) => void;
    closeMenu: () => void;

    getPresentation: () => IPresentation | null | undefined;

    duplicateSlide: () => void;
    duplicateElement: () => void;
    deleteSlide: () => void;
    deleteElement: () => void;
    deleteLayout: () => void;
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
    } = usePresentationStore();

    const openMenu = (
        slideId?: string | null, 
        elementId?: string | null, 
        elementType?: MenuElementType | null,
        layoutId?: string | null,
        columnId?: string | null,
        isTextEditor?: boolean
    ) => {
        dispatch({ 
            type: 'OPEN_MENU', 
            payload: { 
                slideId, 
                elementId, 
                elementType,
                layoutId,
                columnId,
                isTextEditor
            } 
        });
    };

    const getPresentation = () => {
        return getPresentationInStore(presentationId);
    };

    const closeMenu = () => {
        dispatch({ type: 'CLOSE_MENU' });
    };

    const duplicateSlide = () => {
        if (state.slideId) {
            duplicateSlideInStore(presentationId, state.slideId);
            closeMenu();
        }
    };

    const mergeSlideWithPrevious = () => {
        if (state.slideId) {
            mergeSlideWithPreviousInStore(presentationId, state.slideId);
            closeMenu();
        }
    }

    const deleteSlide = () => {
        if (state.slideId) {
            deleteSlideInStore(presentationId, state.slideId);
            closeMenu();
        }
    };

    const duplicateElement = () => {
        if (state.slideId && state.elementId) {
            duplicateElementInStore(presentationId, state.slideId, state.elementId);
            closeMenu();
        }
    };

    const deleteElement = () => {
        if (state.slideId && state.elementId) {
            const layout = findLayoutByElementId(state.elementId);
            if (layout) {
                deleteElementInStore(presentationId, state.slideId, layout.id, state.elementId);
                closeMenu();
            }
        }
    };

    const deleteLayout = () => {
        if (state.slideId && state.layoutId) {
            deleteLayoutInStore(presentationId, state.slideId, state.layoutId);
            closeMenu();
        }
    };

    const editElement = () => {
        // This will be implemented later when we have element editing functionality
        // For now it just closes the menu
        closeMenu();
    };

    const addColumnLeft = (slideId: string, layoutId: string, columnId: string) => {
        addColumnLeftInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    };

    const addColumnRight = (slideId: string, layoutId: string, columnId: string) => {
        addColumnRightInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    }

    const duplicateColumn = (slideId: string, layoutId: string, columnId: string) => {
        duplicateColumnInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    }

    const alignColumnTop = (slideId: string, layoutId: string, columnId: string) => {
        alignColumnTopInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    }

    const alignColumnCenter = (slideId: string, layoutId: string, columnId: string) => {
        alignColumnCenterInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    }

    const alignColumnBottom = (slideId: string, layoutId: string, columnId: string) => {
        alignColumnBottomInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    }

    const deleteColumn = (slideId: string, layoutId: string, columnId: string) => {
        deleteColumnInStore(presentationId, slideId, layoutId, columnId);
        closeMenu();
    }

    const getElement = (slideId: string | null, layoutId: string | null, elementId: string | null) => {
        if (!slideId || !layoutId || !elementId) return null;
        return getElementInStore(presentationId, slideId, layoutId, elementId);
    }

    const getCell = (slideId: string | null, layoutId: string | null, columnId: string | null) => {
        if (!slideId || !layoutId || !columnId) return null;
        return getCellInStore(presentationId, slideId, layoutId, columnId);
    }

    const getLayout = (slideId: string | null, layoutId: string | null) => {
        if (!slideId || !layoutId) return null;
        return getLayoutInStore(presentationId, slideId, layoutId);
    }

    const getSlide = (slideId: string | null) => {
        if (!slideId) return null;
        return getSlideInStore(presentationId, slideId);
    }

    return (
        <SlideMenuContext.Provider
            value={{
                state,
                openMenu,
                closeMenu,
                duplicateSlide,
                deleteSlide,
                duplicateElement,
                deleteElement,
                deleteLayout,
                editElement,
                addColumnLeft,
                addColumnRight,
                duplicateColumn,
                alignColumnTop,
                alignColumnCenter,
                alignColumnBottom,
                deleteColumn,
                getElement,
                getCell,
                getLayout,
                getSlide,
                getPresentation,
                mergeSlideWithPrevious,
            }}
        >
            {children}
        </SlideMenuContext.Provider>
    );
};

// Custom hook for using the context
export const useSlideMenu = () => {
    const context = useContext(SlideMenuContext);
    if (!context) {
        throw new Error('useSlideMenu must be used within a SlideMenuProvider');
    }
    return context;
};
