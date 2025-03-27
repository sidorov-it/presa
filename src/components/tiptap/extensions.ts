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

// Расширение для переключателя
export const ToggleNode = Node.create({
    name: 'toggle',
    group: 'block',
    content: 'block+', // Разрешаем блочный контент внутри

    addAttributes() {
        return {
            open: {
                default: false,
                parseHTML: element => element.getAttribute('data-open') === 'true',
                renderHTML: attributes => ({
                    'data-open': attributes.open
                })
            },
            title: {
                default: 'Toggle section'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="toggle"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes, node }) {
        return ['div',
            mergeAttributes(
                HTMLAttributes,
                {
                    'data-type': 'toggle',
                    class: 'toggle-wrapper'
                }
            ),
            ['div',
                {
                    class: 'toggle-header',
                    'data-open': HTMLAttributes.open
                },
                ['span', { class: 'toggle-icon' }, HTMLAttributes.open ? '▼' : '▶'],
                ['span', { class: 'toggle-title' }, HTMLAttributes.title]
            ],
            ['div',
                {
                    class: `toggle-content ${HTMLAttributes.open ? 'open' : ''}`,
                },
                0
            ]
        ]
    }
}) 