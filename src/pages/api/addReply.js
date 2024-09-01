// src/pages/api/addReply.js
import supabase from '@/lib/supabaseClient';
import { requireAuth } from '@/middleware/auth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    await requireAuth(req, res, async () => {
        try {
            const { commentId, text } = req.body;
            const userId = req.user.id; // Assuming req.user.id is the MongoDB ObjectId of the user

            // Insert the new reply into Supabase
            const { data, error } = await supabase
                .from('replies')
                .insert([{ comment_id: commentId, text, user_id: userId }])
                .single();

            if (error) {
                console.error("Failed to add reply:", error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            res.status(200).json(data);
        } catch (error) {
            console.error("Failed to add reply:", error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
}