import type { Metadata } from 'next';
import ThemesPage from './page.client';

export const metadata: Metadata = {
    title: 'Темы оформления',
    description: 'Создание и управление темами для презентаций',
};

export default function ThemesWrapper() {
    return <ThemesPage />;
}
