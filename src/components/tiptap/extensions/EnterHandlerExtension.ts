import { Extension, JSONContent } from '@tiptap/core';

// Создаем расширение для обработки нажатия Enter и Backspace
export const EnterHandlerExtension = (
    onEnterPressed: (contentBeforeCursor?: JSONContent, contentAfterCursor?: JSONContent) => void,
    onBackspacePressed: (isEmpty: boolean, content: string) => void,
    onDeletePressed: (isEmpty: boolean, content: string) => void,
    standardEnterBehavior: boolean = false
) => {
    return Extension.create({
        name: 'enterHandler',
        addKeyboardShortcuts() {
            return {
                Enter: ({ editor }) => {
                    if (standardEnterBehavior) {
                        return false;
                    }
                    const { state } = editor;
                    const { selection } = state;
                    const { $head } = selection;

                    // Проверяем, находится ли курсор внутри списка, поднимаясь по дереву узлов
                    let isInList = false;
                    let currentNode = $head.parent;
                    let depth = $head.depth;

                    while (depth > 0) {
                        if (
                            currentNode.type.name === 'listItem' ||
                            currentNode.type.name === 'bulletList' ||
                            currentNode.type.name === 'taskList' ||
                            currentNode.type.name === 'orderedList'
                        ) {
                            isInList = true;
                            break;
                        }
                        depth--;
                        currentNode = $head.node(depth);
                    }

                    // Если курсор в списке, позволяем стандартную обработку Enter
                    if (isInList) {
                        return false; // Передаем управление стандартному обработчику списков Tiptap
                    }

                    // Получаем контент до и после курсора
                    const contentBeforeCursor = editor.state.doc.slice(0, selection.from).toJSON();
                    const contentAfterCursor = editor.state.doc.slice(selection.from).toJSON();

                    onEnterPressed(contentBeforeCursor, contentAfterCursor);

                    return true;
                },
                Backspace: ({ editor }) => {
                    const isEmpty = editor.isEmpty;
                    const textContent = editor.getText();

                    if (isEmpty || textContent.length === 0) {
                        onBackspacePressed(true, '');
                        return true;
                    }

                    const { state } = editor;
                    const { selection } = state;
                    const { $head } = selection;

                    // Если курсор в начале документа
                    if ($head.pos === 0) {
                        onBackspacePressed(false, editor.getHTML());
                        return true;
                    }

                    return false;
                },
                Delete: ({ editor }) => {
                    const isEmpty = editor.isEmpty;
                    const textContent = editor.getText();

                    if (isEmpty || textContent.length === 0) {
                        onDeletePressed(true, '');
                        return true;
                    }

                    const { state } = editor;
                    const { selection } = state;
                    const { $head } = selection;

                    // Если курсор в конце документа
                    if ($head.pos === state.doc.content.size) {
                        onDeletePressed(false, editor.getHTML());
                        return true;
                    }

                    return false;
                },
            };
        },
    });
};
