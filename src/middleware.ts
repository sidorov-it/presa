import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import logger from '@/utils/logger';

export async function middleware(request: NextRequest) {
    const timestamp = new Date().toISOString();
    const path = request.nextUrl.pathname;
    const address = path + request.nextUrl.search;
    let userId: string | undefined;
    let response: NextResponse;

    try {
        // Get auth token if available
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });
        userId = token?.id as string | undefined;

        // Define which paths are public (no auth needed)
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));

        // If it's a public path and user is logged in, redirect to dashboard
        if (isPublicPath && token) {
            response = NextResponse.redirect(new URL('/dashboard', request.url));
        } else if (!isPublicPath && !token) {
            // If it's not a public path and no token, redirect to login
            response = NextResponse.redirect(new URL('/login', request.url));
        } else {
            response = NextResponse.next();
        }
    } catch (error) {
        logger.error(
            JSON.stringify({
                timestamp,
                address,
                userId: userId ?? null,
                status: 500,
                error: error instanceof Error ? error.message : String(error),
            })
        );
        // In case of error, allow the request to continue
        response = NextResponse.next();
    }

    logger.info(
        JSON.stringify({
            timestamp,
            address,
            userId: userId ?? null,
            status: response.status,
        })
    );

    return response;
}

// Configure which paths this middleware should run on
export const config = {
    // Run on all requests except for static files and Next.js internals
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
