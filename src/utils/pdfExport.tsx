import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { IPresentation } from '@/types';

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

export interface PdfExportOptions {
    paperSize?: 'a4' | 'letter' | 'legal' | 'custom';
    orientation?: 'portrait' | 'landscape';
    includeSlideNumbers?: boolean;
    scale?: number;
    minPageMargin?: number; // Minimum margin in mm
}

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
    const slideElements = document.querySelectorAll('[data-slide="true"]');
    if (!slideElements.length) {
        throw new Error('No slides found in the DOM');
    }

    try {
        let pdf: jsPDF | null = null;
        const pxToMm = 0.264583333; // 1px = 0.264583333mm at 96 DPI

        // Process each slide
        for (let i = 0; i < slideElements.length; i++) {
            const slideElement = slideElements[i] as HTMLElement;

            // Clear image cache before processing the slide
            clearImageCache(slideElement);

            // Wait for all images to load
            await waitForImages(slideElement);

            slideElement.style.borderRadius = '0px';
            const slideContent = slideElement.querySelector('[data-slide-content="true"]');
            if (slideContent) {
                (slideContent as HTMLElement).style.borderRadius = '0px';
            }

            // Get slide dimensions
            const slideWidth = slideElement.offsetWidth;
            const slideHeight = slideElement.offsetHeight;

            // Calculate dimensions in mm
            const contentWidthMm = slideWidth * pxToMm * scale;
            const contentHeightMm = slideHeight * pxToMm * scale;

            // Capture slide as image using html-to-image
            const imgData = await toPng(slideElement, {
                quality: 1.0,
                pixelRatio: scale,
                skipAutoScale: true,
                cacheBust: true,
                includeQueryParams: true,
                canvasWidth: slideWidth * scale,
                canvasHeight: slideHeight * scale,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    width: `${slideWidth}px`,
                    height: `${slideHeight}px`,
                },
                imagePlaceholder: `slide-${i}-${Date.now()}`,
            });

            // Calculate page dimensions with margins
            const pageWidthMm = contentWidthMm;
            const pageHeightMm = contentHeightMm;
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

            // Add slide image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, contentWidthMm, contentHeightMm);

            // Add page number if requested
            if (options.includeSlideNumbers) {
                const pageNumber = `${i + 1} / ${slideElements.length}`;
                pdf.setFontSize(10);
                pdf.text(pageNumber, pageWidthMm - 20, pageHeightMm - 10);
            }

            // Add slydle stamp link
            const slydleText = 'Кирилица slydle.ru';
            pdf.setFontSize(12);
            const slydleWidth = pdf.getTextWidth(slydleText);
            const slydleX = pageWidthMm / 2;
            const slydleY = pageHeightMm - 15;
            if ((pdf as any).textWithLink) {
                (pdf as any).textWithLink(slydleText, slydleX, slydleY, {
                    url: 'https://slydle.ru',
                });
            } else {
                pdf.text(slydleText, slydleX, slydleY);
                if ((pdf as any).link) {
                    (pdf as any).link(slydleX, slydleY - 3, slydleWidth, 4, {
                        url: 'https://slydle.ru',
                    });
                }
            }
        }

        // Save the PDF
        if (pdf) {
            pdf.save(filename);
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        throw error;
    }
};
