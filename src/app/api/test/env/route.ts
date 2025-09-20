import { NextRequest, NextResponse } from 'next/server';

export const GET = async (_request: NextRequest) => {
    return NextResponse.json({
        env: process.env,
    });
};
