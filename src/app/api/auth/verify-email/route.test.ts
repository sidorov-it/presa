import { NextRequest } from 'next/server';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        user: {
            findFirst: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('GET /api/auth/verify-email', () => {
    it('returns 400 if token missing', async () => {
        const req = new NextRequest('http://localhost/api/auth/verify-email');
        const res = await GET(req);
        expect(res.status).toBe(400);
    });

    it('verifies valid token', async () => {
        (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '1' });
        const req = new NextRequest('http://localhost/api/auth/verify-email?token=test');
        const res = await GET(req);
        expect(prisma.user.update).toHaveBeenCalled();
        expect(res.status).toBe(200);
    });
});
