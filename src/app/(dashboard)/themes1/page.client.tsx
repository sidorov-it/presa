'use client';

import { useEffect, useState } from 'react';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';

const ThemesPage = () => {
    const [activeTheme, setActiveTheme] = useState<string | null>(null);
    const defaultThemes = useThemeStore(state => state.defaultThemes);
    const loadThemes = useThemeStore(state => state.loadThemes);

    const handleThemeSelect = (themeId: string) => {
        setActiveTheme(themeId);
        // In a real app, you would save the selected theme to the user's preferences
    };

    const handleCreateTheme = () => {
        // TODO: Implement theme creation
    };

    useEffect(() => {
        loadThemes().catch(err => {
            console.error('Failed to load themes:', err);
        });
    }, [loadThemes]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title="Темы" description="Настройте темы ваших презентаций" />
                <Button onClick={handleCreateTheme}>
                    <Plus className="mr-2 h-4 w-4" />
                    Новая тема
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {defaultThemes.map(theme => (
                    <Card
                        key={theme.id}
                        className={`hover:shadow-lg transition-shadow cursor-pointer ${
                            activeTheme === theme.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleThemeSelect(theme.id)}
                    >
                        <CardHeader>
                            <CardTitle>{theme.name}</CardTitle>
                            <CardDescription>{theme.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-white rounded-md border-2 border-gray-200 p-4">
                                <div
                                    className="h-2 rounded mb-2"
                                    style={{ backgroundColor: theme.colors.primaryAccent }}
                                />
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div className="w-full h-1 bg-gray-100 rounded" />
                                    <div className="w-full h-1 bg-gray-100 rounded" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ThemesPage;
