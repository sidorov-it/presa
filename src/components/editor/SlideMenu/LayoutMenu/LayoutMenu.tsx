import React, { useCallback } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { BaseMenu, MenuItem } from '../BaseMenu';
import { AlignTopIcon, AlignCenterIcon, AlignBottomIcon, DeleteIcon } from '@/components/icons';

import { useMenuSelectedSlide } from '@/store/menuStore';
import SmartLayoutSwitcher from '../../SmartLayoutSwitcher/SmartLayoutSwitcher';

interface LayoutMenuProps {
    position: { x: number; y: number; rect?: DOMRect };
    layoutId: string;
    presentationId: string;
}

export default function LayoutMenu({ position, layoutId, presentationId }: LayoutMenuProps) {
    const { updateAlignLayout, deleteLayout, closeMenu, getLayout } = useMenuStore();

    const commonAlignment = useMenuStore(state => state.getCommonAlignment());

    const slideId = useMenuSelectedSlide();
    const layout = slideId && layoutId ? getLayout(slideId, layoutId) : null;

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

    if (!layout) {
        return null;
    }

    return (
        <BaseMenu position={position}>
            <div className="flex flex-col gap-4">
                <div>
                    <SmartLayoutSwitcher layoutId={layoutId} slideId={slideId} presentationId={presentationId} />
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Alignment</div>
                    <div className="flex gap-2">
                        <MenuItem
                            icon={<AlignTopIcon />}
                            label="Top"
                            onClick={handleAlignTop}
                            active={commonAlignment === 'top'}
                        />
                        <MenuItem
                            icon={<AlignCenterIcon />}
                            label="Center"
                            onClick={handleAlignCenter}
                            active={commonAlignment === 'center'}
                        />
                        <MenuItem
                            icon={<AlignBottomIcon />}
                            label="Bottom"
                            onClick={handleAlignBottom}
                            active={commonAlignment === 'bottom'}
                        />
                    </div>
                </div>
                <div className="border-t border-gray-200 pt-4">
                    <MenuItem
                        icon={<DeleteIcon />}
                        label="Delete Layout"
                        onClick={handleDeleteLayout}
                        className="text-red-600 hover:text-red-700"
                    />
                </div>
            </div>
        </BaseMenu>
    );
}
