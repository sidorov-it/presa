import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { IPresentation, Slide } from '@/types';

export interface PdfExportOptions {
    paperSize?: 'a4' | 'letter' | 'legal';
    orientation?: 'portrait' | 'landscape';
    includeSlideNumbers?: boolean;
    scale?: number;
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
    // Set default options
    const {
        paperSize = 'a4',
        orientation = 'landscape',
        includeSlideNumbers = true,
        scale = 2
    } = options;

    // Create a hidden container to render slides for export
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    try {
        // Define PDF size based on selected paper size and orientation
        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: paperSize
        });

        const totalSlides = presentation.slides.length;
        
        // Process each slide
        for (let i = 0; i < totalSlides; i++) {
            const slide = presentation.slides[i];
            
            // Create a temporary slide element to render
            const slideElement = await renderSlideForExport(slide, container);
            
            // Capture the slide as an image
            const canvas = await html2canvas(slideElement, {
                scale, // Higher scale for better quality
                useCORS: true, // Enable CORS for images
                logging: false
            });
            
            // Add the slide to the PDF
            const imgData = canvas.toDataURL('image/png');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Calculate image dimensions to maintain aspect ratio
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            
            // Center the image on the page
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = (pdfHeight - imgHeight * ratio) / 2;
            
            pdf.addImage(
                imgData,
                'PNG',
                imgX,
                imgY,
                imgWidth * ratio,
                imgHeight * ratio
            );
            
            // Add slide number if requested
            if (includeSlideNumbers) {
                const pageNumber = `${i + 1} / ${totalSlides}`;
                const fontSize = 10;
                pdf.setFontSize(fontSize);
                pdf.setTextColor(100, 100, 100);
                
                // Calculate text width to center it
                const textWidth = pdf.getStringUnitWidth(pageNumber) * fontSize / pdf.internal.scaleFactor;
                const textX = (pdfWidth - textWidth) / 2;
                
                pdf.text(
                    pageNumber,
                    textX,
                    pdfHeight - 10 // 10mm from bottom
                );
            }
            
            // Add a new page for the next slide (if not the last slide)
            if (i < totalSlides - 1) {
                pdf.addPage();
            }
            
            // Clean up the temporary slide
            container.innerHTML = '';
        }
        
        // Save the PDF
        pdf.save(filename);
    } finally {
        // Clean up the container
        document.body.removeChild(container);
    }
};

/**
 * Renders a slide to a container for PDF export
 * @param slide The slide to render
 * @param container The container to render the slide in
 * @returns The rendered slide element
 */
const renderSlideForExport = async (slide: Slide, container: HTMLElement): Promise<HTMLElement> => {
    // Create the slide wrapper
    const slideWrapper = document.createElement('div');
    slideWrapper.style.backgroundColor = '#fff';
    slideWrapper.style.width = '960px'; // Typical presentation width
    slideWrapper.style.height = '540px'; // 16:9 aspect ratio
    slideWrapper.style.position = 'relative';
    slideWrapper.style.overflow = 'hidden';
    
    // Apply slide background if available
    if (slide.backgroundSettings && slide.backgroundSettings.color) {
        slideWrapper.style.backgroundColor = slide.backgroundSettings.color;
    }
    
    if (slide.backgroundSettings && slide.backgroundSettings.imageUrl) {
        slideWrapper.style.backgroundImage = `url(${slide.backgroundSettings.imageUrl})`;
        slideWrapper.style.backgroundSize = 'cover';
        slideWrapper.style.backgroundPosition = 'center';
    }
    
    // Create and append layout elements
    for (const layout of slide.layouts) {
        const layoutElement = document.createElement('div');
        layoutElement.style.position = 'absolute';
        
        // Position and size - TS type handling
        const position = layout.position || { x: 0, y: 0 };
        const size = layout.size || { width: 'auto', height: 'auto' };
        
        layoutElement.style.left = `${position.x || 0}px`;
        layoutElement.style.top = `${position.y || 0}px`;
        layoutElement.style.width = `${size.width || 'auto'}px`;
        layoutElement.style.height = `${size.height || 'auto'}px`;
        
        // Render elements in the layout
        const elements = layout.elements || [];
        for (const element of elements) {
            const elementContainer = document.createElement('div');
            
            // Position the element - handle TS type checking
            elementContainer.style.position = 'absolute';
            
            // Safe access to properties that might not exist in the type definition
            const elementPosition = element.position || { x: 0, y: 0 };
            const elementSize = element.size || { width: 'auto', height: 'auto' };
            
            elementContainer.style.left = `${elementPosition.x || 0}px`;
            elementContainer.style.top = `${elementPosition.y || 0}px`;
            elementContainer.style.width = `${elementSize.width || 'auto'}px`;
            elementContainer.style.height = `${elementSize.height || 'auto'}px`;
            
            // Apply element styling if available
            if (element.style) {
                Object.entries(element.style as Record<string, any>).forEach(([key, value]) => {
                    (elementContainer.style as any)[key] = value;
                });
            }
            
            // Render based on element type - handle type assertion
            const elementType = element.type as string;
            switch (elementType) {
                case 'text':
                    elementContainer.innerHTML = element.content || '';
                    break;
                case 'image':
                    if ('src' in element && element.src) {
                        const img = document.createElement('img');
                        img.src = element.src as string;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'contain';
                        elementContainer.appendChild(img);
                    }
                    break;
                case 'shape':
                    if ('shape' in element && 'shapeType' in element) {
                        // Render shape based on shapeType
                        const shapeElement = document.createElement('div');
                        shapeElement.style.width = '100%';
                        shapeElement.style.height = '100%';
                        
                        if ('backgroundColor' in element) {
                            shapeElement.style.backgroundColor = element.backgroundColor as string;
                        }
                        
                        if ('borderColor' in element) {
                            shapeElement.style.borderColor = element.borderColor as string;
                            shapeElement.style.borderWidth = `${('borderWidth' in element ? element.borderWidth : 1)}px`;
                            shapeElement.style.borderStyle = 'solid';
                        }
                        
                        const shapeType = element.shapeType as string;
                        switch (shapeType) {
                            case 'circle':
                                shapeElement.style.borderRadius = '50%';
                                break;
                            case 'rectangle':
                                shapeElement.style.borderRadius = `${('borderRadius' in element ? element.borderRadius : 0)}px`;
                                break;
                            // Add other shape types as needed
                        }
                        
                        elementContainer.appendChild(shapeElement);
                    }
                    break;
                default:
                    elementContainer.textContent = element.content || '';
            }
            
            layoutElement.appendChild(elementContainer);
        }
        
        slideWrapper.appendChild(layoutElement);
    }
    
    // Add the slide to the container
    container.appendChild(slideWrapper);
    
    return slideWrapper;
}; 