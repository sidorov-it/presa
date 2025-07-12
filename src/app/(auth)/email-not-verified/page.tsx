import type { Metadata } from 'next';
import EmailNotVerifiedPage from './page.client';

export const metadata: Metadata = {
    title: 'Подтвердите почту',
};

export default function Wrapper() {
    return <EmailNotVerifiedPage />;
}
