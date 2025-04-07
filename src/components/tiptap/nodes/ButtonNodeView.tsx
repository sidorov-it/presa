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
        // Создаем контейнер для портала, если его еще нет
        if (!portalContainerRef.current) {
            const container = document.createElement('div');
            container.className = 'button-menu-portal';
            document.body.appendChild(container);
            portalContainerRef.current = container;
        }

        // Удаляем контейнер при размонтировании
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

    // Простые обработчики для тестирования
    const handleTestClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling up
        console.log('ButtonNodeView - Test clicked', {
            elementId,
            nodeAttrs: node.attrs,
            element,
            hasElementId: 'elementId' in node.attrs
        });
    }, [node.attrs, element, elementId]);

    const handleToggleMenu = useCallback(() => {
        setShowMenu(prev => !prev);
    }, []);

    return (
        <NodeViewWrapper>
            <div className="relative button-node-wrapper">
                <button
                    data-type="button"
                    data-element-id={elementId}
                    className="interactive-button"
                    onClick={handleToggleMenu}
                >
                    <div contentEditable={true} suppressContentEditableWarning={true}>
                        {node.textContent || 'Button text'}
                    </div>
                </button>

                {/* Рендерим меню через портал */}
                {showMenu && portalContainerRef.current && createPortal(
                    <ButtonMenu
                        slideId={node.attrs.slideId}
                        layoutId={node.attrs.layoutId}
                        elementId={elementId}
                        presentationId={node.attrs.presentationId}
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