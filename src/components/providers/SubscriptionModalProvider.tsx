'use client';

import React from 'react';
import { useSubscriptionModal } from '@/hooks/useSubscriptionModal';
import SubscriptionModal from '@/components/ui/SubscriptionModal';

export const SubscriptionModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isOpen, hideSubscriptionModal } = useSubscriptionModal();

    return (
        <>
            {children}
            <SubscriptionModal isOpen={isOpen} onClose={hideSubscriptionModal} />
        </>
    );
};
