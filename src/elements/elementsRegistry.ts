import BoxBubbleMenu from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxBubbleMenu';
import HeadingBubbleMenu from '@/components/editor/Menus/BubbleMenus/HeadingBubbleMenu';
import QuoteBubbleMenu from '@/components/editor/Menus/BubbleMenus/QuoteBubbleMenu';
import TableBubbleMenu from '@/components/editor/Menus/BubbleMenus/TableBubbleMenu';
import ListBubbleMenu from '@/components/editor/Menus/BubbleMenus/ListBubbleMenu';
import ChartSettings from './chart/ChartSettings/ChartSettings';
import SmartLayoutSettings from './smartLayout/components/SmartLayoutSettings/SmartLayoutSettings';
import ImageBubbleMenu from '@/components/editor/Menus/BubbleMenus/ImageBubbleMenu/ImageBubbleMenu';

export interface ElementTypeConfig {
    elementTypeId: string;
    hasTextEditor?: boolean;
    MenuComponent?: React.ComponentType<any>;
    customMenu?: boolean;
    hasLimitedTextFormatting?: boolean;
    customMenuType?: string;
}

export const elementTypes: Record<string, ElementTypeConfig> = {
    // Text elements
    text: {
        elementTypeId: 'text',
        hasTextEditor: true,
        MenuComponent: HeadingBubbleMenu,
    },
    heading: {
        elementTypeId: 'heading',
        hasTextEditor: true,
        MenuComponent: HeadingBubbleMenu,
    },
    quote: {
        elementTypeId: 'quote',
        hasTextEditor: true,
        MenuComponent: QuoteBubbleMenu,
    },

    // Tables
    table: {
        elementTypeId: 'table',
        hasTextEditor: false,
        MenuComponent: TableBubbleMenu,
    },

    // Lists
    'bullet-list': {
        elementTypeId: 'bullet-list',
        hasTextEditor: true,
        MenuComponent: ListBubbleMenu,
    },
    'numbered-list': {
        elementTypeId: 'numbered-list',
        hasTextEditor: true,
        MenuComponent: ListBubbleMenu,
    },
    'todo-list': {
        elementTypeId: 'todo-list',
        hasTextEditor: true,
        MenuComponent: ListBubbleMenu,
    },

    // Boxes
    box: {
        elementTypeId: 'box',
        MenuComponent: BoxBubbleMenu,
    },

    // Interactive elements
    button: {
        elementTypeId: 'button',
        hasTextEditor: true,
        customMenu: true,
        // MenuComponent: ButtonMenu,
        hasLimitedTextFormatting: true,
    },
    toggle: {
        elementTypeId: 'toggle',
        hasTextEditor: true,
    },

    // Media elements
    image: {
        elementTypeId: 'image',
        hasTextEditor: false,
        MenuComponent: ImageBubbleMenu,
    },
    video: {
        elementTypeId: 'video',
        hasTextEditor: false,
    },

    // Charts
    chart: {
        elementTypeId: 'chart',
        hasTextEditor: false,
        MenuComponent: ChartSettings,
        customMenuType: 'chart',
    },

    // Smart Layout
    'smart-layout': {
        elementTypeId: 'smart-layout',
        hasTextEditor: false,
        MenuComponent: SmartLayoutSettings,
    },
};
