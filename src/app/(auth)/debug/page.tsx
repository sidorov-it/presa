import { Suspense } from 'react';
import DebugPageClient from './page.client';

export default function DebugPageWrapper() {
    return (
        <Suspense fallback={null}>
            <DebugPageClient />
        </Suspense>
    );
} 