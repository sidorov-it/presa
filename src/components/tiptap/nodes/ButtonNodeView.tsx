import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { createPortal } from 'react-dom';
import ButtonMenu from '@/components/editor/Menus/ButtonMenu';
import { usePresentationStore } from '@/store/presentationStore';
import { generateId } from '@/utils/id';

const ButtonNodeView: React.FC<NodeViewProps> = ({
    node,
    updateAttributes,
    deleteNode,
    editor
}) => {
    // Создаем контейнер для портала и ссылку на меню
    const menuRef = useRef<HTMLDivElement>(null);
    const portalContainerRef = useRef<HTMLDivElement | null>(null);

    // Состояние меню
    const [showMenu, setShowMenu] = useState(false);

    // Ensure node has a valid elementId
    useEffect(() => {
        if (!node.attrs.elementId) {
            // Generate a new ID and update the node attributes
            const newElementId = generateId();
            console.log('Generated new elementId for button node:', newElementId);
            updateAttributes({ elementId: newElementId });
        }
    }, [node.attrs.elementId, updateAttributes]);

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
    }, [updateAttributes]);

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

    // Функция для позиционирования меню
    const positionMenu = useCallback(() => {
        if (!menuRef.current || !showMenu) return;

        const editorView = editor.view;
        const editorRect = editorView.dom.getBoundingClientRect();

        const menuEl = menuRef.current;
        menuEl.style.position = 'fixed';
        menuEl.style.zIndex = '1000';
        menuEl.style.left = `${editorRect.left + 20}px`;
        menuEl.style.top = `${editorRect.top + 20}px`;
    }, [editor, showMenu]);

    // Обновляем позицию меню при изменении видимости
    useEffect(() => {
        if (showMenu) {
            positionMenu();
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

    // Handle button click - if link is provided, navigate to it
    const handleButtonClick = useCallback((e: React.MouseEvent) => {
        const { link } = node.attrs;
        
        // If a link exists and there's no menu open, navigate to the link
        if (link && !showMenu) {
            e.preventDefault();
            // Open link in new tab
            window.open(link, '_blank', 'noopener,noreferrer');
        } else {
            // Toggle menu if link is not set or already editing
            handleToggleMenu();
        }
    }, [node.attrs, showMenu, handleToggleMenu]);

    // Determine if button text should be editable
    const isEditable = !node.attrs.link || showMenu;

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
            <div className="relative button-node-wrapper">
                <div className={containerStyles}>
                    <button
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