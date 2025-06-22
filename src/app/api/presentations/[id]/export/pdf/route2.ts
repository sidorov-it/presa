import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const presentationId = params.id;

        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
            include: { user: true },
        });

        if (!presentation) {
            return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
        }

        if (presentation.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const slides = typeof presentation.slides === 'string' ? JSON.parse(presentation.slides) : presentation.slides;

        if (!slides || slides.length === 0) {
            return NextResponse.json({ error: 'No slides found' }, { status: 400 });
        }

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ],
            });

            const page = await browser.newPage();

            // await page.setViewport({
            //     width: 1920,
            //     height: 1080,
            //     deviceScaleFactor: 1,
            // });

            const baseUrl = request.nextUrl.origin;
            const combinedPdf = await PDFDocument.create();

            for (let i = 0; i < slides.length; i++) {
                const slideUrl = `${baseUrl}/view/${presentationId}/slide/${i}`;

                try {
                    await page.goto(slideUrl, {
                        waitUntil: 'networkidle0',
                        timeout: 30000,
                    });

                    // Wait for content to load using a more reliable method
                    await page.evaluate(() => {
                        return new Promise(resolve => {
                            setTimeout(resolve, 2000);
                        });
                    });

                    // Try to wait for slide content
                    try {
                        await page.waitForSelector('div', { timeout: 5000 });
                    } catch {
                        logger.warn(`No content selector found for slide ${i}, continuing...`);
                    }

                    const pdfBuffer = await page.pdf({
                        format: 'A4',
                        landscape: true,
                        printBackground: true,
                        margin: {
                            top: '0.5in',
                            right: '0.5in',
                            bottom: '0.5in',
                            left: '0.5in',
                        },
                        preferCSSPageSize: false,
                    });

                    const slidePdf = await PDFDocument.load(pdfBuffer);
                    const pages = await combinedPdf.copyPages(slidePdf, slidePdf.getPageIndices());
                    pages.forEach(page => combinedPdf.addPage(page));
                } catch (slideError) {
                    logger.error(`Error processing slide ${i}:`, slideError);
                }
            }

            const pdfBytes = await combinedPdf.save();

            // Convert Uint8Array to Buffer for proper binary handling
            const pdfBuffer = Buffer.from(pdfBytes);

            return new NextResponse(pdfBuffer, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${presentation.title || 'presentation'}.pdf"`,
                    'Content-Length': pdfBuffer.length.toString(),
                },
            });
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    } catch (error) {
        logger.error('PDF generation error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
