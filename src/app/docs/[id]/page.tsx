import type { Metadata } from 'next';
import PresentationEditorPage from './page.client';

export const metadata: Metadata = {
    title: 'Редактор презентации',
    description: 'Страница редактирования выбранной презентации',
};

export default function PresentationEditorWrapper() {
    return <PresentationEditorPage />;
}
