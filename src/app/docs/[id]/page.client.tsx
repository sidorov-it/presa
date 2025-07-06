/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';

import { useEffect, useState, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { useParams } from 'next/navigation';
import { usePresentationStore } from '@/store/presentationStore';
import { useSession, signOut } from 'next-auth/react';
import Editor from '@/components/editor/Editor/Editor';
import { TipTapRefs } from '@/types';
import UndoRedoControls from '@/components/UndoRedoControls/UndoRedoControls';
import { ThemeIcon } from '@/components/icons';
import { useThemeStore } from '@/store/themeStore';
import Link from 'next/link';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import BackgroundSettingsModal from '@/components/editor/BackgroundSettingsModal/BackgroundSettingsModal';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import ThemeDebugButton from '@/components/debug/ThemeDebugButton';
import HistoryDebugPopup from '@/components/ui/HistoryDebugPopup';
import DragDropDebugInfo from '@/components/DragDropDebugInfo';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';
import { useColorMode } from '@/components/ui/color-mode';
import { useMenuStore } from '@/store/menuStore';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { useTokens } from '@/hooks/useTokens';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { Tooltip } from '@/components/ui/tooltip';
import MobileWarningOverlay from '@/components/MobileWarningOverlay/MobileWarningOverlay';
import { clearAllThemeStyles } from '@/utils/themeUtils';
import { SimplePdfExportButton } from '@/components/export';
import { ChangeTiptapRefsEvent } from '@/customEvents/ChangeTiptapRefsEvent';
import { LuEye, LuSettings, LuUser } from 'react-icons/lu';
import Popover from '@/components/ui/Popover';

const Header = ({
    presentationId,
    tiptapRefs,
    handleViewPresentation,
    handleOpenBgModal,
    handleKeyDownCog,
}: {
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    handleViewPresentation: () => void;
    handleOpenBgModal: () => void;
    handleKeyDownCog: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { data: session } = useSession();
    // Token management
    const { balance: tokenBalance, loading: tokensLoading } = useTokens();

    const handleSignOut = useCallback(() => {
        signOut({ callbackUrl: '/' });
    }, []);

    const updatePresentation = usePresentationStore(state => state.updatePresentation);
    const setCurrentPresentationTitle = usePresentationStore(state => state.setCurrentPresentationTitle);
    const presentationTitle = usePresentationStore(state => state.currentPresentationTitle);
    const [title, setTitle] = useState(presentationTitle || 'Новая презентация');

    useEffect(() => {
        setTitle(presentationTitle || 'Новая презентация');
    }, [presentationTitle]);

    const handleTitleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setTitle(value);
            setCurrentPresentationTitle(value);
        },
        [setCurrentPresentationTitle]
    );

    const handleTitleBlur = useCallback(() => {
        updatePresentation(presentationId, { title });
    }, [presentationId, title, updatePresentation]);

    return (
        <header className={styles.header}>
            <div className={styles.headerContent}>
                <div className={styles.headerLeft}>
                    <Link href="/" className={styles.homeButton}>
                        Home
                    </Link>
                    <input
                        className={styles.titleInput}
                        value={title}
                        onChange={handleTitleChange}
                        onBlur={handleTitleBlur}
                        placeholder="Новая презентация"
                    />
                </div>

                <div className={styles.headerRight}>
                    <div
                        className={styles.themeButton}
                        role="button"
                        aria-label="Открыть выбор темы"
                        onClick={() => useMenuStore.getState().openSideMenu('theme-select', { presentationId })}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                useMenuStore.getState().openSideMenu('theme-select', { presentationId });
                            }
                        }}
                    >
                        <ThemeIcon />
                        <span>Тема</span>
                    </div>

                    <Tooltip content="Просмотр">
                        <button
                            onClick={handleViewPresentation}
                            className={styles.viewButton}
                            aria-label="Просмотреть презентацию"
                        >
                            <LuEye className={styles.viewIcon} aria-hidden="true" />
                        </button>
                    </Tooltip>

                    <SimplePdfExportButton presentationId={presentationId} presentationTitle={''} />

                    <div className={styles.headerDivider} />
                    <UndoRedoControls presentationId={presentationId} tiptapRefs={tiptapRefs} />

                    <div className={styles.headerDivider} />

                    <button
                        type="button"
                        className={styles.settingsButton}
                        aria-label="Настроить фон презентации"
                        tabIndex={0}
                        onClick={handleOpenBgModal}
                        onKeyDown={handleKeyDownCog}
                    >
                        <LuSettings className={styles.settingsIcon} aria-hidden="true" />
                    </button>

                    <div className={styles.headerDivider} />

                    <Popover
                        isOpen={isUserMenuOpen}
                        onOpen={() => setIsUserMenuOpen(true)}
                        onClose={() => setIsUserMenuOpen(false)}
                        trigger={
                            <div
                                className={styles.userInfo}
                                role="button"
                                aria-label="Открыть меню пользователя"
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                onKeyDown={e => e.key === 'Enter' && setIsUserMenuOpen(!isUserMenuOpen)}
                            >
                                <LuUser className={styles.userIcon} />
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
                                        <span>{tokensLoading ? '...' : formatTokenAmount(tokenBalance)} токенов</span>
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
    );
};

const SavingStatusAlert = () => {
    const unsavedChanges = usePresentationStore(state => state.unsavedChanges);
    const savingStatus = usePresentationStore(state => state.savingStatus);

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

    return null;
};

export default function PresentationEditorPage() {
    const params = useParams();
    const id = params.id as string;
    const [isBgModalOpen, setIsBgModalOpen] = useState(false);
    const { status } = useSession();

    // Access store values individually to prevent unnecessary re-renders
    const loadPresentation = usePresentationStore(state => state.loadPresentation);
    const checkPresentationExists = usePresentationStore(state => state.checkPresentationExists);
    const clearCurrentPresentationMeta = usePresentationStore(state => state.clearCurrentPresentationMeta);

    // Get presentation from store instead of local state
    const presentationMeta = usePresentationStore(state => state.currentPresentationMeta);
    // const presentation = usePresentationStore(state => state.getPresentation(id as string));

    const allThemes = useThemeStore(state => state.allThemes);
    const defaultThemes = useThemeStore(state => state.defaultThemes);
    const loadThemes = useThemeStore(state => state.loadThemes);
    const currentTheme = useThemeStore(state => state.currentTheme);
    const setCurrentTheme = useThemeStore(state => state.setCurrentTheme);
    // const defaultTheme = useThemeStore(state => state.defaultThemes[0]);

    const { colorMode } = useColorMode();

    const tiptapRefs = useRef<TipTapRefs>({
        editors: {},
        editorRefs: [],
    });

    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cleanup function to clear theme styles when component unmounts
    useEffect(() => {
        return () => {
            clearAllThemeStyles();
            clearCurrentPresentationMeta();
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
    }, []);

    // Load presentation data only once when component mounts or ID changes
    useEffect(() => {
        if (status === 'loading' || !id) return;

        const load = async () => {
            try {
                // Check if presentation already exists in store
                if (checkPresentationExists(id as string)) {
                    const presentation = usePresentationStore.getState().getPresentation(id as string);

                    usePresentationStore.getState().setCurrentPresentationMeta({
                        id: id,
                        themeId: presentation!.themeId || null,
                        backgroundSettings: presentation!.backgroundSettings,
                    });
                    usePresentationStore.getState().setCurrentPresentationTitle(presentation!.title);
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
        if (!presentationMeta || !presentationMeta.themeId) {
            // setCurrentTheme(defaultThemes[0]);
            return;
        }

        const savedTheme =
            allThemes.find(theme => theme.id === presentationMeta.themeId) ||
            defaultThemes.find(theme => theme.id === presentationMeta.themeId);
        if (savedTheme) {
            setCurrentTheme(savedTheme);
        }

        return () => {
            setCurrentTheme(undefined);
        };
    }, [allThemes, setCurrentTheme, defaultThemes, presentationMeta]);

    // Load themes separately
    useEffect(() => {
        loadThemes().catch(error => {
            console.error('Failed to load themes:', error);
        });
    }, [loadThemes]);

    // Function to navigate to view mode
    const handleViewPresentation = useCallback(() => {
        window.open(`/view/${id}`, '_blank');
    }, [id]);

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

    // Memoize the loading and not found UI to prevent re-renders
    const loadingUI = useMemo(
        () => (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
            </div>
        ),
        []
    );

    if (isLoading || !currentTheme) return loadingUI;
    if (notFound) return <NotFoundPage />;

    return (
        <>
            <ReadOnlyProvider isReadOnly={false}>
                <SavingStatusAlert />
                <ThemeStylesApplier
                    theme={currentTheme}
                    backgroundSettings={{}}
                    className={styles.container}
                    colorMode={colorMode}
                >
                    <MobileWarningOverlay />
                    <div ref={containerRef} className={colorMode === 'dark' ? 'dark' : ''}>
                        <Header
                            presentationId={id}
                            tiptapRefs={tiptapRefs}
                            handleViewPresentation={handleViewPresentation}
                            handleOpenBgModal={handleOpenBgModal}
                            handleKeyDownCog={handleKeyDownCog}
                        />
                        <main className={styles.main}>
                            <Editor presentationId={id} tiptapRefs={tiptapRefs} />

                            <BackgroundSettingsModal
                                defaultSlideBackground={currentTheme?.colors.slideBackground}
                                isOpen={isBgModalOpen}
                                onClose={handleCloseBgModal}
                                presentationId={id}
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
