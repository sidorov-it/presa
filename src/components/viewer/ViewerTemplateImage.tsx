import React from 'react';

interface ViewerTemplateImageProps {
    templateType: string;
    imageUrl?: string;
    imageStyle: React.CSSProperties;
}

const ViewerTemplateImage: React.FC<ViewerTemplateImageProps> = ({
    templateType,
    imageUrl,
    imageStyle,
}) => {
    if (!templateType || templateType === 'imageBackground' || !imageStyle) {
        return null;
    }

    return (
        <div
            style={{
                ...imageStyle,
                backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
            }}
            aria-hidden="true"
        />
    );
};

export default ViewerTemplateImage; 