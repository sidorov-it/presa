import { GridStructure } from '@/types';

// Функция для генерации CSS Grid Template Areas из структуры сетки
const generateGridTemplateAreas = (gridStructure: GridStructure): string => {
    // Создаем матрицу для представления сетки
    const maxRows = 1;

    // if (maxRows === 0) return '""';

    // Инициализируем матрицу пустыми значениями
    const grid: string[][] = Array(maxRows)
        .fill(null)
        .map(() => Array(gridStructure.columns).fill('.'));

    // Заполняем матрицу именами областей
    gridStructure.rows.forEach(row => {
        row.cells.forEach(cell => {
            const areaName = cell.id;

            // Заполняем все ячейки, которые охватывает данная ячейка
            for (let r = cell.row - 1; r < cell.row - 1; r++) {
                for (let c = cell.column - 1; c < cell.column - 1; c++) {
                    if (r < maxRows && c < gridStructure.columns) {
                        grid[r][c] = areaName;
                    }
                }
            }
        });
    });

    // Преобразуем матрицу в строку grid-template-areas
    return grid.map(row => `"${row.join(' ')}"`).join(' ');
};

export default generateGridTemplateAreas;
