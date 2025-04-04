import { generateGridTemplateAreas, generateGridTemplateColumns, Layout } from '@/types';
import ElementViewer from './ElementViewer';
import { useMemo } from 'react';

interface LayoutViewerProps {
    layout: Layout;
    slideId: string;
}

const LayoutViewer = ({ layout, slideId }: LayoutViewerProps) => {
    // Calculate grid template columns based on column widths
    const getGridTemplateColumns = () => {
        if (layout.gridStructure.columnWidths) {
            return layout.gridStructure.columnWidths.join(' ');
        }

        // Default to equal width columns
        const columns = layout.gridStructure.columns || 1;
        return `repeat(${columns}, 1fr)`;
    };

    const gridTemplateAreas = useMemo(() =>
        generateGridTemplateAreas(layout.gridStructure),
    [layout.gridStructure]
    );

    const gridTemplateColumns = useMemo(() =>
        generateGridTemplateColumns(layout.gridStructure),
    [layout.gridStructure]
    );


    return (
        <div
            className="w-full h-full"
            style={{
                ...layout.style,
            }}
        >
            <div
                className="grid w-full h-full gap-4"
                style={{
                    gridTemplateColumns: getGridTemplateColumns(),
                    gridTemplateAreas: gridTemplateAreas,
                }}
            >
                {layout.gridStructure.rows.map(row => (
                    row.cells.map(cell => {
                        // Find elements for this cell
                        const cellElements = layout.elements.filter(
                            element => element.cellId === cell.id
                        );

                        return (
                            <div
                                key={cell.id}
                                className="relative"
                            >
                                {cellElements.map(element => (
                                    <ElementViewer
                                        key={element.id}
                                        element={element}
                                        slideId={slideId}
                                        layoutId={layout.id}
                                    />
                                ))}
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};

export default LayoutViewer;
