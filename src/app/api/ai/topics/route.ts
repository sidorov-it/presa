import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateTopics } from '@/services/llm/gigaChat';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { description, numSlides, tone } = await req.json();

        if (!description) {
            return NextResponse.json({ message: 'Description is required' }, { status: 400 });
        }

        try {
            const { title, topics } = await generateTopics(session.user.id, description, numSlides, tone);

            return NextResponse.json({
                title,
                description,
                topics,
            });
        } catch (error) {
            console.error('Error generating topics:', error);
            return NextResponse.json({ error: 'Failed to generate presentation topics' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in topics route:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
