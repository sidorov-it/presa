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

export const PreviewTemplateImages = {
    marketingStrategy: 'https://app.slydle.ru/uploads/images/marketingStrategy.png',
    projectKickoff: 'https://app.slydle.ru/uploads/images/projectKickoff.png',
    startapPitchDeck: 'https://app.slydle.ru/uploads/images/startapPitchDeck.png',
    marketingAgency: 'https://app.slydle.ru/uploads/images/marketingAgency.png',
};

export type PresentationTemplateKeys = keyof typeof PresentationTemplateDescriptors;

export const PresentationTemplates = Object.fromEntries(
    Object.entries(PresentationTemplateDescriptors).map(([key, desc]) => [
        key,
        generatePresentationTemplate(desc as unknown as PresentationDescriptor),
    ])
) as Record<PresentationTemplateKeys, ReturnType<typeof generatePresentationTemplate>>;

export function createPresentationFromTemplate(key: PresentationTemplateKeys) {
    return PresentationTemplateDescriptors[key];
}

export * from './generator';
