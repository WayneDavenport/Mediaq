// src/pages/api/updateItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { id, title, duration, category, mediaType, description, additionalFields, percentComplete, completedDuration, complete, queueNumber } = req.body;

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

            // If the queue number has changed, update the queue numbers of other items
            if (mediaItem.queueNumber !== queueNumber) {
                const itemsToUpdate = await MediaItem.find({
                    userId: req.user.id,
                    queueNumber: { $gte: Math.min(mediaItem.queueNumber, queueNumber), $lte: Math.max(mediaItem.queueNumber, queueNumber) }
                });

                for (const item of itemsToUpdate) {
                    if (item._id.toString() === id) {
                        item.queueNumber = queueNumber;
                    } else if (mediaItem.queueNumber < queueNumber) {
                        item.queueNumber -= 1;
                    } else {
                        item.queueNumber += 1;
                    }
                    await item.save();
                }
            }

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

            res.status(200).json({ message: 'Updated item!', item: result });
        } catch (error) {
            console.error("Failed to update item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}