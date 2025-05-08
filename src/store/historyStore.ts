import { MutableRefObject } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import deepDiff from 'deep-diff';
import { BaseElement, EditorElement, TipTapRefs } from '@/types';
import { usePresentationStore } from './presentationStore';
import getValueByPath from '@/utils/getValueByPath';
import { getElementConfig } from '@/elements/registry';
import { TEXT_ELEMENT_TYPES } from '@/elements/menuRegistry';

// Define history action types
export type HistoryAction = {
    type: 'layout' | 'element' | 'presentation' | 'slide' | 'column' | 'row' | 'cell'; // type of entity modified
    description: string; // descriptive info about the action
    presentationId: string; // which presentation was modified
    slideId?: string; // which slide was modified (if applicable)
    layoutId?: string; // which layout was modified (if applicable)
    elementId?: string; // which element was modified (if applicable)
    alignment?: 'top' | 'center' | 'bottom'; // which alignment was modified (if applicable)
    position?: 'left' | 'right'; // which position was modified (if applicable)
    cellId?: string; // which cell was modified (if applicable)
    columnId?: string; // which cell was modified (if applicable)
    changes: deepDiff.Diff<any, any>[]; // generated diffs between before and after states
    timestamp: number; // when the action happened
    transactionId?: string; // ID to group related actions
    isTextElement?: boolean; // whether the element is a text element
    before?: any; // original state (kept for debugging)
    after?: any; // updated state (kept for debugging)
};

interface HistoryState {
    // History stacks by presentation
    history: {
        [presentationId: string]: {
            past: HistoryAction[];
            future: HistoryAction[];
        };
    };

    // Track active transactions
    activeTransactions: {
        [presentationId: string]: {
            transactionId: string;
            actions: Omit<HistoryAction, 'timestamp' | 'changes'>[];
            description: string;
        } | null;
    };

    // Initialize history for a presentation
    initHistory: (presentationId: string) => void;

    // Record a new action in the history
    recordAction: (
        action: Omit<HistoryAction, 'timestamp' | 'transactionId' | 'changes'> & { before: any; after: any }
    ) => void;

    // Start a transaction (group of actions that will be treated as one)
    beginTransaction: (presentationId: string, description: string) => string;

    // Record an action as part of an active transaction
    recordTransactionAction: (
        action: Omit<HistoryAction, 'timestamp' | 'transactionId' | 'changes'> & { before: any; after: any }
    ) => void;

    // Commit all actions in a transaction as a single history entry
    commitTransaction: (presentationId: string) => void;

    // Discard an active transaction without recording it
    cancelTransaction: (presentationId: string) => void;

    // Undo the last action
    undo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => void;

    // Redo the last undone action
    redo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => void;

    // Check if undo is available
    canUndo: (presentationId: string | null) => boolean;

    // Check if redo is available
    canRedo: (presentationId: string | null) => boolean;

    // Clear history for a presentation
    clearHistory: (presentationId: string) => void;

    // Get presentation history
    getHistory: (presentationId: string) => HistoryAction[];

    // Check if there's an active transaction
    hasActiveTransaction: (presentationId: string) => boolean;
}

// Maximum number of actions to keep in history per presentation
const MAX_HISTORY_LENGTH = 50;

// Generate a transaction ID
const generateTransactionId = () => {
    return Math.random().toString(36).substring(2, 15);
};

// Apply diffs to a state object (for redo operations)
const applyDiffs = (state: any, diffs: deepDiff.Diff<any, any>[]) => {
    const newState = JSON.parse(JSON.stringify(state));

    diffs.forEach(diff => {
        deepDiff.applyChange(newState, undefined, diff);
    });

    return newState;
};

// Revert diffs from a state object (for undo operations)
const revertDiffs = (state: any, diffs: deepDiff.Diff<any, any>[]) => {
    const newState = JSON.parse(JSON.stringify(state));

    // Apply diffs in reverse order for undo
    // for (let i = diffs.length - 1; i >= 0; i--) {
    for (let i = 0; i < diffs.length; i++) {
        deepDiff.revertChange(newState, {}, diffs[i]);
    }

    return newState;
};

const findTextElements = (state: any) => {
    const textElements: { id: string; content: any }[] = [];

    state.presentations.forEach((presentation: any) => {
        presentation.slides.forEach((slide: any) => {
            slide.layouts.forEach((layout: any) => {
                layout.elements.forEach((element: any) => {
                    if (TEXT_ELEMENT_TYPES.includes(element.elementTypeId)) {
                        textElements.push({
                            id: element.id,
                            content: element.content,
                        });
                    }
                });
            });
        });
    });

    return textElements;
};

export const useHistoryStore = create<HistoryState>()(
    devtools(
        (set, get) => ({
            history: {},
            activeTransactions: {},

            initHistory: (presentationId: string) => {
                set(state => {
                    if (state.history[presentationId]) {
                        return state; // Already initialized
                    }

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: [],
                                future: [],
                            },
                        },
                        activeTransactions: {
                            ...state.activeTransactions,
                            [presentationId]: null,
                        },
                    };
                });
            },

            beginTransaction: (presentationId: string, description: string) => {
                // Initialize history if needed
                if (!get().history[presentationId]) {
                    get().initHistory(presentationId);
                }

                const transactionId = generateTransactionId();

                console.debug('begin transaction', description);
                const transactionAction: {
                    transactionId: string;
                    actions: Omit<HistoryAction, 'timestamp' | 'changes'>[];
                    description: string;
                } = {
                    transactionId,
                    actions: [],
                    description,
                };

                set(state => ({
                    activeTransactions: {
                        ...(state.activeTransactions as any),
                        [presentationId]: transactionAction,
                    },
                }));

                return transactionId;
            },

            recordTransactionAction: action => {
                console.debug('recordTransactionAction', action);
                const presentationId = action.presentationId;
                const activeTransaction = get().activeTransactions[presentationId];

                if (!activeTransaction) {
                    // If no active transaction, just record as a regular action
                    get().recordAction(action);
                    return;
                }

                set(state => ({
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: {
                            ...(activeTransaction as any),
                            actions: [...activeTransaction.actions, action],
                        },
                    },
                }));
            },

            commitTransaction: (presentationId: string) => {
                const activeTransaction = get().activeTransactions[presentationId];

                if (!activeTransaction || activeTransaction.actions.length === 0) {
                    // No transaction or empty transaction - nothing to commit
                    set(state => {
                        const updatedState = {
                            activeTransactions: {
                                ...state.activeTransactions,
                                [presentationId]: null,
                            },
                        };

                        return updatedState;
                    });
                    return;
                }

                // Create a combined history action representing the entire transaction
                const firstAction = activeTransaction.actions[0];
                const lastAction = activeTransaction.actions[activeTransaction.actions.length - 1];

                // Generate diffs using deep-diff library
                const changes = deepDiff.diff(firstAction.before, lastAction.after) || [];

                const combinedAction: HistoryAction = {
                    type: firstAction.type,
                    description: activeTransaction.description,
                    presentationId,
                    slideId: firstAction.slideId,
                    layoutId: firstAction.layoutId,
                    elementId: firstAction.elementId,
                    changes,
                    timestamp: Date.now(),
                    transactionId: activeTransaction.transactionId,
                    before: firstAction.before,
                    after: lastAction.after,
                };

                // Record the combined action
                set(state => {
                    const presentationHistory = state.history[presentationId] || { past: [], future: [] };
                    const newPast = [...presentationHistory.past, combinedAction];

                    // Limit history length
                    if (newPast.length > MAX_HISTORY_LENGTH) {
                        newPast.shift(); // Remove oldest action
                    }

                    const updatedState = {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: newPast,
                                future: [], // Clear future when new action is recorded
                            },
                        },
                        activeTransactions: {
                            ...state.activeTransactions,
                            [presentationId]: null, // Clear the active transaction
                        },
                    };
                    console.debug('commit transaction', state, updatedState);
                    return updatedState;
                });
            },

            cancelTransaction: (presentationId: string) => {
                set(state => ({
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: null,
                    },
                }));
            },

            recordAction: action => {
                console.debug('Recording Action:', {
                    type: action.type,
                    description: action.description,
                    presentationId: action.presentationId,
                    slideId: action.slideId,
                    elementId: action.elementId,
                    before: JSON.stringify(action.before),
                    after: JSON.stringify(action.after),
                });

                const presentationId = action.presentationId;

                // If there's an active transaction, add to it
                if (get().activeTransactions[presentationId]) {
                    console.debug('Action is part of an active transaction');
                    get().recordTransactionAction(action);
                    return;
                }

                // Initialize history if needed
                if (!get().history[presentationId]) {
                    get().initHistory(presentationId);
                }

                // Generate changes using deep-diff library
                const changes = deepDiff.diff(action.before, action.after) || [];

                set(state => {
                    // When a new action is recorded, future is cleared
                    const historyEntry: HistoryAction = {
                        ...action,
                        changes,
                        timestamp: Date.now(),
                    };

                    const presentationHistory = state.history[presentationId];
                    const newPast = [...presentationHistory.past, historyEntry];

                    // Limit history length
                    if (newPast.length > MAX_HISTORY_LENGTH) {
                        newPast.shift(); // Remove oldest action
                    }

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: newPast,
                                future: [], // Clear future when new action is recorded
                            },
                        },
                    };
                });
            },

            undo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => {
                // If there's an active transaction, cancel it
                if (get().activeTransactions[presentationId]) {
                    console.debug('Cancelling active transaction before undo');
                    get().cancelTransaction(presentationId);
                }

                const presentationStore = usePresentationStore.getState();

                set(state => {
                    const presentationHistory = state.history[presentationId];

                    if (!presentationHistory || presentationHistory.past.length === 0) {
                        console.debug('Nothing to undo for presentation:', presentationId);
                        return state; // Nothing to undo
                    }

                    // Get the last action from past
                    const lastAction = presentationHistory.past[presentationHistory.past.length - 1];
                    console.debug('Undoing Action:', {
                        type: lastAction.type,
                        description: lastAction.description,
                        presentationId: lastAction.presentationId,
                        slideId: lastAction.slideId,
                        elementId: lastAction.elementId,
                        isTextElement: lastAction.isTextElement,
                    });

                    const newPast = presentationHistory.past.slice(0, -1);
                    const newFuture = [lastAction, ...presentationHistory.future];

                    // Get the current state
                    const currentState = { presentations: presentationStore.presentations };

                    const textElements = findTextElements(lastAction.before);

                    const contentMap = new Map(textElements.map(el => [el.id, el.content]));

                    // Then update the state
                    if (lastAction.changes && lastAction.changes.length > 0) {
                        const restoredState = revertDiffs(currentState, lastAction.changes);
                        presentationStore.setFullState(restoredState);
                    } else if (lastAction.before) {
                        presentationStore.setFullState(lastAction.before);
                    }

                    Object.keys(tiptapRefs.current.editors || {}).forEach(elementId => {
                        const content = contentMap.get(elementId);
                        if (
                            tiptapRefs.current.editors[elementId]?.editor &&
                            tiptapRefs.current.editors[elementId].editor.getHTML() !== content
                        ) {
                            tiptapRefs.current.editors[elementId].editor.commands.setContent(content);
                        }
                    });

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: newPast,
                                future: newFuture,
                            },
                        },
                    };
                });
            },

            redo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => {
                // If there's an active transaction, cancel it
                if (get().activeTransactions[presentationId]) {
                    get().cancelTransaction(presentationId);
                }

                const presentationStore = usePresentationStore.getState();

                set(state => {
                    const presentationHistory = state.history[presentationId];

                    if (!presentationHistory || presentationHistory.future.length === 0) {
                        return state; // Nothing to redo
                    }

                    // Get the first action from future
                    const nextAction = presentationHistory.future[0];
                    const newFuture = presentationHistory.future.slice(1);
                    const newPast = [...presentationHistory.past, nextAction];

                    // Get the current state
                    const currentState = { presentations: presentationStore.presentations };

                    const textElements = findTextElements(nextAction.after);

                    const contentMap = new Map(textElements.map(el => [el.id, el.content]));

                    // First collect all text editor elements and their paths that need updates
                    // const textEditorUpdates: {
                    //     elementId: string;
                    //     content: any;
                    //     pathToElement: string[];
                    // }[] = [];

                    // nextAction.changes.forEach(change => {
                    //     if (change.kind === 'E') {
                    //         const lastKey = change.path?.[change.path.length - 1];

                    //         if (lastKey === 'content') {
                    //             const pathToElement = change.path!.slice(0, -1);
                    //             const changedObject = getValueByPath(currentState, pathToElement) as BaseElement;

                    //             const elementConfig = getElementConfig(changedObject.elementTypeId);

                    //             if (elementConfig?.hasTextEditor) {
                    //                 textEditorUpdates.push({
                    //                     elementId: changedObject.id,
                    //                     content: change.rhs,
                    //                     pathToElement,
                    //                 });
                    //             }
                    //         }
                    //     }
                    // });

                    // Then update the state
                    if (nextAction.changes && nextAction.changes.length > 0) {
                        // Use deep-diff to apply changes
                        const restoredState = applyDiffs(currentState, nextAction.changes);
                        presentationStore.setFullState(restoredState);

                        nextAction.changes.forEach(change => {
                            if (change.kind === 'E') {
                                const lastKey = change.path?.[change.path.length - 1];

                                if (lastKey === 'content') {
                                    const pathToElement = change.path!.slice(0, -1);
                                    const changedObject = getValueByPath(restoredState, pathToElement) as BaseElement;

                                    const elementConfig = getElementConfig(changedObject.elementTypeId);

                                    if (elementConfig?.hasTextEditor) {
                                        if (tiptapRefs.current.editors?.[changedObject.id]?.editor) {
                                            const element = getValueByPath(
                                                currentState,
                                                pathToElement
                                            ) as EditorElement;
                                            tiptapRefs.current.editors[changedObject.id].editor.commands.setContent(
                                                element.content
                                            );
                                        }

                                        // textEditorUpdates.push({
                                        //     elementId: changedObject.id,
                                        //     content: change.rhs,
                                        //     pathToElement,
                                        // });
                                    }
                                }
                            }
                        });
                    } else if (nextAction.after) {
                        // Fallback to using the after state if available
                        presentationStore.setFullState(nextAction.after);
                    }

                    Object.keys(tiptapRefs.current.editors || {}).forEach(elementId => {
                        const content = contentMap.get(elementId);
                        if (
                            tiptapRefs.current.editors[elementId]?.editor &&
                            tiptapRefs.current.editors[elementId].editor.getHTML() !== content
                        ) {
                            tiptapRefs.current.editors[elementId].editor.commands.setContent(content);
                        }
                    });

                    // Finally update all text editors with their new content
                    // textEditorUpdates.forEach(update => {
                    //     if (tiptapRefs.current.editors?.[update.elementId]?.editor) {
                    //         const element = getValueByPath(currentState, update.pathToElement) as EditorElement;
                    //         tiptapRefs.current.editors[update.elementId].editor.commands.setContent(element.content);
                    //     }
                    // });

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: newPast,
                                future: newFuture,
                            },
                        },
                    };
                });
            },

            canUndo: (presentationId: string | null) => {
                if (presentationId) {
                    const presentationHistory = get().history[presentationId];
                    return !!presentationHistory && presentationHistory.past.length > 0;
                }
                return false;
            },

            canRedo: (presentationId: string | null) => {
                if (presentationId) {
                    const presentationHistory = get().history[presentationId];
                    return !!presentationHistory && presentationHistory.future.length > 0;
                }
                return false;
            },

            clearHistory: (presentationId: string) => {
                set(state => ({
                    history: {
                        ...state.history,
                        [presentationId]: {
                            past: [],
                            future: [],
                        },
                    },
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: null,
                    },
                }));
            },

            getHistory: (presentationId: string) => {
                const presentationHistory = get().history[presentationId];
                if (!presentationHistory) {
                    return [];
                }
                return presentationHistory.past;
            },

            hasActiveTransaction: (presentationId: string) => {
                return !!get().activeTransactions[presentationId];
            },
        }),
        {
            name: 'history-store',
            enabled: true,
        }
    )
);
