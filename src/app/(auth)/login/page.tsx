import type { Metadata } from 'next';
import LoginPage from './page.client';

export const metadata: Metadata = {
    title: 'Вход в систему',
    description: 'Авторизация пользователя в сервисе',
};

export default function LoginPageWrapper() {
    return <LoginPage />;
}
