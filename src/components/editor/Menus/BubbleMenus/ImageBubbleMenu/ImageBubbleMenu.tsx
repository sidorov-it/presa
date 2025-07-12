'use client';

import React from 'react';
import { BiAlignLeft, BiAlignMiddle, BiAlignRight, BiEdit } from 'react-icons/bi';
import { usePresentationStore } from '@/store/presentationStore';
import { ImageElement } from '@/types';

import styles from './ImageBubbleMenu.module.css';
import DeleteIcon from '@/components/icons/DeleteIcon';
import { useUIStateStore } from '@/store/uiStateStore';

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

    const handleAlignment = (alignment: 'left' | 'center' | 'right') => {
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: { alignment },
        });
    };

    const handleEdit = () => {
        useUIStateStore.getState().closeContextMenu();
        useUIStateStore.getState().openSideMenu('image-edit', {
            imageUrl: element.src,
            elementId,
            presentationId,
            slideId,
            layoutId,
            onClearImage: () => {
                updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: { src: '' },
                });
            },
            onUpdateLink: (link: string, uploaded: boolean) => {
                updateElement({
                    presentationId,
                    slideId,
                    layoutId,
                    elementId,
                    data: { src: link, uploaded },
                });
            },
        });
    };

    const handleDelete = () => {
        deleteElement(presentationId, slideId, layoutId, elementId);
        useUIStateStore.getState().closeContextMenu();
    };

    return (
        <>
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
        </>
    );
};

export default ImageBubbleMenu;
