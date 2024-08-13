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

            const { id } = req.query;
            if (!id) {
                return res.status(400).json({ message: 'ID is required' });
            }

            const mediaItem = await MediaItem.findById(id);
            if (!mediaItem) {
                return res.status(404).json({ message: 'Media item not found' });
            }

            res.status(200).json(mediaItem);
        } catch (error) {
            console.error("Failed to fetch media item:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}