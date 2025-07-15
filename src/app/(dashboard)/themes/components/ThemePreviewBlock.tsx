/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '@/types/theme';
import styles from './ThemePreviewBlock.module.css';
import { FaCopy, FaEye, FaTrash } from 'react-icons/fa';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { getRequiredFontsFromTheme, loadFontsInContainer, unloadFontsFromContainer } from '@/utils/fontLoader';

interface ThemePreviewProps {
    theme: Theme;
    isReadOnly?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
    onClickDuplicate?: () => void;
    onClickDelete?: () => void;
}

const ThemePreviewBlock: React.FC<ThemePreviewProps> = ({
    theme,
    isReadOnly = false,
    isSelected = false,
    onClick,
    onClickDuplicate,
    onClickDelete,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top?: number; left?: number; right?: number; bottom?: number } | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [fontStyles, setFontStyles] = useState<{ [key: string]: string }>({});

    // Intersection Observer для ленивой загрузки
    useEffect(() => {
        if (!previewRef.current) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        // Отключаем observer после первого появления
                        if (observerRef.current) {
                            observerRef.current.disconnect();
                        }
                    }
                });
            },
            {
                rootMargin: '50px', // Начинаем загрузку за 50px до появления элемента
                threshold: 0.1,
            }
        );

        observerRef.current.observe(previewRef.current);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    // Загрузка ресурсов только когда элемент становится видимым
    useEffect(() => {
        if (!isVisible || !theme || !previewRef.current || isLoaded) return;

        const loadResources = async () => {
            try {
                // Get required font URLs from theme
                const fontUrls = getRequiredFontsFromTheme(theme);

                // Load the fonts in the preview container
                await loadFontsInContainer(fontUrls, previewRef.current!);

                setFontStyles({
                    '--presentation-body-font': `'${theme.typography.bodyFont}', sans-serif`,
                    '--presentation-heading-font': `'${theme.typography.headingFont}', sans-serif`,
                });

                setIsLoaded(true);
            } catch (error) {
                console.error('Error loading theme resources:', error);
            }
        };

        loadResources();
    }, [isVisible, theme, isLoaded]);

    // Очистка ресурсов при размонтировании
    // useEffect(() => {
    //     return () => {
    //         if (previewRef.current && isLoaded) {
    //             const fontUrls = getRequiredFontsFromTheme(theme);
    //             unloadFontsFromContainer(fontUrls, previewRef.current);
    //         }
    //     };
    // }, [theme, isLoaded]);

    useEffect(() => {
        if (menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();

            let right: number | undefined;
            let left: number | undefined;
            let top: number | undefined;
            let bottom: number | undefined;

            if (rect.right + 200 > window.innerWidth) {
                right = 0;
                left = undefined;
            } else {
                left = rect.left;
            }

            if (rect.bottom + 130 > window.innerHeight) {
                bottom = 0;
                top = undefined;
            } else {
                top = rect.bottom;
            }

            setMenuPosition({ top, left, right, bottom });
        }
    }, [menuButtonRef]);

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(true);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isMenuOpen && !(e.target as HTMLElement).closest(`.${styles.menuDropdown}`)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);

    const getBorderWidth = (borderWidth: string) => {
        if (borderWidth === 'none') return '0';
        if (borderWidth === 'thin') return '1px';
        if (borderWidth === 'medium') return '2px';
        return '3px';
    };

    const getBoxShadow = (shadow: string) => {
        if (shadow === 'none') return 'none';
        if (shadow === 'sm') return '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        return '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
    };

    return (
        <div
            ref={previewRef}
            className={`${styles.themeCard} ${isSelected ? styles.selected : ''}`}
            id={`theme-${theme.id}`}
            style={isLoaded ? fontStyles : {}}
            onClick={onClick}
        >
            <div className={styles.cardContent}>
                {/* Theme Preview */}
                <div
                    className={styles.previewContainer}
                    style={{
                        backgroundColor:
                            theme.colors.pageBackground.type === 'color'
                                ? theme.colors.pageBackground.color
                                : theme.colors.slideBackground,
                        backgroundImage:
                            isVisible && theme.colors.pageBackground.type === 'image'
                                ? `url(${theme.colors.pageBackground.imageUrl})`
                                : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Показываем placeholder пока ресурсы не загружены */}
                    {!isLoaded && (
                        <div className={styles.loadingPlaceholder}>
                            <div className={styles.loadingSpinner}></div>
                        </div>
                    )}

                    {/* Sample Slide Card - показываем только после загрузки */}
                    {isLoaded && (
                        <div
                            className={styles.slideCard}
                            style={
                                {
                                    backgroundColor: theme.colors.slideBackground,
                                    borderRadius: theme.design.slide.borderRadius,
                                    borderWidth: getBorderWidth(theme.design.slide.borderWidth),
                                    borderColor: theme.design.slide.borderColor,
                                    boxShadow: getBoxShadow(theme.design.slide.shadow),
                                    '--slide-opacity': theme.design.slide.opacity,
                                } as React.CSSProperties
                            }
                        >
                            {/* Sample Content */}
                            <div className={styles.slideContent}>
                                <h3
                                    className={styles.slideTitle}
                                    style={{
                                        fontFamily: 'var(--presentation-heading-font)',
                                        fontWeight: theme.typography.headingWeight,
                                        color: theme.typography.headingColor,
                                        lineHeight: theme.typography.headingLineHeight,
                                        textTransform: theme.typography.headingCapitalization,
                                    }}
                                >
                                    Заголовок
                                </h3>
                                <p
                                    className={styles.slideText}
                                    style={{
                                        fontFamily: 'var(--presentation-body-font)',
                                        fontWeight: theme.typography.bodyWeight,
                                        color: theme.typography.bodyColor,
                                        lineHeight: theme.typography.bodyLineHeight,
                                        textTransform: theme.typography.bodyCapitalization,
                                    }}
                                >
                                    Текст &{' '}
                                    <span
                                        className={styles.slideLink}
                                        style={{ color: theme.design.buttons.linkColor || theme.colors.primaryAccent }}
                                    >
                                        ссылка
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Theme Info */}
                <div className={styles.themeInfo}>
                    <h4 className={styles.themeName}>{theme.name}</h4>

                    {!isReadOnly && (
                        <button
                            onClick={handleMenuClick}
                            ref={menuButtonRef}
                            className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ''}`}
                        >
                            <HiOutlineDotsVertical />

                            {isMenuOpen && (
                                <div className={styles.menuDropdown} style={menuPosition || {}}>
                                    <button onClick={onClick} className={styles.menuItem}>
                                        <FaEye className={styles.menuIcon} />
                                        Редактировать
                                    </button>
                                    <button onClick={onClickDuplicate} className={styles.menuItem}>
                                        <FaCopy className={styles.menuIcon} />
                                        Дублировать
                                    </button>
                                    <button
                                        onClick={onClickDelete}
                                        className={`${styles.menuItem} ${styles.menuItemDanger}`}
                                    >
                                        <FaTrash className={styles.menuIcon} />
                                        Удалить
                                    </button>
                                </div>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThemePreviewBlock;
