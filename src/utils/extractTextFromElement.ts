import { EditorElement, Element, SmartLayoutElement } from '@/types';
import { ElementType } from '@/types/elements';
import { stripHtml } from './stripeHtml';

export default function extractTextFromElement(element: Element) {
    if ([ElementType.TEXT].includes(element.elementTypeId)) {
        return stripHtml((element as EditorElement).content);
    }
    if (element.elementTypeId === ElementType.SMART_LAYOUT) {
        return (element as SmartLayoutElement).items
            .flatMap(item => [stripHtml(item.text), stripHtml(item.title)])
            .filter(Boolean)
            .join('\n');
    }

    return '';
}
