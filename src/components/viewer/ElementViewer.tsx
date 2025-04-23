/* eslint-disable @next/next/no-img-element */
import { Element, ChartElement } from '@/types';
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
    element: Element & ViewerElement;
    slideId: string;
    layoutId: string;
}

const ElementViewer = ({ element }: ElementViewerProps) => {
    // Render element based on its type
    const renderElementContent = () => {
        switch (element.elementTypeId) {
            case 'text':
            case 'heading':
            case 'paragraph':
            case 'editor':
                // For text elements, render HTML content from 'content' property
                return (
                    <div
                        className="tiptap"
                        // style={{ width: '100%', height: '100%' }}
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
                            style={{ /* width: '100%', height: '100%', */ objectFit: 'contain' }}
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

                // Determine chart type
                let chartType = 'bar';
                if (element.elementTypeId === 'line-chart') chartType = 'line';
                else if (element.elementTypeId === 'pie-chart') chartType = 'pie';
                else if (element.elementTypeId === 'donut-chart') chartType = 'donut';

                // Render the appropriate chart
                switch (chartType) {
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
                                        <Bar dataKey="value" fill="#8884d8" />
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
                                        <Line type="monotone" dataKey="value" stroke="#8884d8" />
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
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                top: 0,
                left: 0,
                // width: '100%',
                // height: '100%',
                zIndex: 0,
                transform: 'none',
                // opacity: element.opacity !== undefined ? element.opacity : 1,
            }}
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer;
