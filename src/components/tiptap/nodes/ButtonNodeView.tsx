import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { createPortal } from 'react-dom';
import ButtonMenu from '@/components/editor/Menus/ButtonMenu';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';

const MENU_WIDTH = 300; // Ширина меню в пикселях (должна совпадать с CSS)
const MARGIN = 16; // Отступ от краев экрана

const ButtonNodeView: React.FC<NodeViewProps> = ({
    node,
    updateAttributes,
    deleteNode,
    editor
}) => {
    // Создаем контейнер для портала и ссылку на меню
    const menuRef = useRef<HTMLDivElement>(null);
    const portalContainerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Состояние меню
    const [showMenu, setShowMenu] = useState(false);

    // Сохраняем предыдущее значение alignment для отслеживания изменений
    const prevAlignmentRef = useRef(node.attrs.alignment);

    // Ensure node has a valid elementId
    useEffect(() => {
        if (!node.attrs.elementId) {
            // Generate a new ID and update the node attributes
            const newElementId = generateId();
            console.log('Generated new elementId for button node:', newElementId);
            updateAttributes({ elementId: newElementId });
        }
    }, [node.attrs.elementId, updateAttributes]);

    // Расчет оптимального положения меню относительно кнопки и границ экрана
    const positionMenu = useCallback(() => {
        if (!menuRef.current || !showMenu || !buttonRef.current) return;

        const menuElement = menuRef.current;
        const buttonElement = buttonRef.current;

        const buttonRect = buttonElement.getBoundingClientRect();
        const menuWidth = MENU_WIDTH;
        const menuHeight = menuElement.offsetHeight;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Расчет позиции по горизонтали (центрирование по кнопке)
        let left = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2);

        // Проверка, не выходит ли за правый край
        if (left + menuWidth + MARGIN > windowWidth) {
            left = windowWidth - menuWidth - MARGIN;
        }

        // Проверка, не выходит ли за левый край
        if (left < MARGIN) {
            left = MARGIN;
        }

        // Расчет позиции по вертикали (по умолчанию под кнопкой)
        let top = buttonRect.bottom + 8; // Небольшой отступ от кнопки
        let position = 'bottom';

        // Проверка, достаточно ли места снизу
        if (top + menuHeight + MARGIN > windowHeight) {
            // Если снизу нет места, показываем меню над кнопкой
            top = buttonRect.top - menuHeight - 8;
            position = 'top';

            // Если и сверху недостаточно места, показываем прямо на уровне кнопки
            if (top < MARGIN) {
                top = MARGIN;
                position = 'overlay';
            }
        }

        // Применяем позицию к меню
        menuElement.style.position = 'fixed';
        menuElement.style.zIndex = '1000';
        menuElement.style.left = `${left}px`;
        menuElement.style.top = `${top}px`;

        // Добавляем дата-атрибут для возможного CSS-стилизования в зависимости от позиции
        menuElement.dataset.position = position;

    }, [showMenu]);

    // Обработчик кликов для закрытия меню при клике вне его и компонента
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (!showMenu) return;
            
            // Проверяем, был ли клик вне меню и кнопки
            const clickedElement = e.target as Node;
            const menuElement = menuRef.current;
            const buttonElement = buttonRef.current;
            const wrapperElement = wrapperRef.current;
            
            // Если меню или кнопка не существуют, закрываем меню
            if (!menuElement || !buttonElement) {
                setShowMenu(false);
                return;
            }
            
            // Если клик был вне меню, кнопки и обертки компонента - закрываем меню
            const isClickInsideMenu = menuElement.contains(clickedElement);
            const isClickInsideButton = buttonElement.contains(clickedElement);
            const isClickInsideWrapper = wrapperElement && wrapperElement.contains(clickedElement);
            
            if (!isClickInsideMenu && !isClickInsideButton && !isClickInsideWrapper) {
                setShowMenu(false);
            }
        };
        
        // Добавляем обработчик клика
        document.addEventListener('mousedown', handleOutsideClick);
        
        // Удаляем обработчик при размонтировании
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [showMenu]);

    // Слежение за изменениями атрибутов кнопки
    useEffect(() => {
        // Если выравнивание изменилось и меню открыто, пересчитываем позицию
        if (prevAlignmentRef.current !== node.attrs.alignment && showMenu) {
            // Даем небольшую задержку, чтобы DOM успел обновиться
            setTimeout(positionMenu, 10);
        }
        
        // Обновляем сохраненное значение
        prevAlignmentRef.current = node.attrs.alignment;
    }, [node.attrs.alignment, showMenu, positionMenu]);

    // Log all node attributes to help with debugging
    useEffect(() => {
        console.log('ButtonNodeView - Node Attributes:', {
            nodeAttrs: node.attrs,
            hasElementId: 'elementId' in node.attrs,
            nodeKeys: Object.keys(node.attrs),
            nodeToJSON: node.toJSON()
        });
    }, [node]);

    const element = usePresentationStore(state => {
        if (!node.attrs.presentationId || !node.attrs.slideId || !node.attrs.layoutId || !node.attrs.elementId) {
            return null;
        }
        return state.getElement(
            node.attrs.presentationId,
            node.attrs.slideId,
            node.attrs.layoutId,
            node.attrs.elementId
        );
    });

    console.log('Element from store:', element);
    // Получаем идентификаторы из атрибутов или используем заглушки
    const elementId = node.attrs.elementId || 'dummy-id';

    // Create a wrapper for updateAttributes that converts from key/value to a record
    const handleUpdateAttribute = useCallback((key: string, value: any) => {
        updateAttributes({ [key]: value });
        
        // Если обновляется свойство, влияющее на позиционирование, и меню открыто,
        // планируем обновление позиции после рендеринга DOM
        if ((key === 'alignment' || key === 'buttonStyle') && showMenu) {
            requestAnimationFrame(() => {
                setTimeout(positionMenu, 10);
            });
        }
    }, [updateAttributes, showMenu, positionMenu]);

    // Создаем DOM-элемент для портала при монтировании
    useEffect(() => {
        if (!portalContainerRef.current) {
            const container = document.createElement('div');
            container.className = 'button-menu-portal';
            document.body.appendChild(container);
            portalContainerRef.current = container;
        }

        return () => {
            if (portalContainerRef.current) {
                document.body.removeChild(portalContainerRef.current);
                portalContainerRef.current = null;
            }
        };
    }, []);

    // Обновляем позицию меню при изменении видимости
    useEffect(() => {
        if (showMenu) {
            // Даем небольшую задержку, чтобы меню полностью отрендерилось
            setTimeout(positionMenu, 0);
            window.addEventListener('resize', positionMenu);
            window.addEventListener('scroll', positionMenu);
        }

        return () => {
            window.removeEventListener('resize', positionMenu);
            window.removeEventListener('scroll', positionMenu);
        };
    }, [showMenu, positionMenu]);

    const handleToggleMenu = useCallback(() => {
        setShowMenu(prev => !prev);
    }, []);

    // Handle button click - if link is provided, navigate to it
    const handleButtonClick = useCallback(() => {
        const { link } = node.attrs;
        
        if (link && !showMenu) {
            // Если есть ссылка и меню закрыто, открываем ссылку в новой вкладке
            window.open(link, '_blank', 'noopener,noreferrer');
        } else {
            // Иначе переключаем состояние меню
            handleToggleMenu();
        }
    }, [node.attrs, showMenu, handleToggleMenu]);

    // Determine if button text should be editable
    const isEditable = !node.attrs.link || showMenu;

    // Get button styles based on attributes
    const getButtonStyles = () => {
        const { buttonStyle, color, alignment } = node.attrs;
        const baseStyles = "py-2 px-4 rounded transition-all duration-200 min-w-[100px] hover:brightness-90 ";
        let alignmentClass = "text-center";
        
        // Set alignment
        if (alignment === 'left') {
            alignmentClass = "text-left";
        } else if (alignment === 'right') {
            alignmentClass = "text-right";
        }
        
        // Set button style (filled or outlined)
        if (buttonStyle === 'filled') {
            return {
                className: `${baseStyles} ${alignmentClass}`,
                style: {
                    backgroundColor: color || '#3C3939',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: node.attrs.link && !showMenu ? 'pointer' : 'text'
                }
            };
        } else {
            return {
                className: `${baseStyles} ${alignmentClass} hover:bg-opacity-10`,
                style: {
                    backgroundColor: 'transparent',
                    color: color || '#3C3939',
                    border: `1px solid ${color || '#3C3939'}`,
                    cursor: node.attrs.link && !showMenu ? 'pointer' : 'text'
                }
            };
        }
    };

    // Get container styles based on alignment
    const getContainerStyles = () => {
        const { alignment } = node.attrs;
        let containerStyle = "w-full flex";
        
        // Set alignment for the button container
        if (alignment === 'left') {
            containerStyle += " justify-start";
        } else if (alignment === 'center') {
            containerStyle += " justify-center";
        } else if (alignment === 'right') {
            containerStyle += " justify-end";
        }
        
        return containerStyle;
    };

    const buttonStyles = getButtonStyles();
    const containerStyles = getContainerStyles();

    return (
        <NodeViewWrapper>
            <div ref={wrapperRef} className="relative button-node-wrapper">
                <div className={containerStyles}>
                    <button
                        ref={buttonRef}
                        data-type="button"
                        data-element-id={elementId}
                        data-has-link={!!node.attrs.link}
                        className={buttonStyles.className}
                        style={buttonStyles.style}
                        onClick={handleButtonClick}
                        onMouseDown={(e) => {
                            // Prevent editor selection loss when clicking button
                            if (!isEditable) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <div
                            contentEditable={isEditable}
                            suppressContentEditableWarning={true}
                            className={isEditable ? 'cursor-text' : 'cursor-pointer'}
                        >
                            {node.textContent || 'Button text'}
                        </div>
                    </button>
                </div>

                {/* Рендерим меню через портал */}
                {showMenu && portalContainerRef.current && createPortal(
                    <ButtonMenu
                        slideId={node.attrs.slideId}
                        layoutId={node.attrs.layoutId}
                        elementId={elementId}
                        presentationId={node.attrs.presentationId}
                        columnId="" // Use an empty string as fallback for columnId
                        onUpdate={handleUpdateAttribute}
                        onDelete={deleteNode}
                        nodeAttributes={node.attrs}
                        ref={menuRef}
                    />,
                    portalContainerRef.current
                )}
            </div>
        </NodeViewWrapper>
    );
};

export default ButtonNodeView;