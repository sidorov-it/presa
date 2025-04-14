'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeEditor } from '@/components/theme/ThemeEditor';
import { ThemePreview } from '@/components/theme/ThemePreview';
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/themeStore';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { generateId } from '@/utils/id';

export default function ThemeEditorPage(props: { params: Promise<{ action: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const { addTheme, updateTheme, themes } = useThemeStore();
    const [theme, setTheme] = useState<Theme>({
        id: generateId(),
        name: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        colors: {
            primaryAccent: '#3b82f6',
            secondaryAccents: ['#60a5fa', '#93c5fd', '#bfdbfe'],
            headingColor: '#1f2937',
            textColor: '#4b5563',
            slideBackground: '#ffffff',
            pageBackground: '#f3f4f6',
        },
        typography: {
            headingFont: 'inter',
            headingWeight: 600,
            bodyFont: 'inter',
            bodyWeight: 400,
            headingColor: '#1f2937',
            bodyColor: '#4b5563',
        },
        design: {
            slide: {
                borderRadius: '8px',
                shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                border: '1px solid',
                borderColor: '#e5e7eb',
                imageShape: 'rounded',
            },
            blocks: {
                backgroundColor: '#ffffff',
                opacity: 0.8,
                borderWidth: 'thin',
                shadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            },
            buttons: {
                buttonColor: '#3b82f6',
                buttonShape: 'rounded',
                linkColor: '#2563eb',
            },
        },
    });

    useEffect(() => {
        if (params.action !== 'new') {
            const existingTheme = themes.find(t => t.id === params.action);
            if (existingTheme) {
                setTheme(existingTheme);
            }
        }
    }, [params.action, themes]);

    const handleSave = async () => {
        try {
            if (params.action === 'new') {
                // const { id, ...themeWithoutId } = theme;
                await addTheme(theme);
                toast.success('Theme created successfully');
            } else {
                await updateTheme(theme);
                toast.success('Theme updated successfully');
            }
            router.push('/themes');
        } catch (error) {
            console.error('Failed to save theme:', error);
            toast.error('Failed to save theme');
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-3xl font-bold">{params.action === 'new' ? 'Новая тема' : 'Редактировать тему'}</h1>
                <div className="flex gap-2">
                    <Button onClick={handleSave}>Сохранить</Button>
                    <Button onClick={() => router.push('/themes')}>Отменить</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="p-6 bg-card rounded-lg shadow-sm">
                        <div className="mb-4">
                            <Label htmlFor="theme-name" className="mb-2 block">
                                Название темы
                            </Label>
                            <Input
                                id="theme-name"
                                value={theme.name}
                                onChange={e => setTheme({ ...theme, name: e.target.value })}
                                placeholder="Введите название темы"
                                className="w-full"
                            />
                        </div>
                        <ThemeEditor theme={theme} onThemeChange={setTheme} />
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="p-6 bg-card rounded-lg shadow-sm">
                        <ThemePreview theme={theme} />
                    </div>
                </div>
            </div>
        </div>
    );
}
