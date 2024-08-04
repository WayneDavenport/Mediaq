// src/pages/api/newItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { title, duration, category, mediaType, description, additionalFields, percentComplete, completedDuration, complete, locked, keyParent, goalDuration } = req.body;

        if (!title || !duration || !category || !mediaType) {
            return res.status(422).json({
                message: 'Invalid input - title, duration, category, and mediaType are required.',
            });
        }

        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            // Calculate the goalCompletionTime
            let goalCompletionTime = 0;
            let keyParentProgress = 0;

            if (keyParent) {
                const selectedItem = await MediaItem.findOne({ title: keyParent });
                if (selectedItem) {
                    // If keyParent is a media item, set goalCompletionTime directly from user input
                    goalCompletionTime = goalDuration;
                } else {
                    // Calculate the total completed duration for the key parent
                    const filter = { userId: req.user.id, [keyParent]: req.body[keyParent] };
                    const items = await MediaItem.find(filter);
                    const totalCompletedDuration = items.reduce((acc, item) => acc + (item.complete ? item.duration : item.completedDuration), 0);
                    goalCompletionTime = totalCompletedDuration + goalDuration;
                }
            }

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
                locked,
                keyParent,
                goalCompletionTime,
                keyParentProgress,
                userEmail: req.user.email,
                userId: req.user.id,
                queueNumber: nextQueueNumber // Assign the next queue number
            });

            console.log("Saving new item to database...");
            const result = await newItem.save();
            console.log("New item saved:", result);

            res.status(201).json({ message: 'Created new item!', item: result });
        } catch (error) {
            console.error("Failed to create new item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}