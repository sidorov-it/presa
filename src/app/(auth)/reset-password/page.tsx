'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInvalidToken, setIsInvalidToken] = useState(false);

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
            // Verify token is valid
            verifyToken(tokenParam);
        } else {
            setIsInvalidToken(true);
        }
    }, [searchParams]);

    const verifyToken = async (token: string) => {
        try {
            const response = await fetch('/api/auth/verify-reset-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
      
            if (!response.ok) {
                setIsInvalidToken(true);
            }
        } catch (error) {
            setIsInvalidToken(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }
    
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
    
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
    
        try {
            setIsLoading(true);
            setError('');
      
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });
      
            const data = await response.json();
      
            if (!response.ok) {
                setError(data.message || 'Failed to reset password');
                setIsLoading(false);
                return;
            }
      
            // Success
            setIsSuccess(true);
            setIsLoading(false);
      
            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error) {
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    };

    if (isInvalidToken) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Invalid or Expired Token</h1>
                        <p className="mt-2 text-center text-sm text-gray-600">
              This password reset link is invalid or has expired.
                        </p>
                    </div>
                    <div className="text-center mt-4">
                        <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Request a new password reset link
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Set new password</h1>
                    <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
                    </p>
                </div>
        
                {isSuccess ? (
                    <div className="bg-green-50 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Password reset successful</h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>Your password has been reset successfully. You'll be redirected to the login page in a few seconds.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label htmlFor="password" className="sr-only">New password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="New password"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">Confirm new password</label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center">{error}</div>
                        )}

                        <div>
                            <button
                                type="submit"
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Resetting password...' : 'Reset password'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
} 