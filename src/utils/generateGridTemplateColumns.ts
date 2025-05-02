import { GridStructure } from '@/types';

// Функция для генерации CSS Grid Template Columns из структуры сетки
const generateGridTemplateColumns = (gridStructure: GridStructure): string => {
    // Use columnWidths if available, otherwise generate equal percentage columns
    if (gridStructure.columnWidths && gridStructure.columnWidths.length > 0) {
        // Convert any fr units to percentages
        const convertedWidths = gridStructure.columnWidths.map(width => {
            if (width.endsWith('fr')) {
                // Convert fr to equal percentage
                return `${100 / gridStructure.columns}%`;
            }
            return width;
        });
        return convertedWidths.join(' ');
    }
    // Default to equal percentage columns
    return Array(gridStructure.columns)
        .fill(`${100 / gridStructure.columns}%`)
        .join(' ');
};

export default generateGridTemplateColumns;
