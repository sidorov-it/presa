import type { Metadata } from 'next';
import HomeClient from './page.client';

export const metadata: Metadata = {
    title: 'Главная страница',
    description: 'Перенаправление на вход или панель управления',
};

export default function HomePage() {
    return <HomeClient />;
}
