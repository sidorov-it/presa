/**
 * MongoDB helpers for working without transactions
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { parseJsonField } from '@/utils/json';
import logger from '@/utils/logger';

/**
 * Creates a presentation without using Prisma's transaction system
 * Use this as a workaround for MongoDB standalone instances
 */
export async function createPresentationWithoutTransaction(data: any) {
    try {
        const presentationData = {
            ...data,
            slides: data.slides ?? [],
        };

        // Use direct MongoDB driver to create the document
        // This bypasses Prisma's transaction system
        const db = (prisma as any)._engine.client.db();
        const result = await db.collection('Presentation').insertOne({
            ...presentationData,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            _id: presentationData.id || new Prisma.ObjectId().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Read the document back to return it
        const presentation = await db.collection('Presentation').findOne({
            _id: result.insertedId,
        });

        // Format for return (parse slides JSON)
        return {
            ...presentation,
            id: presentation._id,
            slides: parseJsonField(presentation.slides),
        };
    } catch (error) {
        logger.error(`Error creating presentation without transaction: ${String(error)}`);
        throw error;
    }
}

/**
 * Updates a presentation without using Prisma's transaction system
 */
export async function updatePresentationWithoutTransaction(id: string, data: any) {
    try {
        const updateData = {
            ...data,
            slides: data.slides ?? undefined,
            updatedAt: new Date(),
        };

        // Use direct MongoDB driver to update the document
        const db = (prisma as any)._engine.client.db();
        await db.collection('Presentation').updateOne({ _id: id }, { $set: updateData });

        // Read the document back to return it
        const presentation = await db.collection('Presentation').findOne({ _id: id });

        // Format for return (parse slides JSON)
        return {
            ...presentation,
            id: presentation._id,
            slides: parseJsonField(presentation.slides),
        };
    } catch (error) {
        logger.error(`Error updating presentation without transaction: ${String(error)}`);
        throw error;
    }
}
