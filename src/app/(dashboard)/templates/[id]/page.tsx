import type { Metadata } from 'next';
import TemplatePreview from './page.client';
import { createPresentationFromTemplate, PresentationTemplateDescriptors, PresentationTemplateKeys } from '@/presentationTemplates';
import { prisma } from '@/lib/prisma';
import ServerThemeStylesApplier from '@/components/viewer/theme/ServerThemeStylesApplier';
import { Theme } from '@/types/theme';
import NotFoundPage from '@/components/NotFoundPage/NotFoundPage';

interface Props {
    params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const descriptor = (PresentationTemplateDescriptors as any)[params.id];
    return {
        title: descriptor?.title || 'Просмотр шаблона',
        description: descriptor?.description || 'Предпросмотр шаблона презентации',
    };
}

export default async function TemplatePreviewWrapper({ params }: Props) {
    const descriptor = (PresentationTemplateDescriptors as any)[params.id];
    if (!descriptor) {
        return <NotFoundPage />;
    }

    const presentation = createPresentationFromTemplate(params.id as PresentationTemplateKeys);
    const theme = await prisma.theme.findUnique({ where: { id: descriptor.themeId } });
    if (!theme) {
        return <NotFoundPage />;
    }

    const serializedTheme = JSON.parse(JSON.stringify(theme));

    return (
        <ServerThemeStylesApplier theme={serializedTheme as Theme}>
            <TemplatePreview presentation={presentation} theme={serializedTheme as Theme} />
        </ServerThemeStylesApplier>
    );
}
