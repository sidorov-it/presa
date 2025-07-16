import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define which paths are public (no auth needed)
    const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/email-not-verified'];
    const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));

    // Get the token
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const emailVerified = request.cookies.get('email-verified')?.value === 'true';

    // If it's not a public path and no token, redirect to login
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
        if (!emailVerified && path !== '/email-not-verified' && !isPublicPath) {
            return NextResponse.redirect(new URL('/email-not-verified', request.url));
        } else if (emailVerified && path === '/email-not-verified') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

// Configure which paths this middleware should run on
export const config = {
    matcher: [
        '/',
        '/dashboard/:path*',
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
        '/email-not-verified',
    ],
};
