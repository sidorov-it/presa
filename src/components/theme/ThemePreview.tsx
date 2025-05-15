import React from 'react';
import PresentationThemeWrapper from '@/components/viewer/theme/PresentationThemeWrapper';
import PresentationViewer from '@/components/viewer/PresentationViewer';
import { IPresentation, LayoutType } from '@/types';
import { generateId } from '@/utils/id';
import { Theme } from '@/types/theme';
import { getPredefinedGridStructures } from '@/utils/getPredefinedGridStructures';

interface ThemePreviewProps {
    theme: Theme;
}

export const ThemePreview = ({ theme }: ThemePreviewProps) => {
    // Define a sample presentation for preview
    const defaultGridType = 'blank' as LayoutType;

    const gridStructure = getPredefinedGridStructures(defaultGridType);
    const samplePresentation: IPresentation = {
        id: generateId(),
        title: 'Theme Preview',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        slides: [
            {
                id: generateId(),
                title: 'Introduction',
                layouts: [
                    {
                        id: generateId(),
                        type: defaultGridType,
                        gridStructure,
                        style: {},
                        elements: [
                            {
                                id: generateId(),
                                cellId: gridStructure.rows[0].cells[0].id,
                                elementTypeId: 'editor',
                                content: `
                                    <h1>This is a theme preview</h1>
                                    <p>Hello 👋 Here's an example of body text. You can change its font and the color.</p>
                                    <p>Your <a href='#'>accent color will be used for links</a>. It will also be used for layouts and buttons.</p>
                                `,
                            },
                        ],
                    },
                ],
            },
        ],
    };

    return (
        <PresentationThemeWrapper theme={theme}>
            <PresentationViewer presentation={samplePresentation} />
        </PresentationThemeWrapper>
    );
};
