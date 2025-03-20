import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';
import { Element, GridStructure, Layout, GridCell } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const moveElement = (arr: any[], oldIndex: number, newIndex: number): any[] | null => {
    // Проверка на допустимость индексов
    if (oldIndex < 0 || oldIndex >= arr.length || newIndex < 0 || newIndex >= arr.length) {
        return null; // Возвращаем null, если индексы вне диапазона
    }

    // Сохраняем элемент, который нужно переместить
    const [element] = arr.splice(oldIndex, 1); // Удаляем элемент из старой позиции
    arr.splice(newIndex, 0, element); // Вставляем элемент в новую позицию

    return arr; // Возвращаем измененный массив
};

/**
 * Recalculates positions of elements in a grid when dragging one element to another position
 */
export const recalcPositions = ({
    draggedElement,
    targetElement,
    currentLayout,
    targetLayout,
    gridStructure,
    position,
    isMoveInCurrentLayout = false
}: {
    draggedElement: Element,
    targetElement: Element,
    currentLayout: Layout,
    targetLayout: Layout,
    gridStructure: GridStructure,
    position: 'left' | 'right',
    isMoveInCurrentLayout?: boolean
}): {
    updatedGridStructure: GridStructure,
    updatedElements: Element[],
    updatedCurrentElements?: Element[],
} | null => {

    // Check if we're moving an element to a different cell in the same layout
    if (isMoveInCurrentLayout && draggedElement.cellId === targetElement.cellId) {
        // Moving within the same cell - just reorder elements
        return handleMoveWithinSameCell({
            draggedElement,
            targetElement,
            currentLayout,
            position
        });
    } else if (isMoveInCurrentLayout) {
        // Moving between cells in the same layout
        return recalcPositionsInCurrentLayout({
            draggedElement,
            targetElement,
            currentLayout,
            gridStructure,
            position
        });
    } else {
        // Moving between different layouts
        return recalcPositionsBetweenLayouts({
            draggedElement,
            targetElement,
            currentLayout,
            gridStructure,
            targetLayout,
            position,
        });
    }
};

/**
 * Handle moving an element within the same cell (reordering)
 */
const handleMoveWithinSameCell = ({
    draggedElement,
    targetElement,
    currentLayout,
    position
}: {
    draggedElement: Element,
    targetElement: Element,
    currentLayout: Layout,
    position: 'left' | 'right' | 'top' | 'bottom'
}): {
    updatedGridStructure: GridStructure,
    updatedElements: Element[],
} | null => {
    // Get all elements in the cell
    const cellElements = currentLayout.elements.filter(e => e.cellId === draggedElement.cellId);
    
    // Find indices of dragged and target elements
    const draggedIndex = cellElements.findIndex(e => e.id === draggedElement.id);
    const targetIndex = cellElements.findIndex(e => e.id === targetElement.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return null;
    
    // Determine new position based on drop position
    let newIndex;
    if (position === 'top' || position === 'left') {
        newIndex = targetIndex;
    } else { // bottom or right
        newIndex = targetIndex + 1;
    }
    
    // If dragging to a position after current position, adjust for the removal
    if (newIndex > draggedIndex) {
        newIndex--;
    }
    
    // Create a copy of the cell elements and reorder
    const reorderedCellElements = [...cellElements];
    const [movedElement] = reorderedCellElements.splice(draggedIndex, 1);
    reorderedCellElements.splice(newIndex, 0, movedElement);
    
    // Create updated elements array with reordered elements
    const updatedElements = [...currentLayout.elements];
    for (let i = 0; i < updatedElements.length; i++) {
        if (updatedElements[i].cellId === draggedElement.cellId) {
            // Replace with reordered elements
            const startIndex = updatedElements.findIndex(e => e.cellId === draggedElement.cellId);
            updatedElements.splice(startIndex, cellElements.length, ...reorderedCellElements);
            break;
        }
    }
    
    return {
        updatedGridStructure: currentLayout.gridStructure,
        updatedElements
    };
};

const recalcPositionsInCurrentLayout = ({
    draggedElement,
    targetElement,
    currentLayout,
    gridStructure,
    position,
}: {
    draggedElement: Element,
    targetElement: Element,
    currentLayout: Layout,
    gridStructure: GridStructure,
    position: 'left' | 'right',
}): {
    updatedGridStructure: GridStructure,
    updatedElements: Element[],
    updatedCurrentElements?: Element[],
} | null => {
    const sourceCellId = draggedElement.cellId;
    const targetCellId = targetElement.cellId;

    if (!sourceCellId || !targetCellId) return null;

    const sourceCell = gridStructure.rows[0].cells.find((cell) => cell.id === sourceCellId);
    const targetCell = gridStructure.rows[0].cells.find((cell) => cell.id === targetCellId);

    if (!sourceCell || !targetCell) return null;

    // If we're moving an element between cells in the same row
    if (position === 'left' || position === 'right') {
        // Create a copy of the elements array
        const updatedElements = [...currentLayout.elements];
        
        // Find the dragged element index
        const draggedElementIndex = updatedElements.findIndex(e => e.id === draggedElement.id);
        
        if (draggedElementIndex === -1) return null;
        
        // Update the cellId of the dragged element to the target cell
        updatedElements[draggedElementIndex] = {
            ...updatedElements[draggedElementIndex],
            cellId: targetCellId
        };
        
        return {
            updatedGridStructure: gridStructure,
            updatedElements
        };
    }
    
    // If we need to create a new cell (original behavior)
    const sourceColumn = sourceCell.column;
    const targetColumn = targetCell.column;

    if (sourceColumn === targetColumn) {
        return null;
    }

    // Create a new cell ID for the dragged element
    const newCellId = uuidv4();

    // Create a deep copy of the cells array without the source cell
    const updatedCells = JSON.parse(JSON.stringify(
        gridStructure.rows[0].cells.filter(cell => cell.id !== sourceCellId)
    ));

    // Create the new cell for the dragged element
    const newCell: GridCell = {
        id: newCellId,
        row: targetCell.row,
        // rowSpan: sourceCell.rowSpan || 1,
        // colSpan: sourceCell.colSpan || 1,
        column: 0 // Will be set correctly later
    };

    // Find the target cell index in the updated cells array
    const targetIndex = updatedCells.findIndex((cell: GridCell) => cell.id === targetCellId);

    // Insert the new cell at the appropriate position
    if (position === 'left') {
        // Insert before the target cell
        updatedCells.splice(targetIndex, 0, newCell);
    } else { // position === 'right'
        // Insert after the target cell
        updatedCells.splice(targetIndex + 1, 0, newCell);
    }

    // Update column numbers for all cells to ensure they are sequential
    updatedCells.forEach((cell: GridCell, index: number) => {
        cell.column = index + 1;
    });

    // Update the element to reference the new cell
    const updatedElements = currentLayout.elements.map(element => {
        if (element.id === draggedElement.id) {
            return {
                ...element,
                cellId: newCellId
            };
        }
        return element;
    });

    // Handle column widths
    const updatedColumnWidths = [...gridStructure.columnWidths];

    moveElement(updatedColumnWidths, sourceCell.column - 1, targetCell.column - 1);

    // Create the updated grid structure
    const updatedGridStructure = {
        ...gridStructure,
        columns: updatedCells.length,
        columnWidths: updatedColumnWidths,
        rows: [{
            ...gridStructure.rows[0],
            cells: updatedCells
        }]
    };

    return {
        updatedGridStructure,
        updatedElements
    };
}

const recalcPositionsBetweenLayouts = ({
    draggedElement,
    targetElement,
    currentLayout,
    gridStructure,
    targetLayout,
    position,
}: {
    draggedElement: Element,
    targetElement: Element,
    currentLayout: Layout,
    gridStructure: GridStructure,
    targetLayout: Layout,
    position: 'left' | 'right',
    isMoveInCurrentLayout?: boolean
}): {
    updatedGridStructure: GridStructure,
    updatedElements: Element[],
    updatedCurrentElements?: Element[],
} | null => {

    // Moving between layouts - existing code for cross-layout dragging
    // Calculate the new number of columns
    const newColumnCount = gridStructure.columns + 1;

    // Find the target cell in the original grid structure
    const targetCellInOriginal = gridStructure.rows[0].cells.find((cell: any) =>
        targetElement.cellId === cell.id
    );

    if (!targetCellInOriginal) {
        // Try to find by gridArea match
        const targetCellByGridArea = gridStructure.rows[0].cells.find((cell: any) =>
            cell.id === targetElement.cellId
        );

        if (!targetCellByGridArea) {
            return null; // Can't find the target cell
        }
    }

    // Create a new grid structure with an additional column
    const updatedGridStructure = {
        ...gridStructure,
        columns: newColumnCount,
        rows: gridStructure.rows.map((row: any) => {
            // Find the cell containing the target element
            const targetCellIndex = row.cells.findIndex((cell: any) =>
                cell.id === targetElement.cellId
            );

            if (targetCellIndex === -1) return row;

            // Create a new cell for the dragged element
            const newCellId = uuidv4();
            const newCell: GridCell = {
                id: newCellId,
                row: row.cells[targetCellIndex].row,
                column: position === 'left' ?
                    row.cells[targetCellIndex].column :
                    row.cells[targetCellIndex].column + 1,
                // rowSpan: draggedElement.cellId ?
                //     gridStructure.rows[0].cells.find(c => c.id === draggedElement.cellId)?.rowSpan || 1 : 1,
                // colSpan: draggedElement.cellId ?
                //     gridStructure.rows[0].cells.find(c => c.id === draggedElement.cellId)?.colSpan || 1 : 1,
            };

            // Create a deep copy of the cells array
            const updatedCells = JSON.parse(JSON.stringify(row.cells));

            // If inserting to the left, increment column numbers for all cells at or after the target
            if (position === 'left') {
                updatedCells.forEach((cell: any) => {
                    if (cell.column >= newCell.column) {
                        cell.column += 1;
                    }
                });

                // Insert the new cell
                updatedCells.splice(targetCellIndex, 0, newCell);
            }
            // If inserting to the right, increment column numbers for all cells after the target
            else {
                updatedCells.forEach((cell: any) => {
                    if (cell.column > row.cells[targetCellIndex].column) {
                        cell.column += 1;
                    }
                });

                // Insert the new cell
                updatedCells.splice(targetCellIndex + 1, 0, newCell);
            }

            // Ensure column numbers are sequential and respect colSpan
            let currentColumn = 1;
            updatedCells.sort((a: any, b: any) => a.column - b.column)
                .forEach((cell: any) => {
                    cell.column = currentColumn;
                    currentColumn += 1;
                });

            return {
                ...row,
                cells: updatedCells
            };
        })
    };

    // Create a copy of the dragged element with a new ID
    const newElementId = uuidv4();

    // Find the new cell we just created
    let newCellId;

    // Get the index of the target cell in the updated structure
    const targetCellIndex = updatedGridStructure.rows[0].cells.findIndex((cell: any) =>
        cell.id === targetElement.cellId
    );

    if (targetCellIndex !== -1) {
        // For left position, get the cell before the target cell
        // For right position, get the cell after the target cell
        const newCellIndex = position === 'left' ? targetCellIndex - 1 : targetCellIndex + 1;

        // Make sure the index is valid
        if (newCellIndex >= 0 && newCellIndex < updatedGridStructure.rows[0].cells.length) {
            newCellId = updatedGridStructure.rows[0].cells[newCellIndex].id;
        }
    }

    const newElement = {
        ...draggedElement,
        id: newElementId,
        cellId: newCellId,
    };

    // Add the new element to the target layout
    const updatedElements = [...targetLayout.elements, newElement];
    // Remove the dragged element from its original layout if it's a different layout
    if (currentLayout.id !== targetLayout.id) {
        const updatedCurrentElements = currentLayout.elements.filter((e: any) => e.id !== draggedElement.id);

        if (updatedCurrentElements.length === 0) {
            return {
                updatedGridStructure: {
                    ...updatedGridStructure,
                    columnWidths: getColumnWidths(newColumnCount)
                },
                updatedElements,
                updatedCurrentElements,
            }
        } else {
            return {
                updatedGridStructure: {
                    ...updatedGridStructure,
                    columnWidths: getColumnWidths(newColumnCount)
                },
                updatedElements,
                updatedCurrentElements,
            }
        }
    } else {
        return {
            updatedGridStructure: {
                ...updatedGridStructure,
                columnWidths: getColumnWidths(newColumnCount)
            },
            updatedElements,
        }
    }

}