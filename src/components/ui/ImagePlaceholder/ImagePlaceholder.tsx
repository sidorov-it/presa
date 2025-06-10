/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FaRegImage } from 'react-icons/fa6';
import { FiUpload, FiLink2, FiZap, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import React, { ChangeEvent, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ImagePlaceholderProps = {
    imageUrl: string;
    isWidthRightMenu?: boolean;
    onClearImage: () => void;
    onUpdateLink: (link: string, uploaded: boolean) => void;
    // Element context for AI generation (optional)
    elementId?: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    itemId?: string; // For SmartLayout items
};

import styles from './ImagePlaceholder.module.css';
import { useMenuStore } from '@/store/menuStore';

const LinkPopup = ({
    onClose,
    onSubmit,
    buttonRef,
}: {
    onClose: () => void;
    onSubmit: (url: string) => void;
    buttonRef: React.RefObject<HTMLButtonElement>;
}) => {
    const [linkValue, setLinkValue] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [popupStyle, setPopupStyle] = useState({});

    const inputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose, buttonRef]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleInsertLink = async () => {
        if (!linkValue.trim()) {
            setError('Введите ссылку');
            return;
        }
        if (!/^https?:\/\//.test(linkValue.trim())) {
            setError('Ссылка должна начинаться с http:// или https://');
            return;
        }

        try {
            // Check if URL is from external domain
            const url = new URL(linkValue.trim());
            const isExternalUrl = !url.hostname.includes(window.location.hostname);

            if (isExternalUrl) {
                setIsLoading(true);
                setError('');

                const response = await fetch('/api/assets/upload-external', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ imageUrl: linkValue.trim() }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Не удалось загрузить изображение');
                }

                const data = await response.json();
                onSubmit(data.url);
                onClose();
            } else {
                // Local URL, use as is
                onSubmit(linkValue.trim());
                onClose();
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Не удалось загрузить изображение');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleInsertLink();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const updatePopupPosition = useCallback(() => {
        const buttonRect = buttonRef.current?.getBoundingClientRect();
        if (buttonRect) {
            setPopupStyle({
                position: 'fixed' as const,
                top: `${buttonRect.bottom + 8}px`,
                left: `${buttonRect.left - 120 + buttonRect.width / 2}px`,
                minWidth: '240px',
                zIndex: 1000,
            });
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            updatePopupPosition();
        };

        window.addEventListener('scroll', handleScroll);
        updatePopupPosition(); // Initial position update

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [updatePopupPosition]);

    return createPortal(
        <div
            ref={popupRef}
            className={styles.imagePlaceholderLinkPopup}
            style={popupStyle}
            role="dialog"
            aria-modal="true"
        >
            <button
                type="button"
                aria-label="Закрыть"
                className={styles.imagePlaceholderLinkPopupCloseButton}
                onClick={onClose}
            >
                <FiX className={styles.imagePlaceholderLinkPopupCloseButtonIcon} />
            </button>
            <div className={styles.imagePlaceholderLinkPopupTitle}>Вставьте ссылку</div>
            <input
                ref={inputRef}
                type="url"
                className={styles.imagePlaceholderLinkPopupInput}
                placeholder="https://example.com/image.png"
                value={linkValue}
                onChange={e => {
                    setLinkValue(e.target.value);
                    setError('');
                }}
                onKeyDown={handleInputKeyDown}
                aria-label="Ссылка на изображение"
                disabled={isLoading}
            />
            {error && <div className={styles.imagePlaceholderLinkPopupError}>{error}</div>}
            <button
                type="button"
                className={styles.imagePlaceholderLinkPopupButton}
                onClick={handleInsertLink}
                disabled={!linkValue.trim() || isLoading}
            >
                {isLoading ? (
                    <FiLoader className={`${styles.imagePlaceholderLinkPopupButtonIcon} ${styles.spin}`} />
                ) : (
                    <FiCheck className={styles.imagePlaceholderLinkPopupButtonIcon} />
                )}
                {isLoading ? 'Загрузка...' : 'Вставить'}
            </button>
        </div>,
        document.body
    );
};

export const ImagePlaceholder = ({
    onUpdateLink,
    imageUrl,
    onClearImage,
    isWidthRightMenu = false,
    elementId,
    presentationId,
    slideId,
    layoutId,
    itemId,
}: ImagePlaceholderProps) => {
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const linkBtnRef = useRef<HTMLButtonElement>(null);
    const elementRef = useRef<HTMLDivElement>(null);
    const [isSmallImage, setIsSmallImage] = useState(false);

    const [isOpenImageEditBox, setIsOpenImageEditBox] = useState(false);

    useEffect(() => {
        if (isSmallImage && isOpenImageEditBox) {
            useMenuStore.getState().openSideMenu('image-edit', {
                imageUrl,
                onClearImage,
                onUpdateLink,
                elementId,
                presentationId,
                slideId,
                layoutId,
                itemId,
                onCloseMenu: () => setIsOpenImageEditBox(false),
            });
        }
    }, [isSmallImage, isOpenImageEditBox, imageUrl, onClearImage, onUpdateLink, elementId, presentationId, slideId, layoutId, itemId]);

    useEffect(() => {
        if (!elementRef.current) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                setIsSmallImage(width < 160);
            }
        });

        resizeObserver.observe(elementRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const formData = new FormData();
            formData.append('file', event.target.files[0]);

            fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            }).then(response => {
                response.json().then(data => {
                    onUpdateLink(data.url, true);
                });
            });
            // onUpload(event.target.files[0]);
        }
    };

    const onGenerate = () => {
        // Open image edit panel in AI mode
        if (isWidthRightMenu) {
            useMenuStore.getState().openSideMenu('image-edit', {
                imageUrl,
                onClearImage,
                onUpdateLink,
                elementId,
                presentationId,
                slideId,
                layoutId,
                itemId,
                defaultMode: 'ai', // Start in AI mode
            });
        }
    };

    const handleKeyDown =
        (callback: () => void) => (event: React.KeyboardEvent<HTMLButtonElement | HTMLLabelElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                callback();
            }
        };

    const handleImageClick = () => {
        if (isWidthRightMenu && isSmallImage) {
            setIsOpenImageEditBox(true);
        }
    };

    return (
        <>
            <div
                ref={elementRef}
                className={`${styles.container} ${isSmallImage ? styles.smallImage : ''}`}
                onClick={handleImageClick}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleImageClick();
                    }
                }}
                tabIndex={0}
                role="button"
                aria-label="Открыть настройки изображения"
            >
                <FaRegImage className={styles.imagePlaceholderIcon} aria-label="Пустое изображение" />
                {!isSmallImage && (
                    <div className={styles.imagePlaceholderButtons}>
                        {/* Загрузить */}
                        <label
                            tabIndex={0}
                            aria-label="Загрузить изображение"
                            className={styles.imagePlaceholderUploadButton}
                            onKeyDown={handleKeyDown(() => {
                                if (isWidthRightMenu) {
                                    useMenuStore.getState().openSideMenu('image-edit', {
                                        imageUrl,
                                        onClearImage,
                                        onUpdateLink,
                                        elementId,
                                        presentationId,
                                        slideId,
                                        layoutId,
                                        itemId,
                                        defaultMode: 'upload',
                                    });
                                } else {
                                    document.getElementById('image-upload-input')?.click();
                                }
                            })}
                            onClick={e => {
                                e.stopPropagation();
                                if (isWidthRightMenu) {
                                    useMenuStore.getState().openSideMenu('image-edit', {
                                        imageUrl,
                                        onClearImage,
                                        onUpdateLink,
                                        elementId,
                                        presentationId,
                                        slideId,
                                        layoutId,
                                        itemId,
                                        defaultMode: 'upload',
                                    });
                                }
                            }}
                        >
                            <FiUpload style={{ fontSize: '1.25rem', lineHeight: '1.75rem', color: '#6B7280' }} />
                            {!isWidthRightMenu && (
                                <input
                                    id="image-upload-input"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                    tabIndex={-1}
                                />
                            )}
                        </label>
                        {/* Вставить ссылку */}
                        <button
                            type="button"
                            tabIndex={0}
                            aria-label="Вставить ссылку на изображение"
                            className={styles.imagePlaceholderLinkButton}
                            onClick={e => {
                                e.stopPropagation();
                                if (isWidthRightMenu) {
                                    useMenuStore.getState().openSideMenu('image-edit', {
                                        imageUrl,
                                        onClearImage,
                                        onUpdateLink,
                                        elementId,
                                        presentationId,
                                        slideId,
                                        layoutId,
                                        itemId,
                                        defaultMode: 'upload',
                                    });
                                } else {
                                    setShowLinkPopup(true);
                                }
                            }}
                            onKeyDown={handleKeyDown(() => {
                                if (isWidthRightMenu) {
                                    useMenuStore.getState().openSideMenu('image-edit', {
                                        imageUrl,
                                        onClearImage,
                                        onUpdateLink,
                                        elementId,
                                        presentationId,
                                        slideId,
                                        layoutId,
                                        itemId,
                                        defaultMode: 'upload',
                                    });
                                } else {
                                    setShowLinkPopup(true);
                                }
                            })}
                            ref={linkBtnRef}
                        >
                            <FiLink2 className={styles.linkIcon} />
                        </button>
                        {/* Сгенерировать */}
                        <button
                            type="button"
                            tabIndex={0}
                            aria-label="Сгенерировать изображение"
                            className={styles.imagePlaceholderGenerateButton}
                            onClick={e => {
                                e.stopPropagation();
                                onGenerate();
                            }}
                            onKeyDown={handleKeyDown(onGenerate)}
                        >
                            <FiZap className={styles.generateIcon} />
                        </button>
                        {/* Портал для попапа */}
                        {showLinkPopup && !isWidthRightMenu && (
                            <LinkPopup
                                onClose={() => setShowLinkPopup(false)}
                                onSubmit={url => {
                                    onUpdateLink(url, false);
                                    setShowLinkPopup(false);
                                }}
                                buttonRef={linkBtnRef}
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
