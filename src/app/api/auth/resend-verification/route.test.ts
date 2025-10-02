import { NextRequest } from 'next/server';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/server/email';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('@/lib/email', () => ({
    sendVerificationEmail: jest.fn(),
}));

const createRequest = (email?: string) =>
    new NextRequest('http://localhost/api/auth/resend-verification', {
        method: 'POST',
        body: email ? Buffer.from(JSON.stringify({ email })) : undefined,
        headers: email ? { 'Content-Type': 'application/json' } : undefined,
    });

describe('POST /api/auth/resend-verification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 400 without email', async () => {
        const res = await POST(createRequest());
        expect(res.status).toBe(400);
    });

    it('sends verification email', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
        const res = await POST(createRequest('test@example.com'));
        expect(res.status).toBe(200);
        expect(sendVerificationEmail).toHaveBeenCalled();
    });
});
