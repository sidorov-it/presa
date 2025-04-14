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
        console.log(element.elementTypeId);
        switch (element.elementTypeId) {
            case 'text':
            case 'heading':
            case 'paragraph':
            case 'editor':
                // For text elements, render HTML content from 'content' property
                return (
                    <div className="w-full h-full tiptap" dangerouslySetInnerHTML={{ __html: element.content || '' }} />
                );

            case 'image':
                // For image elements, render the image
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src={element.url || ''}
                            alt={element.alt || 'Presentation image'}
                            className="max-w-full max-h-full object-contain"
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
                            <div className="w-full h-full flex items-center justify-center">
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
                            <div className="w-full h-full flex items-center justify-center">
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
                            <div className="w-full h-full flex items-center justify-center">
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
                            <div className="w-full h-full flex items-center justify-center">
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
                        return (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                Unsupported chart type
                            </div>
                        );
                }
            }
            default:
                // For unsupported element types, render a placeholder
                return (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Unsupported element type
                    </div>
                );
        }
    };

    return (
        <div
            className="w-full h-full"
            style={{
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
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
