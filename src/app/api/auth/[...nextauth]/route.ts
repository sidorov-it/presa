import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';
import logger from '@/utils/logger';

export const authOptions: NextAuthOptions = {
    providers: [
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

                const isPasswordMatch = await comparePassword(credentials.password, user.password);

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
