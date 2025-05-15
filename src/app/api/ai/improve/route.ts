import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import rewriteSlideContent from '@/services/llm/gigaChat/rewriteSlideContent';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

// function generateSlotDescription(slide: Slide): string {
//     return slide.layouts
//         .map((layout, layoutIndex) => {
//             return (
//                 `Layout ${layoutIndex + 1}:\n` +
//                 layout.elements
//                     .map(element => {
//                         const elementConfig = getElementConfig(element.elementTypeId);

//                         if (!elementConfig) return '';

//                         if (elementConfig.slot) {
//                             return `Слот "${element.id}-${elementConfig.slot}":
//     - Тип: ${elementConfig.elementTypeId}
//     - Назначение: ${elementConfig.llmHints?.purpose || 'Не указано'}
//                                 ${elementConfig.llmHints?.contextRules ? '- Правила:\n' + elementConfig.llmHints.contextRules.map(rule => `  * ${rule}`).join('\n') : ''}`;
//                         } else if (elementConfig.slots) {
//                             return elementConfig.slots
//                                 .map(
//                                     slot => `Слот "${element.id}-${slot.slot}":
//     - Тип: ${elementConfig.elementTypeId}
//     - Назначение: ${slot.llmHint}`
//                                 )
//                                 .join('\n');
//                         }
//                     })
//                     .join('\n\n')
//             );
//         })
//         .join('\n\n');
// }

// function createPrompt(
//     topic: string,
//     slideIndex: number,
//     totalSlides: number,
//     slide: Slide,
//     instructions?: string
// ): string {
//     const slotsDescription = generateSlotDescription(slide);

//     return `Создай структурированный контент для слайда ${slideIndex} из ${totalSlides} о теме: "${topic}"

// Структура слайда:
// ${slotsDescription}

// Требования:
// 1. Создай контент для каждого слота в соответствии с его типом и назначением
// 2. Для элементов типа image опиши, какое изображение нужно сгенерировать
// 3. Учитывай назначение и правила для каждого слота
// ${instructions ? `4. Дополнительные инструкции: ${instructions}` : ''}`;
// }

// function parseGeneratedContent(
//     content: Array<Array<SlotContent>>
// ): Array<Record<string, string | SmartLayoutContent>> {
//     return content.map(layoutContent =>
//         layoutContent.reduce(
//             (acc, { key, value }) => {
//                 acc[key] = value.type === 'string' ? value.stringContent! : { items: value.items! };
//                 return acc;
//             },
//             {} as Record<string, string | SmartLayoutContent>
//         )
//     );
// }

interface RewriteRequestBody {
    slideId: string;
    presentationId: string;
    comment?: string;
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = (await request.json()) as RewriteRequestBody;
        const { slideId, presentationId, comment } = body;

        if (!slideId || !presentationId) {
            return NextResponse.json({ error: 'Missing required fields: slideId or presentationId' }, { status: 400 });
        }

        // Получаем презентацию
        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
        });

        if (!presentation) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        // Находим текущий слайд и его соседей
        const slideIndex = presentation.slides.findIndex(s => s.id === slideId);
        if (slideIndex === -1) {
            return NextResponse.json({ error: 'Slide not found' }, { status: 404 });
        }

        const currentSlide = presentation.slides[slideIndex];
        const content = await rewriteSlideContent(session.user.id, currentSlide);

        return NextResponse.json(content);
    } catch (error) {
        console.error('Error in AI improve route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
