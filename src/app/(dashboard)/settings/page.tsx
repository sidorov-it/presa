import type { Metadata } from 'next';
import SettingsPage from './page.client';

export const metadata: Metadata = {
    title: 'Presa – Настройки',
    description: 'Управление параметрами учетной записи',
};

export default function SettingsWrapper() {
    return <SettingsPage />;
}
