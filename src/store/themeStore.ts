import { create } from 'zustand';
import { Theme } from '@/types/theme';

interface ThemeState {
  themes: Theme[];
  currentTheme: Theme | null;
  setCurrentTheme: (theme: Theme) => void;
  addTheme: (theme: Theme) => Promise<void>;
  updateTheme: (theme: Theme) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  loadThemes: () => Promise<void>;
  saveThemes: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
    themes: [],
    currentTheme: null,

    setCurrentTheme: (theme) => {
        set({ currentTheme: theme });
    },

    addTheme: async (theme) => {
        try {
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([...get().themes, theme]),
            });

            if (!response.ok) {
                throw new Error('Failed to add theme');
            }

            const themes = [...get().themes, theme];
            set({ themes });
        } catch (error) {
            console.error('Failed to add theme:', error);
            throw error;
        }
    },

    updateTheme: async (theme) => {
        try {
            const themes = get().themes.map((t) => (t.id === theme.id ? theme : t));
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(themes),
            });

            if (!response.ok) {
                throw new Error('Failed to update theme');
            }

            set({ themes });
            if (get().currentTheme?.id === theme.id) {
                set({ currentTheme: theme });
            }
        } catch (error) {
            console.error('Failed to update theme:', error);
            throw error;
        }
    },

    deleteTheme: async (themeId) => {
        try {
            const themes = get().themes.filter((t) => t.id !== themeId);
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(themes),
            });

            if (!response.ok) {
                throw new Error('Failed to delete theme');
            }

            set({ themes });
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

    saveThemes: async () => {
        try {
            const response = await fetch('/api/themes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(get().themes),
            });

            if (!response.ok) {
                throw new Error('Failed to save themes');
            }
        } catch (error) {
            console.error('Failed to save themes:', error);
            throw error;
        }
    },
}));