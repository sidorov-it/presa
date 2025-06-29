'use client';
import SmartLayoutColumnSizeSelector from '@/components/settings/SmartLayoutColumnSizeSelector/SmartLayoutColumnSizeSelector';
import SmartLayoutTemplateSelector from '@/components/settings/SmartLayoutTemplateSelector/SmartLayoutTemplateSelector';
import { usePresentationStore } from '@/store/presentationStore';
import { SmartLayoutElement, SmartLayoutType, TipTapRefs } from '@/types';
import { MutableRefObject } from 'react';
import { MenuItem } from '@/components/editor/SlideMenu/BaseMenu';
import AlignmentGroup from '@/components/settings/AlignmentGroup/AlignmentGroup';
import { DeleteIcon } from '@/components/icons';
import { useHistoryStore } from '@/store/historyStore';
import { ColorPicker } from '@/components/tiptap/ColorPicker';

export default function TextBoxesSettings({
    element,
    slideId,
    layoutId,
    elementId,
    presentationId,
    tiptapRefs,
}: {
    element: SmartLayoutElement;
    slideId: string;
    layoutId: string;
    elementId: string;
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}) {
    const updateElement = usePresentationStore(state => state.updateElement);

    const handleAlignment = (alignment: 'left' | 'center' | 'right') => {
        // Start a history transaction so that all subsequent updates are grouped
        useHistoryStore.getState().beginTransaction(presentationId, 'Change alignment');

        // Update alignment on the smart-layout element itself
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: {
                align: alignment,
            },
        });

        // Apply text alignment to every nested text editor and let their updates
        // be captured inside the running transaction
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

        // Commit the transaction so everything is stored as a single history entry
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
