import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook to perform subscription health check on client side
 * This replaces the middleware-based approach which can't access the database
 */
export const useSubscriptionHealthCheck = () => {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            // Perform health check via API call instead of direct DB access
            fetch('/api/subscriptions/health-check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }).catch(error => {
                console.error('Background subscription health check failed:', error);
            });
        }
    }, [session?.user?.id, status]);
}; 