// src/pages/api/friends/received-invites.js
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";
import { getSession } from "next-auth/react";

export default async function handler(req, res) {
    await connectToMongoose();

    const session = await getSession({ req });

    if (!session) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { email } = session.user;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ receivedInvites: user.receivedInvites });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}