import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { PdfGenerationStatus } from '@prisma/client';
import { getUploadPath } from './uploadPath';

function encodeRFC5987(v: string) {
    return encodeURIComponent(v)
        .replace(/['()]/g, escape) // %27 %28 %29
        .replace(/\*/g, '%2A');
}

// Функция для транслитерации кириллицы и очистки имени файла
function sanitizeFileName(fileName: string): string {
    // Словарь для транслитерации кириллицы
    const transliterationMap: { [key: string]: string } = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    // Транслитерация кириллицы
    let sanitized = fileName;
    for (const [cyrillic, latin] of Object.entries(transliterationMap)) {
        sanitized = sanitized.replace(new RegExp(cyrillic, 'g'), latin);
    }

    // Удаление запрещенных символов для файловых систем
    // Запрещенные символы: < > : " | ? * \ / 
    sanitized = sanitized.replace(/[<>:"|?*\\/]/g, '');

    // Замена пробелов и других проблемных символов на дефисы
    sanitized = sanitized.replace(/[\s\t\n\r]+/g, '-');

    // Удаление множественных дефисов
    sanitized = sanitized.replace(/-+/g, '-');

    // Удаление дефисов в начале и конце
    sanitized = sanitized.replace(/^-+|-+$/g, '');

    // Ограничение длины имени файла (максимум 100 символов)
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
        // Убеждаемся, что не обрезали слово посередине
        const lastDash = sanitized.lastIndexOf('-');
        if (lastDash > 80) {
            sanitized = sanitized.substring(0, lastDash);
        }
    }

    // Если после очистки имя файла пустое, используем fallback
    if (!sanitized || sanitized.trim() === '') {
        sanitized = 'presentation';
    }

    return sanitized;
}

export const generatePdfAsync = async (
    taskId: string,
    presentationId: string,
    slideIndex: number | null,
    baseUrl: string
) => {
    try {
        // Update task status to in_progress
        await prisma.pdfGenerationTask.update({
            where: { id: taskId },
            data: {
                status: PdfGenerationStatus.in_progress,
                startedAt: new Date(),
            },
        });

        // Fetch presentation from database
        const presentation = await prisma.presentation.findUnique({
            where: { id: presentationId },
            include: { user: true },
        });

        if (!presentation) {
            throw new Error('Presentation not found');
        }

        // Parse slides from JSON
        const slides = typeof presentation.slides === 'string' ? JSON.parse(presentation.slides) : presentation.slides;
        const visibleSlides = slides.filter((s: any) => !s.hidden);

        if (!visibleSlides || visibleSlides.length === 0) {
            throw new Error('No slides found');
        }

        // Determine which slides to process
        const slidesToProcess = slideIndex !== null ? [slideIndex] : visibleSlides.map((_: unknown, i: number) => i);

        // Update total slides count
        await prisma.pdfGenerationTask.update({
            where: { id: taskId },
            data: {
                totalSlides: slidesToProcess.length,
            },
        });

        // Create public directory for PDFs
        const publicPdfDir = path.join(getUploadPath(), 'pdfs');
        if (!fs.existsSync(publicPdfDir)) {
            fs.mkdirSync(publicPdfDir, { recursive: true });
        }

        // Launch Puppeteer browser
        const browser = await puppeteer.launch({
            headless: process.env.NODE_ENV === 'development' ? false : true,
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
            width: 1034 + 16 * 6,
            height: 580 + 40, // Increased height to accommodate variable content
            deviceScaleFactor: 1, // Set to 1 to avoid scaling issues in PDF
        });

        // Create PDF with individual pages for each slide
        const pdfPages: Buffer[] = [];

        for (const i of slidesToProcess) {
            const slideUrl = `${baseUrl}/view/${presentationId}/slide/${i}?pdf=true`;

            try {
                // Navigate to slide page
                await page.goto(slideUrl, {
                    waitUntil: 'networkidle0',
                    timeout: 30000,
                });

                // Wait for content to fully load and render
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Wait for slide content to be rendered
                await page.waitForSelector('.presentation-viewer-provider, [class*="presentation-viewer-provider"]', {
                    timeout: 15000,
                });

                // Get the actual slide content dimensions more accurately
                const slideElement = await page.$(
                    '.presentation-viewer-provider, [class*="presentation-viewer-provider"]'
                );

                let slideWidth = 1032 + 16 * 6; // Standard slide width
                let slideHeight = 580; // Default slide height

                if (slideElement) {
                    // Use evaluate to get more accurate dimensions in CSS pixels
                    const dimensions = await page.evaluate(() => {
                        const element = document.querySelector(
                            '.presentation-viewer-provider, [class*="presentation-viewer-provider"]'
                        );
                        if (!element) return null;

                        const rect = element.getBoundingClientRect();

                        // Get actual rendered dimensions including padding and border
                        const actualWidth = element.scrollWidth || rect.width;
                        const actualHeight = element.scrollHeight || rect.height;

                        // Also check document dimensions in case element is clipped
                        const documentHeight = Math.max(
                            document.body.scrollHeight,
                            document.body.offsetHeight,
                            document.documentElement.clientHeight,
                            document.documentElement.scrollHeight,
                            document.documentElement.offsetHeight
                        );

                        return {
                            width: actualWidth,
                            height: actualHeight,
                            scrollWidth: element.scrollWidth,
                            scrollHeight: element.scrollHeight,
                            clientWidth: element.clientWidth,
                            clientHeight: element.clientHeight,
                            offsetWidth: (element as HTMLElement).offsetWidth,
                            offsetHeight: (element as HTMLElement).offsetHeight,
                            rectWidth: rect.width,
                            rectHeight: rect.height,
                            documentHeight: documentHeight,
                            windowHeight: window.innerHeight,
                        };
                    });

                    if (dimensions) {
                        slideWidth = Math.ceil(dimensions.width);

                        // Use the maximum height from all available measurements
                        const maxHeight = Math.max(
                            dimensions.height,
                            dimensions.scrollHeight,
                            dimensions.offsetHeight,
                            dimensions.rectHeight,
                            dimensions.documentHeight
                        );

                        // Add buffer to height to prevent content overflow
                        slideHeight = Math.ceil(maxHeight + 150); // Add 150px buffer for safety

                        logger.debug(`Slide ${i} dimensions:`, {
                            finalWidth: slideWidth,
                            finalHeight: slideHeight,
                        });
                    }
                }

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
                    preferCSSPageSize: false, // Set to false to force custom page size
                    scale: 1,
                    format: undefined, // Don't use standard page format
                    pageRanges: '1', // Only first page to prevent page breaks
                });

                const pdfBuffer = Buffer.from(pdf);
                pdfPages.push(pdfBuffer);

                // Update progress in database
                await prisma.pdfGenerationTask.update({
                    where: { id: taskId },
                    data: {
                        completedSlides: pdfPages.length,
                    },
                });

                logger.debug(
                    `Generated PDF for slide ${i}, total completed: ${pdfPages.length}/${slidesToProcess.length}`
                );
            } catch (error) {
                logger.error(`Error generating PDF for slide ${i}:`, error instanceof Error ? error.message : error);
                // Continue with other slides even if one fails
            }
        }

        await browser.close();

        if (pdfPages.length === 0) {
            throw new Error('Failed to generate PDF pages');
        }

        // Combine all PDF pages into a single PDF
        const combinedPdf = await PDFDocument.create();

        for (const pdfBuffer of pdfPages) {
            const pdf = await PDFDocument.load(pdfBuffer);
            const pages = await combinedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach((page: any) => combinedPdf.addPage(page));
        }

        const pdfBytes = await combinedPdf.save();

        // Generate filename
        const baseFileName = presentation.title || 'presentation';
        const sanitizedFileName = sanitizeFileName(baseFileName);
        const fileName =
            slideIndex !== null
                ? `${sanitizedFileName}-slide-${slideIndex}-${taskId}.pdf`
                : `${sanitizedFileName}-${taskId}.pdf`;

        // Save PDF to public directory
        const filePath = path.join(publicPdfDir, fileName);
        fs.writeFileSync(filePath, new Uint8Array(pdfBytes));

        // Update task with completion status
        await prisma.pdfGenerationTask.update({
            where: { id: taskId },
            data: {
                status: PdfGenerationStatus.completed,
                completedAt: new Date(),
                fileName: fileName,
                filePath: `/pdfs/${fileName}`,
                fileSize: pdfBytes.length,
            },
        });

        logger.info(`PDF generation completed for task ${taskId}, file saved: ${fileName}`);
    } catch (error) {
        logger.error(`PDF generation failed for task ${taskId}:`, error);

        // Update task with error status
        await prisma.pdfGenerationTask.update({
            where: { id: taskId },
            data: {
                status: PdfGenerationStatus.failed,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    }
};
