'use client';

import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import styles from './page.module.css';
import ThemePreviewBlock from './components/ThemePreviewBlock';
import { useRouter } from 'next/navigation';
import { Tabs as ChakraTabs } from '@chakra-ui/react';
import { useThemeStore } from '@/store/themeStore';
import { getRequiredFontsFromTheme, loadFonts, unloadAllFonts } from '@/utils/fontLoader';

export default function ThemesPage() {
    const { themes, defaultThemes, loadThemes, loadDefaultThemes, addTheme, deleteTheme } = useThemeStore();
    const router = useRouter();
    const [tabIndex, setTabIndex] = useState(0);

    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
            toast.error('Failed to load themes');
        });
        loadDefaultThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes, loadDefaultThemes]);

    useEffect(() => {
        const allThemes = [...themes, ...defaultThemes];
        const uniqueFontUrls = new Set<string>();
        
        allThemes.forEach(theme => {
            const fontUrls = getRequiredFontsFromTheme(theme);
            fontUrls.forEach(url => uniqueFontUrls.add(url));
        });

        loadFonts(Array.from(uniqueFontUrls));

        return () => {
            unloadAllFonts();
        };
    }, [themes, defaultThemes]);

    const handleDuplicate = async (themeId: string) => {
        const theme = themes.find(theme => theme.id === themeId);
        if (theme) {
            await addTheme(theme);
            toast.success('Тема скопирована');
        }
    };

    const handleDelete = async (themeId: string) => {
        if (window.confirm('Are you sure you want to delete this theme?')) {
            try {
                await deleteTheme(themeId);
                toast.success('Theme deleted successfully');
            } catch (error) {
                console.error('Failed to delete theme:', error);
                toast.error('Failed to delete theme');
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Темы</h1>
                <Link href="/themes/new">
                    <Button className={styles.addButton}>
                        <Plus className={styles.buttonIcon} />
                        Новая тема
                    </Button>
                </Link>
            </div>

            <ChakraTabs.Root
                value={tabIndex === 0 ? 'my' : 'standard'}
                onValueChange={e => setTabIndex(e.value === 'my' ? 0 : 1)}
            >
                <ChakraTabs.List>
                    <ChakraTabs.Trigger value="my">Мои темы</ChakraTabs.Trigger>
                    <ChakraTabs.Trigger value="standard">Стандартные темы</ChakraTabs.Trigger>
                </ChakraTabs.List>
                <ChakraTabs.Content value="my">
                    {themes.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p className={styles.emptyMessage}>
                                <Link href="/themes/new" className={styles.link}>
                                    Создайте свою тему
                                </Link>{' '}
                                или{' '}
                                <button onClick={() => setTabIndex(1)} className={styles.link} type="button">
                                    используйте одну из стандартных
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div className={styles.themesGrid}>
                            {themes.map(theme => (
                                <ThemePreviewBlock
                                    key={theme.id}
                                    theme={theme}
                                    onClickEdit={() => {
                                        router.push(`/themes/${theme.id}`);
                                    }}
                                    onClickDuplicate={() => handleDuplicate(theme.id)}
                                    onClickDelete={() => handleDelete(theme.id)}
                                />
                            ))}
                        </div>
                    )}
                </ChakraTabs.Content>
                <ChakraTabs.Content value="standard">
                    <div className={styles.themesGrid}>
                        {defaultThemes.map(theme => (
                            <ThemePreviewBlock
                                key={theme.id}
                                theme={theme}
                                isReadOnly={true}
                                onClickEdit={() => {
                                    router.push(`/themes/new?template=${theme.id}`);
                                }}
                            />
                        ))}
                    </div>
                </ChakraTabs.Content>
            </ChakraTabs.Root>
        </div>
    );
}
