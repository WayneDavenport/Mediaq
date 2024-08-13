// src/pages/api/friends/received-invites.js
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from '@/middleware/auth';


export default async function handler(req, res) {


    await requireAuth(req, res, async () => {
        try {
            console.log("Connecting to Mongoose...");
            await connectToMongoose();
            console.log("Connected to Mongoose");

            const { email } = req.user;

            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            return res.status(200).json({ receivedInvites: user.receivedInvites });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    });
}