import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import {
    PresentationTemplateDescriptors,
    PresentationTemplateKeys,
    generatePresentationTemplate,
} from '@/presentationTemplates';
import { parsePresentation } from '@/utils/json';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const descriptor = (PresentationTemplateDescriptors as Record<PresentationTemplateKeys, any>)[
            id as PresentationTemplateKeys
        ];
        if (!descriptor) {
            return NextResponse.json({ message: 'Template not found' }, { status: 404 });
        }

        const presentation = generatePresentationTemplate(descriptor);

        const created = await prisma.presentation.create({
            data: {
                id: presentation.id,
                title: presentation.title,
                description: presentation.description ?? '',
                slides: presentation.slides,
                userId: session.user.id,
                themeId: presentation.themeId,
            },
        });

        return NextResponse.json({ presentation: parsePresentation(created) });
    } catch (error) {
        logger.error('Error creating presentation from template:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
