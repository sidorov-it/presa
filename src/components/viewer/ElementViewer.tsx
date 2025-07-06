'use client';
import { ChartElement, Element, ImageElement, SmartLayoutElement } from '@/types';
import { ViewerElement } from '@/types/elements';
import ChartComponent from '@/elements/chart/ChartComponent';

import styles from './ElementViewer.module.css';
import { ElementType } from '@/types/elements';
import { getBlockColors } from '@/utils/colors';
import { BoxIconOptions } from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxIconOptions';
import SmartLayoutView from '@/elements/smartLayout/SmartLayoutView';

import { Theme } from '@/types/theme';
import ImageComponentView from '@/elements/image/ImageComponentView';

interface ElementViewerProps {
    element: Element & ViewerElement;
    slideId: string;
    layoutId: string;
    slideBackground?: string;
    primaryAccentColor?: string;
    theme: Theme;
    isTable?: boolean;
}

const ElementViewer = ({
    element,
    slideId,
    layoutId,
    slideBackground,
    primaryAccentColor,
    theme,
    isTable,
}: ElementViewerProps) => {
    // Get element-specific styles
    // const getElementStyles = () => {
    //     const baseStyles: React.CSSProperties = {
    //         // Apply base element styles
    //         // width: '100%',
    //         // height: '100%',
    //     };

    //     // Apply opacity if defined
    //     if (element.opacity !== undefined) {
    //         baseStyles.opacity = element.opacity;
    //     }

    //     // Apply background color if defined
    //     if (element.backgroundColor) {
    //         baseStyles.backgroundColor = element.backgroundColor;
    //     }

    //     // Apply border radius if defined
    //     if (element.borderRadius) {
    //         baseStyles.borderRadius = element.borderRadius;
    //     }

    //     return baseStyles;
    // };

    const renderChart = () => {
        const chartElement = element as ChartElement;
        return (
            <ChartComponent
                element={chartElement}
                slideBackground={slideBackground}
                theme={theme}
                isReadOnly={true}
                layoutId={layoutId}
            />
        );
    };

    // Render element based on its type
    const renderElementContent = () => {
        switch (element.elementTypeId) {
            case ElementType.TEXT:
            case ElementType.QUOTE:
                // For text elements, render HTML content from 'content' property with theme styles
                return (
                    <div
                        className={`tiptap ProseMirror not-prose ${styles.viewerTiptap}`}
                        // style={getTextStyles()}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case ElementType.IMAGE:
                // For image elements, render the image
                return (
                    <div className={styles.container}>
                        {!element.url && !(element as any).src && <div style={{ width: '100%', height: '100%' }} />}
                        {(element.url || (element as any).src) && (
                            <ImageComponentView element={element as ImageElement} />
                        )}
                    </div>
                );

            case ElementType.CHART:
                return renderChart();

            case ElementType.SMART_LAYOUT: {
                // For smart layout elements, render the layout with its items
                // const smartLayout = element as unknown as SmartLayoutElement;
                // return (
                //     <div className={styles.smartLayout} data-test="smart-layout">
                //         {smartLayout.items?.map((item: SmartLayoutItem) => (
                //             <div key={item.id} className={styles.smartLayoutItem}>
                //                 {item.imageUrl && (
                //                     <img
                //                         src={item.imageUrl}
                //                         alt={item.title || 'Item image'}
                //                         className={styles.smartLayoutItemImage}
                //                     />
                //                 )}
                //                 {item.title && (
                //                     <span
                //                         dangerouslySetInnerHTML={{ __html: item.title }}
                //                         className={styles.smartLayoutItemTitle}
                //                     />
                //                 )}
                //                 {item.text && (
                //                     <span
                //                         dangerouslySetInnerHTML={{ __html: item.text }}
                //                         className={styles.smartLayoutItemDescription}
                //                     />
                //                 )}
                //             </div>
                //         ))}
                //     </div>
                // );
                return (
                    <SmartLayoutView
                        element={element as SmartLayoutElement}
                        presentationId={''}
                        slideId={slideId}
                        layoutId={layoutId}
                        tiptapRefs={null}
                        isFocused={false}
                    />
                );
            }

            case ElementType.TABLE:
                // For table elements, render HTML content with table styling
                return (
                    <div
                        className={`tiptap ProseMirror viewer-tiptap ${styles.table}`}
                        dangerouslySetInnerHTML={{ __html: element.content || '' }}
                    />
                );

            case ElementType.BOX: {
                // For box elements, render a styled container with content using new color logic
                const boxElement = element as Element &
                    ViewerElement & {
                        customBackgroundColor?: string;
                        darkBackgroundColor?: string;
                        darkColor?: string;
                        iconType?: string;
                    };

                // Determine block type based on iconType or elementVariant
                const blockType = boxElement.iconType || element.elementVariant || 'info-box';

                // Get colors using new logic
                const blockColors = getBlockColors(primaryAccentColor!, blockType, {
                    blockBgColor: boxElement.customBackgroundColor || boxElement.backgroundColor,
                    iconColor: (boxElement as any).iconColor,
                    textColor: (boxElement as any).textColor,
                });

                // Get icon component
                const IconInfo = BoxIconOptions.find(option => option.id === boxElement.iconType);
                const IconComponent = IconInfo?.Icon;

                return (
                    <div
                        className={styles.box}
                        style={{
                            // ...getElementStyles(),
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '1em',
                            padding: '1.25em',
                            backgroundColor: blockColors.blockBgColor,
                            color: blockColors.textColor,
                        }}
                    >
                        {IconComponent && boxElement.iconType !== 'without-icon' && (
                            <span className={styles.boxIcon}>
                                <IconComponent color={blockColors.iconColor} size="1.25em" />
                            </span>
                        )}
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                            dangerouslySetInnerHTML={{ __html: element.content || '' }}
                        />
                    </div>
                );
            }

            default:
                // For unsupported element types, render a placeholder
                return <div className={styles.container}>Unsupported element type: {element.elementTypeId}</div>;
        }
    };

    return (
        <div
            style={{
                // ...getElementStyles(),
                margin: isTable ? '0.4em 0 0.3em' : '0.9em 0',
                zIndex: 0,
                transform: element.transform || 'none',
                fontSize: 'var(--font-size)',
            }}
        >
            {renderElementContent()}
        </div>
    );
};

export default ElementViewer;
