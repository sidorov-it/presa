import { Theme } from '@/types/theme';
import { ThemedHeading, ThemedText, ThemedButton, ThemedLink, ThemedCard, ThemedPage } from './ThemedComponents';
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
        '--shapes-color': theme.colors.shapesColor,
        '--buttons-color': theme.colors.buttonsColor,
        '--links-color': theme.colors.linksColor,

        '--accent-blocks-color': theme.colors.accentBlocksColor,
        '--secondary-button-color': theme.colors.secondaryButtonColor,

        '--heading-color': theme.colors.headingColor,
        '--text-color': theme.colors.textColor,
        '--slide-background': theme.colors.slideBackground,
        '--page-background-type': theme.colors.pageBackground.type,

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
        // '--button-color': theme.design.buttons.buttonColor,
        '--button-shape': theme.design.buttons.buttonShape,
        // '--link-color': theme.design.buttons.linkColor,

        // Set page background directly
        // background:
        //     theme.colors.pageBackground.type === 'color'
        //         ? theme.colors.pageBackground.color
        //         : `url(${theme.colors.pageBackground.imageUrl})`,
        height: '100%',
        // No need to set control variables here as they're set by ThemeProvider.tsx
    } as React.CSSProperties;

    if (theme.colors.pageBackground.type === 'color') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        previewStyle['--page-background-color'] = theme.colors.pageBackground.color;
    } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        previewStyle['--page-background-image'] = `url(${theme.colors.pageBackground.imageUrl})`;
    }

    return (
        <div className="w-full h-full" style={previewStyle}>
            <ThemedPage className="p-6">
                {/* Introduction slide */}
                <ThemedCard className="mb-6">
                    <ThemedHeading as="h1" className="text-4xl font-bold mb-2">
                        This is a theme preview
                    </ThemedHeading>

                    <ThemedText className="mb-4">
                        Hello 👋 Here's an example of body text. You can change its font and the color.
                    </ThemedText>

                    <ThemedText className="mb-4">
                        Your <ThemedLink href="#">accent color will be used for links</ThemedLink>. It will also be used
                        for layouts and buttons.
                    </ThemedText>
                </ThemedCard>

                {/* Smart layouts demonstration */}
                <ThemedCard className="mb-6">
                    <ThemedHeading as="h2" className="text-2xl font-bold mb-4">
                        Smart layouts
                    </ThemedHeading>

                    <div className="flex gap-4 flex-wrap">
                        <div
                            style={{
                                backgroundColor: theme.colors.accentBlocksColor,
                                width: '200px',
                                height: '100px',
                                color: theme.colors.textColor,
                            }}
                        >
                            accentBlocksColor
                        </div>
                        <div
                            style={{
                                backgroundColor: theme.colors.buttonsColor,
                                width: '200px',
                                height: '100px',
                                color: theme.colors.textColor,

                            }}
                        >
                            buttonsColor
                        </div>
                        <div
                            style={{
                                backgroundColor: theme.colors.linksColor,
                                width: '200px',
                                height: '100px',
                                color: theme.colors.textColor,

                            }}
                        >
                            linksColor
                        </div>
                        <div
                            style={{
                                backgroundColor: theme.colors.secondaryButtonColor,
                                width: '200px',
                                height: '100px',
                                borderColor: theme.colors.primaryAccent,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                color: theme.colors.primaryAccent,
                                
                            }}
                        >
                            secondaryButtonColor
                        </div>
                        <div
                            style={{
                                backgroundColor: theme.colors.primaryAccent,
                                width: '200px',
                                height: '100px',
                            }}
                        >
                            primaryAccent
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <ThemedCard className="flex-1 p-4 bg-primary rounded-md">
                            <ThemedText className="text-white font-medium">
                                This is a smart layout: it acts as a text box.
                            </ThemedText>
                        </ThemedCard>

                        <ThemedCard className="flex-1 p-4 bg-primary rounded-md">
                            <ThemedText className="text-white font-medium">
                                You can get these by typing /smart
                            </ThemedText>
                        </ThemedCard>
                    </div>
                </ThemedCard>

                {/* Buttons demonstration */}
                <ThemedCard className="mb-6">
                    <ThemedHeading as="h2" className="text-2xl font-bold mb-4">
                        Buttons and UI elements
                    </ThemedHeading>

                    <ThemedText className="mb-4">Here are your buttons:</ThemedText>

                    <div className="flex gap-4 mb-4">
                        <ThemedButton>Primary button</ThemedButton>
                        <ThemedButton variant={theme.design.buttons.buttonShape || 'rounded'}>
                            Secondary button
                        </ThemedButton>
                    </div>

                    <ThemedText>
                        To the right, this is what we call an accent image. We have a set of them with our default
                        themes, but you can change them! 🎨
                    </ThemedText>
                </ThemedCard>

                {/* Timeline layout */}
                <ThemedCard className="mb-6">
                    <ThemedHeading as="h2" className="text-2xl font-bold mb-4">
                        Timeline
                    </ThemedHeading>

                    <div className="flex justify-between items-center mb-4">
                        <div className="flex-1 border-t-2 border-primary"></div>
                        <div className="mx-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            1
                        </div>
                        <div className="flex-1 border-t-2 border-primary"></div>
                        <div className="mx-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            2
                        </div>
                        <div className="flex-1 border-t-2 border-primary"></div>
                        <div className="mx-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                            3
                        </div>
                        <div className="flex-1 border-t-2 border-primary"></div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <ThemedHeading as="h4" className="font-semibold">
                                First title
                            </ThemedHeading>
                            <ThemedText className="text-sm">This is the first point of a timeline</ThemedText>
                        </div>
                        <div className="text-center">
                            <ThemedHeading as="h4" className="font-semibold">
                                Second title
                            </ThemedHeading>
                            <ThemedText className="text-sm">
                                You can easily add and remove points and we'll auto-resize your content
                            </ThemedText>
                        </div>
                        <div className="text-center">
                            <ThemedHeading as="h4" className="font-semibold">
                                Third title
                            </ThemedHeading>
                            <ThemedText className="text-sm">This is why we call them "smart layouts"</ThemedText>
                        </div>
                    </div>
                </ThemedCard>

                {/* Pyramid layout */}
                <ThemedCard>
                    <ThemedHeading as="h2" className="text-2xl font-bold mb-4">
                        Pyramid
                    </ThemedHeading>

                    <div className="flex flex-col items-center">
                        <div
                            className="w-0 h-0 border-l-[100px] border-r-[100px] border-b-[150px] mb-4"
                            style={{
                                borderBottomColor: theme.colors.primaryAccent,
                                borderLeftColor: 'transparent',
                                borderRightColor: 'transparent',
                            }}
                        >
                            <div className="relative left-[-20px] top-[70px] text-white text-center w-40">
                                <ThemedText className="font-semibold">1</ThemedText>
                                <ThemedHeading as="h4" className="font-semibold mb-2">
                                    First title
                                </ThemedHeading>
                                <ThemedText className="text-xs">This is a smart layout</ThemedText>
                            </div>
                        </div>
                    </div>
                </ThemedCard>
            </ThemedPage>
        </div>
    );
};
