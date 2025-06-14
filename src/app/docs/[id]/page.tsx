/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
// import Editor from '@/components/editor/Editor';
import { useSession, signOut } from 'next-auth/react';
import Editor from '@/components/editor/Editor/Editor';
import { TipTapRefs } from '@/types';
import UndoRedoControls from '@/components/UndoRedoControls/UndoRedoControls';
import { ThemeIcon } from '@/components/icons';
import { Popover } from '@/components/ui/Popover/Popover';
import { useThemeStore } from '@/store/themeStore';
import { Theme } from '@/types/theme';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { FaEye, FaUser, FaSignOutAlt, FaCog, FaDownload } from 'react-icons/fa';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import BackgroundSettingsModal from '@/components/editor/BackgroundSettingsModal/BackgroundSettingsModal';
import { HiOutlineCog6Tooth } from 'react-icons/hi2';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import ThemeDebugButton from '@/components/debug/ThemeDebugButton';
import HistoryDebugPopup from '@/components/ui/HistoryDebugPopup';
import DragDropDebugInfo from '@/components/DragDropDebugInfo';
import { useColorMode } from '@/components/ui/color-mode';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { useTokens } from '@/hooks/useTokens';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { exportPresentationToPdf } from '@/utils/pdfExport';
import { toast } from 'sonner';
import { Tooltip } from '@/components/ui/tooltip';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Logo from '@/components/icons/Logo/Logo';
import MobileWarningOverlay from '@/components/MobileWarningOverlay/MobileWarningOverlay';
import Presentation from '@/components/editor/Presentation';

export default function PresentationEditorPage() {
    const params = useParams();
    const { id } = params;
    const { data: session, status } = useSession();
    const [isBgModalOpen, setIsBgModalOpen] = useState(false);

    // Token management
    const { balance: tokenBalance, loading: tokensLoading } = useTokens();

    // Access store values individually to prevent unnecessary re-renders
    const loadPresentation = usePresentationStore(state => state.loadPresentation);
    const checkPresentationExists = usePresentationStore(state => state.checkPresentationExists);
    const setTheme = usePresentationStore(state => state.setTheme);

    // Get presentation from store instead of local state
    const presentation = usePresentationStore(state => state.getPresentation(id as string));

    const themes = useThemeStore(state => state.themes);
    const defaultThemes = useThemeStore(state => state.defaultThemes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const loadDefaultThemes = useThemeStore(state => state.loadDefaultThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);
    const getDefaultTheme = useThemeStore(state => state.getDefaultTheme);
    const { colorMode } = useColorMode();

    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: [],
    });

    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [themeTab, setThemeTab] = useState<'user' | 'default'>('user');
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showDownloadPreview, setShowDownloadPreview] = useState(false);

    // Load presentation data only once when component mounts or ID changes
    useEffect(() => {
        if (status === 'loading' || !id) return;

        const load = async () => {
            try {
                // Check if presentation already exists in store
                if (checkPresentationExists(id as string)) {
                    setIsLoading(false);
                    return;
                }

                // If not in store, load it
                const loadedPresentation = await loadPresentation(id as string);
                if (!loadedPresentation) {
                    setNotFound(true);
                }
            } catch (error) {
                console.error('Failed to load presentation:', error);
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, [id, loadPresentation, checkPresentationExists, status]);

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
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
        loadDefaultThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes, loadDefaultThemes]);

    const handleThemeChange = useCallback(
        (theme: Theme) => {
            setCurrentTheme(theme);

            if (presentation) {
                setTheme(presentation.id, theme.id);
            }

            setIsThemePopoverOpen(false);
        },
        [presentation, setCurrentTheme, setTheme]
    );

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

    const handleDownloadPresentation = useCallback(async () => {
        if (!presentation || isDownloading) return;

        setIsDownloading(true);
        setShowDownloadPreview(true);

        const exportPromise = (async () => {
            // Wait for preview to render
            await new Promise(res => setTimeout(res, 100));
            await exportPresentationToPdf(presentation, `${presentation.title || 'presentation'}.pdf`);
        })();

        toast.promise(exportPromise, {
            loading: 'Подготавливаем PDF для скачивания. Пожалуйста, не закрывайте эту страницу.',
            success: () => {
                setIsDownloading(false);
                setShowDownloadPreview(false);
                return 'Презентация успешно экспортирована в PDF';
            },
            error: err => {
                console.error('Error exporting presentation to PDF:', err);
                setIsDownloading(false);
                setShowDownloadPreview(false);
                return 'Произошла ошибка при экспорте. Попробуйте позже.';
            },
        });
    }, [presentation, isDownloading]);

    const handleOpenBgModal = useCallback(() => {
        setIsBgModalOpen(true);
        document.body.style.overflow = 'hidden';
    }, []);

    const handleCloseBgModal = useCallback(() => {
        setIsBgModalOpen(false);
        document.body.style.overflow = 'auto';
    }, []);

    const handleKeyDownCog = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsBgModalOpen(true);
        }
    }, []);

    const handleSignOut = useCallback(() => {
        signOut({ callbackUrl: '/' });
    }, []);

    // Memoize the loading and not found UI to prevent re-renders
    const loadingUI = useMemo(
        () => (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        ),
        []
    );

    const notFoundUI = useMemo(
        () => (
            <div className={styles.notFoundContainer}>
                <h1 className={styles.notFoundTitle}>Presentation Not Found</h1>
                <p className={styles.notFoundText}>
                    The presentation you're looking for doesn't exist or you don't have access to it.
                </p>
            </div>
        ),
        []
    );

    if (isLoading) return loadingUI;
    if (notFound || !presentation) return notFoundUI;

    return (
        <>
            <ReadOnlyProvider isReadOnly={false}>
                <ThemeStylesApplier
                    theme={currentTheme}
                    backgroundSettings={presentation.backgroundSettings}
                    className={styles.container}
                >
                    <MobileWarningOverlay />
                    {showDownloadPreview && (
                        <div className={styles.hiddenExportPreview} aria-hidden="true">
                            <ReadOnlyProvider isReadOnly={true}>
                                <ThemeStylesApplier
                                    theme={currentTheme}
                                    backgroundSettings={presentation.backgroundSettings}
                                >
                                    <Editor presentationId={presentation.id} tiptapRefs={tiptapRefs} />
                                </ThemeStylesApplier>
                            </ReadOnlyProvider>
                        </div>
                    )}
                    <div ref={containerRef} className={colorMode === 'dark' ? 'dark' : ''}>
                        <header className={styles.header}>
                            <div className={styles.headerContent}>
                                <div className={styles.headerLeft}>
                                    <Link href="/dashboard" className={styles.logo}>
                                        <Logo size="md" />
                                    </Link>
                                </div>

                                <div className={styles.headerRight}>
                                    <Popover
                                        isOpen={isThemePopoverOpen}
                                        onOpen={() => setIsThemePopoverOpen(true)}
                                        onClose={() => setIsThemePopoverOpen(false)}
                                        portalContainer={containerRef.current}
                                        trigger={
                                            <div
                                                className={styles.themeButton}
                                                role="button"
                                                aria-label="Open theme selector"
                                                onClick={() => setIsThemePopoverOpen(!isThemePopoverOpen)}
                                                onKeyDown={e =>
                                                    e.key === 'Enter' && setIsThemePopoverOpen(!isThemePopoverOpen)
                                                }
                                            >
                                                <ThemeIcon />
                                                <span>Тема</span>
                                            </div>
                                        }
                                        content={
                                            <div className={styles.themePopover}>
                                                <h3 className={styles.popoverTitle}>Выберите тему</h3>
                                                <div
                                                    className={cn(
                                                        styles.defaultThemeOption,
                                                        (!currentTheme || currentTheme.name === 'Default Theme') &&
                                                            styles.themeOptionSelected
                                                    )}
                                                    onClick={handleSetDefaultTheme}
                                                    role="button"
                                                    aria-label="Set default theme"
                                                    onKeyDown={e => e.key === 'Enter' && handleSetDefaultTheme()}
                                                >
                                                    <div
                                                        className={styles.themeColorPreview}
                                                        style={{ backgroundColor: '#3b82f6' }}
                                                    />
                                                    <span>Стандартная тема</span>
                                                    <span className={styles.defaultLabel}>По умолчанию</span>
                                                </div>
                                                <div className={styles.themeTabs}>
                                                    <div
                                                        className={cn(
                                                            styles.themeTab,
                                                            themeTab === 'user' && styles.themeTabActive
                                                        )}
                                                        onClick={() => setThemeTab('user')}
                                                    >
                                                        Мои
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            styles.themeTab,
                                                            themeTab === 'default' && styles.themeTabActive
                                                        )}
                                                        onClick={() => setThemeTab('default')}
                                                    >
                                                        Стандартные
                                                    </div>
                                                </div>
                                                <div className={styles.themeGrid}>
                                                    {themeTab === 'user' ? (
                                                        <>
                                                            {themes.length > 0 ? (
                                                                themes.map(theme => (
                                                                    <div
                                                                        key={theme.id}
                                                                        className={cn(
                                                                            styles.themeOption,
                                                                            currentTheme?.id === theme.id &&
                                                                                styles.themeOptionSelected
                                                                        )}
                                                                        onClick={() => handleThemeChange(theme)}
                                                                        role="button"
                                                                        aria-label={`Select theme ${theme.name}`}
                                                                        onKeyDown={e =>
                                                                            e.key === 'Enter' &&
                                                                            handleThemeChange(theme)
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={styles.themeColorPreview}
                                                                            style={{
                                                                                backgroundColor:
                                                                                    theme.colors.primaryAccent,
                                                                            }}
                                                                        />
                                                                        <span>{theme.name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className={styles.noThemesText}>
                                                                    Нет доступных пользовательских тем
                                                                </div>
                                                            )}
                                                            <div className={styles.themeManageLink}>
                                                                <Link
                                                                    href="/themes"
                                                                    className={styles.themeManageLinkText}
                                                                >
                                                                    Управление темами
                                                                </Link>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {defaultThemes.length > 0 ? (
                                                                defaultThemes.map(theme => (
                                                                    <div
                                                                        key={theme.id}
                                                                        className={cn(
                                                                            styles.themeOption,
                                                                            currentTheme?.id === theme.id &&
                                                                                styles.themeOptionSelected
                                                                        )}
                                                                        onClick={() => handleThemeChange(theme)}
                                                                        role="button"
                                                                        aria-label={`Select theme ${theme.name}`}
                                                                        onKeyDown={e =>
                                                                            e.key === 'Enter' &&
                                                                            handleThemeChange(theme)
                                                                        }
                                                                    >
                                                                        <div
                                                                            className={styles.themeColorPreview}
                                                                            style={{
                                                                                backgroundColor:
                                                                                    theme.colors.primaryAccent,
                                                                            }}
                                                                        />
                                                                        <span>{theme.name}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className={styles.noThemesText}>
                                                                    Нет доступных тем
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        }
                                    />

                                    <Tooltip content="Просмотр">
                                        <button
                                            onClick={handleViewPresentation}
                                            className={styles.viewButton}
                                            aria-label="View presentation"
                                        >
                                            <FaEye className={styles.viewIcon} aria-hidden="true" />
                                        </button>
                                    </Tooltip>

                                    <Tooltip content="Скачать">
                                        <button
                                            onClick={handleDownloadPresentation}
                                            className={styles.downloadButton}
                                            aria-label="Download presentation"
                                            disabled={isDownloading}
                                        >
                                            <FaDownload className={styles.downloadIcon} aria-hidden="true" />
                                        </button>
                                    </Tooltip>

                                    <ThemeToggle />

                                    <button
                                        type="button"
                                        className={styles.settingsButton}
                                        aria-label="Настроить фон презентации"
                                        tabIndex={0}
                                        onClick={handleOpenBgModal}
                                        onKeyDown={handleKeyDownCog}
                                    >
                                        <HiOutlineCog6Tooth className={styles.settingsIcon} aria-hidden="true" />
                                    </button>
                                    <UndoRedoControls presentationId={presentation.id} tiptapRefs={tiptapRefs} />

                                    <Popover
                                        isOpen={isUserMenuOpen}
                                        onOpen={() => setIsUserMenuOpen(true)}
                                        onClose={() => setIsUserMenuOpen(false)}
                                        portalContainer={containerRef.current}
                                        trigger={
                                            <div
                                                className={styles.userInfo}
                                                role="button"
                                                aria-label="Open user menu"
                                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                                onKeyDown={e => e.key === 'Enter' && setIsUserMenuOpen(!isUserMenuOpen)}
                                            >
                                                <FaUser className={styles.userIcon} />
                                                {session?.user?.name && (
                                                    <span className={styles.userName}>{session.user.name}</span>
                                                )}
                                            </div>
                                        }
                                        content={
                                            <div className={styles.userMenu}>
                                                <div className={styles.userMenuHeader}>
                                                    <div className={styles.userMenuEmail}>
                                                        {session?.user?.email || 'user@example.com'}
                                                    </div>
                                                    <Link href="/tokens" className={styles.userMenuCredits}>
                                                        <HiOutlineCreditCard className={styles.creditsIcon} />
                                                        <span>
                                                            {tokensLoading ? '...' : formatTokenAmount(tokenBalance)}{' '}
                                                            токенов
                                                        </span>
                                                    </Link>
                                                </div>

                                                {/* <div className={styles.userMenuDivider} /> */}

                                                <div className={styles.userMenuActions}>
                                                    <Link href="/settings" className={styles.userMenuAction}>
                                                        <FaCog className={styles.actionIcon} />
                                                        <span>Настройки</span>
                                                    </Link>

                                                    <button
                                                        onClick={handleSignOut}
                                                        className={styles.userMenuSignOut}
                                                        aria-label="Выйти"
                                                    >
                                                        <FaSignOutAlt className={styles.signOutIcon} />
                                                        <span>Выйти</span>
                                                    </button>
                                                </div>
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </header>
                        <main className={styles.main}>
                            <Editor presentationId={presentation.id} tiptapRefs={tiptapRefs} />

                            <BackgroundSettingsModal
                                isOpen={isBgModalOpen}
                                onClose={handleCloseBgModal}
                                presentationId={presentation.id}
                            />

                            {process.env.NODE_ENV === 'development' && (
                                <>
                                    <HistoryDebugPopup />
                                    <ThemeDebugButton />
                                    <DragDropDebugInfo />
                                </>
                            )}
                        </main>

                        <footer className={styles.footer}>
                            <div className={styles.footerContent}>Presa - Create beautiful presentations with AI</div>
                        </footer>
                    </div>
                </ThemeStylesApplier>
            </ReadOnlyProvider>
        </>
    );
}
