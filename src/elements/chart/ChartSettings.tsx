'use client';
import React, { useState, useEffect } from 'react';
import { ChartElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';

import { FaChartBar } from 'react-icons/fa6';
import { FaChartColumn } from 'react-icons/fa6';
import { FaChartLine, FaChartPie } from 'react-icons/fa';
import { PiChartDonutFill } from 'react-icons/pi';

interface ChartSettingsProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    onUpdate?: (updates: Partial<ChartElement>) => void;
}

const ChartSettings: React.FC<ChartSettingsProps> = ({ elementId, presentationId, slideId, layoutId, onUpdate }) => {
    const element = usePresentationStore(
        state => state.getElement(presentationId, slideId, layoutId, elementId) as ChartElement
    );

    const updateElement = usePresentationStore(state => state.updateElement);

    const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'donut'>(element?.chartType || 'bar');

    // Initial state for table data with default rows
    const [tableData, setTableData] = useState<Array<{ name: string; value: number }>>([
        { name: 'Q1', value: 220 },
        { name: 'Q2', value: 458 },
        { name: 'Q3', value: 359 },
        { name: 'Q4', value: 500 },
    ]);

    useEffect(() => {
        if (element?.data) {
            setTableData(element.data);
        }
    }, [element]);

    const handleChangeChartType = (chartType: 'bar' | 'line' | 'pie' | 'donut') => {
        setChartType(chartType);

        if (presentationId && slideId && layoutId && elementId) {
            updateElement(presentationId, slideId, layoutId, elementId, {
                chartType: chartType,
            });

            if (onUpdate) {
                onUpdate({ chartType: chartType });
            }
        }
    };

    const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
        if (presentationId && slideId && layoutId && elementId) {
            updateElement(presentationId, slideId, layoutId, elementId, { alignment });
        }
    };

    const handleValueChange = (index: number, field: 'name' | 'value', value: string) => {
        setTableData(prev => {
            const newData = [...prev];
            if (field === 'name') {
                newData[index] = { ...newData[index], name: value };
            } else {
                newData[index] = { ...newData[index], value: Number(value) || 0 };
            }
            return newData;
        });
    };

    const handleAddRow = () => {
        setTableData(prev => [...prev, { name: `Item ${prev.length + 1}`, value: 0 }]);
    };

    const handleDeleteRow = (index: number) => {
        setTableData(prev => prev.filter((_, i) => i !== index));
    };

    const handleApplyData = () => {
        if (presentationId && slideId && layoutId && elementId) {
            updateElement(presentationId, slideId, layoutId, elementId, {
                data: tableData,
            });

            if (onUpdate) {
                onUpdate({ data: tableData });
            }
        }
    };

    if (!element) return null;

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-2">
                <span className="block text-sm font-medium">Тип диаграммы</span>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.chartType === 'bar' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleChangeChartType('bar')}
                        aria-label="Bar chart"
                        tabIndex={0}
                    >
                        <FaChartBar className="w-6 h-6" />
                    </button>

                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.chartType === 'column' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleChangeChartType('column')}
                        aria-label="Column chart"
                        tabIndex={0}
                    >
                        <FaChartColumn className="w-6 h-6" />
                    </button>

                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.chartType === 'line' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleChangeChartType('line')}
                        aria-label="Line chart"
                        tabIndex={0}
                    >
                        <FaChartLine className="w-6 h-6" />
                    </button>
                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.chartType === 'pie' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleChangeChartType('pie')}
                        aria-label="Pie chart"
                        tabIndex={0}
                    >
                        <FaChartPie className="w-6 h-6" />
                    </button>
                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.chartType === 'donut' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleChangeChartType('donut')}
                        aria-label="Donut chart"
                        tabIndex={0}
                    >
                        <PiChartDonutFill className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <span className="block text-sm font-medium">Выравнивание</span>
                <div className="flex space-x-2">
                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.alignment === 'left' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleAlignmentChange('left')}
                        aria-label="Align left"
                        tabIndex={0}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.alignment === 'center' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleAlignmentChange('center')}
                        aria-label="Align center"
                        tabIndex={0}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        className={`p-2 border rounded-md ${element.alignment === 'right' ? 'bg-blue-100 border-blue-500' : 'border-gray-300'}`}
                        onClick={() => handleAlignmentChange('right')}
                        aria-label="Align right"
                        tabIndex={0}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="block text-sm font-medium text-gray-700">Данные</span>
                    <button
                        type="button"
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                        onClick={handleAddRow}
                    >
                        Добавить строку
                    </button>
                </div>

                <div className="overflow-hidden border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Название
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    Значение
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                                />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tableData.map((row, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="text"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={row.name}
                                            onChange={e => handleValueChange(index, 'name', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            value={row.value}
                                            onChange={e => handleValueChange(index, 'value', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            type="button"
                                            className="text-red-600 hover:text-red-900"
                                            onClick={() => handleDeleteRow(index)}
                                            disabled={tableData.length <= 1}
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    onClick={handleApplyData}
                >
                    Применить изменения
                </button>
            </div>
        </div>
    );
};

export default ChartSettings;
