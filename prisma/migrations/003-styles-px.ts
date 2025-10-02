import { Db } from 'mongodb';

const boderRadiusMap: Record<string, string> = {
    '4px': '0.25em',
    '8px': '0.5em',
    '12px': '0.75em',
    '20px': '1.25em',
};

export async function up(db: Db) {
    const themesCollection = db.collection('Theme');
    const themes = await themesCollection.find({}).toArray();

    for (const theme of themes) {
        const newBorderRadius = boderRadiusMap[theme.design.slide.borderRadius];

        if (newBorderRadius) {
            await themesCollection.updateOne(
                { _id: theme._id },
                { $set: { 'design.slide.borderRadius': newBorderRadius } }
            );
        }
    }
}
