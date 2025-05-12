export interface ColumnWidthOptions {
    columnIndex: number;
    width: number;
}

const getColumnWidths = (columnsCount: number, options?: ColumnWidthOptions): string[] => {
    if (columnsCount === 0) {
        return [];
    }

    if (options) {
        const { columnIndex, width } = options;
        if (columnIndex >= columnsCount) {
            throw new Error('Column index is out of bounds');
        }

        const remainingColumns = columnsCount - 1;
        const remainingWidth = 100 - width;
        const equalWidth = `${remainingWidth / remainingColumns}%`;

        return Array.from({ length: columnsCount }, (_, index) => (index === columnIndex ? `${width}%` : equalWidth));
    }

    if (columnsCount === 3) {
        return ['33%', '34%', '33%'];
    }

    return new Array(columnsCount).fill(`${100 / columnsCount}%`);
};

export default getColumnWidths;
