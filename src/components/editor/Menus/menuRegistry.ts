import dynamic from 'next/dynamic';

// Bubble Menus
const ImageBubbleMenu = dynamic(() => import('./BubbleMenus/ImageBubbleMenu/ImageBubbleMenu'));
const BoxBubbleMenu = dynamic(() => import('./BubbleMenus/BoxBubbleMenu/BoxBubbleMenu'));
const ButtonBubbleMenu = dynamic(() => import('./BubbleMenus/ButtonBubbleMenu/ButtonBubbleMenu'));
const DefaultBubbleMenu = dynamic(() => import('./BubbleMenus/DefaultBubbleMenu/DefaultBubbleMenu'));
const HeadingBubbleMenu = dynamic(() => import('./BubbleMenus/HeadingBubbleMenu'));
const ListBubbleMenu = dynamic(() => import('./BubbleMenus/ListBubbleMenu'));
const QuoteBubbleMenu = dynamic(() => import('./BubbleMenus/QuoteBubbleMenu'));
const TableBubbleMenu = dynamic(() => import('./BubbleMenus/TableBubbleMenu'));

// Side Panel Menus
const ImageEditBox = dynamic(() => import('../SidePanel/ImageEditBox/ImageEditBox'));

export const BubbleMenus = {
    'image-bubble': ImageBubbleMenu,
    'box-bubble': BoxBubbleMenu,
    'button-bubble': ButtonBubbleMenu,
    'default-bubble': DefaultBubbleMenu,
    'heading-bubble': HeadingBubbleMenu,
    'list-bubble': ListBubbleMenu,
    'quote-bubble': QuoteBubbleMenu,
    'table-bubble': TableBubbleMenu,
};

export const SideMenus = {
    'image-edit': ImageEditBox,
};
