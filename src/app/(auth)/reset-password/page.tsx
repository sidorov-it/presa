import type { Metadata } from 'next';
import ResetPasswordPage from './page.client';

export const metadata: Metadata = {
    title: 'Сброс пароля',
    description: 'Страница для установки нового пароля',
};

export default function ResetPasswordWrapper() {
    return <ResetPasswordPage />;
}
