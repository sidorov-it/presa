import { useCallback } from 'react';
import { useUIStateStore } from '@/store/uiStateStore';

export const useSubscriptionModal = () => {
    const isOpen = useUIStateStore(state => state.isSubscriptionModalOpen);
    const openModal = useUIStateStore(state => state.openSubscriptionModal);
    const closeModal = useUIStateStore(state => state.closeSubscriptionModal);

    const showSubscriptionModal = useCallback(() => {
        openModal();
    }, [openModal]);

    const hideSubscriptionModal = useCallback(() => {
        closeModal();
    }, [closeModal]);

    return {
        isOpen,
        showSubscriptionModal,
        hideSubscriptionModal,
    };
};
