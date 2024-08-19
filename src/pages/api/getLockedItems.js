// src/pages/api/getLockedItems.js
import { connectToMongoose } from '@/lib/db';
import LockedItem from '@/models/LockedItem';
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

            const lockedItems = await LockedItem.find({});
            res.status(200).json({ lockedItems });
        } catch (error) {
            console.error("Failed to fetch locked items:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}