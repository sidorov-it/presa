import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import ButtonNodeView from './ButtonNodeView'

// Box node
export const BoxNode = Node.create({
    name: 'box',
    group: 'block',
    content: 'block+', // Allow block content inside the box

    addAttributes() {
        return {
            class: {
                default: 'box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'box' }), 0]
    }
})

// Note box node
export const NoteBoxNode = Node.create({
    name: 'noteBox',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            class: {
                default: 'note-box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="note-box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'note-box' }), 0]
    }
})

// Info box node
export const InfoBoxNode = Node.create({
    name: 'infoBox',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            class: {
                default: 'info-box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="info-box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'info-box' }), 0]
    }
})

// Warning box node
export const WarningBoxNode = Node.create({
    name: 'warningBox',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            class: {
                default: 'warning-box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="warning-box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'warning-box' }), 0]
    }
})

// Caution box node
export const CautionBoxNode = Node.create({
    name: 'cautionBox',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            class: {
                default: 'caution-box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="caution-box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'caution-box' }), 0]
    }
})

// Success box node
export const SuccessBoxNode = Node.create({
    name: 'successBox',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            class: {
                default: 'success-box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="success-box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'success-box' }), 0]
    }
})

// Question box node
export const QuestionBoxNode = Node.create({
    name: 'questionBox',
    group: 'block',
    content: 'block+',

    addAttributes() {
        return {
            class: {
                default: 'question-box'
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="question-box"]'
            }
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'question-box' }), 0]
    },

    addNodeView() {
        return ReactNodeViewRenderer(ButtonNodeView)
    }
})