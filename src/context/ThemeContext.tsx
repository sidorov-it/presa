import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme } from '@/types/theme';

// Utility function to determine if a color is dark
export const isColorDark = (color: string): boolean => {
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Calculate perceived brightness using YIQ formula
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
            const r = parseInt(rgbValues[0]);
            const g = parseInt(rgbValues[1]);
            const b = parseInt(rgbValues[2]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128;
        }
    }
    
    // Default to false for other color formats
    return false;
};

interface ThemeContextType {
    isDarkMode: boolean;
    setTheme: (theme: Theme) => void;
    currentTheme: Theme | null;
}

const ThemeContext = createContext<ThemeContextType>({
    isDarkMode: false,
    setTheme: () => {},
    currentTheme: null
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
    children: ReactNode;
    initialTheme?: Theme | null;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, initialTheme }) => {
    const [currentTheme, setCurrentTheme] = useState<Theme | null>(initialTheme || null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const setTheme = (theme: Theme) => {
        setCurrentTheme(theme);
        const isDark = isColorDark(theme.colors.slideBackground);
        setIsDarkMode(isDark);
        
        // Note: CSS variables are now set in the main ThemeProvider component
        // Toggle dark-theme class on body
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    useEffect(() => {
        if (initialTheme) {
            setTheme(initialTheme);
        }
    }, [initialTheme]);

    return (
        <ThemeContext.Provider value={{ isDarkMode, setTheme, currentTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext; 