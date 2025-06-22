import { getElementConfig } from '@/elements/commonRegisrty';
import { SlotKeyMapping } from '@/services/llm/rewriteSlideContent';
import { Slide, SmartLayoutElement } from '@/types';
import { ElementType } from '@/types/elements';
import { stripHtml } from './stripeHtml';

export default function createRewriteSlideMapping(slide: Slide) {
    try {
        const excludedElementsTypes = [ElementType.TABLE, ElementType.CHART, ElementType.IMAGE];

        const elements = slide.layouts
            .filter(layout => !layout.isTable)
            .flatMap(layout => layout.elements.map(element => ({ ...element, layoutId: layout.id })))
            .filter(element => !excludedElementsTypes.includes(element.elementTypeId));

        const mapping = new Map<string, SlotKeyMapping>();
        // const usedSlots = new Set<string>();

        for (const element of elements) {
            const elementConfig = getElementConfig(element.elementTypeId)!;

            if (elementConfig.elementTypeId === ElementType.SMART_LAYOUT) {
                // const smartLayoutKey = element.id;

                // проходим по каждому item s-l
                // достаем ключи из item
                // генерим уникальный ключ elementId + ключ из item
                // записываем в mapping
                (element as SmartLayoutElement).items.forEach((item, itemIndex) => {
                    Object.keys(item).forEach(key => {
                        const itemPropertyConfig = elementConfig.itemFields?.find(
                            propConfig => propConfig.field === key
                        );

                        if (itemPropertyConfig?.type === 'image' || key === 'id') {
                            return;
                        }

                        const uniqueKey = `${element.id}-${itemIndex}-${key}`;

                        mapping.set(uniqueKey, {
                            uniqueKey,
                            originalSlot: key,
                            elementId: element.id,
                            itemIndex,
                            layoutId: element.layoutId,
                            // content: (item[key] as string) || '',
                            content: stripHtml(item[key] as string) || '',
                            // llmHints: elementConfig.llmHints,
                        });
                    });
                });

                // const items = element.props.items
                //     ?.flatMap((item, index) => {
                //         return Object.keys(item).flatMap(key => {
                //             if (!element.llmHints?.items?.[key]) {
                //                 return;
                //             }

                //             const uniqueKey = getRandomString(10);
                //             return {
                //                 originalKey: key,
                //                 key: uniqueKey,
                //                 itemIndex: index,
                //                 type: element.llmHints?.items?.[key]?.type,
                //                 description: element.llmHints?.items?.[key]?.description,
                //             };
                //         });
                //     })
                //     .filter(Boolean);

                // mapping.set(smartLayoutKey, {
                //     uniqueKey: smartLayoutKey,
                //     layoutIndex,
                //     elementIndex,
                //     column: element.column,
                //     llmHints: element.llmHints,
                //     items,
                // });
            } else if (!elementConfig.slots) {
                return;
            } else {
                const slot = elementConfig.slots![0].slot;
                const uniqueKey = `${element.id}-${slot}`;

                mapping.set(uniqueKey, {
                    uniqueKey,
                    originalSlot: slot,
                    elementId: element.id,
                    llmHints: elementConfig.llmHints,
                    textType: elementConfig.props?.textType,
                    layoutId: element.layoutId,
                    // content: element[slot],
                    content: stripHtml(element[slot] as string),
                });
            }
        }

        return mapping;
    } catch (error) {
        console.error(error);
    }
}
