// pages/api/staging.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { id, title, duration, category, mediaType, description, additionalFields, percentComplete, completedDuration, complete, locked, keyParent, goalDuration } = req.body;

        if (!title || !duration || !category || !mediaType) {
            return res.status(422).json({
                message: 'Invalid input - title, duration, category, and mediaType are required.',
            });
        }

        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            let mediaItem;
            if (req.method === 'PUT') {
                mediaItem = await MediaItem.findById(id);
                if (!mediaItem) {
                    return res.status(404).json({ message: 'Media item not found' });
                }
            } else {
                mediaItem = new MediaItem({
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
                    goalDuration,
                    userEmail: req.user.email,
                    userId: req.user.id,
                });
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
            mediaItem.locked = locked;
            mediaItem.keyParent = keyParent;
            mediaItem.goalDuration = goalDuration;

            // Calculate the goalCompletionTime and keyParentProgress
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

            mediaItem.goalCompletionTime = goalCompletionTime;

            // Calculate the progress percentage
            if (goalCompletionTime > 0) {
                keyParentProgress = (mediaItem.completedDuration / goalCompletionTime) * 100;
            }
            mediaItem.keyParentProgress = keyParentProgress;

            console.log(`Goal Completion Time: ${mediaItem.goalCompletionTime}`);
            console.log(`Key Parent Progress: ${mediaItem.keyParentProgress}`);

            mediaItem.updatedAt = new Date();

            console.log("Saving item to database...");
            const result = await mediaItem.save();
            console.log("Item saved:", result);

            res.status(200).json({ message: 'Item saved!', item: result });
        } catch (error) {
            console.error("Failed to save item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}