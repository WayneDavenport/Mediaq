// src/pages/api/createLockedItem.js
import { connectToMongoose } from '@/lib/db';
import LockedItem from '@/models/LockedItem';

export default async function handler(req, res) {
    await connectToMongoose();

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { lockedItem, keyParent, goalTime, goalPages, goalEpisodes, timeComplete, percentComplete, pagesComplete, episodesComplete } = req.body;

        const newLockedItem = new LockedItem({
            lockedItem,
            keyParent,
            goalTime,
            goalPages,
            goalEpisodes,
            timeComplete,
            percentComplete,
            pagesComplete,
            episodesComplete
        });

        await newLockedItem.save();

        res.status(201).json({ message: 'LockedItem created successfully', lockedItem: newLockedItem });
    } catch (error) {
        console.error("Failed to create LockedItem:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}