import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { TokenPackage, TokenTransaction } from '@/types/tokens';

interface UseTokensReturn {
    balance: number;
    loading: boolean;
    error: string | null;
    packages: TokenPackage[];
    transactions: TokenTransaction[];
    refreshBalance: () => Promise<void>;
    refreshPackages: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

export const useTokens = (): UseTokensReturn => {
    const { data: session } = useSession();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [packages, setPackages] = useState<TokenPackage[]>([]);
    const [transactions, setTransactions] = useState<TokenTransaction[]>([]);

    const refreshBalance = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch('/api/tokens/balance');
            if (!response.ok) throw new Error('Failed to fetch balance');

            const data = await response.json();
            setBalance(data.balance);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch balance');
        }
    }, [session?.user?.id]);

    const refreshPackages = useCallback(async () => {
        try {
            const response = await fetch('/api/tokens/packages');
            if (!response.ok) throw new Error('Failed to fetch packages');

            const data = await response.json();
            setPackages(data.packages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch packages');
        }
    }, []);

    const refreshTransactions = useCallback(async () => {
        if (!session?.user?.id) return;

        try {
            const response = await fetch('/api/tokens/transactions');
            if (!response.ok) throw new Error('Failed to fetch transactions');

            const data = await response.json();
            setTransactions(data.transactions);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
        }
    }, [session?.user?.id]);

    // Load initial data
    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                await Promise.all([refreshBalance(), refreshPackages(), refreshTransactions()]);
            } finally {
                setLoading(false);
            }
        };

        if (session?.user?.id) {
            loadInitialData();
        } else {
            setLoading(false);
        }
    }, [session?.user?.id, refreshBalance, refreshPackages, refreshTransactions]);

    return {
        balance,
        loading,
        error,
        packages,
        transactions,
        refreshBalance,
        refreshPackages,
        refreshTransactions,
    };
};
