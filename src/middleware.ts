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
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/view/', '/email-not-verified', '/verify-email'];
    const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const emailVerified = token?.emailVerified === true;

    // If it's not a public path and no token, redirect to login
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    let response: NextResponse | null = null;

    if (token) {
        if (!emailVerified && path !== '/email-not-verified' && !isPublicPath) {
            response = NextResponse.redirect(new URL('/email-not-verified', request.url));
        } else if (emailVerified && path === '/email-not-verified') {
            response = NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    if (!response) {
        response = NextResponse.next();
    }

    return response;
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
        '/email-not-verified',
        '/verify-email',
    ],
};
