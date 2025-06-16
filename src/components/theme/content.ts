import { getTextContent } from '@/elements/textEditor/defaultContent';
import { TextType } from '@/types';
import { ElementType } from '@/types/elements';
import image from './image.jpg';

// Slide 1 - Theme Preview
export const slide1Content = {
    title: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.HEADING1, 'Это предпросмотр темы'),
    },
    bodyText: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.DEFAULT, 'Привет 👋 Это пример текста. Вы можете изменить его шрифт и цвет.'),
    },
    linkText: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(
            TextType.DEFAULT,
            'Ваш <a href="#">акцентный цвет</a> будет использоваться для ссылок. Он также будет использоваться для макетов и кнопок.'
        ),
    },
    layoutText: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.DEFAULT, 'Это специальный макет. Он действует как текстовое поле.'),
    },
    layoutText2: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.DEFAULT, 'Вы можете получить это, набрав /layout'),
    },
};

// Slide 2 - Smart Layouts
export const slide2Content = {
    title: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.HEADING1, 'Умные макеты'),
    },

    smartLayout: {
        elementTypeId: ElementType.SMART_LAYOUT,
        elementVariant: 'text-boxes',
        items: [
            {
                id: 'item-1',
                title: getTextContent(TextType.HEADING3, 'Первый заголовок'),
                text: getTextContent(TextType.DEFAULT, 'Это умный макет'),
                imageUrl: '',
                iconUrl: '',
            },
            {
                id: 'item-2',
                title: getTextContent(TextType.HEADING3, 'Второй заголовок'),
                text: getTextContent(TextType.DEFAULT, 'Вы можете добавить несколько, сколько хотите'),
                imageUrl: '',
                iconUrl: '',
            },
            {
                id: 'item-3',
                title: getTextContent(TextType.HEADING3, 'Третий заголовок'),
                text: getTextContent(
                    TextType.DEFAULT,
                    'Они будут адаптироваться к вашему контенту и будут адаптивными'
                ),
                imageUrl: '',
                iconUrl: '',
            },
        ],
        columnSize: 3,
        align: 'center' as const,
        imageShape: 'square' as const,
        imageSize: 5,
    },
};

// Slide 3 - Fonts
export const slide3Content = {
    title: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.HEADING1, 'Шрифты'),
    },
    description: {
        elementTypeId: ElementType.TEXT,
        content:
            (getTextContent(
                TextType.DEFAULT,
                'Gamma поставляется с предопределенными наборами шрифтов, которые лучше всего подходят для читаемости. Не стесняйтесь выбирать шрифты для заголовков и основной текстовой части.'
            ) as string) +
            (getTextContent(TextType.DEFAULT, 'Вы можете выбрать цвет по умолчанию для вашего текста.') as string),
    },

    fontExamples: {
        elementTypeId: ElementType.TEXT,
        content:
            (getTextContent(TextType.TITLE, 'Заголовок') as string) +
            (getTextContent(TextType.HEADING1, 'Заголовок 1') as string) +
            (getTextContent(TextType.HEADING2, 'Заголовок 2') as string) +
            (getTextContent(TextType.HEADING3, 'Заголовок 3') as string) +
            (getTextContent(TextType.HEADING4, 'Заголовок 4') as string) +
            (getTextContent(TextType.DEFAULT, 'Обычный текст') as string),
    },
    // bodyTextExamples: {
    //     elementTypeId: ElementType.TEXT,
    // },
};

// Slide 4 - Primary Accent Color
export const slide4Content = {
    title: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.HEADING1, 'Акцентный цвет'),
    },
    description: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.BULLET_LIST, [
            'Этот текст <strong>жирный цвет</strong> как градиент',
            'Он будет применен к кнопкам, блокам акцентов, умным макетам, блокам вызовов, <a href="#">гиперссылкам</a> и <a href="#">примечаниям</a>',
        ]),
    },
    calloutTitle: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.DEFAULT, '<strong>Внимание всем</strong>'),
    },
    calloutText: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(
            TextType.DEFAULT,
            'Это блок вызова. Его цвет по умолчанию будет вашим основным акцентным цветом, но не беспокойтесь, вы можете его изменить.'
        ),
    },

    quote: {
        elementTypeId: ElementType.QUOTE,
        content: getTextContent(
            TextType.QUOTE,
            'Пример цитаты, здесь вы можете написать цитату и мы ее оформим \n — Автор'
        ),
    },
};

// Slide 5 - Secondary Accent Colors
export const slide5Content = {
    title: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(TextType.HEADING1, 'Вторичный акцентный цвет'),
    },
    description: {
        elementTypeId: ElementType.TEXT,
        content: getTextContent(
            TextType.DEFAULT,
            'В дополнение к вашему основному цвету, вторичный акцентный цвет будет отображаться как акценты в вашей теме. Вы можете использовать их для фонов диаграмм, умных макетов и стилизации текста.'
        ),
    },
    colorPalette: {
        elementTypeId: ElementType.IMAGE,
        src: image.src,
        alt: 'Color palette preview',
        alignment: 'center' as const,
    },
};
