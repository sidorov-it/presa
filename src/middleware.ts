import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const redirectPaths = ['/docs', '/view'];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    if (redirectPaths.some(pp => path === pp)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Define which paths are public (no auth needed)
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // If it's a public path and user is logged in, redirect to dashboard
    if (isPublicPath && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // If it's not a public path and no token, redirect to login
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// Configure which paths this middleware should run on
export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
        '/docs',
        '/view',
        '/docs/:path*',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/settings',
        '/trash',
        '/templates',
        '/themes',
        '/payment',
        '/tokens',
    ],
};
