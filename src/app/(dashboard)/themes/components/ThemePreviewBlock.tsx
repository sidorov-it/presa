/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { useEffect, useRef, useState } from 'react';
import { Theme } from '@/types/theme';
import styles from './ThemePreviewBlock.module.css';
import { FaCopy, FaEye, FaTrash } from 'react-icons/fa';
import { HiOutlineDotsVertical } from 'react-icons/hi';

interface ThemePreviewProps {
    theme: Theme;
    isReadOnly?: boolean;
    onClickEdit?: () => void;
    onClickDuplicate?: () => void;
    onClickDelete?: () => void;
}

const ThemePreviewBlock: React.FC<ThemePreviewProps> = ({
    theme,
    isReadOnly = false,
    onClickEdit,
    onClickDuplicate,
    onClickDelete,
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        if (menuButtonRef.current) {
            const rect = menuButtonRef.current.getBoundingClientRect();

            let right;
            let left;
            let top;
            let bottom;

            if (rect.right + 200 > window.innerWidth) {
                right = 0;
                left = 'unset';
            }

            if (rect.bottom + 130 > window.innerHeight) {
                bottom = 0;
                top = 'unset';
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
        <div className={styles.themeCard} onClick={onClickEdit}>
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
                            theme.colors.pageBackground.type === 'image'
                                ? `url(${theme.colors.pageBackground.imageUrl})`
                                : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Sample Slide Card */}
                    <div
                        className={styles.slideCard}
                        style={{
                            backgroundColor: theme.colors.slideBackground,
                            borderRadius: theme.design.slide.borderRadius,
                            borderWidth: getBorderWidth(theme.design.slide.borderWidth),
                            borderColor: theme.design.slide.borderColor,
                            boxShadow: getBoxShadow(theme.design.slide.shadow),
                            opacity: theme.design.slide.opacity,
                        }}
                    >
                        {/* Sample Content */}
                        <div className={styles.slideContent}>
                            <h3
                                className={styles.slideTitle}
                                style={{
                                    fontFamily: theme.typography.headingFont,
                                    fontWeight: theme.typography.headingWeight,
                                    color: theme.typography.headingColor,
                                    lineHeight: theme.typography.headingLineHeight,
                                    // letterSpacing: `${theme.typography.headingLetterSpacing}px`,
                                    textTransform: theme.typography.headingCapitalization,
                                }}
                            >
                                Title
                            </h3>
                            <p
                                className={styles.slideText}
                                style={{
                                    fontFamily: theme.typography.bodyFont,
                                    fontWeight: theme.typography.bodyWeight,
                                    color: theme.typography.bodyColor,
                                    lineHeight: theme.typography.bodyLineHeight,
                                    // letterSpacing: `${theme.typography.bodyLetterSpacing}px`,
                                    textTransform: theme.typography.bodyCapitalization,
                                }}
                            >
                                Body &{' '}
                                <span
                                    className={styles.slideLink}
                                    style={{ color: theme.design.buttons.linkColor || theme.colors.primaryAccent }}
                                >
                                    link
                                </span>
                            </p>
                        </div>
                    </div>
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
                                <div className={styles.menuDropdown} style={menuPosition}>
                                    <button onClick={onClickEdit} className={styles.menuItem}>
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

                    {/* <button
                        className={styles.menuButton}
                        onClick={handleMenuClick}
                        onKeyDown={handleKeyDown}
                        aria-label={`Open menu for ${theme.name} theme`}
                        tabIndex={0}
                    >
                        <span className={styles.menuDots}>⋯</span>
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default ThemePreviewBlock;
