import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { usePresentationStore } from '@/store/presentationStore';

// Define slide menu state types
type SlideMenuState = {
  isOpen: boolean;
  slideId: string | null;
};

type SlideMenuAction =
  | { type: 'OPEN_MENU'; payload: { slideId: string } }
  | { type: 'CLOSE_MENU' };

const initialState: SlideMenuState = {
    isOpen: false,
    slideId: null,
};

// Reducer for managing slide menu state
const slideMenuReducer = (state: SlideMenuState, action: SlideMenuAction): SlideMenuState => {
    switch (action.type) {
        case 'OPEN_MENU':
            return {
                isOpen: true,
                slideId: action.payload.slideId,
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
  openMenu: (slideId: string) => void;
  closeMenu: () => void;
  duplicateSlide: () => void;
  deleteSlide: () => void;
};

const SlideMenuContext = createContext<SlideMenuContextType | undefined>(undefined);

// Provider component
export const SlideMenuProvider: React.FC<{ children: ReactNode; presentationId: string }> = ({
    children,
    presentationId,
}) => {
    const [state, dispatch] = useReducer(slideMenuReducer, initialState);
    const {
        duplicateSlide: duplicateSlideInStore,
        deleteSlide: deleteSlideInStore,
    } = usePresentationStore();
    
    const openMenu = (slideId: string) => {
        dispatch({ type: 'OPEN_MENU', payload: { slideId } });
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

    return (
        <SlideMenuContext.Provider
            value={{
                state,
                openMenu,
                closeMenu,
                duplicateSlide,
                deleteSlide,
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
