import { create } from 'zustand';
import { Theme } from '@/types/theme';
import { createNewTheme, DEFAULT_THEME } from '@/constants/defaultTheme';

interface ThemeState {
  themes: Theme[];
  currentTheme: Theme | null;
  setCurrentTheme: (theme: Theme) => void;
  addTheme: (theme: Omit<Theme, 'id'>) => Promise<void>;
  updateTheme: (theme: Theme) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  loadThemes: () => Promise<void>;
  getDefaultTheme: () => Theme;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    themes: [],
    currentTheme: null,

    setCurrentTheme: (theme) => {
        set({ currentTheme: theme });
    },

    getDefaultTheme: () => {
        return createNewTheme();
    },

    addTheme: async (theme) => {
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
            const themes = [...get().themes, savedTheme];
            set({ themes });
            return savedTheme;
        } catch (error) {
            console.error('Failed to add theme:', error);
            throw error;
        }
    },

    updateTheme: async (theme) => {
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
            const themes = get().themes.map((t) => (t.id === theme.id ? updatedTheme : t));
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

    deleteTheme: async (themeId) => {
        try {
            const response = await fetch(`/api/themes/${themeId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete theme');
            }

            // Update local state after successful deletion
            const filteredThemes = get().themes.filter((t) => t.id !== themeId);
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
            const themes = await response.json();
            set({ themes });
        } catch (error) {
            console.error('Failed to load themes:', error);
            throw error;
        }
    },
}));