'use client';

import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/themeStore';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'sonner';
import styles from './page.module.css';
import ThemePreviewBlock from './components/ThemePreviewBlock';
import { useRouter } from 'next/navigation';

export default function ThemesPage() {
    const { themes, loadThemes, addTheme, deleteTheme } = useThemeStore();
    const router = useRouter();

    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
            toast.error('Failed to load themes');
        });
    }, [loadThemes]);

    const handleDuplicate = async (themeId: string) => {
        const theme = themes.find(theme => theme.id === themeId);
        if (theme) {
            const result = await addTheme(theme);
            router.push(`/themes/${result.id}`);
        }
    };

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
                    <ThemePreviewBlock
                        key={theme.id}
                        theme={theme}
                        onClickEdit={() => router.push(`/themes/${theme.id}`)}
                        onClickDuplicate={() => handleDuplicate(theme.id)}
                        onClickDelete={() => handleDelete(theme.id)}
                    />
                    // <Card key={theme.id}>
                    //     <CardHeader>
                    //         <CardTitle>{theme.name}</CardTitle>
                    //         {theme.description && <CardDescription>{theme.description}</CardDescription>}
                    //     </CardHeader>
                    //     <CardContent>
                    //         <div className={styles.cardActions}>
                    //             <Link href={`/themes/${theme.id}`}>
                    //                 <Button variant="outline">Редактировать</Button>
                    //             </Link>
                    //             <Button variant="destructive" size="icon" onClick={() => handleDelete(theme.id)}>
                    //                 <Trash2 className={styles.deleteIcon} />
                    //             </Button>
                    //         </div>
                    //     </CardContent>
                    // </Card>
                ))}
            </div>
        </div>
    );
}
