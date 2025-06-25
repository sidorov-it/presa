import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

function encodeRFC5987(v: string) {
    return encodeURIComponent(v)
        .replace(/['()]/g, escape) // %27 %28 %29
        .replace(/\*/g, '%2A');
}

const handleRequest = async (request: NextRequest, props: { params: Promise<{ id: string }> }) => {
    try {
        const params = await props.params;
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const presentationId = params.id;

        // Get slideIndex from query parameters
        const { searchParams } = new URL(request.url);
        const slideIndexParam = searchParams.get('slideIndex');
        const slideIndex = slideIndexParam ? parseInt(slideIndexParam, 10) : null;

        // Fetch presentation from database
        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
            include: { user: true },
        });

        if (!presentation) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        // Check if user owns the presentation
        if (presentation.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse slides from JSON
        const slides = typeof presentation.slides === 'string' ? JSON.parse(presentation.slides) : presentation.slides;

        if (!slides || slides.length === 0) {
            return NextResponse.json({ error: 'No slides found' }, { status: 400 });
        }

        // Validate slideIndex if provided
        if (slideIndex !== null) {
            if (slideIndex < 0 || slideIndex >= slides.length) {
                return NextResponse.json(
                    { error: `Invalid slide index. Must be between 0 and ${slides.length - 1}` },
                    { status: 400 }
                );
            }
        }

        // Create debug directory for PDF files
        const debugDir = path.join(process.cwd(), 'debug-pdfs', presentationId);
        if (!fs.existsSync(debugDir)) {
            fs.mkdirSync(debugDir, { recursive: true });
        }
        logger.debug(`Debug PDFs will be saved to: ${debugDir}`);

        // Launch Puppeteer browser
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--window-size=1920,1200',
            ],
        });

        const page = await browser.newPage();

        // Set large initial viewport to ensure content fits
        await page.setViewport({
            width: 1034,
            height: 3000, // Increased height to accommodate variable content
            deviceScaleFactor: 2, // Higher DPI for better quality
        });

        // Get the base URL for the slide pages
        const baseUrl = request.nextUrl.origin;

        // Create PDF with individual pages for each slide
        const pdfPages: Buffer[] = [];

        // Determine which slides to process
        const slidesToProcess = slideIndex !== null ? [slideIndex] : Array.from({ length: slides.length }, (_, i) => i);

        for (const i of slidesToProcess) {
            const slideUrl = `${baseUrl}/view/${presentationId}/slide/${i}?pdf=true`;

            try {
                // Navigate to slide page
                await page.goto(slideUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 30000,
                });

                // Add CSS to ensure proper PDF layout
                await page.addStyleTag({
                    content: `
                        body { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            overflow: visible !important;
                        }
                        .slideWrapper { 
                            // min-height: auto !important; 
                            // height: auto !important; 
                            overflow: visible !important;
                            width: 1032px !important; /* Standard slide width */
                        }
                        .slideContent { 
                            // min-height: auto !important; 
                            // height: auto !important; 
                            overflow: visible !important;
                        }
                        .slideContainer { 
                            // min-height: auto !important; 
                            // height: auto !important; 
                            overflow: visible !important;
                            // padding: 40px !important;
                        }
                    `,
                });

                // Wait for content to fully load and render
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Wait for slide content to be rendered
                await page.waitForSelector('.presentation-viewer-provider, [class*="presentation-viewer-provider"]', {
                    timeout: 15000,
                });

                // Get the actual slide content dimensions
                const slideElement = await page.$(
                    '.presentation-viewer-provider, [class*="presentation-viewer-provider"]'
                );

                let slideWidth = 1032; // Standard slide width
                let slideHeight = 580; // Default slide height

                if (slideElement) {
                    const boundingBox = await slideElement.boundingBox();
                    if (boundingBox) {
                        slideWidth = boundingBox.width;
                        slideHeight = boundingBox.height;
                    }
                }

                logger.debug(`Slide ${i}: ${slideWidth}x${slideHeight}`);

                // Generate PDF for this slide with proper dimensions
                const pdf = await page.pdf({
                    width: slideWidth,
                    height: slideHeight,
                    printBackground: true,
                    margin: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                    },
                    preferCSSPageSize: false,
                    scale: 1,
                });

                // debug
                const pdfDoc = await PDFDocument.load(pdf);
                const firstPage = pdfDoc.getPage(0);
                const { width, height } = firstPage.getSize();
                logger.debug(`Actual size of the first page: ${width}x${height}`);
                // end debug

                const pdfBuffer = Buffer.from(pdf);
                pdfPages.push(pdfBuffer);

                // Save individual slide PDF for debugging
                const slidePdfPath = path.join(debugDir, `slide-${i}-individual.pdf`);
                fs.writeFileSync(slidePdfPath, pdfBuffer);
                logger.debug(`Saved individual slide ${i} PDF to: ${slidePdfPath}`);

                // Also save a screenshot for visual debugging
                const screenshotPath = path.join(debugDir, `slide-${i}-screenshot.png`) as `${string}.png`;
                await page.screenshot({
                    path: screenshotPath,
                    fullPage: true,
                });
                logger.debug(`Saved slide ${i} screenshot to: ${screenshotPath}`);
            } catch (error) {
                logger.error(`Error generating PDF for slide ${i}:`, error);
                // Continue with other slides even if one fails
            }
        }

        await browser.close();

        if (pdfPages.length === 0) {
            return NextResponse.json({ error: 'Failed to generate PDF pages' }, { status: 500 });
        }

        // Combine all PDF pages into a single PDF
        const combinedPdf = await PDFDocument.create();

        for (const pdfBuffer of pdfPages) {
            const pdf = await PDFDocument.load(pdfBuffer);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page: any) => combinedPdf.addPage(page));
        }

        const pdfBytes = await combinedPdf.save();

        // Save combined PDF for debugging
        const combinedPdfPath = path.join(debugDir, 'combined-final.pdf');
        fs.writeFileSync(combinedPdfPath, new Uint8Array(pdfBytes));
        logger.debug(`Saved combined PDF to: ${combinedPdfPath}`);

        // Create debug info file
        const debugInfo = {
            presentationId,
            presentationTitle: presentation.title,
            totalSlides: slides.length,
            requestedSlideIndex: slideIndex,
            processedSlides: slidesToProcess,
            generatedPages: pdfPages.length,
            timestamp: new Date().toISOString(),
            debugDirectory: debugDir,
        };
        const debugInfoPath = path.join(debugDir, 'debug-info.json');
        fs.writeFileSync(debugInfoPath, JSON.stringify(debugInfo, null, 2));
        logger.debug(`Saved debug info to: ${debugInfoPath}`);

        const file = new Blob([new Uint8Array(pdfBytes)]);

        const baseFileName = presentation.title || 'presentation';
        const fileName =
            slideIndex !== null ? encodeRFC5987(`${baseFileName}-slide-${slideIndex}`) : encodeRFC5987(baseFileName);

        return new Response(file, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${fileName}.pdf`,
                'Content-Length': file.size.toString(),
            },
        });
    } catch (error) {
        logger.error('PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
};

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    return handleRequest(request, props);
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    return handleRequest(request, props);
}
