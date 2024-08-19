// src/pages/api/updateItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import LockedItem from '@/models/LockedItem';
import ClearedItem from '@/models/ClearedItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { id, title, duration, category, mediaType, description, additionalFields, percentComplete, completedDuration, complete, queueNumber, durationDiff, percentCompleteDiff, pagesCompleteDiff, episodesCompleteDiff } = req.body;

        if (!id || !title || !duration || !category || !mediaType) {
            return res.status(422).json({
                message: 'Invalid input - id, title, duration, category, and mediaType are required.',
            });
        }

        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            const mediaItem = await MediaItem.findById(id);

            if (!mediaItem) {
                return res.status(404).json({ message: 'Media item not found' });
            }

            // Update media item
            mediaItem.title = title;
            mediaItem.duration = duration;
            mediaItem.category = category;
            mediaItem.mediaType = mediaType;
            mediaItem.description = description;
            mediaItem.additionalFields = additionalFields;
            mediaItem.percentComplete = percentComplete;
            mediaItem.completedDuration = completedDuration;
            mediaItem.complete = complete;
            mediaItem.queueNumber = queueNumber;
            mediaItem.updatedAt = new Date();

            console.log("Updating item in database...");
            const result = await mediaItem.save();
            console.log("Item updated:", result);

            // Update locked items
            const lockedItems = await LockedItem.find({
                $or: [
                    { keyParent: id },
                    { keyParent: mediaType },
                    { keyParent: category }
                ]
            });

            for (const lockedItem of lockedItems) {
                lockedItem.timeComplete += durationDiff;
                lockedItem.pagesComplete += pagesCompleteDiff;
                lockedItem.episodesComplete += episodesCompleteDiff;
                lockedItem.percentComplete = (lockedItem.timeComplete / lockedItem.goalTime) * 100;

                if (lockedItem.percentComplete >= 100) {
                    // Convert to ClearedItem
                    const clearedItem = new ClearedItem({
                        lockedItem: lockedItem.lockedItem,
                        lockedItemName: lockedItem.lockedItemName,
                        keyParent: lockedItem.keyParent,
                        goalTime: lockedItem.goalTime,
                        goalPages: lockedItem.goalPages,
                        goalEpisodes: lockedItem.goalEpisodes,
                        timeComplete: lockedItem.timeComplete,
                        percentComplete: lockedItem.percentComplete,
                        pagesComplete: lockedItem.pagesComplete,
                        episodesComplete: lockedItem.episodesComplete
                    });
                    await clearedItem.save();
                    await LockedItem.findByIdAndDelete(lockedItem._id);
                } else {
                    await lockedItem.save();
                }
            }

            res.status(200).json({ message: 'Updated item!', item: result });
        } catch (error) {
            console.error("Failed to update item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}