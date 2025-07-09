import Portal from '@/components/Portal';
import { BsMagic } from 'react-icons/bs';
import { FaFlask } from 'react-icons/fa';
import { useColorMode } from '@/components/ui/color-mode';
import { useEffect, useState } from 'react';

import styles from './SlideBottomButtons.module.css';

interface SlideBottomButtonsProps {
    isShow: boolean;
    slideRef: React.RefObject<HTMLDivElement>;
    isLast: boolean;
    handleAddSlideAfter: (e: React.MouseEvent<HTMLButtonElement>) => void;
    handleAddSlideWithAI: (e: React.MouseEvent<HTMLButtonElement>) => void;
    handleTestTemplate?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SlideBottomButtons({
    isShow,
    slideRef,
    isLast,
    handleAddSlideAfter,
    handleAddSlideWithAI,
    handleTestTemplate,
}: SlideBottomButtonsProps) {
    const { colorMode } = useColorMode();
    const [buttonPosition, setButtonPosition] = useState(0);

    // Функция для пересчета позиции кнопок
    const updateButtonPosition = () => {
        if (slideRef.current) {
            const position = slideRef.current.getBoundingClientRect().bottom + window.scrollY - (isLast ? 58 : 34);
            setButtonPosition(position);
        }
    };

    useEffect(() => {
        if (!slideRef.current) return;

        // Создаем observer для отслеживания изменений в DOM
        const observer = new MutationObserver(mutations => {
            // Проверяем, изменились ли размеры или содержимое
            const hasRelevantChanges = mutations.some(
                mutation =>
                    mutation.type === 'childList' || mutation.type === 'characterData' || mutation.type === 'attributes'
            );

            if (hasRelevantChanges) {
                updateButtonPosition();
            }
        });

        // Настраиваем observer для отслеживания всех возможных изменений
        observer.observe(slideRef.current, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });

        // Инициализируем начальную позицию
        updateButtonPosition();

        // Добавляем слушатель изменения размера окна
        window.addEventListener('resize', updateButtonPosition);
        // Добавляем слушатель прокрутки
        window.addEventListener('scroll', updateButtonPosition);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateButtonPosition);
            window.removeEventListener('scroll', updateButtonPosition);
        };
    }, [slideRef, isLast]);

    return (
        <Portal>
            <div
                className={`${styles.slideDivider} ${isShow ? styles.slideDividerHovered : ''}`}
                style={{
                    top: buttonPosition,
                }}
            >
                <div className={`${styles.buttons}${colorMode === 'dark' ? ' dark' : ''}`}>
                    <button
                        className={styles.slideDividerButton}
                        onClick={handleAddSlideAfter}
                        aria-label="Добавить слайд"
                    >
                        +
                    </button>
                    <button
                        className={`${styles.slideDividerButton} ${styles.aiButton}`}
                        onClick={handleAddSlideWithAI}
                        aria-label="Создать слайд с помощью ИИ"
                    >
                        <BsMagic />
                    </button>
                    {handleTestTemplate && process.env.NODE_ENV === 'development' && (
                        <button
                            className={`${styles.slideDividerButton} ${styles.testButton}`}
                            onClick={handleTestTemplate}
                            aria-label="Тестировать шаблон"
                        >
                            <FaFlask />
                        </button>
                    )}
                </div>
            </div>
        </Portal>
    );
}
