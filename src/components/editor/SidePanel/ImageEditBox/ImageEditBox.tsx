'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';
import { usePresentationStore } from '@/store/presentationStore';
import { ImageElement } from '@/types';

import styles from './ImageEditBox.module.css';
import { Button } from '@/components/ui/Button';
import { useMenuStore } from '@/store/menuStore';

interface ImageEditBoxProps {
    presentationId: string;
    slideId: string;
    layoutId: string;
    elementId: string;
}

const ImageEditBox: React.FC<ImageEditBoxProps> = ({ presentationId, slideId, layoutId, elementId }) => {
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as ImageElement;

    const updateElement = usePresentationStore(state => state.updateElement);

    const handleReplaceImage = () => {
        // if (element.uploaded) {
        //     // запрос на удаление изображения
        //     fetch(`/api/assets/delete/${element.src}`, {
        //         method: 'DELETE',
        //     });
        // }
        updateElement(presentationId, slideId, layoutId, elementId, { src: '', uploaded: false });
    };

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                const formData = new FormData();
                formData.append('file', acceptedFiles[0]);

                fetch('/api/assets/upload', {
                    method: 'POST',
                    body: formData,
                }).then(response => {
                    response.json().then(data => {
                        updateElement(presentationId, slideId, layoutId, elementId, { src: data.url, uploaded: true });
                    });
                });
            }
        },
        [presentationId, slideId, layoutId, elementId, updateElement]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
    });

    const handleUpdateLink = (link: string) => {
        updateElement(presentationId, slideId, layoutId, elementId, { src: link });
    };

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Редактирование изображения</h3>
            <div className={styles.closeButton}>
                <Button variant="outline" size="sm" onClick={() => useMenuStore.getState().closeSideMenu()}>
                    X
                </Button>
            </div>
            {/* {!element.src && <ImagePlaceholder onUpdateLink={handleUpdateLink} />} */}

            <div className={styles.inputGroup}>
                <label htmlFor="imageUrl" className={styles.label}>
                    Ссылка на изображение
                </label>
                <input
                    id="imageUrl"
                    type="url"
                    className={styles.input}
                    value={element.src || ''}
                    onChange={e => handleUpdateLink(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            {element.src && (
                <div {...getRootProps()} className={styles.dropzone}>
                    <img src={element.src} alt="Изображение" />
                </div>
            )}

            {!element.src && (
                <div {...getRootProps()} className={styles.dropzone}>
                    <input {...getInputProps()} />
                    <FiUpload className={styles.uploadIcon} />
                    <p className={styles.dropzoneText}>
                        {isDragActive ? 'Перетащите файл сюда' : 'Перетащите изображение или кликните для выбора'}
                    </p>
                </div>
            )}
            <div className={styles.replaceImageButton}>
                <Button variant="outline" size="sm" onClick={() => handleReplaceImage()}>
                    Заменить изображение
                </Button>
            </div>
        </div>
    );
};

export default ImageEditBox;
