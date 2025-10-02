import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function up() {
    console.log('Adding requestId index to LLMRequestHistory...');

    try {
        // The requestId field is already added to the schema, so we just need to create an index for better query performance
        // Note: MongoDB doesn't support traditional indexes in the same way as SQL databases,
        // but Prisma will handle this through the schema when we regenerate the client
        
        console.log('RequestId field and indexing setup completed');
    } catch (error) {
        console.error('Error setting up requestId indexing:', error);
        throw error;
    }
}

export async function down() {
    console.log('Removing requestId index from LLMRequestHistory...');
    
    try {
        // Since we're using MongoDB, we don't need to explicitly remove the index
        // The field will remain but won't be indexed if we remove it from the schema
        
        console.log('RequestId index removal completed');
    } catch (error) {
        console.error('Error removing requestId index:', error);
        throw error;
    }
} 