/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { ImagePlaceholder } from '../ImagePlaceholder/ImagePlaceholder';
import React from 'react';
import { useMenuStore } from '@/store/menuStore';

export type ImageProps = {
    imageUrl: string;
    alt?: string;
    onClearImage?: () => void;
    onUpdateLink?: (link: string, uploaded: boolean) => void;
    isWidthRightMenu?: boolean;
    className?: string;
    style?: React.CSSProperties;
    // Element context for AI generation (optional)
    elementId?: string;
    presentationId?: string;
    slideId?: string;
    layoutId?: string;
    itemId?: string; // For SmartLayout items
    isReadOnly: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export const Image: React.FC<ImageProps> = ({
    imageUrl,
    alt = '',
    onClearImage,
    onUpdateLink,
    isWidthRightMenu = false,
    className = '',
    style = {},
    elementId,
    presentationId,
    slideId,
    layoutId,
    itemId,
    isReadOnly = false,
    ...rest
}) => {
    const handleImageClick = () => {
        if (isWidthRightMenu) {
            useMenuStore.getState().openSideMenu('image-edit', {
                imageUrl,
                onClearImage,
                onUpdateLink,
                elementId,
                presentationId,
                slideId,
                layoutId,
                itemId,
            });
        }
    };

    if (isReadOnly && !imageUrl) {
        return null;
    }

    return (
        <div className={className} style={style} {...rest}>
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={alt}
                    style={{
                        width: '100%',
                        // height is controlled via CSS to allow proper sizing in different rendering contexts (e.g. PDF export)
                        // height: 'auto',
                        // objectFit: 'contain',
                        display: 'block',
                        cursor: isWidthRightMenu ? 'pointer' : undefined,
                    }}
                    onClick={handleImageClick}
                />
            ) : (
                <ImagePlaceholder
                    imageUrl={imageUrl}
                    onClearImage={onClearImage || (() => {})}
                    onUpdateLink={onUpdateLink || (() => {})}
                    isWidthRightMenu={isWidthRightMenu}
                    elementId={elementId}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                    itemId={itemId}
                />
            )}
        </div>
    );
};

export default Image;
