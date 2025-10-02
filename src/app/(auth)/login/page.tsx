import type { Metadata } from 'next';
import LoginPage from './page.client';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Вход в систему',
    description: 'Авторизация пользователя в сервисе',
};

export default function LoginPageWrapper() {
    return (
        <Suspense fallback={null}>
            <LoginPage />
        </Suspense>
    );
}
