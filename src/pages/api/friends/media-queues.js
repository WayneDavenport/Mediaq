// src/pages/api/friends/media-queues.js
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";
import MediaItem from "@/models/MediaItem";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
    await connectToMongoose();

    const session = await getSession({ req });

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { email } = session.user;

    try {
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
}