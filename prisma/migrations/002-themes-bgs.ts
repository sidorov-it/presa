import { Db } from 'mongodb';
import themesMapping from './themesBgs.json';

export async function up(db: Db) {
    const themesCollection = db.collection('Theme');
    const themes = await themesCollection.find({}).toArray();

    for (const theme of themes) {
        const themeBgMapping = themesMapping.find(mapping => mapping.themeName === theme.name);
        if (themeBgMapping) {
            await themesCollection.updateOne(
                { _id: theme._id },
                { $set: { 'colors.pageBackground.imageUrl': themeBgMapping.bgUrl } }
            );
        }
    }
}
