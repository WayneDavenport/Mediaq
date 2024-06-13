// pages/api/updateItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { id, title, duration, category, mediaType, description, additionalFields, percentComplete, completedDuration, complete, locked, keyParent, goalDuration } = req.body;

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

            mediaItem.title = title;
            mediaItem.duration = duration;
            mediaItem.category = category;
            mediaItem.mediaType = mediaType;
            mediaItem.description = description;
            mediaItem.additionalFields = additionalFields;
            mediaItem.percentComplete = percentComplete;
            mediaItem.completedDuration = completedDuration;
            mediaItem.complete = complete;
            mediaItem.locked = locked; // Add locked field
            mediaItem.keyParent = keyParent; // Add keyParent field
            mediaItem.goalDuration = goalDuration; // Add goalDuration field

            // Calculate the total completed duration for the key parent
            let totalCompletedDuration = 0;
            if (keyParent) {
                const filter = { userId: req.user.id, [keyParent]: req.body[keyParent] };
                const items = await MediaItem.find(filter);
                totalCompletedDuration = items.reduce((acc, item) => acc + (item.complete ? item.duration : item.completedDuration), 0);
            }

            // Ensure goalDuration is a valid number
            const validGoalDuration = isNaN(goalDuration) ? 0 : goalDuration;
            mediaItem.goalCompletionTime = totalCompletedDuration + validGoalDuration; // Calculate goalCompletionTime

            console.log(`Total Completed Duration: ${totalCompletedDuration}`);
            console.log(`Goal Duration: ${validGoalDuration}`);
            console.log(`Goal Completion Time: ${mediaItem.goalCompletionTime}`);

            mediaItem.updatedAt = new Date();

            console.log("Updating item in database...");
            const result = await mediaItem.save();
            console.log("Item updated:", result);

            // Calculate the total completed duration for the key parent
            const filter = {
                userId: req.user.id,
                locked: true,
                $or: [
                    { keyParent: mediaType },
                    { keyParent: category },
                    { keyParent: title } // Include media items by their title
                ]
            };
            console.log(`Filter: ${JSON.stringify(filter)}`);
            const lockedItems = await MediaItem.find(filter);
            console.log(`Locked items found: ${lockedItems.length}`);

            for (const lockedItem of lockedItems) {
                const keyParentFilter = {
                    userId: req.user.id,
                    $or: [
                        { mediaType: lockedItem.keyParent },
                        { category: lockedItem.keyParent },
                        { title: lockedItem.keyParent } // Include media items by their title
                    ]
                };
                const items = await MediaItem.find(keyParentFilter);
                const totalCompletedDuration = items.reduce((acc, item) => acc + (item.complete ? item.duration : item.completedDuration), 0);

                console.log(`Total Completed Duration for ${lockedItem.keyParent}: ${totalCompletedDuration}`);
                console.log(`Goal Completion Time for ${lockedItem.keyParent}: ${lockedItem.goalCompletionTime}`);

                // Check if the total completed duration is greater than or equal to the goal completion time
                if (totalCompletedDuration >= lockedItem.goalCompletionTime) {
                    lockedItem.locked = false;
                    console.log(`Unlocking item ${lockedItem._id} as total completed duration meets or exceeds goal completion time.`);
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