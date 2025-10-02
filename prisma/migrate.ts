import { MongoClient, Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
require('dotenv').config()

const MONGO_URL = process.env.DATABASE_URL!;
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function getAppliedMigrations(db: Db) {
    const col = db.collection('_migrations');
    const docs = await col.find({}).toArray();
    return docs.map(d => d.name);
}

async function applyMigration(db: Db, file: string) {
    const migration = await import(path.join(MIGRATIONS_DIR, file));
    if (typeof migration.up !== 'function') throw new Error('No up() in ' + file);
    await migration.up(db);
    await db.collection('_migrations').insertOne({ name: file, appliedAt: new Date() });
}

async function main() {
    console.log('MONGO_URL', MONGO_URL);
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    const db = client.db();

    const files = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
        .sort();
    const applied = await getAppliedMigrations(db);

    for (const file of files) {
        if (!applied.includes(file)) {
            console.log('Applying migration:', file);
            await applyMigration(db, file);
        }
    }

    await client.close();
    console.log('All migrations applied.');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
