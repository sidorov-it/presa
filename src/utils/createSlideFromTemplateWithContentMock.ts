import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { type Slide, type Layout, type GridCell, type BaseElement, TextType } from '@/types';
import { ElementType } from '@/types/elements';
import getColumnWidths from './getColumnWidths';
import { generateId } from './id';
import { getNewElement } from './getNewElement';
import { getTextContent } from '@/elements/textEditor/defaultContent';
import type { LLMRequestContext, SlotKeyMapping } from '@/types/gigachat';

// const generateImage = () => {};
/**
 * Creates a new slide from a template and fills it with generated content
 * @param templateId - The template ID
 * @param layoutsContent - Array of arrays with generated content for each layout
 * @param title - Optional slide title
 * @param gigaChatConfig - Optional GigaChat configuration for image generation
 * @returns The new slide with content
 */
export const createSlideFromTemplateWithContent = async ({
    templateId,
    slotMapping,
    layoutsContents,
    title,
}: {
    templateId: string;
    slotMapping: Map<string, SlotKeyMapping>;
    layoutsContents: Record<string, string | string[]>;
    title?: string;
    options: LLMRequestContext;
}): Promise<Slide> => {
    const template = SlideTemplatesRegistry[templateId];
    if (!template) {
        throw new Error(`Template ${templateId} not found`);
    }

    // Create a new slide
    const newSlideId = generateId();
    const newSlide: Slide = {
        id: newSlideId,
        title,
        layouts: [],
        contentAlignment: template.contentAlignment || 'center',
    };

    // First create the slide structure based on template
    for (const [layoutIndex, layoutConfig] of template.layouts.entries()) {
        // Create a new layout
        const newLayout: Layout = {
            id: generateId(),
            type: layoutConfig.layout,
            elements: [],
            style: {},
            gridStructure: {
                rows: [
                    {
                        id: generateId(),
                        cells: [],
                    },
                ],
                columns: 0,
                columnWidths: [],
            },
        };

        const { columnsCount } = layoutConfig;

        newLayout.gridStructure.columns = columnsCount;
        newLayout.gridStructure.columnWidths = getColumnWidths(columnsCount);

        // Create cells for the layout
        for (let cellIndex = 0; cellIndex < columnsCount; cellIndex++) {
            const cell: GridCell = {
                id: generateId(),
                row: 0,
                column: cellIndex,
            };

            newLayout.gridStructure.rows[0].cells.push(cell);

            const cellElements = layoutConfig.elements.filter(element => element.column === cellIndex);

            // for (const elementConfig of cellElements) {
            for (let i = 0; i < cellElements.length; i++) {
                // const elementConfig = cellElements[i];
                const elementConfig = cellElements[i];
                const slotMappingEntry = Array.from(slotMapping.entries()).find(
                    ([_, mapping]) =>
                        mapping.layoutIndex === layoutIndex &&
                        mapping.column === cellIndex &&
                        mapping.elementIndex === i
                );

                if (!slotMappingEntry) {
                    console.warn(`No slot mapping found for element in layout ${layoutIndex}`);
                    break;
                }

                const [slotKey, mapping] = slotMappingEntry;
                const elementContent = layoutsContents[slotKey] || {};

                // Create element based on template
                let newElement: Omit<BaseElement, 'cellId'>;

                if (elementConfig.elementTypeId === ElementType.IMAGE) {
                    // Use placeholder image instead of generating one
                    newElement = getNewElement({
                        elementTypeId: elementConfig.elementTypeId,
                        elementVariant: elementConfig.elementVariant,
                        props: {
                            src: '/uploads/fbv8kc60ab1n7s95m3l5.jpg',
                            alt: elementConfig.props?.alt,
                            alignment: elementConfig.props?.alignment || 'center',
                        },
                    });
                } else if (
                    [TextType.BULLET_LIST, TextType.NUMERED_LIST, TextType.TODO_LIST].includes(
                        elementConfig.props.textType
                    )
                ) {
                    // const content = getTextContent(elementConfig.props.textType, elementContent);
                    newElement = getNewElement({
                        elementTypeId: elementConfig.elementTypeId,
                        elementVariant: elementConfig.elementVariant,
                        props: {
                            ...elementConfig.props,
                            content: elementContent || '',
                            textType: elementConfig.props.textType,
                        },
                    });
                } else if (elementConfig.elementTypeId === ElementType.SMART_LAYOUT) {
                    // Handle smart layout element
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    const itemsCount = Math.max(...mapping.items.map(item => item.itemIndex).filter(Number.isInteger));

                    const items = [];

                    for (let i = 0; i <= itemsCount; i++) {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        const itemProps = mapping.items.filter(item => item.itemIndex === i);
                        const item = {};

                        for (const itemProp of itemProps) {
                            const itemPropSchema = elementConfig.props.itemsSchema?.find(
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                schema => schema.key === itemProp.originalKey
                            );

                            if (itemPropSchema && itemPropSchema.type !== ElementType.IMAGE) {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-expect-error
                                item[itemProp.originalKey] = getTextContent(
                                    itemPropSchema.variant!,
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-expect-error
                                    elementContent[itemProp.key] || ''
                                );
                            }
                            // item[itemProp.originalKey] = elementContent[itemProp.key] || '';
                        }

                        const imageProps =
                            elementConfig.props.itemsSchema?.filter(schema => schema.type === ElementType.IMAGE) || [];

                        for (const itemProp of imageProps) {
                            const { key: itemKey } = itemProp;
                            // Use placeholder image instead of generating one
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-expect-error
                            item[itemKey] = '/uploads/fbv8kc60ab1n7s95m3l5.jpg';
                        }

                        // if (
                        //     elementConfig.props?.itemImages &&
                        //     elementConfig.props?.itemImages.find(itemImage =>
                        //         itemImage.linkedContentFields.includes(itemProp.originalKey)
                        //     )
                        // ) {
                        //     const imageDescription =
                        //     const imageUrl = await generateImage(
                        //         elementConfig.props?.itemImages.find(itemImage =>
                        //             itemImage.linkedContentFields.includes(itemProp.originalKey)
                        //         )?.description || ''
                        //     );

                        //     item[itemProp.originalKey] = imageUrl;
                        // } else {
                        //     item[itemProp.originalKey] = elementContent[itemProp.key] || '';
                        // }
                        // itemProps.forEach(itemProp => {
                        //     item[itemProp.originalKey] = elementContent[itemProp.key] || '';
                        // });

                        items.push(item);
                    }

                    newElement = getNewElement({
                        elementTypeId: elementConfig.elementTypeId,
                        elementVariant: elementConfig.elementVariant,
                        props: {
                            ...elementConfig.props,
                            items,
                        },
                    });
                } else {
                    // Handle all other element types properly based on template configuration
                    if (elementConfig.elementTypeId === ElementType.TEXT && elementConfig.props?.textType) {
                        // Create element with proper textType from template
                        newElement = getNewElement({
                            elementTypeId: elementConfig.elementTypeId,
                            props: {
                                ...elementConfig.props,
                                content: elementContent || elementConfig.props?.content || '',
                                textType: elementConfig.props.textType,
                            },
                        });
                    } else if (
                        [ElementType.CHART, ElementType.TABLE, ElementType.BOX, ElementType.QUOTE].includes(
                            elementConfig.elementTypeId
                        )
                    ) {
                        // Handle CHART, TABLE, BOX, QUOTE elements - preserve all template props
                        newElement = getNewElement({
                            elementTypeId: elementConfig.elementTypeId,
                            elementVariant: elementConfig.elementVariant,
                            props: {
                                ...elementConfig.props,
                                // For charts, use the content as data if provided
                                ...(elementConfig.elementTypeId === ElementType.CHART && elementContent
                                    ? { data: elementContent }
                                    : {}),
                                // For other elements with content, update content field
                                ...(elementContent &&
                                [ElementType.BOX, ElementType.QUOTE].includes(elementConfig.elementTypeId)
                                    ? { content: elementContent }
                                    : {}),
                            },
                        });
                    } else {
                        // Fallback for any other element types - use getNewElement with template props
                        newElement = getNewElement({
                            elementTypeId: elementConfig.elementTypeId,
                            elementVariant: elementConfig.elementVariant,
                            props: {
                                ...elementConfig.props,
                                // Update content if provided
                                ...(elementContent ? { content: elementContent } : {}),
                            },
                        });
                    }
                }

                // const elementConfig = element;
                // const newElement = getNewElement({
                //     elementTypeId: elementConfig.elementTypeId,
                //     props: elementConfig.props,
                //     elementVariant: elementConfig.elementVariant,
                // });

                if (newElement) {
                    // Add cell ID to the element
                    newLayout.elements.push({
                        ...newElement,
                        cellId: cell.id,
                    } as BaseElement);
                }
            }
        }

        // // Create cells based on the number of elements
        // newLayout.gridStructure.columns = layoutConfig.columnsCount;
        // newLayout.gridStructure.columnWidths = getColumnWidths(layoutConfig.columnsCount);

        // // Create cells and elements for the layout
        // for (const [index, elementTemplate] of layoutConfig.elements.entries()) {
        //     // Create cell
        //     const cell: GridCell = {
        //         id: generateId(),
        //         row: 0,
        //         column: index,
        //     };

        //     newLayout.gridStructure.rows[0].cells.push(cell);

        //     layoutConfig.elements.forEach(element => element.)

        //     const layoutContent = layoutsContents[layoutIndex] || {};
        //     const slotContent = layoutContent[elementTemplate.slot] || '';

        //     newLayout.elements.push(newElement);
        // }

        newSlide.layouts.push(newLayout);
    }

    return newSlide;
};
