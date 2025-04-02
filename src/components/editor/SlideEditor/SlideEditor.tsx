/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client'

import React, { useState, useRef, RefObject } from 'react';
import { EditorElement, getPredefinedGridStructures, Layout, Slide, TipTapRefs } from '@/types';
import { usePresentationStore } from '@/store/presentationStore';
import styles from './SlideEditor.module.css';
import LayoutContent from '../LayoutContent/LayoutContent';
import { useSlideMenu } from '@/contexts/SlideMenuContext';
import { generateId } from '@/utils/id';
import { DragDropTransactionHelper } from '@/contexts/DragDropTransactionHelper';
import DragHandler from '../DragHandler';

interface SlideEditorProps {
    slide: Slide;
    presentationId: string;
    handleSelectSlide: (slideId: string) => void;
    isSelected: boolean;
    tiptapRefs: RefObject<TipTapRefs>;
}

export const getColumnWidths = (columnsCount: number): string[] => {
    if (columnsCount === 0) {
        return [];
    } else if (columnsCount === 3) {
        return ['33%', '34%', '33%'];
    } else {
        return new Array(columnsCount).fill(`${100 / columnsCount}%`);
    }
}

const SlideEditor: React.FC<SlideEditorProps> = ({
    slide,
    tiptapRefs,
    presentationId,
    // handleSelectSlide,
    // isSelected,
}) => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const [isSelected, setIsSelected] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const { openMenu, state: { slideId: menuSlideId, elementId: menuElementId, layoutId: menuLayoutId } } = useSlideMenu();

    const { addSlide } = usePresentationStore();

    // Обработчик для выбора элемента
    const handleSelectElement = (elementId: string) => {
        setSelectedElementId(elementId);
    };

    // Обработчик для удаления элемента
    const handleDeleteElement = (layoutId: string, elementId: string) => {
        usePresentationStore.getState().deleteElement(presentationId, slide.id, layoutId, elementId);
        if (selectedElementId === elementId) {
            setSelectedElementId(null);
        }
    };

    // Обработчик для добавления нового слайда после текущего
    const handleAddSlideAfter = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        // Получаем презентацию из хранилища
        const presentation = usePresentationStore.getState().getPresentation(presentationId);

        if (!presentation) return;

        // Находим индекс текущего слайда
        const currentSlideIndex = presentation.slides.findIndex((s: Slide) => s.id === slide.id);

        if (currentSlideIndex === -1) return;

        const newSlideIndex = presentation.slides.findIndex((s: Slide) => s.id === slide.id) + 1;

        // Добавляем новый слайд
        addSlide(presentationId, newSlideIndex);

        // Перемещаем новый слайд на позицию после текущего

        // usePresentationStore.getState().reorderSlides(
        //     presentationId,
        //     newSlideIndex,
        //     currentSlideIndex + 1
        // );

        // Выбираем новый слайд
        // handleSelectSlide(newSlideId);
    };

    // Обработчик для открытия меню слайда
    const handleOpenSlideMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        openMenu(slide.id, null, 'slide');
    };

    // Получаем стиль фона слайда
    const getBackgroundStyle = () => {
        if (slide.background?.type === 'color') {
            return { backgroundColor: slide.background.value };
        } else if (slide.background?.type === 'image') {
            return {
                backgroundImage: `url(${slide.background.value})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }
        return {};
    };

    // Определяем классы для слайда
    const getSlideClassName = () => {
        let className = styles.slideWrapper;

        if (isSelected) {
            className += ` ${styles.slideSelected}`;
        }

        return className;
    };

    const slideMenuOpen = menuSlideId === slide.id && menuElementId === null && menuLayoutId === null;

    const handleSlideWrapperClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsSelected(true);

        const handleDocumentClick = (event: MouseEvent) => {
            if (event.target instanceof HTMLElement && !event.target.closest('[data-slide-id]') && event.target.getAttribute('data-slide-drag-handle') !== slide.id) {
                setIsSelected(false);
                document.removeEventListener('click', handleDocumentClick);
            }
        }
        document.addEventListener('click', handleDocumentClick);

        return () => {
            document.removeEventListener('click', handleDocumentClick);
        }
    }

    const handleSlideClick = (e: React.MouseEvent) => {
        const rect = editorRef.current?.getBoundingClientRect();
        if (rect) {
            const positionY = e.clientY - (rect.top ?? 0);
            const slideHeight = rect.height ?? 0;
            const isClickBottom = slideHeight - positionY < 30;

            if (isClickBottom) {
                createDefaultLayout();
            }
        }
    };

    // Создание макета по умолчанию с одним редактором
    const createDefaultLayout = () => {
        // Создаем новый макет с одной ячейкой

        const gridStructure = getPredefinedGridStructures('single-column');

        const cellId = gridStructure.rows[0].cells[0].id;

        const editorElement: EditorElement = {
            id: generateId(8),
            type: 'editor',
            content: '',
            position: { x: 0, y: 0 },
            size: { width: 100, height: 40 },
            style: { fontSize: '16px', color: '#333333' },
            zIndex: 1,
            placeholder: '',
            cellId
        };

        const newLayout: Omit<Layout, 'id'> = {
            type: 'single-column',
            elements: [editorElement],
            style: {},
            gridStructure
        };


        DragDropTransactionHelper.addLayout(presentationId, slide.id, newLayout, slide.layouts.length);

        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('focus_editor', { bubbles: true, cancelable: true, detail: { editorId: editorElement.id } }));
        }, 100);
        // addLayout(presentationId, slide.id, newLayout);
    };

    return (
        <div
            className={`${styles.slide} `}
            onClick={handleSlideWrapperClick}
            onMouseEnter={() => {
                setIsHovered(true);
            }}
            onMouseLeave={() => {
                setIsHovered(false);
            }}
        >
            <div className={`${getSlideClassName()} themed-slide`}>
                <div className={`${styles.slideBorder} ${((isSelected || isHovered) && !slideMenuOpen) ? styles.slideBorderSelected : ''} ${slideMenuOpen ? styles.slideBorderMenuOpen : ''}`} />
                <div
                    ref={editorRef}
                    className={`${styles.slideContent} themed-card`}
                    style={{
                        // ...slide.style,
                        // ...getBackgroundStyle(),
                        // borderRadius: 'var(--slide-border-radius)',
                        // boxShadow: 'var(--slide-shadow)',
                        // border: 'var(--slide-border)',
                        // borderColor: 'var(--slide-border-color)',
                    }}
                    onClick={() => { }}
                >
                    {(isSelected || slideMenuOpen || isHovered) && (
                        <DragHandler
                            className={styles.slideDragHandle}
                            slideId={slide.id}
                            isActive={slideMenuOpen}
                            ariaLabel="Открыть меню слайда"
                            data-slide-drag-handle={slide.id}
                            handleClick={handleOpenSlideMenu}
                            handleKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleOpenSlideMenu(e as unknown as React.MouseEvent<HTMLDivElement>);
                                }
                            }}
                            handleDragStart={(e) => {
                                e.preventDefault();
                            }}
                        />
                    )}

                    <div className="relative w-full h-full p-8 themed-text" data-slide-id={slide.id} onClick={handleSlideClick}>
                        {slide.layouts.map((layout: Layout) => (
                            <LayoutContent
                                key={layout.id}
                                layout={layout}
                                onSelectElement={handleSelectElement}
                                onDeleteElement={handleDeleteElement}
                                tiptapRefs={tiptapRefs}
                                presentationId={presentationId}
                                slideId={slide.id}
                            />
                        ))}
                    </div>

                    <div className={`${styles.slideDivider} ${isSelected || isHovered ? styles.slideDividerHovered : ''}`}>
                        <div className={styles.buttons}>
                            <button
                                className={`${styles.slideDividerButton} themed-button`}
                                onClick={handleAddSlideAfter}
                                aria-label="Добавить слайд"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* The SlideMenu component will render itself when the menu is open */}
            {/* <SlideMenu /> */}
        </div>
    );
};

export default SlideEditor;