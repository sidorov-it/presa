import { Position } from '@/types/DragDropTypes';

// Helper types for drop target calculation
type ElementInfo = {
    node: HTMLElement;
    rect: DOMRect;
    id: string;
};

// Helper for calculating the best drop indicator position
export const calculateDropPosition = (
    e: React.DragEvent,
    nodes: {
        elementNode?: HTMLElement | null;
        cellNode?: HTMLElement | null;
        layoutNode?: HTMLElement | null;
        slideNode?: HTMLElement | null;
    },
    layoutType: {
        isSingleCellSingleElement?: boolean;
        isMultiCellRow?: boolean;
    } = {},
    findClosestElementsFn?: (
        cellNode: HTMLElement,
        mouseX: number,
        mouseY: number
    ) => {
        element: ElementInfo | null;
        position: Position;
        gapSize: number;
    } | null
): {
    targetType: 'element' | 'cell' | 'layout' | 'slide' | null;
    targetId: string | null;
    position: Position | null;
} => {
    const { elementNode, cellNode, layoutNode, slideNode } = nodes;
    const { isSingleCellSingleElement, isMultiCellRow } = layoutType;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Define thresholds for boundary detection
    const LAYOUT_BOUNDARY_THRESHOLD = 0.15; // 15% of height for top/bottom layout boundaries
    const HORIZONTAL_THRESHOLD = 0.2; // 20% of width for left/right cell boundaries
    const ELEMENT_EDGE_THRESHOLD = 0.25; // 25% for top/bottom element boundaries

    // OPTION 1: Layout boundaries take priority
    if (layoutNode) {
        const layoutRect = layoutNode.getBoundingClientRect();
        const layoutTopThreshold = layoutRect.top + layoutRect.height * LAYOUT_BOUNDARY_THRESHOLD;
        const layoutBottomThreshold = layoutRect.bottom - layoutRect.height * LAYOUT_BOUNDARY_THRESHOLD;

        // If near layout boundaries, prioritize layout-level indicators
        if (mouseY < layoutTopThreshold) {
            return {
                targetType: 'layout',
                targetId: layoutNode.getAttribute('data-layout-id'),
                position: 'top',
            };
        }

        if (mouseY > layoutBottomThreshold) {
            return {
                targetType: 'layout',
                targetId: layoutNode.getAttribute('data-layout-id'),
                position: 'bottom',
            };
        }
    }

    // OPTION 2: Cell boundaries take priority in multi-cell layouts
    if (isMultiCellRow && cellNode) {
        const cellRect = cellNode.getBoundingClientRect();
        const cellLeftThreshold = cellRect.left + cellRect.width * HORIZONTAL_THRESHOLD;
        const cellRightThreshold = cellRect.right - cellRect.width * HORIZONTAL_THRESHOLD;

        if (mouseX < cellLeftThreshold) {
            return {
                targetType: 'cell',
                targetId: cellNode.getAttribute('data-cell-id'),
                position: 'left',
            };
        }

        if (mouseX > cellRightThreshold) {
            return {
                targetType: 'cell',
                targetId: cellNode.getAttribute('data-cell-id'),
                position: 'right',
            };
        }
    }

    // Check for empty space handling - when we're in a cell but not directly over an element
    if (cellNode && !elementNode && findClosestElementsFn) {
        const closestResult = findClosestElementsFn(cellNode, mouseX, mouseY);
        if (closestResult) {
            if (closestResult.element) {
                return {
                    targetType: 'element',
                    targetId: closestResult.element.id,
                    position: closestResult.position,
                };
            } else {
                // If element not found, return null as targetType
                return {
                    targetType: null,
                    targetId: null,
                    position: null,
                };
            }
        }
    }

    // OPTION 3: Element-level positioning
    if (elementNode) {
        const elementRect = elementNode.getBoundingClientRect();
        const elementTopThreshold = elementRect.top + elementRect.height * ELEMENT_EDGE_THRESHOLD;
        const elementBottomThreshold = elementRect.bottom - elementRect.height * ELEMENT_EDGE_THRESHOLD;

        // Check for empty space handling in cell with multiple elements
        if (cellNode) {
            // Get all elements in the cell to check for gaps
            const allElements = Array.from(cellNode.querySelectorAll('[data-element-id]'));
            if (allElements.length > 1) {
                // Get the element's position in the cell
                const elements = allElements.map(el => ({
                    node: el as HTMLElement,
                    rect: el.getBoundingClientRect(),
                    id: el.getAttribute('data-element-id'),
                }));

                // Sort elements by vertical position
                elements.sort((a, b) => a.rect.top - b.rect.top);

                // Find current element index and check for gaps
                const currentIndex = elements.findIndex(el => el.id === elementNode.getAttribute('data-element-id'));

                if (currentIndex > 0 && currentIndex < elements.length - 1) {
                    // Check if we're in gap between elements
                    const prevElement = elements[currentIndex - 1];
                    const currentElement = elements[currentIndex];
                    const nextElement = elements[currentIndex + 1];

                    // Calculate gaps
                    const gapAbove = currentElement.rect.top - prevElement.rect.bottom;
                    const gapBelow = nextElement.rect.top - currentElement.rect.bottom;

                    // If significant gap exists and mouse is in the gap
                    if (gapAbove > 10 && mouseY < elementTopThreshold) {
                        return {
                            targetType: 'element',
                            targetId: elementNode.getAttribute('data-element-id'),
                            position: 'top',
                        };
                    }

                    if (gapBelow > 10 && mouseY > elementBottomThreshold) {
                        return {
                            targetType: 'element',
                            targetId: elementNode.getAttribute('data-element-id'),
                            position: 'bottom',
                        };
                    }
                }
            }
        }

        // Element boundary detection (top, bottom, left, right)
        // Calculate distances to each edge
        const distanceToTop = Math.abs(mouseY - elementRect.top);
        const distanceToBottom = Math.abs(mouseY - elementRect.bottom);
        const distanceToLeft = Math.abs(mouseX - elementRect.left);
        const distanceToRight = Math.abs(mouseX - elementRect.right);

        // Find the closest edge
        const minHorizontal = Math.min(distanceToLeft, distanceToRight);

        const thirdOfWidth = elementRect.width / 3;

        // Determine if we should use horizontal or vertical positioning
        // For single cell layouts, enable all sides
        if (isSingleCellSingleElement) {
            if (minHorizontal < thirdOfWidth) {
                // Horizontal positioning takes precedence
                if (distanceToLeft < distanceToRight) {
                    return {
                        targetType: 'cell',
                        targetId: cellNode!.getAttribute('data-cell-id'),
                        position: 'left',
                    };
                } else {
                    return {
                        targetType: 'cell',
                        targetId: cellNode!.getAttribute('data-cell-id'),
                        position: 'right',
                    };
                }
            } else {
                const parentLayoutNode = elementNode.closest('[data-layout-id]');

                const layoutRect = parentLayoutNode!.getBoundingClientRect();
                const layoutTopThreshold = layoutRect.top + layoutRect.height;
                const layoutBottomThreshold = layoutRect.bottom - layoutRect.height;

                // If near layout boundaries, prioritize layout-level indicators
                if (mouseY < layoutTopThreshold) {
                    return {
                        targetType: 'layout',
                        targetId: parentLayoutNode!.getAttribute('data-layout-id'),
                        position: 'top',
                    };
                }

                if (mouseY > layoutBottomThreshold) {
                    return {
                        targetType: 'layout',
                        targetId: parentLayoutNode!.getAttribute('data-layout-id'),
                        position: 'bottom',
                    };
                }
            }
        } else {
            // Vertical positioning
            if (distanceToTop < distanceToBottom) {
                return {
                    targetType: 'element',
                    targetId: elementNode.getAttribute('data-element-id'),
                    position: 'top',
                };
            } else {
                return {
                    targetType: 'element',
                    targetId: elementNode.getAttribute('data-element-id'),
                    position: 'bottom',
                };
            }
        }
    }

    // Handle slide-level drop
    if (slideNode) {
        const slideRect = slideNode.getBoundingClientRect();
        // Determine if we're in the top or bottom half of the slide
        const slidePosition = mouseY < slideRect.top + slideRect.height / 2 ? 'top' : 'bottom';

        return {
            targetType: 'slide',
            targetId: slideNode.getAttribute('data-slide-id'),
            position: slidePosition,
        };
    }

    // If we're dragging not a slide and we're over "empty space" of a slide (no elements/cells/layouts)
    if (slideNode && !elementNode && !cellNode && !layoutNode) {
        // We're over a slide but not over elements - this could be empty slide space
        return {
            targetType: 'slide',
            targetId: slideNode.getAttribute('data-slide-id'),
            position: null,
        };
    }

    return { targetType: null, targetId: null, position: null };
};
