// src/pages/api/friends.js
import { connectToMongoose } from "@/lib/db";
import User from "@/models/User";

export default async function handler(req, res) {
    await connectToMongoose();

    const { method } = req;

    switch (method) {
        case 'POST':
            // Handle sending friend invite
            const { senderEmail, receiverEmail } = req.body;

            try {
                const sender = await User.findOne({ email: senderEmail });
                const receiver = await User.findOne({ email: receiverEmail });

                if (!sender || !receiver) {
                    return res.status(404).json({ message: 'User not found' });
                }

                // Add to sentInvites and receivedInvites
                sender.sentInvites.push({ email: receiverEmail });
                receiver.receivedInvites.push({ email: senderEmail });

                await sender.save();
                await receiver.save();

                return res.status(200).json({ message: 'Invite sent successfully' });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: 'Internal server error' });
            }

        case 'GET':
            // Handle searching for users
            const { email } = req.query;

            try {
                const user = await User.findOne({ email });

                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                return res.status(200).json({ user });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: 'Internal server error' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
    }
}