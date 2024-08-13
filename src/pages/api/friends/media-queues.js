// src/pages/api/friends/media-queues.js
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";
import MediaItem from "@/models/MediaItem";
import { requireAuth } from '@/middleware/auth';
/* import cors, { runMiddleware } from "@/middleware/cors"; */

export default async function handler(req, res) {
    /* await runMiddleware(req, res, cors); */ // Add this line to use the CORS middleware

    await requireAuth(req, res, async () => {
        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            const { email } = req.user;

            const user = await User.findOne({ email }).populate('friends');

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const friendsMediaQueues = await Promise.all(
                user.friends.map(async (friend) => {
                    const friendUser = await User.findOne({ email: friend.email });
                    const mediaItems = await MediaItem.find({ userId: friendUser._id });
                    return { email: friend.email, mediaItems };
                })
            );

            return res.status(200).json({ friendsMediaQueues });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
}