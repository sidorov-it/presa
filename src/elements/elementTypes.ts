import BoxBubbleMenu from '@/components/editor/Menus/BubbleMenus/BoxBubbleMenu/BoxBubbleMenu';
import HeadingBubbleMenu from '@/components/editor/Menus/BubbleMenus/HeadingBubbleMenu';
import QuoteBubbleMenu from '@/components/editor/Menus/BubbleMenus/QuoteBubbleMenu';
import TableBubbleMenu from '@/components/editor/Menus/BubbleMenus/TableBubbleMenu';
import ListBubbleMenu from '@/components/editor/Menus/BubbleMenus/ListBubbleMenu';
import ButtonMenu from '@/components/editor/Menus/ButtonMenu';
import ChartSettings from './chart/ChartSettings/ChartSettings';
import SmartLayoutSettings from './smartLayout/components/SmartLayoutSettings/SmartLayoutSettings';
import { ComponentStructureType } from '@/types';
import ImageBubbleMenu from '@/components/editor/Menus/BubbleMenus/ImageBubbleMenu/ImageBubbleMenu';

export interface ElementTypeConfig {
    elementTypeId: string;
    componentStructure: ComponentStructureType;
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
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        MenuComponent: HeadingBubbleMenu,
    },
    heading: {
        elementTypeId: 'heading',
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        MenuComponent: HeadingBubbleMenu,
    },
    quote: {
        elementTypeId: 'quote',
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        MenuComponent: QuoteBubbleMenu,
    },

    // Tables
    table: {
        elementTypeId: 'table',
        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
        hasTextEditor: false,
        MenuComponent: TableBubbleMenu,
    },

    // Lists
    'bullet-list': {
        elementTypeId: 'bullet-list',
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        MenuComponent: ListBubbleMenu,
    },
    'numbered-list': {
        elementTypeId: 'numbered-list',
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        MenuComponent: ListBubbleMenu,
    },
    'todo-list': {
        elementTypeId: 'todo-list',
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        MenuComponent: ListBubbleMenu,
    },

    // Boxes
    box: {
        elementTypeId: 'box',
        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
        MenuComponent: BoxBubbleMenu,
    },

    // Interactive elements
    button: {
        elementTypeId: 'button',
        componentStructure: ComponentStructureType.TEXT_EDITOR,
        hasTextEditor: true,
        customMenu: true,
        MenuComponent: ButtonMenu,
        hasLimitedTextFormatting: true,
    },
    toggle: {
        elementTypeId: 'toggle',
        componentStructure: ComponentStructureType.WRAPPED_TEXT_EDITOR,
        hasTextEditor: true,
    },

    // Media elements
    image: {
        elementTypeId: 'image',
        componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
        hasTextEditor: false,
        MenuComponent: ImageBubbleMenu,
    },
    video: {
        elementTypeId: 'video',
        componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
        hasTextEditor: false,
    },

    // Charts
    chart: {
        elementTypeId: 'chart',
        componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
        hasTextEditor: false,
        MenuComponent: ChartSettings,
        customMenuType: 'chart',
    },

    // Smart Layout
    'smart-layout': {
        elementTypeId: 'smart-layout',
        componentStructure: ComponentStructureType.CUSTOM_COMPONENT,
        hasTextEditor: false,
        MenuComponent: SmartLayoutSettings,
    },
};
