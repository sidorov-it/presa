import { EditorElement } from '@/types';
import { generateId } from './id';
import { ElementType } from '@/types/elements';

export const getNewEditorElement = (
    cellId: string,
    content?: string,
    options: { tempEditor?: boolean; tempLayout?: boolean } = {}
): EditorElement => {
    const newEditor: EditorElement = {
        id: generateId(),
        content: content || '',
        cellId,
        elementTypeId: ElementType.TEXT,
        ...options,
    };

    return newEditor;
};
