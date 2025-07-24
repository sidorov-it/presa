import { Db } from 'mongodb';

export async function up(db: Db) {
    await db.createCollection('OAuthAccount');
    await db.collection('User').updateMany({}, { $set: { createdVia: 'email' } });
}

export async function down(db: Db) {
    await db.collection('OAuthAccount').drop();
    await db.collection('User').updateMany({}, { $unset: { createdVia: '' } });
}
