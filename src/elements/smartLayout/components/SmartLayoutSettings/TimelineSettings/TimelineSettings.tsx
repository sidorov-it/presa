'use client';
import SmartLayoutColumnSizeSelector from '@/components/settings/SmartLayoutColumnSizeSelector/SmartLayoutColumnSizeSelector';
import SmartLayoutTemplateSelector from '@/components/settings/SmartLayoutTemplateSelector/SmartLayoutTemplateSelector';
import SmartLayoutDirectionSelector from '@/components/settings/SmartLayoutDirectionSelector/SmartLayoutDirectionSelector';
import TimelineSidesSelector from '@/components/settings/TimelineSidesSelector/TimelineSidesSelector';
import TimelineNumberingSelector from '@/components/settings/TimelineNumberingSelector/TimelineNumberingSelector';
import TimelineLinesSelector from '@/components/settings/TimelineLinesSelector/TimelineLinesSelector';
import TimelineColorSelector from '@/components/settings/TimelineColorSelector/TimelineColorSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutType, TipTapRefs } from '@/types';
import { MutableRefObject } from 'react';
import { MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import AlignmentGroup from '@/components/settings/AlignmentGroup/AlignmentGroup';
import { DeleteIcon } from '@/components/icons';
import { useHistoryStore } from '@/store/historyStore';

export default function TimelineSettings({
    element,
    slideId,
    layoutId,
    elementId,
    presentationId,
    tiptapRefs,
}: {
    element: SmartLayoutElement & { direction?: 'horizontal' | 'vertical' };
    slideId: string;
    layoutId: string;
    elementId: string;
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}) {
    const updateElement = usePresentationStore(state => state.updateElement);

    const handleAlignment = (alignment: 'left' | 'center' | 'right') => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Change alignment');
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                align: alignment,
            },
        });

        element.items?.forEach(item => {
            tiptapRefs.current.editors[`title-${elementId}-${item.id}`]?.editor
                .chain()
                .setMeta('transaction', true)
                .focus()
                .setTextAlign(alignment)
                .blur()
                .run();

            tiptapRefs.current.editors[`text-${elementId}-${item.id}`]?.editor
                .chain()
                .setMeta('transaction', true)
                .focus()
                .setTextAlign(alignment)
                .blur()
                .run();
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    };

    return (
        <>
            <SmartLayoutTemplateSelector
                elementVariant={element.elementVariant || 'grid'}
                setElementVariant={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { elementVariant: value as SmartLayoutType },
                    });
                }}
            />

            <SmartLayoutColumnSizeSelector
                columnSize={element.columnSize}
                step={1}
                min={1}
                max={4}
                defaultValue={1}
                setColumnSize={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { columnSize: value },
                    });
                }}
            />

            <SmartLayoutDirectionSelector
                direction={(element as any).direction || 'horizontal'}
                setDirection={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { direction: value },
                    });
                }}
            />

            <TimelineSidesSelector
                sides={element.sides || 'one'}
                setSides={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { sides: value },
                    });
                }}
            />

            <TimelineNumberingSelector
                showNumbers={element.showNumbers || false}
                setShowNumbers={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { showNumbers: value },
                    });
                }}
            />

            <TimelineLinesSelector
                showLines={element.showLines !== false} // Default to true
                setShowLines={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { showLines: value },
                    });
                }}
            />

            <TimelineColorSelector
                color={element.timelineColor || '#1e88e5'}
                setColor={value => {
                    updateElement({
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        data: { timelineColor: value },
                    });
                }}
            />

            <AlignmentGroup element={element} handleChange={handleAlignment} />

            <MenuItem
                icon={<DeleteIcon />}
                label="Удалить элемент"
                onClick={() => {
                    usePresentationStore.getState().deleteElement(presentationId, slideId, layoutId, elementId);
                }}
            />
        </>
    );
}
