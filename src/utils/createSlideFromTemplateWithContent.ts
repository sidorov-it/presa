/**
 * Enhanced Slide Generation with Content-Aware Processing
 *
 * This file implements a solution to prevent double formatting issues when LLM-generated
 * markdown content is inserted into slide slots with predefined HTML tags.
 *
 * PROBLEM SOLVED:
 * - LLM returns markdown like "# Heading"
 * - markdownToHtml converts to "<span class='heading-text heading-1'>Heading</span>"
 * - Slot with textType: HEADING1 would wrap it again: "<span class='heading-text heading-1'>...</span>"
 * - Result: Double nested heading tags
 *
 * SOLUTION:
 * - getNewEditorElementFromMarkdown now detects existing HTML structure
 * - If structured content exists, it skips additional textType wrapping
 * - If plain text, it applies the slot's textType formatting
 *
 * FLOW:
 * 1. LLM content → markdownToHtml → detect structure
 * 2. If structured: use as-is (no textType wrapping)
 * 3. If plain text: apply textType formatting
 *
 * @updated 2024 - Enhanced content-aware processing
 */

import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { Slide, Layout, GridCell, BaseElement, TextType } from '@/types';
import { ElementType } from '@/types/elements';
import getColumnWidths from './getColumnWidths';
import { generateId } from './id';
import logger from '@/utils/logger';
import { getNewElement } from './getNewElement';
import { generateImage } from '@/services/llm/gigaChat';
import { getTextContent } from '@/elements/textEditor/defaultContent';
import { LLMRequestContext, SlotKeyMapping } from '@/types/gigachat';
import { getNewEditorElementFromMarkdown } from './getNewEditorElementFromMarkdown';

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
    options,
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
                    try {
                        let imageUrl = elementContent || '';

                        if (imageUrl) {
                            imageUrl = await generateImage(imageUrl as string, options);
                        }
                        newElement = getNewElement({
                            elementTypeId: elementConfig.elementTypeId,
                            elementVariant: elementConfig.elementVariant,
                            props: {
                                src: imageUrl,
                                alt: elementConfig.props?.alt,
                                alignment: elementConfig.props?.alignment || 'center',
                            },
                        });
                    } catch (error) {
                        logger.error(`Failed to generate image: ${String(error)}`);
                        // Fallback to empty image element
                        newElement = getNewElement({
                            elementTypeId: elementConfig.elementTypeId,
                            elementVariant: elementConfig.elementVariant,
                            props: {
                                src: '',
                                alt: elementConfig.props?.alt,
                                alignment: elementConfig.props?.alignment || 'center',
                            },
                        });
                    }
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
                    if (!mapping.items || !Array.isArray(mapping.items)) {
                        console.warn('Smart layout mapping items not found');
                        continue;
                    }

                    const itemsCount = Math.max(...mapping.items.map((item: any) => item.itemIndex));

                    const items = [];

                    for (let i = 0; i <= itemsCount; i++) {
                        const itemProps = mapping.items.filter((item: any) => item.itemIndex === i);
                        const item: any = {};

                        for (const itemProp of itemProps) {
                            const itemPropSchema = elementConfig.props.itemsSchema?.find(
                                schema => schema.key === (itemProp as any).originalKey
                            );

                            if (itemPropSchema && itemPropSchema.type !== ElementType.IMAGE) {
                                item[(itemProp as any).originalKey] = getTextContent(
                                    itemPropSchema.variant!,
                                    elementContent[(itemProp as any).key] || ''
                                );
                            }
                            // item[itemProp.originalKey] = elementContent[itemProp.key] || '';
                        }

                        const imageProps =
                            elementConfig.props.itemsSchema?.filter(schema => schema.type === ElementType.IMAGE) || [];

                        for (const itemProp of imageProps) {
                            const { key: itemKey, linkedContentFields } = itemProp;
                            const mappedFieldsKeys = linkedContentFields
                                ?.map(key => elementConfig.props.itemsSchema?.find(schema => schema.key === key))
                                .map(el => el?.key)
                                .filter(Boolean);

                            const imageDescription = itemProps
                                .filter((el: any) => mappedFieldsKeys?.includes(el.originalKey))
                                .map((el: any) => elementContent[el.key])
                                .join('\n');
                            const imageUrl = await generateImage(imageDescription, options);
                            item[itemKey] = imageUrl;
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
                    // Handle regular text element
                    // const content = elementContent[mapping.items?.[0]?.key] || '';
                    newElement = getNewEditorElementFromMarkdown(
                        elementContent || elementConfig.props?.content || '',
                        elementConfig.props?.textType,
                        elementConfig.props?.style?.textAlign
                    );
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
