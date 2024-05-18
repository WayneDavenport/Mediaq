import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        const { title, duration, category, mediaType, additionalFields } = req.body;

        if (!title || !duration || !category || !mediaType) {
            return res.status(422).json({
                message: 'Invalid input - title, duration, category, and mediaType are required.',
            });
        }

        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            const mediaItem = new MediaItem({
                title,
                duration,
                category,
                mediaType,
                additionalFields,
                userEmail: req.user.email,
                userId: req.user.id,
                createdAt: new Date(),
                updatedAt: new Date(), // Use user ID from req.user set by middleware
            });

            console.log("Saving new item to database...");
            const result = await mediaItem.save();
            console.log("New item saved:", result);

            res.status(201).json({ message: 'Created new item!', item: result });
        } catch (error) {
            console.error("Failed to create new item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}