import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { GigaChatService } from '@/services/llm/gigaChat/gigaChat';

export const POST = async (req: NextRequest) => {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt, count = 3 } = await req.json();

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        if (count < 1 || count > 5) {
            return NextResponse.json({ error: 'Count must be between 1 and 5' }, { status: 400 });
        }

        // Initialize GigaChat service
        const gigaChatService = GigaChatService.createGigaChatService({
            userId: session.user.id,
        });

        // Generate images
        const images = [];
        for (let i = 0; i < count; i++) {
            try {
                const result = await gigaChatService.generateImage(prompt, {
                    userId: session.user.id,
                });
                images.push({
                    url: result.imageUrl,
                    id: result.imageId,
                });
            } catch (error) {
                console.error(`Failed to generate image ${i + 1}:`, error);
                // Continue with other images even if one fails
            }
        }

        if (images.length === 0) {
            return NextResponse.json({ error: 'Failed to generate any images' }, { status: 500 });
        }

        return NextResponse.json({
            images,
            generated: images.length,
            requested: count,
        });
    } catch (error) {
        console.error('Error generating images:', error);
        return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 });
    }
};
