import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth(
    async function middleware(req: NextRequest & { nextauth: { token: any } }) {
        const token = req.nextauth.token;

        // Check if user is trying to access protected routes
        if (
            req.nextUrl.pathname.startsWith('/dashboard') ||
            req.nextUrl.pathname.startsWith('/docs') ||
            req.nextUrl.pathname.startsWith('/subscriptions')
        ) {
            if (!token) {
                return NextResponse.redirect(new URL('/login', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/docs/:path*',
        '/subscriptions/:path*',
        '/api/ai/:path*',
        '/api/presentations/:path*',
        '/api/subscriptions/:path*',
    ],
};
