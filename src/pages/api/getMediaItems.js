// src/pages/api/getMediaItems.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            const mediaItems = await MediaItem.find({ userId: req.user.id });
            res.status(200).json({ mediaItems });
        } catch (error) {
            console.error("Failed to fetch media items:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}