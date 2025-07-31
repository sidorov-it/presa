import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createLLMService } from '@/services/llm';
import { getTextExtractor } from 'office-text-extractor';
import { DocExtractor } from './DocExtractor';
import { getUserFeatures } from '@/utils/subscriptions';
import { handleApiError } from '@/utils/errorHandler';

const Extractor = getTextExtractor();

async function POSTHandler(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the uploaded file from form data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            //word
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            //pptx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        if (!allowedTypes.includes(file.type)) {
            return Response.json(
                { error: 'Unsupported file type. Only PDF, DOCX, PPTX, and TXT files are supported.' },
                { status: 400 }
            );
        }

        // Check user's subscription features and apply file size limits
        const userFeatures = await getUserFeatures(session.user.id);
        const maxFileSizeInMB = userFeatures.maxDocumentSize;
        const maxFileSizeInBytes = maxFileSizeInMB * 1024 * 1024;

        if (file.size > maxFileSizeInBytes) {
            return Response.json(
                {
                    error: `File size exceeds ${maxFileSizeInMB}MB limit for your subscription plan`,
                    maxSizeAllowed: maxFileSizeInMB,
                },
                { status: 400 }
            );
        }

        // Extract text content from file
        let extractedText = '';

        const buffer = Buffer.from(await file.arrayBuffer());
        const docExtractor = new DocExtractor();

        switch (file.type) {
            case 'text/plain':
                extractedText = await file.text();
                break;
            case 'application/pdf':
                extractedText = await Extractor.extractText({ input: buffer, type: 'buffer' });
                break;
            case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                extractedText = await docExtractor.apply(buffer);
                break;
            default:
                break;
            //     break;
            // case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            //     const filename = `${Date.now()}-${file.name}`;
            //     const filePath = path.join(UPLOAD_DIR, filename);

            //     // Ensure uploads directory exists
            //     await fs.mkdir(UPLOAD_DIR, { recursive: true });
            //     // Save file
            //     const arrayBuffer = await file.arrayBuffer();
            //     buffer = Buffer.from(arrayBuffer);
            //     await fs.writeFile(filePath, buffer);

            //     const pptxParser = new PptxParser(filePath);
            //     extractedText = await pptxParser.parse(Buffer.from(await file.arrayBuffer()));
            //     break;
        }

        if (!extractedText.trim()) {
            return Response.json({ error: 'No text content found in the document' }, { status: 400 });
        }

        // Truncate content if too long (to avoid token limits)
        // const maxContentLength = 10000; // ~2500 tokens
        // if (extractedText.length > maxContentLength) {
        //     extractedText = extractedText.substring(0, maxContentLength) + '...';
        // }

        // Get token count from Yandex tokenization API
        let tokenCount = 0;

        const llmService = createLLMService({ userId: session.user.id });
        tokenCount = await llmService.getTokensCount(extractedText);

        return Response.json({
            extractedText,
            tokenCount,
            filename: file.name,
            maxDocumentSize: maxFileSizeInMB,
        });
    } catch (error) {
        return handleApiError(error, 'Document upload processing', 'POST /api/ai/document/upload');
    }
}

export const POST = withLogging(POSTHandler);
