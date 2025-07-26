import { Db } from 'mongodb';

export async function up(db: Db) {
    console.log('Adding metadata field to UserSubscription collection...');
    
    // Для MongoDB мы не можем напрямую добавить поле, но можем обновить схему
    // Поле metadata будет автоматически поддерживаться MongoDB как JSON
    console.log('Metadata field will be automatically supported by MongoDB');
}

export async function down(db: Db) {
    console.log('Removing metadata field from UserSubscription collection...');
    
    // Удаляем поле metadata из всех документов
    await db.collection('UserSubscription').updateMany(
        {},
        { $unset: { metadata: "" } }
    );
} 