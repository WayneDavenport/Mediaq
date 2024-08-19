// src/pages/api/getLockedItem.js
import { connectToMongoose } from '@/lib/db';
import LockedItem from '@/models/LockedItem';

export default async function handler(req, res) {
    await connectToMongoose();

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { itemId } = req.query;

    try {
        const lockedItem = await LockedItem.findOne({ lockedItem: itemId });

        if (!lockedItem) {
            return res.status(404).json({ message: 'Locked item not found' });
        }

        res.status(200).json({ lockedItem });
    } catch (error) {
        console.error("Failed to fetch locked item:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}