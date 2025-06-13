import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { to, subject, text } = await req.json();

        if (!to || !subject || !text) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await sendEmail({ to, subject, text });

        return NextResponse.json({ message: 'Email sent' });
    } catch (error) {
        console.error('Test email sending failed:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
