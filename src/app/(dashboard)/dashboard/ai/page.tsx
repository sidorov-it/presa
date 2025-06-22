import type { Metadata } from 'next';
import AIGeneratorPage from './page.client';

export const metadata: Metadata = {
    title: 'Генерация презентации ИИ',
    description: 'Создайте презентацию автоматически с помощью искусственного интеллекта',
};

export default function AIGeneratorWrapper() {
    return <AIGeneratorPage />;
}
