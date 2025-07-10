import { EditorElement, TextType } from '@/types';
import { generateId } from './id';
import { ElementType } from '@/types/elements';
import { getHeadingLevel } from './getHeadingLevel';

export const getNewEditorElement = (
    content?: string,
    options: { tempEditor?: boolean; tempLayout?: boolean; textType?: string } = {}
): Omit<EditorElement, 'cellId'> => {
    // Если контент не передан или пустой, создаем контент по умолчанию с правильными классами
    let defaultContent = '';
    if (!content || content.trim() === '' || content.trim() === '<p></p>') {
        defaultContent = '<p><span class="body-text normal-text"></span></p>';
    } else {
        defaultContent = content;
    }

    let className = '';

    if (options.textType) {
        const textType = options.textType;
        switch (textType) {
            case TextType.TITLE:
                className = 'heading-text title-text';
                break;
            case TextType.HEADING1:
                className = 'heading-text heading-1';
                break;
            case TextType.HEADING2:
                className = 'heading-text heading-2';
                break;
            case TextType.HEADING3:
                className = 'heading-text heading-3';
                break;
            case TextType.HEADING4:
                className = 'heading-text heading-4';
                break;
            case TextType.QUOTE:
                className = 'body-text quote';
                break;
            case TextType.BULLET_LIST:
                className = 'body-text bullet-list';
                break;
            case TextType.NUMERED_LIST:
                className = 'body-text numered-list';
                break;
            case TextType.TODO_LIST:
                className = 'body-text todo-list';
                break;
            default:
                className = 'body-text normal-text';
                break;
        }
    }

    if (options.textType && className) {
        defaultContent = `<p><span class="${className}">${defaultContent}</span></p>`;
    }

    const newEditor: Omit<EditorElement, 'cellId'> = {
        id: generateId(),
        content: defaultContent,
        elementTypeId: ElementType.TEXT,
        ...options,
    };

    return newEditor;
};
