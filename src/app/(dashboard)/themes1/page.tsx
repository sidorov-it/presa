'use client';

import { useState } from 'react';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

// Sample theme data
const THEMES = [
    {
        id: 'modern',
        name: 'Modern',
        description: 'Clean and minimalist design',
        primaryColor: '#3B82F6',
        previewBg: 'bg-blue-500',
    },
    {
        id: 'corporate',
        name: 'Corporate',
        description: 'Professional and business-oriented',
        primaryColor: '#1F2937',
        previewBg: 'bg-gray-800',
    },
    {
        id: 'creative',
        name: 'Creative',
        description: 'Bold and artistic design',
        primaryColor: '#EC4899',
        previewBg: 'bg-pink-500',
    },
    {
        id: 'nature',
        name: 'Nature',
        description: 'Inspired by natural elements',
        primaryColor: '#10B981',
        previewBg: 'bg-green-500',
    },
    {
        id: 'tech',
        name: 'Tech',
        description: 'Futuristic and technology-focused',
        primaryColor: '#6366F1',
        previewBg: 'bg-indigo-500',
    },
    {
        id: 'elegant',
        name: 'Elegant',
        description: 'Sophisticated and refined',
        primaryColor: '#9333EA',
        previewBg: 'bg-purple-600',
    },
];

// export const metadata = {
//     title: "Themes",
//     description: "Customize your presentation themes"
// }

const ThemesPage = () => {
    const [activeTheme, setActiveTheme] = useState<string | null>(null);

    const handleThemeSelect = (themeId: string) => {
        setActiveTheme(themeId);
        // In a real app, you would save the selected theme to the user's preferences
    };

    const handleCreateTheme = () => {
        // TODO: Implement theme creation
    };

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
                {THEMES.map(theme => (
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
                                <div className={`h-2 ${theme.previewBg} rounded mb-2`} />
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
