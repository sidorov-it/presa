'use client';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { useThemeStore } from '@/store/themeStore';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'sonner';
import styles from './page.module.css';

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
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Темы</h1>
                <Link href="/themes/new">
                    <Button className={styles.addButton}>
                        <Plus className={styles.buttonIcon} />
                        Новая тема
                    </Button>
                </Link>
            </div>

            <div className={styles.themesGrid}>
                {themes.map(theme => (
                    <Card key={theme.id}>
                        <CardHeader>
                            <CardTitle>{theme.name}</CardTitle>
                            {theme.description && <CardDescription>{theme.description}</CardDescription>}
                        </CardHeader>
                        <CardContent>
                            <div className={styles.cardActions}>
                                <Link href={`/themes/${theme.id}`}>
                                    <Button variant="outline">Редактировать</Button>
                                </Link>
                                <Button variant="destructive" size="icon" onClick={() => handleDelete(theme.id)}>
                                    <Trash2 className={styles.deleteIcon} />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
