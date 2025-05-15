import { elementTypes } from '@/elements/elementsRegistry';

// Helper to get appropriate menu based on element and context
export const getElementMenuComponent = (elementId: string) => {
    const elementType = elementTypes[elementId];
    if (!elementType) {
        return {
            MenuComponent: undefined,
            menuDirection: 'bottom',
            menuHeight: undefined,
        };
    }

    return {
        MenuComponent: elementType.MenuComponent,
        menuDirection: 'bottom',
        menuHeight: undefined,
    };
};
