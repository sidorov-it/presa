'use client';
import React, { useState, useEffect } from 'react';
import { ChartElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { ChartSettings } from '@/elements/chart';
import Chart from '@/elements/chart/Chart';

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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30 flex items-center justify-center">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center border-b px-6 py-4">
                    <h2 className="text-lg font-medium text-gray-900">Редактирование</h2>
                    <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                        <span className="sr-only">Close</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                    {/* Left panel - Chart preview */}
                    <div className="w-full md:w-1/2 p-6 border-r overflow-auto">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Предпросмотр</h3>
                        <div className="border border-gray-200 rounded-md p-4 bg-white">
                            {chartElement && <Chart element={chartElement} />}
                        </div>
                    </div>

                    {/* Right panel - Settings */}
                    <div className="w-full md:w-1/2 overflow-auto">
                        <ChartSettings
                            elementId={elementId}
                            presentationId={presentationId}
                            slideId={slideId}
                            layoutId={layoutId}
                            onUpdate={handleUpdate}
                        />
                    </div>
                </div>

                <div className="border-t px-6 py-4 flex justify-end">
                    <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartModal;
