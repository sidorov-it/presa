import logger from '@/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get user preferences
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        logger.debug('GET /api/user/preferences - Session:', session?.user ? 'Authenticated' : 'Not authenticated');

        if (!session?.user) {
            return NextResponse.json({ message: 'Неавторизованный запрос' }, { status: 401 });
        }

        const userId = session.user.id;
        logger.debug('GET /api/user/preferences - UserId:', userId);

        // Find user
        logger.debug('GET /api/user/preferences - Looking up user with ID:', userId);
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { emailPreferences: true },
        });
        logger.debug('GET /api/user/preferences - User found:', !!user, 'Email preferences:', user?.emailPreferences);

        if (!user) {
            return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
        }

        return NextResponse.json({
            emailUpdates: user.emailPreferences?.emailUpdates,
        });
    } catch (error) {
        logger.error('Get preferences error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}

// Update user preferences
export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        logger.debug('PUT /api/user/preferences - Session:', session?.user ? 'Authenticated' : 'Not authenticated');

        if (!session?.user) {
            return NextResponse.json({ message: 'Неавторизованный запрос' }, { status: 401 });
        }

        const userId = session.user.id;
        logger.debug('PUT /api/user/preferences - UserId:', userId);

        const emailUpdates = await req.json();
        logger.debug('PUT /api/user/preferences - New preferences:', emailUpdates);

        if (!emailUpdates || typeof emailUpdates !== 'object') {
            return NextResponse.json({ message: 'Необходимо корректно указать настройки почты' }, { status: 400 });
        }

        // Update user preferences
        logger.debug('PUT /api/user/preferences - Updating user with ID:', userId);
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                emailPreferences: emailUpdates,
            },
            select: { emailPreferences: true },
        });
        logger.debug('PUT /api/user/preferences - User updated, new preferences:', updatedUser.emailPreferences);

        return NextResponse.json({
            message: 'Настройки обновлены',
            preferences: {
                emailPreferences: updatedUser.emailPreferences,
            },
        });
    } catch (error) {
        logger.error('Update preferences error:', error);
        return NextResponse.json({ message: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
