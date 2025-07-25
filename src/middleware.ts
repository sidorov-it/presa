import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const redirectPaths = ['/docs', '/view'];
const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/view/', '/verify-email'];
const authOnlyPaths = ['/login', '/register', '/forgot-password', '/reset-password']; // Pages that authenticated users shouldn't access

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    // Собираем протокол и хост из заголовков (настоящий внешний URL)
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'app.slydle.ru';
    const fullBaseUrl = `${protocol}://${host}`;
    const fullCurrentUrl = `${fullBaseUrl}${request.nextUrl.pathname}${request.nextUrl.search}`;

    if (redirectPaths.some(pp => path === pp)) {
        return NextResponse.redirect(new URL('/dashboard', fullBaseUrl));
    }

    const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));
    const isAuthOnlyPath = authOnlyPaths.some(pp => path === pp || path.startsWith(pp));

    console.log(`[MIDDLEWARE] getToken`);
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });
    console.log(`[MIDDLEWARE] token`, token);

    const emailVerified = token?.emailVerified === true;

    // Если авторизован и пытается попасть на страницу логина/регистрации
    if (token && emailVerified && isAuthOnlyPath) {
        console.log(`[MIDDLEWARE] Authenticated user trying to access ${path}, redirecting to dashboard`);
        const callbackUrl = request.nextUrl.searchParams.get('callbackUrl') || '/dashboard';
        return NextResponse.redirect(new URL(callbackUrl, fullBaseUrl));
    }

    // Если неавторизован и пытается попасть на защищённую страницу
    if (!isPublicPath && !token) {
        console.log(`[MIDDLEWARE] Unauthenticated user trying to access ${path}, redirecting to login`);
        const loginUrl = new URL('/login', fullBaseUrl);
        loginUrl.searchParams.set('callbackUrl', fullCurrentUrl);
        return NextResponse.redirect(loginUrl);
    }

    let response: NextResponse | null = null;

    if (token) {
        if (!emailVerified && path === '/login') {
            response = NextResponse.next();
        } else if (!emailVerified && path === '/') {
            response = NextResponse.redirect(new URL('/login', fullBaseUrl));
        } else if (!emailVerified && path !== '/email-not-verified' && path !== '/login' && !isPublicPath) {
            console.log(`[MIDDLEWARE] User email not verified, redirecting to email verification`, token);
            response = NextResponse.redirect(new URL('/email-not-verified', fullBaseUrl));
        } else if (emailVerified && path === '/email-not-verified') {
            console.log(`[MIDDLEWARE] User email verified, redirecting from email verification page`);
            response = NextResponse.redirect(new URL('/dashboard', fullBaseUrl));
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
