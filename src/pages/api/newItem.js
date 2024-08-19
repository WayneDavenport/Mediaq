// src/pages/api/newItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import LockedItem from '@/models/LockedItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { title, duration, category, mediaType,
            description, additionalFields, percentComplete,
            completedDuration, complete, lockedItemName, locked, keyParent,
            goalTime, goalPages, goalEpisodes } = req.body;

        if (!title || !duration || !category || !mediaType) {
            return res.status(422).json({
                message: 'Invalid input - title, duration, category, and mediaType are required.',
            });
        }

        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            // Find the highest current queue number and increment it by one
            const highestQueueItem = await MediaItem.findOne({ userId: req.user.id }).sort({ queueNumber: -1 });
            const nextQueueNumber = highestQueueItem ? highestQueueItem.queueNumber + 1 : 1;

            const newItem = new MediaItem({
                title,
                duration,
                category,
                mediaType,
                description,
                additionalFields,
                percentComplete,
                completedDuration,
                complete,
                userEmail: req.user.email,
                userId: req.user.id,
                queueNumber: nextQueueNumber,
                comments: []
            });

            console.log("Saving new item to database...");
            const result = await newItem.save();
            console.log("New item saved:", result);

            if (locked) {
                const newLockedItem = new LockedItem({
                    lockedItem: result._id,
                    lockedItemName,
                    keyParent,
                    goalTime,
                    goalPages,
                    goalEpisodes,
                    timeComplete: completedDuration,
                    percentComplete,
                    pagesComplete: additionalFields.pagesCompleted || 0,
                    episodesComplete: additionalFields.episodesCompleted || 0,
                    cleared
                });

                console.log("Saving new locked item to database...");
                await newLockedItem.save();
                console.log("New locked item saved");
            }

            res.status(201).json({ message: 'Created new item!', item: result });
        } catch (error) {
            console.error("Failed to create new item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}