import { ChartElement } from '@/types';
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

// Default colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ElementViewerProps {
    element: ChartElement & ViewerElement;
    slideId: string;
    layoutId: string;
}

const ElementViewer = ({ element }: ElementViewerProps) => {
    // Get element-specific styles
    const getElementStyles = () => {
        const baseStyles: React.CSSProperties = {
            // Apply base element styles
            // width: '100%',
            // height: '100%',
        };

        // Apply opacity if defined
        if (element.opacity !== undefined) {
            baseStyles.opacity = element.opacity;
        }

        return baseStyles;
    };

    // Get text-specific theme styles
    const getTextStyles = () => {
        const isHeading = element.elementTypeId === 'heading';

        const textStyles: React.CSSProperties = {
            // Apply text styling from theme variables
            color: isHeading ? 'var(--presentation-heading-color)' : 'var(--presentation-text-color)',
            fontFamily: isHeading ? 'var(--presentation-heading-font)' : 'var(--presentation-body-font)',
            fontWeight: isHeading ? 'var(--presentation-heading-weight)' : 'var(--presentation-body-weight)',
            lineHeight: isHeading ? 'var(--presentation-heading-line-height)' : 'var(--presentation-body-line-height)',
            letterSpacing: isHeading
                ? 'var(--presentation-heading-letter-spacing)'
                : 'var(--presentation-body-letter-spacing)',
            textTransform: isHeading
                ? ('var(--presentation-heading-capitalization)' as any)
                : ('var(--presentation-body-capitalization)' as any),
        };

        return textStyles;
    };

    // Render element based on its type
    const renderElementContent = () => {
        switch (element.elementTypeId) {
            case 'text':
            case 'heading':
            case 'paragraph':
            case 'editor':
                // For text elements, render HTML content from 'content' property with theme styles
                return (
                    <div
                        className="tiptap viewer-tiptap"
                        style={getTextStyles()}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case 'image':
                // For image elements, render the image
                return (
                    <div className={styles.container}>
                        <img
                            src={element.src || ''}
                            alt={element.alt || 'Presentation image'}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                    </div>
                );

            case 'column-chart':
            case 'bar-chart':
            case 'line-chart':
            case 'pie-chart':
            case 'donut-chart': {
                // For chart elements, render the appropriate chart
                const chartElement = element as unknown as ChartElement;
                const data = chartElement.data || [];

                // Use theme accent colors for charts
                const chartColors = [
                    'var(--presentation-primary-accent, #8884d8)',
                    'var(--presentation-secondary-accent-1, #00C49F)',
                    'var(--presentation-secondary-accent-2, #FFBB28)',
                    'var(--presentation-secondary-accent-3, #FF8042)',
                    'var(--presentation-shapes-color, #82ca9d)',
                ];

                // Render the appropriate chart
                switch (element.elementVariant) {
                    case 'bar':
                        return (
                            <div className={styles.container}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" fill={chartColors[0]} />
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
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="value" stroke={chartColors[0]} />
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
                                        >
                                            {data.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={chartColors[index % chartColors.length]}
                                                />
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
                                        >
                                            {data.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={chartColors[index % chartColors.length]}
                                                />
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
            }
            default:
                // For unsupported element types, render a placeholder
                return <div className={styles.container}>Unsupported element type</div>;
        }
    };

    return (
        <div
            style={{
                ...getElementStyles(),
                zIndex: 0,
                transform: 'none',
            }}
            className="element-viewer"
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer;
