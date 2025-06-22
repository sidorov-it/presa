import type { Metadata } from 'next';
import PresentationView from './page.client';

export const metadata: Metadata = {
    title: 'Просмотр презентации',
    description: 'Демонстрационный режим выбранной презентации',
};

export default function PresentationViewWrapper() {
    return <PresentationView />;
}
