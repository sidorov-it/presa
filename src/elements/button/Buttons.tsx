import { RefObject, useCallback, useRef, useState, useEffect } from 'react';
import { HiPlus } from 'react-icons/hi2';
import { usePresentationStore } from '@/store/presentationStore';
import { ButtonElement, ButtonItem, TipTapRefs } from '@/types';
import Tiptap from '@/components/tiptap/Tiptap/Tiptap';
import styles from './Buttons.module.css';
import { generateId } from '@/utils/id';
import { useReadOnly } from '@/contexts/ReadOnlyContext';
import { useUIStateStore } from '@/store/uiStateStore';
import { useShallow } from 'zustand/react/shallow';
import ButtonMenu from '@/components/editor/Menus/ButtonMenu';
import { getContrastingTextColor } from '@/utils/themeUtils';
import Portal from '@/components/Portal';

interface ButtonsProps {
    elementId: string;
    presentationId: string;
    slideId: string;
    layoutId: string;
    tiptapRefs: RefObject<TipTapRefs>;
    isFocused: boolean;
}

export default function Buttons({ elementId, presentationId, slideId, layoutId, tiptapRefs, isFocused }: ButtonsProps) {
    const isReadOnly = useReadOnly();
    const element = usePresentationStore(state =>
        state.getElement(presentationId, slideId, layoutId, elementId)
    ) as ButtonElement;
    const updateElement = usePresentationStore(state => state.updateElement);

    const [activeItemId, setActiveItemId] = useState<string | null>(null);
    const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const menuRef = useRef<HTMLDivElement>(null);

    const [hovered, setHovered] = useState(false);
    const isSelected = useUIStateStore(useShallow(state => state.selectedElementId === elementId));
    const isMenuOpen = useUIStateStore(
        useShallow(state => state.isContextMenuOpen && state.selectedElementId === elementId)
    );

    const itemRef = useRef<HTMLDivElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);

    const setRef = (id: string) => (el: HTMLDivElement | null) => {
        buttonRefs.current[id] = el;
    };

    const openMenu = useCallback(
        (id: string) => {
            if (isReadOnly) return;
            const btn = buttonRefs.current[id];
            if (!btn) return;
            const rect = btn.getBoundingClientRect();
            setMenuPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
            setActiveItemId(id);
        },
        [isReadOnly]
    );

    const closeMenu = useCallback(() => {
        setActiveItemId(null);
    }, []);

    // Закрытие меню при клике вне кнопки и вне меню, с учётом ColorPicker/Popover
    function isInPopoverOrColorPicker(target: EventTarget | null): boolean {
        let node = target as HTMLElement | null;
        while (node) {
            if (
                node.getAttribute?.('data-testid') === 'color-picker' ||
                node.getAttribute?.('data-scope') === 'popover'
            ) {
                return true;
            }
            node = node.parentElement;
        }
        return false;
    }

    useEffect(() => {
        if (!activeItemId) return;
        const handleClickOutside = (e: MouseEvent) => {
            const btn = buttonRefs.current[activeItemId];
            const menu = menuRef.current;
            if (
                (btn && btn.contains(e.target as Node)) ||
                (menu && menu.contains(e.target as Node)) ||
                isInPopoverOrColorPicker(e.target)
            ) {
                return;
            }
            closeMenu();
        };
        window.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeItemId, closeMenu]);

    const handleContentChange = useCallback(
        (itemId: string) => (content: string) => {
            const updatedItems = element.items.map(item => (item.id === itemId ? { ...item, text: content } : item));
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: { items: updatedItems },
                createHistoryEntry: true,
                isTextElement: true,
            });
        },
        [element, presentationId, slideId, layoutId, elementId, updateElement]
    );

    const handleChangeAlignment = useCallback(
        (value: string) => {
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: { alignment: value as 'center' | 'left' | 'right' },
            });
        },
        [element, presentationId, slideId, layoutId, elementId, updateElement]
    );

    const handleAttrChange = useCallback(
        (itemId: string, key: keyof ButtonItem, value: any) => {
            const updatedItems = element.items.map(item => (item.id === itemId ? { ...item, [key]: value } : item));
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: { items: updatedItems },
            });
        },
        [element, presentationId, slideId, layoutId, elementId, updateElement]
    );

    const handleDelete = useCallback(
        (itemId: string) => {
            const updatedItems = element.items.filter(item => item.id !== itemId);
            updateElement({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data: { items: updatedItems },
            });
            closeMenu();
        },
        [element, presentationId, slideId, layoutId, elementId, updateElement, closeMenu]
    );

    const addItem = useCallback(() => {
        const newItem: ButtonItem = {
            id: generateId(),
            text: '<p><span>Button</span></p>',
            link: '',
            buttonStyle: 'filled',
            alignment: 'left',
            color: '',
        };
        updateElement({
            presentationId,
            slideId,
            layoutId,
            elementId,
            data: { items: [...element.items, newItem] },
        });
    }, [element, presentationId, slideId, layoutId, elementId, updateElement]);

    const handleFocus = useCallback(
        (itemId: string) => () => {
            openMenu(itemId);

            window.addEventListener('click', (e: MouseEvent) => {
                if (e.target instanceof HTMLElement && e.target.closest(`.${styles.buttonItem}`)) {
                    return;
                }

                closeMenu();
            });
        },
        []
    );

    return (
        <div
            className={`${styles.container} ${isFocused ? styles.focused : ''} ${element.alignment ? styles[element.alignment] : ''}`}
        >
            {element.items.map((item, index) => {
                const backgroundColor = item?.color;
                const style: React.CSSProperties = {};

                // если filled, то backgroundColor - primary-accent, color - contrastColor
                // если outlined, то backgroundColor - transparent, color - primary-accent, border-color - primary-accent

                if (item.buttonStyle === 'filled') {
                    if (item?.color) {
                        style.backgroundColor = item?.color;
                        style['--presentation-text-color'] = getContrastingTextColor(item?.color);
                    } else {
                        style.backgroundColor = 'var(--presentation-primary-accent)';
                        style['--presentation-text-color'] = 'var(--presentation-primary-accent-contrast-text-color)';
                    }
                } else {
                    style.backgroundColor = 'transparent';
                    style['--presentation-text-color'] = 'var(--presentation-primary-accent)';
                    style.border = `1px solid var(--presentation-primary-accent)`;
                }
                style.borderRadius = 'var(--presentation-slide-border-radius)';

                // style.backgroundColor = item.buttonStyle === 'outlined' ? 'transparent' : backgroundColor;
                // const contrastColor = getContrastingTextColor(backgroundColor);
                // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // // @ts-expect-error
                // style['--presentation-text-color'] = item.buttonStyle === 'outlined' ? 'var(--presentation-primary-accent)' : contrastColor;
                // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // // @ts-expect-error
                // style['--presentation-heading-color'] = contrastColor;
                // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // // @ts-expect-error
                // style['--presentation-block-background-subtle'] = backgroundColor;
                // // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // // @ts-expect-error
                // style['--presentation-block-text-color-subtle'] = contrastColor;

                return (
                    <div
                        key={item.id}
                        className={`${styles.buttonItem} ${item.buttonStyle === 'outlined' ? styles.outlined : styles.filled}`}
                        style={style}
                    >
                        <div className="text-normal">
                            <div
                                className={`${styles.button} `}
                                ref={setRef(item.id)}
                                data-button-id={item.id}
                                // style={{
                                //     backgroundColor: item.buttonStyle === 'filled' ? item.color : 'transparent',
                                //     border: item.buttonStyle === 'outlined' ? `1px solid ${item.color}` : 'none',
                                //     color: item.buttonStyle === 'outlined' ? item.color : '#fff',
                                //     textAlign: item.alignment,
                                // }}
                                // onFocus={() => openMenu(item.id)}
                            >
                                <Tiptap
                                    onFocus={handleFocus(item.id)}
                                    isReadOnly={isReadOnly}
                                    elementId={elementId}
                                    tiptapRefs={tiptapRefs}
                                    id={elementId}
                                    presentationId={presentationId}
                                    slideId={slideId}
                                    layoutId={layoutId}
                                    placeholder="Button"
                                    onContentChange={handleContentChange(item.id)}
                                    customRefKey={`button-${elementId}-${item.id}`}
                                    isHideSlashMenu={true}
                                    isInnerTiptap={true}
                                    standardEnterBehavior={true}
                                    isHideCommonMenu={true}
                                />
                            </div>
                        </div>
                        {!isReadOnly && index === element.items.length - 1 && (
                            <div className={styles.addButton} onClick={addItem}>
                                <HiPlus />
                            </div>
                        )}

                        {/* {!isReadOnly && (hovered || isSelected) && (
                        <DragHandler
                            className={`${styles.dragHandler}`}
                            horizontal={true}
                            slideId={slideId}
                            isActive={activeItemId === item.id}
                            ariaLabel="Перетащить"
                            handleClick={() => {
                                setActiveItemId(item.id);
                                useUIStateStore.getState().openContextMenu({
                                    smartLayoutItemId: item.id,
                                    layoutId,
                                    elementId,
                                    slideId,
                                    elementType: 'smart-layout-item',
                                });
                            }}
                            handleKeyDown={() => {}}
                            dataAttributes={{
                                'data-smart-layout-item-drag-handle': item.id,
                            }}
                            handleDragStart={() => {}}
                        />
                    )} */}
                        {/* {!isReadOnly &&
                        isMenuOpen &&
                        menuPosition &&
                        renderMenuComponent &&
                        renderMenuComponent(menuPosition)} */}
                        {activeItemId === item.id && menuPosition && (
                            <Portal>
                                <div
                                    ref={menuRef}
                                    style={{
                                        position: 'absolute',
                                        left: menuPosition.x - 150,
                                        top: menuPosition.y,
                                        zIndex: 140,
                                    }}
                                >
                                    <ButtonMenu
                                        slideId={slideId}
                                        layoutId={layoutId}
                                        elementId={elementId}
                                        presentationId={presentationId}
                                        onUpdate={(k, v) => handleAttrChange(item.id, k as keyof ButtonItem, v)}
                                        onAlignmentChange={handleChangeAlignment}
                                        onDelete={() => handleDelete(item.id)}
                                        nodeAttributes={item as any}
                                        alignment={element.alignment}
                                        cellId={''}
                                    />
                                </div>
                            </Portal>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
