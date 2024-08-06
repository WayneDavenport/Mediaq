// src/pages/api/friends/decline.js
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";

export default async function handler(req, res) {
    await connectToMongoose();

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { senderEmail, receiverEmail } = req.body;

    try {
        const sender = await User.findOne({ email: senderEmail });
        const receiver = await User.findOne({ email: receiverEmail });

        if (!sender || !receiver) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add to declinedByMe
        receiver.declinedByMe.push({ email: senderEmail });

        // Remove from receivedInvites
        receiver.receivedInvites = receiver.receivedInvites.filter(invite => invite.email !== senderEmail);

        await receiver.save();

        return res.status(200).json({ message: 'Friend request declined' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}