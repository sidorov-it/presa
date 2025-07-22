import { getTextContent } from '@/elements/textEditor/defaultContent';
import { BaseElement, SmartLayoutElement, SmartLayoutItem, TextType } from '@/types';
import { ElementType } from '@/types/elements';
import { MenuItem } from '@/types/templates';
import { generateId } from './id';

export const getNewElement = (
    menuItem: Pick<MenuItem, 'elementTypeId' | 'elementVariant' | 'props'>
): Omit<BaseElement, 'cellId'> => {
    const { elementTypeId, elementVariant, props = {} } = menuItem;

    const element: Omit<BaseElement, 'cellId'> & { content?: string } = {
        id: generateId(8),
        elementTypeId: elementTypeId as ElementType,
        elementVariant,
        ...props,
    };

    if (elementTypeId === ElementType.SMART_LAYOUT) {
        (element as SmartLayoutElement).items =
            props.items?.map((item: SmartLayoutItem) => ({
                ...item,
                id: generateId(),
            })) || [];
    } else if (elementTypeId === ElementType.BUTTON) {
        (element as any).items =
            props.items?.map((item: any) => ({
                ...item,
                id: generateId(),
            })) || [];
    } else if (Object.values(TextType).includes(props.textType as TextType)) {
        const content = getTextContent(props.textType as TextType, props.content);
        element.content = content;
    }

    return element as Omit<BaseElement, 'cellId'>;
};
