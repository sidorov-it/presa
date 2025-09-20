/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/interactive-supports-focus */
'use client';

import { useEffect, useState, useCallback, useMemo, useRef, MutableRefObject } from 'react';
import { useParams } from 'next/navigation';
import { PresentationState, usePresentationStore } from '@/store/presentationStore';
import { useSession, signOut } from 'next-auth/react';
import Editor from '@/components/editor/Editor/Editor';
import { EditorElement, TipTapRefs } from '@/types';
import UndoRedoControls from '@/components/UndoRedoControls/UndoRedoControls';
import { ThemeIcon } from '@/components/icons';
import { useThemeStore } from '@/store/themeStore';
import Link from 'next/link';
import { FaSignOutAlt, FaCog } from 'react-icons/fa';
import BackgroundSettingsModal from '@/components/editor/BackgroundSettingsModal/BackgroundSettingsModal';
import styles from './page.module.css';
import ThemeStylesApplier from '@/components/viewer/theme/ThemeStylesApplier';
import ThemeDebugButton from '@/components/debug/ThemeDebugButton';
import HistoryDebugPopup from '@/components/ui/HistoryDebugPopup';
import DragDropDebugInfo from '@/components/DragDropDebugInfo';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';
import { useColorMode } from '@/components/ui/color-mode';
import { useUIStateStore } from '@/store/uiStateStore';
import { ReadOnlyProvider } from '@/contexts/ReadOnlyContext';
import { useTokens } from '@/hooks/useTokens';
import { formatTokenAmount } from '@/utils/formatTokenAmount';
import { Tooltip } from '@/components/ui/tooltip';
import { clearAllThemeStyles, getSlideLayoutVars } from '@/utils/themeUtils';
import { SimplePdfExportButton } from '@/components/export';
import { ChangeTiptapRefsEvent } from '@/customEvents/ChangeTiptapRefsEvent';
import { LuSettings, LuUser, LuHouse, LuCoins, LuPlay } from 'react-icons/lu';
import Popover from '@/components/ui/Popover';
import { useShallow } from 'zustand/react/shallow';
import FontLoader from '@/components/theme/components/Fonts/FontLoader';
import { Content } from '@tiptap/react';
import UIStateDebugButton from '@/components/debug/UIStateDebugButton';
import OnboardingUI from './OnboardingUI';

const Header = ({
    presentationId,
    tiptapRefs,
    handleViewPresentation,
    handleOpenBgModal,
    handleKeyDownCog,
    isMobile,
}: {
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    handleViewPresentation: () => void;
    handleOpenBgModal: () => void;
    handleKeyDownCog: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
    isMobile: boolean;
}) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] = useState(false);
    const { data: session } = useSession();
    // Token management
    const { balance: tokenBalance, loading: tokensLoading } = useTokens();

    const handleSignOut = useCallback(() => {
        signOut({ callbackUrl: '/' });
    }, []);

    const updatePresentation = usePresentationStore(state => state.updatePresentation);
    const setCurrentPresentationTitle = usePresentationStore(state => state.setCurrentPresentationTitle);
    const presentationTitle = usePresentationStore(state => state.currentPresentationTitle);
    const [title, setTitle] = useState(presentationTitle);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // Get slides for mobile navigation
    const slideIds = usePresentationStore(
        useShallow((state: PresentationState) => {
            const presentation = state.presentations.find(p => p.id === presentationId);
            return presentation ? presentation.slides.map(slide => slide.id) : [];
        })
    );

    const getSlideTitle = useCallback(
        (slideId: string) => {
            const slide = usePresentationStore.getState().getSlide(presentationId, slideId);
            if (!slide) return `Слайд ${slideIds.indexOf(slideId) + 1}`;

            // Try to get title from first text element
            const firstLayout = slide.layouts[0];
            if (firstLayout && firstLayout.elements.length > 0) {
                const firstElement = firstLayout.elements[0];
                if (firstElement.elementTypeId === 'text' && (firstElement as EditorElement).content) {
                    // Extract plain text from HTML content
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = (firstElement as EditorElement).content;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';
                    return (
                        plainText.slice(0, 50) + (plainText.length > 50 ? '...' : '') ||
                        `Слайд ${slideIds.indexOf(slideId) + 1}`
                    );
                }
            }
            return `Слайд ${slideIds.indexOf(slideId) + 1}`;
        },
        [presentationId, slideIds]
    );

    const handleSlideNavigation = useCallback((slideId: string) => {
        const slideElement = document.querySelector(`[data-slide-id="${slideId}"]`);
        if (slideElement) {
            slideElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
        setIsHamburgerMenuOpen(false);
    }, []);

    useEffect(() => {
        setTitle(presentationTitle);
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
        const trimmed = title.trim();
        if (trimmed === '') {
            setTitle('Новая презентация');
            setCurrentPresentationTitle('Новая презентация');
            updatePresentation(presentationId, { title: 'Новая презентация' });
        } else {
            updatePresentation(presentationId, { title: trimmed });
        }
        setIsEditingTitle(false);
    }, [presentationId, title, updatePresentation, setCurrentPresentationTitle]);

    const handleTitleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            (e.target as HTMLInputElement).blur();
        }
    }, []);

    // Mobile header layout
    if (isMobile) {
        return (
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.mobileHeaderLayout}>
                        <Link href="/dashboard" className={styles.mobileHomeButton} aria-label="Домой">
                            <LuHouse className={styles.homeIcon} aria-hidden="true" />
                        </Link>

                        <div className={styles.mobileTitleContainer}>
                            <span className={styles.mobileTitle}>{title}</span>
                        </div>

                        <button
                            className={styles.hamburgerButton}
                            onClick={() => setIsHamburgerMenuOpen(!isHamburgerMenuOpen)}
                            aria-label="Открыть меню слайдов"
                        >
                            <div className={styles.hamburgerIcon}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile hamburger menu */}
                {isHamburgerMenuOpen && (
                    <div className={styles.hamburgerMenu}>
                        <div className={styles.hamburgerMenuContent}>
                            <div className={styles.hamburgerMenuHeader}>
                                <h3 className={styles.hamburgerMenuTitle}>Слайды</h3>
                                <button
                                    className={styles.hamburgerMenuClose}
                                    onClick={() => setIsHamburgerMenuOpen(false)}
                                    aria-label="Закрыть меню"
                                >
                                    ×
                                </button>
                            </div>
                            <div className={styles.hamburgerMenuList}>
                                {slideIds.map((slideId, index) => (
                                    <button
                                        key={slideId}
                                        className={styles.hamburgerMenuItem}
                                        onClick={() => handleSlideNavigation(slideId)}
                                    >
                                        <span className={styles.slideNumber}>{index + 1}</span>
                                        <span className={styles.slideTitle}>{getSlideTitle(slideId)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </header>
        );
    }

    // Desktop header layout (existing code)
    return (
        <header className={styles.header}>
            <div className={styles.headerContent}>
                <div className={styles.headerLeft}>
                    <Link href="/dashboard" className={styles.homeButton} aria-label="Домой">
                        <LuHouse className={styles.homeIcon} aria-hidden="true" />
                    </Link>
                    {isEditingTitle ? (
                        <input
                            className={styles.titleInput}
                            value={title}
                            onChange={handleTitleChange}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus={true}
                            placeholder="Новая презентация"
                        />
                    ) : (
                        <span className={styles.titleDisplay} onClick={() => setIsEditingTitle(true)} data-tour="title">
                            {title}
                        </span>
                    )}
                </div>

                <div className={styles.headerRight}>
                    <div
                        className={styles.themeButton}
                        role="button"
                        aria-label="Открыть выбор темы"
                        onClick={() => useUIStateStore.getState().openSideMenu('theme-select', { presentationId })}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                useUIStateStore.getState().openSideMenu('theme-select', { presentationId });
                            }
                        }}
                        data-tour="theme"
                    >
                        <ThemeIcon />
                        <span>Тема</span>
                    </div>

                    <Tooltip content="Просмотр">
                        <button
                            onClick={handleViewPresentation}
                            className={styles.viewButton}
                            aria-label="Просмотреть презентацию"
                            data-tour="view"
                        >
                            <LuPlay className={styles.viewIcon} aria-hidden="true" />
                        </button>
                    </Tooltip>

                    <div data-tour="export">
                        <SimplePdfExportButton presentationId={presentationId} />
                    </div>

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
                        data-tour="settings"
                    >
                        <LuSettings className={styles.settingsIcon} aria-hidden="true" />
                    </button>

                    <div className={styles.headerDivider} />

                    <Popover
                        isOpen={isUserMenuOpen}
                        className={styles.popoverOverride}
                        classNamePositioner={styles.popoverOverridePositioner}
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
                                        <LuCoins className={styles.creditsIcon} />
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
    const [isMobileEditNoticeClosed, setIsMobileEditNoticeClosed] = useState(false);

    // Mobile detection state
    const [isMobile, setIsMobile] = useState(false);

    const [slideLayoutVars, setSlideLayoutVars] = useState<React.CSSProperties & { [key: string]: string | number }>(
        {}
    );

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Mobile detection effect
    useEffect(() => {
        const checkMobile = () => {
            console.log('checkMobile', window.innerWidth < 1024);
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    useEffect(() => {
        window.addEventListener('orientationchange', () => {
            const vars = getSlideLayoutVars({
                aspectRatio: 1.7777777777777777,
                themeFontSize: 18,
                cardFontScale: 1,
                renderMode: 'edit',
            });
            setSlideLayoutVars(vars);
        });

        window.addEventListener('resize', () => {
            // debugger;
            const vars = getSlideLayoutVars({
                aspectRatio: 1.7777777777777777,
                themeFontSize: 18,
                cardFontScale: 1,
                renderMode: 'edit',
            });
            setSlideLayoutVars(vars);
        });
        return () => {
            window.removeEventListener('resize', () => {});
        };
    }, []);

    useEffect(() => {
        if (!isLoading && currentTheme && !notFound) {
            const vars = getSlideLayoutVars({
                aspectRatio: 1.7777777777777777,
                themeFontSize: 18,
                cardFontScale: 1,
                renderMode: 'edit',
            });
            setSlideLayoutVars(vars);
        }
    }, [isLoading, currentTheme, notFound]);

    useEffect(() => {
        // window.tiptapRefs = tiptapRefs.current;
        const handleChangeTiptapRefs = (e: ChangeTiptapRefsEvent) => {
            if (e.detail.type === 'remove') {
                delete tiptapRefs.current.editors[e.detail.elementId];
            } else if (e.detail.type === 'update') {
                tiptapRefs.current.editors[e.detail.elementId].editor.commands.setContent(e.detail.content as Content);
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
        if (!presentationMeta || allThemes.length === 0) {
            // setCurrentTheme(defaultThemes[0]);
            return;
        }

        if (!presentationMeta.themeId) {
            const defaultTheme = allThemes.find(theme => theme.defaultForNewPresentations);
            if (defaultTheme) {
                setCurrentTheme(defaultTheme);
            }
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
        <OnboardingUI>
            <ReadOnlyProvider isReadOnly={isMobile}>
                <SavingStatusAlert />
                <ThemeStylesApplier
                    theme={currentTheme}
                    backgroundSettings={{}}
                    className={styles.container}
                    colorMode={colorMode}
                >
                    <FontLoader theme={currentTheme} />
                    {/* <MobileWarningOverlay /> */}
                    <div ref={containerRef} className={colorMode === 'dark' ? 'dark' : ''} style={slideLayoutVars}>
                        <Header
                            presentationId={id}
                            tiptapRefs={tiptapRefs}
                            handleViewPresentation={handleViewPresentation}
                            handleOpenBgModal={handleOpenBgModal}
                            handleKeyDownCog={handleKeyDownCog}
                            isMobile={isMobile}
                        />
                        <main className={styles.main}>
                            <div
                                className="first-step"
                                style={{ position: 'fixed', top: '50%', left: '50%', width: 1, height: 1, opacity: 0 }}
                            />
                            <div data-tour="editor">
                                <Editor presentationId={id} tiptapRefs={tiptapRefs} theme={currentTheme} />
                            </div>
                            <div
                                className="last-step"
                                style={{ position: 'fixed', bottom: 0, right: 0, width: 1, height: 1, opacity: 0 }}
                            />
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
                                    <UIStateDebugButton />
                                </>
                            )}
                        </main>
                        {isMobile && !isMobileEditNoticeClosed && (
                            <div className={styles.mobileEditNotice} onClick={() => setIsMobileEditNoticeClosed(true)}>
                                Для редактирования презентации перейдите на компьютер
                            </div>
                        )}
                    </div>
                </ThemeStylesApplier>
            </ReadOnlyProvider>
        </OnboardingUI>
    );
}
