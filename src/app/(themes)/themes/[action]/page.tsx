import { Suspense } from 'react';
import ThemeEditorPageContent from './ThemeEditorPageContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Редактор темы',
    description: 'Создание и редактирование темы оформления',
};

export default function ThemeEditorPage(props: { params: Promise<{ action: string }> }) {
    return (
        <Suspense>
            <ThemeEditorPageContent params={props.params} />
        </Suspense>
    );
}
