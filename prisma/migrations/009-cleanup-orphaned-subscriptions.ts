import { Db } from 'mongodb';

export async function up(db: Db) {
    console.log('Starting cleanup of orphaned subscriptions...');

    // Get all existing subscription plans
    const existingPlans = await db.collection('SubscriptionPlan').find({}).toArray();
    const validPlanIds = existingPlans.map(plan => plan._id.toString());

    console.log(`Found ${validPlanIds.length} valid subscription plans:`, validPlanIds);

    // Find all user subscriptions
    const allSubscriptions = await db.collection('UserSubscription').find({}).toArray();
    console.log(`Found ${allSubscriptions.length} user subscriptions`);

    // Identify orphaned subscriptions (subscriptions with invalid subscriptionPlanId)
    const orphanedSubscriptions = allSubscriptions.filter(sub => !validPlanIds.includes(sub.subscriptionPlanId));

    console.log(`Found ${orphanedSubscriptions.length} orphaned subscriptions`);

    if (orphanedSubscriptions.length > 0) {
        console.log('Orphaned subscription details:');
        orphanedSubscriptions.forEach(sub => {
            console.log(
                `- ID: ${sub._id}, Plan ID: ${sub.subscriptionPlanId}, Status: ${sub.status}, User: ${sub.userId}`
            );
        });

        // Delete orphaned subscriptions
        const orphanedIds = orphanedSubscriptions.map(sub => sub._id);
        const deleteResult = await db.collection('UserSubscription').deleteMany({
            _id: { $in: orphanedIds },
        });

        console.log(`Deleted ${deleteResult.deletedCount} orphaned subscriptions`);

        // Also delete related subscription payments
        const deletePaymentsResult = await db.collection('SubscriptionPayment').deleteMany({
            userSubscriptionId: { $in: orphanedIds },
        });

        console.log(`Deleted ${deletePaymentsResult.deletedCount} related subscription payments`);
    } else {
        console.log('No orphaned subscriptions found');
    }

    // Verify cleanup
    const remainingSubscriptions = await db.collection('UserSubscription').find({}).toArray();
    const remainingOrphaned = remainingSubscriptions.filter(sub => !validPlanIds.includes(sub.subscriptionPlanId));

    if (remainingOrphaned.length > 0) {
        throw new Error(`Cleanup failed: ${remainingOrphaned.length} orphaned subscriptions still exist`);
    }

    console.log('✅ Cleanup completed successfully');
    console.log(`Remaining subscriptions: ${remainingSubscriptions.length}`);
}

export async function down() {
    console.log('⚠️  Cannot rollback orphaned subscription cleanup - data has been permanently deleted');
    console.log('If you need to restore data, please restore from backup');
}
