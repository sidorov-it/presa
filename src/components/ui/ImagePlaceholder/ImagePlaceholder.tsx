/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FaRegImage } from 'react-icons/fa6';
import { FiUpload, FiLink2, FiZap, FiX, FiCheck } from 'react-icons/fi';
import React, { ChangeEvent, useRef, useState, useEffect } from 'react';

export type ImagePlaceholderProps = {
    onUpload: (file: File) => void;
    onLink: (url: string) => void;
    onGenerate: () => void;
};

import styles from './ImagePlaceholder.module.css';

export const ImagePlaceholder = ({ onUpload, onLink, onGenerate }: ImagePlaceholderProps) => {
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const [linkValue, setLinkValue] = useState('');
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const linkBtnRef = useRef<HTMLButtonElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onUpload(event.target.files[0]);
        }
    };

    const handleKeyDown =
        (callback: () => void) => (event: React.KeyboardEvent<HTMLButtonElement | HTMLLabelElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                callback();
            }
        };

    // Открыть попап и сфокусировать инпут
    const handleOpenLinkPopup = () => {
        setShowLinkPopup(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Закрыть попап
    const handleClosePopup = () => {
        setShowLinkPopup(false);
        setLinkValue('');
        setError('');
    };

    // Клик вне попапа
    useEffect(() => {
        if (!showLinkPopup) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(e.target as Node) &&
                linkBtnRef.current &&
                !linkBtnRef.current.contains(e.target as Node)
            ) {
                handleClosePopup();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showLinkPopup]);

    // Esc для закрытия
    useEffect(() => {
        if (!showLinkPopup) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClosePopup();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [showLinkPopup]);

    // Вставить ссылку
    const handleInsertLink = () => {
        if (!linkValue.trim()) {
            setError('Введите ссылку');
            return;
        }
        if (!/^https?:\/\//.test(linkValue.trim())) {
            setError('Ссылка должна начинаться с http:// или https://');
            return;
        }
        onLink(linkValue.trim());
        handleClosePopup();
    };

    // Enter в инпуте
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleInsertLink();
        }
        if (e.key === 'Escape') {
            handleClosePopup();
        }
    };

    return (
        <div className={styles.container}>
            <FaRegImage className={styles.imagePlaceholderIcon} aria-label="Пустое изображение" />
            <div className={styles.imagePlaceholderButtons}>
                {/* Загрузить */}
                <label
                    tabIndex={0}
                    aria-label="Загрузить изображение"
                    className={styles.imagePlaceholderUploadButton}
                    onKeyDown={handleKeyDown(() => document.getElementById('image-upload-input')?.click())}
                >
                    <FiUpload style={{ fontSize: '1.25rem', lineHeight: '1.75rem', color: '#6B7280' }} />
                    <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                        tabIndex={-1}
                    />
                </label>
                {/* Вставить ссылку */}
                <button
                    type="button"
                    tabIndex={0}
                    aria-label="Вставить ссылку на изображение"
                    className={styles.imagePlaceholderLinkButton}
                    onClick={handleOpenLinkPopup}
                    onKeyDown={handleKeyDown(handleOpenLinkPopup)}
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
                    onClick={onGenerate}
                    onKeyDown={handleKeyDown(onGenerate)}
                >
                    <FiZap className={styles.generateIcon} />
                </button>
                {/* Dropdown-попап для ссылки */}
                {showLinkPopup && (
                    <div
                        ref={popupRef}
                        className={styles.imagePlaceholderLinkPopup}
                        style={{ minWidth: 260 }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            aria-label="Закрыть"
                            className={styles.imagePlaceholderLinkPopupCloseButton}
                            onClick={handleClosePopup}
                        >
                            <FiX className={styles.imagePlaceholderLinkPopupCloseButtonIcon} />
                        </button>
                        <div className={styles.imagePlaceholderLinkPopupTitle}>Вставьте ссылку на изображение</div>
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
                        />
                        {error && <div className={styles.imagePlaceholderLinkPopupError}>{error}</div>}
                        <button
                            type="button"
                            className={styles.imagePlaceholderLinkPopupButton}
                            onClick={handleInsertLink}
                            disabled={!linkValue.trim()}
                        >
                            <FiCheck className={styles.imagePlaceholderLinkPopupButtonIcon} />
                            Вставить
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
