import { Extension } from '@tiptap/core'

// Создаем расширение для обработки нажатия Enter и Backspace
export const EnterHandlerExtension = (onEnterPressed: () => void, onBackspacePressed: () => void) => {
    return Extension.create({
        name: 'enterHandler',
        addKeyboardShortcuts() {
            return {
                'Enter': ({ editor }) => {
                    // Если курсор в конце документа и текущий узел пустой или содержит только один параграф
                    console.log('Enter EnterHandlerExtension')
                    const { state } = editor
                    const { selection } = state
                    const { empty, $head } = selection

                    // Проверяем, находится ли курсор в конце документа
                    const isAtEnd = $head.pos >= state.doc.content.size

                    // Проверяем, есть ли в документе только один параграф
                    const isSingleParagraph = state.doc.childCount === 1 && state.doc.firstChild?.type.name === 'paragraph'

                    // Проверяем, находится ли курсор в конце единственного параграфа
                    const isAtEndOfParagraph = isSingleParagraph && state.doc.firstChild && $head.pos === state.doc.firstChild.nodeSize - 1

                    // Если курсор в конце документа или это единственный параграф и курсор в его конце
                    if (empty && (isAtEnd || isAtEndOfParagraph)) {
                        onEnterPressed()
                        return true
                    }

                    return false
                },
                'Backspace': ({ editor }) => {
                    // Если курсор в начале документа и документ пустой
                    const { state } = editor
                    const { selection } = state
                    const { empty, $head } = selection

                    // Проверяем, находится ли курсор в начале документа
                    const isAtStart = $head.pos === 1

                    // Проверяем, пустой ли документ
                    const isEmpty = state.doc.textContent.trim() === ''

                    // Если курсор в начале документа и документ пустой
                    if (empty && isAtStart && isEmpty) {
                        onBackspacePressed()
                        return true
                    }

                    return false
                },
            }
        },
    })
}