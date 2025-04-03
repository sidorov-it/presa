'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
// import Editor from '@/components/editor/Editor';
import { useSession } from 'next-auth/react';
import Editor from '@/components/editor/Editor/Editor';
import { IPresentation } from '@/types';
import UndoRedoControls from '@/components/UndoRedoControls';
import SaveStatus from '@/components/ui/SaveStatus';
import { ThemeIcon } from '@/components/icons';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useThemeStore } from '@/store/themeStore';
import { Theme } from '@/types/theme';
import { cn } from '@/lib/utils';

export default function PresentationEditorPage() {
    const params = useParams();

    const { id } = params;
    const { data: session, status } = useSession();
    const { loadPresentation, setTheme } = usePresentationStore();
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const { savingStatus } = usePresentationStore();
    const { themes, loadThemes, currentTheme, setCurrentTheme, getDefaultTheme } = useThemeStore();
    const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);

    const [presentation, setPresentation] = useState<IPresentation | null>(null);

    useEffect(() => {
        if (status === 'loading') return;

        // Ensure presentation exists and belongs to user
        const load = async () => {
            const loadedPresentation = await loadPresentation(id as string);
            if (!loadedPresentation) {
                setNotFound(true);
            } else {
                setPresentation(loadedPresentation);

                // Apply saved theme if it exists
                if (loadedPresentation.themeId) {
                    loadThemes().then(() => {
                        const savedTheme = themes.find(theme => theme.id === loadedPresentation.themeId);
                        if (savedTheme) {
                            setCurrentTheme(savedTheme);
                        }
                    }).catch(console.error);
                }
            }
            setIsLoading(false);
        };

        if (!presentation) {
            load();
        }
    }, [id, loadPresentation, status, loadThemes, themes, setCurrentTheme, presentation]);

    useEffect(() => {
        // Load available themes
        loadThemes().catch((error) => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    const handleThemeChange = (theme: Theme) => {
        setCurrentTheme(theme);

        // Save theme to presentation
        if (presentation) {
            setTheme(presentation.id, theme.id);
        }

        setIsThemePopoverOpen(false);
    };

    const handleSetDefaultTheme = () => {
        const defaultTheme = getDefaultTheme();
        setCurrentTheme(defaultTheme);

        // Remove theme from presentation (set to null)
        if (presentation) {
            setTheme(presentation.id, null);
        }

        setIsThemePopoverOpen(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (notFound || !presentation) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Presentation Not Found</h1>
                <p className="text-gray-600">The presentation you're looking for doesn't exist or you don't have access to it.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* <header className="bg-white border-b border-gray-200 py-2 px-4">
                <div className="container mx-auto flex items-center justify-between">
                    <a href="/dashboard" className="text-xl font-bold text-blue-600">Presa</a>
                    <div className="flex items-center space-x-2">
                        {session?.user?.name && (
                            <div className="text-sm text-gray-600">{session.user.name}</div>
                        )}
                    </div>
                </div>
            </header> */}


            <header className="bg-white border-b border-gray-200 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href='/dashboard' className="text-2xl font-bold text-blue-600">Presa</a>
                        <SaveStatus status={savingStatus} />
                    </div>

                    <div className="flex items-center space-x-4">
                        <Popover open={isThemePopoverOpen} onOpenChange={setIsThemePopoverOpen}>
                            <PopoverTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <ThemeIcon />
                                    <span>Тема</span>
                                </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-3">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium">Выберите тему</h3>
                                    <div className="grid gap-2">
                                        {/* Default Theme Option */}
                                        <div
                                            className={cn(
                                                "flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100 border-b pb-3",
                                                (!currentTheme || currentTheme.name === 'Default Theme') && "bg-blue-50 ring-1 ring-blue-200"
                                            )}
                                            onClick={handleSetDefaultTheme}
                                        >
                                            <div
                                                className="w-5 h-5 rounded-full mr-2"
                                                style={{ backgroundColor: '#3b82f6' }}
                                            />
                                            <span className="font-medium">Стандартная тема</span>
                                            <span className="ml-auto text-xs text-gray-500">По умолчанию</span>
                                        </div>

                                        {/* Custom Themes */}
                                        {themes.length > 0 ? (
                                            themes.map((theme) => (
                                                <div
                                                    key={theme.id}
                                                    className={cn(
                                                        "flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-100",
                                                        currentTheme?.id === theme.id && "bg-blue-50 ring-1 ring-blue-200"
                                                    )}
                                                    onClick={() => handleThemeChange(theme)}
                                                >
                                                    <div
                                                        className="w-5 h-5 rounded-full mr-2"
                                                        style={{ backgroundColor: theme.colors.primaryAccent }}
                                                    />
                                                    <span>{theme.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-gray-500 p-2">
                                                Нет доступных пользовательских тем
                                            </div>
                                        )}
                                        <div className="pt-2 mt-2 border-t border-gray-200">
                                            <a
                                                href="/themes"
                                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                            >
                                                Управление темами
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <div className="">Просмотр</div>
                        <UndoRedoControls presentationId={presentation.id} />

                        <div className="flex items-center space-x-2">
                            {session?.user?.name && (
                                <div className="text-sm text-gray-600">{session.user.name}</div>
                            )}
                        </div>
                        {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviewToggle}
                            aria-label={showPreview ? 'Выйти из режима просмотра' : 'Предпросмотр презентации'}
                        >
                            {showPreview ? 'Редактировать' : 'Просмотр'}
                        </Button> */}

                    </div>
                </div>
            </header>
            <main className="flex-grow w-full themed-page">
                <Editor presentationId={presentation.id} />
            </main>

            <footer className="bg-gray-100 border-t border-gray-200 py-2 px-4">
                <div className="container mx-auto text-center text-sm text-gray-600">
                    Presa - Create beautiful presentations with AI
                </div>
            </footer>
        </div>
    );
}