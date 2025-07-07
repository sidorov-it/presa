import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PresentationViewer from '@/components/viewer/PresentationViewer/PresentationViewer';
import ServerThemeStylesApplier from '@/components/viewer/theme/ServerThemeStylesApplier';
import {
    PresentationTemplateDescriptors,
    PresentationTemplateKeys,
    generatePresentationTemplate,
} from '@/presentationTemplates';

interface Props {
    params: { id: PresentationTemplateKeys };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const descriptor = PresentationTemplateDescriptors[params.id];
    return {
        title: descriptor?.title || 'Предпросмотр шаблона',
        description: descriptor?.description || 'Просмотр шаблона презентации',
    };
}

export default async function TemplatePreviewPage({ params }: Props) {
    const descriptor = PresentationTemplateDescriptors[params.id];
    if (!descriptor) {
        return <div>Template not found</div>;
    }

    const presentation = generatePresentationTemplate(descriptor);
    const theme = await prisma.theme.findUnique({ where: { id: presentation.themeId } });

    const serializedTheme = theme ? JSON.parse(JSON.stringify(theme)) : null;

    return (
        <ServerThemeStylesApplier theme={serializedTheme as any}>
            <PresentationViewer
                slides={presentation.slides}
                theme={serializedTheme as any}
                showImagePlaceholder={true}
                isPreview={true}
                primaryAccentColor={serializedTheme?.colors.primaryAccent || '#000'}
            />
        </ServerThemeStylesApplier>
    );
}
