'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { HeaderFooterConfig } from '@/types';
import HeaderFooterSettings from '@/components/settings/HeaderFooterSettings/HeaderFooterSettings';
import { Button } from '@/components/ui/Button';
import Portal from '@/components/Portal';
import styles from './SlideHeaderFooterModal.module.css';

interface SlideHeaderFooterModalProps {
    isOpen: boolean;
    onClose: () => void;
    presentationId: string;
    slideId: string;
}

const defaultPosition = { type: 'none' as const, content: '' };

const defaultHeaderFooter: HeaderFooterConfig = {
    enabled: false,
    left: defaultPosition,
    center: defaultPosition,
    right: defaultPosition,
};

const SlideHeaderFooterModal: React.FC<SlideHeaderFooterModalProps> = ({
    isOpen,
    onClose,
    presentationId,
    slideId,
}) => {
    const { getSlide, updateSlide, getPresentation } = usePresentationStore();
    const modalRef = useRef<HTMLDivElement>(null);
    
    const slide = getSlide(presentationId, slideId);
    const presentation = getPresentation(presentationId);
    
    const [header, setHeader] = useState<HeaderFooterConfig>(slide?.header || defaultHeaderFooter);
    const [footer, setFooter] = useState<HeaderFooterConfig>(slide?.footer || defaultHeaderFooter);
    
    const currentSlideIndex = presentation?.slides.findIndex(s => s.id === slideId) ?? 0;
    const totalSlides = presentation?.slides.length ?? 1;

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

    // Update local state when slide changes
    useEffect(() => {
        if (slide) {
            setHeader(slide.header || defaultHeaderFooter);
            setFooter(slide.footer || defaultHeaderFooter);
        }
    }, [slide]);

    const handleSave = () => {
        updateSlide(presentationId, slideId, {
            header: header.enabled ? header : undefined,
            footer: footer.enabled ? footer : undefined,
        });
        onClose();
    };

    const handleCancel = () => {
        // Reset to original values
        if (slide) {
            setHeader(slide.header || defaultHeaderFooter);
            setFooter(slide.footer || defaultHeaderFooter);
        }
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Закрываем модальное окно только при клике на backdrop (фон)
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    const handleModalContentClick = (e: React.MouseEvent) => {
        // Предотвращаем всплытие события клика от содержимого модального окна
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
                        <h2 className={styles.modalTitle}>Настройки заголовка и подвала слайда</h2>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={handleCancel}
                            aria-label="Закрыть"
                        >
                            ×
                        </button>
                    </div>
                    <div className={styles.modalBody}>
                        <HeaderFooterSettings
                            header={header}
                            footer={footer}
                            onHeaderChange={setHeader}
                            onFooterChange={setFooter}
                            currentSlideIndex={currentSlideIndex}
                            totalSlides={totalSlides}
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

export default SlideHeaderFooterModal; 