import React, { useEffect, useState, useCallback } from 'react';
import { useDnd } from '@/contexts/DragDropContext';
import { usePresentationStore } from '@/store/presentationStore';


type IndicatorInfo = {
    targetRect: {
        left: number;
        top: number;
        width: number;
        height: number;
        right: number;
        bottom: number;
    };
    position: 'top' | 'bottom' | 'left' | 'right' | null;
    type: IndicatorType;
    sourceType: 'element' | 'layout' | 'slide' | 'cell' | 'column' | 'row';
}

type IndicatorType = 'element' | 'layout' | 'slide' | 'cell' | 'column';

const DropIndicator = () => {
    const { state } = useDnd();
    const { indicators, dragState } = state;
    const [visible, setVisible] = useState(false);

    const {
        findLayoutByElementId
    } = usePresentationStore();

    // Add animation when indicator appears/disappears
    useEffect(() => {
        if (dragState === 'dragging' && (
            indicators.elementIndicator ||
            indicators.layoutIndicator ||
            indicators.slideIndicator ||
            indicators.cellIndicator ||
            (indicators.tableColumnIndicator || indicators.tableColumnIndicator === 0) ||
            (indicators.tableRowIndicator || indicators.tableRowIndicator === 0)
        )) {
            setVisible(true);
        } else {
            // Small delay to allow for animation
            const timeout = setTimeout(() => {
                setVisible(false);
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [dragState, indicators]);


    // Get indicator and position depending on what's being targeted
    const getIndicatorInfo = (): IndicatorInfo | null => {
        // Determine the dragging source type: element or cell or layout
        const sourceType: 'element' | 'cell' | 'layout' = 'element';

        if (!indicators) {
            return null;
        }

        if (indicators.elementIndicator) {
            const element = document.querySelector(`[data-element-id="${indicators.elementIndicator}"]`);
            if (!element) return null;

            const rect = element.getBoundingClientRect();
            const position = indicators.elementPosition;

            // Get cell information
            const cell = element.closest('[data-cell-id]');
            if (!cell) return null;

            const cellRect = cell.getBoundingClientRect();
            const elementId = element.getAttribute('data-element-id');
            const layout = findLayoutByElementId(elementId!);

            if (!layout) return null;

            // Case 1: 1 element by 1 element
            const isSingleElementLayout = element.closest('[data-is-single-element-layout="true"]') !== null;
            if (isSingleElementLayout) {
                return {
                    targetRect: rect,
                    position: position,
                    type: 'element' as IndicatorType,
                    sourceType
                };
            }

            // Case 2: 1 element per 1 element in one of the cells (in target layout there are 2+ cells)
            const isMultiCell = element.closest('[data-is-multi-cell="true"]') !== null;
            if (isMultiCell) {
                // Case 2.1: top/bottom of element
                if (position === 'top' || position === 'bottom') {
                    return {
                        targetRect: rect,
                        position: position,
                        type: 'element' as IndicatorType,
                        sourceType
                    };
                }

                // Case 2.2: left/right of element
                if (position === 'left' || position === 'right') {
                    return {
                        targetRect: rect,
                        position: position,
                        type: 'element' as IndicatorType,
                        sourceType
                    };
                }

                // Case 2.3: left/right of row
                if (position === 'left' || position === 'right') {
                    return {
                        targetRect: cellRect,
                        position: position,
                        type: 'cell' as IndicatorType,
                        sourceType: 'cell'
                    };
                }

                // Case 2.4: top/bottom of row
                if (position === 'top' || position === 'bottom') {
                    return {
                        targetRect: cellRect,
                        position: position,
                        type: 'layout' as IndicatorType,
                        sourceType: 'layout'
                    };
                }
            }
        }

        if (indicators.layoutIndicator) {
            const layout = document.querySelector(`[data-layout-id="${indicators.layoutIndicator}"]`);
            if (!layout) return null;

            const rect = layout.getBoundingClientRect();
            const position = indicators.layoutPosition;

            // Case 3: cell move by 1 element
            if (position === 'left' || position === 'right') {
                return {
                    targetRect: rect,
                    position: position,
                    type: 'cell' as IndicatorType,
                    sourceType: 'cell'
                };
            }

            // Case 3.2: top/bottom
            if (position === 'top' || position === 'bottom') {
                return {
                    targetRect: rect,
                    position: position,
                    type: 'layout' as IndicatorType,
                    sourceType: 'layout'
                };
            }
        }

        if (indicators.cellIndicator) {
            const cell = document.querySelector(`[data-cell-id="${indicators.cellIndicator}"]`);
            if (!cell) return null;

            const rect = cell.getBoundingClientRect();
            const position = indicators.cellPosition;

            if (position === 'left' || position === 'right') {
                return {
                    targetRect: rect,
                    position: position,
                    type: 'cell' as IndicatorType,
                    sourceType: 'cell'
                };
            }
        }

        // Add column indicator handling
        if (indicators.tableColumnIndicator || indicators.tableColumnIndicator === 0) {
            // Parse column information from the indicator
            const layoutId = indicators.tableId;
            if (!layoutId) return null;

            // const columnIndex = indicators.tableColumnIndicator;

            // Find the column node using data-column-drag-handle attribute
            // const columnNode = document.querySelector(`[data-column-drag-handle="${layoutId}-${columnIndex}"]`);
            // if (!columnNode) return null;

            // Get the table cell node that contains this column
            // const cellNode = columnNode.closest('[data-cell-id]');
            const cellNode = document.querySelector(`[data-cell-id="${indicators.cellId}"]`);
            if (!cellNode) return null;

            const cellRect = cellNode.getBoundingClientRect();
            const layoutRect = cellNode.closest('[data-layout-id]')?.getBoundingClientRect();

            const position = indicators.tableColumnPosition;

            // // Adjust rect based on position (left or right)
            // const adjustedRect = {...rect};
            // if (position === 'left') {
            //     adjustedRect.width = 4; // Small width for the indicator
            // } else if (position === 'right') {
            //     adjustedRect.left = rect.right - 4;
            //     adjustedRect.width = 4;
            // }

            return {
                targetRect: {
                    left: cellRect.left,
                    top: cellRect.top,
                    width: cellRect.width,
                    height: layoutRect?.height || 0,
                    right: cellRect.right,
                    bottom: layoutRect?.bottom || 0,
                },
                position: position,
                type: 'column' as IndicatorType,
                sourceType: 'column'
            };
        }

        return null;
    };

    const indicatorInfo = getIndicatorInfo();

    // Generate styles based on position and context
    const getIndicatorStyles = useCallback(() => {
        const { targetRect, position, type } = indicatorInfo;
        // Increase thickness for better visibility
        const thickness = type === 'element' ? 3 : type === 'cell' ? 4 : 4;

        const offset = 0;
        let styles: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none',
            backgroundColor: 'transparent',
            border: 'none',
            transition: 'all 150ms ease-in-out',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.4)',
        };

        const colors: Record<IndicatorType, string> = {
            element: '#3b82f6', // blue
            cell: '#3b82f6',    // red
            layout: '#3b82f6',  // green
            slide: '#3b82f6',   // purple
            column: '#4f46e5'   // indigo - different color for column indicator
        };

        const color = colors[type];

        if (position === 'left') {
            styles = {
                ...styles,
                left: targetRect.left + offset,
                top: targetRect.top,
                width: thickness,
                height: targetRect.height,
                backgroundColor: color,
            };
        } else if (position === 'right') {
            styles = {
                ...styles,
                left: targetRect.right - offset - thickness,
                top: targetRect.top,
                width: thickness,
                height: targetRect.height,
                backgroundColor: color,
            };
        } else if (position === 'top') {
            styles = {
                ...styles,
                left: targetRect.left,
                top: targetRect.top,
                width: targetRect.width,
                height: thickness,
                backgroundColor: color,
            };
        } else if (position === 'bottom') {
            styles = {
                ...styles,
                left: targetRect.left,
                top: targetRect.bottom - thickness,
                width: targetRect.width,
                height: thickness,
                backgroundColor: color,
            };
        } else if (type === 'slide') {
            // For slide indicators, highlight the whole slide
            styles = {
                ...styles,
                left: targetRect.left - 2,
                top: targetRect.top - 2,
                width: targetRect.width + 4,
                height: targetRect.height + 4,
                border: `${thickness}px solid ${color}`,
                borderRadius: '4px',
            };
        }

        return styles;
    }, [indicatorInfo]);

    if (!visible || !indicatorInfo) return null;

    const styles = getIndicatorStyles();

    return <div className="drop-indicator" style={styles} />;
};

export default DropIndicator;