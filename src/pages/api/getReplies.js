// src/pages/api/getReplies.js
import supabase from '@/lib/supabaseClient';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { commentId } = req.query;

    try {
        const { data, error } = await supabase
            .from('replies')
            .select('*')
            .eq('comment_id', commentId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Failed to fetch replies:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Failed to fetch replies:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}