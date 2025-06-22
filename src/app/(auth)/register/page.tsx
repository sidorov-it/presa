import type { Metadata } from 'next';
import RegisterPage from './page.client';

export const metadata: Metadata = {
    title: 'Регистрация',
    description: 'Создание новой учетной записи',
};

export default function RegisterWrapper() {
    return <RegisterPage />;
}
