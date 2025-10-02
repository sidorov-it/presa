'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import { Tabs as ChakraTabs } from '@chakra-ui/react';
import { useThemeStore } from '@/store/themeStore';
import { usePresentationStore } from '@/store/presentationStore';
import { useUIStateStore } from '@/store/uiStateStore';
import ThemePreviewBlock from '@/app/(dashboard)/themes/components/ThemePreviewBlock';
import styles from './ThemeSelectPanel.module.css';
import Link from 'next/link';

interface ThemeSelectPanelProps {
    onCloseMenu?: () => void;
    presentationId?: string;
}

const ThemeSelectPanel: React.FC<ThemeSelectPanelProps> = memo(({ onCloseMenu, presentationId }) => {
    const { themes, defaultThemes, allThemes, currentTheme, loadThemes, setCurrentTheme, themesLoaded } =
        useThemeStore();
    const setTheme = usePresentationStore(state => state.setTheme);

    const [tabIndex, setTabIndex] = useState(2);

    useEffect(() => {
        // Only load themes if they haven't been loaded yet
        if (!themesLoaded) {
            loadThemes().catch(err => console.error('Failed to load themes:', err));
        }
    }, [loadThemes, themesLoaded]);

    useEffect(() => {
        if (currentTheme?.id) {
            if (currentTheme.isDefault) {
                setTabIndex(1);
            } else {
                setTabIndex(0);
            }
            setTimeout(() => {
                document
                    .getElementById(`theme-${currentTheme.id}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        }
    }, [currentTheme?.id, currentTheme?.isDefault]);

    const handleSelect = useCallback(
        (themeId: string) => {
            const theme = allThemes.find(t => t.id === themeId);
            if (!theme) return;

            setCurrentTheme(theme);
            if (presentationId) {
                setTheme(presentationId, theme.id);
            }
            useUIStateStore.getState().closeSideMenu();
            onCloseMenu?.();
        },
        [allThemes, setCurrentTheme, setTheme, presentationId, onCloseMenu]
    );

    const handleCloseMenu = useCallback(() => {
        useUIStateStore.getState().closeSideMenu();
        onCloseMenu?.();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Выберите тему</h3>
                <div className={styles.closeButton}>
                    <button onClick={() => useUIStateStore.getState().closeSideMenu()}>×</button>
                </div>
            </div>
            <ChakraTabs.Root
                value={tabIndex === 0 ? 'my' : 'standard'}
                onValueChange={e => setTabIndex(e.value === 'my' ? 0 : 1)}
                className={styles.tabs}
            >
                <div className={styles.tabsHeader}>
                    <ChakraTabs.List>
                        <ChakraTabs.Trigger value="my">Мои темы</ChakraTabs.Trigger>
                        <ChakraTabs.Trigger value="standard">Стандартные темы</ChakraTabs.Trigger>
                    </ChakraTabs.List>
                </div>
                <div className={styles.content}>
                    <ChakraTabs.Content value="my">
                        {themes.length === 0 ? (
                            <div className={styles.noThemes}>
                                <p>У вас пока нет тем.</p>
                                <p>
                                    <Link href="/themes" className={styles.clickable} onClick={handleCloseMenu}>
                                        Создайте тему
                                    </Link>{' '}
                                    или выберите из{' '}
                                    <span
                                        onClick={() => {
                                            setTabIndex(1);
                                        }}
                                        className={styles.clickable}
                                    >
                                        стандартных.
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <div className={styles.themesGrid}>
                                {themes.map(theme => (
                                    <ThemePreviewBlock
                                        key={theme.id}
                                        theme={theme}
                                        isReadOnly={true}
                                        isSelected={currentTheme?.id === theme.id}
                                        onClick={() => handleSelect(theme.id)}
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
                                    isSelected={currentTheme?.id === theme.id}
                                    onClick={() => handleSelect(theme.id)}
                                />
                            ))}
                        </div>
                    </ChakraTabs.Content>
                </div>
            </ChakraTabs.Root>
        </div>
    );
});

ThemeSelectPanel.displayName = 'ThemeSelectPanel';

export default ThemeSelectPanel;
