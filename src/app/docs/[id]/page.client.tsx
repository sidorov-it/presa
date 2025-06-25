/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
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
import { FaEye, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import BackgroundSettingsModal from '@/components/editor/BackgroundSettingsModal/BackgroundSettingsModal';
import { HiOutlineCog6Tooth } from 'react-icons/hi2';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import ThemeDebugButton from '@/components/debug/ThemeDebugButton';
import HistoryDebugPopup from '@/components/ui/HistoryDebugPopup';
import DragDropDebugInfo from '@/components/DragDropDebugInfo';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';
import { useColorMode } from '@/components/ui/color-mode';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { useTokens } from '@/hooks/useTokens';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { Tooltip } from '@/components/ui/tooltip';
import Logo from '@/components/icons/Logo/Logo';
import MobileWarningOverlay from '@/components/MobileWarningOverlay/MobileWarningOverlay';
import { clearAllThemeStyles } from '@/utils/themeUtils';
import { SimplePdfExportButton } from '@/components/export';
import { ChangeTiptapRefsEvent } from '@/customEvents/ChangeTiptapRefsEvent';

const ThemeVariant = ({
    theme,
    currentTheme,
    handleThemeChange,
}: {
    theme: Theme;
    currentTheme?: Theme | null;
    handleThemeChange: (theme: Theme) => void;
}) => {
    return (
        <div
            className={cn(styles.themeOption, currentTheme?.id === theme.id && styles.themeOptionSelected)}
            onClick={() => handleThemeChange(theme)}
            role="button"
            aria-label={`Select theme ${theme.name}`}
            onKeyDown={e => e.key === 'Enter' && handleThemeChange(theme)}
        >
            <div
                className={styles.themeColorPreview}
                style={{
                    backgroundColor: theme.colors.primaryAccent,
                }}
            />
            <span>{theme.name}</span>
        </div>
    );
};

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
    const unsavedChanges = usePresentationStore(state => state.unsavedChanges);
    const savingStatus = usePresentationStore(state => state.savingStatus);

    // Get presentation from store instead of local state
    const presentation = usePresentationStore(state => state.getPresentation(id as string));

    const themes = useThemeStore(state => state.themes);
    const defaultThemes = useThemeStore(state => state.defaultThemes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);
    const defaultTheme = useThemeStore(state => state.defaultThemes[0]);

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

    // Cleanup function to clear theme styles when component unmounts
    useEffect(() => {
        return () => {
            clearAllThemeStyles();
        };
    }, []);

    useEffect(() => {
        // window.tiptapRefs = tiptapRefs.current;
        const handleChangeTiptapRefs = (e: ChangeTiptapRefsEvent) => {
            if (e.detail.type === 'remove') {
                delete tiptapRefs.current.editors[e.detail.elementId];
            } else if (e.detail.type === 'update') {
                tiptapRefs.current.editors[e.detail.elementId].editor.commands.setContent(e.detail.content);
            }
        };

        ChangeTiptapRefsEvent.addEventListener(handleChangeTiptapRefs);

        return () => {
            ChangeTiptapRefsEvent.removeEventListener(handleChangeTiptapRefs);
        };
    }, [presentation]);

    // Warn user about unsaved changes when leaving the page
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (unsavedChanges || savingStatus === 'saving') {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [unsavedChanges, savingStatus]);

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
        if (!presentation || !presentation.themeId) {
            setCurrentTheme(defaultThemes[0]);
            return;
        }

        const savedTheme =
            themes.find(theme => theme.id === presentation.themeId) ||
            defaultThemes.find(theme => theme.id === presentation.themeId);
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        }

        return () => {
            setCurrentTheme(undefined);
        };
    }, [presentation, themes, setCurrentTheme, defaultThemes]);

    // Load themes separately
    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

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
        setCurrentTheme(defaultTheme);

        if (presentation) {
            setTheme(presentation.id, null);
        }

        setIsThemePopoverOpen(false);
    }, [presentation, defaultTheme, setCurrentTheme, setTheme]);

    // Function to navigate to view mode
    const handleViewPresentation = useCallback(() => {
        if (presentation) {
            window.open(`/view/${presentation.id}`, '_blank');
        }
    }, [presentation]);

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

    const renderTabs = useMemo(() => {
        return (
            <>
                <div className={styles.themeTabs}>
                    <div
                        className={cn(styles.themeTab, themeTab === 'user' && styles.themeTabActive)}
                        onClick={() => setThemeTab('user')}
                    >
                        Мои
                    </div>
                    <div
                        className={cn(styles.themeTab, themeTab === 'default' && styles.themeTabActive)}
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
                                    <ThemeVariant
                                        key={theme.id}
                                        theme={theme}
                                        currentTheme={currentTheme}
                                        handleThemeChange={handleThemeChange}
                                    />
                                    // <div
                                    //     key={theme.id}
                                    //     className={cn(
                                    //         styles.themeOption,
                                    //         currentTheme?.id === theme.id && styles.themeOptionSelected
                                    //     )}
                                    //     onClick={() => handleThemeChange(theme)}
                                    //     role="button"
                                    //     aria-label={`Select theme ${theme.name}`}
                                    //     onKeyDown={e => e.key === 'Enter' && handleThemeChange(theme)}
                                    // >
                                    //     <div
                                    //         className={styles.themeColorPreview}
                                    //         style={{
                                    //             backgroundColor: theme.colors.primaryAccent,
                                    //         }}
                                    //     />
                                    //     <span>{theme.name}</span>
                                    // </div>
                                ))
                            ) : (
                                <div className={styles.noThemesText}>Нет доступных пользовательских тем</div>
                            )}
                            <div className={styles.themeManageLink}>
                                <Link href="/themes" className={styles.themeManageLinkText}>
                                    Управление темами
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            {defaultThemes.length > 0 ? (
                                defaultThemes.map(theme => (
                                    <ThemeVariant
                                        key={theme.id}
                                        theme={theme}
                                        currentTheme={currentTheme}
                                        handleThemeChange={handleThemeChange}
                                    />
                                ))
                            ) : (
                                <div className={styles.noThemesText}>Нет доступных тем</div>
                            )}
                        </>
                    )}
                </div>
            </>
        );
    }, [themeTab, themes, defaultThemes, currentTheme, handleThemeChange]);

    if (isLoading) return loadingUI;
    if (notFound || !presentation) return <NotFoundPage />;

    return (
        <>
            <ReadOnlyProvider isReadOnly={false}>
                <ThemeStylesApplier
                    theme={currentTheme || defaultTheme}
                    backgroundSettings={presentation.backgroundSettings}
                    className={styles.container}
                >
                    <MobileWarningOverlay />
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
                                                {themes.length > 0 && renderTabs}
                                                {themes.length === 0 && (
                                                    <>
                                                        {defaultThemes.map(theme => (
                                                            <ThemeVariant
                                                                key={theme.id}
                                                                theme={theme}
                                                                currentTheme={currentTheme}
                                                                handleThemeChange={handleThemeChange}
                                                            />
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        }
                                    />

                                    <div className={styles.headerDivider} />

                                    <Tooltip content="Просмотр">
                                        <button
                                            onClick={handleViewPresentation}
                                            className={styles.viewButton}
                                            aria-label="View presentation"
                                        >
                                            <FaEye className={styles.viewIcon} aria-hidden="true" />
                                        </button>
                                    </Tooltip>

                                    <SimplePdfExportButton
                                        presentationId={presentation.id}
                                        presentationTitle={presentation.title}
                                    />

                                    <div className={styles.headerDivider} />
                                    {/* <Tooltip content="Скачать">
                                        <button
                                            onClick={handleDownloadPresentation}
                                            className={styles.downloadButton}
                                            aria-label="Download presentation"
                                            disabled={isDownloading}
                                        >
                                            <FaDownload className={styles.downloadIcon} aria-hidden="true" />
                                        </button>
                                    </Tooltip> */}

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
                                        trigger={
                                            <div
                                                className={styles.userInfo}
                                                role="button"
                                                aria-label="Open user menu"
                                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                                onKeyDown={e => e.key === 'Enter' && setIsUserMenuOpen(!isUserMenuOpen)}
                                            >
                                                <FaUser className={styles.userIcon} />
                                                {/* Username removed for compact header */}
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
                                defaultSlideBackground={currentTheme?.colors.slideBackground}
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
