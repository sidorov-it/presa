import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenPackages } from '@/utils/tokens';

export async function GET(_request: NextRequest) {
    try {
        const packages = await getTokenPackages();

        return NextResponse.json({
            packages,
        });
    } catch (error) {
        logger.error('Error getting token packages:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
