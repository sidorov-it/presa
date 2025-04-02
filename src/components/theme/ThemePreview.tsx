import { Theme } from '@/types/theme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ThemePreviewProps {
  theme: Theme;
}

export const ThemePreview = ({ theme }: ThemePreviewProps) => {
    const previewStyle = {
        '--primary-accent': theme.colors.primaryAccent,
        '--heading-color': theme.colors.headingColor,
        '--text-color': theme.colors.textColor,
        '--card-background': theme.colors.cardBackground,
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
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle style={{
                        fontFamily: `var(--heading-font)`,
                        fontWeight: 'var(--heading-weight)',
                        color: 'var(--heading-color)'
                    }}>
            Sample Heading
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p style={{
                        fontFamily: `var(--body-font)`,
                        fontWeight: 'var(--body-weight)',
                        color: 'var(--text-color)'
                    }}>
            This is a sample paragraph to demonstrate how the theme's typography and colors will look in your presentation.
                    </p>
                    <div className="mt-4 space-y-4">
                        <button
                            className="px-4 py-2 text-white"
                            style={{
                                backgroundColor: 'var(--button-color)',
                                borderRadius: getButtonBorderRadius(),
                            }}
                        >
              Sample Button
                        </button>
                        <a
                            href="#"
                            className="block"
                            style={{ color: 'var(--link-color)' }}
                        >
              Sample Link
                        </a>
                    </div>
                </CardContent>
            </Card>

            <div
                className="p-6 mb-6"
                style={{
                    backgroundColor: 'var(--block-background)',
                    opacity: 'var(--block-opacity)',
                    borderWidth: 'var(--block-border-width)',
                    boxShadow: 'var(--block-shadow)',
                }}
            >
                <h3 style={{
                    fontFamily: `var(--heading-font)`,
                    fontWeight: 'var(--heading-weight)',
                    color: 'var(--heading-color)'
                }}>
          Content Block
                </h3>
                <p style={{
                    fontFamily: `var(--body-font)`,
                    fontWeight: 'var(--body-weight)',
                    color: 'var(--text-color)'
                }}>
          This is a sample content block to demonstrate how blocks will look in your presentation.
                </p>
            </div>

            <div
                className="p-6"
                style={{
                    borderRadius: 'var(--slide-border-radius)',
                    boxShadow: 'var(--slide-shadow)',
                    border: 'var(--slide-border) solid var(--slide-border-color)',
                }}
            >
                <h3 style={{
                    fontFamily: `var(--heading-font)`,
                    fontWeight: 'var(--heading-weight)',
                    color: 'var(--heading-color)'
                }}>
          Slide Preview
                </h3>
                <p style={{
                    fontFamily: `var(--body-font)`,
                    fontWeight: 'var(--body-weight)',
                    color: 'var(--text-color)'
                }}>
          This is how a slide will look with your theme applied.
                </p>
            </div>
        </div>
    );
};