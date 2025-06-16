/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow';
import ColorPicker from '@/components/ui/ColorPicker';

import styles from './BackgroundSettingsModal.module.css';

interface BackgroundSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    presentationId: string;
}

const BackgroundSettingsModal: React.FC<BackgroundSettingsModalProps> = ({ isOpen, onClose, presentationId }) => {
    const initialSettings = usePresentationStore(useShallow(state => state.getBackgroundSettings(presentationId)));

    const [backgroundColor, setBackgroundColor] = useState<string>(initialSettings?.backgroundColor || '#ffffff00');
    const [backgroundImage, setBackgroundImage] = useState<string>(initialSettings?.backgroundImage || '');

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
            setBackgroundColor(initialSettings?.backgroundColor || '#ffffff00');
            setBackgroundImage(initialSettings?.backgroundImage || '');
        }
    }, [isOpen, initialSettings]);

    const handleSave = () => {
        usePresentationStore.getState().setBackgroundSettings(presentationId, {
            backgroundColor,
            backgroundImage: backgroundImage.trim() || undefined,
        });
        onClose();
    };

    const handleReset = () => {
        setBackgroundColor('#ffffff00');
        setBackgroundImage('');
        usePresentationStore.getState().setBackgroundSettings(presentationId, {
            backgroundColor: undefined,
            backgroundImage: 'none',
        });
        onClose();
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
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className={styles.backgroundSettingsModalContentColorPickerLabel} htmlFor="bg-image-url">
                        Ссылка на изображение (URL)
                    </label>
                    <input
                        id="bg-image-url"
                        type="url"
                        className={styles.backgroundSettingsModalContentColorPickerInput}
                        value={backgroundImage && backgroundImage !== 'none' ? backgroundImage : ''}
                        onChange={e => setBackgroundImage(e.target.value)}
                        placeholder="https://example.com/image.png"
                        aria-label="Ссылка на изображение для фона"
                    />
                </div>
                <div className={styles.backgroundSettingsModalContentColorPickerButtons}>
                    <button
                        type="button"
                        className={styles.backgroundSettingsModalContentColorPickerButtonsButton}
                        onClick={handleReset}
                        aria-label="Сбросить фон"
                    >
                        Сбросить
                    </button>
                    <button type="button" className={styles.saveButton} onClick={handleSave} aria-label="Сохранить фон">
                        Сохранить
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
