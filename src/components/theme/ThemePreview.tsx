import React, { useRef, useEffect, useState } from 'react';
import ScopedPresentationThemeWrapper from '@/components/viewer/theme/ScopedPresentationThemeWrapper';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import { Slide } from '@/types';
import { Theme } from '@/types/theme';
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
                    height: rect.height,
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
            id: 'n9pc5wflrn',
            templateType: 'imageRight',
            contentAlignment: 'center',
            layouts: [
                {
                    id: 'dlbhzg31qs5',
                    elements: [
                        {
                            id: 'f999009mk6s',
                            content:
                                '<p class="body-text normal-text"><span class="body-text small-text"><strong>Здравствуйте</strong> </span><span class="body-text small-text">👋</span></p>',
                            elementTypeId: 'text',
                            cellId: 'mayv940932g',
                        },
                    ],
                    gridStructure: {
                        rows: [
                            {
                                id: 'ebzzkr6h9qr',
                                cells: [
                                    {
                                        id: 'mayv940932g',
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
                    id: '4q3yc3',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'yvvdh7',
                                cells: [
                                    {
                                        id: 'c7y2zt',
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
                            id: '4kpm2ow2o8a',
                            content:
                                '<p><span class="heading-text heading-1">Это предварительный просмотр темы</span></p>',
                            elementTypeId: 'text',
                            cellId: 'c7y2zt',
                        },
                    ],
                },
                {
                    id: 'x7rdgm',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: '4ypw34',
                                cells: [
                                    {
                                        id: 'tn8fmo',
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
                            id: 'b6o3ji4cbed',
                            content:
                                '<p class="body-text normal-text">Вот пример основного текста. Вы можете изменить его шрифт и цвет. Ваш акцентный цвет будет использоваться для ссылок. Он также будет использоваться для макетов и кнопок.</p>',
                            elementTypeId: 'text',
                            cellId: 'tn8fmo',
                        },
                    ],
                },
                {
                    id: 'lgawa5',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'sm8xvc',
                                cells: [
                                    {
                                        id: 'ah1hr2',
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
                            id: 'n2ky44pevxd',
                            content: '',
                            elementTypeId: 'smart-layout',
                            cellId: 'ah1hr2',
                            elementVariant: 'text-boxes',
                            items: [
                                {
                                    title: '<p><span class="body-text normal-text">Это умный макет. Он имеет разные шаблоны</span></p>',
                                    text: '<p></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: 'cb4fj6c6lzk',
                                },
                                {
                                    title: '<p><span class="body-text normal-text">Вы можете получить их, набрав /smart</span></p>',
                                    text: '<p></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: 'niexrsuh1dh',
                                },
                            ],
                            columnSize: 2,
                            align: 'center',
                            imageShape: 'square',
                            imageSize: 5,
                        },
                    ],
                },
                {
                    id: '06rpgywrux8l',
                    gridStructure: {
                        columns: 1,
                        columnWidths: ['100%'],
                        rows: [
                            {
                                id: 'r07mm3xykfh',
                                cells: [
                                    {
                                        id: '3l1kc1ko1xo',
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
                            id: 'eb1d7kexn3',
                            content:
                                '<p class="body-text normal-text">Справа это то, что мы называем акцентным изображением. У нас есть их набор с нашими темами по умолчанию, но вы можете их изменить! <span class="body-text normal-text">➡️</span></p>',
                            elementTypeId: 'text',
                            tempLayout: true,
                            cellId: '3l1kc1ko1xo',
                        },
                    ],
                    style: {},
                },
            ],
            imageWidthRatio: 0.33,
            imageUrl: '/uploads/c4a34d53-1308-46ce-b12b-d9e744d0325a.jpeg',
        },
        {
            id: '18gy5wyejq9',
            title: 'Слайд 2',
            layouts: [
                {
                    id: 'onrby0guoa',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'ypb5qb',
                                cells: [
                                    {
                                        id: 'w099b5',
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
                            id: '52xs8tj9gqu',
                            content: '<p><span class="heading-text title-text">Умные макеты</span></p>',
                            elementTypeId: 'text',
                            cellId: 'w099b5',
                        },
                    ],
                },
                {
                    id: 'cbvzgo',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'fbk0cq',
                                cells: [
                                    {
                                        id: 'yrbk1u',
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
                            id: 'urod0dk9gp',
                            content: '<p><span class="heading-text heading-3">Хронология</span></p>',
                            elementTypeId: 'text',
                            cellId: 'yrbk1u',
                        },
                    ],
                },
                {
                    id: 'xsqtbn',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'yuxh2x',
                                cells: [
                                    {
                                        id: '7c9uc3',
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
                            id: 'f8qn8v99y6',
                            content: '',
                            elementTypeId: 'smart-layout',
                            cellId: '7c9uc3',
                            elementVariant: 'timeline',
                            items: [
                                {
                                    title: '<p style="text-align: center"><span class="heading-text heading-3">Первый заголовок</span></p>',
                                    text: '<p style="text-align: center"><span class="body-text normal-text">Это первая точка временной шкалы</span></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: 'pc0q41vnvd',
                                },
                                {
                                    title: '<p style="text-align: center"><span class="heading-text heading-3">Второй заголовок</span></p>',
                                    text: '<p style="text-align: center"><span class="body-text normal-text">Вы можете легко добавлять и удалять точки, и мы автоматически изменим размер вашего контента</span></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: '46jq97pmp5y',
                                },
                                {
                                    title: '<p style="text-align: center"><span class="heading-text heading-3">Третий заголовок</span></p>',
                                    text: '<p style="text-align: center"><span class="body-text normal-text">Именно поэтому мы называем их "умными макетами". </span></p>',
                                    imageUrl: '',
                                    iconUrl: '',
                                    id: 'ektdwebv7hf',
                                },
                            ],
                            columnSize: 3,
                            align: 'left',
                            imageShape: 'square',
                            imageSize: 5,
                            direction: 'horizontal',
                            showNumbers: true,
                            showLines: true,
                        },
                    ],
                },
                {
                    id: 'elzcv0w48bi',
                    gridStructure: {
                        columns: 1,
                        columnWidths: ['100%'],
                        rows: [
                            {
                                id: '6f6s5defpy7',
                                cells: [
                                    {
                                        id: 'qc135izl59o',
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
                            id: 'fdiscw7wgbe',
                            content: '<p><span class="heading-text heading-3">Изображения с текстом</span></p>',
                            elementTypeId: 'text',
                            tempLayout: true,
                            cellId: 'qc135izl59o',
                        },
                    ],
                    style: {},
                },
                {
                    id: 'skedkk0eumc',
                    gridStructure: {
                        columns: 1,
                        columnWidths: ['100%'],
                        rows: [
                            {
                                id: '79ovgldvia5',
                                cells: [
                                    {
                                        id: '5ifseuhcl0w',
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
                            id: 'vc8mnmcit3a',
                            content: '',
                            elementTypeId: 'smart-layout',
                            tempLayout: true,
                            cellId: '5ifseuhcl0w',
                            elementVariant: 'images-with-text',
                            items: [
                                {
                                    title: '<p><span class="heading-text heading-3">Первый заголовок</span></p>',
                                    text: '<p><span class="body-text normal-text">Вы можете загружать свои изображения или создавать их с помощью ИИ</span></p>',
                                    imageUrl: '/uploads/613a532a-1ef6-4151-8b9d-ad81b717d13e.webp',
                                    iconUrl: '',
                                    id: 'qq4yjelpjt8',
                                    uploaded: true,
                                },
                                {
                                    title: '<p><span class="heading-text heading-3">Второй заголовок</span></p>',
                                    text: '<p><span class="body-text normal-text">Размер изображения можно изменить</span></p>',
                                    imageUrl: '/uploads/600b8874-c937-4e0b-be0f-c09cfe0b95c9.webp',
                                    iconUrl: '',
                                    id: 'dzxk5xik7mb',
                                    uploaded: true,
                                },
                                {
                                    title: '<p><span class="heading-text heading-3">Третий заголовок</span></p>',
                                    text: '<p><span class="body-text normal-text">И прижать к нужной стороне карточки</span></p>',
                                    imageUrl: '/uploads/0787ea69-3a74-46c4-8ebd-e917bb749b2f.webp',
                                    iconUrl: '',
                                    id: '2qywtsylfg7',
                                    uploaded: true,
                                },
                            ],
                            columnSize: 3,
                            align: 'center',
                            imageShape: 'square',
                            imageSize: 5,
                        },
                    ],
                    style: {},
                },
            ],
            style: {},
            contentAlignment: 'center',
            templateType: 'standard',
        },
        {
            id: '26zae1xqm91',
            title: 'Слайд 3',
            layouts: [
                {
                    id: 'sriklnzirp',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'thpvno',
                                cells: [
                                    {
                                        id: 'vp63j1',
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
                            id: 'wfz1tsqf98m',
                            content: '<p><span class="heading-text title-text">Шрифты</span></p>',
                            elementTypeId: 'text',
                            cellId: 'vp63j1',
                        },
                    ],
                },
                {
                    id: 'zaggye',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'q52fou',
                                cells: [
                                    {
                                        id: 'hx3lt3',
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
                            id: 'wbs8yqe6qf',
                            content:
                                '<p><span class="body-text normal-text">Мы заранее подрали размеры шрифтов, которые лучше всего подходят. А вы можете выбирать семейства шрифтов для заголовков и основного шрифта.</span></p>',
                            elementTypeId: 'text',
                            cellId: 'hx3lt3',
                        },
                    ],
                },
                {
                    id: 'g2q7jn',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 's318uu',
                                cells: [
                                    {
                                        id: 'g424n7',
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
                            id: '87l2ksaa698',
                            content:
                                '<p><span class="body-text normal-text">Так же вы можете настраивать цвета заголовка и основного текста</span></p>',
                            elementTypeId: 'text',
                            cellId: 'g424n7',
                        },
                    ],
                },
                {
                    id: 'ko5chr',
                    gridStructure: {
                        columns: 2,
                        rows: [
                            {
                                id: '35kp5k',
                                cells: [
                                    {
                                        id: '7ci1z1usc45',
                                        row: 1,
                                        column: 1,
                                    },
                                    {
                                        id: 'jwt5zl',
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
                            id: 'qykh23u1jc',
                            content: '<h1 class="heading-text title-text">Шрифт заголовка</h1>',
                            elementTypeId: 'text',
                            cellId: '7ci1z1usc45',
                        },
                        {
                            id: 'yt3zos',
                            elementTypeId: 'text',
                            elementVariant: 'heading1',
                            textType: 'heading',
                            level: 2,
                            content: '<span class="heading-text heading-1">Подзаголовок 1</span>',
                            cellId: '7ci1z1usc45',
                        },
                        {
                            id: 'uuazch',
                            elementTypeId: 'text',
                            elementVariant: 'heading2',
                            textType: 'heading',
                            level: 3,
                            content: '<span class="heading-text heading-2">Подзаголовок 2</span>',
                            cellId: '7ci1z1usc45',
                        },
                        {
                            id: 'wbek5k',
                            elementTypeId: 'text',
                            elementVariant: 'heading3',
                            textType: 'heading',
                            level: 4,
                            content: '<span class="heading-text heading-3">Подзаголовок 3</span>',
                            cellId: '7ci1z1usc45',
                        },
                        {
                            id: '4dv4ty',
                            elementTypeId: 'text',
                            elementVariant: 'heading4',
                            textType: 'heading',
                            level: 5,
                            content: '<span class="heading-text heading-4">Подзаголовок 4</span>',
                            cellId: '7ci1z1usc45',
                        },
                        {
                            id: 'emj0mqyxkw8',
                            content: '<p><span class="body-text big-text">Большой текст</span></p>',
                            elementTypeId: 'text',
                            cellId: 'jwt5zl',
                        },
                        {
                            id: 'mb28y1',
                            elementTypeId: 'text',
                            elementVariant: 'text',
                            textType: 'text',
                            level: 7,
                            content: '<p><span class="body-text normal-text">Обычный текст</span></p>',
                            cellId: 'jwt5zl',
                        },
                        {
                            id: 'drfgdcej3o5',
                            content: '<p><span class="body-text small-text">маленький текст</span></p>',
                            elementTypeId: 'text',
                            cellId: 'jwt5zl',
                        },
                    ],
                },
            ],
            style: {},
            contentAlignment: 'top',
            templateType: 'standard',
            imageHeightRatio: 0.33,
        },
        {
            id: 'ptmzqg788lq',
            title: 'Слайд 4',
            layouts: [
                {
                    id: 't7slewqo28i',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'nd9xh6',
                                cells: [
                                    {
                                        id: 'dnqsa8',
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
                            id: 'b4i3j6502c',
                            content: '<p><span class="heading-text title-text">Основной акцентный цвет</span></p>',
                            elementTypeId: 'text',
                            cellId: 'dnqsa8',
                        },
                    ],
                },
                {
                    id: 'issapw',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: '26idbs',
                                cells: [
                                    {
                                        id: 'nyu3gg',
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
                            id: 'gf6fpf9w83',
                            content:
                                '<p><span class="body-text normal-text">Он относится к кнопкам, текстовым блокам, умным макетам и ссылкам</span></p><p class="body-text normal-text"></p>',
                            elementTypeId: 'text',
                            cellId: 'nyu3gg',
                        },
                    ],
                },
                {
                    id: 'mqahj7mgtmb',
                    type: 'blank',
                    elements: [
                        {
                            id: '7lq15l',
                            elementTypeId: 'box',
                            elementVariant: 'note-box',
                            iconType: 'warning-box',
                            content:
                                '<p><span class="body-text normal-text">Это текстовый блок. Его фон подстраивается под тему слайда, но вы можете его изменить.</span></p>',
                            backgroundColor: '#ffb3b3',
                            darkBackgroundColor: '#01004d',
                            cellId: 'eyo1typqt8t',
                        },
                    ],
                    style: {},
                    gridStructure: {
                        rows: [
                            {
                                id: 'uopn2i22lhe',
                                cells: [
                                    {
                                        id: 'eyo1typqt8t',
                                        row: 1,
                                        column: 1,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: [],
                    },
                },
                {
                    id: 'lsyqqh1da9q',
                    type: 'blank',
                    elements: [
                        {
                            id: 'n17hqc',
                            elementTypeId: 'quote',
                            elementVariant: 'quote',
                            textType: 'quote',
                            content:
                                '<blockquote class="blockquote"><p><span class="body-text normal-text"><p><span class="body-text normal-text">Вы можете использовать цитаты. А мы их оформим.</span><br><br>- Автор</p></span></p></blockquote>',
                            cellId: '1am6on940xl',
                        },
                    ],
                    style: {},
                    gridStructure: {
                        rows: [
                            {
                                id: '7uor862s8qk',
                                cells: [
                                    {
                                        id: '1am6on940xl',
                                        row: 1,
                                        column: 1,
                                    },
                                ],
                            },
                        ],
                        columns: 1,
                        columnWidths: [],
                    },
                },
            ],
            style: {},
            contentAlignment: 'top',
            templateType: 'standard',
        },
        {
            id: 'dacio7d416v',
            title: 'Слайд 5',
            layouts: [
                {
                    id: '63kztmv5uls',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'ggm0p0',
                                cells: [
                                    {
                                        id: '83nk4u',
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
                            id: 'b9cnc38s0of',
                            content:
                                '<p><span class="heading-text title-text">Дополнительные акцентные цвета</span></p>',
                            elementTypeId: 'text',
                            cellId: '83nk4u',
                        },
                    ],
                },
                {
                    id: 'n6ncwa',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'p7qjmm',
                                cells: [
                                    {
                                        id: 'zdgl1d',
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
                            id: 'r79lq9k67ui',
                            content:
                                '<p><span class="body-text normal-text">В дополнение к основному акцентному цветы вы можете использовать дополнительные. Они будут отображаться в цветовой палитре, а так же могут использоваться для фонов умных макетов.</span></p>',
                            elementTypeId: 'text',
                            cellId: 'zdgl1d',
                        },
                    ],
                },
            ],
            style: {},
            contentAlignment: 'top',
            templateType: 'standard',
            imageHeightRatio: 0.33,
        },
        {
            id: 'c7h1m6kyok7',
            title: 'Слайд 6',
            layouts: [
                {
                    id: 'ubyoo0i07l',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'zsjxi3',
                                cells: [
                                    {
                                        id: 'tfm1k5',
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
                            id: 'l4zq3xgjrr',
                            content: '<p><span class="heading-text title-text">Готово!</span></p>',
                            elementTypeId: 'text',
                            cellId: 'tfm1k5',
                        },
                    ],
                },
                {
                    id: 'twkw5q',
                    gridStructure: {
                        columns: 1,
                        rows: [
                            {
                                id: 'r07ne0',
                                cells: [
                                    {
                                        id: '18ziza',
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
                            id: 'b33d2k39x1e',
                            content:
                                '<p><span class="body-text normal-text">Надеемся, что вам понравится ваш опыт работы со Slydle.</span></p>',
                            elementTypeId: 'text',
                            cellId: '18ziza',
                        },
                    ],
                },
            ],
            style: {},
            contentAlignment: 'center',
            templateType: 'imageLeft',
            imageWidthRatio: 0.33,
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
