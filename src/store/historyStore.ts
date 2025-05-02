import { MutableRefObject } from 'react';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import deepDiff from 'deep-diff';
import { BaseElement, TipTapRefs } from '@/types';
import { usePresentationStore } from './presentationStore';
import getValueByPath from '@/utils/getValueByPath';
import { getElementConfig } from '@/elements/registry';

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
    canUndo: (presentationId: string) => boolean;

    // Check if redo is available
    canRedo: (presentationId: string) => boolean;

    // Clear history for a presentation
    clearHistory: (presentationId: string) => void;

    // Get presentation history
    getHistory: (presentationId: string) => HistoryAction[];
    getHistoryDiff: (presentationId: string, future?: boolean) => void;

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
    for (let i = diffs.length - 1; i >= 0; i--) {
        deepDiff.revertChange(newState, {}, diffs[i]);
    }

    return newState;
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
                        [presentationId]: [transactionAction],
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

                console.log('deep-diff changes', changes);

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
                console.log('Recording Action:', {
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
                    console.log('Action is part of an active transaction');
                    get().recordTransactionAction(action);
                    return;
                }

                // Initialize history if needed
                if (!get().history[presentationId]) {
                    get().initHistory(presentationId);
                }

                // Generate changes using deep-diff library
                const changes = deepDiff.diff(action.before, action.after) || [];

                console.log('deep-diff changes', changes);

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
                    console.log('Cancelling active transaction before undo');
                    get().cancelTransaction(presentationId);
                }

                const presentationStore = usePresentationStore.getState();

                set(state => {
                    const presentationHistory = state.history[presentationId];

                    if (!presentationHistory || presentationHistory.past.length === 0) {
                        console.log('Nothing to undo for presentation:', presentationId);
                        return state; // Nothing to undo
                    }

                    // Get the last action from past
                    const lastAction = presentationHistory.past[presentationHistory.past.length - 1];
                    console.log('Undoing Action:', {
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

                    lastAction.changes.forEach(change => {
                        if (change.kind === 'E') {
                            const lastKey = change.path?.[change.path.length - 1];

                            if (lastKey === 'content') {
                                const changedObject = getValueByPath(
                                    currentState,
                                    change.path!.slice(0, -1)
                                ) as BaseElement;

                                const elementConfig = getElementConfig(changedObject.elementTypeId);

                                if (elementConfig?.hasTextEditor) {
                                    tiptapRefs.current.editors?.[changedObject.id]?.editor.commands.setContent(
                                        change.lhs
                                    );
                                }
                            }
                        }
                    });

                    if (lastAction.changes && lastAction.changes.length > 0) {
                        // Use deep-diff to revert changes
                        const restoredState = revertDiffs(currentState, lastAction.changes);
                        presentationStore.setFullState(restoredState);
                    } else if (lastAction.before) {
                        // Fallback to using the before state if available
                        presentationStore.setFullState(lastAction.before);
                    }

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

                    nextAction.changes.forEach(change => {
                        if (change.kind === 'E') {
                            const lastKey = change.path?.[change.path.length - 1];

                            if (lastKey === 'content') {
                                const changedObject = getValueByPath(
                                    currentState,
                                    change.path!.slice(0, -1)
                                ) as BaseElement;

                                const elementConfig = getElementConfig(changedObject.elementTypeId);

                                if (elementConfig?.hasTextEditor) {
                                    tiptapRefs.current.editors?.[changedObject.id]?.editor.commands.setContent(
                                        change.rhs
                                    );
                                }
                            }
                        }
                    });

                    if (nextAction.changes && nextAction.changes.length > 0) {
                        // Use deep-diff to apply changes
                        const restoredState = applyDiffs(currentState, nextAction.changes);
                        presentationStore.setFullState(restoredState);
                    } else if (nextAction.after) {
                        // Fallback to using the after state if available
                        presentationStore.setFullState(nextAction.after);
                    }

                    // if (nextAction.isTextElement && nextAction.elementId) {
                    //     tiptapRefs.current.editors?.[nextAction.elementId]?.editor.commands.undo();
                    // }

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

            canUndo: (presentationId: string) => {
                const presentationHistory = get().history[presentationId];
                return !!presentationHistory && presentationHistory.past.length > 0;
            },

            canRedo: (presentationId: string) => {
                const presentationHistory = get().history[presentationId];
                return !!presentationHistory && presentationHistory.future.length > 0;
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

            getHistoryDiff: (presentationId, future = false) => {
                const presentationHistory = get().history[presentationId];

                const key = future ? 'future' : 'past';
                presentationHistory[key].forEach(action => {
                    console.log('Action:', action.description);
                    console.log('Changes:', action.changes);
                });
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
