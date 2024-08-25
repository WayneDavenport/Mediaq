// src/pages/api/updateLockedItem.js
import { connectToMongoose } from '@/lib/db';
import LockedItem from '@/models/LockedItem';
import { requireAuth } from '@/middleware/auth';
import { broadcastItemUpdate } from '@/lib/socketServer';

export default async function handler(req, res) {
    await connectToMongoose();

    if (req.method !== 'POST' && req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { lockedItem, lockedItemName, keyParent, goalTime, goalPages, goalEpisodes, timeComplete, percentComplete, pagesComplete, episodesComplete, cleared } = req.body;

        if (!lockedItem || !keyParent || goalTime === undefined) {
            return res.status(422).json({
                message: 'Invalid input - lockedItem, keyParent, and goalTime are required.',
            });
        }

        try {
            let existingLockedItem = await LockedItem.findOne({ lockedItem });

            if (existingLockedItem) {
                // Update existing locked item
                existingLockedItem.keyParent = keyParent;
                existingLockedItem.goalTime = goalTime;
                existingLockedItem.goalPages = goalPages;
                existingLockedItem.goalEpisodes = goalEpisodes;
                existingLockedItem.timeComplete = timeComplete;
                existingLockedItem.percentComplete = percentComplete;
                existingLockedItem.pagesComplete = pagesComplete;
                existingLockedItem.episodesComplete = episodesComplete;

                await existingLockedItem.save();
                await broadcastItemUpdate(lockedItem); // Emit WebSocket event
                return res.status(200).json({ message: 'Locked item updated!', lockedItem: existingLockedItem });
            } else {
                // Create new locked item
                const newLockedItem = new LockedItem({
                    lockedItem,
                    lockedItemName,
                    keyParent,
                    goalTime,
                    goalPages,
                    goalEpisodes,
                    timeComplete,
                    percentComplete,
                    pagesComplete,
                    episodesComplete,
                    cleared
                });

                await newLockedItem.save();
                await broadcastItemUpdate(lockedItem); // Emit WebSocket event
                return res.status(201).json({ message: 'Locked item created!', lockedItem: newLockedItem });
            }
        } catch (error) {
            console.error("Failed to update or create locked item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}