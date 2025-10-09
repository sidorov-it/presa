import { Extension, JSONContent } from '@tiptap/core';

// Создаем расширение для обработки нажатия Enter и Backspace
export const EnterHandlerExtension = (
    onEnterPressed: (
        contentBeforeCursor?: JSONContent,
        contentAfterCursor?: JSONContent,
        preservedStyles?: any
    ) => void,
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
                    const { $head, $anchor } = selection;

                    // Проверяем, находится ли курсор внутри списка, поднимаясь по дереву узлов
                    let isInList = false;
                    let listItemNode = null;
                    let listItemDepth = 0;
                    let listNode = null;
                    let listDepth = 0;
                    let currentNode = $head.parent;
                    let depth = $head.depth;

                    while (depth > 0) {
                        if (currentNode.type.name === 'listItem' && !listItemNode) {
                            listItemNode = currentNode;
                            listItemDepth = depth;
                        }
                        if (
                            (currentNode.type.name === 'bulletList' ||
                                currentNode.type.name === 'taskList' ||
                                currentNode.type.name === 'orderedList') &&
                            !listNode
                        ) {
                            listNode = currentNode;
                            listDepth = depth;
                            isInList = true;
                        }
                        if (
                            currentNode.type.name === 'listItem' ||
                            currentNode.type.name === 'bulletList' ||
                            currentNode.type.name === 'taskList' ||
                            currentNode.type.name === 'orderedList'
                        ) {
                            isInList = true;
                        }
                        depth--;
                        currentNode = $head.node(depth);
                    }

                    // Если курсор в списке, проверяем, пустой ли текущий listItem
                    if (isInList && listItemNode && listNode) {
                        // Проверяем, пустой ли текущий listItem
                        const isEmptyListItem = listItemNode.textContent.trim() === '';

                        if (isEmptyListItem) {
                            // Находим позицию текущего listItem в родительском списке
                            const $listPos = state.doc.resolve($head.before(listDepth));
                            let currentListItemIndex = -1;

                            listNode.forEach((node, offset, index) => {
                                const absolutePos = $listPos.pos + offset + 1;
                                if (absolutePos === $head.before(listItemDepth)) {
                                    currentListItemIndex = index;
                                }
                            });

                            if (currentListItemIndex !== -1) {
                                // Создаем контент до текущего listItem
                                const contentBefore: JSONContent = {
                                    type: 'doc',
                                    content: [],
                                };

                                if (currentListItemIndex > 0) {
                                    const listItemsBefore: any[] = [];
                                    listNode.forEach((node, offset, index) => {
                                        if (index < currentListItemIndex) {
                                            listItemsBefore.push(node.toJSON());
                                        }
                                    });

                                    if (listItemsBefore.length > 0) {
                                        contentBefore.content = [
                                            {
                                                type: listNode.type.name,
                                                content: listItemsBefore,
                                            },
                                        ];
                                    }
                                }

                                // Создаем контент после текущего listItem
                                const contentAfter: JSONContent = {
                                    type: 'doc',
                                    content: [],
                                };

                                if (currentListItemIndex < listNode.childCount - 1) {
                                    const listItemsAfter: any[] = [];
                                    listNode.forEach((node, offset, index) => {
                                        if (index > currentListItemIndex) {
                                            listItemsAfter.push(node.toJSON());
                                        }
                                    });

                                    if (listItemsAfter.length > 0) {
                                        contentAfter.content = [
                                            {
                                                type: listNode.type.name,
                                                content: listItemsAfter,
                                            },
                                        ];
                                    }
                                }

                                // Определяем, что передать в onEnterPressed
                                const hasContentBefore = contentBefore.content && contentBefore.content.length > 0;
                                const hasContentAfter = contentAfter.content && contentAfter.content.length > 0;

                                if (hasContentBefore && hasContentAfter) {
                                    // Есть контент до и после - создаем 3 элемента
                                    onEnterPressed(contentBefore, contentAfter, undefined);
                                } else if (hasContentBefore) {
                                    // Есть только контент до - оставляем список и создаем пустой текст
                                    onEnterPressed(contentBefore, undefined, undefined);
                                } else if (hasContentAfter) {
                                    // Есть только контент после - создаем пустой текст и список
                                    onEnterPressed(undefined, contentAfter, undefined);
                                } else {
                                    // Нет контента - просто создаем пустой текст
                                    onEnterPressed(undefined, undefined, undefined);
                                }

                                return true;
                            }
                        }

                        // Если listItem не пустой, позволяем стандартную обработку Enter
                        return false;
                    }

                    // Если не в списке, продолжаем обычную обработку
                    if (isInList) {
                        return false;
                    }

                    // Проверяем, есть ли выделенный текст
                    const hasSelection = !selection.empty;
                    const selectionStart = hasSelection ? Math.min($head.pos, $anchor.pos) : $head.pos;
                    const selectionEnd = hasSelection ? Math.max($head.pos, $anchor.pos) : $head.pos;

                    // Проверяем, выделен ли весь текст (от начала до конца документа)
                    const isFullSelection =
                        hasSelection && selectionStart <= 1 && selectionEnd >= state.doc.content.size - 1;

                    // Сохраняем стили перед удалением текста, если выделен весь текст
                    let preservedStyles = null;
                    if (isFullSelection) {
                        // Получаем текущие стили из редактора
                        const currentLevel = editor.isActive('fontSize') ? editor.getAttributes('fontSize').level : 1;
                        const currentColor = editor.getAttributes('textStyle').color || null;
                        const currentBold = editor.isActive('bold');
                        const currentItalic = editor.isActive('italic');
                        const currentUnderline = editor.isActive('underline');
                        const currentStrike = editor.isActive('strike');

                        preservedStyles = {
                            level: currentLevel,
                            color: currentColor,
                            bold: currentBold,
                            italic: currentItalic,
                            underline: currentUnderline,
                            strike: currentStrike,
                        };

                        // Сохраняем стили в CustomPlaceholderExtension для текущего редактора
                        if (editor.extensionManager.extensions.find(ext => ext.name === 'customPlaceholder')) {
                            (editor.commands as any).customPlaceholder?.updatePlaceholderStyle(preservedStyles);
                        }
                    }

                    // Получаем контент до выделения
                    const contentBeforeSelection = state.doc.cut(0, selectionStart).toJSON();

                    // Получаем контент после выделения
                    const contentAfterSelection = state.doc.cut(selectionEnd).toJSON();

                    // Удаляем выделенный текст из текущего редактора
                    if (hasSelection) {
                        editor
                            .chain()
                            .setMeta('handleEnter', true)
                            .focus()
                            .deleteRange({ from: selectionStart, to: selectionEnd })
                            .run();
                    }

                    // Определяем, нужно ли создавать новые редакторы
                    const hasContentBefore = contentBeforeSelection && contentBeforeSelection.content?.length > 0;
                    const hasContentAfter = contentAfterSelection && contentAfterSelection.content?.length > 0;

                    if (hasContentBefore && hasContentAfter) {
                        // Есть контент до и после выделения - разбиваем на 2 редактора
                        onEnterPressed(contentBeforeSelection, contentAfterSelection, preservedStyles);
                    } else if (hasContentAfter) {
                        // Есть только контент после выделения - создаем один новый редактор
                        onEnterPressed(undefined, contentAfterSelection, preservedStyles);
                    } else {
                        // Нет контента после выделения - создаем пустой редактор
                        onEnterPressed(undefined, undefined, preservedStyles);
                    }

                    return true;
                },
                Backspace: ({ editor }) => {
                    const isEmpty = editor.isEmpty;
                    const textContent = editor.getText();
                    const htmlContent = editor.getHTML();

                    // Проверяем, действительно ли редактор пустой (только пустые параграфы или вообще ничего)
                    const isActuallyEmpty =
                        isEmpty || textContent.length === 0 || htmlContent === '<p></p>' || htmlContent === '';

                    if (isActuallyEmpty) {
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
                    state.doc.descendants((node: any) => {
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
                    const htmlContent = editor.getHTML();

                    // Проверяем, действительно ли редактор пустой (только пустые параграфы или вообще ничего)
                    const isActuallyEmpty =
                        isEmpty || textContent.length === 0 || htmlContent === '<p></p>' || htmlContent === '';

                    if (isActuallyEmpty) {
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
