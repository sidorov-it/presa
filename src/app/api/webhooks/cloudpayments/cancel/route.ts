import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const headersList = await headers();
    const contentType = headersList.get('content-type');

    let webhookData: any;

    if (contentType?.includes('application/json')) {
        webhookData = await request.json();
    } else {
        // Handle form-encoded data
        const formData = await request.formData();
        webhookData = Object.fromEntries(formData.entries()) as any;
    }

    console.log('cancel webhookData', webhookData);
    return NextResponse.json({ code: 0 });
}
