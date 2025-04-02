/**
 * MongoDB helpers for working without transactions
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { stringifyJsonField, parseJsonField } from '@/utils/json';

/**
 * Creates a presentation without using Prisma's transaction system
 * Use this as a workaround for MongoDB standalone instances
 */
export async function createPresentationWithoutTransaction(data: any) {
  try {
    // Ensure slides is properly stringified
    const presentationData = {
      ...data,
      slides: data.slides ? stringifyJsonField(data.slides) : '[]'
    };
    
    // Use direct MongoDB driver to create the document
    // This bypasses Prisma's transaction system
    const db = (prisma as any)._engine.client.db();
    const result = await db.collection('Presentation').insertOne({
      ...presentationData,
      _id: presentationData.id || new Prisma.ObjectId().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Read the document back to return it
    const presentation = await db.collection('Presentation').findOne({ 
      _id: result.insertedId 
    });
    
    // Format for return (parse slides JSON)
    return {
      ...presentation,
      id: presentation._id,
      slides: parseJsonField(presentation.slides)
    };
  } catch (error) {
    console.error('Error creating presentation without transaction:', error);
    throw error;
  }
}

/**
 * Updates a presentation without using Prisma's transaction system
 */
export async function updatePresentationWithoutTransaction(id: string, data: any) {
  try {
    // Ensure slides is properly stringified
    const updateData = {
      ...data,
      slides: data.slides ? stringifyJsonField(data.slides) : undefined,
      updatedAt: new Date()
    };
    
    // Use direct MongoDB driver to update the document
    const db = (prisma as any)._engine.client.db();
    await db.collection('Presentation').updateOne(
      { _id: id },
      { $set: updateData }
    );
    
    // Read the document back to return it
    const presentation = await db.collection('Presentation').findOne({ _id: id });
    
    // Format for return (parse slides JSON)
    return {
      ...presentation,
      id: presentation._id,
      slides: parseJsonField(presentation.slides)
    };
  } catch (error) {
    console.error('Error updating presentation without transaction:', error);
    throw error;
  }
} 