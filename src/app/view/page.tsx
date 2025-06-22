import type { Metadata } from 'next';
import ViewerHomePage from './page.client';

export const metadata: Metadata = {
    title: 'Просмотр презентации',
    description: 'Введите идентификатор презентации для просмотра',
};

export default function ViewerHomeWrapper() {
    return <ViewerHomePage />;
}
