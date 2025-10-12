import { Db } from 'mongodb';
import themesMapping from './themesBgsTransliterated.json';

/**
 * Migration: Update theme background image URLs to use transliterated (Latin) filenames
 * 
 * Changes paths from Cyrillic names to Latin transliteration:
 * /theme-backgrounds/звёздная-пыль.jpg -> /static/theme-backgrounds/zvyozdnaya-pyl.jpg
 */
export async function up(db: Db) {
    const themesCollection = db.collection('Theme');
    const themes = await themesCollection.find({}).toArray();

    console.log(`Found ${themes.length} themes to process`);
    let updatedCount = 0;

    for (const theme of themes) {
        const themeBgMapping = themesMapping.find(mapping => mapping.themeName === theme.name);
        if (themeBgMapping && theme.colors?.pageBackground?.imageUrl) {
            await themesCollection.updateOne(
                { _id: theme._id },
                { $set: { 'colors.pageBackground.imageUrl': themeBgMapping.newPath } }
            );
            updatedCount++;
            console.log(`✓ Updated: ${theme.name} -> ${themeBgMapping.fileName}`);
        }
    }

    console.log(`Migration completed: ${updatedCount} themes updated`);
}

/**
 * Rollback migration: Restore original URLs from mapping
 */
export async function down(db: Db) {
    const themesCollection = db.collection('Theme');
    const themes = await themesCollection.find({}).toArray();

    console.log(`Rolling back ${themes.length} themes`);
    let restoredCount = 0;

    for (const theme of themes) {
        const themeBgMapping = themesMapping.find(mapping => mapping.themeName === theme.name);
        if (themeBgMapping && theme.colors?.pageBackground?.imageUrl) {
            await themesCollection.updateOne(
                { _id: theme._id },
                { $set: { 'colors.pageBackground.imageUrl': themeBgMapping.originalUrl } }
            );
            restoredCount++;
            console.log(`✓ Restored: ${theme.name}`);
        }
    }

    console.log(`Rollback completed: ${restoredCount} themes restored`);
}
