import { Suspense } from 'react';
import Tokens from './Tokens';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Токены',
    description: 'Покупка и управление токенами',
};

export default function TokensPage() {
    return (
        <Suspense>
            <Tokens />
        </Suspense>
    );
}
