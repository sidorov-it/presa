import React, { useCallback } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { BaseMenu, MenuItem } from '../BaseMenu';
import { AlignTopIcon, AlignCenterIcon, AlignBottomIcon, DeleteIcon } from '@/components/icons';

import { useMenuSelectedSlide } from '@/store/menuStore';
import { LayoutType } from '@/types';
import LayoutTemplateDropdown from '../LayoutTemplateDropdown/LayoutTemplateDropdown';

interface LayoutMenuProps {
    position: { x: number; y: number; rect?: DOMRect };
    layoutId: string;
}

export default function LayoutMenu({ position, layoutId }: LayoutMenuProps) {
    const { updateAlignLayout, deleteLayout, closeMenu, getLayout, changeTemplate } = useMenuStore();

    const commonAlignment = useMenuStore(state => state.getCommonAlignment());

    const slideId = useMenuSelectedSlide();
    const layout = slideId && layoutId ? getLayout(slideId, layoutId) : null;

    const currentLayoutType = layout?.type || 'custom';

    const handleAlignTop = useCallback(() => {
        updateAlignLayout('top');
        closeMenu();
    }, [updateAlignLayout, closeMenu]);

    const handleAlignCenter = useCallback(() => {
        updateAlignLayout('center');
        closeMenu();
    }, [updateAlignLayout, closeMenu]);

    const handleAlignBottom = useCallback(() => {
        updateAlignLayout('bottom');
        closeMenu();
    }, [updateAlignLayout, closeMenu]);

    const handleDeleteLayout = useCallback(() => {
        deleteLayout();
        closeMenu();
    }, [deleteLayout, closeMenu]);

    const handleChangeTemplate = useCallback(
        (templateType: LayoutType) => {
            changeTemplate(templateType);
            closeMenu();
        },
        [changeTemplate, closeMenu]
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
                label="Align top"
                onClick={handleAlignTop}
                active={commonAlignment === 'top'}
            />
            <MenuItem
                icon={<AlignCenterIcon />}
                label="Align center"
                onClick={handleAlignCenter}
                active={commonAlignment === 'center'}
            />
            <MenuItem
                icon={<AlignBottomIcon />}
                label="Align bottom"
                onClick={handleAlignBottom}
                active={commonAlignment === 'bottom'}
            />
            <MenuItem icon={<DeleteIcon />} label="Delete layout" onClick={handleDeleteLayout} color="#f00" />
        </BaseMenu>
    );
}
