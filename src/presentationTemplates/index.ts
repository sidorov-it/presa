import { generatePresentationTemplate, PresentationDescriptor } from './generator';
import marketingStrategyDescriptor from './marketingStrategy.json';
import projectKickoffDescriptor from './projectKickoff.json';
import startapPitchDeckDescriptor from './startapPitchDeck.json';
import marketingAgencyDescriptor from './marketingAgency.json';

// export const marketingStrategyDescriptor: PresentationDescriptor = {
//     title: 'Портфолио',
//     description: 'Простое портфолио для демонстрации ваших работ и навыков.',
//     themeId: 'atacama',
//     slides: [
//         {
//             title: 'Welcome',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Your Name' },
//                         { type: 'text', content: 'Short description about yourself' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Projects',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Projects' },
//                         { type: 'text', content: 'Highlight a few key projects and achievements.' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Contact',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Get in Touch' },
//                         { type: 'text', content: 'your.email@example.com' },
//                     ],
//                 },
//             ],
//         },
//     ],
// };

// export const salesDeckDescriptor: PresentationDescriptor = {
//     title: 'Презентация продаж',
//     themeId: 'ocean-breeze',
//     description: 'Шаблон для презентации вашего продукта потенциальным клиентам.',
//     slides: [
//         {
//             title: 'Overview',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Product Name' },
//                         { type: 'text', content: 'A brief description of your product or service.' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Benefits',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Why Choose Us' },
//                         { type: 'text', content: 'Key benefits and unique selling points.' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Next Steps',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: "Let's Work Together" },
//                         { type: 'text', content: 'Call to action or contact information.' },
//                     ],
//                 },
//             ],
//         },
//     ],
// };

// export const salesPresentationDescriptor: PresentationDescriptor = {
//     title: 'Презентация продаж',
//     description: 'Общая презентация продаж.',
//     themeId: 'forest-whisper',
//     slides: [
//         {
//             title: 'Introduction',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Welcome' },
//                         { type: 'text', content: 'Introduce your company and mission.' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Problem',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'The Challenge' },
//                         { type: 'text', content: 'Describe the problem your audience faces.' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Solution',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Our Solution' },
//                         { type: 'text', content: 'Explain how your product solves the problem.' },
//                     ],
//                 },
//             ],
//         },
//         {
//             title: 'Contact',
//             layouts: [
//                 {
//                     elements: [
//                         { type: 'Heading', content: 'Get Started Today' },
//                         { type: 'text', content: 'Contact us for more information.' },
//                     ],
//                 },
//             ],
//         },
//     ],
// };

export const PresentationTemplateDescriptors = {
    marketingStrategy: marketingStrategyDescriptor,
    projectKickoff: projectKickoffDescriptor,
    startapPitchDeck: startapPitchDeckDescriptor,
    marketingAgency: marketingAgencyDescriptor,
    // salesDeck: salesDeckDescriptor,
    // salesPresentation: salesPresentationDescriptor,
    // personalPortfolio: personalPortfolioDescriptor,
};

export type PresentationTemplateKeys = keyof typeof PresentationTemplateDescriptors;

export const PresentationTemplates = Object.fromEntries(
    Object.entries(PresentationTemplateDescriptors).map(([key, desc]) => [
        key,
        generatePresentationTemplate(desc as PresentationDescriptor),
    ])
) as Record<PresentationTemplateKeys, ReturnType<typeof generatePresentationTemplate>>;

export function createPresentationFromTemplate(key: PresentationTemplateKeys) {
    return {
        _id: {
            $oid: '686b56a6fdc5b1f44d7dbce4',
        },
        title: '[Шаблон] Client Presentation - Digital Marketing Agency Example',
        description: '',
        slides: [
            {
                id: 'csk0pmlftbb',
                templateType: 'imageLeft',
                contentAlignment: 'center',
                layouts: [
                    {
                        id: '5wy05eeueb6',
                        elements: [
                            {
                                id: '3sh0e056489',
                                content:
                                    '<p><span class="heading-text title-text">The Benefits of Digital Marketing</span></p>',
                                elementTypeId: 'text',
                                cellId: 'rpbe06r22q',
                            },
                        ],
                        gridStructure: {
                            rows: [
                                {
                                    id: 'b2293w0pen',
                                    cells: [
                                        {
                                            id: 'rpbe06r22q',
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
                ],
                imageWidthRatio: 0.3437350805955458,
                imageUrl: '/uploads/e3087947-1148-4cde-b74e-55d1bf6203af.jpeg',
            },
            {
                id: '7az2vovb3w',
                title: 'Слайд 2',
                layouts: [
                    {
                        id: 'awo3a9wsh16',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: '8iel27',
                                    cells: [
                                        {
                                            id: 'lnm1ar',
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
                                id: 'cdkzip0tj5d',
                                content:
                                    '<p><span class="heading-text heading-1">How to Reach Your Target Customers</span></p>',
                                elementTypeId: 'text',
                                cellId: 'lnm1ar',
                            },
                        ],
                    },
                    {
                        id: 'ste8q7',
                        gridStructure: {
                            columns: 2,
                            rows: [
                                {
                                    id: '8u3yg4',
                                    cells: [
                                        {
                                            id: 'p8clt8',
                                            row: 1,
                                            column: 1,
                                        },
                                        {
                                            id: 'v9s1sjaosy8',
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
                                id: '03lck8ndho6w',
                                content: '<p><span class="heading-text heading-3">Content Plans</span></p>',
                                elementTypeId: 'text',
                                cellId: 'p8clt8',
                            },
                            {
                                id: 'qcjo2wyshh',
                                content:
                                    '<p class="body-text normal-text">Developing content plans tailored to target audiences, interests and influencers.</p>',
                                elementTypeId: 'text',
                                cellId: 'p8clt8',
                            },
                            {
                                id: 'qxnjj072k6g',
                                content:
                                    '<p><span class="heading-text heading-3">Online Ads</span><span class="heading-text heading-3">&nbsp;</span></p>',
                                elementTypeId: 'text',
                                cellId: 'v9s1sjaosy8',
                            },
                            {
                                id: 'lhpnsp2yhaq',
                                content:
                                    '<p class="body-text normal-text">Creating and managing campaigns with display, search and social media advertising.</p>',
                                elementTypeId: 'text',
                                cellId: 'v9s1sjaosy8',
                            },
                        ],
                    },
                ],
                style: {},
                contentAlignment: 'center',
                templateType: 'imageRight',
                imageWidthRatio: 0.3057751937984496,
                imageUrl: '/uploads/4f473383-10e1-4dd5-9d0d-330e0e2284ec.jpeg',
            },
            {
                id: '92y3znb7ahb',
                title: 'Слайд 3',
                layouts: [
                    {
                        id: '7u4ep8kdvuv',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'i63lan',
                                    cells: [
                                        {
                                            id: 'hwge61',
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
                                id: 'uoq71g14icf',
                                content:
                                    '<p><span class="heading-text title-text">Our Offering</span><span class="heading-text title-text">&nbsp;</span></p>',
                                elementTypeId: 'text',
                                cellId: 'hwge61',
                            },
                        ],
                    },
                    {
                        id: '8re3k2',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'ydmtl8',
                                    cells: [
                                        {
                                            id: '2wljo2',
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
                                id: '6rbz1rubjqa',
                                content: '<p><span class="body-text normal-text">/</span></p>',
                                elementTypeId: 'smart-layout',
                                cellId: '2wljo2',
                                elementVariant: 'text-boxes',
                                items: [
                                    {
                                        title: '<p style="text-align: left"><span class="body-text big-text" style="color: #3a3630">Remarketing</span></p>',
                                        text: '<p style="text-align: left"><span class="body-text normal-text" style="color: #3a3630">Reaching out to customers who have already visited your website with personalized messages.</span></p>',
                                        imageUrl: '',
                                        iconUrl: '',
                                        id: '6328l1cevqg',
                                        backgroundColor: '#f3e7d4',
                                        textColor: '#000000',
                                    },
                                    {
                                        title: '<p style="text-align: left"><span class="body-text big-text" style="color: #3a3630">Experimentation</span></p>',
                                        text: '<p style="text-align: left"><span class="body-text normal-text" style="color: #3a3630">Analyzing data, testing strategies and optimizing campaigns for increased success.</span></p>',
                                        imageUrl: '',
                                        iconUrl: '',
                                        id: 'xxtpb59fslk',
                                        backgroundColor: '#f3e7d4',
                                        textColor: '#000000',
                                    },
                                    {
                                        title: '<p style="text-align: left"><span class="body-text big-text" style="color: #3a3630">Effective Support</span></p>',
                                        text: '<p style="text-align: left"><span class="body-text normal-text" style="color: #3a3630">Collaborate closely with you in order to guarantee that all campaigns have the desired outcomes.</span></p>',
                                        imageUrl: '',
                                        iconUrl: '',
                                        id: 'p85sd7e27g',
                                        backgroundColor: '#f3e7d4',
                                        textColor: '#000000',
                                    },
                                ],
                                columnSize: 3,
                                align: 'left',
                                imageShape: 'square',
                                imageSize: 5,
                            },
                        ],
                    },
                ],
                style: {},
                contentAlignment: 'center',
                templateType: 'standard',
            },
            {
                id: 'zqdnpez11p',
                title: 'Слайд 4',
                layouts: [
                    {
                        id: 'k6mu0n9wa7b',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: '3f7fbm',
                                    cells: [
                                        {
                                            id: '4c6moy',
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
                                id: 'xrjksco6dwg',
                                content: '<p><span class="heading-text title-text">Our Process</span></p>',
                                elementTypeId: 'text',
                                cellId: '4c6moy',
                            },
                        ],
                    },
                    {
                        id: 'yinuf7',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'kqs250',
                                    cells: [
                                        {
                                            id: 'x00xa3',
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
                                id: 'z9z2ns2drl',
                                content: '<p><span class="heading-text heading-3">Step 1:</span></p>',
                                elementTypeId: 'text',
                                cellId: 'x00xa3',
                            },
                        ],
                    },
                    {
                        id: 'ixp3k1',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'aq2lt4',
                                    cells: [
                                        {
                                            id: 'ut2dd7',
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
                                id: 'fvdm6i5lhzh',
                                content:
                                    '<p>We will begin by understanding your goals, objectives and needs, and develop a customized strategy to help you reach them.</p>',
                                elementTypeId: 'text',
                                cellId: 'ut2dd7',
                            },
                        ],
                    },
                    {
                        id: '3eeifa',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: '7px9oa',
                                    cells: [
                                        {
                                            id: 'z4qsha',
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
                                id: '258vnwj73wr',
                                content: '<p><span class="heading-text heading-3">Step 2:</span></p>',
                                elementTypeId: 'text',
                                cellId: 'z4qsha',
                            },
                        ],
                    },
                    {
                        id: 'fzdbus',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: '74l0ee',
                                    cells: [
                                        {
                                            id: 'qlntft',
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
                                id: 'bt53ew5hp6i',
                                content:
                                    '<p>Our team will create and design compelling content for your campaigns and create ad copy that engages your target audience.</p>',
                                elementTypeId: 'text',
                                cellId: 'qlntft',
                            },
                        ],
                    },
                    {
                        id: 'dzrgsp',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'wcu3xi',
                                    cells: [
                                        {
                                            id: 'igzbts',
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
                                id: 'cvx5z4ziby4',
                                content: '<p><span class="heading-text heading-3">Step 3:</span></p>',
                                elementTypeId: 'text',
                                cellId: 'igzbts',
                            },
                        ],
                    },
                    {
                        id: 'mtu128',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'ikcgvf',
                                    cells: [
                                        {
                                            id: 'ask51u',
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
                                id: 'r2s19nnvlu',
                                content:
                                    '<p>We will use the latest technologies and data-driven insights to deliver campaigns and track their performance, ensuring that they are successful.</p>',
                                elementTypeId: 'text',
                                cellId: 'ask51u',
                            },
                        ],
                    },
                    {
                        id: 'zu9ndw',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'r73z82',
                                    cells: [
                                        {
                                            id: 'rb8a7o',
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
                                id: '2fx0xbd5jo8',
                                content: '<p><span class="heading-text heading-3">Step 4:</span></p>',
                                elementTypeId: 'text',
                                cellId: 'rb8a7o',
                            },
                        ],
                    },
                    {
                        id: 's7lyg3',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'zxrfew',
                                    cells: [
                                        {
                                            id: 'se6ecf',
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
                                id: 'ttcbpmlpbp',
                                content:
                                    '<p><span class="body-text normal-text">We will analyze the collected data and adjust campaigns as necessary in order to maximize their output.</span></p>',
                                elementTypeId: 'text',
                                cellId: 'se6ecf',
                            },
                        ],
                    },
                    {
                        id: 'f6g3jl',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'jbpqlf',
                                    cells: [
                                        {
                                            id: 'qk07al',
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
                                id: 'gucmz0dbf6',
                                content: '<p><span class="body-text normal-text">&nbsp;</span></p>',
                                elementTypeId: 'text',
                                cellId: 'qk07al',
                            },
                        ],
                    },
                ],
                style: {},
                contentAlignment: 'center',
                templateType: 'imageRight',
                imageWidthRatio: 0.33,
                imageUrl: '/uploads/df20cbd2-5257-4ad9-889d-319130111996.avif',
            },
            {
                id: '128y3mcayrgb',
                title: 'Слайд 5',
                layouts: [
                    {
                        id: 'zrjvxjqwte',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: '8hycgy',
                                    cells: [
                                        {
                                            id: '68mjym',
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
                                id: 'pcxcz95mhkg',
                                content:
                                    '<p><span class="heading-text title-text">Our Team</span><span class="heading-text title-text">&nbsp;</span></p>',
                                elementTypeId: 'text',
                                cellId: '68mjym',
                            },
                        ],
                    },
                    {
                        id: '3813vv',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: '2q1ykb',
                                    cells: [
                                        {
                                            id: 'kod8zc',
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
                                id: 'lgj4g7fy1wt',
                                content: '<p><span class="body-text normal-text">/</span></p>',
                                elementTypeId: 'smart-layout',
                                cellId: 'kod8zc',
                                elementVariant: 'images-with-text',
                                items: [
                                    {
                                        title: '<p style="text-align: left"><span class="heading-text heading-3">UX Experts</span></p>',
                                        text: '<p style="text-align: left"><span class="body-text normal-text">Our team of experienced UI/UX designers will create highly engaging experiences for your customers.</span></p>',
                                        imageUrl: '/uploads/019f0666-7c03-434b-8ff2-e498a7956b69.jpeg',
                                        iconUrl: '',
                                        id: 'g58kx530auc',
                                        uploaded: true,
                                    },
                                    {
                                        title: '<p style="text-align: left"><span class="heading-text heading-3">Analysts</span></p>',
                                        text: '<p style="text-align: left">Our team of analytics experts will track the performance of your campaigns and adjust them as necessary.</p>',
                                        imageUrl: '/uploads/d4deb445-6f6f-4082-a635-0bc191571f02.jpeg',
                                        iconUrl: '',
                                        id: 'vkcv904os8',
                                        uploaded: true,
                                    },
                                    {
                                        title: '<p style="text-align: left"><span class="heading-text heading-3">Specialists</span></p>',
                                        text: '<p style="text-align: left">Our marketing professionals will work to create content and campaigns that drive brand awareness and engagement.</p>',
                                        imageUrl: '/uploads/e03aab2c-b3a2-4235-97f9-fdfdde53490a.webp',
                                        iconUrl: '',
                                        id: 'ezy61wd3q8d',
                                        uploaded: true,
                                    },
                                ],
                                columnSize: 3,
                                align: 'left',
                                imageShape: 'square',
                                imageSize: 5,
                            },
                        ],
                    },
                ],
                style: {},
                contentAlignment: 'center',
                templateType: 'standard',
            },
            {
                id: 'htj69cnxr7',
                title: 'Слайд 6',
                layouts: [
                    {
                        id: '8xjhfi8eatn',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'd7bjeg',
                                    cells: [
                                        {
                                            id: 'z3kyl2',
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
                                id: 'ulvaj5bej6b',
                                content: '<p><span class="heading-text title-text">Why Choose Us?</span></p>',
                                elementTypeId: 'text',
                                cellId: 'z3kyl2',
                            },
                        ],
                    },
                    {
                        id: '8tggkj',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'y0wfzc',
                                    cells: [
                                        {
                                            id: 'a30vjs',
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
                                id: 'p642p0ttrn',
                                content: '<p><span class="body-text normal-text">smarlayout bullets&nbsp;</span></p>',
                                elementTypeId: 'text',
                                cellId: 'a30vjs',
                            },
                        ],
                    },
                ],
                style: {},
                contentAlignment: 'top',
                templateType: 'imageTop',
                imageHeightRatio: 0.244359542266519,
                imageUrl: '/uploads/f6c5c108-b855-4ba1-ade8-285c36aa749d.avif',
            },
            {
                id: 'jqed9x6sx1o',
                title: 'Слайд 7',
                layouts: [
                    {
                        id: 'lc2aabpu08i',
                        gridStructure: {
                            columns: 1,
                            rows: [
                                {
                                    id: 'phn9mi',
                                    cells: [
                                        {
                                            id: 'pme373',
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
                                id: 't5skh0h8gi7',
                                content: '<p><span class="body-text normal-text">&nbsp;</span></p>',
                                elementTypeId: 'text',
                                cellId: 'pme373',
                            },
                        ],
                    },
                ],
                style: {},
                contentAlignment: 'center',
                templateType: 'standard',
            },
        ],
        userId: {
            $oid: '67ecfcff96c6214c66f2b6ef',
        },
        isDeleted: false,
        createdAt: {
            $date: '2025-07-07T05:09:58.875Z',
        },
        updatedAt: {
            $date: '2025-07-07T15:46:20.169Z',
        },
        durationMinutes: null,
        goal: null,
        audience: null,
        tone: null,
        themeId: {
            $oid: '686944e7b3ebb23e20fdab27',
        },
        deletedAt: null,
        backgroundSettings: null,
    };
    // return generatePresentationTemplate(PresentationTemplateDescriptors[key]);
}

export * from './generator';
