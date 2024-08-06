// src/pages/api/friends/accept.js
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

        // Move to friends list
        sender.friends.push({ email: receiverEmail });
        receiver.friends.push({ email: senderEmail });

        // Remove from sentInvites and receivedInvites
        sender.sentInvites = sender.sentInvites.filter(invite => invite.email !== receiverEmail);
        receiver.receivedInvites = receiver.receivedInvites.filter(invite => invite.email !== senderEmail);

        await sender.save();
        await receiver.save();

        return res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}