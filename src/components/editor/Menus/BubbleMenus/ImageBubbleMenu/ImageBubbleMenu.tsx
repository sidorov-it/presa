'use client';

import React from 'react';
import { BiAlignLeft, BiAlignMiddle, BiAlignRight, BiEdit } from 'react-icons/bi';
import { usePresentationStore } from '@/store/presentationStore';
import { useMenuStore } from '@/store/menuStore';
import { BaseMenu } from '../../../SlideMenu/BaseMenu';
import { ImageElement } from '@/types';

import styles from './ImageBubbleMenu.module.css';
import DeleteIcon from '@/components/icons/DeleteIcon';

interface ImageBubbleMenuProps {
    presentationId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
}

const ImageBubbleMenu: React.FC<ImageBubbleMenuProps> = ({ presentationId, slideId, layoutId, elementId }) => {
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as ImageElement;

    const updateElement = usePresentationStore(state => state.updateElement);
    const deleteElement = usePresentationStore(state => state.deleteElement);
    // const openSidePanel = useMenuStore(state => state.openSidePanel);
    // const closeBubbleMenu = useMenuStore(state => state.closeBubbleMenu);

    const handleAlignment = (alignment: 'left' | 'center' | 'right') => {
        updateElement(presentationId, slideId, layoutId, elementId, { alignment });
    };

    const handleEdit = () => {
        useMenuStore.getState().closeMenu();
        useMenuStore.getState().openSideMenu('image-edit', { presentationId, slideId, layoutId, elementId });
    };

    const handleDelete = () => {
        deleteElement(presentationId, slideId, layoutId, elementId);
        useMenuStore.getState().closeMenu();
    };

    return (
        <BaseMenu>
            <div className={styles.alignmentGroup}>
                <button
                    onClick={() => handleAlignment('left')}
                    className={`${styles.button} ${element.alignment === 'left' ? styles.active : ''}`}
                    aria-label="По левому краю"
                >
                    <BiAlignLeft size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('center')}
                    className={`${styles.button} ${element.alignment === 'center' ? styles.active : ''}`}
                    aria-label="По центру"
                >
                    <BiAlignMiddle size={16} />
                </button>
                <button
                    onClick={() => handleAlignment('right')}
                    className={`${styles.button} ${element.alignment === 'right' ? styles.active : ''}`}
                    aria-label="По правому краю"
                >
                    <BiAlignRight size={16} />
                </button>
            </div>

            <button onClick={handleEdit} className={styles.button} aria-label="Редактировать изображение">
                <BiEdit size={16} />
            </button>

            <button onClick={handleDelete} className={styles.deleteButton} aria-label="Удалить изображение">
                <DeleteIcon />
            </button>
        </BaseMenu>
    );
};

export default ImageBubbleMenu;
