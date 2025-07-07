import { EditorElement } from '@/types';
import { generateId } from './id';
import { ElementType } from '@/types/elements';

export const getNewEditorElement = (
    content?: string,
    options: { tempEditor?: boolean; tempLayout?: boolean } = {}
): Omit<EditorElement, 'cellId'> => {
    // Если контент не передан или пустой, создаем контент по умолчанию с правильными классами
    let defaultContent = '';
    if (!content || content.trim() === '' || content.trim() === '<p></p>') {
        defaultContent = '<p><span class="body-text normal-text"></span></p>';
    } else {
        defaultContent = content;
    }

    const newEditor: Omit<EditorElement, 'cellId'> = {
        id: generateId(),
        content: defaultContent,
        elementTypeId: ElementType.TEXT,
        ...options,
    };

    return newEditor;
};
