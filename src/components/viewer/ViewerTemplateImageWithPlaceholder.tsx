import React from 'react';
import SimpleImagePlaceholder from '@/components/ui/SimpleImagePlaceholder/SimpleImagePlaceholder';

interface ViewerTemplateImageWithPlaceholderProps {
    templateType: string;
    imageUrl?: string;
    imageStyle: React.CSSProperties;
    showPlaceholder?: boolean;
}

const ViewerTemplateImageWithPlaceholder: React.FC<ViewerTemplateImageWithPlaceholderProps> = ({
    templateType,
    imageUrl,
    imageStyle,
    showPlaceholder = false,
}) => {
    if (!templateType || templateType === 'imageBackground' || !imageStyle) {
        return null;
    }

    // If we have an image URL, show the image
    if (imageUrl) {
        return (
            <div
                style={{
                    ...imageStyle,
                    backgroundImage: `url(${imageUrl})`,
                }}
                aria-hidden="true"
            />
        );
    }

    // If no image URL and we should show placeholder, show it
    if (showPlaceholder) {
        return (
            <div style={imageStyle}>
                <SimpleImagePlaceholder />
            </div>
        );
    }

    // Otherwise, show nothing (viewer mode behavior)
    return null;
};

export default ViewerTemplateImageWithPlaceholder;
