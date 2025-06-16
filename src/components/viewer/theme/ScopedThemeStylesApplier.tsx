'use client';

import { useLayoutEffect, useRef, forwardRef } from 'react';
import { Theme } from '@/types/theme';
import { useThemeStore } from '@/store/themeStore';
import ThemeDebugButton from '@/components/debug/ThemeDebugButton';

interface ScopedThemeStylesApplierProps {
    theme: Theme | null;
    children: React.ReactNode;
    className?: string;
}

const ScopedThemeStylesApplier = forwardRef<HTMLDivElement, ScopedThemeStylesApplierProps>(
    ({ theme, children, className = '' }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const defaultThemes = useThemeStore(state => state.defaultThemes);

        // Apply theme to the container when the component mounts or theme changes
        useLayoutEffect(() => {
            const container = containerRef.current;
            if (!container || !defaultThemes || defaultThemes.length === 0) {
                console.log('ScopedThemeStylesApplier: No container provided');
                return;
            }

            // Use default theme if no theme is provided
            const activeTheme = theme || defaultThemes[0];
            console.log('ScopedThemeStylesApplier: Applying theme', activeTheme.name);

            // Check if theme structure is complete
            if (!activeTheme.colors || !activeTheme.typography || !activeTheme.design) {
                console.error('ScopedThemeStylesApplier: Theme is missing required properties', {
                    hasColors: !!activeTheme.colors,
                    hasTypography: !!activeTheme.typography,
                    hasDesign: !!activeTheme.design,
                });
                return;
            }

            // Further validate theme structure
            if (!activeTheme.design.slide || !activeTheme.design.blocks || !activeTheme.design.buttons) {
                console.error('ScopedThemeStylesApplier: Theme design is missing required properties', {
                    hasSlide: !!activeTheme.design.slide,
                    hasBlocks: !!activeTheme.design.blocks,
                    hasButtons: !!activeTheme.design.buttons,
                });
                return;
            }

            try {
                // Apply theme to the container element instead of document
                // Base colors
                container.style.setProperty('--presentation-primary-accent', activeTheme.colors.primaryAccent);

                // Set secondary accent colors (limit to first 3)
                if (activeTheme.colors.secondaryAccents && Array.isArray(activeTheme.colors.secondaryAccents)) {
                    activeTheme.colors.secondaryAccents.slice(0, 3).forEach((color, index) => {
                        container.style.setProperty(`--presentation-secondary-accent-${index + 1}`, color);
                    });
                }

                container.style.setProperty(
                    '--presentation-shapes-color',
                    activeTheme.colors.shapesColor || activeTheme.colors.primaryAccent
                );
                container.style.setProperty(
                    '--presentation-accent-blocks-color',
                    activeTheme.colors.accentBlocksColor || activeTheme.colors.primaryAccent
                );
                container.style.setProperty(
                    '--presentation-secondary-button-color',
                    activeTheme.colors.secondaryButtonColor || '#6b7280'
                );

                // Set default theme text colors (these can be overridden by slide-specific colors)
                container.style.setProperty('--presentation-heading-color', activeTheme.colors.headingColor);
                container.style.setProperty('--presentation-text-color', activeTheme.colors.textColor);
                container.style.setProperty('--presentation-slide-background', activeTheme.colors.slideBackground);

                // Handle page background
                if (activeTheme.colors.pageBackground) {
                    if (activeTheme.colors.pageBackground.color) {
                        container.style.setProperty(
                            '--presentation-page-background-color',
                            activeTheme.colors.pageBackground.color
                        );
                        container.style.backgroundColor = activeTheme.colors.pageBackground.color;
                    } else {
                        container.style.setProperty('--presentation-page-background-color', '#f9fafb');
                    }

                    if (activeTheme.colors.pageBackground.imageUrl) {
                        console.log('Applying background image URL:', activeTheme.colors.pageBackground.imageUrl);

                        // Check if URL is valid
                        const imageUrl = activeTheme.colors.pageBackground.imageUrl.trim();
                        if (activeTheme.colors.pageBackground.type === 'image' && imageUrl) {
                            container.style.setProperty('--presentation-page-background-image', `url(${imageUrl})`);

                            // Apply background to container element
                            container.style.backgroundImage = `url(${imageUrl})`;
                            container.style.backgroundSize = 'cover';
                            container.style.backgroundPosition = 'center';
                            container.style.backgroundRepeat = 'no-repeat';

                            // Ensure image is properly styled
                            container.style.setProperty('--presentation-page-background-size', 'cover');
                            container.style.setProperty('--presentation-page-background-position', 'center');
                            container.style.setProperty('--presentation-page-background-repeat', 'no-repeat');
                        } else {
                            console.warn('Background image URL is empty or invalid');
                            container.style.removeProperty('--presentation-page-background-image');
                            container.style.backgroundImage = 'none';
                        }
                    } else {
                        console.log('No background image URL provided');
                        container.style.removeProperty('--presentation-page-background-image');
                        container.style.backgroundImage = 'none';
                    }
                } else {
                    // Default background if none defined
                    container.style.setProperty('--presentation-page-background-color', '#f9fafb');
                    container.style.removeProperty('--presentation-page-background-image');
                }

                // Typography
                container.style.setProperty(
                    '--presentation-heading-font',
                    `'${activeTheme.typography.headingFont}', sans-serif`
                );
                container.style.setProperty(
                    '--presentation-heading-weight',
                    activeTheme.typography.headingWeight.toString()
                );
                container.style.setProperty(
                    '--presentation-body-font',
                    `'${activeTheme.typography.bodyFont}', sans-serif`
                );
                container.style.setProperty('--presentation-body-weight', activeTheme.typography.bodyWeight.toString());

                // New typography CSS vars for headings
                container.style.setProperty(
                    '--presentation-heading-line-height',
                    activeTheme.typography.headingLineHeight.toString()
                );
                container.style.setProperty(
                    '--presentation-heading-letter-spacing',
                    activeTheme.typography.headingLetterSpacing + '%'
                );

                if (activeTheme.typography.headingCapitalization === 'none') {
                    container.style.setProperty('--presentation-heading-capitalization', 'none');
                } else {
                    container.style.setProperty('--presentation-heading-capitalization', 'uppercase');
                }

                // New typography CSS vars for body text
                container.style.setProperty(
                    '--presentation-body-line-height',
                    activeTheme.typography.bodyLineHeight.toString()
                );
                container.style.setProperty(
                    '--presentation-body-letter-spacing',
                    activeTheme.typography.bodyLetterSpacing + '%'
                );

                if (activeTheme.typography.bodyCapitalization === 'none') {
                    container.style.setProperty('--presentation-body-capitalization', 'none');
                } else {
                    container.style.setProperty('--presentation-body-capitalization', 'uppercase');
                }

                // Slide design
                container.style.setProperty(
                    '--presentation-slide-border-radius',
                    activeTheme.design.slide.borderRadius
                );

                const shadow = activeTheme.design.slide.shadow;
                if (shadow === 'none') {
                    container.style.setProperty('--presentation-slide-shadow', 'none');
                } else if (shadow === 'sm') {
                    container.style.setProperty(
                        '--presentation-slide-shadow',
                        '0 10px 15px -3px rgba(0, 0, 0, 0.1),0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    );
                } else if (shadow === 'md') {
                    container.style.setProperty('--presentation-slide-shadow', 'rgba(0, 0, 0, 0.4) 4px 4px 0px 0px');
                }

                const borderWidth = activeTheme.design.slide.borderWidth;

                if (borderWidth === 'none') {
                    container.style.setProperty('--presentation-slide-border-width', '0px');
                } else if (borderWidth === 'thin') {
                    container.style.setProperty('--presentation-slide-border-width', '1px');
                } else if (borderWidth === 'medium') {
                    container.style.setProperty('--presentation-slide-border-width', '2px');
                } else if (borderWidth === 'thick') {
                    container.style.setProperty('--presentation-slide-border-width', '3px');
                }

                container.style.setProperty('--presentation-slide-border-color', activeTheme.design.slide.borderColor);

                let maskImageLeft = 'none';
                let maskImageRight = 'none';
                let maskImageTop = 'none';

                if (activeTheme.imageShape === 'default') {
                    maskImageLeft = 'none';
                    maskImageRight = 'none';
                    maskImageTop = 'none';
                } else if (activeTheme.imageShape === 'fade') {
                    maskImageLeft = `url(/masks/gradient-left.svg)`;
                    maskImageRight = `url(/masks/gradient-right.svg)`;
                    maskImageTop = `url(/masks/gradient-top.svg)`;
                } else if (activeTheme.imageShape === 'diagonal') {
                    maskImageLeft = `url(/masks/diagonal-left.svg)`;
                    maskImageRight = `url(/masks/diagonal-right.svg)`;
                    maskImageTop = `url(/masks/diagonal-top.svg)`;
                } else if (activeTheme.imageShape === 'round') {
                    maskImageLeft = `url(/masks/circle-left.svg)`;
                    maskImageRight = `url(/masks/circle-right.svg)`;
                    maskImageTop = `url(/masks/circle-top.svg)`;
                } else if (activeTheme.imageShape === 'round-inverse') {
                    maskImageLeft = `url(/masks/circle-inverted-left.svg)`;
                    maskImageRight = `url(/masks/circle-inverted-right.svg)`;
                    maskImageTop = `url(/masks/circle-inverted-top.svg)`;
                } else if (activeTheme.imageShape === 'wiggle') {
                    maskImageLeft = `url(/masks/wiggle-left.svg)`;
                    maskImageRight = `url(/masks/wiggle-right.svg)`;
                    maskImageTop = `url(/masks/wiggle-top.svg)`;
                }

                container.style.setProperty('--presentation-slide-image-mask-image-left', maskImageLeft);
                container.style.setProperty('--presentation-slide-image-mask-image-right', maskImageRight);
                container.style.setProperty('--presentation-slide-image-mask-image-top', maskImageTop);

                // Block design
                container.style.setProperty(
                    '--presentation-block-fill-type',
                    activeTheme.design.blocks.backgroundBlockFillType
                );

                let blockBorderWidth = '0px';
                if (activeTheme.design.blocks.borderWidth === 'none') {
                    blockBorderWidth = '0px';
                } else if (activeTheme.design.blocks.borderWidth === 'thin') {
                    blockBorderWidth = '1px';
                } else if (activeTheme.design.blocks.borderWidth === 'medium') {
                    blockBorderWidth = '2px';
                } else if (activeTheme.design.blocks.borderWidth === 'thick') {
                    blockBorderWidth = '3px';
                }

                container.style.setProperty('--presentation-block-border-width', blockBorderWidth);

                if (activeTheme.design.blocks.blockFillColorsType !== 'custom') {
                    container.style.setProperty('--presentation-block-background', activeTheme.colors.primaryAccent);

                    container.style.setProperty(
                        '--presentation-block-background-custom-type',
                        activeTheme.design.blocks.blockFillColorsType
                    );
                } else if (activeTheme.design.blocks.blockFillColorsType === 'custom') {
                    activeTheme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
                        container.style.setProperty(`--presentation-block-background-custom-${index + 1}`, color);
                    });

                    container.style.setProperty(
                        '--presentation-block-background-custom-count',
                        activeTheme.design.blocks.blockBackgroundCustomColors.length.toString()
                    );
                }

                container.style.setProperty('--presentation-block-shadow', activeTheme.design.blocks.shadow);

                container.style.setProperty(
                    '--presentation-link-color',
                    activeTheme.design.buttons?.linkColor || activeTheme.colors.primaryAccent
                );

                console.log('ScopedThemeStylesApplier: Theme applied successfully');
            } catch (error) {
                console.error('ScopedThemeStylesApplier: Error applying theme', error);
            }
        }, [theme, defaultThemes]);

        return (
            <div
                ref={ref || containerRef}
                className={`scoped-theme-container ${className}`}
                style={
                    {
                        // width: '100%',
                        // height: '100%',
                    }
                }
            >
                {children}

                {process.env.NODE_ENV === 'development' && (
                    <>
                        <ThemeDebugButton />
                    </>
                )}
            </div>
        );
    }
);

ScopedThemeStylesApplier.displayName = 'ScopedThemeStylesApplier';

export default ScopedThemeStylesApplier;
