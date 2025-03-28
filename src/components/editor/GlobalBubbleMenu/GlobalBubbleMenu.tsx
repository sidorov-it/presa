"use client"

import React, { useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { useEditorStore } from '@/store/editorStore';
import { elementsRegistry } from '@/elements/registry';
import DefaultBubbleMenu from '../BubbleMenus/DefaultBubbleMenu';

const GlobalBubbleMenu: React.FC = () => {
    const { activeEditor, showBubbleMenu, hideMenu, triggerElement, activeElementType } = useEditorStore();

    // Hide bubble menu when clicking outside
    useEffect(() => {
        if (showBubbleMenu) {
            const handleClickOutside = (e: MouseEvent) => {
                // Don't hide if clicking on the editor or the bubble menu itself
                const target = e.target as HTMLElement;
                if (target.closest('.tiptap-editor-wrapper') || target.closest('.bubble-menu') || target.closest('.drag-handle')) {
                    return;
                }
                hideMenu();
            };
      
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [showBubbleMenu, hideMenu]);

    if (!activeEditor || !showBubbleMenu) {
        return null;
    }

    // Find the appropriate bubble menu component for the active element type
    const getMenuComponent = () => {
        if (!activeElementType) return DefaultBubbleMenu;

        // First, try to find an exact match for the textType in the elements registry
        const foundElement = elementsRegistry
            .flatMap(category => 
                category.subCategories
                    ? category.subCategories.flatMap(sub => sub.elements)
                    : category.elements
            )
            .find(el => el?.defaultProps?.textType === activeElementType);
        
        if (foundElement?.MenuComponent) {
            return foundElement.MenuComponent;
        }
        
        // If no exact match was found, check element IDs that match common patterns
        if (activeElementType.includes('heading')) {
            // Find heading menu component
            const headingElement = elementsRegistry
                .flatMap(category => 
                    category.subCategories
                        ? category.subCategories.flatMap(sub => sub.elements)
                        : category.elements
                )
                .find(el => el?.id?.includes('heading'));
            
            if (headingElement?.MenuComponent) {
                return headingElement.MenuComponent;
            }
        }
        
        if (activeElementType.includes('table')) {
            // Find table menu component
            const tableElement = elementsRegistry
                .flatMap(category => 
                    category.subCategories
                        ? category.subCategories.flatMap(sub => sub.elements)
                        : category.elements
                )
                .find(el => el?.id?.includes('table'));
            
            if (tableElement?.MenuComponent) {
                return tableElement.MenuComponent;
            }
        }
        
        if (activeElementType.includes('list') || activeElementType.includes('bullet') || activeElementType.includes('todo')) {
            // Find list menu component
            const listElement = elementsRegistry
                .flatMap(category => 
                    category.subCategories
                        ? category.subCategories.flatMap(sub => sub.elements)
                        : category.elements
                )
                .find(el => el?.id?.includes('list'));
            
            if (listElement?.MenuComponent) {
                return listElement.MenuComponent;
            }
        }
        
        if (activeElementType.includes('box')) {
            // Find box menu component
            const boxElement = elementsRegistry
                .flatMap(category => 
                    category.subCategories
                        ? category.subCategories.flatMap(sub => sub.elements)
                        : category.elements
                )
                .find(el => el?.id?.includes('box'));
            
            if (boxElement?.MenuComponent) {
                return boxElement.MenuComponent;
            }
        }
        
        // Return default menu component if no match was found
        return DefaultBubbleMenu;
    };

    const MenuComponent = getMenuComponent();

    return (
        <BubbleMenu 
            editor={activeEditor} 
            tippyOptions={{ 
                duration: 100,
                // Only use custom positioning when there's a trigger element
                ...(triggerElement && {
                    getReferenceClientRect: () => triggerElement.getBoundingClientRect()
                })
            }}
            className="bubble-menu"
            shouldShow={({ editor, view, state, oldState, from, to }) => {
                // Show for text selection
                if (editor.view.state.selection.content().size > 0) {
                    return true;
                }
                // Show for custom triggers
                return showBubbleMenu;
            }}
        >
            <MenuComponent editor={activeEditor} />
        </BubbleMenu>
    );
};

export default GlobalBubbleMenu; 