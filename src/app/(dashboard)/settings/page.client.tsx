'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import styles from './page.module.css';


const SettingsPage = () => {
    const { data: session, update } = useSession();
    const [name, setName] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [emailUpdates, setEmailUpdates] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthentication = async () => {
        try {
            console.log('Checking authentication status...');
            const authResponse = await fetch('/api/auth/check');
            const authData = await authResponse.json();
            console.log('Authentication check result:', authData);

            if (!authData.authenticated) {
                console.error('User not authenticated properly');
                toast.error('Ошибка аутентификации. Пожалуйста, войдите снова.');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Authentication check error:', error);
            toast.error('Ошибка аутентификации. Попробуйте ещё раз.');
            return false;
        }
    };

    // Update name whenever session changes
    useEffect(() => {
        if (session?.user?.name) {
            setName(session.user.name);
        }
    }, [session?.user?.name]);

    // Load user preferences
    useEffect(() => {
        const fetchUserPreferences = async () => {
            const isAuthenticated = await checkAuthentication();
            if (!isAuthenticated) return;

            try {
                console.log('Fetching user preferences...');
                const response = await fetch('/api/user/preferences');
                console.log('Preferences response status:', response.status);

                if (response.status === 401) {
                    console.log('User not authenticated, cannot fetch preferences');
                    setIsLoading(false);
                    return;
                }

                const data = await response.json();
                console.log('Preferences data:', data);

                if (response.ok) {
                    if (data.emailUpdates !== undefined) {
                        setEmailUpdates(data.emailUpdates);
                        console.log('Setting email updates to:', data.emailUpdates);
                    } else {
                        console.log('No email preferences found in response, using default');
                        setEmailUpdates(true);
                    }
                } else {
                    console.error('Error fetching preferences:', data.message);
                    toast.error('Не удалось загрузить настройки');
                }
            } catch (error) {
                console.error('Error fetching preferences:', error);
                toast.error('Не удалось загрузить настройки');
            } finally {
                setIsLoading(false);
            }
        };

        if (session?.user) {
            console.log('Session is available, user ID:', session.user.id, 'name:', session.user.name);
            fetchUserPreferences();
        } else {
            console.log('No session available');
            setIsLoading(false);
        }
    }, [session]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        console.log('Saving profile with name:', name);
        console.log('User session ID:', session?.user?.id);

        // Check authentication before proceeding
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            setIsSaving(false);
            return;
        }

        try {
            console.log('Making API request to /api/user/profile');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name }),
            });
            console.log('Profile update response status:', response.status);

            const data = await response.json();
            console.log('Profile update response data:', data);

            if (!response.ok) {
                throw new Error(data.message || 'Не удалось обновить профиль');
            }

            // Update the session to reflect the name change
            console.log('Updating session with new name');
            await update({
                user: { name },
            });
            console.log('Session updated successfully');

            toast.success('Профиль успешно обновлён');
        } catch (error) {
            console.error('Profile update error complete details:', error);
            toast.error(error instanceof Error ? error.message : 'Не удалось обновить профиль');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Новые пароли не совпадают');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('Пароль должен содержать не менее 8 символов');
            return;
        }

        setIsSaving(true);

        // Check authentication before proceeding
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            setIsSaving(false);
            return;
        }

        try {
            const response = await fetch('/api/user/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Не удалось изменить пароль');
            }

            toast.success('Пароль успешно изменён');

            // Reset password fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Не удалось изменить пароль');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEmailPreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Check authentication before proceeding
        const isAuthenticated = await checkAuthentication();
        if (!isAuthenticated) {
            setIsSaving(false);
            return;
        }

        console.log('Saving email preferences, updates set to:', emailUpdates);

        try {
            const response = await fetch('/api/user/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailUpdates,
                }),
            });

            const data = await response.json();
            console.log('Email preferences response:', response.status, data);

            if (!response.ok) {
                throw new Error(data.message || 'Не удалось обновить настройки');
            }

            toast.success('Настройки почты обновлены');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Не удалось обновить настройки');
            console.error('Email preferences error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Heading title="Настройки" description="Управление настройками учетной записи и предпочтениями" />
            </div>

            <div className={styles.settingsGrid}>
                <Card>
                    <CardHeader>
                        <CardTitle>Настройки профиля</CardTitle>
                        <CardDescription>Обновление персональной информации</CardDescription>
                    </CardHeader>
                    <CardContent className={styles.cardContent}>
                        <form onSubmit={handleSaveProfile} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name" className={styles.label}>
                                    Имя
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className={styles.input}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="email" className={styles.label}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={session?.user?.email || ''}
                                    className={`${styles.input} ${styles.inputDisabled}`}
                                    readOnly
                                />
                                <p className={styles.helperText}>Адрес электронной почты не может быть изменен</p>
                            </div>
                            <Button type="submit" disabled={isSaving} className={styles.submitButton}>
                                {isSaving ? 'Сохранение...' : 'Сохранить профиль'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Изменение пароля</CardTitle>
                        <CardDescription>Обновление пароля учетной записи</CardDescription>
                    </CardHeader>
                    <CardContent className={styles.cardContent}>
                        <form onSubmit={handleChangePassword} className={styles.form}>
                            <div className={styles.formGroup}>
                                <label htmlFor="currentPassword" className={styles.label}>
                                    Текущий пароль
                                </label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="newPassword" className={styles.label}>
                                    Новый пароль
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className={styles.input}
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword" className={styles.label}>
                                    Подтвердить новый пароль
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className={styles.input}
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={isSaving} className={styles.submitButton}>
                                {isSaving ? 'Изменение...' : 'Изменить пароль'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Настройки электронной почты</CardTitle>
                        <CardDescription>Управление настройками уведомлений</CardDescription>
                    </CardHeader>
                    <CardContent className={styles.cardContent}>
                        <form onSubmit={handleEmailPreferences} className={styles.form}>
                            <div className={styles.emailPreferences}>
                                <div>
                                    <label htmlFor="emailUpdates" className={styles.label}>
                                        Обновления и уведомления
                                    </label>
                                    <p className={styles.emailPreferencesDescription}>
                                        Получать электронные письма о продуктовых обновлениях и уведомлениях
                                    </p>
                                </div>
                                <div className={styles.checkboxGroup}>
                                    <input
                                        type="checkbox"
                                        id="emailUpdates"
                                        checked={emailUpdates}
                                        onChange={e => {
                                            const newValue = e.target.checked;
                                            console.log('Checkbox toggled to:', newValue);
                                            setEmailUpdates(newValue);
                                        }}
                                        className={styles.checkbox}
                                    />
                                </div>
                            </div>
                            <Button type="submit" disabled={isSaving} className={styles.submitButton}>
                                {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;
