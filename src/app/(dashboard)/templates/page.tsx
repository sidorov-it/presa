import type { Metadata } from 'next';
import TemplatesPage from './page.client';

export const metadata: Metadata = {
    title: 'Presa – Шаблоны презентаций',
    description: 'Выбор шаблона для новой презентации',
};

export default function TemplatesWrapper() {
    return <TemplatesPage />;
}
