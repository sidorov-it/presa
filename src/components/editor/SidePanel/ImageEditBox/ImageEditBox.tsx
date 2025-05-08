'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';

import styles from './ImageEditBox.module.css';
import { Button } from '@/components/ui/Button';
import { useMenuStore } from '@/store/menuStore';

interface ImageEditBoxProps {
    imageUrl: string;
    onClearImage: () => void;
    onUpdateLink: (link: string, uploaded: boolean) => void;
    // presentationId: string;
    // slideId: string;
    // layoutId: string;
    // elementId: string;
}

const ImageEditBox: React.FC<ImageEditBoxProps> = ({ imageUrl, onClearImage, onUpdateLink }) => {
    const [imageUrlLocal, setImageUrlLocal] = useState(imageUrl);

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
                        onUpdateLink(data.url, true);
                        setImageUrlLocal(data.url);
                        // updateElement({
                        //     presentationId,
                        //     slideId,
                        //     layoutId,
                        //     elementId,
                        //     data: { src: data.url, uploaded: true },
                        // });
                    });
                });
            }
        },
        [onUpdateLink]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
        },
    });

    const handleUpdateLink = (link: string) => {
        onUpdateLink(link, false);
        setImageUrlLocal(link);
        // updateElement({
        //     presentationId,
        //     slideId,
        //     layoutId,
        //     elementId,
        //     data: { src: link },
        // });
    };

    const handleReplaceImageClick = useCallback(() => {
        onClearImage();
        setImageUrlLocal('');
    }, [onClearImage]);

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Редактирование изображения</h3>
            <div className={styles.closeButton}>
                <Button variant="outline" size="sm" onClick={() => useMenuStore.getState().closeSideMenu()}>
                    X
                </Button>
            </div>

            <div className={styles.inputGroup}>
                <label htmlFor="imageUrl" className={styles.label}>
                    Ссылка на изображение
                </label>
                <input
                    id="imageUrl"
                    type="url"
                    className={styles.input}
                    value={imageUrlLocal || ''}
                    onChange={e => handleUpdateLink(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                />
            </div>

            {imageUrlLocal && (
                <div {...getRootProps()} className={styles.dropzone}>
                    <img src={imageUrlLocal} alt="Изображение" />
                </div>
            )}

            {!imageUrlLocal && (
                <div {...getRootProps()} className={styles.dropzone}>
                    <input {...getInputProps()} />
                    <FiUpload className={styles.uploadIcon} />
                    <p className={styles.dropzoneText}>
                        {isDragActive ? 'Перетащите файл сюда' : 'Перетащите изображение или кликните для выбора'}
                    </p>
                </div>
            )}
            <div className={styles.replaceImageButton}>
                <Button variant="outline" size="sm" onClick={handleReplaceImageClick}>
                    Заменить изображение
                </Button>
            </div>
        </div>
    );
};

export default ImageEditBox;
