'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ThemeEditor } from '@/components/theme/ThemeEditor';
import { ThemePreview } from '@/components/theme/ThemePreview';
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input/Input';
import { Label } from '@/components/ui/Label';
import { generateId } from '@/utils/id';

import styles from './page.module.css';
import { createNewTheme } from '@/constants/defaultTheme';
import FullPageLoader from '@/components/FullPageLoader/FullPageLoader';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';

const ThemeEditorPageContent = (props: { params: Promise<{ action: string }> }) => {
    const params = use(props.params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { addTheme, updateTheme, loadTheme, themes, defaultThemes, loadThemes } = useThemeStore();

    const isNewTheme = params.action === 'new';
    const existingTheme = !isNewTheme ? themes.find(t => t.id === params.action) : undefined;

    const [theme, setTheme] = useState<Theme | undefined>(() => {
        if (params.action === 'new') {
            const templateId = searchParams.get('template');
            if (templateId) {
                const tmpl = defaultThemes.find(t => t.id === templateId);
                if (tmpl) {
                    return {
                        ...tmpl,
                        id: generateId(),
                        isDefault: false,
                        isActive: true,
                        name: '',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                }
            }
            return createNewTheme();
        }

        return existingTheme;
    });

    const [isLoading, setIsLoading] = useState(params.action !== 'new' && !existingTheme);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        loadThemes().catch(err => {
            console.error('Failed to load themes:', err);
        });
    }, [loadThemes]);

    useEffect(() => {
        if (params.action === 'new') {
            return;
        }

        if (existingTheme) {
            setTheme(existingTheme);
            return;
        }

        const start = Date.now();
        loadTheme(params.action)
            .then((theme: Theme | null) => {
                if (theme) {
                    setTheme(theme);
                } else {
                    setNotFound(true);
                }
            })
            .catch(() => {
                setNotFound(true);
            })
            .finally(() => {
                const elapsed = Date.now() - start;
                const delay = elapsed < 300 ? 300 - elapsed : 0;
                setTimeout(() => setIsLoading(false), delay);
            });
    }, [loadTheme, params.action, existingTheme]);

    const handleSave = async () => {
        try {
            if (!theme) {
                return;
            }

            if (params.action === 'new') {
                await addTheme(theme);
                toast.success('Тема создана успешно');
            } else {
                await updateTheme(theme);
                toast.success('Тема обновлена успешно');
            }
            router.push('/themes');
        } catch (error) {
            console.error('Failed to save theme:', error);
            if (isLoading) {
                return (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                    </div>
                );
            }

            toast.error('Ошибка сохранения темы');
        }
    };

    if (!theme && ((isNewTheme && defaultThemes.length === 0) || (!isNewTheme && !theme))) {
        return <FullPageLoader />;
    }

    if (notFound) {
        return <NotFoundPage />;
    }

    return (
        <div className={styles.container}>
            {/* Left section with editor */}
            <div className={styles.leftSection}>
                <div className={styles.leftSectionContent}>
                    <div>
                        <Label htmlFor="theme-name" className={styles.label}>
                            Название темы
                        </Label>
                        <Input
                            id="theme-name"
                            value={theme?.name || ''}
                            onChange={e => setTheme({ ...theme!, name: e.target.value })}
                            placeholder="Название темы"
                            className={styles.input}
                        />
                    </div>

                    <ThemeEditor theme={theme!} onThemeChange={setTheme} />
                </div>

                <div className={styles.bottomSection}>
                    <Button variant="outline" onClick={() => router.push('/themes')}>
                        Отмена
                    </Button>
                    <Button variant="solid" colorScheme="blue" onClick={handleSave}>
                        Сохранить
                    </Button>
                </div>
            </div>

            {/* Right section with preview */}
            <div className={styles.rightSection}>
                <ThemePreview theme={theme!} />
            </div>
        </div>
    );
};

export default ThemeEditorPageContent;
