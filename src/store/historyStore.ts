import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usePresentationStore } from './presentationStore';

// Define history action types
export type HistoryAction = {
    type: 'layout' | 'element' | 'presentation' | 'slide' | 'column'; // type of entity modified
    description: string; // descriptive info about the action
    presentationId: string; // which presentation was modified
    slideId?: string; // which slide was modified (if applicable)
    layoutId?: string; // which layout was modified (if applicable)
    elementId?: string; // which element was modified (if applicable)
    columnId?: string; // which column was modified (if applicable)
    alignment?: 'top' | 'center' | 'bottom'; // which alignment was modified (if applicable)
    position?: 'left' | 'right'; // which position was modified (if applicable)
    before: any; // state before the change
    after: any; // state after the change
    timestamp: number; // when the action happened
    transactionId?: string; // ID to group related actions
};

interface HistoryState {
    // History stacks by presentation
    history: {
        [presentationId: string]: {
            past: HistoryAction[];
            future: HistoryAction[];
        }
    };

    // Track active transactions
    activeTransactions: {
        [presentationId: string]: {
            transactionId: string;
            actions: Omit<HistoryAction, 'timestamp'>[];
            description: string;
        } | null
    };

    // Initialize history for a presentation
    initHistory: (presentationId: string) => void;

    // Record a new action in the history
    recordAction: (action: Omit<HistoryAction, 'timestamp' | 'transactionId'>) => void;

    // Start a transaction (group of actions that will be treated as one)
    beginTransaction: (presentationId: string, description: string) => string;

    // Record an action as part of an active transaction
    recordTransactionAction: (action: Omit<HistoryAction, 'timestamp' | 'transactionId'>) => void;

    // Commit all actions in a transaction as a single history entry
    commitTransaction: (presentationId: string) => void;

    // Discard an active transaction without recording it
    cancelTransaction: (presentationId: string) => void;

    // Undo the last action
    undo: (presentationId: string) => void;

    // Redo the last undone action
    redo: (presentationId: string) => void;

    // Check if undo is available
    canUndo: (presentationId: string) => boolean;

    // Check if redo is available
    canRedo: (presentationId: string) => boolean;

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

export const useHistoryStore = create<HistoryState>()(
    devtools(
        (set, get) => ({
            history: {},
            activeTransactions: {},

            initHistory: (presentationId: string) => {
                set((state) => {
                    if (state.history[presentationId]) {
                        return state; // Already initialized
                    }

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: [],
                                future: []
                            }
                        },
                        activeTransactions: {
                            ...state.activeTransactions,
                            [presentationId]: null
                        }
                    };
                });
            },

            beginTransaction: (presentationId: string, description: string) => {
                // Initialize history if needed
                if (!get().history[presentationId]) {
                    get().initHistory(presentationId);
                }

                const transactionId = generateTransactionId();

                set((state) => ({
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: {
                            transactionId,
                            actions: [],
                            description
                        }
                    }
                }));

                return transactionId;
            },

            recordTransactionAction: (action) => {
                console.debug('recordTransactionAction', action);
                const presentationId = action.presentationId;
                const activeTransaction = get().activeTransactions[presentationId];

                if (!activeTransaction) {
                    // If no active transaction, just record as a regular action
                    get().recordAction(action);
                    return;
                }

                set((state) => ({
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: {
                            ...activeTransaction,
                            actions: [...activeTransaction.actions, action]
                        }
                    }
                }));
            },

            commitTransaction: (presentationId: string) => {
                const activeTransaction = get().activeTransactions[presentationId];

                if (!activeTransaction || activeTransaction.actions.length === 0) {
                    // No transaction or empty transaction - nothing to commit
                    set((state) => {
                        const updatedState = {
                            activeTransactions: {
                                ...state.activeTransactions,
                                [presentationId]: null
                            }
                        }
                        console.debug('commit transaction', state, updatedState);
                        return updatedState;
                    });
                    return;
                }

                // Create a combined history action representing the entire transaction
                const firstAction = activeTransaction.actions[0];
                const lastAction = activeTransaction.actions[activeTransaction.actions.length - 1];

                const combinedAction: HistoryAction = {
                    type: firstAction.type,
                    description: activeTransaction.description,
                    presentationId,
                    slideId: firstAction.slideId,
                    layoutId: firstAction.layoutId,
                    elementId: firstAction.elementId,
                    before: firstAction.before,
                    after: lastAction.after,
                    timestamp: Date.now(),
                    transactionId: activeTransaction.transactionId
                };

                // Record the combined action
                set((state) => {
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
                                future: [] // Clear future when new action is recorded
                            }
                        },
                        activeTransactions: {
                            ...state.activeTransactions,
                            [presentationId]: null // Clear the active transaction
                        }
                    };
                    console.debug('commit transaction', state, updatedState);
                    return updatedState;
                });
            },

            cancelTransaction: (presentationId: string) => {
                set((state) => ({
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: null
                    }
                }));
            },

            recordAction: (action) => {
                console.debug('recordAction', action);
                const presentationId = action.presentationId;

                // If there's an active transaction, add to it
                if (get().activeTransactions[presentationId]) {
                    get().recordTransactionAction(action);
                    return;
                }

                // Initialize history if needed
                if (!get().history[presentationId]) {
                    get().initHistory(presentationId);
                }

                set((state) => {
                    // When a new action is recorded, future is cleared
                    const historyEntry = {
                        ...action,
                        timestamp: Date.now()
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
                                future: [] // Clear future when new action is recorded
                            }
                        }
                    };
                });
            },

            undo: (presentationId: string) => {
                // If there's an active transaction, cancel it
                if (get().activeTransactions[presentationId]) {
                    get().cancelTransaction(presentationId);
                }

                const presentationStore = usePresentationStore.getState();

                set((state) => {
                    const presentationHistory = state.history[presentationId];

                    if (!presentationHistory || presentationHistory.past.length === 0) {
                        return state; // Nothing to undo
                    }

                    // Get the last action from past
                    const lastAction = presentationHistory.past[presentationHistory.past.length - 1];
                    const newPast = presentationHistory.past.slice(0, -1);
                    const newFuture = [lastAction, ...presentationHistory.future];

                    // Restore the entire state to what it was before this action
                    if (lastAction.before && typeof lastAction.before === 'object') {
                        // Directly restore the full state
                        presentationStore.setFullState(lastAction.before);
                    }

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: newPast,
                                future: newFuture
                            }
                        }
                    };
                });
            },

            redo: (presentationId: string) => {
                // If there's an active transaction, cancel it
                if (get().activeTransactions[presentationId]) {
                    get().cancelTransaction(presentationId);
                }

                const presentationStore = usePresentationStore.getState();

                set((state) => {
                    const presentationHistory = state.history[presentationId];

                    if (!presentationHistory || presentationHistory.future.length === 0) {
                        return state; // Nothing to redo
                    }

                    // Get the first action from future
                    const nextAction = presentationHistory.future[0];
                    const newFuture = presentationHistory.future.slice(1);
                    const newPast = [...presentationHistory.past, nextAction];

                    // Restore the entire state to what it was after this action
                    if (nextAction.after && typeof nextAction.after === 'object') {
                        // Directly restore the full state
                        presentationStore.setFullState(nextAction.after);
                    }

                    return {
                        history: {
                            ...state.history,
                            [presentationId]: {
                                past: newPast,
                                future: newFuture
                            }
                        }
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
                set((state) => ({
                    history: {
                        ...state.history,
                        [presentationId]: {
                            past: [],
                            future: []
                        }
                    },
                    activeTransactions: {
                        ...state.activeTransactions,
                        [presentationId]: null
                    }
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
            }
        }),
        {
            name: 'history-store',
            enabled: true
        }
    )
);