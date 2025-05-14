import React, { useEffect, useState, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { useDndStore } from '@/store/dndStore';

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
    previousElementRect?: DOMRect | null;
    nextElementRect?: DOMRect | null;
};

type IndicatorType = 'element' | 'layout' | 'slide' | 'cell' | 'column' | 'row';

const DropIndicator = () => {
    const indicators = useDndStore(state => state.state.indicators);
    const dragState = useDndStore(state => state.state.dragState);
    const [visible, setVisible] = useState(false);

    const { findLayoutByElementId } = usePresentationStore();

    // Add animation when indicator appears/disappears
    useEffect(() => {
        if (
            dragState === 'dragging' &&
            (indicators.elementIndicator ||
                indicators.layoutIndicator ||
                indicators.slideIndicator ||
                indicators.cellIndicator ||
                indicators.tableColumnIndicator ||
                indicators.tableColumnIndicator === 0 ||
                indicators.tableRowIndicator ||
                indicators.tableRowIndicator === 0)
        ) {
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

            // Find previous and next elements for enhanced spacing
            let previousElementRect = null;
            let nextElementRect = null;

            if (position === 'top' || position === 'bottom') {
                // Get all elements in the same cell
                const allElements = Array.from(cell.querySelectorAll('[data-element-id]')).map(el => ({
                    id: el.getAttribute('data-element-id'),
                    rect: el.getBoundingClientRect(),
                }));

                // Sort by vertical position
                allElements.sort((a, b) => a.rect.top - b.rect.top);

                // Find current element index
                const currentIndex = allElements.findIndex(el => el.id === elementId);

                if (position === 'top' && currentIndex > 0) {
                    previousElementRect = allElements[currentIndex - 1].rect;
                }

                if (position === 'bottom' && currentIndex < allElements.length - 1) {
                    nextElementRect = allElements[currentIndex + 1].rect;
                }
            }

            // Case 1: 1 element by 1 element
            const isSingleElementLayout = element.closest('[data-is-single-element-layout="true"]') !== null;
            if (isSingleElementLayout) {
                return {
                    targetRect: rect,
                    position: position,
                    type: 'element' as IndicatorType,
                    sourceType,
                    previousElementRect,
                    nextElementRect,
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
                        sourceType,
                        previousElementRect,
                        nextElementRect,
                    };
                }

                // Case 2.2: left/right of element
                if (position === 'left' || position === 'right') {
                    return {
                        targetRect: rect,
                        position: position,
                        type: 'element' as IndicatorType,
                        sourceType,
                        previousElementRect,
                        nextElementRect,
                    };
                }

                // Case 2.3: left/right of row
                if (position === 'left' || position === 'right') {
                    return {
                        targetRect: cellRect,
                        position: position,
                        type: 'cell' as IndicatorType,
                        sourceType: 'cell',
                    };
                }

                // Case 2.4: top/bottom of row
                if (position === 'top' || position === 'bottom') {
                    return {
                        targetRect: cellRect,
                        position: position,
                        type: 'layout' as IndicatorType,
                        sourceType: 'layout',
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
                    sourceType: 'cell',
                };
            }

            // Case 3.2: top/bottom
            if (position === 'top' || position === 'bottom') {
                const allLayouts = Array.from(layout.parentElement?.querySelectorAll('[data-layout-id]') || []).map(
                    el => ({
                        id: el.getAttribute('data-layout-id'),
                        rect: el.getBoundingClientRect(),
                    })
                );

                // Sort by vertical position
                allLayouts.sort((a, b) => a.rect.top - b.rect.top);

                // Find current element index
                const currentIndex = allLayouts.findIndex(el => el.id === indicators.layoutIndicator);

                let previousElementRect = null;
                let nextElementRect = null;

                if (position === 'top' && currentIndex > 0) {
                    previousElementRect = allLayouts[currentIndex - 1].rect;
                }

                if (position === 'bottom' && currentIndex < allLayouts.length - 1) {
                    nextElementRect = allLayouts[currentIndex + 1].rect;
                }

                return {
                    targetRect: rect,
                    position: position,
                    type: 'layout' as IndicatorType,
                    sourceType: 'layout',
                    previousElementRect,
                    nextElementRect,
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
                    sourceType: 'cell',
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
                sourceType: 'column',
            };
        }

        // Add row indicator handling
        if (indicators.tableRowIndicator || indicators.tableRowIndicator === 0) {
            const layoutId = indicators.tableId;
            if (!layoutId) return null;

            const cellNode = document.querySelector(`[data-cell-id="${indicators.cellId}"]`);
            if (!cellNode) return null;

            const rowRect = cellNode.closest('[data-row-id]')?.getBoundingClientRect();
            const layoutRect = cellNode.closest('[data-layout-id]')?.getBoundingClientRect();

            if (!rowRect || !layoutRect) return null;

            const position = indicators.tableRowPosition;

            return {
                targetRect: {
                    left: layoutRect.left,
                    top: rowRect.top,
                    width: layoutRect.width,
                    height: rowRect.height,
                    right: layoutRect.right,
                    bottom: rowRect.bottom,
                },
                position: position,
                type: 'row' as IndicatorType,
                sourceType: 'row',
            };
        }

        // Handle slide indicators
        if (indicators.slideIndicator && indicators.slidePosition) {
            const slide = document.querySelector(`[data-slide-id="${indicators.slideIndicator}"]`);
            if (!slide) return null;

            const rect = slide.getBoundingClientRect();
            const position = indicators.slidePosition;

            // Find previous and next slides for enhanced spacing
            let previousElementRect = null;
            let nextElementRect = null;

            // Get all slides in the presentation
            const allSlides = Array.from(document.querySelectorAll('[data-slide-id]')).map(el => ({
                id: el.getAttribute('data-slide-id'),
                rect: el.getBoundingClientRect(),
            }));

            // Sort by vertical position
            allSlides.sort((a, b) => a.rect.top - b.rect.top);

            // Find current slide index
            const currentIndex = allSlides.findIndex(el => el.id === indicators.slideIndicator);

            if (position === 'top' && currentIndex > 0) {
                previousElementRect = allSlides[currentIndex - 1].rect;
            }

            if (position === 'bottom' && currentIndex < allSlides.length - 1) {
                nextElementRect = allSlides[currentIndex + 1].rect;
            }

            return {
                targetRect: rect,
                position: position,
                type: 'slide' as IndicatorType,
                sourceType: 'slide',
                previousElementRect,
                nextElementRect,
            };
        }

        return null;
    };

    const indicatorInfo = getIndicatorInfo();

    // Generate styles based on position and context
    const getIndicatorStyles = useCallback(() => {
        if (!indicatorInfo) return {};
        const { targetRect, position, type, previousElementRect, nextElementRect } = indicatorInfo;

        // For between-element indicators (enhanced spacing)
        if (type === 'element' && (position === 'top' || position === 'bottom')) {
            // Create a thicker indicator between elements
            const thickness = 7; // Increased thickness

            let styles: React.CSSProperties = {
                position: 'fixed',
                zIndex: 9999,
                pointerEvents: 'none',
                backgroundColor: '#3b82f6', // Blue color
                transition: 'all 150ms ease-in-out',
                boxShadow: '0 0 6px rgba(59, 130, 246, 0.6)', // Enhanced glow
                borderRadius: '3px',
            };

            if (position === 'top' && previousElementRect) {
                // Place indicator between previous and current element
                const gap = targetRect.top - previousElementRect.bottom;
                const midPoint = previousElementRect.bottom + gap / 2;

                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: midPoint - thickness / 2,
                    width: targetRect.width,
                    height: thickness,
                };
            } else if (position === 'bottom' && nextElementRect) {
                // Place indicator between current and next element
                const gap = nextElementRect.top - targetRect.bottom;
                const midPoint = targetRect.bottom + gap / 2;

                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: midPoint - thickness / 2,
                    width: targetRect.width,
                    height: thickness,
                };
            } else if (position === 'top') {
                // Default top position when no previous element
                if (!previousElementRect) {
                    styles = {
                        ...styles,
                        left: targetRect.left,
                        top: targetRect.top,
                        width: targetRect.width,
                        height: thickness,
                    };
                } else {
                    styles = {
                        ...styles,
                        left: targetRect.left,
                        top: targetRect.top + (targetRect.top - previousElementRect.bottom) / 2,
                        width: targetRect.width,
                        height: thickness,
                    };
                }
            } else if (position === 'bottom') {
                // Default bottom position when no next element
                if (!nextElementRect) {
                    styles = {
                        ...styles,
                        left: targetRect.left,
                        top: targetRect.bottom,
                        width: targetRect.width,
                        height: thickness,
                    };
                } else {
                    styles = {
                        ...styles,
                        left: targetRect.left,
                        top: targetRect.bottom + (nextElementRect.top - targetRect.bottom) / 2 - thickness / 2,
                        width: targetRect.width,
                        height: thickness,
                    };
                }
            }

            return styles;
        }

        // Increase thickness for better visibility
        let thickness;

        if (type === 'element') {
            thickness = 4; // Increased from 3
        } else {
            thickness = 5; // Increased from 4
        }

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
            cell: '#3b82f6', // red
            layout: '#3b82f6', // green
            slide: '#3b82f6', // purple
            column: '#4f46e5', // indigo - different color for column indicator
            row: '#4f46e5', // indigo - same color as column for consistency
        };

        const color = colors[type];

        if (position === 'left') {
            let left;
            if (type === 'cell') {
                left = targetRect.left - thickness / 2;
            } else {
                left = targetRect.left - 22;
            }

            styles = {
                ...styles,
                left,
                top: targetRect.top,
                width: thickness,
                height: targetRect.height,
                backgroundColor: color,
            };
        } else if (position === 'right') {
            let left;
            if (type === 'cell') {
                left = targetRect.right - thickness / 2;
            } else {
                left = targetRect.right + 10;
            }

            styles = {
                ...styles,
                left,
                top: targetRect.top,
                width: thickness,
                height: targetRect.height,
                backgroundColor: color,
            };
        } else if (position === 'top') {
            if (!previousElementRect) {
                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: targetRect.top - thickness,
                    width: targetRect.width,
                    height: thickness,
                    backgroundColor: color,
                };
            } else {
                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: targetRect.top - (targetRect.top - previousElementRect.bottom) / 2 - thickness / 2,
                    width: targetRect.width,
                    height: thickness,
                    backgroundColor: color,
                };
            }
        } else if (position === 'bottom') {
            if (!nextElementRect) {
                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: targetRect.bottom + thickness,
                    width: targetRect.width,
                    height: thickness,
                    backgroundColor: color,
                };
            } else {
                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: targetRect.bottom + (nextElementRect.top - targetRect.bottom) / 2 - thickness / 2,
                    width: targetRect.width,
                    height: thickness,
                    backgroundColor: color,
                };
            }
        } else if (type === 'slide') {
            // Special styling for slide indicators
            const thickness = 6; // Thicker line for slides

            if (position === 'top') {
                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: targetRect.top - thickness / 2,
                    width: targetRect.width,
                    height: thickness,
                    backgroundColor: color,
                    boxShadow: '0 0 6px rgba(59, 130, 246, 0.6)',
                    borderRadius: '3px',
                };
            } else if (position === 'bottom') {
                styles = {
                    ...styles,
                    left: targetRect.left,
                    top: targetRect.bottom - thickness / 2,
                    width: targetRect.width,
                    height: thickness,
                    backgroundColor: color,
                    boxShadow: '0 0 6px rgba(59, 130, 246, 0.6)',
                    borderRadius: '3px',
                };
            }

            // If we have info about neighboring slides, position the indicator in the gap
            if (position === 'top' && previousElementRect) {
                const gap = targetRect.top - previousElementRect.bottom;
                const midPoint = previousElementRect.bottom + gap / 2;

                styles = {
                    ...styles,
                    top: midPoint - thickness / 2,
                };
            } else if (position === 'bottom' && nextElementRect) {
                const gap = nextElementRect.top - targetRect.bottom;
                const midPoint = targetRect.bottom + gap / 2;

                styles = {
                    ...styles,
                    top: midPoint - thickness / 2,
                };
            }

            return styles;
        }

        return styles;
    }, [indicatorInfo]);

    if (!visible || !indicatorInfo) {
        return null;
    }

    const styles = getIndicatorStyles();

    return <div className="drop-indicator" style={styles} />;
};

export default DropIndicator;
