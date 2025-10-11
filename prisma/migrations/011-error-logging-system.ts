import { Db } from 'mongodb';

export async function up(db: Db) {
    console.log('Setting up error logging system...');

    // MongoDB will create the collection automatically when first document is inserted
    // We're just creating indexes for better query performance
    const collection = db.collection('ErrorLog');

    // Create indexes for better query performance and analytics
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ type: 1 });
    await collection.createIndex({ severity: 1 });
    await collection.createIndex({ fingerprint: 1 }); // For error grouping/deduplication
    await collection.createIndex({ createdAt: -1 }); // Sort by newest first
    await collection.createIndex({ page: 1 }); // Query by page URL

    // Compound index for common queries
    await collection.createIndex({ type: 1, severity: 1, createdAt: -1 });

    console.log('Error logging system indexes created successfully');
}
