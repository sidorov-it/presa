import { ElementRegistry } from '@/elements/commonRegisrty';
import { ElementConfig } from '@/types';

export const getElementConfig = (elementTypeId: string): ElementConfig | undefined => {
    const elementType = Object.values(ElementRegistry).find(element => element.elementTypeId === elementTypeId);
    if (!elementType) return undefined;

    return {
        ...elementType,
        label: elementType.label || elementTypeId,
    };
};
