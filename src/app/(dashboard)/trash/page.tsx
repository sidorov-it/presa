import type { Metadata } from 'next';
import TrashPage from './page.client';

export const metadata: Metadata = {
    title: 'Presa – Корзина',
    description: 'Удаленные презентации и возможность их восстановления',
};

export default function TrashWrapper() {
    return <TrashPage />;
}
