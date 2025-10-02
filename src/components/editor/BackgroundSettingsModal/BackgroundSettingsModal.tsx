/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { useThemeStore } from '@/store/themeStore';
import { useShallow } from 'zustand/react/shallow';
import ColorPicker from '@/components/ui/ColorPicker';

import styles from './BackgroundSettingsModal.module.css';

interface BackgroundSettingsModalProps {
    defaultSlideBackground?: string;
    isOpen: boolean;
    onClose: () => void;
    presentationId: string;
}

const BackgroundSettingsModal: React.FC<BackgroundSettingsModalProps> = ({
    defaultSlideBackground,
    isOpen,
    onClose,
    presentationId,
}) => {
    const initialSettings = usePresentationStore(useShallow(state => state.getBackgroundSettings(presentationId)));
    const getCurrentThemeSlideBackground = useThemeStore(state => state.getCurrentThemeSlideBackground);
    const currentTheme = useThemeStore(state => state.currentTheme);

    const themeBackgroundColor = getCurrentThemeSlideBackground();
    const themeBackgroundImage =
        currentTheme?.colors?.pageBackground?.type === 'image' ? currentTheme.colors.pageBackground.imageUrl : '';

    const [backgroundColor, setBackgroundColor] = useState<string>(
        initialSettings?.backgroundColor || themeBackgroundColor || defaultSlideBackground || '#ffffff'
    );
    const [backgroundImage, setBackgroundImage] = useState<string>(
        initialSettings?.backgroundImage || themeBackgroundImage || ''
    );

    const [isWithoutImage, setIsWithoutImage] = useState<boolean>(false);
    // Фокус-ловушка
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            const currentThemeBg = getCurrentThemeSlideBackground();
            const currentThemeImage =
                currentTheme?.colors?.pageBackground?.type === 'image'
                    ? currentTheme.colors.pageBackground.imageUrl
                    : '';

            setBackgroundColor(
                initialSettings?.backgroundColor || currentThemeBg || defaultSlideBackground || '#ffffff'
            );
            setBackgroundImage(initialSettings?.backgroundImage || currentThemeImage || '');
        }
    }, [isOpen, initialSettings, defaultSlideBackground, getCurrentThemeSlideBackground, currentTheme]);

    const handleApply = () => {
        usePresentationStore.getState().setBackgroundSettings(presentationId, {
            backgroundColor,
            backgroundImage: backgroundImage.trim() || undefined,
        });
        onClose();
    };

    const handleReset = () => {
        const currentThemeBg = getCurrentThemeSlideBackground();
        const currentThemeImage =
            currentTheme?.colors?.pageBackground?.type === 'image' ? currentTheme.colors.pageBackground.imageUrl : '';

        setBackgroundColor(currentThemeBg || defaultSlideBackground || '#ffffff');
        setBackgroundImage(currentThemeImage || '');
        usePresentationStore.getState().setBackgroundSettings(presentationId, {
            backgroundColor: undefined,
            backgroundImage: undefined,
        });
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const formData = new FormData();
            formData.append('file', event.target.files[0]);

            fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            }).then(response => {
                response.json().then(data => {
                    setBackgroundImage(data.url);
                });
            });
        }
    };

    const handleClearImage = () => {
        setBackgroundImage('none');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={styles.backgroundSettingsModal}
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div
                className={styles.backgroundSettingsModalBackdrop}
                onClick={onClose}
                aria-label="Закрыть модалку"
                tabIndex={0}
            />
            {/* Modal content */}
            <div
                ref={modalRef}
                className={styles.backgroundSettingsModalContent}
                tabIndex={0}
                aria-label="Настройки фона презентации"
            >
                <h2 className={styles.backgroundSettingsModalContentTitle}>Настройки фона</h2>
                <div className={styles.backgroundSettingsModalContentColorPicker}>
                    <label className={styles.backgroundSettingsModalContentColorPickerLabel} htmlFor="color-picker">
                        Цвет фона
                    </label>
                    <ColorPicker value={backgroundColor} onChange={setBackgroundColor} className="" allowAlpha={true} />
                </div>
                <div className={styles.imagePickerSection}>
                    <label className={styles.backgroundSettingsModalContentColorPickerLabel} htmlFor="bg-image-upload">
                        Изображение фона
                    </label>

                    {backgroundImage && backgroundImage !== 'none' ? (
                        <div className={styles.imagePreview}>
                            <img src={backgroundImage} alt="Предпросмотр фона" className={styles.previewImage} />
                            <div className={styles.imageActions}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    id="bg-image-upload"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="bg-image-upload" className={styles.replaceButton}>
                                    Заменить
                                </label>
                                <button
                                    type="button"
                                    className={styles.clearButton}
                                    onClick={handleClearImage}
                                    aria-label="Удалить изображение"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.noImagePlaceholder}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                id="bg-image-upload"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="bg-image-upload" className={styles.uploadButton}>
                                Выбрать изображение
                            </label>
                        </div>
                    )}
                </div>
                <div className={styles.backgroundSettingsModalContentColorPickerButtons}>
                    <button
                        type="button"
                        className={styles.backgroundSettingsModalContentColorPickerButtonsButton}
                        onClick={handleCancel}
                        aria-label="Отменить изменения"
                    >
                        Отменить
                    </button>
                    <button
                        type="button"
                        className={styles.backgroundSettingsModalContentColorPickerButtonsButton}
                        onClick={handleReset}
                        aria-label="Сбросить настройки презентации"
                    >
                        Сбросить
                    </button>
                    <button
                        type="button"
                        className={styles.saveButton}
                        onClick={handleApply}
                        aria-label="Применить настройки"
                    >
                        Применить
                    </button>
                </div>
                <button
                    type="button"
                    className={styles.closeModalButton}
                    onClick={onClose}
                    aria-label="Закрыть модалку"
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BackgroundSettingsModal;
