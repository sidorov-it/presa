import { Theme } from '@/types/theme';
import { ThemedHeading, ThemedText, ThemedButton, ThemedLink, ThemedCard, ThemedBlock } from './ThemedComponents';
import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface ThemePreviewProps {
  theme: Theme;
}

export const ThemePreview = ({ theme }: ThemePreviewProps) => {
    const { setTheme } = useTheme();

    // Update the global theme context whenever the theme changes
    useEffect(() => {
        setTheme(theme);
    }, [theme, setTheme]);

    const previewStyle = {
        // Base colors
        '--primary-accent': theme.colors.primaryAccent,
        '--heading-color': theme.colors.headingColor,
        '--text-color': theme.colors.textColor,
        '--slide-background': theme.colors.slideBackground,
        '--page-background': theme.colors.pageBackground,

        // Typography
        '--heading-font': theme.typography.headingFont,
        '--heading-weight': theme.typography.headingWeight,
        '--body-font': theme.typography.bodyFont,
        '--body-weight': theme.typography.bodyWeight,

        // Slide design
        '--slide-border-radius': theme.design.slide.borderRadius,
        '--slide-shadow': theme.design.slide.shadow,
        '--slide-border': theme.design.slide.border,
        '--slide-border-color': theme.design.slide.borderColor,

        // Block design
        '--block-background': theme.design.blocks.backgroundColor,
        '--block-opacity': theme.design.blocks.opacity,
        '--block-border-width': theme.design.blocks.borderWidth,
        '--block-shadow': theme.design.blocks.shadow,

        // Button and link design
        '--button-color': theme.design.buttons.buttonColor,
        '--button-shape': theme.design.buttons.buttonShape,
        '--link-color': theme.design.buttons.linkColor,

        // No need to set control variables here as they're set by ThemeProvider.tsx
    } as React.CSSProperties;

    return (
        <div className="w-full max-w-4xl mx-auto p-6" style={previewStyle}>
            <ThemedCard className="mb-6">
                <ThemedHeading as="h2" className="mb-3">Sample Heading</ThemedHeading>
                <ThemedText className="mb-4">
                    This is a sample paragraph to demonstrate how the theme's typography and colors will look in your presentation.
                </ThemedText>
                <div className="mt-4 space-y-4">
                    <ThemedButton variant={theme.design.buttons.buttonShape as "rounded" | "pill" | "square"}>
                        Sample Button
                    </ThemedButton>
                    <div className="mt-2">
                        <ThemedLink href="#">Sample Link</ThemedLink>
                    </div>
                </div>
            </ThemedCard>

            <ThemedBlock className="mb-6">
                <ThemedHeading as="h3" className="mb-2">Content Block</ThemedHeading>
                <ThemedText>
                    This is a sample content block to demonstrate how blocks will look in your presentation.
                </ThemedText>
            </ThemedBlock>

            <ThemedCard className="border">
                <ThemedHeading as="h3" className="mb-2">Slide Preview</ThemedHeading>
                <ThemedText>
                    This is how a slide will look with your theme applied.
                </ThemedText>
            </ThemedCard>
        </div>
    );
};