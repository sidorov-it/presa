import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createPresentationFromTemplate, PresentationTemplateKeys, PresentationTemplateDescriptors } from '@/presentationTemplates';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const templateId = params.id as PresentationTemplateKeys;
        const descriptor = (PresentationTemplateDescriptors as any)[templateId];
        if (!descriptor) {
            return NextResponse.json({ message: 'Template not found' }, { status: 404 });
        }

        const presentation = createPresentationFromTemplate(templateId);

        const created = await prisma.presentation.create({
            data: {
                title: presentation.title,
                description: presentation.description ?? '',
                slides: presentation.slides,
                userId: session.user.id,
                themeId: presentation.themeId,
            },
        });

        return NextResponse.json({ presentation: { ...created, slides: presentation.slides } });
    } catch (error) {
        logger.error('Create from template error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
