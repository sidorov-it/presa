import React from 'react';
import ScopedPresentationThemeWrapper from '@/components/viewer/theme/ScopedPresentationThemeWrapper';
import PresentationViewer from '@/components/viewer/PresentationViewer';
import { IPresentation, EditorElement, SmartLayoutElement, ImageElement } from '@/types';
import { generateId } from '@/utils/id';
import { Theme } from '@/types/theme';
import { ElementType } from '@/types/elements';
import { slide1Content, slide2Content, slide3Content, slide5Content } from './content';

interface ThemePreviewProps {
    theme: Theme;
}

export const ThemePreview = ({ theme }: ThemePreviewProps) => {
    const samplePresentation: IPresentation = {
        id: generateId(),
        title: 'Theme Preview',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slides: [
            {
                id: 'slide-1',
                title: 'Theme Preview',
                layouts: [
                    {
                        id: 'layout-0',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-1',
                                    cells: [
                                        {
                                            id: 'cell-1',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-1',
                                cellId: 'cell-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide1Content.title.content,
                            },
                        ],
                    },
                    {
                        id: 'layout-1',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-1',
                                    cells: [
                                        {
                                            id: 'cell-1',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-2',
                                cellId: 'cell-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide1Content.bodyText.content,
                            },
                        ],
                    },
                    {
                        id: 'layout-2',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-1',
                                    cells: [
                                        {
                                            id: 'cell-1',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-3',
                                cellId: 'cell-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide1Content.linkText.content,
                            },
                        ],
                    },
                    {
                        id: 'layout-3',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-1',
                                    cells: [
                                        {
                                            id: 'cell-1',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'rlus2yolrcs',
                                content: '<p>/smar</p>',
                                cellId: 'cell-1',
                                elementTypeId: 'smart-layout',
                                elementVariant: 'text-boxes',
                                items: [
                                    {
                                        title: '<p>Это специальный макет. Он действует как текстовое поле.</p>',
                                        text: '<p></p>',
                                        imageUrl: '',
                                        iconUrl: '',
                                        id: 'x4xabs3loa',
                                    },
                                    {
                                        title: '<p>Вы можете получить это, набрав /layout</p>',
                                        text: '<p></p>',
                                        imageUrl: '',
                                        iconUrl: '',
                                        id: 'hzfuw57h7s9',
                                    },
                                ],
                                columnSize: 3,
                                align: 'center',
                                imageShape: 'square',
                                imageSize: 5,
                            },
                        ],
                    },
                    {
                        id: 'layout-4',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-1',
                                    cells: [
                                        {
                                            id: 'cell-1',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-5',
                                cellId: 'cell-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide1Content.layoutText2.content,
                            },
                        ],
                    },
                ],
            },
            {
                id: 'slide-2',
                title: 'Smart layouts',
                layouts: [
                    {
                        id: 'layout-2-1',
                        type: 'heading',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-2-1',
                                    cells: [{ id: 'cell-2-1', row: 1, column: 1 }],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-2-1',
                                cellId: 'cell-2-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide2Content.title.content,
                            } as EditorElement,
                        ],
                    },
                    {
                        id: 'layout-2-5',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-2-5',
                                    cells: [{ id: 'cell-2-5', row: 1, column: 1 }],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-2-5',
                                cellId: 'cell-2-5',
                                elementTypeId: ElementType.SMART_LAYOUT,
                                elementVariant: slide2Content.smartLayout.elementVariant,
                                items: slide2Content.smartLayout.items,
                                columnSize: slide2Content.smartLayout.columnSize,
                                align: slide2Content.smartLayout.align,
                                imageShape: slide2Content.smartLayout.imageShape,
                                imageSize: slide2Content.smartLayout.imageSize,
                            } as SmartLayoutElement,
                        ],
                    },
                ],
            },
            {
                id: 'slide-3',
                title: 'Fonts',
                layouts: [
                    {
                        id: 'layout-3-1',
                        type: 'heading',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-3-1',
                                    cells: [{ id: 'cell-3-1', row: 1, column: 1 }],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-3-1',
                                cellId: 'cell-3-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide3Content.title.content,
                            } as EditorElement,
                        ],
                    },
                    {
                        id: 'layout-3-2',
                        type: 'two-columns-equal',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-3-2',
                                    cells: [
                                        { id: 'cell-3-2-1', row: 1, column: 1 },
                                        { id: 'cell-3-2-2', row: 1, column: 2 },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-3-2-1',
                                cellId: 'cell-3-2-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide3Content.description.content + slide3Content.fontExamples.content,
                            } as EditorElement,
                            // {
                            //     id: 'element-3-2-2',
                            //     cellId: 'cell-3-2-2',
                            //     elementTypeId: ElementType.TEXT,
                            //     content: slide3Content.bodyTextExamples.content,
                            // } as EditorElement,
                        ],
                    },
                ],
            },
            {
                id: 'slide-4',
                title: 'Primary accent color',
                layouts: [
                    {
                        id: 'hky8pnajws7',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'kku4xk',
                                    cells: [
                                        {
                                            id: '3nj4yx',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        type: 'blank',
                        style: {},
                        elements: [
                            {
                                id: 'wpbcsjitz',
                                content: '<p><span class="heading-text title-text">Fonts</span></p><p></p>',
                                cellId: '3nj4yx',
                                elementTypeId: ElementType.TEXT,
                            },
                        ],
                    },
                    {
                        id: 'nj88fo',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'lbwhm7',
                                    cells: [
                                        {
                                            id: 'dgmmhc',
                                            row: 1,
                                            column: 1,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        type: 'blank',
                        style: {},
                        elements: [
                            {
                                id: 'avkxhmrg9au',
                                content:
                                    '<p><span>Gamma comes with pre-defined sizes of typography that work best for legibility. Feel free to choose font families for your headings and body font.</span></p><p><span>You can choose a solid default color for your text. For headings, you can also choose a gradient color.</span></p>',
                                cellId: 'dgmmhc',
                                elementTypeId: ElementType.TEXT,
                            },
                        ],
                    },
                    {
                        id: 'sovv9v',
                        gridStructure: {
                            columns: 2,
                            rows: [
                                {
                                    id: '19149g',
                                    cells: [
                                        {
                                            id: 'wfgyjw',
                                            row: 1,
                                            column: 1,
                                        },
                                        {
                                            id: 'pyqnm6jz4xa',
                                            row: 1,
                                            column: 2,
                                        },
                                    ],
                                },
                            ],
                            columnWidths: ['50%', '50%'],
                        },
                        type: 'blank',
                        style: {},
                        elements: [
                            {
                                id: '3jo3m07iv1n',
                                content: '<p><span class="heading-text title-text">Title font</span></p>',
                                cellId: 'wfgyjw',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: 'ukq45qvbdl9',
                                content: '<p><span class="heading-text big-heading">Heading 1</span></p>',
                                cellId: 'wfgyjw',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: 'b1mj2v9z4cq',
                                content: '<p><span class="heading-text heading-2">Heading 2</span></p>',
                                cellId: 'wfgyjw',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: '4i3v822we0b',
                                content: '<p><span class="heading-text heading-3">Heading 3</span></p>',
                                cellId: 'wfgyjw',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: 'yhjj11lcfyi',
                                content: '<p><span class="body-text big-text">Heading 4</span></p>',
                                cellId: 'wfgyjw',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: 'n0887rsznvi',
                                content: '<p><span class="body-text big-text">Large body text</span></p>',
                                cellId: 'pyqnm6jz4xa',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: 'sfauf1h40w',
                                content: '<p><span>Normal body text</span></p>',
                                cellId: 'pyqnm6jz4xa',
                                elementTypeId: ElementType.TEXT,
                            },
                            {
                                id: 'eh4wkql7iyh',
                                content: '<p><span class="body-text small-text">Small body text</span></p>',
                                cellId: 'pyqnm6jz4xa',
                                elementTypeId: ElementType.TEXT,
                            },
                        ],
                    },
                ],
            },
            {
                id: 'slide-5',
                title: 'Secondary accent colors',
                layouts: [
                    {
                        id: 'layout-5-1',
                        type: 'heading',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-5-1',
                                    cells: [{ id: 'cell-5-1', row: 1, column: 1 }],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-5-1',
                                cellId: 'cell-5-1',
                                elementTypeId: ElementType.TEXT,
                                content: slide5Content.title.content,
                            } as EditorElement,
                        ],
                    },
                    {
                        id: 'layout-5-2',
                        type: 'blank',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'row-5-2',
                                    cells: [{ id: 'cell-5-2', row: 1, column: 1 }],
                                },
                            ],
                            columnWidths: ['100%'],
                        },
                        style: {},
                        elements: [
                            {
                                id: 'element-5-2',
                                cellId: 'cell-5-2',
                                elementTypeId: ElementType.TEXT,
                                content: slide5Content.description.content,
                            } as EditorElement,
                            {
                                id: 'element-5-3',
                                cellId: 'cell-5-2',
                                elementTypeId: ElementType.IMAGE,
                                src: slide5Content.colorPalette.src,
                                alt: slide5Content.colorPalette.alt,
                                alignment: slide5Content.colorPalette.alignment,
                            } as ImageElement,
                        ],
                    },
                ],
            },
        ],
    };

    return (
        <ScopedPresentationThemeWrapper theme={theme}>
            <PresentationViewer presentation={samplePresentation} />
        </ScopedPresentationThemeWrapper>
    );
};
