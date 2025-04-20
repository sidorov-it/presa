'use client';
import React, { useState } from 'react';
import ChartModal from '@/components/editor/ChartModal';
import { ChartElement } from '@/types';
import { generateId } from '@/utils/id';
import Chart from '@/elements/chart/Chart';

// Sample chart element for testing
const sampleChartElement: ChartElement = {
    id: generateId(),
    cellId: '1',
    elementTypeId: 'column-chart',
    type: 'chart',
    chartType: 'bar',
    data: [
        { name: 'Q1', value: 220 },
        { name: 'Q2', value: 458 },
        { name: 'Q3', value: 359 },
        { name: 'Q4', value: 500 },
    ],
};

export default function ChartTesting() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [chartElement, setChartElement] = useState<ChartElement>(sampleChartElement);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 700 }}>
                Chart Testing Page
            </h1>

            <div style={{ marginBottom: '1.5rem' }}>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={handleOpenModal}
                >
                    Open Chart Modal
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold mb-4">Bar Chart</h2>
                    <Chart
                        element={{
                            ...chartElement,
                            chartType: 'bar',
                        }}
                    />
                </div>

                <div className="border border-gray-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold mb-4">Line Chart</h2>
                    <Chart
                        element={{
                            ...chartElement,
                            chartType: 'line',
                        }}
                    />
                </div>

                <div className="border border-gray-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold mb-4">Pie Chart</h2>
                    <Chart
                        element={{
                            ...chartElement,
                            chartType: 'pie',
                        }}
                    />
                </div>

                <div className="border border-gray-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold mb-4">Donut Chart</h2>
                    <Chart
                        element={{
                            ...chartElement,
                            chartType: 'donut',
                        }}
                    />
                </div>
            </div>

            {isModalOpen && (
                <ChartModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    elementId={chartElement.id}
                    presentationId="test"
                    slideId="test"
                    layoutId="test"
                />
            )}
        </div>
    );
}
