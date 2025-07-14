import { NextApiResponse } from 'next';
import logger from '@/utils/logger';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const withLogging = (handler: (req: NextRequest, res: NextApiResponse) => Promise<any>) => {
    return async (request: NextRequest, res: NextApiResponse) => {
        const timestamp = new Date().toISOString();
        const requestId = uuidv4();
        const method = request.method;

        const path = request.nextUrl.pathname;
        const address = path + request.nextUrl.search;
        const token = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
        });
        const userId = token?.id as string | undefined;
        let response: any;

        try {
            logger.info(
                JSON.stringify({
                    type: 'request',
                    timestamp,
                    address,
                    userId,
                    body: request.body,
                    requestId,
                    method,
                })
            );
            response = await handler(request, res);
            logger.info(
                JSON.stringify({
                    type: 'response',
                    timestamp,
                    address,
                    userId: userId ?? null,
                    status: response.status,
                    requestId,
                    method,
                })
            );

            return response;
        } catch (error) {
            logger.error(
                JSON.stringify({
                    type: 'error',
                    timestamp,
                    address,
                    userId: userId ?? null,
                    status: res.status,
                    requestId,
                    method,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                })
            );

            throw error;
        }
    };
};
