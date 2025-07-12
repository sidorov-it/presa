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

                    // Get the current cursor position
                    const cursorPos = $head.pos;

                    // Get the content after the cursor
                    const contentAfterCursor = state.doc.cut(cursorPos).toJSON();

                    const contentBeforeCursor = state.doc.cut(0, cursorPos).toJSON();

                    // If there's content after the cursor, pass it to the callback
                    if (contentAfterCursor && contentAfterCursor.content?.length > 0) {
                        // Delete the content after cursor in current editor
                        // вызывает handleEditorContentChange в ElementContent
                        editor
                            .chain()
                            .setMeta('handleEnter', true)
                            .focus()
                            .deleteRange({ from: cursorPos, to: state.doc.content.size })
                            .run();

                        // Pass the remaining content to create a new editor
                        onEnterPressed(contentBeforeCursor, contentAfterCursor);
                    } else {
                        // If no content after cursor, just create a new empty editor
                        onEnterPressed();
                    }

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

                    // Проверяем, находится ли курсор в начале первого текстового содержимого
                    // Находим первую позицию с текстовым содержимым
                    // let firstTextPos = 1; // Начинаем с позиции 1 (после корневого узла)

                    // Проходим по документу, чтобы найти первую позицию с текстом
                    state.doc.descendants(node => {
                        if (node.isText && node.text && node.text.length > 0) {
                            // firstTextPos = pos;
                            return false; // Останавливаем поиск
                        }
                        if (node.isBlock && node.content.size === 0) {
                            // Пустой блок - курсор может быть в начале
                            // firstTextPos = pos + 1;
                            return false;
                        }
                        return true;
                    });

                    // Если курсор в начале первого содержимого
                    if ($head.pos <= 1) {
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

                    // Проверяем, находится ли курсор в конце последнего текстового содержимого
                    let lastTextPos = state.doc.content.size - 1;

                    // Проходим по документу в обратном порядке, чтобы найти последнюю позицию с текстом
                    state.doc.descendants((node, pos) => {
                        if (node.isText && node.text && node.text.length > 0) {
                            lastTextPos = pos + node.text.length;
                        }
                        if (node.isBlock && node.content.size === 0) {
                            // Пустой блок - курсор может быть в конце
                            lastTextPos = pos + 1;
                        }
                        return true;
                    });

                    // Если курсор в конце последнего содержимого
                    if ($head.pos >= lastTextPos) {
                        onDeletePressed(false, editor.getHTML());
                        return true;
                    }

                    return false;
                },
            };
        },
    });
};
