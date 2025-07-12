import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import {
    createPresentationFromTemplate,
    PresentationTemplateKeys,
    PresentationTemplateDescriptors,
} from '@/presentationTemplates';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const templateId = resolvedParams.id as PresentationTemplateKeys;
        const descriptor = (PresentationTemplateDescriptors as any)[templateId];
        if (!descriptor) {
            return NextResponse.json({ message: 'Template not found' }, { status: 404 });
        }

        const templateData = createPresentationFromTemplate(templateId);

        const theme = await prisma.theme.findFirst({
            where: {
                AND: [
                    {
                        name: descriptor.themeName,
                    },
                    {
                        isDefault: true,
                    },
                ],
            },
        });

        if (!theme) {
            return NextResponse.json({ message: 'Theme not found' }, { status: 404 });
        }

        // Преобразуем данные шаблона в формат для Prisma
        const presentationData = {
            title: templateData.title,
            description: templateData.description || '',
            slides: templateData.slides,
            userId: session.user.id,
            themeId: theme.id,
            durationMinutes: templateData.durationMinutes,
            goal: templateData.goal,
            audience: templateData.audience,
            tone: templateData.tone,
            backgroundSettings: templateData.backgroundSettings,
        };

        const created = await prisma.presentation.create({
            data: presentationData,
        });

        return NextResponse.json({ presentation: created });
    } catch (error) {
        logger.error('Create from template error:', error);
        console.error('Detailed error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
