import { Element, GridStructure, Layout, GridCell } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Recalculates positions of elements in a grid when dragging one element to another position
 */
export const recalcPositions = ({
  draggedElement,
  targetElement,
  currentLayout,
  gridStructure,
  position
}: {
  draggedElement: Element,
  targetElement: Element,
  currentLayout: Layout,
  gridStructure: GridStructure,
  position: 'left' | 'right'
}): {
  updatedGridStructure: GridStructure,
  updatedElements: Element[]
} | null => {
  const sourceCellId = draggedElement.cellId;
  const targetCellId = targetElement.cellId;

  if (!sourceCellId || !targetCellId) return null;

  const sourceCell = gridStructure.rows[0].cells.find((cell) => cell.id === sourceCellId);
  const targetCell = gridStructure.rows[0].cells.find((cell) => cell.id === targetCellId);

  if (!sourceCell || !targetCell) return null;

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
  const newCell = {
    id: newCellId,
    row: targetCell.row,
    rowSpan: sourceCell.rowSpan || 1,
    colSpan: sourceCell.colSpan || 1,
    gridArea: `area-${newCellId}`,
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
  let updatedColumnWidths = [...gridStructure.columnWidths];
  
  // If the number of cells has changed, adjust column widths
  if (updatedColumnWidths.length !== updatedCells.length) {
    // Create new column widths with equal distribution
    const equalWidth = Math.floor(100 / updatedCells.length);
    updatedColumnWidths = Array(updatedCells.length - 1).fill(`${equalWidth}%`);
    
    // Last column gets the remainder to ensure total is 100%
    const lastWidth = 100 - (equalWidth * (updatedCells.length - 1));
    updatedColumnWidths.push(`${lastWidth}%`);
  }

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
}; 