import { NextRequest } from 'next/server';
import { POST as payHandler } from './pay';

export async function POST(request: NextRequest) {
    return payHandler(request);
}
