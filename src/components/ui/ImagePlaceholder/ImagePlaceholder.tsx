/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FaRegImage } from 'react-icons/fa6';
import { FiUpload, FiLink2, FiZap, FiX, FiCheck } from 'react-icons/fi';
import React, { ChangeEvent, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type ImagePlaceholderProps = {
    onUpdateLink: (link: string) => void;
};

import styles from './ImagePlaceholder.module.css';

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

    const handleInsertLink = () => {
        if (!linkValue.trim()) {
            setError('Введите ссылку');
            return;
        }
        if (!/^https?:\/\//.test(linkValue.trim())) {
            setError('Ссылка должна начинаться с http:// или https://');
            return;
        }
        onSubmit(linkValue.trim());
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleInsertLink();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    // Calculate position relative to the button
    const buttonRect = buttonRef.current?.getBoundingClientRect();

    let popupStyle = {};
    if (buttonRect) {
        popupStyle = {
            position: 'fixed' as const,
            top: `${buttonRect.bottom + 8}px`,
            left: `${buttonRect.left - 120 + buttonRect.width / 2}px`,
            minWidth: '240px',
            zIndex: 1000,
        };
    }

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
        </div>,
        document.body
    );
};

export const ImagePlaceholder = ({ onUpdateLink }: ImagePlaceholderProps) => {
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const linkBtnRef = useRef<HTMLButtonElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const formData = new FormData();
            formData.append('file', event.target.files[0]);

            fetch('/api/assets/upload', {
                method: 'POST',
                body: formData,
            }).then(response => {
                response.json().then(data => {
                    onUpdateLink(data.url);
                });
            });
            // onUpload(event.target.files[0]);
        }
    };

    const onGenerate = () => {
        console.log('onGenerate');
    };


    const handleKeyDown =
        (callback: () => void) => (event: React.KeyboardEvent<HTMLButtonElement | HTMLLabelElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                callback();
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
                    onClick={() => setShowLinkPopup(true)}
                    onKeyDown={handleKeyDown(() => setShowLinkPopup(true))}
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
                {/* Портал для попапа */}
                {showLinkPopup && (
                    <LinkPopup
                        onClose={() => setShowLinkPopup(false)}
                        onSubmit={url => {
                            onUpdateLink(url);
                            setShowLinkPopup(false);
                        }}
                        buttonRef={linkBtnRef}
                    />
                )}
            </div>
        </div>
    );
};
