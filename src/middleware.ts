import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const redirectPaths = ['/docs', '/view'];
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/view/', '/verify-email'];
const authOnlyPaths = ['/login', '/register', '/forgot-password', '/reset-password']; // Pages that authenticated users shouldn't access

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    if (redirectPaths.some(pp => path === pp)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Define which paths are public (no auth needed)
    const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));
    const isAuthOnlyPath = authOnlyPaths.some(pp => path === pp || path.startsWith(pp));

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const emailVerified = token?.emailVerified === true;

    // If user is authenticated and tries to access auth pages, redirect to dashboard
    if (token && isAuthOnlyPath) {
        console.log(`[MIDDLEWARE] Authenticated user trying to access ${path}, redirecting to dashboard`);
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard';
        return NextResponse.redirect(new URL(callbackUrl, request.url));
    }

    // If it's not a public path and no token, redirect to login
    if (!isPublicPath && !token) {
        console.log(`[MIDDLEWARE] Unauthenticated user trying to access ${path}, redirecting to login`);
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', request.url);
        return NextResponse.redirect(loginUrl);
    }

    let response: NextResponse | null = null;

    if (token) {
        if (!emailVerified && path !== '/email-not-verified' && !isPublicPath) {
            console.log(`[MIDDLEWARE] User email not verified, redirecting to email verification`);
            response = NextResponse.redirect(new URL('/email-not-verified', request.url));
        } else if (emailVerified && path === '/email-not-verified') {
            console.log(`[MIDDLEWARE] User email verified, redirecting from email verification page`);
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
