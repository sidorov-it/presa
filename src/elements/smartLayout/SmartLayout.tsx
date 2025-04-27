import React, { RefObject, useCallback } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import { FaCircle } from 'react-icons/fa';
import { SmartLayoutElement, SmartLayoutItem, TipTapRefs } from '@/types';
import ImagesWithText from '@/elements/smartLayout/components/ImagesWithText/ImagesWithText';
import TextBoxes from '@/elements/smartLayout/components/TextBoxes/TextBoxes';

interface SmartLayoutProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    isFocused: boolean;
}

const SmartLayout: React.FC<SmartLayoutProps> = ({
    elementId,
    presentationId,
    slideId,
    layoutId,
    tiptapRefs,
    isFocused,
}) => {
    const layoutType = usePresentationStore(store => {
        const element = store.getElement(presentationId, slideId, layoutId, elementId);
        return (element as SmartLayoutElement).layoutType;
    });

    // const element = usePresentationStore(store =>
    //     store.getElement(presentationId, slideId, layoutId, elementId)
    // ) as SmartLayoutElement;

    // const { layoutType = 'images-with-text', items = [] } = element;

    const handleAddItem = () => {
        // const newItem: SmartLayoutItem = {
        //     id: Math.random().toString(36).substr(2, 9),
        //     content: 'New item',
        // };
        // setProps({ ...props, items: [...items, newItem] });
    };

    const handleUpdateItem = (id: string, content: string) => {
        // const updatedItems = items.map((item: SmartLayoutItem) => (item.id === id ? { ...item, content } : item));
        // setProps({ ...props, items: updatedItems });
    };

    const renderBulletsList = () => (
        <ul className="list-none space-y-2">
            {items.map((item: SmartLayoutItem) => (
                <li key={item.id} className="flex items-center gap-2">
                    <FaCircle className="w-2 h-2 text-gray-400" />
                    <input
                        type="text"
                        value={item.content}
                        onChange={e => handleUpdateItem(item.id, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:outline-none"
                    />
                </li>
            ))}
        </ul>
    );

    const renderNumbersList = () => (
        <ol className="list-decimal list-inside space-y-2">
            {items.map((item: SmartLayoutItem, index: number) => (
                <li key={item.id} className="flex items-center gap-2">
                    <span className="text-gray-400">{index + 1}.</span>
                    <input
                        type="text"
                        value={item.content}
                        onChange={e => handleUpdateItem(item.id, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:outline-none"
                    />
                </li>
            ))}
        </ol>
    );

    const renderGrid = () => (
        <div className="grid grid-cols-2 gap-4">
            {items.map((item: SmartLayoutItem) => (
                <div key={item.id} className="p-4 border rounded">
                    <input
                        type="text"
                        value={item.content}
                        onChange={e => handleUpdateItem(item.id, e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none"
                    />
                </div>
            ))}
        </div>
    );

    const renderTimeline = () => (
        <div className="space-y-4">
            {items.map((item: SmartLayoutItem, index: number) => (
                <div key={item.id} className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                        {index < items.length - 1 && <div className="absolute top-4 w-0.5 h-full bg-blue-200" />}
                    </div>
                    <input
                        type="text"
                        value={item.content}
                        onChange={e => handleUpdateItem(item.id, e.target.value)}
                        className="flex-1 bg-transparent border-none focus:outline-none"
                    />
                </div>
            ))}
        </div>
    );

    const renderImageWithText = () => {
        return <div>Image Text Grid</div>;
    };

    const renderLayout = useCallback(() => {
        switch (layoutType) {
            case 'images-with-text':
                return (
                    <ImagesWithText
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
            case 'text-boxes':
                return (
                    <TextBoxes
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
            // case 'bullets':
            //     return renderBulletsList();
            // case 'numbers':
            //     return renderNumbersList();
            // case 'grid':
            //     return renderGrid();
            // case 'timeline':
            //     return renderTimeline();
            default:
                return (
                    <ImagesWithText
                        elementId={elementId}
                        tiptapRefs={tiptapRefs}
                        presentationId={presentationId}
                        slideId={slideId}
                        layoutId={layoutId}
                        isFocused={isFocused}
                    />
                );
        }
    }, [elementId, isFocused, layoutId, layoutType, presentationId, slideId, tiptapRefs]);

    return (
        <div>
            {renderLayout()}
            {/* <button onClick={handleAddItem} className="mt-4 flex items-center gap-2 text-blue-500 hover:text-blue-600">
                <FaPlus className="w-4 h-4" />
                <span>Add item</span>
            </button> */}
        </div>
    );
};

export default SmartLayout;
