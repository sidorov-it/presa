import React, { useState, useRef, useEffect, useCallback, MutableRefObject } from 'react';
import styles from './AIEditButton.module.css';
import { TipTapRefs } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import { toast } from 'sonner';
import { BsMagic } from 'react-icons/bs';
import { markdownToHtml } from '@/utils/markdownToHtml';
// import extractTextFromElement from '@/utils/extractTextFromElement';

interface AIEditButtonProps {
    presentationId: string;
    slideId: string;
    className?: string;
    isHovered: boolean;
    isSelected: boolean;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const AIEditButton: React.FC<AIEditButtonProps> = ({
    presentationId,
    slideId,
    className = '',
    isHovered,
    isSelected,
    tiptapRefs,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Show button animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    // Handle click outside to close popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                buttonRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    }, []);

    const handleImproveWriting = async () => {
        try {
            setIsLoading(true);
            // Получаем текущий текст слайда
            const slide = usePresentationStore.getState().getSlide(presentationId, slideId);
            if (!slide) return;

            // Собираем весь текст из всех текстовых элементов слайда
            // const slideText = slide.layouts
            //     .flatMap(layout => layout.elements)
            //     .map(element => extractTextFromElement(element as unknown as Element))
            //     .join('\n');

            // if (!slideText.trim()) {
            //     toast.error('На слайде нет текста для улучшения');
            //     return;
            // }

            const response = await fetch('/api/ai/improve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // text: slideText,
                    slideId,
                    presentationId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to improve text');
            }

            const data = await response.json();

            console.log('Improved text:', data);
            const updatedContent = Object.entries(data.content).map(entry => {
                const [key, value] = entry;
                const indexDash = key.indexOf('-');
                let elementId;
                if (indexDash !== -1) {
                    elementId = key.slice(0, indexDash);
                } else {
                    elementId = key;
                }
                const slotId = key.slice(indexDash + 1);

                // Преобразуем Markdown -> HTML для TipTap
                const markdown = Array.isArray(value) ? (value as string[]).join('\n') : (value as string);
                const htmlContent = markdownToHtml(markdown);

                return {
                    slotId,
                    elementId,
                    content: htmlContent,
                };
            });
            // Обновляем текст в слайде
            usePresentationStore.getState().updateSlideContent(presentationId, slideId, updatedContent, tiptapRefs);

            toast.success('Текст успешно улучшен');
            setIsOpen(false);
        } catch (error) {
            console.error('Error improving text:', error);
            toast.error('Не удалось улучшить текст');
        } finally {
            setIsLoading(false);
        }
    };

    const buttonStyle: React.CSSProperties = {
        border: '1px solid #666',
        backgroundColor: 'white',
        color: '#333',
        opacity: isVisible ? 1 : 0,
    };

    return (
        <>
            {(isHovered || isSelected || isOpen) && (
                <div
                    ref={buttonRef}
                    className={`${styles.aiButton} ${className}`}
                    style={buttonStyle}
                    onClick={handleClick}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Редактировать с помощью ИИ"
                    title="Редактировать с помощью ИИ"
                    data-ai-button={slideId}
                >
                    <BsMagic />
                </div>
            )}

            {isOpen && (
                <div ref={popupRef} style={{ display: isOpen ? 'block' : 'none' }} className={styles.popup}>
                    <div className={styles.aiOptions}>
                        <button className={styles.aiOption} onClick={handleImproveWriting} disabled={isLoading}>
                            <span>Улучшить текст</span>
                        </button>
                        <button className={styles.aiOption}>
                            <span>Исправить орфографию</span>
                        </button>
                        <button className={styles.aiOption}>
                            <span>Перевести</span>
                        </button>
                        <button className={styles.aiOption}>
                            <span>Сделать длиннее</span>
                        </button>
                        <button className={styles.aiOption}>
                            <span>Сделать короче</span>
                        </button>
                        <button className={styles.aiOption}>
                            <span>Упростить язык</span>
                        </button>
                        <button className={styles.aiOption}>
                            <span>Добавить подробностей</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIEditButton;
