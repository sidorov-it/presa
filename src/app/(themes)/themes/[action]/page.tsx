'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeEditor } from '@/components/theme/ThemeEditor';
import { ThemePreview } from '@/components/theme/ThemePreview';
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input/Input';
import { Label } from '@/components/ui/Label';
import { generateId } from '@/utils/id';

import styles from './page.module.css';

export default function ThemeEditorPage(props: { params: Promise<{ action: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const { addTheme, updateTheme, loadTheme } = useThemeStore();

    const [theme, setTheme] = useState<Theme>({
        id: generateId(),
        name: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        colors: {
            additionalColors: [],
            shapesColor: '#3b82f6',
            accentBlocksColor: '#3b82f6',
            secondaryButtonColor: '#3b82f6',
            primaryAccent: '#3b82f6',
            secondaryAccents: ['#60a5fa', '#93c5fd', '#bfdbfe'],
            headingColor: '#1f2937',
            textColor: '#4b5563',
            slideBackground: '#ffffff',
            pageBackground: {
                type: 'color',
                color: '#f3f4f6',
                imageUrl: '',
            },
        },
        typography: {
            headingFont: 'inter',
            headingWeight: 600,
            bodyFont: 'inter',
            bodyWeight: 400,
            headingColor: '#1f2937',
            bodyColor: '#4b5563',
            headingLineHeight: 1.5,
            headingLetterSpacing: 0,
            headingCapitalization: 'none',
            bodyLineHeight: 1.5,
            bodyLetterSpacing: 0,
            bodyCapitalization: 'none',
        },
        design: {
            slide: {
                borderRadius: '8px',
                shadow: 'sm',
                borderColor: '#e5e7eb',
                imageShape: 'default',
                borderWidth: 'thin',
                opacity: 0.8,
            },
            blocks: {
                backgroundColor: '#ffffff',
                backgroundBlockFillType: 'fill',
                blockFillColorsType: 'subtle',
                blockBackgroundCustomColors: [],
                borderWidth: 'thin',
                shadow: 'sm',
            },
            buttons: {
                // buttonColor: '#3b82f6',
                // buttonShape: 'rounded',
                // linkColor: '#2563eb',
            },
        },
    });

    useEffect(() => {
        if (params.action !== 'new') {
            loadTheme(params.action).then((theme: Theme | null) => {
                if (theme) {
                    setTheme(theme);
                }
            });
        }
    }, [loadTheme, params.action]);

    const handleSave = async () => {
        try {
            if (params.action === 'new') {
                await addTheme(theme);
                toast.success('Тема создана успешно');
            } else {
                await updateTheme(theme);
                toast.success('Тема обновлена успешно');
            }
            router.push('/themes');
        } catch (error) {
            console.error('Failed to save theme:', error);
            toast.error('Failed to save theme');
        }
    };

    return (
        <div className={styles.container}>
            {/* Left section with editor */}
            <div className={styles.leftSection}>
                <div className={styles.leftSectionContent}>
                    <div>
                        <Label htmlFor="theme-name" className={styles.label}>
                            Название темы
                        </Label>
                        <Input
                            id="theme-name"
                            value={theme.name}
                            onChange={e => setTheme({ ...theme, name: e.target.value })}
                            placeholder="Название темы"
                            className={styles.input}
                        />
                    </div>

                    <ThemeEditor theme={theme} onThemeChange={setTheme} />
                </div>

                <div className={styles.bottomSection}>
                    <Button variant="outline" onClick={() => router.push('/themes')}>
                        Отмена
                    </Button>
                    <Button variant="solid" colorScheme="blue" onClick={handleSave}>
                        Сохранить
                    </Button>
                </div>
            </div>

            {/* Right section with preview */}
            <div className={styles.rightSection}>
                <ThemePreview theme={theme} />
            </div>
        </div>
    );
}
