import { Db } from 'mongodb';

export async function up(db: Db) {
    console.log('Adding plan change tracking fields to UserSubscription collection...');
    
    // For MongoDB, we don't need to explicitly add fields as they will be automatically supported
    // The fields nextPlanId and nextPlanStartDate will be automatically available
    console.log('Plan change tracking fields will be automatically supported by MongoDB');
}

export async function down(db: Db) {
    console.log('Removing plan change tracking fields from UserSubscription collection...');
    
    // Remove the fields from all documents
    await db.collection('UserSubscription').updateMany(
        {},
        { $unset: { nextPlanId: "", nextPlanStartDate: "" } }
    );
} 