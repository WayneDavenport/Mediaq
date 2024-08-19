// src/pages/api/addReply.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { requireAuth } from '@/middleware/auth';
import { publish } from '@/lib/pubsub'; // Import the publish function

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        try {
            await connectToMongoose();

            const { mediaItemId, commentId, text } = req.body;
            const userId = req.user.id;

            const mediaItem = await MediaItem.findById(mediaItemId);
            if (!mediaItem) {
                return res.status(404).json({ message: 'Media item not found' });
            }

            const comment = mediaItem.comments.id(commentId);
            if (!comment) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            const reply = {
                userId,
                text
            };

            comment.replies.push(reply);
            await mediaItem.save();

            // Publish event to notify SSE endpoint
            publish('commentsUpdated');

            res.status(200).json(mediaItem);
        } catch (error) {
            console.error("Failed to add reply:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}