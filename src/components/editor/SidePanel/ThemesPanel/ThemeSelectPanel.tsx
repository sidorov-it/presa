'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Tabs as ChakraTabs } from '@chakra-ui/react';
import { useThemeStore } from '@/store/themeStore';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import ThemePreviewBlock from '@/app/(dashboard)/themes/components/ThemePreviewBlock';
import styles from './ThemeSelectPanel.module.css';
import Link from 'next/link';

interface ThemeSelectPanelProps {
    onCloseMenu?: () => void;
    presentationId?: string;
}

const ThemeSelectPanel: React.FC<ThemeSelectPanelProps> = ({ onCloseMenu, presentationId }) => {
    const { themes, defaultThemes, loadThemes, setCurrentTheme } = useThemeStore();
    const setTheme = usePresentationStore(state => state.setTheme);

    const [tabIndex, setTabIndex] = useState(0);

    useEffect(() => {
        loadThemes().catch(err => console.error('Failed to load themes:', err));
    }, [loadThemes]);

    const handleSelect = useCallback(
        (themeId: string) => {
            const theme = [...themes, ...defaultThemes].find(t => t.id === themeId);
            if (!theme) return;

            setCurrentTheme(theme);
            if (presentationId) {
                setTheme(presentationId, theme.id);
            }
            useMenuStore.getState().closeSideMenu();
            onCloseMenu?.();
        },
        [themes, defaultThemes, setCurrentTheme, setTheme, presentationId, onCloseMenu]
    );

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Выберите тему</h3>
            <div className={styles.closeButton}>
                <button onClick={() => useMenuStore.getState().closeSideMenu()}>×</button>
            </div>
            <ChakraTabs.Root
                value={tabIndex === 0 ? 'my' : 'standard'}
                onValueChange={e => setTabIndex(e.value === 'my' ? 0 : 1)}
                className={styles.tabs}
            >
                <ChakraTabs.List>
                    <ChakraTabs.Trigger value="my">Мои темы</ChakraTabs.Trigger>
                    <ChakraTabs.Trigger value="standard">Стандартные темы</ChakraTabs.Trigger>
                </ChakraTabs.List>
                <ChakraTabs.Content value="my">
                    {themes.length === 0 ? (
                        <div>
                            <p>Нет доступных пользовательских тем.</p>
                            <Link href="/themes">Управление темами</Link>
                        </div>
                    ) : (
                        <div className={styles.themesGrid}>
                            {themes.map(theme => (
                                <ThemePreviewBlock
                                    key={theme.id}
                                    theme={theme}
                                    isReadOnly={true}
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
                                onClick={() => handleSelect(theme.id)}
                            />
                        ))}
                    </div>
                </ChakraTabs.Content>
            </ChakraTabs.Root>
        </div>
    );
};

export default ThemeSelectPanel;
