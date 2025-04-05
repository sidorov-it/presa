import { Extension, JSONContent } from '@tiptap/core'

// Создаем расширение для обработки нажатия Enter и Backspace
export const EnterHandlerExtension = (onEnterPressed: (contentBeforeCursor?: JSONContent, contentAfterCursor?: JSONContent) => void, onBackspacePressed: (isEmpty: boolean) => void) => {
    return Extension.create({
        name: 'enterHandler',
        addKeyboardShortcuts() {
            return {
                'Enter': ({ editor }) => {
                    console.log('Enter EnterHandlerExtension')
                    const { state } = editor
                    const { selection } = state
                    const { $head } = selection

                    // Проверяем, находится ли курсор внутри списка, поднимаясь по дереву узлов
                    let isInList = false
                    let currentNode = $head.parent
                    let depth = $head.depth

                    while (depth > 0) {
                        if (currentNode.type.name === 'listItem' ||
                            currentNode.type.name === 'bulletList' ||
                            currentNode.type.name === 'taskList' ||
                            currentNode.type.name === 'orderedList') {
                            isInList = true
                            break
                        }
                        depth--
                        currentNode = $head.node(depth)
                    }

                    // Если курсор в списке, позволяем стандартную обработку Enter
                    if (isInList) {
                        return false // Передаем управление стандартному обработчику списков Tiptap
                    }

                    // Get the current cursor position
                    const cursorPos = $head.pos

                    // Get the content after the cursor
                    const contentAfterCursor = state.doc.cut(cursorPos).toJSON()

                    const contentBeforeCursor = state.doc.cut(0, cursorPos).toJSON()

                    // If there's content after the cursor, pass it to the callback
                    if (contentAfterCursor && contentAfterCursor.content?.length > 0) {
                        // Delete the content after cursor in current editor
                        editor
                            .chain()
                            .setMeta('handleEnter', true)
                            .focus()
                            .deleteRange({ from: cursorPos, to: state.doc.content.size })
                            .run()

                        // Pass the remaining content to create a new editor
                        onEnterPressed(contentBeforeCursor, contentAfterCursor)
                    } else {
                        // If no content after cursor, just create a new empty editor
                        onEnterPressed()
                    }
                    return true
                },
                'Backspace': ({ editor }) => {
                    const { state } = editor
                    const { selection } = state
                    const { empty, $head } = selection

                    // Check if cursor is at start and document is empty
                    const isAtStart = $head.pos === 1
                    const isEmpty = state.doc.textContent.trim() === ''

                    if (empty && isAtStart && isEmpty) {
                        onBackspacePressed(true)
                        return true
                    }

                    return false
                },
            }
        },
    })
}