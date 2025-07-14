import { withLogging } from '@/hooks/withLoging';
import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getTokenPackages } from '@/utils/tokens';

async function GETHandler(_request: NextRequest) {
    try {
        const packages = await getTokenPackages();

        return NextResponse.json({
            packages: packages.filter(p => !p.isHidden),
        });
    } catch (error) {
        logger.error('Error getting token packages:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export const GET = withLogging(GETHandler);
