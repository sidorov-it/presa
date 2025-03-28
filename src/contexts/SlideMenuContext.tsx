import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { usePresentationStore } from '@/store/presentationStore';

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
};

type SlideMenuAction =
    | { type: 'OPEN_MENU'; payload: { slideId?: string | null; elementId?: string | null; elementType?: MenuElementType | null; layoutId?: string | null; columnId?: string | null } }
    | { type: 'CLOSE_MENU' };

const initialState: SlideMenuState = {
    isOpen: false,
    slideId: null,
    elementId: null,
    elementType: null,
    layoutId: null,
    columnId: null,
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
    openMenu: (slideId?: string | null, elementId?: string | null, elementType?: MenuElementType | null, layoutId?: string | null, columnId?: string | null) => void;
    closeMenu: () => void;
    duplicateSlide: () => void;
    duplicateElement: () => void;
    deleteSlide: () => void;
    deleteElement: () => void;
    deleteLayout: () => void;
    editElement: () => void;
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
    } = usePresentationStore();

    const openMenu = (
        slideId?: string | null, 
        elementId?: string | null, 
        elementType?: MenuElementType | null,
        layoutId?: string | null,
        columnId?: string | null
    ) => {
        dispatch({ 
            type: 'OPEN_MENU', 
            payload: { 
                slideId, 
                elementId, 
                elementType,
                layoutId,
                columnId
            } 
        });
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
