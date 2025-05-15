import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Мок-ответ
    const { description, numSlides, tone } = await req.json();
    const slides = Array.from({ length: numSlides || 5 }, (_, i) => ({
        title: `Слайд ${i + 1}: Тема по описанию — ${description.slice(0, 30)}...`,
        instructions: '',
    }));
    return NextResponse.json({
        title: 'Новая презентация',
        description: description || '',
        topics: slides,
    });
}
