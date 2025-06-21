import React, { useMemo } from 'react';
import tinycolor from 'tinycolor2';
import { Layout } from '@/types';
import ElementViewer from '../ElementViewer';
import { ViewerElement } from '@/types/elements';
import { type Element } from '@/types';
import generateGridTemplateAreas from '@/utils/generateGridTemplateAreas';
import styles from './LayoutViewer.module.css';
import { Theme } from '@/types/theme';

interface LayoutViewerProps {
    layout: Layout;
    slideId: string;
    slideBackground?: string;
    primaryAccentColor: string;
    theme: Theme;
}

const LayoutViewer = ({ layout, slideId, slideBackground, primaryAccentColor, theme }: LayoutViewerProps) => {
    // Calculate grid template columns based on column widths
    const getGridTemplateColumns = () => {
        if (layout.gridStructure.columnWidths) {
            return layout.gridStructure.columnWidths.join(' ');
        }

        // Default to equal width columns
        const columns = layout.gridStructure.columns || 1;
        return `repeat(${columns}, 1fr)`;
    };

    // Calculate grid template areas without useMemo for server compatibility
    const gridTemplateAreas = generateGridTemplateAreas(layout.gridStructure);

    // Helper function to get row alternating colors based on slide background
    const getRowColors = useMemo(() => {
        let bgColor;

        const slideBg = slideBackground || theme?.colors.slideBackground;
        if (!layout.isTable || !slideBg) {
            bgColor = tinycolor('#ffffff');
        }

        bgColor = tinycolor(slideBg);
        const isDarkBackground = bgColor.isDark();

        if (isDarkBackground) {
            // Dark background: even rows lighter, odd rows transparent
            return {
                evenRowColor: 'rgba(255, 255, 255, 0.3)',
                oddRowColor: 'transparent',
            };
        } else {
            // Light background: even rows darker, odd rows transparent
            return {
                evenRowColor: 'rgba(0, 0, 0, 0.05)',
                oddRowColor: 'transparent',
            };
        }
    }, [layout.isTable, slideBackground, theme?.colors.slideBackground]);

    // Helper function to determine cell styling classes for table layout
    const getCellClasses = () => {
        if (!layout.isTable) return '';
        return styles.tableCell;
    };

    // Helper function to get cell styles for table layout with row alternating
    const getCellStyles = (rowIndex: number): React.CSSProperties => {
        if (!layout.isTable || !getRowColors) return {};

        const isEvenRow = rowIndex % 2 === 0;
        const backgroundColor = isEvenRow ? getRowColors.evenRowColor : getRowColors.oddRowColor;

        return {
            backgroundColor,
        };
    };

    return (
        <div
            style={{
                ...layout.style,
            }}
        >
            <div
                className={layout.isTable ? styles.tableLayout : ''}
                style={{
                    display: 'grid',
                    gap: layout.isTable ? '0' : '1rem',
                    marginTop: '1.125em',
                    marginBottom: '1.125em',
                    gridTemplateColumns: getGridTemplateColumns(),
                    gridTemplateAreas: gridTemplateAreas,
                    fontSize: '18px',
                }}
            >
                {layout.gridStructure.rows.map((row, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                        {row.cells.map(cell => {
                            // Find elements for this cell
                            const cellElements = layout.elements.filter(element => element.cellId === cell.id);

                            // Determine vertical alignment for the cell
                            let justifyContent: React.CSSProperties['justifyContent'] = 'flex-start';
                            if (cell.alignment === 'center') {
                                justifyContent = 'center';
                            } else if (cell.alignment === 'bottom') {
                                justifyContent = 'flex-end';
                            }

                            return (
                                <div
                                    key={cell.id}
                                    className={getCellClasses()}
                                    style={{
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent,
                                        width: '100%',
                                        height: '100%',
                                        minHeight: layout.isTable ? '3rem' : 'auto',
                                        ...getCellStyles(rowIndex),
                                    }}
                                >
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
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default LayoutViewer;
