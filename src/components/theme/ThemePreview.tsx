import React, { useRef, useEffect, useState } from 'react';
import ScopedPresentationThemeWrapper from '@/components/viewer/theme/ScopedPresentationThemeWrapper';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import { EditorElement, Slide } from '@/types';
import { Theme } from '@/types/theme';
import { ElementType } from '@/types/elements';
import { getSlideLayoutVars } from '@/utils/themeUtils';

interface ThemePreviewProps {
    theme: Theme;
}

export const ThemePreview = ({ theme }: ThemePreviewProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

    // Измеряем размеры контейнера
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setContainerDimensions({
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        updateDimensions();
        
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    const sampleSlides: Slide[] = [
        {
            id: 't3akl78koxp',
            layouts: [
                {
                    id: 'wo6zz2k8ai',
                    elements: [
                        {
                            id: 'codhq1g5at',
                            content: '<p><strong>Hello</strong> <span class="emoji">👋</span></p>',
                            cellId: '73uronundiv',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                    gridStructure: {
                        rows: [
                            {
                                id: 'yql56ktb04h',
                                cells: [
                                    {
                                        id: '73uronundiv',
                                        row: 0,
                                        column: 0,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: ['100%'],
                    },
                    style: {},
                },
                {
                    id: '8wwot6',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'ggml3x',
                                cells: [
                                    {
                                        id: 'iy8fln',
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
                            id: 'r7gtjywbt0i',
                            content: '<p><span class="heading-text heading-1">Это предпросмотр темы</span></p>',
                            cellId: 'iy8fln',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'ynczui',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'wyqibd',
                                cells: [
                                    {
                                        id: '3891ja',
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
                            id: 'mzfzkn9f73',
                            content:
                                '<p>Here\'s an example of body text. You can change its font and the color. <a target="_blank" rel="noopener noreferrer" class="link" href="http://gamma.app">Your accent color will be used for links.</a> It will also be used for layouts and buttons. </p><p></p>',
                            cellId: '3891ja',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'kvb8rl',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'i9voaa',
                                cells: [
                                    {
                                        id: 'vbhbfh',
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
                            id: 'ju1pwp0yi0n',
                            content: '<p>/sm</p>',
                            cellId: 'vbhbfh',
                            elementTypeId: ElementType.SMART_LAYOUT,
                            elementVariant: 'text-boxes',
                            items: [
                                {
                                    title: '<p>This is a smart layout: it acts as a text box.</p>',
                                    text: '<p></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: 'rdsh1o5jj9n',
                                },
                                {
                                    title: '<p>You can get these by typing /smart</p>',
                                    text: '<p></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: 'ac93qnhle58',
                                },
                            ],
                            columnSize: 3,
                            align: 'center',
                            imageShape: 'square',
                            imageSize: 5,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'evvojarxfs8',
                    gridStructure: {
                        columns: 1,
                        columnWidths: ['100%'],
                        rows: [
                            {
                                id: 'nltlakhypk',
                                cells: [
                                    {
                                        id: '71ytiygj5j3',
                                        row: 0,
                                        column: 1,
                                    },
                                ],
                            },
                        ],
                    },
                    type: 'blank',
                    elements: [
                        {
                            id: '59ul6dj1muw',
                            content:
                                '<p>To the right, this is what we call an accent image. We have a set of them with our default themes, but you can change them!  <span class="emoji">➡️</span></p>',
                            cellId: '71ytiygj5j3',
                            elementTypeId: ElementType.TEXT,
                            tempLayout: true,
                        } as EditorElement,
                    ],
                    style: {},
                },
                {
                    id: '9d3yrp',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: '04k86n',
                                cells: [
                                    {
                                        id: 'ganjyu',
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
                            id: 'uhdm7b95hi',
                            content: "<p>Let's get started customizing your theme!</p>",
                            cellId: 'ganjyu',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
            ],
            templateType: 'imageRight',
            imageWidthRatio: 0.33,
        },
        {
            id: 'bnzt2llzvpo',
            title: 'Слайд 2',
            layouts: [
                {
                    id: 'sx8xu17xav9',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'dh09zx',
                                cells: [
                                    {
                                        id: 'luaz2x',
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
                            id: 'clkwqg2pi4f',
                            content: '<p><span class="heading-text heading-1">Fonts</span></p>',
                            cellId: 'luaz2x',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: '3tod7j',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: '8egdsy',
                                cells: [
                                    {
                                        id: '87x4z5',
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
                            id: 'w3qnyhz3as',
                            content:
                                '<p>Gamma comes with pre-defined sizes of typography that work best for legibility. Feel free to choose font families for your headings and body font.</p>',
                            cellId: '87x4z5',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'vneeuk',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'mgdilk',
                                cells: [
                                    {
                                        id: 'e7mkvq',
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
                            id: '35k5dmgpacq',
                            content:
                                '<p>You can choose a solid default color for your text. For headings, you can also choose a gradient color.</p>',
                            cellId: 'e7mkvq',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'gg20yk',
                    gridStructure: {
                        columns: 2,
                        rows: [
                            {
                                id: 'qhmiqd',
                                cells: [
                                    {
                                        id: 'nw494v',
                                        row: 1,
                                        column: 1,
                                        alignment: 'center',
                                    },
                                    {
                                        id: 'altq37ro96p',
                                        row: 1,
                                        column: 2,
                                        alignment: 'center',
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
                            id: '51xb61h6b5d',
                            content: '<p><span class="heading-text title-text">Title font</span></p>',
                            cellId: 'nw494v',
                            elementTypeId: ElementType.TEXT,
                        },
                        {
                            id: 'vdg57oghq7b',
                            content: '<p><span class="heading-text heading-1">Heading 1</span></p>',
                            cellId: 'nw494v',
                            elementTypeId: ElementType.TEXT,
                        },
                        {
                            id: 'a72j66435rw',
                            content: '<p><span class="heading-text heading-2">Heading 2</span></p>',
                            cellId: 'nw494v',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                        {
                            id: 'j7cs1ue560i',
                            content: '<p><span class="heading-text heading-3">Heading 3</span></p>',
                            cellId: 'nw494v',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                        {
                            id: 'hklx9e39unb',
                            content: '<p><span class="body-text big-text">Large body text</span></p>',
                            cellId: 'altq37ro96p',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                        {
                            id: 'ivrcrubv3sg',
                            content: '<p>Normal body text</p>',
                            cellId: 'altq37ro96p',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                        {
                            id: 'jws6vyf5f4',
                            content: '<p><span class="body-text small-text">Small body text</span></p>',
                            cellId: 'altq37ro96p',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
            ],
            style: {},
            contentAlignment: 'top',
            templateType: 'standard',
        },
        {
            id: 'x8xsuzkh26',
            title: 'Слайд 3',
            layouts: [
                {
                    id: 'udlujny8m7r',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: '3ny1fc',
                                cells: [
                                    {
                                        id: 'm07s35',
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
                            id: 'prvbqde9m5q',
                            content: '<p><span class="heading-text heading-1">Primary accent color</span></p>',
                            cellId: 'm07s35',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'uzfnyl',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'f62eq9',
                                cells: [
                                    {
                                        id: 'h5k6v8',
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
                            id: 'c9h6knqe7e',
                            content:
                                '<ul><li><p>This could be 1 solid color or, a gradient</p></li><li><p>It will apply to buttons, block quotes, smart layouts, callout boxes, <a target="_blank" rel="noopener noreferrer" class="link" href="http://gamma.app">hyperlinks</a> and <span class="footnote-label">footnotes</span>.</p></li></ul><p></p>',
                            cellId: 'h5k6v8',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'd2x5ie',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'ttfqxv',
                                cells: [
                                    {
                                        id: 'txkveh',
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
                            id: 'g8tuy9nymuj',
                            content:
                                "<p><span><strong>Attention all</strong></span><br></p><p><span>This is a callout box. Its default color will be your primary accent color, but don't worry, you can change it.</span></p>",
                            cellId: 'txkveh',
                            elementTypeId: ElementType.BOX,
                            elementVariant: 'warning-box',
                            iconType: 'warning-box',
                            backgroundColor: '#fcf2b5',
                            darkBackgroundColor: '#032349',
                        } as EditorElement,
                    ],
                },
                {
                    id: '9mg64excfd',
                    gridStructure: {
                        columns: 2,
                        columnWidths: ['50%', '50%'],
                        rows: [
                            {
                                id: 'agt3mysdu9',
                                cells: [
                                    {
                                        id: 'fe1yhyet5y',
                                        row: 0,
                                        column: 1,
                                    },
                                    {
                                        id: 'w3wakt4h2z',
                                        row: 1,
                                        column: 2,
                                    },
                                ],
                            },
                        ],
                    },
                    type: 'blank',
                    elements: [
                        {
                            id: 'yi69hll5z6l',
                            content: '<p><span>тут будет кнопка</span></p>',
                            cellId: 'fe1yhyet5y',
                            elementTypeId: ElementType.TEXT,
                            tempLayout: true,
                        } as EditorElement,
                        {
                            id: '6ejk3l6ul82',
                            content: '<p>и вторая кнопка/</p>',
                            cellId: 'fe1yhyet5y',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                        {
                            id: 'j1ax3dna81p',
                            content:
                                '<blockquote class="blockquote"><p>Example of a block quote, here you can write a quote and we will style it.<br><br>— Author</p></blockquote>',
                            cellId: 'w3wakt4h2z',
                            elementTypeId: ElementType.QUOTE,
                            elementVariant: 'quote',
                            textType: 'quote',
                        } as EditorElement,
                    ],
                    style: {},
                },
            ],
            style: {},
            contentAlignment: 'top',
            templateType: 'standard',
        },
        {
            id: 'uqzxx80oz0l',
            title: 'Слайд 4',
            layouts: [
                {
                    id: 'wbtkz4in5dj',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'c10xe6',
                                cells: [
                                    {
                                        id: 'qf4rjd',
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
                            id: 'p1cdlb9vph',
                            content: '<p><span class="heading-text heading-1">That\'s it!</span></p>',
                            cellId: 'qf4rjd',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
                {
                    id: 'foakul',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'fq1s8p',
                                cells: [
                                    {
                                        id: 'y0dtaz',
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
                            id: '4rpmjnpd0qj',
                            content:
                                '<p>Thank you, and we hope you enjoy your Gamma experience <span class="emoji">💜</span></p>',
                            cellId: 'y0dtaz',
                            elementTypeId: ElementType.TEXT,
                        } as EditorElement,
                    ],
                },
            ],
            style: {},
            contentAlignment: 'center',
            templateType: 'imageLeft',
            imageWidthRatio: 0.20387116286103122,
            imageUrl: '',
        },
    ];

    // Рассчитываем CSS переменные для превью
    const layoutVars = getSlideLayoutVars({
        aspectRatio: 1.7777777777777777,
        cardFontScale: 1,
        renderMode: 'view',
        containerWidth: containerDimensions.width,
        containerHeight: containerDimensions.height,
        useContainerScaling: true,
    });

    return (
        <div ref={containerRef} style={layoutVars as React.CSSProperties}>
            <ScopedPresentationThemeWrapper theme={theme}>
                <PresentationViewer
                    theme={theme}
                    slides={sampleSlides}
                    showImagePlaceholder={true}
                    isPreview={true}
                    primaryAccentColor={theme?.colors.primaryAccent || '#000000'}
                />
            </ScopedPresentationThemeWrapper>
        </div>
    );
};
