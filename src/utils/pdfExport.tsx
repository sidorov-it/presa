import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { IPresentation, Slide } from '@/types';
import { createRoot } from 'react-dom/client';
import SlideViewer from '@/components/viewer/SlideViewer';

// Utility function to visualize link boundaries for debugging
const visualizeLinks = (element: HTMLElement): void => {
    if (process.env.NODE_ENV !== 'development') return;

    const links = element.querySelectorAll('a');
    links.forEach((link, index) => {
        const linkEl = link as HTMLElement;
        const rect = linkEl.getBoundingClientRect();

        // Create visualization overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'absolute';
        overlay.style.border = '2px solid red';
        overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
        overlay.style.zIndex = '9999';
        overlay.style.pointerEvents = 'none';
        overlay.textContent = `Link ${index + 1}`;
        overlay.style.fontSize = '10px';
        overlay.style.color = 'white';

        // Position relative to the slide
        const slideRect = element.getBoundingClientRect();
        overlay.style.left = `${rect.left - slideRect.left}px`;
        overlay.style.top = `${rect.top - slideRect.top}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        element.appendChild(overlay);
    });
};

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

    const imagePromises = Array.from(images).map(img =>
        new Promise<void>((resolve) => {
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
 * Extracts links from the slide HTML and returns their position and URL data
 * @param element The slide element
 * @param contentWidthMm Width of the content in mm
 * @param contentHeightMm Height of the content in mm
 * @param slideWidthPx Width of the slide in pixels
 * @param slideHeightPx Height of the slide in pixels
 * @returns Array of link data objects with positions and URLs
 */
const extractLinksFromSlide = (
    element: HTMLElement,
    contentWidthMm: number,
    contentHeightMm: number,
    slideWidthPx: number,
    slideHeightPx: number
): { x: number; y: number; width: number; height: number; url: string }[] => {
    const links: { x: number; y: number; width: number; height: number; url: string }[] = [];

    // Find all links in the slide
    const linkElements = element.querySelectorAll('a[href]');
    console.log(`Found ${linkElements.length} links in slide`);

    // Exit early if no links found
    if (linkElements.length === 0) {
        return links;
    }

    // Calculate scaling factors between the element dimensions and the PDF dimensions
    const xScale = contentWidthMm / slideWidthPx;
    const yScale = contentHeightMm / slideHeightPx;

    console.log(
        `Slide dimensions: ${slideWidthPx}x${slideHeightPx}px, PDF dimensions: ${contentWidthMm.toFixed(2)}x${contentHeightMm.toFixed(2)}mm`
    );
    console.log(`Scaling factors: x=${xScale.toFixed(4)}, y=${yScale.toFixed(4)}`);

    // Make links visually distinguishable for debugging
    linkElements.forEach(link => {
        const linkEl = link as HTMLElement;
        linkEl.style.border = '2px solid red';
        linkEl.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        linkEl.style.display = 'inline-block';
    });

    // Force layout recalculation
    element.getBoundingClientRect();

    // Get bounding rect of the slide element
    const slideRect = element.getBoundingClientRect();

    linkElements.forEach((link, index) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // Ensure URL is absolute
        let fullUrl = href;
        if (href.startsWith('/') || !href.includes('://')) {
            // Handle relative URLs
            const baseUrl = window.location.origin;
            fullUrl = href.startsWith('/') ? `${baseUrl}${href}` : `${baseUrl}/${href}`;
        }

        // Get link dimensions and position
        const linkElement = link as HTMLElement;
        const rect = linkElement.getBoundingClientRect();

        // Calculate position relative to the slide
        const left = rect.left - slideRect.left;
        const top = rect.top - slideRect.top;

        // Ensure minimum dimensions for better clickability
        const width = Math.max(rect.width, 20);
        // Important: set a significant height for the PDF links to make them easily clickable
        const height = Math.max(rect.height, 30);

        console.log(`Link ${index + 1} raw rect:`, {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            slideLeft: slideRect.left,
            slideTop: slideRect.top,
        });

        // Ensure coordinates are within bounds of the slide
        const finalLeft = Math.max(0, Math.min(left, slideWidthPx));
        const finalTop = Math.max(0, Math.min(top, slideHeightPx));

        // Convert to mm for PDF and apply scaling
        const xMm = finalLeft * xScale;
        // Calculate y position in PDF coordinates (origin at bottom-left)
        const yMm = contentHeightMm - finalTop * yScale - height * yScale;
        const widthMm = width * xScale;
        const heightMm = height * yScale;

        const linkText = link.textContent?.trim() || '';
        console.log(`Link ${index + 1}: "${linkText}" -> ${fullUrl}`);
        console.log(`  Position in pixels: x=${finalLeft}, y=${finalTop}, w=${width}, h=${height}`);
        console.log(
            `  Position in mm (PDF coords): x=${xMm.toFixed(2)}, y=${yMm.toFixed(2)}, w=${widthMm.toFixed(2)}, h=${heightMm.toFixed(2)}`
        );

        // Only add links with valid dimensions
        if (width > 0 && height > 0) {
            links.push({
                x: xMm,
                y: yMm,
                width: widthMm,
                height: heightMm,
                url: fullUrl,
            });
        } else {
            console.warn(`Skipping link ${index + 1} due to invalid dimensions`);
        }
    });

    // Remove the debugging styles after measurement
    linkElements.forEach(link => {
        const linkEl = link as HTMLElement;
        linkEl.style.border = '';
        linkEl.style.backgroundColor = '';
    });

    return links;
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

/**
 * Renders a slide to a container for PDF export
 * @param slide The slide to render
 * @param container The container to render the slide in
 * @returns The rendered slide element
 */
const renderSlideForExport = async (
    presentationId: string,
    slide: Slide,
    container: HTMLElement
): Promise<HTMLElement> => {
    // Create the slide wrapper
    const slideWrapper = document.createElement('div');
    slideWrapper.style.backgroundColor = '#fff';
    slideWrapper.style.width = '960px'; // Fixed width for consistent scaling
    slideWrapper.style.position = 'relative';
    slideWrapper.style.overflow = 'visible'; // Allow content to overflow for dynamic height
    slideWrapper.style.minHeight = '540px'; // 16:9 aspect ratio minimum
    slideWrapper.style.margin = '0 auto'; // Center the slide
    slideWrapper.style.display = 'flex';
    slideWrapper.style.flexDirection = 'column';
    slideWrapper.setAttribute('data-pdf-export', 'true');

    // Apply slide background if available
    if (slide.background?.type === 'color') {
        slideWrapper.style.backgroundColor = slide.background.value;
    } else if (slide.background?.type === 'image') {
        slideWrapper.style.backgroundImage = `url(${slide.background.value})`;
        slideWrapper.style.backgroundSize = 'cover';
        slideWrapper.style.backgroundPosition = 'center';
    }

    container.appendChild(slideWrapper);

    // Add the slide to the container using React
    const root = createRoot(slideWrapper);
    root.render(<SlideViewer slide={slide} presentationId={presentationId} isPdfExport={true} />);

    // Wait for the render to complete
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Try to get all images in the slide and ensure they're loaded
    const images = slideWrapper.querySelectorAll('img');
    if (images.length > 0) {
        await Promise.all(
            Array.from(images).map(
                img =>
                    new Promise(resolve => {
                        if (img.complete) {
                            resolve(null);
                        } else {
                            img.onload = () => resolve(null);
                            img.onerror = () => resolve(null);
                        }
                    })
            )
        );
    }

    // Set final height based on content
    const contentHeight = Math.max(slideWrapper.scrollHeight, slideWrapper.offsetHeight, slideWrapper.clientHeight);
    slideWrapper.style.height = `${contentHeight}px`;

    // Ensure all child elements are sized correctly
    const slideContent = slideWrapper.querySelector('[class*="slideContent"]');
    if (slideContent) {
        (slideContent as HTMLElement).style.height = 'auto';
        (slideContent as HTMLElement).style.minHeight = 'auto';
    }

    const slideContainer = slideWrapper.querySelector('[class*="slideContainer"]');
    if (slideContainer) {
        (slideContainer as HTMLElement).style.height = 'auto';
        (slideContainer as HTMLElement).style.minHeight = 'auto';
    }

    // Enhance all links for better detection
    const links = slideWrapper.querySelectorAll('a');
    links.forEach(link => {
        const linkEl = link as HTMLElement;

        // Make sure the link is rendered as a block
        if (window.getComputedStyle(linkEl).display === 'inline') {
            linkEl.style.display = 'inline-block';
        }

        // Add box highlights for dev mode
        if (process.env.NODE_ENV === 'development') {
            linkEl.style.border = '1px solid blue';
            linkEl.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
        }

        // Ensure links have minimum dimensions
        if (linkEl.offsetWidth < 40) {
            linkEl.style.minWidth = '40px';
        }
        if (linkEl.offsetHeight < 20) {
            linkEl.style.minHeight = '20px';
        }
    });

    // Additional rendering stability wait
    await new Promise(resolve => setTimeout(resolve, 300));

    // Add link visualization overlays (in dev mode)
    if (process.env.NODE_ENV === 'development') {
        visualizeLinks(slideWrapper);
    }

    return slideWrapper;
};
