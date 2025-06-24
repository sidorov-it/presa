import { EditorElement } from '@/types';
import { generateId } from './id';
import { ElementType } from '@/types/elements';

export const getNewEditorElement = (content?: string): Omit<EditorElement, 'cellId'> => {
    const newEditor: Omit<EditorElement, 'cellId'> = {
        id: generateId(),
        content: content || '',
        elementTypeId: ElementType.TEXT,
    };

    return newEditor;
};
