// src/pages/api/getComments.js
import supabase from '@/lib/supabaseClient';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { mediaItemId } = req.query;

    try {
        const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('media_item_id', mediaItemId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Failed to fetch comments:", error);
            return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error("Failed to fetch comments:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
}