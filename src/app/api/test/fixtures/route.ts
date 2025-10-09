import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';

interface FixtureSummary {
    id: string;
    requestId: string;
    topic: string;
    createdAt: string;
}

export async function GET() {
    try {
        const fixturesRoot = path.join(process.cwd(), 'test/llm-fixtures/templates');
        const templateDirs = await fs.readdir(fixturesRoot, { withFileTypes: true }).catch(() => []);

        const templates = await Promise.all(
            templateDirs
                .filter(entry => entry.isDirectory())
                .map(async dir => {
                    const templateId = dir.name;
                    const fixtureFiles = await fs.readdir(path.join(fixturesRoot, templateId)).catch(() => []);

                    const fixtures: FixtureSummary[] = [];

                    for (const fileName of fixtureFiles) {
                        if (!fileName.endsWith('.json')) continue;
                        try {
                            const filePath = path.join(fixturesRoot, templateId, fileName);
                            const raw = await fs.readFile(filePath, 'utf8');
                            const data = JSON.parse(raw);
                            fixtures.push({
                                id: fileName,
                                requestId: data.requestId || fileName.replace('.json', ''),
                                topic: data.scenario?.topic || 'Без названия',
                                createdAt: data.createdAt || new Date().toISOString(),
                            });
                        } catch (error) {
                            console.warn(`Failed to parse fixture ${fileName} for template ${templateId}:`, error);
                        }
                    }

                    const templateDef = SlideTemplatesRegistry[templateId];

                    return {
                        templateId,
                        templateName: templateDef?.name ?? templateId,
                        fixtures,
                    };
                })
        );

        return NextResponse.json({ templates });
    } catch (error) {
        console.error('Failed to list LLM fixtures', error);
        return NextResponse.json({ error: 'Не удалось получить список заготовок' }, { status: 500 });
    }
}
