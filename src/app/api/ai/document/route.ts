import { withLogging } from '@/hooks/withLoging';
import { NextRequest } from 'next/server';
import { withTokenDeduction, TokenCalculators, MetadataExtractors } from '@/utils/aiTokenMiddleware';
import logger from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { generateTopicsFromDocument } from '@/services/llm/gigaChat';

async function POSTHandler(request: NextRequest) {
    const requestId = uuidv4();
    return withTokenDeduction(
        request,
        {
            operation: 'GENERATE_TOPICS',
            description: 'Generate presentation topics from document',
            calculateTokens: TokenCalculators.generateTopics,
            metadata: MetadataExtractors.topics,
        },
        async (session, requestData, formData) => {
            try {
                // Get the uploaded file from form data
                const file = formData?.get('file') as File;
                
                if (!file) {
                    throw new Error('No file provided');
                }

                // Validate file type
                const allowedTypes = [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/msword',
                    'text/plain',
                ];

                if (!allowedTypes.includes(file.type)) {
                    throw new Error('Unsupported file type. Only PDF, DOCX, DOC, and TXT files are supported.');
                }

                // Validate file size (10MB limit)
                if (file.size > 10 * 1024 * 1024) {
                    throw new Error('File size exceeds 10MB limit');
                }

                // Extract text content from file
                let textContent = '';
                
                if (file.type === 'text/plain') {
                    textContent = await file.text();
                } else if (file.type === 'application/pdf') {
                    // For PDF files, we'll need a PDF parser
                    // For now, we'll throw an error and implement later
                    throw new Error('PDF processing not yet implemented. Please use TXT, DOCX, or DOC files.');
                } else if (file.type.includes('word') || file.type.includes('document')) {
                    // For Word documents, we'll need a DOCX parser
                    // For now, we'll throw an error and implement later
                    throw new Error('Word document processing not yet implemented. Please use TXT files for now.');
                }

                if (!textContent.trim()) {
                    throw new Error('No text content found in the document');
                }

                // Truncate content if too long (to avoid token limits)
                const maxContentLength = 10000; // ~2500 tokens
                if (textContent.length > maxContentLength) {
                    textContent = textContent.substring(0, maxContentLength) + '...';
                }

                // Generate topics from document content
                const { title, topics } = await generateTopicsFromDocument(
                    session.user.id,
                    {
                        content: textContent,
                        fileName: file.name,
                    },
                    requestId
                );

                return {
                    title: title || `Презентация по документу: ${file.name}`,
                    description: `Презентация создана на основе документа: ${file.name}`,
                    topics,
                };
            } catch (error) {
                logger.error('Error processing document:', error.message);
                throw error;
            }
        }
    );
}

export const POST = withLogging(POSTHandler); 