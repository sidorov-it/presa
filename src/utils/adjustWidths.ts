
const adjustWidths = (
    columnWidths: string[],
    currentColumnIndex: number,
    newWidthPart: number,
    isLast: boolean,
    totalColumns: number
): string[] => {
    const newColumnWidths = [...columnWidths];

    const percentValues = columnWidths.map(width => {
        const match = width.match(/^([\d.]+)%$/);
        const frMatch = width.match(/^([\d.]+)fr$/);
        if (match) {
            return parseFloat(match[1]);
        } else if (frMatch) {
            return 100 / totalColumns;
        } else {
            return 100 / totalColumns;
        }
    });

    const newWidthPercentage = Math.max(15, Math.min(85, newWidthPart * 100));

    const difference = percentValues[currentColumnIndex] - newWidthPercentage;

    if (Math.abs(difference) < 0.01) {
        return columnWidths;
    }

    newColumnWidths[currentColumnIndex] = `${newWidthPercentage.toFixed(2)}%`;

    let neighborIndex: number;

    if (!isLast && currentColumnIndex < totalColumns - 1) {
        neighborIndex = currentColumnIndex + 1;
    } else if (currentColumnIndex > 0) {
        neighborIndex = currentColumnIndex - 1;
    } else {
        return newColumnWidths;
    }

    let neighborNewWidth = percentValues[neighborIndex] + difference;

    if (neighborNewWidth < 15) {
        neighborNewWidth = 15;

        const totalOtherCellsWidth = percentValues.reduce((sum, width, index) => {
            if (index !== currentColumnIndex && index !== neighborIndex) {
                return sum + width;
            }
            return sum;
        }, 0);

        const maxCurrentCellWidth = 100 - totalOtherCellsWidth - 15;
        newColumnWidths[currentColumnIndex] = `${Math.min(newWidthPercentage, maxCurrentCellWidth).toFixed(2)}%`;
    } else {
        newColumnWidths[neighborIndex] = `${neighborNewWidth.toFixed(2)}%`;
    }

    const totalPercentage = newColumnWidths.reduce((sum, width) => {
        const match = width.match(/^([\d.]+)%$/);
        return sum + (match ? parseFloat(match[1]) : 0);
    }, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
        const currentNeighborWidth = parseFloat(newColumnWidths[neighborIndex]);
        const adjustment = 100 - totalPercentage;
        const adjustedNeighborWidth = Math.max(15, currentNeighborWidth + adjustment);
        newColumnWidths[neighborIndex] = `${adjustedNeighborWidth.toFixed(2)}%`;
    }

    return newColumnWidths;
};

export default adjustWidths;
