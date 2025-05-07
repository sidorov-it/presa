'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

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
            root.style.setProperty('--chakra-colors-chakra-body-bg', '#1A202C');
            root.style.setProperty('--chakra-colors-chakra-text', '#FFFFFF');
            root.style.setProperty('--chakra-colors-chakra-border-color', '#2D3748');
            root.style.setProperty('--chakra-colors-gray-100', '#2D3748');
            root.style.setProperty('--chakra-colors-gray-200', '#4A5568');
            root.style.setProperty('--chakra-colors-gray-400', '#A0AEC0');
            root.style.setProperty('--chakra-colors-gray-600', '#E2E8F0');
            root.style.setProperty('--chakra-colors-gray-700', '#2D3748');
            root.style.setProperty('--chakra-colors-blue-50', '#2C5282');
            root.style.setProperty('--chakra-colors-blue-500', '#90CDF4');
            root.style.setProperty('--chakra-colors-white', '#FFFFFF');
        } else {
            root.style.setProperty('--chakra-colors-chakra-body-bg', '#FFFFFF');
            root.style.setProperty('--chakra-colors-chakra-text', '#1A202C');
            root.style.setProperty('--chakra-colors-chakra-border-color', '#E2E8F0');
            root.style.setProperty('--chakra-colors-gray-100', '#EDF2F7');
            root.style.setProperty('--chakra-colors-gray-200', '#E2E8F0');
            root.style.setProperty('--chakra-colors-gray-400', '#A0AEC0');
            root.style.setProperty('--chakra-colors-gray-600', '#4A5568');
            root.style.setProperty('--chakra-colors-gray-700', '#2D3748');
            root.style.setProperty('--chakra-colors-blue-50', '#EBF8FF');
            root.style.setProperty('--chakra-colors-blue-500', '#3182CE');
            root.style.setProperty('--chakra-colors-white', '#FFFFFF');
        }
    }, [colorMode]);

    return (
        <ColorModeContext.Provider value={{ colorMode, setColorMode }}>
            {children}
        </ColorModeContext.Provider>
    );
}

export function useColorMode(): { colorMode: ColorMode; setColorMode: (mode: ColorMode) => void } {
    const context = useContext(ColorModeContext);
    if (!context) {
        throw new Error('useColorMode must be used within a ColorModeProvider');
    }
    return context;
}
