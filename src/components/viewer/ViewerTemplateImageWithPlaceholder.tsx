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
    const borderRaduisStyles: React.CSSProperties = {};

    switch (templateType) {
        case 'imageTop':
            borderRaduisStyles.borderTopLeftRadius = 'var(--presentation-slide-border-radius)';
            borderRaduisStyles.borderTopRightRadius = 'var(--presentation-slide-border-radius)';
            break;
        case 'imageLeft':
            borderRaduisStyles.borderTopLeftRadius = 'var(--presentation-slide-border-radius)';
            borderRaduisStyles.borderBottomLeftRadius = 'var(--presentation-slide-border-radius)';
            break;
        case 'imageRight':
            borderRaduisStyles.borderTopRightRadius = 'var(--presentation-slide-border-radius)';
            borderRaduisStyles.borderBottomRightRadius = 'var(--presentation-slide-border-radius)';
            break;
    }

    // If we have an image URL, show the image
    if (imageUrl) {
        return (
            <div
                style={{
                    ...imageStyle,
                    backgroundImage: `url(${imageUrl})`,
                    ...borderRaduisStyles,
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
