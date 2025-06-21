/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';
import React, { useRef } from 'react';
import { ImageElement } from '@/types';
import { default as NextImage } from 'next/image';

import styles from './Image.module.css';

interface ImageComponentProps {
    element: ImageElement;
    className?: string;
}

const ImageComponent: React.FC<ImageComponentProps> = ({ element, className = '' }) => {
    // Get alignment style based on element alignment property
    // const width = element.width ? `${element.width}px` : '100%';
    let widthPercent;

    if (element.width) {
        widthPercent = (1034 / element.width) * document.body.clientWidth;
    } else {
        widthPercent = 100;
    }

    const getAlignmentClass = () => {
        switch (element.alignment) {
            case 'left':
                return styles.left;
            case 'center':
                return styles.center;
            case 'right':
                return styles.right;
            default:
                return styles.center; // Default to center alignment
        }
    };

    const isValidUrl = (url: string) => {
        // Allow relative URLs starting with / or ./
        if (url.startsWith('/') || url.startsWith('./')) {
            return true;
        }

        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className={styles.imageContainer}>
            <div
                className={`${className} ${getAlignmentClass()}`}
                style={{
                    maxWidth: element.width ? `${element.width}px` : '100%',
                    cursor: 'default',
                }}
            >
                {element.src && isValidUrl(element.src) && (
                    <div className={`${styles.imageWrapper}`}>
                        <div style={{ position: 'relative' }}>
                            <NextImage
                                src={element.src}
                                alt={element.alt || ''}
                                width={widthPercent}
                                height={0}
                                sizes="100vw"
                                style={{ width: widthPercent, height: 'auto', maxWidth: '100%' }}
                                className={styles.image}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageComponent;
