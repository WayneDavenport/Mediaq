// pages/api/deleteItem.js
import { connectToMongoose } from '@/lib/db';
import MediaItem from '@/models/MediaItem';

export default async function handler(req, res) {
    await connectToMongoose();

    if (req.method === 'DELETE') {
        const { id } = req.query;

        try {
            const deletedItem = await MediaItem.findByIdAndDelete(id);
            if (!deletedItem) {
                return res.status(404).json({ message: 'Media item not found' });
            }
            res.status(200).json({ message: 'Media item deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting media item', error });
        }
    } else {
        res.status(405).json({ message: 'Method not allowed' });
    }
}