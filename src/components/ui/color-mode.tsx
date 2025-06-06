'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import lightThemeVars from './cssVariables/lightTheme.json';
import darkThemeVars from './cssVariables/darkTheme.json';

export type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
    colorMode: ColorMode;
    setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export interface ColorModeProviderProps {
    children: ReactNode;
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
    const [colorMode, setColorMode] = useState<ColorMode>('light');

    // Применяем CSS-переменные Chakra при изменении темы
    useEffect(() => {
        const root = document.documentElement;
        if (colorMode === 'dark') {
            darkThemeVars.forEach(({ name, value }) => {
                root.style.setProperty(name, value);
            });
            root.classList.add('dark');
        } else {
            lightThemeVars.forEach(({ name, value }) => {
                root.style.setProperty(name, value);
            });
            root.classList.remove('dark');
        }
    }, [colorMode]);

    return <ColorModeContext.Provider value={{ colorMode, setColorMode }}>{children}</ColorModeContext.Provider>;
}

export function useColorMode(): { colorMode: ColorMode; setColorMode: (mode: ColorMode) => void } {
    const context = useContext(ColorModeContext);
    if (!context) {
        throw new Error('useColorMode must be used within a ColorModeProvider');
    }
    return context;
}
