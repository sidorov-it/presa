import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Helper function to generate error fingerprint for deduplication
function generateFingerprint(type: string, message: string, stack?: string): string {
    const stackFirstLine = stack?.split('\n')[1]?.trim() || '';
    const data = `${type}:${message}:${stackFirstLine}`;
    return crypto.createHash('md5').update(data).digest('hex');
}

// Helper function to determine error severity
function determineSeverity(message: string, stack?: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerMessage = message.toLowerCase();

    // Critical errors
    if (
        lowerMessage.includes('critical') ||
        lowerMessage.includes('fatal') ||
        lowerMessage.includes('out of memory') ||
        lowerMessage.includes('maximum call stack')
    ) {
        return 'critical';
    }

    // High severity
    if (
        lowerMessage.includes('network error') ||
        lowerMessage.includes('failed to fetch') ||
        lowerMessage.includes('undefined is not') ||
        lowerMessage.includes('cannot read property')
    ) {
        return 'high';
    }

    // Low severity
    if (lowerMessage.includes('warning') || lowerMessage.includes('deprecated') || stack?.includes('node_modules')) {
        return 'low';
    }

    // Default to medium
    return 'medium';
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();

        const { type, message, stack, page, metadata } = body;

        // Validate required fields
        if (!type || !message || !page) {
            return NextResponse.json({ error: 'Type, message, and page are required' }, { status: 400 });
        }

        // Validate error type
        const validTypes = ['javascript', 'react', 'promise', 'network', 'other'];
        if (!validTypes.includes(type)) {
            return NextResponse.json({ error: 'Invalid error type' }, { status: 400 });
        }

        // Get user agent from headers
        const userAgent = request.headers.get('user-agent') || undefined;

        // Generate fingerprint for error deduplication
        const fingerprint = generateFingerprint(type, message, stack);

        // Determine severity
        const severity = determineSeverity(message, stack);

        // Create error log record
        const errorLog = await prisma.errorLog.create({
            data: {
                type,
                severity,
                message,
                stack: stack || null,
                page,
                userAgent,
                userId: session?.user?.id || null,
                metadata: metadata || null,
                fingerprint,
            },
        });

        return NextResponse.json(
            {
                success: true,
                errorId: errorLog.id,
                fingerprint,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error saving error log:', error);
        // Don't throw - we don't want error logging to fail the app
        return NextResponse.json({ error: 'Failed to save error log' }, { status: 500 });
    }
}
