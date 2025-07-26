import type { Metadata } from 'next';
import ImportPage from './page.client';

export const metadata: Metadata = {
    title: 'Импорт презентации',
    description: 'Загрузите экспортированную презентацию',
};

export default function ImportWrapper() {
    return <ImportPage />;
}
