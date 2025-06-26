import { create } from 'zustand';
import { Theme, ThemeDesignImageShape } from '@/types/theme';
import createNewTheme from '@/utils/theme/createNewTheme';

interface ThemeState {
    themes: Theme[];
    defaultThemes: Theme[];
    currentTheme: Theme | null;
    allThemes: Theme[];
    setCurrentTheme: (theme: Theme | undefined) => void;
    getCurrentThemeImageShape: () => ThemeDesignImageShape | null | undefined;
    getCurrentThemeSlideBackground: () => string | null | undefined;
    addTheme: (theme: Omit<Theme, 'id'>) => Promise<void>;
    updateTheme: (theme: Theme) => Promise<void>;
    deleteTheme: (themeId: string) => Promise<void>;
    loadThemes: () => Promise<void>;
    loadTheme: (themeId: string) => Promise<Theme | null>;
    getDefaultTheme: () => Theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    themes: [],
    defaultThemes: [],
    currentTheme: null,
    allThemes: [],

    setCurrentTheme: theme => {
        set({ currentTheme: theme });
    },

    getCurrentThemeImageShape: () => {
        return get().currentTheme?.design.slide.imageShape;
    },

    getCurrentThemeSlideBackground: () => {
        return get().currentTheme?.colors.slideBackground;
    },

    getDefaultTheme: () => {
        return createNewTheme();
    },

    addTheme: async theme => {
        try {
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(theme),
            });

            if (!response.ok) {
                throw new Error('Failed to add theme');
            }

            const savedTheme = await response.json();
            const themes = [savedTheme, ...get().themes];
            set({ themes });
            return savedTheme;
        } catch (error) {
            console.error('Failed to add theme:', error);
            throw error;
        }
    },

    updateTheme: async theme => {
        try {
            const response = await fetch(`/api/themes/${theme.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(theme),
            });

            if (!response.ok) {
                throw new Error('Failed to update theme');
            }

            const updatedTheme = await response.json();
            const themes = get().themes.map(t => (t.id === theme.id ? updatedTheme : t));
            set({ themes });
            if (get().currentTheme?.id === theme.id) {
                set({ currentTheme: updatedTheme });
            }
            return updatedTheme;
        } catch (error) {
            console.error('Failed to update theme:', error);
            throw error;
        }
    },

    deleteTheme: async themeId => {
        try {
            const response = await fetch(`/api/themes/${themeId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete theme');
            }

            // Update local state after successful deletion
            const filteredThemes = get().themes.filter(t => t.id !== themeId);
            set({ themes: filteredThemes });

            if (get().currentTheme?.id === themeId) {
                set({ currentTheme: null });
            }
        } catch (error) {
            console.error('Failed to delete theme:', error);
            throw error;
        }
    },

    loadThemes: async () => {
        try {
            const response = await fetch('/api/themes');
            if (!response.ok) {
                throw new Error('Failed to load themes');
            }
            const themes: Theme[] = await response.json();
            set({
                themes: themes.filter(t => !t.isDefault),
                defaultThemes: themes.filter(t => t.isDefault),
                allThemes: themes,
            });
        } catch (error) {
            console.error('Failed to load themes:', error);
            throw error;
        }
    },

    loadTheme: async (themeId: string) => {
        try {
            const response = await fetch(`/api/themes/${themeId}`);
            if (!response.ok) {
                throw new Error('Failed to load themes');
            }
            const theme = await response.json();
            return theme;
        } catch (error) {
            console.error('Failed to load themes:', error);
            throw error;
        }
    },
}));
