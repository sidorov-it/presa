import { IPresentation, Slide, Layout, GridCell, TextType } from '@/types';
import { ElementType } from '@/types/elements';
import { generateId } from '@/utils/id';
import { getNewElement } from '@/utils/getNewElement';
import getColumnWidths from '@/utils/getColumnWidths';

export interface ElementDescriptor {
    type: string;
    content?: string;
    src?: string;
    column?: number;
    row?: number;
    variant?: string;
    data?: any;
    alt?: string;
    [key: string]: any;
}

export interface LayoutDescriptor {
    layout?: string;
    columnsCount?: number;
    rowsCount?: number;
    elements: ElementDescriptor[];
}

export interface SlideDescriptor {
    title?: string;
    layouts: LayoutDescriptor[];
}

export interface PresentationDescriptor {
    title: string;
    themeId: string;
    description?: string;
    slides: SlideDescriptor[];
}

function mapElement(desc: ElementDescriptor) {
    const type = desc.type.toLowerCase();
    switch (type) {
        case 'heading':
        case 'title':
            return {
                elementTypeId: ElementType.TEXT,
                props: {
                    textType: TextType.HEADING1,
                    content: desc.content || '',
                },
            };
        case 'text':
            return {
                elementTypeId: ElementType.TEXT,
                props: {
                    textType: TextType.DEFAULT,
                    content: desc.content || '',
                },
            };
        case 'quote':
            return {
                elementTypeId: ElementType.TEXT,
                props: {
                    textType: TextType.QUOTE,
                    content: desc.content || '',
                },
            };
        case 'image':
            return {
                elementTypeId: ElementType.IMAGE,
                props: {
                    src: desc.src || '',
                    alt: desc.alt || '',
                    alignment: 'center',
                },
            };
        case 'chart':
            return {
                elementTypeId: ElementType.CHART,
                elementVariant: desc.variant || 'bar',
                props: {
                    data: desc.data || [],
                },
            };
        case 'smart-layout':
            return {
                elementTypeId: ElementType.SMART_LAYOUT,
                elementVariant: desc.variant,
                props: desc.props || {},
            };
        case 'table':
            return {
                elementTypeId: ElementType.TABLE,
                props: {
                    data: desc.data || [],
                },
            };
        case 'box':
            return {
                elementTypeId: ElementType.BOX,
                props: {
                    content: desc.content || '',
                },
            };
        default:
            return {
                elementTypeId: ElementType.TEXT,
                props: {
                    textType: TextType.DEFAULT,
                    content: desc.content || '',
                },
            };
    }
}

export function generatePresentationTemplate(desc: PresentationDescriptor): IPresentation {
    const presentationId = generateId();
    const now = Date.now();

    const slides: Slide[] = desc.slides.map(slideDesc => {
        const slideId = generateId();
        const layouts: Layout[] = slideDesc.layouts.map(layoutDesc => {
            const columnsCount =
                layoutDesc.columnsCount ?? Math.max(1, ...layoutDesc.elements.map((el, idx) => (el.column ?? idx) + 1));

            const layout: Layout = {
                id: generateId(),
                type: (layoutDesc.layout || 'blank') as any,
                elements: [],
                style: {},
                gridStructure: {
                    rows: [
                        {
                            id: generateId(),
                            cells: Array.from({ length: columnsCount }).map((_, i) => ({
                                id: generateId(),
                                row: 0,
                                column: i,
                            })) as GridCell[],
                        },
                    ],
                    columns: columnsCount,
                    columnWidths: getColumnWidths(columnsCount),
                },
            };

            layoutDesc.elements.forEach((elDesc, index) => {
                const column = elDesc.column ?? index;
                const cell = layout.gridStructure.rows[0].cells[column];
                if (!cell) return;

                const element = getNewElement(mapElement(elDesc));
                layout.elements.push({ ...element, cellId: cell.id });
            });

            return layout;
        });

        return {
            id: slideId,
            title: slideDesc.title,
            layouts,
        };
    });

    return {
        id: presentationId,
        title: desc.title,
        description: desc.description,
        slides,
        themeId: desc.themeId,
        createdAt: now,
        updatedAt: now,
    };
}
