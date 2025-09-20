import { useUIStateStore } from '@/store/uiStateStore';

// Утилитная функция для показа модального окна подписки
export const showSubscriptionModal = () => {
    useUIStateStore.getState().openSubscriptionModal();
};
