import { Suspense } from 'react';
import Tokens from './Tokens';

export default function TokensPage() {
    return (
        <Suspense>
            <Tokens />
        </Suspense>
    );
}
