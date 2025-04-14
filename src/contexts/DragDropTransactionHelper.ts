import { useHistoryStore } from '@/store/historyStore';
import { usePresentationStore } from '@/store/presentationStore';

/**
 * A helper for wrapping complex drag and drop operations in history transactions
 * to ensure they can be undone/redone as a single atomic action
 */
export const DragDropTransactionHelper = {
    /**
     * Begins a transaction for a drag operation
     * @param presentationId The ID of the presentation
     * @param description A description of the operation
     * @returns The transaction ID
     */
    beginDragOperation: (presentationId: string, description: string) => {
        return useHistoryStore.getState().beginTransaction(presentationId, description);
    },

    /**
     * Commits a transaction for a drag operation
     * @param presentationId The ID of the presentation
     */
    commitDragOperation: (presentationId: string) => {
        useHistoryStore.getState().commitTransaction(presentationId);
    },

    /**
     * Cancels a transaction for a drag operation
     * @param presentationId The ID of the presentation
     */
    cancelDragOperation: (presentationId: string) => {
        useHistoryStore.getState().cancelTransaction(presentationId);
    },

    /**
     * Wraps multiple operations in a single transaction
     * @param presentationId The ID of the presentation
     * @param description A description of the operation
     * @param callback The function containing the operations to perform
     */
    wrapInTransaction: (presentationId: string, description: string, callback: () => void) => {
        const historyStore = useHistoryStore.getState();

        // Capture the entire state before changes
        const beforeState = { presentations: [...usePresentationStore.getState().presentations] };

        try {
            historyStore.beginTransaction(presentationId, description);
            callback();

            // Capture the entire state after changes
            const afterState = { presentations: [...usePresentationStore.getState().presentations] };

            // Record this as a presentation-level change with complete state
            historyStore.recordTransactionAction({
                type: 'presentation',
                description,
                presentationId,
                before: beforeState,
                after: afterState,
            });

            historyStore.commitTransaction(presentationId);
        } catch (error) {
            historyStore.cancelTransaction(presentationId);
            console.error('Error during drag-drop transaction:', error);
        }
    },

    /**
     * Updates a layout with transaction tracking
     */
    updateLayout: (presentationId: string, slideId: string, layoutId: string, data: any) => {
        const presentationStore = usePresentationStore.getState();
        const historyStore = useHistoryStore.getState();

        // Capture the entire state before changes
        const beforeState = { presentations: [...presentationStore.presentations] };

        // Perform the update operation
        presentationStore.updateLayout(presentationId, slideId, layoutId, data);

        // Capture the entire state after changes
        const afterState = { presentations: [...usePresentationStore.getState().presentations] };

        // Record this action within the current transaction
        historyStore.recordTransactionAction({
            type: 'layout',
            description: 'Update layout during drag-drop',
            presentationId,
            slideId,
            layoutId,
            before: beforeState,
            after: afterState,
        });
    },

    /**
     * Deletes a layout with transaction tracking
     */
    deleteLayout: (presentationId: string, slideId: string, layoutId: string) => {
        const presentationStore = usePresentationStore.getState();
        const historyStore = useHistoryStore.getState();

        // Capture the entire state before changes
        const beforeState = { presentations: [...presentationStore.presentations] };

        // Perform the delete operation
        presentationStore.deleteLayout(presentationId, slideId, layoutId);

        // Capture the entire state after changes
        const afterState = { presentations: [...usePresentationStore.getState().presentations] };

        // Record this action within the current transaction
        historyStore.recordTransactionAction({
            type: 'layout',
            description: 'Delete layout during drag-drop',
            presentationId,
            slideId,
            layoutId,
            before: beforeState,
            after: afterState,
        });
    },

    /**
     * Deletes a slide with transaction tracking
     */
    deleteSlide: (presentationId: string, slideId: string) => {
        const presentationStore = usePresentationStore.getState();
        const historyStore = useHistoryStore.getState();

        // Capture the entire state before changes
        const beforeState = { presentations: [...presentationStore.presentations] };

        // Perform the delete operation
        presentationStore.deleteSlide(presentationId, slideId);

        // Capture the entire state after changes
        const afterState = { presentations: [...usePresentationStore.getState().presentations] };

        // Record this action within the current transaction
        historyStore.recordTransactionAction({
            type: 'slide',
            description: 'Delete slide during drag-drop',
            presentationId,
            slideId,
            before: beforeState,
            after: afterState,
        });
    },

    /**
     * Adds a layout with transaction tracking
     */
    addLayout: (presentationId: string, slideId: string, layout: any, index?: number) => {
        const presentationStore = usePresentationStore.getState();
        const historyStore = useHistoryStore.getState();

        // Capture the entire state before changes
        const beforeState = { presentations: [...presentationStore.presentations] };

        // Perform the add operation
        const newLayoutId = presentationStore.addLayout(presentationId, slideId, layout, index);

        // Capture the entire state after changes
        const afterState = { presentations: [...usePresentationStore.getState().presentations] };

        // Record this action within the current transaction
        historyStore.recordTransactionAction({
            type: 'layout',
            description: 'Add layout during drag-drop',
            presentationId,
            slideId,
            layoutId: newLayoutId,
            before: beforeState,
            after: afterState,
        });

        return newLayoutId;
    },

    /**
     * Updates a slide with transaction tracking
     */
    updateSlide: (presentationId: string, slideId: string, data: any) => {
        const presentationStore = usePresentationStore.getState();
        const historyStore = useHistoryStore.getState();

        // Capture the entire state before changes
        const beforeState = { presentations: [...presentationStore.presentations] };

        // Perform the update operation
        presentationStore.updateSlide(presentationId, slideId, data);

        // Capture the entire state after changes
        const afterState = { presentations: [...usePresentationStore.getState().presentations] };

        // Record this action within the current transaction
        historyStore.recordTransactionAction({
            type: 'slide',
            description: 'Update slide during drag-drop',
            presentationId,
            slideId,
            before: beforeState,
            after: afterState,
        });
    },
};
