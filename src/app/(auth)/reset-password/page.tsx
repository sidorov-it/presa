'use client';

import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPassword from './ResetPassword';

export const metadata: Metadata = {
    title: 'Сброс пароля',
    description: 'Страница для установки нового пароля',
};

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPassword />
        </Suspense>
    );
}
