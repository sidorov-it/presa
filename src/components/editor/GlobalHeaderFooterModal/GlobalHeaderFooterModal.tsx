/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { HeaderFooterConfig, SlideHeaderFooterConfig } from '@/types';
import HeaderFooterConfigurator from '@/components/editor/HeaderFooterConfigurator';
import { Button } from '@/components/ui/Button';
import Portal from '@/components/Portal';
import styles from './GlobalHeaderFooterModal.module.css';
import { RiCloseFill } from 'react-icons/ri';
import { pluralize, pluralizeSlide } from '@/utils/pluralize';

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
    fixedHeight: false,
};

const defaultSlideHeaderFooter: SlideHeaderFooterConfig = {
    enabled: false,
    left: { type: 'none' },
    center: { type: 'none' },
    right: { type: 'none' },
    fixedHeight: false,
    overrideGlobal: undefined,
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

    // Tab state
    const [activeTab, setActiveTab] = useState<'global' | 'slide'>('global');
    // Global settings state
    const [globalHeader, setGlobalHeader] = useState<HeaderFooterConfig>(defaultHeaderFooter);
    const [globalFooter, setGlobalFooter] = useState<HeaderFooterConfig>(defaultHeaderFooter);
    const [applyTo, setApplyTo] = useState<'all' | 'except-first' | 'except-first-last' | 'current-slide'>('all');

    // Slide-specific settings state
    const [slideHeader, setSlideHeader] = useState<SlideHeaderFooterConfig>(defaultSlideHeaderFooter);
    const [slideFooter, setSlideFooter] = useState<SlideHeaderFooterConfig>(defaultSlideHeaderFooter);
    const [slideSettingMode, setSlideSettingMode] = useState<'use-global' | 'custom' | 'disabled'>('use-global');

    // Check for slides with overrides
    const slidesWithOverrides =
        presentation?.slides.filter(
            slide => slide.header?.overrideGlobal !== undefined || slide.footer?.overrideGlobal !== undefined
        ) || [];

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
        if (presentation) {
            // Load global settings
            setGlobalHeader(presentation.headerFooterConfig?.header || defaultHeaderFooter);
            setGlobalFooter(presentation.headerFooterConfig?.footer || defaultHeaderFooter);
            setApplyTo(presentation.headerFooterConfig?.applyTo || 'all');

            // Load slide-specific settings if available
            if (slideId && slide) {
                // Determine current slide setting mode
                if (slide.header?.overrideGlobal === false || slide.footer?.overrideGlobal === false) {
                    setSlideSettingMode('disabled');
                } else if (slide.header?.overrideGlobal === true || slide.footer?.overrideGlobal === true) {
                    setSlideSettingMode('custom');
                } else {
                    setSlideSettingMode('use-global');
                }

                // Set slide header/footer state
                setSlideHeader(slide.header || { ...defaultSlideHeaderFooter });
                setSlideFooter(slide.footer || { ...defaultSlideHeaderFooter });

                // Open slide tab if slide has overrides
                if (slide.header?.overrideGlobal !== undefined || slide.footer?.overrideGlobal !== undefined) {
                    setActiveTab('slide');
                }
            }
        }
    }, [presentation, slide, slideId]);

    const handleSave = () => {
        // Always save global settings
        const globalConfig = {
            header: globalHeader,
            footer: globalFooter,
            applyTo,
        };

        updatePresentation(presentationId, {
            headerFooterConfig: globalConfig,
        });

        // Handle slide-specific settings if we have a slideId
        if (slideId) {
            let slideHeaderToSave: SlideHeaderFooterConfig | undefined;
            let slideFooterToSave: SlideHeaderFooterConfig | undefined;

            switch (slideSettingMode) {
                case 'use-global':
                    // Reset to use global settings - remove slide-specific overrides
                    slideHeaderToSave = undefined;
                    slideFooterToSave = undefined;
                    break;

                case 'disabled':
                    // Explicitly disable for this slide
                    slideHeaderToSave = {
                        ...defaultSlideHeaderFooter,
                        overrideGlobal: false,
                    };
                    slideFooterToSave = {
                        ...defaultSlideHeaderFooter,
                        overrideGlobal: false,
                    };
                    break;

                case 'custom':
                    // Use custom settings for this slide
                    slideHeaderToSave = {
                        ...slideHeader,
                        overrideGlobal: true,
                    };
                    slideFooterToSave = {
                        ...slideFooter,
                        overrideGlobal: true,
                    };
                    break;
            }

            updateSlide(presentationId, slideId, {
                header: slideHeaderToSave,
                footer: slideFooterToSave,
            });
        }

        onClose();
    };

    const handleCancel = () => {
        // Reset to original values - this will be handled by the useEffect when the modal reopens
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
                        <h2 className={styles.modalTitle}>Настройки колонтитулов</h2>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={handleCancel}
                            aria-label="Закрыть"
                        >
                            <RiCloseFill />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className={styles.tabs}>
                        <button
                            type="button"
                            className={`${styles.tab} ${activeTab === 'global' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('global')}
                        >
                            Общие настройки
                        </button>
                        {slideId && (
                            <button
                                type="button"
                                className={`${styles.tab} ${activeTab === 'slide' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('slide')}
                            >
                                Настройки слайда
                            </button>
                        )}
                    </div>

                    <div className={styles.modalBody}>
                        {slidesWithOverrides.length > 0 && activeTab === 'global' && (
                            <div className={styles.overridesWarning}>
                                <div className={styles.overridesWarningTitle}>
                                    ⚠️ Слайды с индивидуальными настройками
                                </div>
                                <div className={styles.overridesWarningText}>
                                    {slidesWithOverrides.length} {pluralizeSlide(slidesWithOverrides.length)}{' '}
                                    {pluralize(slidesWithOverrides.length, 'имеет', 'имеют', 'имеют')} собственные
                                    настройки колонтитулов, которые переопределяют глобальные настройки.
                                </div>
                            </div>
                        )}

                        {activeTab === 'global' && (
                            <HeaderFooterConfigurator
                                header={globalHeader}
                                footer={globalFooter}
                                onHeaderChange={setGlobalHeader}
                                onFooterChange={setGlobalFooter}
                                showApplyTo={true}
                                applyTo={applyTo}
                                onApplyToChange={setApplyTo}
                            />
                        )}

                        {activeTab === 'slide' && slideId && (
                            <div className={styles.slideSettings}>
                                <div className={styles.slideSettingsModeSelector}>
                                    <h3>Режим настроек для данного слайда:</h3>
                                    <div className={styles.radioGroup}>
                                        <label className={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="slideMode"
                                                value="use-global"
                                                checked={slideSettingMode === 'use-global'}
                                                onChange={e =>
                                                    setSlideSettingMode(
                                                        e.target.value as 'use-global' | 'custom' | 'disabled'
                                                    )
                                                }
                                            />
                                            Использовать общие настройки
                                        </label>
                                        <label className={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="slideMode"
                                                value="disabled"
                                                checked={slideSettingMode === 'disabled'}
                                                onChange={e =>
                                                    setSlideSettingMode(
                                                        e.target.value as 'use-global' | 'custom' | 'disabled'
                                                    )
                                                }
                                            />
                                            Отключить колонтитулы для этого слайда
                                        </label>
                                        <label className={styles.radioLabel}>
                                            <input
                                                type="radio"
                                                name="slideMode"
                                                value="custom"
                                                checked={slideSettingMode === 'custom'}
                                                onChange={e =>
                                                    setSlideSettingMode(
                                                        e.target.value as 'use-global' | 'custom' | 'disabled'
                                                    )
                                                }
                                            />
                                            Использовать индивидуальные настройки
                                        </label>
                                    </div>
                                </div>

                                {slideSettingMode === 'custom' && (
                                    <HeaderFooterConfigurator
                                        header={slideHeader}
                                        footer={slideFooter}
                                        onHeaderChange={setSlideHeader}
                                        onFooterChange={setSlideFooter}
                                        showApplyTo={false}
                                    />
                                )}

                                {slideSettingMode === 'use-global' && (
                                    <div className={styles.globalPreview}>
                                        <p>Этот слайд будет использовать общие настройки колонтитулов.</p>
                                    </div>
                                )}

                                {slideSettingMode === 'disabled' && (
                                    <div className={styles.disabledPreview}>
                                        <p>
                                            Колонтитулы будут отключены для этого слайда, даже если они включены в общих
                                            настройках.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
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
