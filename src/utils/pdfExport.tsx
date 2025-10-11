import domtoimage from 'dom-to-image';
import { jsPDF } from 'jspdf';
import { IPresentation } from '@/types';
import logger from '@/utils/logger';
import { logCaughtError } from '@/utils/errorReporting';

// Function to clear image cache
const clearImageCache = (element: HTMLElement) => {
    const images = element.getElementsByTagName('img');
    Array.from(images).forEach(img => {
        // Force reload of image by appending timestamp
        const currentSrc = img.src;
        img.src = '';
        img.src = `${currentSrc}${currentSrc.includes('?') ? '&' : '?'}_t=${Date.now()}`;
    });
};

// Function to apply styles that prevent layout shifts during export
const applyExportStyles = (element: HTMLElement): (() => void) => {
    const elementsToRestore: Array<{ element: HTMLElement; originalStyles: string }> = [];

    // Store original styles and apply new ones
    const applyStylesRecursively = (el: HTMLElement) => {
        // Store original style
        elementsToRestore.push({ element: el, originalStyles: el.style.cssText });

        // Get computed styles to understand current layout
        const computedStyles = window.getComputedStyle(el);

        // Apply box-sizing to all elements
        el.style.setProperty('box-sizing', 'border-box', 'important');

        // Handle flex containers
        if (computedStyles.display === 'flex' || el.classList.contains('flex')) {
            el.style.setProperty('flex-wrap', 'nowrap', 'important');
            el.style.setProperty('overflow', 'visible', 'important');

            // Handle flex children - prevent them from shrinking but allow text wrapping
            Array.from(el.children).forEach(child => {
                const childEl = child as HTMLElement;
                const childComputed = window.getComputedStyle(childEl);

                // Store original style for child
                elementsToRestore.push({ element: childEl, originalStyles: childEl.style.cssText });

                // Prevent flex children from shrinking but preserve their width
                childEl.style.setProperty('flex-shrink', '0', 'important');

                // Set a minimum width based on current width to prevent collapse
                const currentWidth = childEl.offsetWidth;
                if (currentWidth > 0) {
                    childEl.style.setProperty('min-width', `${currentWidth}px`, 'important');
                }

                // For text containers, ensure text can wrap within the element
                if (childComputed.display === 'block' || childComputed.display === 'inline-block') {
                    childEl.style.setProperty('word-wrap', 'break-word', 'important');
                    childEl.style.setProperty('overflow-wrap', 'break-word', 'important');
                }
            });
        }

        // Handle grid containers
        if (computedStyles.display === 'grid' || el.classList.contains('grid')) {
            el.style.setProperty('overflow', 'visible', 'important');
        }

        // Handle text elements - be more selective about preventing wrapping
        if (['P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
            // Only prevent wrapping for inline elements or single-line text
            const parentComputed = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
            const isInFlexContainer = parentComputed?.display === 'flex';

            // If it's a single line of text in a flex container, we might need to be careful
            if (isInFlexContainer && el.textContent && el.textContent.length < 50) {
                // Short text - might be safe to prevent wrapping
                el.style.setProperty('white-space', 'nowrap', 'important');
            } else {
                // Long text or not in flex - allow normal wrapping
                el.style.setProperty('word-wrap', 'break-word', 'important');
                el.style.setProperty('overflow-wrap', 'break-word', 'important');
            }
        }

        // Handle DIV elements differently - they're often containers
        if (el.tagName === 'DIV') {
            // For divs, preserve their width and allow content to wrap
            const currentWidth = el.offsetWidth;
            if (currentWidth > 0 && computedStyles.position !== 'absolute') {
                el.style.setProperty('max-width', `${currentWidth}px`, 'important');
            }
            el.style.setProperty('word-wrap', 'break-word', 'important');
            el.style.setProperty('overflow-wrap', 'break-word', 'important');
        }

        // Handle images
        if (el.tagName === 'IMG') {
            el.style.setProperty('flex-shrink', '0', 'important');
            // Don't remove max-width completely, preserve current dimensions
            const currentWidth = el.offsetWidth;
            if (currentWidth > 0) {
                el.style.setProperty('width', `${currentWidth}px`, 'important');
            }
        }

        // Recursively apply to children
        Array.from(el.children).forEach(child => {
            applyStylesRecursively(child as HTMLElement);
        });
    };

    // Start with the root element
    applyStylesRecursively(element);

    // Return cleanup function
    return () => {
        elementsToRestore.reverse().forEach(({ element, originalStyles }) => {
            // Restore original styles
            element.style.cssText = originalStyles;
        });
    };
};

// Function to wait for all images to load
const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = element.getElementsByTagName('img');
    if (images.length === 0) return;

    const imagePromises = Array.from(images).map(
        img =>
            new Promise<void>(resolve => {
                if (img.complete) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Resolve even on error to prevent hanging
                }
            })
    );

    await Promise.all(imagePromises);
    // Add additional delay to ensure images are fully rendered
    await new Promise(resolve => setTimeout(resolve, 500));
};

// Ensure that all fonts are loaded before rendering the slide
const waitForFonts = async (): Promise<void> => {
    const fonts: any = (document as any).fonts;
    if (fonts && typeof fonts.ready === 'object') {
        try {
            await fonts.ready;
        } catch (err) {
            console.warn('Failed to load fonts before PDF export', err);
        }
    }
};

export interface PdfExportOptions {
    paperSize?: 'a4' | 'letter' | 'legal' | 'custom';
    orientation?: 'portrait' | 'landscape';
    includeSlideNumbers?: boolean;
    scale?: number;
    minPageMargin?: number; // Minimum margin in mm
}

// Function to add watermark to the slide DOM
const addSlideWatermark = (slideElement: HTMLElement): HTMLElement | null => {
    // Check if watermark already exists
    const existingWatermark = slideElement.querySelector('[data-slydle-watermark="true"]');
    if (existingWatermark) {
        return existingWatermark as HTMLElement;
    }

    // Create watermark element
    const watermark = document.createElement('a');
    watermark.setAttribute('href', 'https://slydle.ru');
    watermark.setAttribute('target', '_blank');
    watermark.setAttribute('rel', 'noopener noreferrer');
    watermark.setAttribute('data-slydle-watermark', 'true');
    watermark.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 12px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-weight: 500;
        z-index: 9999;
        pointer-events: none;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    `;
    watermark.textContent = 'Made in Slydle';

    // Add to slide element
    slideElement.style.position = 'relative';
    slideElement.appendChild(watermark);

    return watermark;
};

// Function to remove watermark from the slide DOM
const removeSlideWatermark = (slideElement: HTMLElement): void => {
    const watermark = slideElement.querySelector('[data-slydle-watermark="true"]');
    if (watermark) {
        watermark.remove();
    }
};

/**
 * Exports a presentation to PDF, with each slide on a separate page
 * @param presentation The presentation to export
 * @param filename The name of the exported PDF file
 * @param options PDF export options
 */
export const exportPresentationToPdf = async (
    presentation: IPresentation,
    filename: string = 'presentation.pdf',
    options: PdfExportOptions = {}
): Promise<void> => {
    const { scale = 2 } = options;

    // Get all slides from the DOM
    const slideElements = document.querySelector('#export-preview')?.querySelectorAll('[data-slide="true"]');
    if (!slideElements || !slideElements.length) {
        throw new Error('No slides found in the DOM');
    }

    try {
        // Ensure fonts are loaded to prevent fallbacks in the exported PDF
        await waitForFonts();

        let pdf: jsPDF | null = null;

        // Process each slide
        for (let i = 0; i < slideElements.length; i++) {
            const slideElement = slideElements[i] as HTMLElement;

            // Clear image cache before processing the slide
            clearImageCache(slideElement);

            // Wait for all images to load
            await waitForImages(slideElement);

            // Add watermark to slide before creating image
            addSlideWatermark(slideElement);

            // Apply export-specific styles to prevent layout shifts
            const restoreStyles = applyExportStyles(slideElement);

            // Wait for layout recalculation after applying styles
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                slideElement.style.borderRadius = '0px';
                const slideContent = slideElement.querySelector('[data-slide-content="true"]');
                if (slideContent) {
                    (slideContent as HTMLElement).style.borderRadius = '0px';
                }

                // Get slide dimensions
                const slideWidth = slideElement.offsetWidth;
                const slideHeight = slideElement.offsetHeight;

                // Create high-quality image using dom-to-image
                const imageDataUrl = await domtoimage.toPng(slideElement, {
                    width: slideWidth * scale,
                    height: slideHeight * scale,
                    cacheBust: true,
                    quality: 1,
                    style: {
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: `${slideWidth}px`,
                        height: `${slideHeight}px`,
                    },
                });

                // Calculate page dimensions in mm (using standard conversion: 1 inch = 25.4mm, 96px = 1 inch)
                const pxToMm = 25.4 / 96;
                const pageWidthMm = slideWidth * pxToMm;
                const pageHeightMm = slideHeight * pxToMm;
                const orientation = pageHeightMm > pageWidthMm ? 'portrait' : 'landscape';

                // Create or add new page
                if (i === 0) {
                    pdf = new jsPDF({
                        orientation,
                        unit: 'mm',
                        format: [pageWidthMm, pageHeightMm],
                    });
                } else if (pdf) {
                    pdf.addPage([pageWidthMm, pageHeightMm], orientation);
                }

                if (!pdf) {
                    throw new Error('Failed to initialize PDF document');
                }

                // Add slide image to PDF - fill the entire page
                pdf.addImage(imageDataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm);

                // Add clickable link area over the watermark in PDF
                // Calculate watermark position (right bottom corner)
                const watermarkWidth = 50; // Approximate width in mm
                const watermarkHeight = 6; // Approximate height in mm
                const watermarkX = pageWidthMm - watermarkWidth - 3; // 3mm from right edge
                const watermarkY = pageHeightMm - watermarkHeight - 3; // 3mm from bottom edge

                // Add invisible clickable link area
                if ((pdf as any).link) {
                    (pdf as any).link(watermarkX, watermarkY, watermarkWidth, watermarkHeight, {
                        url: 'https://slydle.ru',
                    });
                }

                // Add page number if requested
                if (options.includeSlideNumbers) {
                    const pageNumber = `${i + 1} / ${slideElements.length}`;
                    pdf.setFontSize(10);
                    pdf.text(pageNumber, pageWidthMm - 20, pageHeightMm - 10);
                }
            } finally {
                // Always restore original styles and remove watermark
                restoreStyles();
                removeSlideWatermark(slideElement);
            }
        }

        // Save the PDF
        if (pdf) {
            pdf.save(filename);
        }
    } catch (error) {
        logCaughtError(error, {
            action: 'Экспорт презентации в PDF',
            component: 'pdfExport.exportPresentationToPdf',
            additionalInfo: {
                presentationId: presentation.id,
                slideCount: slideElements?.length || 0,
                filename,
            },
        });
        logger.error(`Error exporting PDF: ${String(error)}`);
        throw error;
    }
};
