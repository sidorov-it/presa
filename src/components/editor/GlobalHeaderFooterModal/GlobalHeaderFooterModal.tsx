/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { HeaderFooterConfig } from '@/types';
import HeaderFooterConfigurator from '@/components/editor/HeaderFooterConfigurator';
import { Button } from '@/components/ui/Button';
import Portal from '@/components/Portal';
import styles from './GlobalHeaderFooterModal.module.css';
import { RiCloseFill } from 'react-icons/ri';

interface GlobalHeaderFooterModalProps {
    isOpen: boolean;
    onClose: () => void;
    presentationId: string;
    slideId?: string; // Если передан, то это режим настроек конкретного слайда
}

const defaultHeaderFooter: HeaderFooterConfig = {
    enabled: false,
    left: { type: 'none' },
    center: { type: 'none' },
    right: { type: 'none' },
};

const GlobalHeaderFooterModal: React.FC<GlobalHeaderFooterModalProps> = ({
    isOpen,
    onClose,
    presentationId,
    slideId,
}) => {
    const { getPresentation, updatePresentation, getSlide, updateSlide } = usePresentationStore();
    const modalRef = useRef<HTMLDivElement>(null);

    const presentation = getPresentation(presentationId);
    const slide = slideId ? getSlide(presentationId, slideId) : null;

    const [header, setHeader] = useState<HeaderFooterConfig>(defaultHeaderFooter);
    const [footer, setFooter] = useState<HeaderFooterConfig>(defaultHeaderFooter);
    const [applyTo, setApplyTo] = useState<'all' | 'except-first' | 'except-first-last'>('all');

    // Check for slides with overrides (only in global mode)
    const slidesWithOverrides = !slideId
        ? presentation?.slides.filter(slide => slide.header || slide.footer) || []
        : [];

    // Determine if we're in slide mode or global mode
    const isSlideMode = !!slideId;

    // Handle modal focus and body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => modalRef.current?.focus(), 0);
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    // Load current settings
    useEffect(() => {
        if (isSlideMode && slide) {
            // Load slide-specific settings
            setHeader(slide.header || defaultHeaderFooter);
            setFooter(slide.footer || defaultHeaderFooter);
        } else if (presentation) {
            // Load global settings
            setHeader(presentation.headerFooterConfig?.header || defaultHeaderFooter);
            setFooter(presentation.headerFooterConfig?.footer || defaultHeaderFooter);
            setApplyTo(presentation.headerFooterConfig?.applyTo || 'all');
        }
    }, [presentation, slide, isSlideMode]);

    const handleSave = () => {
        if (isSlideMode && slideId) {
            // Update slide-specific settings
            updateSlide(presentationId, slideId, {
                header: header.enabled ? header : undefined,
                footer: footer.enabled ? footer : undefined,
            });
        } else {
            // Update global settings
            const globalConfig = {
                header,
                footer,
                applyTo,
            };

            updatePresentation(presentationId, {
                headerFooterConfig: globalConfig,
            });
        }
        onClose();
    };

    const handleCancel = () => {
        // Reset to original values
        if (isSlideMode && slide) {
            setHeader(slide.header || defaultHeaderFooter);
            setFooter(slide.footer || defaultHeaderFooter);
        } else if (presentation) {
            setHeader(presentation.headerFooterConfig?.header || defaultHeaderFooter);
            setFooter(presentation.headerFooterConfig?.footer || defaultHeaderFooter);
            setApplyTo(presentation.headerFooterConfig?.applyTo || 'all');
        }
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    return (
        <Portal>
            <div className={styles.modalOverlay} onClick={handleBackdropClick}>
                <div
                    ref={modalRef}
                    className={styles.modalContent}
                    tabIndex={-1}
                    role="dialog"
                    aria-modal="true"
                    onKeyDown={handleKeyDown}
                    onClick={handleModalContentClick}
                >
                    <div className={styles.modalHeader}>
                        <h2 className={styles.modalTitle}>
                            {isSlideMode ? 'Настройки колонтитулов слайда' : 'Глобальные настройки колонтитулов'}
                        </h2>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={handleCancel}
                            aria-label="Закрыть"
                        >
                            <RiCloseFill />
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        {slidesWithOverrides.length > 0 && (
                            <div className={styles.overridesWarning}>
                                <div className={styles.overridesWarningTitle}>
                                    ⚠️ Слайды с индивидуальными настройками
                                </div>
                                <div className={styles.overridesWarningText}>
                                    {slidesWithOverrides.length} слайд(ов) имеют собственные настройки колонтитулов,
                                    которые переопределяют глобальные настройки.
                                </div>
                            </div>
                        )}

                        <HeaderFooterConfigurator
                            header={header}
                            footer={footer}
                            onHeaderChange={setHeader}
                            onFooterChange={setFooter}
                            showApplyTo={!isSlideMode}
                            applyTo={applyTo}
                            onApplyToChange={setApplyTo}
                        />
                    </div>
                    <div className={styles.modalFooter}>
                        <Button onClick={handleCancel} variant="outline">
                            Отмена
                        </Button>
                        <Button onClick={handleSave} variant="primary">
                            Применить
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default GlobalHeaderFooterModal;
