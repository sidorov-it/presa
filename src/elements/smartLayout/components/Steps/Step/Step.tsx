import { RefObject } from 'react';
import styles from '../Steps.module.css';
import { SmartLayoutElement, TipTapRefs } from '@/types';
import { Tiptap } from '@/components/tiptap/Tiptap';
import { HiPlus } from 'react-icons/hi';
import { usePresentationStore } from '@/store/presentationStore';

interface StepProps {
    align: string;
    direction: string;
    index: number;
    isReadOnly: boolean;
    elementId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    presentationId: string;
    slideId: string;
    layoutId: string;
    isLast: boolean;
    addItem: () => void;
    handleContentChange: (itemId: string, type: string) => (content: string) => void;
    itemId: string;
}

export default function Step({
    align,
    direction,
    index,
    isReadOnly,
    elementId,
    tiptapRefs,
    presentationId,
    slideId,
    layoutId,
    isLast,
    itemId,
    addItem,
    handleContentChange,
}: StepProps) {
    const stepBackground = usePresentationStore(state => {
        const element = state.getElement(presentationId, slideId, layoutId, elementId) as SmartLayoutElement;
        return element.items[index].backgroundColor;
    });

    return (
        <div
            className={`${styles.textBox} ${align ? styles[align] : ''} ${direction === 'vertical' ? styles.vertical : ''}`}
            style={{
                paddingLeft: direction === 'vertical' ? `${index * 32}px` : undefined,
                paddingTop: direction === 'horizontal' ? `${index * 32}px` : undefined,
            }}
        >
            <div
                className={styles.step}
                style={{ '--custom-block-background': stepBackground } as React.CSSProperties}
            />
            <div className={styles.textBoxContent}>
                <Tiptap
                    isReadOnly={isReadOnly}
                    elementId={elementId}
                    tiptapRefs={tiptapRefs}
                    id={elementId}
                    placeholder="Заголовок"
                    onContentChange={handleContentChange(itemId, 'title')}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                    customRefKey={`title-${elementId}-${itemId}`}
                    isHideSlashMenu={true}
                />
                <Tiptap
                    isReadOnly={isReadOnly}
                    elementId={elementId}
                    tiptapRefs={tiptapRefs}
                    id={elementId}
                    presentationId={presentationId}
                    slideId={slideId}
                    layoutId={layoutId}
                    placeholder="Текст"
                    onContentChange={handleContentChange(itemId, 'text')}
                    customRefKey={`text-${elementId}-${itemId}`}
                    isHideSlashMenu={true}
                    onEnterPressed={() => {
                        return true;
                    }}
                />
            </div>
            {!isReadOnly && isLast && (
                <div className={styles.addButton} onClick={addItem}>
                    <HiPlus style={{ width: '1rem', height: '1rem' }} />
                </div>
            )}
        </div>
    );
}
