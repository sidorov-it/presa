'use client';
import { ChartElement, Element, SmartLayoutElement } from '@/types';
import { ViewerElement } from '@/types/elements';
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

import styles from './ElementViewer.module.css';
import { ElementType } from '@/types/elements';
import { getBlockColors, getChartColors, getChartAxisColors } from '@/utils/colors';
import { BoxIconOptions } from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxIconOptions';
import SmartLayoutComponent from '@/elements/smartLayout/SmartLayoutComponent';
import SmartLayoutView from '@/elements/smartLayout/SmartLayoutView';

interface ElementViewerProps {
    element: Element & ViewerElement;
    slideId: string;
    layoutId: string;
    slideBackground?: string;
    primaryAccentColor?: string;
}

const ElementViewer = ({ element, slideBackground, primaryAccentColor }: ElementViewerProps) => {
    // Get element-specific styles
    // const getElementStyles = () => {
    //     const baseStyles: React.CSSProperties = {
    //         // Apply base element styles
    //         // width: '100%',
    //         // height: '100%',
    //     };

    //     // Apply opacity if defined
    //     if (element.opacity !== undefined) {
    //         baseStyles.opacity = element.opacity;
    //     }

    //     // Apply background color if defined
    //     if (element.backgroundColor) {
    //         baseStyles.backgroundColor = element.backgroundColor;
    //     }

    //     // Apply border radius if defined
    //     if (element.borderRadius) {
    //         baseStyles.borderRadius = element.borderRadius;
    //     }

    //     return baseStyles;
    // };

    const renderChart = () => {
        const chartElement = element as unknown as ChartElement;
        const data = chartElement.data || [];

        // Determine slide background and accent colors from props or CSS variables
        const slideBgColor =
            slideBackground ||
            // getComputedStyle(document.documentElement).getPropertyValue('--presentation-slide-background')?.trim() ||
            '#ffffff';
        const accentColor =
            primaryAccentColor ||
            // getComputedStyle(document.documentElement).getPropertyValue('--presentation-primary-accent')?.trim() ||
            '#8884d8';

        const chartColors = getChartColors(slideBgColor, accentColor);
        const axisColors = getChartAxisColors(slideBgColor, accentColor);

        // Render the appropriate chart
        switch (element.elementVariant) {
            case 'bar':
                return (
                    <div className={styles.container}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    stroke={axisColors.axisLineColor}
                                    tick={{ fill: axisColors.tickColor }}
                                />
                                <YAxis stroke={axisColors.axisLineColor} tick={{ fill: axisColors.tickColor }} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill={chartColors[0]} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );

            case 'line':
                return (
                    <div className={styles.container}>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    stroke={axisColors.axisLineColor}
                                    tick={{ fill: axisColors.tickColor }}
                                />
                                <YAxis stroke={axisColors.axisLineColor} tick={{ fill: axisColors.tickColor }} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={chartColors[0]}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );

            case 'pie':
                return (
                    <div className={styles.container}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill={chartColors[0]}
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );

            case 'donut':
                return (
                    <div className={styles.container}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={true}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    innerRadius={40}
                                    fill={chartColors[0]}
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );

            default:
                return <div className={styles.container}>Unsupported chart type</div>;
        }
    };

    // Render element based on its type
    const renderElementContent = () => {
        switch (element.elementTypeId) {
            case ElementType.TEXT:
            case ElementType.QUOTE:
                // For text elements, render HTML content from 'content' property with theme styles
                return (
                    <div
                        className={`tiptap ProseMirror not-prose ${styles.viewerTiptap}`}
                        // style={getTextStyles()}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case ElementType.IMAGE:
                // For image elements, render the image
                return (
                    <div className={styles.container}>
                        {!element.url && !(element as any).src && <div style={{ width: '100%', height: '100%' }} />}
                        {(element.url || (element as any).src) && (
                            <img
                                src={(element as any).src || element.url || ''}
                                alt={element.alt || 'Presentation image'}
                                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                            />
                        )}
                    </div>
                );

            case ElementType.CHART:
                return renderChart();

            case ElementType.SMART_LAYOUT: {
                // For smart layout elements, render the layout with its items
                // const smartLayout = element as unknown as SmartLayoutElement;
                // return (
                //     <div className={styles.smartLayout} data-test="smart-layout">
                //         {smartLayout.items?.map((item: SmartLayoutItem) => (
                //             <div key={item.id} className={styles.smartLayoutItem}>
                //                 {item.imageUrl && (
                //                     <img
                //                         src={item.imageUrl}
                //                         alt={item.title || 'Item image'}
                //                         className={styles.smartLayoutItemImage}
                //                     />
                //                 )}
                //                 {item.title && (
                //                     <span
                //                         dangerouslySetInnerHTML={{ __html: item.title }}
                //                         className={styles.smartLayoutItemTitle}
                //                     />
                //                 )}
                //                 {item.text && (
                //                     <span
                //                         dangerouslySetInnerHTML={{ __html: item.text }}
                //                         className={styles.smartLayoutItemDescription}
                //                     />
                //                 )}
                //             </div>
                //         ))}
                //     </div>
                // );
                return (
                    <SmartLayoutView
                        element={element as SmartLayoutElement}
                        presentationId={''}
                        slideId={''}
                        layoutId={''}
                        tiptapRefs={null}
                        isFocused={false}
                    />
                );
            }

            case ElementType.TABLE:
                // For table elements, render HTML content with table styling
                return (
                    <div
                        className={`tiptap ProseMirror viewer-tiptap ${styles.table}`}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case ElementType.BOX: {
                // For box elements, render a styled container with content using new color logic
                const boxElement = element as Element &
                    ViewerElement & {
                        customBackgroundColor?: string;
                        darkBackgroundColor?: string;
                        darkColor?: string;
                        iconType?: string;
                    };

                // Determine block type based on iconType or elementVariant
                const blockType = boxElement.iconType || element.elementVariant || 'info-box';

                // Get colors using new logic
                const blockColors = getBlockColors(primaryAccentColor!, blockType, {
                    blockBgColor: boxElement.customBackgroundColor || boxElement.backgroundColor,
                    iconColor: (boxElement as any).iconColor,
                    textColor: (boxElement as any).textColor,
                });

                // Get icon component
                const IconInfo = BoxIconOptions.find(option => option.id === boxElement.iconType);
                const IconComponent = IconInfo?.Icon;

                return (
                    <div
                        className={styles.box}
                        style={{
                            // ...getElementStyles(),
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '1rem',
                            padding: '1rem',
                            backgroundColor: blockColors.blockBgColor,
                            color: blockColors.textColor,
                        }}
                    >
                        {IconComponent && boxElement.iconType !== 'without-icon' && (
                            <span className={styles.boxIcon}>
                                <IconComponent color={blockColors.iconColor} size="1.25em" />
                            </span>
                        )}
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                            dangerouslySetInnerHTML={{ __html: element.content || '' }}
                        />
                    </div>
                );
            }

            default:
                // For unsupported element types, render a placeholder
                return <div className={styles.container}>Unsupported element type: {element.elementTypeId}</div>;
        }
    };

    return (
        <div
            style={{
                // ...getElementStyles(),
                margin: '0.9em 0',
                zIndex: 0,
                transform: element.transform || 'none',
            }}
            // className="element-viewer"
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer;
