import { elementTypes } from '@/elements/elementsRegistry';

// Check if element uses limited text formatting (like button)
export const hasLimitedTextFormatting = (elementId: string): boolean => {
    const elementType = elementTypes[elementId];
    return elementType?.hasLimitedTextFormatting ?? false;
};
