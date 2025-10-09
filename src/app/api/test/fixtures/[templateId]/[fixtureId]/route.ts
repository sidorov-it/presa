import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { createSlideFromTemplateWithContent } from '@/utils/createSlideFromTemplateWithContent';
import type { SlotKeyMapping } from '@/types/gigachat';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ templateId: string; fixtureId: string }> }
) {
    const { templateId, fixtureId } = await params;

    try {
        const template = SlideTemplatesRegistry[templateId];
        if (!template) {
            return NextResponse.json({ error: `Шаблон ${templateId} не найден` }, { status: 404 });
        }

        const fixturesRoot = path.join(process.cwd(), 'test/llm-fixtures/templates');
        const normalizedId = fixtureId.endsWith('.json') ? fixtureId : `${fixtureId}.json`;
        const fixturePath = path.join(fixturesRoot, templateId, normalizedId);

        const fileContent = await fs.readFile(fixturePath, 'utf8');
        const fixture = JSON.parse(fileContent) as {
            requestId: string;
            functionArgs: Record<string, string | string[] | Record<string, unknown>>;
            slotMapping: Array<[string, SlotKeyMapping]>;
            scenario?: { topic?: string };
        };

        const slotMapping = new Map<string, SlotKeyMapping>(fixture.slotMapping);

        const slide = await createSlideFromTemplateWithContent({
            templateId,
            slotMapping,
            layoutsContents: fixture.functionArgs,
            title: fixture.scenario?.topic || template.name,
            options: {
                userId: 'fixture-tester',
                requestId: fixture.requestId,
            },
        });

        return NextResponse.json({
            templateId,
            fixtureId: normalizedId,
            slide,
            functionArgs: fixture.functionArgs,
            slotMapping: fixture.slotMapping,
            scenario: fixture.scenario,
        });
    } catch (error) {
        console.error('Failed to build slide from fixture', error);
        return NextResponse.json({ error: 'Не удалось собрать слайд' }, { status: 500 });
    }
}
