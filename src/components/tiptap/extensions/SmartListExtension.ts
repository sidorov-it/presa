/* eslint-disable prettier/prettier */
import { Extension } from '@tiptap/core';
import { EditorState, Transaction } from 'prosemirror-state';
import { Editor } from '@tiptap/core';
import { Fragment } from 'prosemirror-model';

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        smartList: {
            smartToggleOrderedList: () => ReturnType;
            smartToggleBulletList: () => ReturnType;
            smartToggleTaskList: () => ReturnType;
        };
    }
}

/**
 * Check if selection contains hard breaks
 */
const shouldSplitOnBreaks = (state: EditorState, $from: any, $to: any): boolean => {
    const { doc } = state;

    // Check if selection spans multiple positions and contains hard breaks
    let hasBreaks = false;
    doc.nodesBetween($from.pos, $to.pos, (node: any) => {
        if (node.type.name === 'hardBreak') {
            hasBreaks = true;
            return false; // Stop iteration
        }
    });

    return hasBreaks;
};

/**
 * Split content on hard breaks and create list
 */
const splitAndCreateList = (
    editor: Editor,
    state: EditorState,
    dispatch: ((tr: Transaction) => void) | undefined,
    listType: 'orderedList' | 'bulletList' | 'taskList'
) => {
    const { selection, schema, tr } = state;
    const { $from, $to } = selection;

    // Get the parent paragraph
    const parent = $from.parent;
    if (parent.type.name !== 'paragraph') {
        return false;
    }

    // Collect content before selection, within selection (split by breaks), and after selection
    const beforeSelection: any[] = [];
    const segments: any[] = [];
    let currentSegment: any[] = [];
    const afterSelection: any[] = [];

    // Get the actual selected content within the paragraph
    const startOffset = $from.pos - $from.start();
    const endOffset = $to.pos - $from.start();

    let currentOffset = 0;
    parent.content.forEach((node: any) => {
        const nodeStart = currentOffset;
        const nodeEnd = currentOffset + node.nodeSize;

        if (nodeEnd <= startOffset) {
            // Content before selection
            beforeSelection.push(node);
        } else if (nodeStart >= endOffset) {
            // Content after selection
            afterSelection.push(node);
        } else {
            // Content within selection
            if (node.type.name === 'hardBreak') {
                // Found a break - save current segment and start new one
                if (currentSegment.length > 0) {
                    segments.push([...currentSegment]);
                    currentSegment = [];
                }
            } else {
                currentSegment.push(node);
            }
        }

        currentOffset = nodeEnd;
    });

    // Add last segment
    if (currentSegment.length > 0) {
        segments.push(currentSegment);
    }

    // If we have multiple segments, create list with separate items
    if (segments.length > 1) {
        const transaction = tr;
        const nodesToInsert: any[] = [];

        // Add paragraph with content before selection if any
        if (beforeSelection.length > 0) {
            const beforePara = schema.nodes.paragraph.create(parent.attrs, Fragment.from(beforeSelection));
            nodesToInsert.push(beforePara);
        }

        // Create list items for each segment
        const listItems: any[] = [];
        segments.forEach(segment => {
            if (segment.length > 0) {
                const para = schema.nodes.paragraph.create(null, Fragment.from(segment));
                const listItem = schema.nodes.listItem.create(null, para);
                listItems.push(listItem);
            }
        });

        // Create the list node
        let listNode;
        if (listType === 'orderedList') {
            listNode = schema.nodes.orderedList.create(null, listItems);
        } else if (listType === 'bulletList') {
            listNode = schema.nodes.bulletList.create(null, listItems);
        } else if (listType === 'taskList') {
            const taskItems: any[] = [];
            segments.forEach(segment => {
                if (segment.length > 0) {
                    const para = schema.nodes.paragraph.create(null, Fragment.from(segment));
                    const taskItem = schema.nodes.taskItem.create({ checked: false }, para);
                    taskItems.push(taskItem);
                }
            });
            listNode = schema.nodes.taskList.create(null, taskItems);
        }

        if (!listNode) {
            return false;
        }

        nodesToInsert.push(listNode);

        // Add paragraph with content after selection if any
        if (afterSelection.length > 0) {
            const afterPara = schema.nodes.paragraph.create(parent.attrs, Fragment.from(afterSelection));
            nodesToInsert.push(afterPara);
        }

        // Replace the paragraph with the new nodes
        const fragment = Fragment.from(nodesToInsert);
        transaction.replaceWith($from.before(), $to.after(), fragment);

        if (dispatch) {
            dispatch(transaction);
        }
        return true;
    }

    return false;
};

/**
 * Extension that improves list creation behavior by splitting text on <br> tags
 * before converting to list items
 */
export const SmartListExtension = Extension.create({
    name: 'smartList',

    addCommands() {
        return {
            smartToggleOrderedList:
                () =>
                    ({ editor, commands, state, dispatch }) => {
                        const { selection } = state;
                        const { $from, $to } = selection;

                        // Check if we need to split on <br> tags
                        if (shouldSplitOnBreaks(state, $from, $to)) {
                            return splitAndCreateList(editor, state, dispatch, 'orderedList');
                        }

                        // Otherwise use default behavior
                        return commands.toggleOrderedList();
                    },

            smartToggleBulletList:
                () =>
                    ({ editor, commands, state, dispatch }) => {
                        const { selection } = state;
                        const { $from, $to } = selection;

                        // Check if we need to split on <br> tags
                        if (shouldSplitOnBreaks(state, $from, $to)) {
                            return splitAndCreateList(editor, state, dispatch, 'bulletList');
                        }

                        // Otherwise use default behavior
                        return commands.toggleBulletList();
                    },

            smartToggleTaskList:
                () =>
                    ({ editor, commands, state, dispatch }) => {
                        const { selection } = state;
                        const { $from, $to } = selection;

                        // Check if we need to split on <br> tags
                        if (shouldSplitOnBreaks(state, $from, $to)) {
                            return splitAndCreateList(editor, state, dispatch, 'taskList');
                        }

                        // Otherwise use default behavior
                        return commands.toggleTaskList();
                    },
        };
    },
});
