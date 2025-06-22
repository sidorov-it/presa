import type { Metadata } from 'next';
import ThemesPage from './page.client';

export const metadata: Metadata = {
    title: 'Темы',
    description: 'Настройка тем оформления презентаций',
};

export default function ThemesWrapper() {
    return <ThemesPage />;
}
