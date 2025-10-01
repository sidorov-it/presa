import logger from '@/utils/logger';
import { prisma } from '@/lib/prisma';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { PdfGenerationStatus } from '@prisma/client';
import { getUploadPath } from './uploadPath';
import { DEFAULT_PDF_EXPORT_STRATEGY, PdfExportStrategy, SINGLE_PAGE_TEST_STRATEGY } from '@/types/pdfExport';

// Функция для транслитерации кириллицы и очистки имени файла
function sanitizeFileName(fileName: string): string {
    // Словарь для транслитерации кириллицы
    const transliterationMap: { [key: string]: string } = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'g',
        д: 'd',
        е: 'e',
        ё: 'yo',
        ж: 'zh',
        з: 'z',
        и: 'i',
        й: 'y',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'h',
        ц: 'ts',
        ч: 'ch',
        ш: 'sh',
        щ: 'sch',
        ъ: '',
        ы: 'y',
        ь: '',
        э: 'e',
        ю: 'yu',
        я: 'ya',
        А: 'A',
        Б: 'B',
        В: 'V',
        Г: 'G',
        Д: 'D',
        Е: 'E',
        Ё: 'Yo',
        Ж: 'Zh',
        З: 'Z',
        И: 'I',
        Й: 'Y',
        К: 'K',
        Л: 'L',
        М: 'M',
        Н: 'N',
        О: 'O',
        П: 'P',
        Р: 'R',
        С: 'S',
        Т: 'T',
        У: 'U',
        Ф: 'F',
        Х: 'H',
        Ц: 'Ts',
        Ч: 'Ch',
        Ш: 'Sh',
        Щ: 'Sch',
        Ъ: '',
        Ы: 'Y',
        Ь: '',
        Э: 'E',
        Ю: 'Yu',
        Я: 'Ya',
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

const PDF_PAGE_WIDTH_PX = 1034;
const SLIDE_ASPECT_RATIO = 16 / 9;
const PDF_PAGE_HEIGHT_PX = Math.round(PDF_PAGE_WIDTH_PX / SLIDE_ASPECT_RATIO);

export const generatePdfAsync = async (
    taskId: string,
    presentationId: string,
    slideIndex: number | null,
    baseUrl: string,
    hideBranding: boolean = false,
    exportStrategy: PdfExportStrategy = DEFAULT_PDF_EXPORT_STRATEGY
) => {
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;

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
        browser = await puppeteer.launch({
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

        page = await browser.newPage();

        // Set large initial viewport to ensure content fits
        await page.setViewport({
            width: PDF_PAGE_WIDTH_PX + 16 * 6,
            height: PDF_PAGE_HEIGHT_PX + 40,
            deviceScaleFactor: 1,
        });

        const shouldUseSinglePageStrategy =
            exportStrategy === SINGLE_PAGE_TEST_STRATEGY && slideIndex === null;

        let finalPdfBuffer: Buffer | null = null;

        if (shouldUseSinglePageStrategy) {
            const singlePageMargins = {
                horizontal: 32,
                vertical: 32,
            };
            let perSlideContentHeights: number[] = [];
            let pdfPaperWidth = PDF_PAGE_WIDTH_PX + singlePageMargins.horizontal * 2;
            let pdfContentWidth = PDF_PAGE_WIDTH_PX;
            let pdfContentHeight = PDF_PAGE_HEIGHT_PX;

            const allSlidesUrl = `${baseUrl}/view/${presentationId}/slide/all?pdf=true&hideBranding=${hideBranding}&hasActiveSubscription=${hideBranding}`;
            logger.debug(`Generating PDF for task ${taskId} using single-page strategy`, { url: allSlidesUrl });

            await page.goto(allSlidesUrl, {
                waitUntil: 'networkidle0',
                timeout: 30000,
            });

            await page.waitForSelector('[data-pdf-slide]', { timeout: 15000 });
            await page
                .waitForFunction(
                    expectedCount => document.querySelectorAll('[data-pdf-slide]').length >= expectedCount,
                    { timeout: 15000 },
                    visibleSlides.length
                )
                .catch(() => undefined);

            await new Promise(resolve => setTimeout(resolve, 1000));

            const slideDimensions = await page.evaluate(() => {
                const slides = Array.from(document.querySelectorAll('[data-pdf-slide]')) as HTMLElement[];
                return slides.map(slide => {
                    const rect = slide.getBoundingClientRect();
                    const widthCandidates = [
                        rect.width,
                        slide.scrollWidth,
                        slide.offsetWidth,
                        slide.clientWidth,
                    ].filter(value => Number.isFinite(value) && value > 0);
                    const heightCandidates = [
                        rect.height,
                        slide.scrollHeight,
                        slide.offsetHeight,
                        slide.clientHeight,
                    ].filter(value => Number.isFinite(value) && value > 0);

                    return {
                        width: widthCandidates.length ? Math.max(...widthCandidates) : 0,
                        height: heightCandidates.length ? Math.max(...heightCandidates) : 0,
                    };
                });
            });

            const normalizedDimensions = Array.isArray(slideDimensions)
                ? slideDimensions.map(dimension => {
                      const width = Math.ceil(dimension?.width ?? 0);
                      const height = Math.ceil(dimension?.height ?? 0);

                      return {
                          width: Number.isFinite(width) && width > 0 ? width : PDF_PAGE_WIDTH_PX,
                          height: Number.isFinite(height) && height > 0 ? height : PDF_PAGE_HEIGHT_PX,
                      };
                  })
                : [];

            if (normalizedDimensions.length > 0) {
                pdfContentWidth = Math.max(
                    PDF_PAGE_WIDTH_PX,
                    ...normalizedDimensions.map(dimension => dimension.width)
                );

                const minHeightForRatio = Math.ceil(pdfContentWidth / SLIDE_ASPECT_RATIO);

                perSlideContentHeights = normalizedDimensions.map(dimension =>
                    Math.max(dimension.height, minHeightForRatio)
                );

                pdfContentHeight = perSlideContentHeights.reduce(
                    (maxHeight, height) => Math.max(maxHeight, height),
                    minHeightForRatio
                );
            }

            pdfPaperWidth = pdfContentWidth + singlePageMargins.horizontal * 2;
            const pdfPaperHeight = pdfContentHeight + singlePageMargins.vertical * 2;

            const viewportWidth = Math.max(pdfPaperWidth + 64, PDF_PAGE_WIDTH_PX + 96);
            const viewportHeight = Math.max(pdfPaperHeight + 40, PDF_PAGE_HEIGHT_PX + 40);

            await page.setViewport({
                width: viewportWidth,
                height: viewportHeight,
                deviceScaleFactor: 1,
            });

            logger.debug('Single-page PDF slide dimensions resolved', {
                pdfContentWidth,
                pdfContentHeight,
                perSlideContentHeights,
            });

            const pdfBuffer = await page.pdf({
                width: `${pdfPaperWidth}px`,
                height: `${pdfPaperHeight}px`,
                printBackground: true,
                margin: {
                    top: singlePageMargins.vertical,
                    right: singlePageMargins.horizontal,
                    bottom: singlePageMargins.vertical,
                    left: singlePageMargins.horizontal,
                },
                preferCSSPageSize: false,
            });

            const rawSinglePageBuffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

            if (perSlideContentHeights.length > 0) {
                const pdfDocument = await PDFDocument.load(rawSinglePageBuffer);
                const pages = pdfDocument.getPages();

                if (pages.length === perSlideContentHeights.length) {
                    pages.forEach((pageInstance, pageIndex) => {
                        const targetHeight =
                            perSlideContentHeights[pageIndex] + singlePageMargins.vertical * 2;

                        pageInstance.setMediaBox(0, 0, pdfPaperWidth, targetHeight);
                        pageInstance.setCropBox(0, 0, pdfPaperWidth, targetHeight);
                        pageInstance.setBleedBox(0, 0, pdfPaperWidth, targetHeight);
                        pageInstance.setTrimBox(0, 0, pdfPaperWidth, targetHeight);
                        pageInstance.setArtBox(0, 0, pdfPaperWidth, targetHeight);
                    });

                    const resizedPdfBytes = await pdfDocument.save();
                    finalPdfBuffer = Buffer.from(resizedPdfBytes);
                } else {
                    logger.warn(
                        `Mismatch between rendered slides (${perSlideContentHeights.length}) and PDF pages (${pages.length}) in single-page export. Skipping dynamic page height adjustments.`,
                        {
                            perSlideContentHeights: perSlideContentHeights.length,
                            pageCount: pages.length,
                        }
                    );

                    finalPdfBuffer = rawSinglePageBuffer;
                }
            } else {
                finalPdfBuffer = rawSinglePageBuffer;
            }

            await prisma.pdfGenerationTask.update({
                where: { id: taskId },
                data: {
                    completedSlides: visibleSlides.length,
                },
            });

            logger.debug(
                `Generated PDF in single-page mode for task ${taskId}, slides processed: ${visibleSlides.length}`
            );
        } else {
            // Create PDF with individual pages for each slide
            const pdfPages: Buffer[] = [];

            for (const i of slidesToProcess) {
                const slideUrl = `${baseUrl}/view/${presentationId}/slide/${i}?pdf=true&hideBranding=${hideBranding}&hasActiveSubscription=${hideBranding}`;

                try {
                    await page.goto(slideUrl, {
                        waitUntil: 'networkidle0',
                        timeout: 30000,
                    });

                    await new Promise(resolve => setTimeout(resolve, 2000));

                    await page.waitForSelector('.presentation-viewer-provider, [class*="presentation-viewer-provider"]', {
                        timeout: 15000,
                    });

                    const slideElement = await page.$(
                        '.presentation-viewer-provider, [class*="presentation-viewer-provider"]'
                    );

                    let slideWidth = PDF_PAGE_WIDTH_PX + 16 * 6;
                    let slideHeight = PDF_PAGE_HEIGHT_PX;

                    if (slideElement) {
                        const dimensions = await page.evaluate(() => {
                            const element = document.querySelector(
                                '.presentation-viewer-provider, [class*="presentation-viewer-provider"]'
                            );
                            if (!element) return null;

                            const rect = element.getBoundingClientRect();

                            const actualWidth = element.scrollWidth || rect.width;
                            const actualHeight = element.scrollHeight || rect.height;

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

                            const maxHeight = Math.max(
                                dimensions.height,
                                dimensions.scrollHeight,
                                dimensions.offsetHeight,
                                dimensions.rectHeight,
                                dimensions.documentHeight
                            );

                            slideHeight = maxHeight;

                            logger.debug(`Slide ${i} dimensions:`, {
                                finalWidth: slideWidth,
                                finalHeight: slideHeight,
                            });
                        }
                    }

                    const pdf = await page.pdf({
                        width: `${slideWidth}px`,
                        height: `${slideHeight}px`,
                        printBackground: true,
                        margin: {
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                        },
                        preferCSSPageSize: false,
                        scale: 1,
                        format: undefined,
                        pageRanges: '1',
                    });

                    const pdfBuffer = Buffer.isBuffer(pdf) ? pdf : Buffer.from(pdf);
                    pdfPages.push(pdfBuffer);

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
                }
            }

            if (pdfPages.length === 0) {
                throw new Error('Failed to generate PDF pages');
            }

            const combinedPdf = await PDFDocument.create();

            for (const pdfBuffer of pdfPages) {
                const pdfDocument = await PDFDocument.load(pdfBuffer);
                const pages = await combinedPdf.copyPages(pdfDocument, pdfDocument.getPageIndices());
                pages.forEach(pageToAdd => combinedPdf.addPage(pageToAdd));
            }

            const pdfBytes = await combinedPdf.save();
            finalPdfBuffer = Buffer.from(pdfBytes);
        }

        if (!finalPdfBuffer) {
            throw new Error('Failed to generate PDF buffer');
        }

        const baseFileName = presentation.title || 'presentation';
        const sanitizedFileName = sanitizeFileName(baseFileName);
        const fileName =
            slideIndex !== null
                ? `${sanitizedFileName}-slide-${slideIndex}-${taskId}.pdf`
                : `${sanitizedFileName}-${taskId}.pdf`;

        const filePath = path.join(publicPdfDir, fileName);
        fs.writeFileSync(filePath, finalPdfBuffer);

        await prisma.pdfGenerationTask.update({
            where: { id: taskId },
            data: {
                status: PdfGenerationStatus.completed,
                completedAt: new Date(),
                fileName: fileName,
                filePath: `/pdfs/${fileName}`,
                fileSize: finalPdfBuffer.length,
            },
        });

        logger.info(`PDF generation completed for task ${taskId}, file saved: ${fileName}`);
    } catch (error) {
        logger.error(`PDF generation failed for task ${taskId}:`, error);

        await prisma.pdfGenerationTask.update({
            where: { id: taskId },
            data: {
                status: PdfGenerationStatus.failed,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (closeError) {
                logger.warn('Failed to close Puppeteer page after PDF generation', closeError);
            }
        }

        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                logger.warn('Failed to close Puppeteer browser after PDF generation', closeError);
            }
        }
    }
};
