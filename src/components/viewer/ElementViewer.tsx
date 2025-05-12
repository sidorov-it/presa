import { ChartElement, SmartLayoutElement, SmartLayoutItem } from '@/types';
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

        // Apply background color if defined
        if (element.backgroundColor) {
            baseStyles.backgroundColor = element.backgroundColor;
        }

        // Apply border radius if defined
        if (element.borderRadius) {
            baseStyles.borderRadius = element.borderRadius;
        }

        return baseStyles;
    };

    // Get text-specific theme styles
    const getTextStyles = () => {
        const isHeading = element.elementTypeId === 'heading';
        const isQuote = element.elementTypeId === 'quote';

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

        // Additional styles for quotes
        if (isQuote) {
            textStyles.fontStyle = 'italic';
            textStyles.borderLeft = '4px solid var(--presentation-primary-accent)';
            textStyles.paddingLeft = '1rem';
        }

        return textStyles;
    };

    // Get button-specific styles
    const getButtonStyles = () => {
        const buttonStyles: React.CSSProperties = {
            backgroundColor: 'var(--presentation-primary-accent)',
            color: '#fff',
            padding: '0.5rem 1rem',
            borderRadius: '0.25rem',
            fontWeight: 'bold',
            display: 'inline-block',
            cursor: 'pointer',
            textAlign: 'center',
        };

        return buttonStyles;
    };

    // Get shape-specific styles
    const getShapeStyles = () => {
        const shapeStyles: React.CSSProperties = {
            backgroundColor: element.backgroundColor || 'var(--presentation-shapes-color)',
            width: '100%',
            height: '100%',
            minHeight: '50px',
        };

        if (element.shapeType === 'circle') {
            shapeStyles.borderRadius = '50%';
        } else if (element.shapeType === 'triangle') {
            // Triangle shape is handled with a pseudo-element in CSS
            shapeStyles.position = 'relative';
            shapeStyles.backgroundColor = 'transparent';
        }

        return shapeStyles;
    };

    // Render element based on its type
    const renderElementContent = () => {
        switch (element.elementTypeId) {
            case 'text':
            case 'heading':
            case 'paragraph':
            case 'editor':
            case 'quote':
                // For text elements, render HTML content from 'content' property with theme styles
                return (
                    <div
                        className={`tiptap ProseMirror not-prose ${styles.viewerTiptap}`}
                        // style={getTextStyles()}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case 'image':
                // For image elements, render the image
                return (
                    <div className={styles.container}>
                        <img
                            src={(element as any).src || element.url || ''}
                            alt={element.alt || 'Presentation image'}
                            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                        />
                    </div>
                );

            case 'video':
                // For video elements, render the video player
                return (
                    <div className={styles.container}>
                        <video 
                            controls
                            style={{ width: '100%', height: '100%' }}
                            src={(element as any).src || element.url || ''}
                        >
                            <track kind="captions" src="" label="English" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                );

            case 'button':
                // For button elements, render a styled button
                return (
                    <div
                        className={styles.button}
                        style={getButtonStyles()}
                        dangerouslySetInnerHTML={{ __html: element.content || 'Button' }}
                    />
                );

            case 'toggle':
                // For toggle elements, render a toggle switch with label
                return (
                    <div className={styles.toggle}>
                        <div className={styles.toggleSwitch}>
                            <div className={styles.toggleIndicator} />
                        </div>
                        <div
                            className={styles.toggleLabel}
                            dangerouslySetInnerHTML={{ __html: element.content || 'Toggle' }}
                        />
                    </div>
                );

            case 'shape':
                // For shape elements, render the appropriate shape
                return (
                    <div
                        className={`${styles.shape} ${element.shapeType ? styles[element.shapeType] : ''}`}
                        style={getShapeStyles()}
                    />
                );

            case 'bullet-list':
            case 'numbered-list':
            case 'todo-list':
                // For list elements, render HTML content with appropriate list styling
                return (
                    <div
                        className={`tiptap ProseMirror viewer-tiptap ${styles.list} ${styles[element.elementTypeId]}`}
                        style={getTextStyles()}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case 'table':
                // For table elements, render HTML content with table styling
                return (
                    <div
                        className={`tiptap ProseMirror viewer-tiptap ${styles.table}`}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case 'box':
                // For box elements, render a styled container with content
                return (
                    <div
                        className={styles.box}
                        style={{
                            ...getElementStyles(),
                            padding: '1rem',
                            backgroundColor: element.backgroundColor || 'var(--presentation-accent-blocks-color)',
                            color: '#fff',
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: element.content || '' }} />
                    </div>
                );

            case 'smart-layout': {
                // For smart layout elements, render the layout with its items
                const smartLayout = element as unknown as SmartLayoutElement;
                return (
                    <div className={styles.smartLayout}>
                        {smartLayout.items?.map((item: SmartLayoutItem) => (
                            <div key={item.id} className={styles.smartLayoutItem}>
                                {item.imageUrl && (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title || 'Item image'}
                                        className={styles.smartLayoutItemImage}
                                    />
                                )}
                                {item.title && <h3 className={styles.smartLayoutItemTitle}>{item.title}</h3>}
                                {item.description && (
                                    <p className={styles.smartLayoutItemDescription}>{item.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }

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
                return <div className={styles.container}>Unsupported element type: {element.elementTypeId}</div>;
        }
    };

    return (
        <div
            style={{
                ...getElementStyles(),
                zIndex: 0,
                transform: element.transform || 'none',
            }}
            className="element-viewer"
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer;
