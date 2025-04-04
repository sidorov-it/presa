import { Element } from '@/types';
import { ViewerElement } from '@/types/elements';

interface ElementViewerProps {
    element: Element & ViewerElement;
    slideId: string;
    layoutId: string;
}

const ElementViewer = ({ element }: ElementViewerProps) => {
    // Render element based on its type
    const renderElementContent = () => {
        console.log(element.type);
        switch (element.type) {
            case 'text':
            case 'heading':
            case 'paragraph':
            case 'editor':
                // For text elements, render HTML content from 'content' property
                return (
                    <div
                        className="w-full h-full tiptap"
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                        style={{
                            ...element.style,
                        }}
                    />
                );

            case 'image':
                // For image elements, render the image
                return (
                    <div className="w-full h-full flex items-center justify-center">
                        <img
                            src={element.url || ''}
                            alt={element.alt || 'Presentation image'}
                            className="max-w-full max-h-full object-contain"
                            style={{
                                ...element.style,
                            }}
                        />
                    </div>
                );

            case 'shape':
                // For shape elements, render the shape based on 'shapeType' property
                return (
                    <div
                        className="w-full h-full"
                        style={{
                            ...element.style,
                        }}
                    >
                        {/* Render shape based on shapeType */}
                        {element.shapeType === 'rectangle' && (
                            <div
                                className="w-full h-full"
                                style={{
                                    backgroundColor: element.backgroundColor || '#000000',
                                    borderRadius: element.borderRadius || '0px',
                                }}
                            />
                        )}
                        {element.shapeType === 'circle' && (
                            <div
                                className="w-full h-full rounded-full"
                                style={{
                                    backgroundColor: element.backgroundColor || '#000000',
                                }}
                            />
                        )}
                        {element.shapeType === 'triangle' && (
                            <div
                                className="w-full h-full"
                                style={{
                                    width: '0',
                                    height: '0',
                                    borderLeft: '50px solid transparent',
                                    borderRight: '50px solid transparent',
                                    borderBottom: `100px solid ${element.backgroundColor || '#000000'}`,
                                }}
                            />
                        )}
                    </div>
                );

            default:
                // For unsupported element types, render a placeholder
                return (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Unsupported element type
                    </div>
                );
        }
    };

    return (
        <div
            className="w-full h-full"
            style={{
                top: `${element.position?.y || 0}px`,
                left: `${element.position?.x || 0}px`,
                width: `${element.size?.width ? `${element.size?.width}px` : 'auto'}`,
                height: `${element.size?.height ? `${element.size?.height}px` : 'auto'}`,
                zIndex: element.zIndex || 0,
                transform: element.transform || 'none',
                // opacity: element.opacity !== undefined ? element.opacity : 1,
            }}
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer; 