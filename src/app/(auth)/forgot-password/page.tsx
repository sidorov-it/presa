import type { Metadata } from 'next';
import ForgotPasswordPage from './page.client';

export const metadata: Metadata = {
    title: 'Восстановление пароля',
    description: 'Запрос на ссылку для восстановления пароля',
};

export default function ForgotPasswordWrapper() {
    return <ForgotPasswordPage />;
}
