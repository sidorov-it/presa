'use client';

import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import styles from './page.module.css';
import ThemePreviewBlock from './components/ThemePreviewBlock';
import { Tabs as ChakraTabs } from '@chakra-ui/react';
import { useThemeStore } from '@/store/themeStore';
import { getRequiredFontsFromTheme, loadFonts, unloadAllFonts } from '@/utils/fontLoader';
import { Heading } from '@/components/ui/heading';

export default function ThemesPage() {
    const { themes, allThemes, defaultThemes, loadThemes, addTheme, deleteTheme } = useThemeStore();
    const [tabIndex, setTabIndex] = useState(0);

    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
            toast.error('Failed to load themes');
        });
    }, [loadThemes]);

    useEffect(() => {
        const uniqueFontUrls = new Set<string>();

        allThemes.forEach(theme => {
            const fontUrls = getRequiredFontsFromTheme(theme);
            fontUrls.forEach(url => uniqueFontUrls.add(url));
        });

        loadFonts(Array.from(uniqueFontUrls));

        return () => {
            unloadAllFonts();
        };
    }, [allThemes]);

    const handleDuplicate = useCallback(
        async (themeId: string) => {
            const theme = allThemes.find(theme => theme.id === themeId);
            if (theme) {
                await addTheme(theme);
                toast.success('Тема скопирована');
            }
        },
        [allThemes, addTheme]
    );

    const handleDelete = useCallback(
        async (themeId: string) => {
            if (window.confirm('Are you sure you want to delete this theme?')) {
                try {
                    await deleteTheme(themeId);
                    toast.success('Theme deleted successfully');
                } catch (error) {
                    console.error('Failed to delete theme:', error);
                    toast.error('Failed to delete theme');
                }
            }
        },
        [deleteTheme]
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Heading 
                    title="Темы" 
                    description="Создавайте и настраивайте темы для ваших презентаций" 
                    withoutMargin={true}
                />
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
                                <Link href={`/themes/${theme.id}`} key={theme.id}>
                                    <ThemePreviewBlock
                                        key={theme.id}
                                        theme={theme}
                                        onClickDuplicate={() => handleDuplicate(theme.id)}
                                        onClickDelete={() => handleDelete(theme.id)}
                                    />
                                </Link>
                            ))}
                        </div>
                    )}
                </ChakraTabs.Content>
                <ChakraTabs.Content value="standard">
                    <div className={styles.themesGrid}>
                        {defaultThemes.map(theme => (
                            <Link href={`/themes/new?template=${theme.id}`} key={theme.id}>
                                <ThemePreviewBlock key={theme.id} theme={theme} isReadOnly={true} />
                            </Link>
                        ))}
                    </div>
                </ChakraTabs.Content>
            </ChakraTabs.Root>
        </div>
    );
}
