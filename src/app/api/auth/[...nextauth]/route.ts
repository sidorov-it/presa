import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import VKProvider from 'next-auth/providers/vk';
import MailRuProvider from 'next-auth/providers/mailru';
import YandexProvider from 'next-auth/providers/yandex';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';
import logger from '@/utils/logger';
import { PurchaseStatus } from '@prisma/client';

// Track ongoing OAuth requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<any>>();

// Track callback requests
const callbackRequestCount = new Map<string, number>();

export const authOptions: NextAuthOptions = {
    providers: [
        VKProvider({
            clientId: process.env.VK_CLIENT_ID ?? '',
            clientSecret: process.env.VK_CLIENT_SECRET ?? '',
            // checks: 'pkce', // или default, не 'none'
            authorization: {
                url: 'https://oauth.vk.com/authorize',
                params: {
                    response_type: 'openid,code',
                    scope: 'email',
                },
            },
        }),
        MailRuProvider({
            clientId: process.env.MAILRU_CLIENT_ID ?? '',
            clientSecret: process.env.MAILRU_CLIENT_SECRET ?? '',
        }),
        YandexProvider({
            clientId: process.env.YANDEX_CLIENT_ID ?? '',
            clientSecret: process.env.YANDEX_CLIENT_SECRET ?? '',
            authorization: {
                url: 'https://oauth.yandex.ru/authorize',
                params: {
                    scope: 'login:email login:info',
                    response_type: 'code',
                },
            },
            token: {
                url: 'https://oauth.yandex.ru/token',
            },
            userinfo: {
                url: 'https://login.yandex.ru/info',
                params: {
                    format: 'json',
                },
            },
            profile(profile) {
                return {
                    id: profile.id,
                    name: profile.real_name || profile.display_name || '',
                    email: profile.default_email || '',
                    role: 'user',
                    image: profile.default_avatar_id
                        ? `https://avatars.yandex.net/get-yapic/${profile.default_avatar_id}/islands-200`
                        : '',
                };
            },
        }),
        CredentialsProvider({
            id: 'credentials',
            name: 'Credentials',
            type: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials.password) {
                    logger.warn('[AUTH] Missing credentials', {
                        hasEmail: !!credentials?.email,
                        hasPassword: !!credentials?.password,
                    });
                    return null;
                }
                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email },
                        select: {
                            id: true,
                            email: true,
                            passwordHash: true,
                            name: true,
                            image: true,
                            role: true,
                            emailVerified: true,
                            isVerified: true,
                            createdVia: true,
                        },
                    });
                    if (!user) {
                        logger.warn('[AUTH] User not found', { email: credentials.email });
                        return null;
                    }
                    if (!user.passwordHash) {
                        logger.warn('[AUTH] Password login not allowed', { email: credentials.email });
                        throw new Error(`OAUTH_ONLY:${user.createdVia}`);
                    }
                    const isPasswordMatch = await comparePassword(credentials.password, user.passwordHash);
                    if (!isPasswordMatch) {
                        logger.warn('[AUTH] Invalid password', { email: credentials.email });
                        return null;
                    }
                    logger.info('[AUTH] User authenticated successfully', { email: user.email });
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        role: user.role,
                        emailVerified: Boolean(user.emailVerified || user.isVerified),
                    };
                } catch (error) {
                    logger.error('[AUTH] Database or comparison error', {
                        error: error instanceof Error ? error.message : 'Unknown error',
                        email: credentials.email,
                    });
                    if (error instanceof Error && error.message.startsWith('OAUTH_ONLY:')) {
                        throw error;
                    }
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account }) {
            logger.info('[SIGNIN_CALLBACK] SignIn callback triggered:', {
                provider: account?.provider || 'unknown',
                userEmail: user?.email || 'no-email',
                userId: user?.id || 'no-id',
                accountType: account?.type || 'unknown',
                hasAccount: !!account,
                hasUser: !!user,
            });

            if (!account || account.provider === 'credentials') {
                logger.info('[SIGNIN_CALLBACK] Credentials provider detected or no account:', {
                    hasAccount: !!account,
                    provider: account?.provider || 'none',
                    userEmail: user?.email || 'no-email',
                    userId: user?.id || 'no-id',
                });
                return true;
            }

            if (!user.email || !account.providerAccountId) {
                logger.warn('[SIGNIN_CALLBACK] Missing email or providerAccountId in OAuth signIn');
                return `/login?error=Configuration`;
            }

            const provider = account.provider;
            const requestKey = `${provider}-${account.providerAccountId}`;

            // Check if there's already an ongoing request for this user
            if (ongoingRequests.has(requestKey)) {
                try {
                    const result = await ongoingRequests.get(requestKey);
                    return result;
                } catch (error) {
                    logger.error(`[SIGNIN_CALLBACK] Duplicate request failed for ${requestKey}:`, error);
                    ongoingRequests.delete(requestKey);
                    return `/login?error=OAuthCallback`;
                }
            }

            // Create a promise for this request and store it
            const requestPromise = (async () => {
                try {
                    const oauth = await prisma.oAuthAccount.findUnique({
                        where: {
                            provider_providerUserId: {
                                provider,
                                providerUserId: account.providerAccountId,
                            },
                        },
                        include: { user: true },
                    });

                    if (oauth) {
                        user.id = oauth.userId;
                        user.role = oauth.user?.role ?? 'user';
                        user.name = oauth.user?.name ?? '';
                        (user as any).emailVerified = Boolean(oauth.user?.emailVerified || oauth.user?.isVerified);
                        return true;
                    }

                    const existing = await prisma.user.findUnique({ where: { email: user.email } });

                    if (existing) {
                        logger.warn(`[SIGNIN_CALLBACK] Email ${user.email} already registered with different provider`);
                        return `/login?error=EmailRegistered`;
                    }

                    // Use transaction to ensure atomicity
                    const result = await prisma.$transaction(async (tx: typeof prisma) => {
                        const newUser = await tx.user.create({
                            data: {
                                email: user.email,
                                name: user.name ?? '',
                                passwordHash: null,
                                image: user.image,
                                isVerified: true,
                                emailVerified: new Date(),
                                emailPreferences: { emailUpdates: true },
                                createdVia: provider === 'yandex' ? 'ya' : (provider as any),
                            },
                        });

                        await tx.oAuthAccount.create({
                            data: {
                                userId: newUser.id,
                                provider,
                                providerUserId: account.providerAccountId,
                                accessToken: account.access_token ?? '',
                                refreshToken: account.refresh_token,
                                tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                            },
                        });

                        if (provider === 'yandex') {
                            const welcomePackage = await tx.tokenPackage.findFirst({
                                where: { packageType: 'welcome' },
                            });
                            if (!welcomePackage) {
                                throw new Error('Welcome package not found');
                            }

                            await tx.tokenPurchase.create({
                                data: {
                                    userId: newUser.id,
                                    packageId: welcomePackage.id,
                                    packageType: 'welcome',
                                    tokensAmount: 200,
                                    price: 0,
                                    currency: 'RUB',
                                    status: PurchaseStatus.completed,
                                    paymentProvider: '',
                                    paymentId: 'welcome',
                                    sessionId: 'welcome',
                                    purchasedAt: new Date(),
                                    completedAt: new Date(),
                                    metadata: {
                                        welcomePackage: true,
                                    },
                                },
                            });
                            await tx.userTokens.create({
                                data: {
                                    userId: newUser.id,
                                    balance: 200,
                                    totalUsed: 0,
                                },
                            });
                        }

                        return newUser;
                    });

                    user.id = result.id;
                    user.role = result.role;
                    user.name = result.name;
                    (user as any).emailVerified = true;
                    return true;
                } catch (error) {
                    logger.error('[SIGNIN_CALLBACK] OAuth signIn error:', error);

                    // Handle specific error types
                    if (error instanceof Error) {
                        if (error.message === 'EmailRegistered') {
                            return `/login?error=EmailRegistered`;
                        }
                        if (error.message.includes('invalid_grant') || error.message.includes('Code has expired')) {
                            return `/login?error=CodeExpired`;
                        }
                        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
                            logger.warn(`[SIGNIN_CALLBACK] Duplicate user creation attempt for ${user.email}`);
                            // Try to find the existing user and link the OAuth account
                            try {
                                const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
                                if (existingUser) {
                                    await prisma.oAuthAccount.upsert({
                                        where: {
                                            provider_providerUserId: {
                                                provider: account.provider,
                                                providerUserId: account.providerAccountId,
                                            },
                                        },
                                        create: {
                                            userId: existingUser.id,
                                            provider: account.provider,
                                            providerUserId: account.providerAccountId,
                                            accessToken: account.access_token ?? '',
                                            refreshToken: account.refresh_token,
                                            tokenExpiresAt: account.expires_at
                                                ? new Date(account.expires_at * 1000)
                                                : null,
                                        },
                                        update: {
                                            accessToken: account.access_token ?? '',
                                            refreshToken: account.refresh_token,
                                            tokenExpiresAt: account.expires_at
                                                ? new Date(account.expires_at * 1000)
                                                : null,
                                        },
                                    });
                                    user.id = existingUser.id;
                                    user.role = existingUser.role;
                                    user.name = existingUser.name;
                                    (user as any).emailVerified = Boolean(
                                        existingUser.emailVerified || existingUser.isVerified
                                    );
                                    return true;
                                }
                            } catch (retryError) {
                                logger.error('[SIGNIN_CALLBACK] Error during retry:', retryError);
                            }
                        }
                    }

                    return `/login?error=OAuthCallback`;
                } finally {
                    // Clean up the ongoing request
                    ongoingRequests.delete(requestKey);
                }
            })();

            // Store the promise and return its result
            ongoingRequests.set(requestKey, requestPromise);
            return await requestPromise;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.name = user.name;
                token.emailVerified = (user as any).emailVerified ?? false;
            }

            // Update the name in the token when session is updated
            if (trigger === 'update' && session?.user?.name) {
                token.name = session.user.name;
            }

            // Refresh email verification status from database on each token refresh
            if (token.id && !token.emailVerified) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: { isVerified: true, emailVerified: true },
                    });
                    if (dbUser) {
                        token.emailVerified = Boolean(dbUser.emailVerified || dbUser.isVerified);
                    }
                } catch (error) {
                    logger.error('[JWT_CALLBACK] Error refreshing email verification status:', error);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.name = token.name as string;
                session.user.emailVerified = Boolean(token.emailVerified);
            }

            return session;
        },
    },
    debug: true,
    logger: {
        error(code, metadata) {
            logger.error(`[NEXTAUTH_ERROR] ${code}:`, metadata);
        },
        warn(code) {
            logger.warn(`[NEXTAUTH_WARN] ${code}`);
        },
    },
    events: {
        async signIn(message) {
            logger.info('[NEXTAUTH_EVENT] signIn event:', {
                user: message.user?.email || 'no-email',
                account: message.account?.provider || 'no-provider',
                profile: message.profile ? 'has-profile' : 'no-profile',
                isNewUser: message.isNewUser,
            });
        },
        async session(message) {
            logger.info('[NEXTAUTH_EVENT] session event:', {
                hasSession: !!message.session,
                hasToken: !!message.token,
            });
        },
    },
};

const handler = NextAuth(authOptions);

// Log NextAuth configuration on startup
// logger.info('[NEXTAUTH_CONFIG] NextAuth configuration loaded:', {
//     providersCount: authOptions.providers.length,
//     providerNames: authOptions.providers.map(p => p.id || p.name || 'unknown'),
//     sessionStrategy: authOptions.session?.strategy || 'default',
//     debug: authOptions.debug,
//     hasSignInPage: !!authOptions.pages?.signIn,
//     hasErrorPage: !!authOptions.pages?.error,
// });

// // Log each provider configuration
// authOptions.providers.forEach((provider, index) => {
//     logger.info(`[NEXTAUTH_CONFIG] Provider ${index + 1}:`, {
//         id: provider.id,
//         name: provider.name,
//         type: provider.type,
//         hasAuthorize: !!(provider as any).authorize,
//     });
// });

// Wrap the handler to add request logging
const wrappedHandler = async (req: Request, context: any) => {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // Log all auth requests with detailed information
    logger.info(`[AUTH_REQUEST] ${req.method} ${pathname}`, {
        method: req.method,
        pathname,
        searchParams: Object.fromEntries(searchParams.entries()),
        headers: {
            'user-agent': req.headers.get('user-agent'),
            'content-type': req.headers.get('content-type'),
            referer: req.headers.get('referer'),
            'x-forwarded-for': req.headers.get('x-forwarded-for'),
        },
        timestamp: new Date().toISOString(),
    });

    // Track callback requests specifically
    if (pathname.includes('/callback/')) {
        const provider = pathname.split('/callback/')[1];
        const state = searchParams.get('state');

        const callbackKey = `${provider}-${state || 'no-state'}`;
        const currentCount = callbackRequestCount.get(callbackKey) || 0;
        callbackRequestCount.set(callbackKey, currentCount + 1);

        logger.info(`[CALLBACK_REQUEST] OAuth callback received:`, {
            provider,
            state,
            callbackKey,
            count: currentCount + 1,
            searchParams: Object.fromEntries(searchParams.entries()),
        });

        if (currentCount > 0) {
            logger.warn(
                `[CALLBACK_REQUEST] DUPLICATE CALLBACK detected for ${callbackKey}, count: ${currentCount + 1}`
            );
        }

        // Clean up old entries (older than 5 minutes)
        setTimeout(
            () => {
                callbackRequestCount.delete(callbackKey);
            },
            5 * 60 * 1000
        );
    }

    // Log credentials signin attempts
    if (pathname.includes('/signin') && req.method === 'POST') {
        try {
            // Don't log the actual request body for security, but log the attempt
            logger.info('[AUTH_REQUEST] Credentials signin attempt detected');
        } catch {
            // Ignore parsing errors
        }
    }

    // Log callback/credentials requests with more detail
    if (pathname.includes('/callback/credentials') && req.method === 'POST') {
        try {
            logger.info('[AUTH_REQUEST] Credentials callback detected');
            const contentType = req.headers.get('content-type');
            logger.info('[AUTH_REQUEST] Request details:', {
                contentType,
                hasBody: !!req.body,
                bodyType: typeof req.body,
            });

            // Try to read and log form data (safely)
            if (contentType?.includes('application/x-www-form-urlencoded')) {
                try {
                    // Clone the request to read body without consuming it
                    const clonedReq = req.clone();
                    const formData = await clonedReq.formData();
                    const formEntries = Object.fromEntries(formData.entries());

                    // Log form data without sensitive information
                    logger.info('[AUTH_REQUEST] Form data received:', {
                        hasEmail: !!formEntries.email,
                        hasPassword: !!formEntries.password,
                        hasCsrfToken: !!formEntries.csrfToken,
                        hasCallbackUrl: !!formEntries.callbackUrl,
                        email: formEntries.email || 'not-provided',
                        passwordLength: formEntries.password ? String(formEntries.password).length : 0,
                        csrfTokenLength: formEntries.csrfToken ? String(formEntries.csrfToken).length : 0,
                        callbackUrl: formEntries.callbackUrl || 'not-provided',
                        allFields: Object.keys(formEntries),
                    });

                    // Check if this looks like a valid credentials request
                    const isValidCredentialsRequest = !!(
                        formEntries.email &&
                        formEntries.password &&
                        formEntries.csrfToken
                    );
                    logger.info('[AUTH_REQUEST] Credentials validation:', {
                        isValidCredentialsRequest,
                        missingFields: {
                            email: !formEntries.email,
                            password: !formEntries.password,
                            csrfToken: !formEntries.csrfToken,
                        },
                    });
                } catch (formError) {
                    logger.error('[AUTH_REQUEST] Error reading form data:', {
                        error: formError instanceof Error ? formError.message : 'Unknown error',
                    });
                }
            }
        } catch (error) {
            logger.error('[AUTH_REQUEST] Error processing credentials callback:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    try {
        const startTime = Date.now();
        const result = await handler(req, context);
        const endTime = Date.now();

        logger.info(`[AUTH_REQUEST] ${req.method} ${pathname} completed:`, {
            duration: endTime - startTime,
            status: result?.status || 'unknown',
            success: true,
        });

        return result;
    } catch (error) {
        logger.error(`[AUTH_REQUEST] ${req.method} ${pathname} failed:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            errorType: typeof error,
            errorName: error instanceof Error ? error.constructor.name : 'Unknown',
        });
        throw error;
    }
};

export { wrappedHandler as GET, wrappedHandler as POST };
