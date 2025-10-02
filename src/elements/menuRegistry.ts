import { MenuCategory } from '@/types/templates';
import { TemplateBuilders } from '@/templates/transformers';
import { ElementRegistry } from './commonRegisrty';
import { LuBox, LuType, LuImage, LuChartColumn } from 'react-icons/lu';

export const SlideTemplates: MenuCategory = TemplateBuilders.buildMenuRegistry();

export const menuRegistry: MenuCategory[] = [
    SlideTemplates,
    {
        id: 'smart-layouts',
        label: 'Структурные блоки',
        excludeFromTable: true,
        Icon: LuBox,
        elements: [
            ElementRegistry.SmartLayoutImagesWithText,
            ElementRegistry.SmartLayoutTextBlocks,
            ElementRegistry.SmartLayoutSteps,
            ElementRegistry.SmartLayoutTimeline,
        ],
    },
    {
        id: 'basic',
        label: 'Базовые элементы',
        Icon: LuType,
        subCategories: [
            {
                id: 'text',
                label: 'Текст',
                elements: [
                    ElementRegistry.Text,
                    ElementRegistry.Heading,
                    ElementRegistry.Heading1,
                    ElementRegistry.Heading2,
                    ElementRegistry.Heading3,
                    ElementRegistry.Heading4,
                    ElementRegistry.Quote,
                ],
            },
            {
                id: 'tables',
                label: 'Таблицы',
                excludeFromTable: true,
                elements: [ElementRegistry.Table2x2, ElementRegistry.Table3x3, ElementRegistry.Table4x4],
            },
            {
                id: 'lists',
                label: 'Списки',
                elements: [ElementRegistry.BulletList, ElementRegistry.NumberedList, ElementRegistry.TaskList],
            },
            {
                id: 'boxes',
                label: 'Блоки',
                excludeFromTable: true,
                elements: [
                    ElementRegistry.NoteBox,
                    ElementRegistry.InfoBox,
                    ElementRegistry.WarningBox,
                    ElementRegistry.CautionBox,
                    ElementRegistry.SuccessBox,
                    ElementRegistry.QuestionBox,
                ],
            },
            {
                id: 'interactive',
                label: 'Интерактивные',
                elements: [ElementRegistry.Buttons],
            },
        ],
    },
    {
        id: 'media',
        label: 'Медиа',
        Icon: LuImage,
        elements: [ElementRegistry.Image],
    },
    {
        id: 'charts',
        label: 'Диаграммы',
        Icon: LuChartColumn,
        elements: [
            ElementRegistry.BarChart,
            ElementRegistry.LineChart,
            ElementRegistry.PieChart,
            ElementRegistry.DonutChart,
        ],
    },
];

export const TEXT_ELEMENT_TYPES = ['text', 'heading', 'quote', 'bullet-list', 'numbered-list', 'todo-list', 'box'];

export const SLIDE_TEMPLATE_TYPES = ['slide-template'];
