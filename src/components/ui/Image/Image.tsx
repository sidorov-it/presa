/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import { ImagePlaceholder } from '../ImagePlaceholder/ImagePlaceholder';
import React, { useState } from 'react';
import { useMenuStore } from '@/store/menuStore';
import { useReadOnly } from '@/contexts/ReadOnlyContext';

export type ImageProps = {
    imageUrl: string;
    alt?: string;
    onClearImage?: () => void;
    onUpdateLink?: (link: string, uploaded: boolean) => void;
    isWidthRightMenu?: boolean;
    className?: string;
    style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;

export const Image: React.FC<ImageProps> = ({
    imageUrl,
    alt = '',
    onClearImage,
    onUpdateLink,
    isWidthRightMenu = false,
    className = '',
    style = {},
    ...rest
}) => {
    const [isOpenImageEditBox, setIsOpenImageEditBox] = useState(false);

    const handleImageClick = () => {
        if (isWidthRightMenu) {
            setIsOpenImageEditBox(true);
            useMenuStore.getState().openSideMenu('image-edit', {
                imageUrl,
                onClearImage,
                onUpdateLink,
                onCloseMenu: () => setIsOpenImageEditBox(false),
            });
        }
    };

    const isReadOnly = useReadOnly();

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
                        height: 'auto',
                        objectFit: 'contain',
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
                />
            )}
        </div>
    );
};

export default Image;
