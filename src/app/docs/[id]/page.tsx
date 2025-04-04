'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
import Link from 'next/link';
import { FaEye } from 'react-icons/fa';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

export default function PresentationEditorPage() {
    const params = useParams();
    const { id } = params;
    const { data: session, status } = useSession();

    // Access store values individually to prevent unnecessary re-renders
    const loadPresentation = usePresentationStore(state => state.loadPresentation);
    const setTheme = usePresentationStore(state => state.setTheme);
    const savingStatus = usePresentationStore(state => state.savingStatus);

    const themes = useThemeStore(state => state.themes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);
    const getDefaultTheme = useThemeStore(state => state.getDefaultTheme);

    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
    const [presentation, setPresentation] = useState<IPresentation | null>(null);

    // Load presentation data only once when component mounts or ID changes
    useEffect(() => {
        if (status === 'loading' || !id) return;

        const load = async () => {
            try {
                const loadedPresentation = await loadPresentation(id as string);
                if (!loadedPresentation) {
                    setNotFound(true);
                } else {
                    setPresentation(loadedPresentation);
                }
            } catch (error) {
                console.error('Failed to load presentation:', error);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id, loadPresentation, status]);

    // Apply theme when presentation is loaded or themes change
    useEffect(() => {
        if (!presentation || !presentation.themeId) return;

        const savedTheme = themes.find(theme => theme.id === presentation.themeId);
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        }
    }, [presentation, themes, setCurrentTheme]);

    // Load themes separately
    useEffect(() => {
        loadThemes().catch((error) => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    const handleThemeChange = useCallback((theme: Theme) => {
        setCurrentTheme(theme);

        if (presentation) {
            setTheme(presentation.id, theme.id);
        }

        setIsThemePopoverOpen(false);
    }, [presentation, setCurrentTheme, setTheme]);

    const handleSetDefaultTheme = useCallback(() => {
        const defaultTheme = getDefaultTheme();
        setCurrentTheme(defaultTheme);

        if (presentation) {
            setTheme(presentation.id, null);
        }

        setIsThemePopoverOpen(false);
    }, [presentation, getDefaultTheme, setCurrentTheme, setTheme]);

    // Function to navigate to view mode
    const handleViewPresentation = useCallback(() => {
        if (presentation) {
            window.open(`/view/${presentation.id}`, '_blank');
        }
    }, [presentation]);

    // Memoize the loading and not found UI to prevent re-renders
    const loadingUI = useMemo(() => (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    ), []);

    const notFoundUI = useMemo(() => (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Presentation Not Found</h1>
            <p className="text-gray-600">The presentation you're looking for doesn't exist or you don't have access to it.</p>
        </div>
    ), []);

    if (isLoading) return loadingUI;
    if (notFound || !presentation) return notFoundUI;

    return (
        <ThemeProvider initialTheme={currentTheme}>
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
                            <Link href="/dashboard" className="text-2xl font-bold text-blue-600">Presa</Link>
                            <SaveStatus status={savingStatus} />
                        </div>

                        <div className="flex items-center space-x-4">
                            <Popover open={isThemePopoverOpen} onOpenChange={setIsThemePopoverOpen}>
                                <PopoverTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer" role="button" aria-label="Open theme selector" onClick={() => setIsThemePopoverOpen(!isThemePopoverOpen)} onKeyDown={(e) => e.key === 'Enter' && setIsThemePopoverOpen(!isThemePopoverOpen)}>
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
                                                role="button"
                                                aria-label="Set default theme"
                                                onKeyDown={(e) => e.key === 'Enter' && handleSetDefaultTheme()}
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
                                                        role="button"
                                                        aria-label={`Select theme ${theme.name}`}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleThemeChange(theme)}
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
                                                <Link
                                                    href="/themes"
                                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                                >
                                                    Управление темами
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <button
                                onClick={handleViewPresentation}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                aria-label="View presentation"
                            >
                                <FaEye size={16} />
                                <span className="text-sm font-medium">Просмотр</span>
                            </button>

                            <UndoRedoControls presentationId={presentation.id} />

                            <div className="flex items-center space-x-2">
                                {session?.user?.name && (
                                    <div className="text-sm text-gray-600">{session.user.name}</div>
                                )}
                            </div>
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
        </ThemeProvider>
    );
}