import { produce } from 'immer';
import { Slide } from '@/types';
import { generateId } from './id';

/**
 * Клонирует слайд с новыми ID для всех элементов
 * Сохраняет связи между ячейками и элементами
 */
export const cloneSlideWithNewIds = (slide: Slide): Slide => {
    return produce(slide, draft => {
        // Создаем новый ID для слайда
        draft.id = generateId();

        // Создаем мапу для связи старых и новых ID ячеек
        const cellIdMap = new Map<string, string>();

        // Обрабатываем каждый layout
        draft.layouts.forEach(layout => {
            // Создаем новый ID для layout
            layout.id = generateId();

            // Обрабатываем rows и cells
            layout.gridStructure.rows.forEach(row => {
                // Создаем новый ID для row
                row.id = generateId();

                // Обрабатываем cells
                row.cells.forEach(cell => {
                    const oldCellId = cell.id;
                    const newCellId = generateId();

                    // Создаем новый ID для cell
                    cell.id = newCellId;

                    // Сохраняем связь между старым и новым ID ячейки
                    cellIdMap.set(oldCellId, newCellId);
                });
            });

            // Обрабатываем elements
            layout.elements.forEach(element => {
                // Создаем новый ID для элемента
                element.id = generateId();

                // Обновляем cellId на новый ID ячейки
                const newCellId = cellIdMap.get(element.cellId);
                if (newCellId) {
                    element.cellId = newCellId;
                }

                // Если это SmartLayoutElement, также обновляем ID для items
                if ('items' in element && Array.isArray(element.items)) {
                    element.items.forEach((item: any) => {
                        if (item.id) {
                            item.id = generateId();
                        }
                    });
                }
            });
        });
    });
};
