// src/pages/api/addComment.js
import supabase from '@/lib/supabaseClient';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        try {
            const { mediaItemId, text } = req.body;
            const userId = req.user.id; // Assuming req.user.id is the MongoDB ObjectId of the user

            // Insert the new comment into Supabase
            const { data, error } = await supabase
                .from('comments')
                .insert([{ media_item_id: mediaItemId, text, user_id: userId }])
                .single();

            if (error) {
                console.error("Failed to add comment:", error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            res.status(200).json(data);
        } catch (error) {
            console.error("Failed to add comment:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}