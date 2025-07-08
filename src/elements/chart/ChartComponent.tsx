/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChartElement } from '@/types';
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

import { FaChartBar, FaChartColumn, FaChartLine, FaChartPie } from 'react-icons/fa6';
import { PiChartDonutFill } from 'react-icons/pi';
import { IoText } from 'react-icons/io5';
import { IoMdColorPalette } from 'react-icons/io';
import { LuAlignLeft, LuAlignCenter, LuAlignRight } from 'react-icons/lu';
import { RiNumbersLine } from 'react-icons/ri';
import { MdOutlineEdit } from 'react-icons/md';
import { HiOutlineTrash } from 'react-icons/hi';

import { OpenCustomMenuEvent } from '@/customEvents/OpenCustomMenuEvent';
import { useMenuStore } from '@/store/menuStore';

import styles from './Chart.module.css';
import { Theme } from '@/types/theme';
import { getChartColors, getChartAxisColors } from '@/utils/colors';
import { LayoutType } from 'recharts/types/util/types';
import { usePresentationStore } from '@/store/presentationStore';
// import { useReadOnly } from '@/contexts/ReadOnlyContext';

interface ChartComponentProps {
    element: ChartElement;
    className?: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    hasMultipleCells?: boolean;
    inSettings?: boolean;
    theme: Theme | null | undefined;
    slideBackground?: string;
    isReadOnly?: boolean;
    onUpdateElement?: (data: Partial<ChartElement>) => void;
    onDeleteElement?: () => void;
}

// Default sample data if no data is provided
const defaultData = [
    { name: 'Q1', value: 220 },
    { name: 'Q2', value: 458 },
    { name: 'Q3', value: 359 },
    { name: 'Q4', value: 500 },
];

const getDataBoundaries = (data: any[], series?: { key: string }[]): { min: number; max: number } => {
    const values: number[] = [];

    data.forEach(item => {
        if (series && series.length > 0) {
            series.forEach(s => {
                const val = Number(item[s.key]);
                if (!Number.isNaN(val)) {
                    values.push(val);
                }
            });
        } else if (item.value !== undefined) {
            const val = Number(item.value);
            if (!Number.isNaN(val)) {
                values.push(val);
            }
        }
    });

    if (values.length === 0) {
        return { min: 0, max: 0 };
    }

    return {
        min: Math.min(...values),
        max: Math.max(...values),
    };
};

// Types for resize direction
type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const ChartComponent: React.FC<ChartComponentProps> = ({
    element,
    className = '',
    presentationId,
    slideId,
    layoutId,
    inSettings = false,
    theme,
    slideBackground,
    isReadOnly = false,
    onUpdateElement,
    onDeleteElement,
}) => {
    // const isReadOnly = useReadOnly();
    const [isSelected, setIsSelected] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showLabels, setShowLabels] = useState(element.showLabels !== undefined ? element.showLabels : true);
    const [showValues, setShowValues] = useState(element.showValues !== undefined ? element.showValues : false);
    const [legendPosition, setLegendPosition] = useState<'left' | 'right' | 'top' | 'bottom'>(
        element.legendPosition || 'right'
    );

    // const currentSlideCustomBackground = usePresentationStore(state => {
    //     if (state.getSlide(presentationId, slideId)?.background?.type === 'color') {
    //         return state.getSlide(presentationId, slideId)?.background?.value;
    //     }
    //     return null;
    // });

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
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const settingsRef = useRef<HTMLDivElement>(null);

    const data = element.data || defaultData;

    const chartColors = useMemo(
        () =>
            getChartColors(
                slideBackground || theme?.colors.slideBackground || '#ffffff',
                theme?.colors.primaryAccent || '#8884d8'
            ),
        [slideBackground, theme?.colors.primaryAccent, theme?.colors.slideBackground]
    );
    const { axisLineColor, tickColor } = useMemo(
        () =>
            getChartAxisColors(
                slideBackground || theme?.colors.slideBackground || '#ffffff',
                theme?.colors.primaryAccent || '#8884d8'
            ),
        [slideBackground, theme?.colors.primaryAccent, theme?.colors.slideBackground]
    );

    const { min: yAxisMin, max: yAxisMax } = useMemo(() => {
        const { min, max } = getDataBoundaries(data, element.series);
        const range = max - min;
        const padding = range === 0 ? Math.abs(max || 1) * 0.05 : range * 0.05;
        return { min: min - padding, max: max + padding };
    }, [data, element.series]);

    // Initialize component with element data
    useEffect(() => {
        if (element) {
            // Initialize state from element properties if available
            setShowLabels(element.showLabels !== undefined ? element.showLabels : true);
            setShowValues(element.showValues !== undefined ? element.showValues : false);
            if (element.legendPosition) {
                setLegendPosition(element.legendPosition);
            }
        }
    }, [element]);

    // Handle click on chart to select it
    const handleClickChart = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isReadOnly) {
            return;
        }

        if (presentationId && slideId && layoutId) {
            setIsSelected(true);
            setIsSettingsOpen(true);
            useMenuStore.getState().openMenu({
                slideId,
                elementId: element.id,
                layoutId,
                elementType: 'chart',
                isTextEditor: false,
            });
        }
    };

    // Handle click outside to deselect chart
    useEffect(() => {
        if (isReadOnly) {
            return;
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                settingsRef.current &&
                !settingsRef.current.contains(event.target as Node)
            ) {
                setIsSelected(false);
                setIsSettingsOpen(false);
                useMenuStore.getState().closeMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isReadOnly]);

    useEffect(() => {
        const handleOpenCustomMenu = (e: any) => {
            if (e.detail.elementId === element.id && e.detail.elementType === 'chart') {
                setIsSettingsOpen(true);
                if (presentationId && slideId && layoutId) {
                    useMenuStore.getState().openMenu({
                        slideId,
                        elementId: element.id,
                        layoutId,
                        elementType: 'chart',
                        isTextEditor: false,
                    });
                }
            }
        };
        OpenCustomMenuEvent.addEventListener(handleOpenCustomMenu);
        return () => {
            OpenCustomMenuEvent.removeEventListener(handleOpenCustomMenu);
        };
    }, [element.id, presentationId, slideId, layoutId]);

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
        onUpdateElement?.({ elementVariant: type });
    };

    // Toggle settings
    const handleToggleSettings = (setting: string, value: boolean | string) => {
        // Just for the demo, in a real implementation we would save these to the element
        if (setting === 'showLabels') {
            setShowLabels(value as boolean);
            onUpdateElement?.({ showLabels: value as boolean });
        }
        if (setting === 'showValues') {
            setShowValues(value as boolean);
            onUpdateElement?.({ showValues: value as boolean });
        }
        if (setting === 'legendPosition') {
            setLegendPosition(value as 'left' | 'right' | 'top' | 'bottom');
            onUpdateElement?.({ legendPosition: value as 'left' | 'right' | 'top' | 'bottom' });
        }
        // if (setting === 'colorScheme') setColorScheme(value as string);
        if (setting === 'horizontalAlignment') {
            setHorizontalAlignment(value as 'left' | 'center' | 'right');
            onUpdateElement?.({ alignment: value as 'left' | 'center' | 'right' });
        }
    };

    // Handle resize start
    const handleResizeStart = useCallback(
        (e: React.MouseEvent, direction: ResizeDirection) => {
            e.preventDefault();
            e.stopPropagation();
            setResizing(true);
            setResizeDirection(direction);

            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setStartWidth(rect.width);
                setStartHeight(rect.height);

                // Calculate and store aspect ratio of the container
                const ratio = rect.width / rect.height;
                setAspectRatio(ratio);

                // If the chart doesn't have a set height yet, we need to initialize it
                if (!element.height && containerRef.current) {
                    containerRef.current.style.height = `${rect.height}px`;
                }
            }

            setStartX(e.clientX);
            setStartY(e.clientY);
        },
        [element.height]
    );

    // Handle resize movement
    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!resizing || !resizeDirection || !containerRef.current) return;

            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            let newWidth = startWidth;
            let newHeight = startHeight;

            // Determine new dimensions based on resize direction
            if (resizeDirection.includes('right')) {
                newWidth = startWidth + deltaX;
            } else if (resizeDirection.includes('left')) {
                newWidth = startWidth - deltaX;
            }

            if (resizeDirection.includes('top')) {
                newHeight = startHeight - deltaY;
            } else if (resizeDirection.includes('bottom')) {
                newHeight = startHeight + deltaY;
            }

            // For corner points, handle both width and height
            if (maintainAspectRatio) {
                // If maintaining aspect ratio, calculate the secondary dimension
                if (resizeDirection.includes('right') || resizeDirection.includes('left')) {
                    newHeight = newWidth / aspectRatio;
                } else if (resizeDirection.includes('top') || resizeDirection.includes('bottom')) {
                    newWidth = newHeight * aspectRatio;
                }
            }

            // Ensure minimum dimensions
            const width = Math.max(150, newWidth);
            const height = Math.max(150, newHeight);

            // Update container dimensions in the DOM
            containerRef.current.style.maxWidth = `${width}px`;
            containerRef.current.style.height = `${height}px`;
        },
        [resizing, resizeDirection, startWidth, startHeight, startX, startY, aspectRatio, maintainAspectRatio]
    );

    const handleRemoveChart = useCallback(() => {
        useMenuStore.getState().closeMenu();
        onDeleteElement?.();
    }, [onDeleteElement]);

    // Handle resize end
    const handleResizeEnd = useCallback(() => {
        if (!resizing) return;

        setResizing(false);
        setResizeDirection(null);

        // Save the new dimensions to the element data
        if (containerRef.current) {
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;

            onUpdateElement?.({ width: newWidth, height: newHeight });
        }
    }, [resizing, onUpdateElement]);

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [resizing, resizeDirection, handleResizeMove, handleResizeEnd]);

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
            return styles.mxAuto;
        }

        const align = element.alignment || horizontalAlignment;
        switch (align) {
            case 'left':
                return styles.mrAuto;
            case 'center':
                return styles.mxAuto;
            case 'right':
                return styles.mlAuto;
            default:
                return styles.mxAuto; // Default to center alignment
        }
    };

    // Render the appropriate chart based on the chart type
    const renderChart = useCallback(() => {
        // Calculate chart height based on element height or default to 300
        const chartHeight = element.height || 300;

        // Get alignment from element or state
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

        switch (element.elementVariant) {
            case 'column':
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            {showLabels && <XAxis dataKey="name" stroke={axisLineColor} tick={{ fill: tickColor }} />}
                            {showLabels && <YAxis stroke={axisLineColor} tick={{ fill: tickColor }} />}
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
                                    fill={serie.color || chartColors[index % chartColors.length]}
                                    label={getLabelProps()}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 45, bottom: 5, left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis type="number" hide={!showLabels} stroke={axisLineColor} tick={{ fill: tickColor }} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                hide={!showLabels}
                                stroke={axisLineColor}
                                tick={{ fill: tickColor }}
                            />

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
                                    fill={serie.color || chartColors[index % chartColors.length]}
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
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <LineChart data={[{ name: '' }, ...data, { name: '' }]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            {showLabels && <XAxis dataKey="name" stroke={axisLineColor} tick={{ fill: tickColor }} />}
                            {showLabels && (
                                <YAxis
                                    domain={[yAxisMin, yAxisMax]}
                                    stroke={axisLineColor}
                                    tick={{ fill: tickColor }}
                                />
                            )}
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
                                    stroke={serie.color || chartColors[index % chartColors.length]}
                                    label={getLabelProps()}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'pie': {
                // Transform data for pie chart - use first series only
                let pieData;
                if (element.series && element.series.length > 0) {
                    pieData = data.map(item => ({
                        name: item.name,
                        value: Number(item[element.series![0]!.key]),
                    }));
                } else {
                    pieData = data;
                }
                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={showLabels || showValues}
                                label={getPieLabel}
                                outerRadius={80}
                                fill={chartColors[0]}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
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
            }
            case 'donut': {
                // Transform data for donut chart - use first series only
                let donutData;

                if (element.series && element.series.length > 0) {
                    donutData = data.map(item => ({
                        name: item.name,
                        value: Number(item[element.series![0]!.key]),
                    }));
                } else {
                    donutData = data;
                }

                return (
                    <ResponsiveContainer width="100%" height={chartHeight}>
                        <PieChart>
                            <Pie
                                data={donutData}
                                cx="50%"
                                cy="50%"
                                labelLine={showLabels || showValues}
                                label={getPieLabel}
                                outerRadius={80}
                                innerRadius={40}
                                fill={chartColors[0]}
                                dataKey="value"
                            >
                                {donutData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
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
            }
            default:
                return (
                    <div className={styles.unsupportedChartType}>Unsupported chart type: {element.elementVariant}</div>
                );
        }
    }, [
        element.height,
        element.elementVariant,
        element.series,
        legendPosition,
        showLabels,
        showValues,
        data,
        axisLineColor,
        tickColor,
        chartColors,
    ]);

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
                    className={`${className} ${getAlignmentClass()}`}
                    style={{
                        position: 'relative',
                        cursor: 'pointer',
                        maxWidth: element.width ? `${element.width}px` : '100%',
                        height: element.height ? `${element.height}px` : 'auto',
                    }}
                    onClick={handleClickChart}
                    data-element-id={element.id}
                >
                    {!isReadOnly && isSelected && <div className={styles.selectedBorder}></div>}

                    {renderChart()}

                    {!isReadOnly && isSelected && (
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
            {!isReadOnly && isSettingsOpen && (
                <div
                    ref={settingsRef}
                    className={styles.chartSettingsPopup}
                    style={{
                        top: '0',
                        left: '0',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                    }}
                >
                    {/* Chart type selector */}
                    <div className={styles.chartTypeSelector}>
                        <div
                            className={`${styles.chartControlButton} ${element.elementVariant === 'column' ? styles.chartControlButtonActive : ''}`}
                            onClick={() => handleChangeChartType('column')}
                        >
                            <FaChartColumn className={styles.icon} />
                        </div>

                        <div
                            className={`${styles.chartControlButton} ${element.elementVariant === 'bar' ? styles.chartControlButtonActive : ''}`}
                            onClick={() => handleChangeChartType('bar')}
                        >
                            <FaChartBar className={styles.icon} />
                        </div>

                        <div
                            className={`${styles.chartControlButton} ${element.elementVariant === 'line' ? styles.chartControlButtonActive : ''}`}
                            onClick={() => handleChangeChartType('line')}
                        >
                            <FaChartLine className={styles.icon} />
                        </div>
                        <div
                            className={`${styles.chartControlButton} ${element.elementVariant === 'pie' ? styles.chartControlButtonActive : ''}`}
                            onClick={() => handleChangeChartType('pie')}
                        >
                            <FaChartPie className={styles.icon} />
                        </div>
                        <div
                            className={`${styles.chartControlButton} ${element.elementVariant === 'donut' ? styles.chartControlButtonActive : ''}`}
                            onClick={() => handleChangeChartType('donut')}
                        >
                            <PiChartDonutFill className={styles.icon} />
                        </div>
                    </div>

                    {/* Show labels toggle */}
                    <div className={styles.settingContainer}>
                        <div className={styles.settingItemContainer}>
                            <div className={styles.settingItemLabel}>
                                <IoText className={styles.icon} />
                                <span className={styles.text}>Показывать метки</span>
                            </div>
                            <div
                                className={`${styles.showLabelsToggle} ${showLabels ? styles.showLabelsToggleActive : ''}`}
                                onClick={() => handleToggleSettings('showLabels', !showLabels)}
                            >
                                <div className={styles.settingItemToggle}></div>
                            </div>
                        </div>
                    </div>

                    {/* Show values toggle */}
                    <div className={styles.settingContainer}>
                        <div className={styles.settingItemContainer}>
                            <div className={styles.settingItemLabel}>
                                <RiNumbersLine className={styles.icon} />
                                <span className={styles.text}>Показывать значения</span>
                            </div>
                            <div
                                className={`${styles.showLabelsToggle} ${showValues ? styles.showLabelsToggleActive : ''}`}
                                onClick={() => handleToggleSettings('showValues', !showValues)}
                            >
                                <div className={styles.settingItemToggle}></div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal alignment */}
                    <div className={styles.settingContainer}>
                        <div className={styles.settingItemContainer}>
                            <div className={styles.settingItemLabel}>
                                <IoMdColorPalette className={styles.icon} />
                                <span className={styles.text}>Выравнивание</span>
                            </div>
                            <div className={styles.alignmentButtons}>
                                <div
                                    className={`${styles.showLabelsToggle} ${horizontalAlignment === 'left' ? styles.showLabelsToggleActive : ''}`}
                                    onClick={() => handleToggleSettings('horizontalAlignment', 'left')}
                                >
                                    <LuAlignLeft className={styles.icon} />
                                </div>
                                <div
                                    className={`${styles.showLabelsToggle} ${horizontalAlignment === 'center' ? styles.showLabelsToggleActive : ''}`}
                                    onClick={() => handleToggleSettings('horizontalAlignment', 'center')}
                                >
                                    <LuAlignCenter className={styles.icon} />
                                </div>
                                <div
                                    className={`${styles.showLabelsToggle} ${horizontalAlignment === 'right' ? styles.showLabelsToggleActive : ''}`}
                                    onClick={() => handleToggleSettings('horizontalAlignment', 'right')}
                                >
                                    <LuAlignRight className={styles.icon} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend position */}
                    <div className={styles.settingContainer}>
                        <div className={styles.settingItemContainer}>
                            <div className={styles.settingItemLabel}>
                                <IoText className={styles.icon} />
                                <span className={styles.text}>Положение легенды</span>
                            </div>
                            <select
                                className={styles.chartAlignmentSelect}
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

                    {/* Maintain aspect ratio toggle */}
                    <div className={styles.settingContainer}>
                        <div className={styles.settingItemContainer}>
                            <div className={styles.settingItemLabel}>
                                <IoMdColorPalette className={styles.icon} />
                                <span className={styles.text}>Сохранять пропорции</span>
                            </div>
                            <div
                                className={`${styles.showLabelsToggle} ${maintainAspectRatio ? styles.showLabelsToggleActive : ''}`}
                                onClick={() => setMaintainAspectRatio(!maintainAspectRatio)}
                            >
                                <div className={styles.settingItemToggle}></div>
                            </div>
                        </div>
                    </div>

                    {/* Edit data button */}
                    <button className={styles.editButton} onClick={handleOpenDataModal}>
                        <MdOutlineEdit className={styles.editButtonIcon} />
                        Редактировать данные
                    </button>

                    {/* Remove button */}
                    <button className={styles.removeButton} onClick={handleRemoveChart}>
                        <HiOutlineTrash className={styles.editButtonIcon} />
                        Удалить
                    </button>
                </div>
            )}

            {/* Full data edit modal */}
            {!isReadOnly && isModalOpen && presentationId && slideId && layoutId && (
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

export default ChartComponent;
