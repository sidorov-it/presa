import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import logger from '@/utils/logger';
import { createLLMService, YaGptService } from '@/services/llm';

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
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/plain',
        ];

        if (!allowedTypes.includes(file.type)) {
            return Response.json(
                { error: 'Unsupported file type. Only PDF, DOCX, DOC, and TXT files are supported.' },
                { status: 400 }
            );
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return Response.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
        }

        // Extract text content from file
        let extractedText = '';

        if (file.type === 'text/plain') {
            extractedText = await file.text();
        } else if (file.type === 'application/pdf') {
            // For PDF files, we'll need a PDF parser
            // For now, we'll throw an error and implement later
            return Response.json(
                { error: 'PDF processing not yet implemented. Please use TXT, DOCX, or DOC files.' },
                { status: 400 }
            );
        } else if (file.type.includes('word') || file.type.includes('document')) {
            // For Word documents, we'll need a DOCX parser
            // For now, we'll throw an error and implement later
            return Response.json(
                { error: 'Word document processing not yet implemented. Please use TXT files for now.' },
                { status: 400 }
            );
        }

        if (!extractedText.trim()) {
            return Response.json({ error: 'No text content found in the document' }, { status: 400 });
        }

        // Truncate content if too long (to avoid token limits)
        const maxContentLength = 10000; // ~2500 tokens
        if (extractedText.length > maxContentLength) {
            extractedText = extractedText.substring(0, maxContentLength) + '...';
        }

        // Get token count from Yandex tokenization API
        let tokenCount = 0;

        const llmService = createLLMService({ userId: session.user.id });
        tokenCount = await llmService.getTokensCount(extractedText);

        // try {
        //     const tokenResponse = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/tokenize', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             Authorization: `Bearer ${process.env.YANDEX_GPT_API_KEY}`,
        //             'x-folder-id': process.env.YANDEX_FOLDER_ID || '',
        //         },
        //         body: JSON.stringify({
        //             modelUri: `gpt://${process.env.YANDEX_FOLDER_ID}/yandexgpt-lite`,
        //             text: extractedText,
        //         }),
        //     });

        //     if (tokenResponse.ok) {
        //         const tokenData = await tokenResponse.json();
        //         tokenCount = tokenData.tokens?.length || 0;
        //     } else {
        //         logger.warn('Failed to get token count from Yandex API, using fallback estimation');
        //         // Fallback: rough estimation (1 token ≈ 4 characters)
        //         tokenCount = Math.ceil(extractedText.length / 4);
        //     }
        // } catch (error) {
        //     logger.error('Error calling Yandex tokenization API:', error);
        //     // Fallback: rough estimation (1 token ≈ 4 characters)
        //     tokenCount = Math.ceil(extractedText.length / 4);
        // }

        return Response.json({
            extractedText,
            tokenCount,
            filename: file.name,
        });
    } catch (error) {
        logger.error('Error processing document upload:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withLogging(POSTHandler);
