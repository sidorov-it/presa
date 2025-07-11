import React, { useCallback } from 'react';
import { useSelectedState, useUIStateStore } from '@/store/uiStateStore';
import { BaseMenu, MenuItem } from '../BaseMenu';
import { AlignTopIcon, AlignCenterIcon, AlignBottomIcon, DeleteIcon } from '@/components/icons';

import { usePresentationStore } from '@/store/presentationStore';
import { LayoutType } from '@/types';
import LayoutTemplateDropdown from '../LayoutTemplateDropdown/LayoutTemplateDropdown';

interface LayoutMenuProps {
    position: { x: number; y: number; rect?: DOMRect };
    layoutId: string;
}

export default function LayoutMenu({ position, layoutId }: LayoutMenuProps) {
    const { closeContextMenu } = useUIStateStore();
    const { updateAlignLayout, deleteLayout, getLayout, changeTemplate, getCommonAlignment } = usePresentationStore();

    const selectedState = useSelectedState();
    const commonAlignment = getCommonAlignment(
        selectedState.presentationId!,
        selectedState.selectedSlideId!,
        selectedState.selectedLayoutId!
    );

    const slideId = selectedState.selectedSlideId;
    const layout = slideId && layoutId ? getLayout(selectedState.presentationId!, slideId, layoutId) : null;

    const currentLayoutType = layout?.type || 'custom';

    const handleAlignTop = useCallback(() => {
        updateAlignLayout(
            selectedState.presentationId!,
            selectedState.selectedSlideId!,
            selectedState.selectedLayoutId!,
            'top'
        );
        closeContextMenu();
    }, [
        updateAlignLayout,
        selectedState.presentationId,
        selectedState.selectedSlideId,
        selectedState.selectedLayoutId,
        closeContextMenu,
    ]);

    const handleAlignCenter = useCallback(() => {
        updateAlignLayout(
            selectedState.presentationId!,
            selectedState.selectedSlideId!,
            selectedState.selectedLayoutId!,
            'center'
        );
        closeContextMenu();
    }, [
        updateAlignLayout,
        selectedState.presentationId,
        selectedState.selectedSlideId,
        selectedState.selectedLayoutId,
        closeContextMenu,
    ]);

    const handleAlignBottom = useCallback(() => {
        updateAlignLayout(
            selectedState.presentationId!,
            selectedState.selectedSlideId!,
            selectedState.selectedLayoutId!,
            'bottom'
        );
        closeContextMenu();
    }, [
        updateAlignLayout,
        selectedState.presentationId,
        selectedState.selectedSlideId,
        selectedState.selectedLayoutId,
        closeContextMenu,
    ]);

    const handleDeleteLayout = useCallback(() => {
        deleteLayout(selectedState.presentationId!, selectedState.selectedSlideId!, selectedState.selectedLayoutId!);
        closeContextMenu();
    }, [
        deleteLayout,
        selectedState.presentationId,
        selectedState.selectedSlideId,
        selectedState.selectedLayoutId,
        closeContextMenu,
    ]);

    const handleChangeTemplate = useCallback(
        (templateType: LayoutType) => {
            changeTemplate(
                selectedState.presentationId!,
                selectedState.selectedSlideId!,
                selectedState.selectedLayoutId!,
                templateType
            );
            closeContextMenu();
        },
        [
            changeTemplate,
            closeContextMenu,
            selectedState.presentationId,
            selectedState.selectedLayoutId,
            selectedState.selectedSlideId,
        ]
    );

    if (!layout) {
        return null;
    }

    return (
        <BaseMenu position={position}>
            <LayoutTemplateDropdown
                currentLayoutType={currentLayoutType}
                setCurrentLayoutType={handleChangeTemplate}
                layout={layout}
            />
            <MenuItem
                icon={<AlignTopIcon />}
                label="Выровнять по верхнему краю"
                onClick={handleAlignTop}
                active={commonAlignment === 'top'}
            />
            <MenuItem
                icon={<AlignCenterIcon />}
                label="Выровнять по центру"
                onClick={handleAlignCenter}
                active={commonAlignment === 'center'}
            />
            <MenuItem
                icon={<AlignBottomIcon />}
                label="Выровнять по нижнему краю"
                onClick={handleAlignBottom}
                active={commonAlignment === 'bottom'}
            />
            <MenuItem icon={<DeleteIcon />} label="Удалить макет" onClick={handleDeleteLayout} color="#f00" />
        </BaseMenu>
    );
}
