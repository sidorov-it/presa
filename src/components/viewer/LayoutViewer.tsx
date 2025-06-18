import { Layout } from '@/types';
import ElementViewer from './ElementViewer';
import { useMemo } from 'react';
import { ViewerElement } from '@/types/elements';
import { type Element } from '@/types';
import generateGridTemplateAreas from '@/utils/generateGridTemplateAreas';

interface LayoutViewerProps {
    layout: Layout;
    slideId: string;
    slideBackground?: string;
    primaryAccentColor: string;
}

const LayoutViewer = ({ layout, slideId, slideBackground, primaryAccentColor }: LayoutViewerProps) => {
    // Calculate grid template columns based on column widths
    const getGridTemplateColumns = () => {
        if (layout.gridStructure.columnWidths) {
            return layout.gridStructure.columnWidths.join(' ');
        }

        // Default to equal width columns
        const columns = layout.gridStructure.columns || 1;
        return `repeat(${columns}, 1fr)`;
    };

    const gridTemplateAreas = useMemo(() => generateGridTemplateAreas(layout.gridStructure), [layout.gridStructure]);

    return (
        <div
            style={{
                // height: '100%',
                // width: '100%',
                ...layout.style,
            }}
        >
            <div
                style={{
                    display: 'grid',
                    gap: '1rem',
                    // width: '100%',
                    // height: '100%',
                    marginTop: '1.125em',
                    marginBottom: '1.125em',
                    gridTemplateColumns: getGridTemplateColumns(),
                    gridTemplateAreas: gridTemplateAreas,
                }}
            >
                {layout.gridStructure.rows.map(row =>
                    row.cells.map(cell => {
                        // Find elements for this cell
                        const cellElements = layout.elements.filter(element => element.cellId === cell.id);

                        return (
                            <div key={cell.id} style={{ position: 'relative' }}>
                                {cellElements.map(element => (
                                    <ElementViewer
                                        key={element.id}
                                        element={element as Element & ViewerElement}
                                        slideId={slideId}
                                        layoutId={layout.id}
                                        slideBackground={slideBackground}
                                        primaryAccentColor={primaryAccentColor}
                                    />
                                ))}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default LayoutViewer;
