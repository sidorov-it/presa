/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import React, { useState, useEffect } from 'react';
import { ChartElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { useHistoryStore } from '@/store/historyStore';
import { ChartSettings } from '@/elements/chart';
import Chart from '@/elements/chart';
import styles from './ChartModal.module.css';
import Portal from '@/components/Portal';

interface ChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
}

const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, elementId, presentationId, slideId, layoutId }) => {
    const [chartElement, setChartElement] = useState<ChartElement | null>(null);

    // Fetch chart element from store
    const element = usePresentationStore(state => {
        const slide = state.presentations?.find(p => p.id === presentationId)?.slides.find(s => s.id === slideId);
        const layout = slide?.layouts.find(l => l.id === layoutId);
        return layout?.elements.find(e => e.id === elementId) as ChartElement | undefined;
    });

    useEffect(() => {
        if (element) {
            setChartElement(element);
        }
    }, [element]);

    // Start a history transaction when the modal mounts and
    // commit it when the modal unmounts so all changes made
    // in the modal are recorded as a single action
    useEffect(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'edit chart');
        return () => {
            useHistoryStore.getState().commitTransaction(presentationId);
        };
    }, [presentationId]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const handleUpdate = (updates: Partial<ChartElement>) => {
        if (chartElement) {
            setChartElement({
                ...chartElement,
                ...updates,
            });
        }
    };

    if (!isOpen || !chartElement) return null;

    return (
        <Portal>
            <div className={styles.chartModal}>
                {/* Backdrop for closing */}
                <div className={styles.chartModalBackdrop} onClick={onClose} />

                {/* Bottom sheet */}
                <div className={styles.chartModalBottomSheet}>
                    {/* Header */}
                    <div className={styles.chartModalHeader}>
                        <h2 className={styles.chartModalHeaderTitle}>Редактирование диаграммы</h2>
                        <button type="button" className={styles.chartModalHeaderCloseButton} onClick={onClose}>
                            <span className="sr-only">Close</span>
                            <svg
                                className={styles.chartModalHeaderCloseButtonIcon}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className={styles.chartModalContent}>
                        {/* Left panel - Chart preview */}
                        <div className={styles.chartModalContentLeftPanel}>
                            <h3 className={styles.chartModalContentLeftPanelTitle}>Предпросмотр</h3>
                            <div className={styles.chartModalContentLeftPanelChart}>
                                {chartElement && (
                                    <Chart
                                        elementId={elementId}
                                        presentationId={presentationId}
                                        slideId={slideId}
                                        layoutId={layoutId}
                                        inSettings={true}
                                        slideBackground="#ffffff"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Right panel - Settings */}
                        <div className={styles.chartModalContentRightPanel}>
                            <ChartSettings
                                elementId={elementId}
                                presentationId={presentationId}
                                slideId={slideId}
                                layoutId={layoutId}
                                onUpdate={handleUpdate}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ChartModal;
