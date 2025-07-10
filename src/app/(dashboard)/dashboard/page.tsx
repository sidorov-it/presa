import type { Metadata } from 'next';
import DashboardPage from './page.client';

export const metadata: Metadata = {
    title: 'Presa – Мои презентации',
    description: 'Управление и редактирование ваших презентаций',
};

export default function DashboardWrapper() {
    return <DashboardPage />;
}
