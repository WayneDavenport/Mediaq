import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        try {
            await connectToMongoose();

            const { mediaItemId, text } = req.body;
            const userId = req.user.id;

            const mediaItem = await MediaItem.findById(mediaItemId);
            if (!mediaItem) {
                return res.status(404).json({ message: 'Media item not found' });
            }

            const comment = {
                userId,
                text,
                replies: []
            };

            mediaItem.comments.push(comment);
            await mediaItem.save();

            res.status(200).json(mediaItem);
        } catch (error) {
            console.error("Failed to add comment:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}