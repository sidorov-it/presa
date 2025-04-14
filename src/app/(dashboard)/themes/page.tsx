'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeStore } from '@/store/themeStore';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ThemesPage() {
    const { themes, loadThemes, deleteTheme } = useThemeStore();

    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
            toast.error('Failed to load themes');
        });
    }, [loadThemes]);

    const handleDelete = async (themeId: string) => {
        if (window.confirm('Are you sure you want to delete this theme?')) {
            try {
                await deleteTheme(themeId);
                toast.success('Theme deleted successfully');
            } catch (error) {
                console.error('Failed to delete theme:', error);
                toast.error('Failed to delete theme');
            }
        }
    };

    return (
        <div className="container mx-auto flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Темы</h1>
                <Link href="/themes/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Новая тема
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {themes.map(theme => (
                    <Card key={theme.id}>
                        <CardHeader>
                            <CardTitle>{theme.name}</CardTitle>
                            {theme.description && <CardDescription>{theme.description}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-end gap-2">
                                <Link href={`/themes/${theme.id}`}>
                                    <Button variant="outline">Редактировать</Button>
                                </Link>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(theme.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
