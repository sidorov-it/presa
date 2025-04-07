import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ButtonNodeView from './ButtonNodeView'

// Расширение для кнопки
export const ButtonNode = Node.create({
    name: 'button',
    group: 'block',
    content: 'inline*', // Разрешаем инлайн контент (текст)

    addAttributes() {
        return {
            class: {
                default: 'interactive-button'
            },
            presentationId: {
                default: null
            },
            slideId: {
                default: null
            },
            layoutId: {
                default: null
            },
            elementId: {
                default: null
            },
            buttonStyle: {
                default: 'filled'
            },
            alignment: {
                default: 'left'
            },
            color: {
                default: '#3C3939'
            },
            link: {
                default: ''
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
    },

    addNodeView() {
        return ReactNodeViewRenderer(ButtonNodeView, {
            // Важные параметры для корректной работы ReactNodeViewRenderer
            as: 'div', // Использовать div как контейнер
            className: 'button-node-view-wrapper' // Класс для контейнера
        })
    }
})
