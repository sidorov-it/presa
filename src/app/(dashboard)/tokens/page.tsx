import { Suspense } from 'react';
import Tokens from './Tokens';
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'Токены',
    description: 'Покупка и управление токенами',
};

export default function TokensPage() {
    return (
        <Suspense>
            <Script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" />

            <Tokens />
        </Suspense>
    );
}
