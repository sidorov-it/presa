import React, { useEffect, useState } from 'react';
import { useDnd } from '@/contexts/DragDropContext';
import { usePresentationStore } from '@/store/presentationStore';

type IndicatorType = 'element' | 'layout' | 'slide' | 'cell';

const DropIndicator = () => {
    const { state } = useDnd();
    const { indicators, dragState, source } = state;
    const [visible, setVisible] = useState(false);

    const {
        findLayoutByElementId
    } = usePresentationStore();

    // Add animation when indicator appears/disappears
    useEffect(() => {
        if (dragState === 'dragging' && (indicators.elementIndicator || indicators.layoutIndicator || indicators.slideIndicator || indicators.cellIndicator)) {
            setVisible(true);
        } else {
            // Small delay to allow for animation
            const timeout = setTimeout(() => {
                setVisible(false);
            }, 150);
            return () => clearTimeout(timeout);
        }
    }, [dragState, indicators]);

    if (!visible) {
        return null;
    }

    // Get indicator and position depending on what's being targeted
    const getIndicatorInfo = () => {
        // Determine the dragging source type: element or cell or layout
        const sourceType: 'element' | 'cell' | 'layout' = 'element';

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

        return null;
    };

    const indicatorInfo = getIndicatorInfo();
    if (!indicatorInfo) return null;

    const { targetRect, position, type, isMultiCell } = indicatorInfo;

    // Generate styles based on position and context
    const getIndicatorStyles = () => {
        // Different thicknesses for different indicator types
        const thickness = type === 'element' ? 2 : type === 'cell' ? 3 : 3;

        // Different offsets for different indicator types
        // const offset = type === 'element' ? -1 :
        //     type === 'cell' ? -2 :
        //         -4; // Layout gets a larger offset

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
            slide: '#3b82f6'    // purple
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
                // top: targetRect.top + 8,
                width: targetRect.width,
                height: thickness,
                backgroundColor: color,
            };
        } else if (position === 'bottom') {
            styles = {
                ...styles,
                left: targetRect.left,
                // top: targetRect.bottom + 8 - thickness,
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
    };

    const styles = getIndicatorStyles();

    return <div className="drop-indicator" style={styles} />;
};

export default DropIndicator; 