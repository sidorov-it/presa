import { Node, mergeAttributes } from '@tiptap/core'

// Расширение для кнопки
export const ButtonNode = Node.create({
    name: 'button',
    group: 'block',
    content: 'inline*', // Разрешаем инлайн контент (текст)

    addAttributes() {
        return {
            class: {
                default: 'interactive-button'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'button[data-type="button"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['button', mergeAttributes(HTMLAttributes, { 'data-type': 'button' }), 0]
    }
})
