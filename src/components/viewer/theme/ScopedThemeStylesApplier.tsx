'use client';

import circleInvertedLeftImage from '@/elements/masks/circle-inverted-left.svg';
import circleInvertedRightImage from '@/elements/masks/circle-inverted-right.svg';
import circleLeftImage from '@/elements/masks/circle-left.svg';
import circleRightImage from '@/elements/masks/circle-right.svg';
import diagonalLeftImage from '@/elements/masks/diagonal-left.svg';
import diagonalRightImage from '@/elements/masks/diagonal-right.svg';
import gradientLeftImage from '@/elements/masks/gradient-left.svg';
import gradientRightImage from '@/elements/masks/gradient-right.svg';
import gradientTopImage from '@/elements/masks/gradient-top.svg';
import wiggleLeftImage from '@/elements/masks/wiggle-left.svg';
import wiggleRightImage from '@/elements/masks/wiggle-right.svg';
import wiggleTopImage from '@/elements/masks/wiggle-top.svg';
import diagonalTopImage from '@/elements/masks/diagonal-top.svg';
import circleTopImage from '@/elements/masks/circle-top.svg';
import circleInvertedTopImage from '@/elements/masks/circle-inverted-top.svg';

import { useEffect, useRef, forwardRef } from 'react';
import { Theme } from '@/types/theme';

interface ScopedThemeStylesApplierProps {
    theme: Theme | null;
    children: React.ReactNode;
    className?: string;
}

const ScopedThemeStylesApplier = forwardRef<HTMLDivElement, ScopedThemeStylesApplierProps>(
    ({ theme, children, className = '' }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);

        // Apply theme to the container when the component mounts or theme changes
        useEffect(() => {
            const container = containerRef.current;
            if (!container || !theme) {
                console.log('ScopedThemeStylesApplier: No container or theme provided');
                return;
            }

            console.log('ScopedThemeStylesApplier: Applying theme', theme.name);

            // Check if theme structure is complete
            if (!theme.colors || !theme.typography || !theme.design) {
                console.error('ScopedThemeStylesApplier: Theme is missing required properties', {
                    hasColors: !!theme.colors,
                    hasTypography: !!theme.typography,
                    hasDesign: !!theme.design,
                });
                return;
            }

            // Further validate theme structure
            if (!theme.design.slide || !theme.design.blocks || !theme.design.buttons) {
                console.error('ScopedThemeStylesApplier: Theme design is missing required properties', {
                    hasSlide: !!theme.design.slide,
                    hasBlocks: !!theme.design.blocks,
                    hasButtons: !!theme.design.buttons,
                });
                return;
            }

            try {
                // Apply theme to the container element instead of document
                // Base colors
                container.style.setProperty('--presentation-primary-accent', theme.colors.primaryAccent);

                // Set secondary accent colors (limit to first 3)
                if (theme.colors.secondaryAccents && Array.isArray(theme.colors.secondaryAccents)) {
                    theme.colors.secondaryAccents.slice(0, 3).forEach((color, index) => {
                        container.style.setProperty(`--presentation-secondary-accent-${index + 1}`, color);
                    });
                }

                container.style.setProperty(
                    '--presentation-shapes-color',
                    theme.colors.shapesColor || theme.colors.primaryAccent
                );
                container.style.setProperty(
                    '--presentation-accent-blocks-color',
                    theme.colors.accentBlocksColor || theme.colors.primaryAccent
                );
                container.style.setProperty(
                    '--presentation-secondary-button-color',
                    theme.colors.secondaryButtonColor || '#6b7280'
                );

                // Set default theme text colors (these can be overridden by slide-specific colors)
                container.style.setProperty('--presentation-heading-color', theme.colors.headingColor);
                container.style.setProperty('--presentation-text-color', theme.colors.textColor);
                container.style.setProperty('--presentation-slide-background', theme.colors.slideBackground);

                // Handle page background
                if (theme.colors.pageBackground) {
                    if (theme.colors.pageBackground.color) {
                        container.style.setProperty(
                            '--presentation-page-background-color',
                            theme.colors.pageBackground.color
                        );
                        container.style.backgroundColor = theme.colors.pageBackground.color;
                    } else {
                        container.style.setProperty('--presentation-page-background-color', '#f9fafb');
                    }

                    if (theme.colors.pageBackground.imageUrl) {
                        console.log('Applying background image URL:', theme.colors.pageBackground.imageUrl);

                        // Check if URL is valid
                        const imageUrl = theme.colors.pageBackground.imageUrl.trim();
                        if (theme.colors.pageBackground.type === 'image' && imageUrl) {
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
                    `'${theme.typography.headingFont}', sans-serif`
                );
                container.style.setProperty('--presentation-heading-weight', theme.typography.headingWeight.toString());
                container.style.setProperty('--presentation-body-font', `'${theme.typography.bodyFont}', sans-serif`);
                container.style.setProperty('--presentation-body-weight', theme.typography.bodyWeight.toString());

                // New typography CSS vars for headings
                container.style.setProperty(
                    '--presentation-heading-line-height',
                    theme.typography.headingLineHeight.toString()
                );
                container.style.setProperty(
                    '--presentation-heading-letter-spacing',
                    theme.typography.headingLetterSpacing + '%'
                );

                if (theme.typography.headingCapitalization === 'none') {
                    container.style.setProperty('--presentation-heading-capitalization', 'none');
                } else {
                    container.style.setProperty('--presentation-heading-capitalization', 'uppercase');
                }

                // New typography CSS vars for body text
                container.style.setProperty(
                    '--presentation-body-line-height',
                    theme.typography.bodyLineHeight.toString()
                );
                container.style.setProperty(
                    '--presentation-body-letter-spacing',
                    theme.typography.bodyLetterSpacing + '%'
                );

                if (theme.typography.bodyCapitalization === 'none') {
                    container.style.setProperty('--presentation-body-capitalization', 'none');
                } else {
                    container.style.setProperty('--presentation-body-capitalization', 'uppercase');
                }

                // Slide design
                container.style.setProperty('--presentation-slide-border-radius', theme.design.slide.borderRadius);

                const shadow = theme.design.slide.shadow;
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

                const borderWidth = theme.design.slide.borderWidth;

                if (borderWidth === 'none') {
                    container.style.setProperty('--presentation-slide-border-width', '0px');
                } else if (borderWidth === 'thin') {
                    container.style.setProperty('--presentation-slide-border-width', '1px');
                } else if (borderWidth === 'medium') {
                    container.style.setProperty('--presentation-slide-border-width', '2px');
                } else if (borderWidth === 'thick') {
                    container.style.setProperty('--presentation-slide-border-width', '3px');
                }

                container.style.setProperty('--presentation-slide-border-color', theme.design.slide.borderColor);

                let maskImageLeft = 'none';
                let maskImageRight = 'none';
                let maskImageTop = 'none';

                if (theme.design.slide.imageShape === 'default') {
                    maskImageLeft = 'none';
                    maskImageRight = 'none';
                    maskImageTop = 'none';
                } else if (theme.design.slide.imageShape === 'fade') {
                    maskImageLeft = `url(${gradientLeftImage.src})`;
                    maskImageRight = `url(${gradientRightImage.src})`;
                    maskImageTop = `url(${gradientTopImage.src})`;
                } else if (theme.design.slide.imageShape === 'diagonal') {
                    maskImageLeft = `url(${diagonalLeftImage.src})`;
                    maskImageRight = `url(${diagonalRightImage.src})`;
                    maskImageTop = `url(${diagonalTopImage.src})`;
                } else if (theme.design.slide.imageShape === 'round') {
                    maskImageLeft = `url(${circleLeftImage.src})`;
                    maskImageRight = `url(${circleRightImage.src})`;
                    maskImageTop = `url(${circleTopImage.src})`;
                } else if (theme.design.slide.imageShape === 'round-inverse') {
                    maskImageLeft = `url(${circleInvertedLeftImage.src})`;
                    maskImageRight = `url(${circleInvertedRightImage.src})`;
                    maskImageTop = `url(${circleInvertedTopImage.src})`;
                } else if (theme.design.slide.imageShape === 'wiggle') {
                    maskImageLeft = `url(${wiggleLeftImage.src})`;
                    maskImageRight = `url(${wiggleRightImage.src})`;
                    maskImageTop = `url(${wiggleTopImage.src})`;
                }

                container.style.setProperty('--presentation-slide-image-mask-image-left', maskImageLeft);
                container.style.setProperty('--presentation-slide-image-mask-image-right', maskImageRight);
                container.style.setProperty('--presentation-slide-image-mask-image-top', maskImageTop);

                // Block design
                container.style.setProperty(
                    '--presentation-block-fill-type',
                    theme.design.blocks.backgroundBlockFillType
                );

                let blockBorderWidth = '0px';
                if (theme.design.blocks.borderWidth === 'none') {
                    blockBorderWidth = '0px';
                } else if (theme.design.blocks.borderWidth === 'thin') {
                    blockBorderWidth = '1px';
                } else if (theme.design.blocks.borderWidth === 'medium') {
                    blockBorderWidth = '2px';
                } else if (theme.design.blocks.borderWidth === 'thick') {
                    blockBorderWidth = '3px';
                }

                container.style.setProperty('--presentation-block-border-width', blockBorderWidth);

                if (theme.design.blocks.blockFillColorsType !== 'custom') {
                    container.style.setProperty('--presentation-block-background', theme.colors.primaryAccent);

                    container.style.setProperty(
                        '--presentation-block-background-custom-type',
                        theme.design.blocks.blockFillColorsType
                    );
                } else if (theme.design.blocks.blockFillColorsType === 'custom') {
                    theme.design.blocks.blockBackgroundCustomColors.forEach((color, index) => {
                        container.style.setProperty(`--presentation-block-background-custom-${index + 1}`, color);
                    });

                    container.style.setProperty(
                        '--presentation-block-background-custom-count',
                        theme.design.blocks.blockBackgroundCustomColors.length.toString()
                    );
                }

                container.style.setProperty('--presentation-block-shadow', theme.design.blocks.shadow);

                // Button and link design
                // container.style.setProperty('--presentation-button-color', theme.design.buttons.buttonColor);

                // const hoverColor = getHoverColor(theme.design.buttons.buttonColor, 15);
                // container.style.setProperty('--presentation-button-hover-color', hoverColor);
                // container.style.setProperty(
                //     '--presentation-button-text-color',
                //     getContrastTextColor(theme.design.buttons.buttonColor)
                // );

                // if (theme.design.buttons.buttonShape === 'square') {
                //     container.style.setProperty('--presentation-button-radius', '1.5px');
                // } else if (theme.design.buttons.buttonShape === 'capsule') {
                //     container.style.setProperty('--presentation-button-radius', '9999px');
                // } else if (theme.design.buttons.buttonShape === 'default') {
                //     container.style.setProperty('--presentation-button-radius', '4px');
                // } else if (theme.design.buttons.buttonShape === 'rounded') {
                //     container.style.setProperty('--presentation-button-radius', '8px');
                // }

                container.style.setProperty(
                    '--presentation-link-color',
                    theme.design.buttons?.linkColor || theme.colors.primaryAccent
                );

                console.log('ScopedThemeStylesApplier: Theme applied successfully');
            } catch (error) {
                console.error('ScopedThemeStylesApplier: Error applying theme', error);
            }
        }, [theme]);

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
            </div>
        );
    }
);

ScopedThemeStylesApplier.displayName = 'ScopedThemeStylesApplier';

export default ScopedThemeStylesApplier;
