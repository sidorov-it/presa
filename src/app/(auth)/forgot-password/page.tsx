'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Failed to send reset link');
                setIsLoading(false);
                return;
            }

            // Success, show success message
            setIsSubmitted(true);
            setIsLoading(false);
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Восстановить пароль</h1>
                    <p className="mt-2 text-center text-sm text-gray-600">
            Мы отправим вам ссылку для сброса пароля
                    </p>
                </div>

                {isSubmitted ? (
                    <div className="bg-green-50 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Ссылка для сброса отправлена</h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>Мы отправили ссылку для сброса пароля на {email}. Пожалуйста, проверьте ваш почтовый ящик.</p>
                                </div>
                                <div className="mt-4">
                                    <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Вернуться на страницу входа
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Вернуться на страницу входа
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Отправляем ссылку...' : 'Отправить ссылку'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}