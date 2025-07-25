import { Suspense } from 'react';
import ErrorPageClient from './page.client';

export default function ErrorPageWrapper() {
    return (
        <Suspense fallback={null}>
            <ErrorPageClient />
        </Suspense>
    );
}
