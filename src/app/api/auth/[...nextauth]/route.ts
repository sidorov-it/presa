import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import VKProvider from 'next-auth/providers/vk';
import MailRuProvider from 'next-auth/providers/mailru';
import YandexProvider from 'next-auth/providers/yandex';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword } from '@/lib/auth';
import logger from '@/utils/logger';

export const authOptions: NextAuthOptions = {
    providers: [
        VKProvider({
            clientId: process.env.VK_CLIENT_ID ?? '',
            clientSecret: process.env.VK_CLIENT_SECRET ?? '',
        }),
        MailRuProvider({
            clientId: process.env.MAILRU_CLIENT_ID ?? '',
            clientSecret: process.env.MAILRU_CLIENT_SECRET ?? '',
        }),
        YandexProvider({
            clientId: process.env.YANDEX_CLIENT_ID ?? '',
            clientSecret: process.env.YANDEX_CLIENT_SECRET ?? '',
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) {
                    return null;
                }

                logger.info(`Login attempt for ${credentials.email}`);

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    logger.warn(`User not found: ${credentials.email}`);
                    return null;
                }

                if (!user.passwordHash) {
                    logger.warn(`Password login not allowed for ${credentials.email}`);
                    return null;
                }

                const isPasswordMatch = await comparePassword(credentials.password, user.passwordHash);

                if (!isPasswordMatch) {
                    logger.warn(`Invalid password for ${credentials.email}`);
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    role: user.role,
                    emailVerified: Boolean(user.emailVerified || user.isVerified),
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
    callbacks: {
        async signIn({ user, account }) {
            if (!account || account.provider === 'credentials') {
                return true;
            }

            if (!user.email || !account.providerAccountId) {
                return false;
            }

            const provider = account.provider;

            try {
                let oauth = await prisma.oAuthAccount.findUnique({
                    where: { provider_providerUserId: { provider, providerUserId: account.providerAccountId } },
                    include: { user: true },
                });

                if (oauth) {
                    user.id = oauth.userId;
                    user.role = oauth.user.role;
                    user.name = oauth.user.name;
                    (user as any).emailVerified = Boolean(oauth.user.emailVerified || oauth.user.isVerified);
                    return true;
                }

                const existing = await prisma.user.findUnique({ where: { email: user.email } });

                if (existing && existing.passwordHash) {
                    await prisma.oAuthAccount.create({
                        data: {
                            userId: existing.id,
                            provider,
                            providerUserId: account.providerAccountId,
                            accessToken: account.access_token ?? '',
                            refreshToken: account.refresh_token,
                            tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                        },
                    });
                    user.id = existing.id;
                    user.role = existing.role;
                    user.name = existing.name;
                    (user as any).emailVerified = Boolean(existing.emailVerified || existing.isVerified);
                    return true;
                }

                if (existing && !existing.passwordHash) {
                    console.warn('OAuth account email already registered via another provider');
                    return false;
                }

                const newUser = await prisma.user.create({
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

                await prisma.oAuthAccount.create({
                    data: {
                        userId: newUser.id,
                        provider,
                        providerUserId: account.providerAccountId,
                        accessToken: account.access_token ?? '',
                        refreshToken: account.refresh_token,
                        tokenExpiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                    },
                });

                user.id = newUser.id;
                user.role = newUser.role;
                user.name = newUser.name;
                (user as any).emailVerified = true;
                return true;
            } catch (error) {
                console.error('OAuth signIn error:', error);
                return false;
            }
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
                        select: { isVerified: true, emailVerified: true }
                    });
                    if (dbUser) {
                        token.emailVerified = Boolean(dbUser.emailVerified || dbUser.isVerified);
                    }
                } catch (error) {
                    console.error('Error refreshing email verification status:', error);
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
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
