import { recalcPositions } from './grid-utils';
import { Element, GridStructure, Layout } from '@/types';

// Mock uuid to return predictable values for testing
jest.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

describe('recalcPositions', () => {
  // Test case 1: Moving from right to left with position 'left'
  test('should correctly move an element from right to left with position "left"', () => {
    // Setup test data
    const draggedElement = {
      id: 'element1',
      cellId: 'cell2',
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell1',
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'two-columns',
      elements: [
        { ...targetElement },
        { ...draggedElement }
      ]
    } as Layout;

    const gridStructure = {
      columns: 2,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' }
          ]
        }
      ],
      columnWidths: ['50%', '50%']
    } as GridStructure;

    // Call the function
    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    // Assertions
    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(1);
      
      // Check that the original target cell was moved to column 2
      const targetCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'cell1');
      expect(targetCell).toBeDefined();
      expect(targetCell?.column).toBe(2);
      
      // Check that column widths were swapped
      expect(result.updatedGridStructure.columnWidths).toEqual(['50%', '50%']);
    }
  });

  // Test case 2: Moving from right to left with position 'right'
  test('should correctly move an element from right to left with position "right"', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell3',
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell1',
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'three-columns',
      elements: [
        { id: 'element2', cellId: 'cell1', type: 'editor', content: 'Target content' },
        { id: 'element3', cellId: 'cell2', type: 'editor', content: 'Middle content' },
        { id: 'element1', cellId: 'cell3', type: 'editor', content: 'Test content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 3,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' }
          ]
        }
      ],
      columnWidths: ['33%', '34%', '33%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'right'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position (column 2)
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(2);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.id)).toEqual(['cell1', 'test-uuid', 'cell2']);
      expect(cells.map(c => c.column)).toEqual([1, 2, 3]);
      
      // Check that column widths were swapped
      expect(result.updatedGridStructure.columnWidths).toEqual(['33%', '34%', '33%']);
    }
  });

  // Test case 3: Moving from left to right with position 'left'
  test('should correctly move an element from left to right with position "left"', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell3',
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'three-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'Test content' },
        { id: 'element3', cellId: 'cell2', type: 'editor', content: 'Middle content' },
        { id: 'element2', cellId: 'cell3', type: 'editor', content: 'Target content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 3,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' }
          ]
        }
      ],
      columnWidths: ['33%', '34%', '33%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position (column 2)
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(2);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.id)).toEqual(['cell2', 'test-uuid', 'cell3']);
      expect(cells.map(c => c.column)).toEqual([1, 2, 3]);
      
      // Check that column widths were swapped
      expect(result.updatedGridStructure.columnWidths).toEqual(['33%', '34%', '33%']);
    }
  });

  // Test case 4: Moving from left to right with position 'right'
  test('should correctly move an element from left to right with position "right"', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell3',
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'three-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'Test content' },
        { id: 'element3', cellId: 'cell2', type: 'editor', content: 'Middle content' },
        { id: 'element2', cellId: 'cell3', type: 'editor', content: 'Target content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 3,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' }
          ]
        }
      ],
      columnWidths: ['33%', '34%', '33%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'right'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position (column 3)
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(3);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.id)).toEqual(['cell2', 'cell3', 'test-uuid']);
      expect(cells.map(c => c.column)).toEqual([1, 2, 3]);
      
      // Check that column widths were swapped
      expect(result.updatedGridStructure.columnWidths).toEqual(['33%', '34%', '33%']);
    }
  });

  // Test case 5: Return null when source and target columns are the same
  test('should return null when source and target columns are the same', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell1', // Same cell ID
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'single-column',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'Test content' },
        { id: 'element2', cellId: 'cell1', type: 'editor', content: 'Target content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 1,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' }
          ]
        }
      ],
      columnWidths: ['100%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).toBeNull();
  });

  // Test case 6: Return null when cell IDs are missing
  test('should return null when cell IDs are missing', () => {
    const draggedElement = {
      id: 'element1',
      // cellId is missing
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell1',
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'two-columns',
      elements: [
        { id: 'element1', type: 'editor', content: 'Test content' },
        { id: 'element2', cellId: 'cell1', type: 'editor', content: 'Target content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 2,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' }
          ]
        }
      ],
      columnWidths: ['50%', '50%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).toBeNull();
  });

  // Test case 7: Return null when cells are not found in grid structure
  test('should return null when cells are not found in grid structure', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'nonexistent-cell',
      type: 'editor',
      content: 'Test content'
    } as Element;

    const targetElement = {
      id: 'element2',
      cellId: 'cell1',
      type: 'editor',
      content: 'Target content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'two-columns',
      elements: [
        { id: 'element1', cellId: 'nonexistent-cell', type: 'editor', content: 'Test content' },
        { id: 'element2', cellId: 'cell1', type: 'editor', content: 'Target content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 2,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' }
          ]
        }
      ],
      columnWidths: ['50%', '50%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).toBeNull();
  });

  // Test case 8: Moving to the first column
  test('should correctly move an element to the first column', () => {
    const draggedElement = {
      id: 'element3',
      cellId: 'cell3',
      type: 'editor',
      content: 'Dragged content'
    } as Element;

    const targetElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'First column content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'three-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'First column content' },
        { id: 'element2', cellId: 'cell2', type: 'editor', content: 'Middle content' },
        { id: 'element3', cellId: 'cell3', type: 'editor', content: 'Dragged content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 3,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' }
          ]
        }
      ],
      columnWidths: ['30%', '40%', '30%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element3')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position (column 1)
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(1);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.column)).toEqual([1, 2, 3]);
      
      // Check that we have the right number of cells
      expect(cells.length).toBe(3);
    }
  });

  // Test case 9: Moving to the last column
  test('should correctly move an element to the last column', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'Dragged content'
    } as Element;

    const targetElement = {
      id: 'element3',
      cellId: 'cell3',
      type: 'editor',
      content: 'Last column content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'three-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'Dragged content' },
        { id: 'element2', cellId: 'cell2', type: 'editor', content: 'Middle content' },
        { id: 'element3', cellId: 'cell3', type: 'editor', content: 'Last column content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 3,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' }
          ]
        }
      ],
      columnWidths: ['30%', '40%', '30%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'right'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position (column 3)
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(3);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.column)).toEqual([1, 2, 3]);
      
      // Check that we have the right number of cells
      expect(cells.length).toBe(3);
    }
  });

  // Test case 10: Moving between the first and last columns
  test('should correctly move an element from first to last column', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'First column content'
    } as Element;

    const targetElement = {
      id: 'element4',
      cellId: 'cell4',
      type: 'editor',
      content: 'Last column content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'four-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'First column content' },
        { id: 'element2', cellId: 'cell2', type: 'editor', content: 'Second column content' },
        { id: 'element3', cellId: 'cell3', type: 'editor', content: 'Third column content' },
        { id: 'element4', cellId: 'cell4', type: 'editor', content: 'Last column content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 4,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' },
            { id: 'cell4', row: 1, column: 4, rowSpan: 1, colSpan: 1, gridArea: 'area-cell4' }
          ]
        }
      ],
      columnWidths: ['25%', '25%', '25%', '25%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'right'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(4);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.column)).toEqual([1, 2, 3, 4]);
      
      // Check that we have the right number of cells
      expect(cells.length).toBe(4);
    }
  });

  // Test case 11: Grid structures with varying column widths
  test('should correctly handle non-uniform column widths', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'First column content'
    } as Element;

    const targetElement = {
      id: 'element3',
      cellId: 'cell3',
      type: 'editor',
      content: 'Third column content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'three-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'First column content' },
        { id: 'element2', cellId: 'cell2', type: 'editor', content: 'Second column content' },
        { id: 'element3', cellId: 'cell3', type: 'editor', content: 'Third column content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 3,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' }
          ]
        }
      ],
      columnWidths: ['20%', '60%', '20%'] // Non-uniform column widths
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(2);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.id)).toEqual(['cell2', 'test-uuid', 'cell3']);
      expect(cells.map(c => c.column)).toEqual([1, 2, 3]);
      
      // Check that column widths are preserved
      expect(result.updatedGridStructure.columnWidths).toEqual(['20%', '60%', '20%']);
    }
  });

  // Test case 12: Moving elements across multiple columns in a larger layout
  test('should correctly move an element across multiple columns in a 5-column layout', () => {
    const draggedElement = {
      id: 'element1',
      cellId: 'cell1',
      type: 'editor',
      content: 'First column content'
    } as Element;

    const targetElement = {
      id: 'element5',
      cellId: 'cell5',
      type: 'editor',
      content: 'Fifth column content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'five-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'First column content' },
        { id: 'element2', cellId: 'cell2', type: 'editor', content: 'Second column content' },
        { id: 'element3', cellId: 'cell3', type: 'editor', content: 'Third column content' },
        { id: 'element4', cellId: 'cell4', type: 'editor', content: 'Fourth column content' },
        { id: 'element5', cellId: 'cell5', type: 'editor', content: 'Fifth column content' }
      ]
    } as Layout;

    const gridStructure = {
      columns: 5,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' },
            { id: 'cell4', row: 1, column: 4, rowSpan: 1, colSpan: 1, gridArea: 'area-cell4' },
            { id: 'cell5', row: 1, column: 5, rowSpan: 1, colSpan: 1, gridArea: 'area-cell5' }
          ]
        }
      ],
      columnWidths: ['20%', '20%', '20%', '20%', '20%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'left'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element1')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(4);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.id)).toEqual(['cell2', 'cell3', 'cell4', 'test-uuid', 'cell5']);
      expect(cells.map(c => c.column)).toEqual([1, 2, 3, 4, 5]);
      
      // Check that we have the right number of cells
      expect(cells.length).toBe(5);
    }
  });

  // Test case 13: Testing with different grid structure configurations (6 columns)
  test('should correctly handle a 6-column grid structure', () => {
    const draggedElement = {
      id: 'element2',
      cellId: 'cell2',
      type: 'editor',
      content: 'Second column content'
    } as Element;

    const targetElement = {
      id: 'element5',
      cellId: 'cell5',
      type: 'editor',
      content: 'Fifth column content'
    } as Element;

    const currentLayout = {
      id: 'layout1',
      type: 'six-columns',
      elements: [
        { id: 'element1', cellId: 'cell1', type: 'editor', content: 'First column content' },
        { id: 'element2', cellId: 'cell2', type: 'editor', content: 'Second column content' },
        { id: 'element3', cellId: 'cell3', type: 'editor', content: 'Third column content' },
        { id: 'element4', cellId: 'cell4', type: 'editor', content: 'Fourth column content' },
        { id: 'element5', cellId: 'cell5', type: 'editor', content: 'Fifth column content' },
        { id: 'element6', cellId: 'cell6', type: 'editor', content: 'Sixth column content' }
      ],
      style: {},
      gridStructure: {} // Добавляем недостающие свойства для типа Layout
    } as Layout;

    const gridStructure = {
      columns: 6,
      rows: [
        {
          cells: [
            { id: 'cell1', row: 1, column: 1, rowSpan: 1, colSpan: 1, gridArea: 'area-cell1' },
            { id: 'cell2', row: 1, column: 2, rowSpan: 1, colSpan: 1, gridArea: 'area-cell2' },
            { id: 'cell3', row: 1, column: 3, rowSpan: 1, colSpan: 1, gridArea: 'area-cell3' },
            { id: 'cell4', row: 1, column: 4, rowSpan: 1, colSpan: 1, gridArea: 'area-cell4' },
            { id: 'cell5', row: 1, column: 5, rowSpan: 1, colSpan: 1, gridArea: 'area-cell5' },
            { id: 'cell6', row: 1, column: 6, rowSpan: 1, colSpan: 1, gridArea: 'area-cell6' }
          ]
        }
      ],
      columnWidths: ['16.66%', '16.66%', '16.67%', '16.67%', '16.67%', '16.67%']
    } as GridStructure;

    const result = recalcPositions({
      draggedElement,
      targetElement,
      currentLayout,
      gridStructure,
      position: 'right'
    });

    expect(result).not.toBeNull();
    if (result) {
      // Check that the dragged element's cell ID was updated
      expect(result.updatedElements.find(e => e.id === 'element2')?.cellId).toBe('test-uuid');
      
      // Check that the new cell was created at the correct position
      const newCell = result.updatedGridStructure.rows[0].cells.find(c => c.id === 'test-uuid');
      expect(newCell).toBeDefined();
      expect(newCell?.column).toBe(5);
      
      // Check that the cells were properly reordered
      const cells = result.updatedGridStructure.rows[0].cells;
      expect(cells.map(c => c.id)).toEqual(['cell1', 'cell3', 'cell4', 'cell5', 'test-uuid', 'cell6']);
      expect(cells.map(c => c.column)).toEqual([1, 2, 3, 4, 5, 6]);
      
      // Check that we have the right number of cells
      expect(cells.length).toBe(6);
    }
  });
}); 