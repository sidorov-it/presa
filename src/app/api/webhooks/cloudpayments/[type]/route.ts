import { NextRequest, NextResponse } from 'next/server';
import * as checkHandler from '@/lib/cloudpayments/handlers/check';
import * as payHandler from '@/lib/cloudpayments/handlers/pay';
import * as failHandler from '@/lib/cloudpayments/handlers/fail';
import * as cancelHandler from '@/lib/cloudpayments/handlers/cancel';
import * as recurrentHandler from '@/lib/cloudpayments/handlers/recurrent';

const handlers: Record<string, any> = {
    check: checkHandler,
    pay: payHandler,
    fail: failHandler,
    cancel: cancelHandler,
    recurrent: recurrentHandler,
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
    const { type } = await params;

    const handler = handlers[type];
    if (!handler || typeof handler.POST !== 'function') {

        return NextResponse.json({ error: 'Unsupported webhook type' }, { status: 400 });
    }
    return handler.POST(request);
}
