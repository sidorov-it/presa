import { Theme } from '@/types/theme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemedHeading, ThemedText, ThemedButton, ThemedLink, ThemedCard, ThemedBlock } from './ThemedComponents';
import { useEffect } from 'react';
import { useTheme, isColorDark } from '@/context/ThemeContext';

// Utility function to determine if a color is dark
const isColorDark = (color: string): boolean => {
    // Handle hex colors
    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        // Calculate perceived brightness using YIQ formula
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness < 128;
    }
    
    // Handle rgb/rgba colors
    if (color.startsWith('rgb')) {
        const rgbValues = color.match(/\d+/g);
        if (rgbValues && rgbValues.length >= 3) {
            const r = parseInt(rgbValues[0]);
            const g = parseInt(rgbValues[1]);
            const b = parseInt(rgbValues[2]);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness < 128;
        }
    }
    
    // Default to false for other color formats
    return false;
};

interface ThemePreviewProps {
  theme: Theme;
}

export const ThemePreview = ({ theme }: ThemePreviewProps) => {
    const { setTheme } = useTheme();
    const isDark = isColorDark(theme.colors.slideBackground);
    
    // Update the global theme context whenever the theme changes
    useEffect(() => {
        setTheme(theme);
    }, [theme, setTheme]);
    
    const previewStyle = {
        '--primary-accent': theme.colors.primaryAccent,
        '--heading-color': theme.colors.headingColor,
        '--text-color': theme.colors.textColor,
        '--slide-background': theme.colors.slideBackground,
        '--page-background': theme.colors.pageBackground,
        '--heading-font': theme.typography.headingFont,
        '--heading-weight': theme.typography.headingWeight,
        '--body-font': theme.typography.bodyFont,
        '--body-weight': theme.typography.bodyWeight,
        '--slide-border-radius': theme.design.slide.borderRadius,
        '--slide-shadow': theme.design.slide.shadow,
        '--slide-border': theme.design.slide.border,
        '--slide-border-color': theme.design.slide.borderColor,
        '--block-background': theme.design.blocks.backgroundColor,
        '--block-opacity': theme.design.blocks.opacity,
        '--block-border-width': theme.design.blocks.borderWidth,
        '--block-shadow': theme.design.blocks.shadow,
        '--button-color': theme.design.buttons.buttonColor,
        '--button-shape': theme.design.buttons.buttonShape,
        '--link-color': theme.design.buttons.linkColor,
        // Control styles based on background darkness
        '--control-stroke': isDark ? 'white' : 'rgba(0, 0, 0, 0.2)',
        '--control-icon': isDark ? 'white' : 'rgba(0, 0, 0, 0.6)',
        '--control-background': isDark ? 'rgba(0, 0, 0, 0.5)' : '#fff',
    } as React.CSSProperties;

    const getButtonBorderRadius = () => {
        switch (theme.design.buttons.buttonShape) {
            case 'pill':
                return '9999px';
            case 'rounded':
                return '8px';
            default:
                return '0';
        }
    };

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