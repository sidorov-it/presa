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
        <div className="flex h-screen">
            {/* Left section with editor */}
            <div className="w-1/2 h-full overflow-auto p-8">
                <div className="space-y-6">
                    <div>
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

                    <div className="fixed bottom-0 left-0 w-1/2 p-4 bg-background border-t flex justify-between items-center">
                        <Button variant="outline" onClick={() => router.push('/themes')}>
                            Отменить
                        </Button>
                        <Button onClick={handleSave}>Сохранить</Button>
                    </div>
                </div>
            </div>

            {/* Right section with preview */}
            <div className="w-1/2 h-screen overflow-auto bg-muted border-l">
                <ThemePreview theme={theme} />
            </div>
        </div>
    );
}
