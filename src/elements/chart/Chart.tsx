/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChartElement } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import ChartModal from '@/components/editor/ChartModal';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Cell,
    ResponsiveContainer,
} from 'recharts';

import { FaChartBar } from 'react-icons/fa6';
import { FaChartColumn } from 'react-icons/fa6';
import { FaChartLine, FaChartPie } from 'react-icons/fa';
import { PiChartDonutFill } from 'react-icons/pi';

import { OpenCustomMenuEvent } from '@/customEvents/OpenCustomMenuEvent';

import styles from './Chart.module.css';
import { LayoutType } from 'recharts/types/util/types';

interface ChartProps {
    element: ChartElement;
    className?: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    hasMultipleCells?: boolean;
    inSettings?: boolean;
}

// Default sample data if no data is provided
const defaultData = [
    { name: 'Q1', value: 220 },
    { name: 'Q2', value: 458 },
    { name: 'Q3', value: 359 },
    { name: 'Q4', value: 500 },
];

// Default colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Types for resize direction
type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const Chart: React.FC<ChartProps> = ({
    element,
    className = '',
    presentationId,
    slideId,
    layoutId,
    inSettings = false,
}) => {
    const [isSelected, setIsSelected] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showLabels, setShowLabels] = useState(true);
    const [showValues, setShowValues] = useState(false);
    const [legendPosition, setLegendPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
    // const [colorScheme, setColorScheme] = useState('default');
    const [horizontalAlignment, setHorizontalAlignment] = useState<'left' | 'center' | 'right'>('center');

    // Resize state
    const [resizing, setResizing] = useState(false);
    const [startWidth, setStartWidth] = useState(0);
    const [startHeight, setStartHeight] = useState(0);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
    const [aspectRatio, setAspectRatio] = useState(1);

    const containerRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const updateElement = usePresentationStore(state => state.updateElement);

    const data = element.data || defaultData;

    // Handle click on chart to select it
    const handleClickChart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (presentationId && slideId && layoutId) {
            setIsSelected(true);
            setIsSettingsOpen(true);
        }
    };

    // Handle click outside to deselect chart
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node)
            ) {
                setIsSelected(false);
                setIsSettingsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        OpenCustomMenuEvent.addEventListener(e => {
            if (e.detail.elementId === element.id && e.detail.elementType === 'chart') {
                setIsSettingsOpen(true);
            }
        });
    }, []);

    // Open data edit modal
    const handleOpenDataModal = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsModalOpen(true);
    };

    // Close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    // Change chart type
    const handleChangeChartType = (type: 'bar' | 'line' | 'pie' | 'donut' | 'column') => {
        if (presentationId && slideId && layoutId) {
            updateElement(presentationId, slideId, layoutId, element.id, {
                chartType: type,
            });
        }
    };

    // Toggle settings
    const handleToggleSettings = (setting: string, value: boolean | string) => {
        // Just for the demo, in a real implementation we would save these to the element
        if (setting === 'showLabels') {
            setShowLabels(value as boolean);
            if (presentationId && slideId && layoutId) {
                updateElement(presentationId, slideId, layoutId, element.id, { showLabels: value as boolean });
            }
        }
        if (setting === 'showValues') {
            setShowValues(value as boolean);
            if (presentationId && slideId && layoutId) {
                updateElement(presentationId, slideId, layoutId, element.id, { showValues: value as boolean });
            }
        }
        if (setting === 'legendPosition') {
            setLegendPosition(value as 'left' | 'right' | 'top' | 'bottom');
            if (presentationId && slideId && layoutId) {
                updateElement(presentationId, slideId, layoutId, element.id, {
                    legendPosition: value as 'left' | 'right' | 'top' | 'bottom',
                });
            }
        }
        // if (setting === 'colorScheme') setColorScheme(value as string);
        if (setting === 'horizontalAlignment') {
            setHorizontalAlignment(value as 'left' | 'center' | 'right');
            if (presentationId && slideId && layoutId) {
                updateElement(presentationId, slideId, layoutId, element.id, {
                    alignment: value as 'left' | 'center' | 'right',
                });
            }
        }

        // In a real implementation, we would save these settings to the element:
        // if (presentationId && slideId && layoutId) {
        //     updateElement(presentationId, slideId, layoutId, element.id, {
        //         // Add the setting to the element
        //     });
        // }
    };

    // Handle resize start
    const handleResizeStart = (e: React.MouseEvent, direction: ResizeDirection) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(true);
        setResizeDirection(direction);

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setStartWidth(rect.width);
            setStartHeight(rect.height);
            setAspectRatio(rect.width / rect.height);
        }

        setStartX(e.clientX);
        setStartY(e.clientY);
    };

    // Handle resize movement
    const handleResizeMove = (e: MouseEvent) => {
        if (!resizing || !resizeDirection || !containerRef.current) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        let newWidth = startWidth;
        let newHeight = startHeight;

        // Determine width change based on direction
        if (resizeDirection.includes('right')) {
            newWidth = startWidth + deltaX;
        } else if (resizeDirection.includes('left')) {
            newWidth = startWidth - deltaX;
        } else if (resizeDirection === 'top' || resizeDirection === 'bottom') {
            // For top and bottom points, use Y change
            // and recalculate width based on aspect ratio
            if (resizeDirection === 'top') {
                newHeight = startHeight - deltaY;
            } else {
                // bottom
                newHeight = startHeight + deltaY;
            }
            // Recalculate width, preserving aspect ratio
            newWidth = newHeight * aspectRatio;
        }

        // Ensure minimum width (150px)
        const width = Math.max(150, newWidth);

        // Update container max-width in the DOM
        containerRef.current.style.maxWidth = `${width}px`;
    };

    // Handle resize end
    const handleResizeEnd = () => {
        if (!resizing) return;

        setResizing(false);
        setResizeDirection(null);

        // Save the new width to the element data
        if (containerRef.current && presentationId && slideId && layoutId) {
            const newWidth = containerRef.current.clientWidth;
            updateElement(presentationId, slideId, layoutId, element.id, { width: newWidth });
        }
    };

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizing, resizeDirection]);

    // Get cursor style based on resize direction
    const getResizeCursor = (direction: ResizeDirection): string => {
        switch (direction) {
            case 'top':
            case 'bottom':
                return 'ns-resize';
            case 'left':
            case 'right':
                return 'ew-resize';
            case 'top-left':
            case 'bottom-right':
                return 'nwse-resize';
            case 'top-right':
            case 'bottom-left':
                return 'nesw-resize';
            default:
                return 'default';
        }
    };

    // Get alignment style
    const getAlignmentClass = () => {
        if (inSettings) {
            return 'mx-auto';
        }

        const align = element.alignment || horizontalAlignment;
        switch (align) {
            case 'left':
                return 'mr-auto';
            case 'center':
                return 'mx-auto';
            case 'right':
                return 'ml-auto';
            default:
                return 'mx-auto'; // Default to center alignment
        }
    };

    // Render the appropriate chart based on the chart type
    const renderChart = () => {
        // Get alignment from element or state
        const alignment = element.alignment || horizontalAlignment;

        // Calculate legend properties based on legend position
        const getLegendProps = () => {
            let layout: LayoutType;
            let align: 'left' | 'center' | 'right';
            let verticalAlign: 'top' | 'middle' | 'bottom';

            switch (legendPosition) {
                case 'left':
                    layout = 'vertical';
                    align = 'left';
                    verticalAlign = 'middle';
                    break;
                case 'right':
                    layout = 'vertical';
                    align = 'right';
                    verticalAlign = 'middle';
                    break;
                case 'top':
                    layout = 'horizontal';
                    align = 'center' as 'left' | 'center' | 'right';
                    verticalAlign = 'top';
                    break;
                case 'bottom':
                    layout = 'horizontal';
                    align = 'center' as 'left' | 'center' | 'right';
                    verticalAlign = 'bottom';
                    break;
                default:
                    layout = 'horizontal';
                    align = 'center';
                    verticalAlign = 'middle';
            }

            return { layout, align, verticalAlign };
        };

        const legendProps = getLegendProps();

        const getLabelProps = () => {
            if (!showLabels && !showValues) return false;

            return {
                position: 'top' as const,
                formatter: (value: number) => {
                    if (showLabels && showValues) return `${value}`;
                    if (showValues) return `${value}`;
                    if (showLabels) return '';
                    return '';
                },
            };
        };

        const getPieLabel = ({ name, percent }: { name: string; percent: number }) => {
            if (!showLabels && !showValues) return;
            if (showLabels && showValues) return `${name}: ${(percent * 100).toFixed(0)}%`;
            if (showValues) return `${(percent * 100).toFixed(0)}%`;
            if (showLabels) return name;
            return;
        };

        switch (element.chartType) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            {showLabels && <XAxis dataKey="name" />}
                            {showLabels && <YAxis />}
                            {showValues && <Tooltip />}
                            <Legend
                                layout={legendProps.layout}
                                align={legendProps.align}
                                verticalAlign={legendProps.verticalAlign}
                            />
                            {element.series?.map((serie, index) => (
                                <Bar
                                    key={serie.key}
                                    dataKey={serie.key}
                                    name={serie.label?.trim() || ' '}
                                    fill={serie.color || COLORS[index % COLORS.length]}
                                    label={getLabelProps()}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'column':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 45, bottom: 5, left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis type="number" hide={!showLabels} />
                            <YAxis dataKey="name" type="category" hide={!showLabels} />

                            {showValues && <Tooltip />}
                            <Legend
                                layout={legendProps.layout}
                                align={legendProps.align}
                                verticalAlign={legendProps.verticalAlign}
                            />
                            {element.series?.map((serie, index) => (
                                <Bar
                                    key={serie.key}
                                    dataKey={serie.key}
                                    name={serie.label?.trim() || ' '}
                                    fill={serie.color || COLORS[index % COLORS.length]}
                                    label={{
                                        position: 'right',
                                        formatter: (value: number) => (showValues ? `${value}` : ''),
                                        fill: '#666',
                                        fontSize: 12,
                                    }}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'line':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={[{ name: '' }, ...data, { name: '' }]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            {showLabels && <XAxis dataKey="name" />}
                            {showLabels && <YAxis />}
                            {showValues && <Tooltip />}
                            <Legend
                                layout={legendProps.layout}
                                align={legendProps.align}
                                verticalAlign={legendProps.verticalAlign}
                            />
                            {element.series?.map((serie, index) => (
                                <Line
                                    key={serie.key}
                                    type="monotone"
                                    dataKey={serie.key}
                                    name={serie.label?.trim() || ' '}
                                    stroke={serie.color || COLORS[index % COLORS.length]}
                                    label={getLabelProps()}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                // Transform data for pie chart - use first series only
                const pieData =
                    element.series && element.series.length > 0
                        ? data.map(item => ({
                            name: item.name,
                            value: Number(item[element.series[0].key]),
                        }))
                        : data;
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={showLabels || showValues}
                                label={getPieLabel}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            {showValues && <Tooltip />}
                            <Legend
                                layout={legendProps.layout}
                                align={legendProps.align}
                                verticalAlign={legendProps.verticalAlign}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'donut':
                // Transform data for donut chart - use first series only
                const donutData =
                    element.series && element.series.length > 0
                        ? data.map(item => ({
                            name: item.name,
                            value: Number(item[element.series[0].key]),
                        }))
                        : data;
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                labelLine={showLabels || showValues}
                                label={getPieLabel}
                                outerRadius={80}
                                innerRadius={40}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {donutData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            {showValues && <Tooltip />}
                            <Legend
                                layout={legendProps.layout}
                                align={legendProps.align}
                                verticalAlign={legendProps.verticalAlign}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return (
                    <div className="p-4 border border-dashed border-gray-300 rounded-md text-gray-500">
                        Unsupported chart type: {element.chartType}
                    </div>
                );
        }
    };

    // Calculate optimal position for settings popup
    const calculateSettingsPosition = () => {
        if (!containerRef.current) return { top: '40%', left: '40%' };

        const containerRect = containerRef.current.getBoundingClientRect();
        const popupHeight = 310; // Estimated height of the popup
        const popupWidth = 292; // Width of the popup
        const margin = 20; // Margin from edges

        // Calculate horizontal position (centered)
        let left = containerRect.left + containerRect.width / 2 - popupWidth / 2;

        // Ensure popup stays within viewport horizontally
        if (left + popupWidth + margin > window.innerWidth) {
            left = window.innerWidth - popupWidth - margin;
        }
        if (left < margin) {
            left = margin;
        }

        // Calculate vertical position
        let top = containerRect.top - popupHeight - margin;
        let position = 'top';

        // If not enough space above, try below
        if (top < margin) {
            top = containerRect.bottom + margin;
            position = 'bottom';

            // If not enough space below either, position at the top with scrolling
            if (top + popupHeight + margin > window.innerHeight) {
                top = margin;
                position = 'overlay';
            }
        }

        return {
            top: `${top}px`,
            left: `${left}px`,
            position,
        };
    };

    // Recalculate position on scroll and resize
    useEffect(() => {
        const handleScroll = () => {
            if (isSettingsOpen && settingsRef.current) {
                const position = calculateSettingsPosition();
                settingsRef.current.style.top = position.top;
                settingsRef.current.style.left = position.left;
            }
        };

        const handleResize = () => {
            if (isSettingsOpen && settingsRef.current) {
                const position = calculateSettingsPosition();
                settingsRef.current.style.top = position.top;
                settingsRef.current.style.left = position.left;
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [isSettingsOpen]);

    // Recalculate position when alignment changes
    useEffect(() => {
        if (isSettingsOpen && settingsRef.current) {
            const position = calculateSettingsPosition();
            settingsRef.current.style.top = position.top;
            settingsRef.current.style.left = position.left;
        }
    }, [horizontalAlignment, isSettingsOpen]);

    return (
        <>
            <div className={styles.chartContainer}>
                <div
                    ref={containerRef}
                    className={`relative ${className} ${getAlignmentClass()}`}
                    style={{
                        cursor: 'pointer',
                        maxWidth: element.width ? `${element.width}px` : '100%',
                    }}
                    onClick={handleClickChart}
                    data-element-id={element.id}
                >
                    {isSelected && (
                        <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none z-10"></div>
                    )}

                    {renderChart()}

                    {isSelected && (
                        <>
                            {/* Top side */}
                            <div
                                className={`${styles.dot} ${styles.dotTopMiddle}`}
                                style={{ cursor: getResizeCursor('top') }}
                                onMouseDown={e => handleResizeStart(e, 'top')}
                            />

                            {/* Right side */}
                            <div
                                className={`${styles.dot} ${styles.dotRightMiddle}`}
                                style={{ cursor: getResizeCursor('right') }}
                                onMouseDown={e => handleResizeStart(e, 'right')}
                            />

                            {/* Bottom side */}
                            <div
                                className={`${styles.dot} ${styles.dotBottomMiddle}`}
                                style={{ cursor: getResizeCursor('bottom') }}
                                onMouseDown={e => handleResizeStart(e, 'bottom')}
                            />

                            {/* Left side */}
                            <div
                                className={`${styles.dot} ${styles.dotLeftMiddle}`}
                                style={{ cursor: getResizeCursor('left') }}
                                onMouseDown={e => handleResizeStart(e, 'left')}
                            />

                            {/* Top left corner */}
                            <div
                                className={`${styles.dot} ${styles.dotTopLeft}`}
                                style={{ cursor: getResizeCursor('top-left') }}
                                onMouseDown={e => handleResizeStart(e, 'top-left')}
                            />

                            {/* Top right corner */}
                            <div
                                className={`${styles.dot} ${styles.dotTopRight}`}
                                style={{ cursor: getResizeCursor('top-right') }}
                                onMouseDown={e => handleResizeStart(e, 'top-right')}
                            />

                            {/* Bottom left corner */}
                            <div
                                className={`${styles.dot} ${styles.dotBottomLeft}`}
                                style={{ cursor: getResizeCursor('bottom-left') }}
                                onMouseDown={e => handleResizeStart(e, 'bottom-left')}
                            />

                            {/* Bottom right corner */}
                            <div
                                className={`${styles.dot} ${styles.dotBottomRight}`}
                                style={{ cursor: getResizeCursor('bottom-right') }}
                                onMouseDown={e => handleResizeStart(e, 'bottom-right')}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Chart settings popup */}
            {isSettingsOpen && (
                <div
                    ref={settingsRef}
                    className={`${styles.chartSettingsPopup}`}
                    style={{
                        top: '0',
                        left: '0',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                    }}
                >
                    {/* Chart type selector */}
                    <div className="flex justify-between mb-4">
                        <div
                            className={`p-2 rounded-md cursor-pointer ${element.chartType === 'bar' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            onClick={() => handleChangeChartType('bar')}
                        >
                            <FaChartColumn className="w-6 h-6" />
                        </div>

                        <div
                            className={`p-2 rounded-md cursor-pointer ${element.chartType === 'column' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            onClick={() => handleChangeChartType('column')}
                        >
                            <FaChartBar className="w-6 h-6" />
                        </div>

                        <div
                            className={`p-2 rounded-md cursor-pointer ${element.chartType === 'line' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            onClick={() => handleChangeChartType('line')}
                        >
                            <FaChartLine className="w-6 h-6" />
                        </div>
                        <div
                            className={`p-2 rounded-md cursor-pointer ${element.chartType === 'pie' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            onClick={() => handleChangeChartType('pie')}
                        >
                            <FaChartPie className="w-6 h-6" />
                        </div>
                        <div
                            className={`p-2 rounded-md cursor-pointer ${element.chartType === 'donut' ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            onClick={() => handleChangeChartType('donut')}
                        >
                            <PiChartDonutFill className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Show labels toggle */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Показывать метки</span>
                            <div
                                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer ${showLabels ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
                                onClick={() => handleToggleSettings('showLabels', !showLabels)}
                            >
                                <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                            </div>
                        </div>
                    </div>

                    {/* Show values toggle */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Показывать значения</span>
                            <div
                                className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer ${showValues ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'}`}
                                onClick={() => handleToggleSettings('showValues', !showValues)}
                            >
                                <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal alignment */}
                    <div className="mb-4 flex gap-4 items-center w-full justify-between">
                        <span className="block text-sm font-medium text-gray-700 mb-1">Выравнивание</span>
                        <div className="flex space-x-1">
                            <button
                                className={`p-2 border rounded ${horizontalAlignment === 'left' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'}`}
                                onClick={() => handleToggleSettings('horizontalAlignment', 'left')}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,3H21V5H3V3M3,7H15V9H3V7M3,11H21V13H3V11M3,15H15V17H3V15M3,19H21V21H3V19Z" />
                                </svg>
                            </button>
                            <button
                                className={`p-2 border rounded ${horizontalAlignment === 'center' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'}`}
                                onClick={() => handleToggleSettings('horizontalAlignment', 'center')}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,3H21V5H3V3M7,7H17V9H7V7M3,11H21V13H3V11M7,15H17V17H7V15M3,19H21V21H3V19Z" />
                                </svg>
                            </button>
                            <button
                                className={`p-2 border rounded ${horizontalAlignment === 'right' ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-100'}`}
                                onClick={() => handleToggleSettings('horizontalAlignment', 'right')}
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Legend position */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Положение легенды</span>
                            <select
                                className="ml-2 border border-gray-300 rounded p-1 text-sm"
                                value={legendPosition}
                                onChange={e => handleToggleSettings('legendPosition', e.target.value)}
                            >
                                <option value="left">Слева</option>
                                <option value="right">Справа</option>
                                <option value="top">Сверху</option>
                                <option value="bottom">Снизу</option>
                            </select>
                        </div>
                    </div>

                    {/* Edit data button */}
                    <button
                        className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded flex items-center justify-center"
                        onClick={handleOpenDataModal}
                    >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                        </svg>
                        Редактировать данные
                    </button>
                </div>
            )}

            {/* Full data edit modal */}
            {isModalOpen && presentationId && slideId && layoutId && (
                <ChartModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    elementId={element.id}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                />
            )}
        </>
    );
};

export default Chart;
