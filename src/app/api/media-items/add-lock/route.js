import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            media_item_id,
            key_parent,
            key_parent_text,
            key_parent_id,
            goal_time,
            goal_pages,
            goal_episodes
        } = body;

        // Validate mutual exclusivity
        if (key_parent_id && key_parent_text) {
            throw new Error('Cannot have both key_parent_id and key_parent_text');
        }
        if (!key_parent_id && !key_parent_text) {
            throw new Error('Must provide either key_parent_id or key_parent_text');
        }

        // Determine lock type
        let lock_type;
        if (key_parent_id) {
            lock_type = 'specific';
        } else if (['movie', 'book', 'tv', 'game'].includes(key_parent_text.toLowerCase())) {
            lock_type = 'media_type';
        } else {
            lock_type = 'category';
        }

        const { data, error } = await supabase
            .from('locked_items')
            .insert({
                id: media_item_id,
                key_parent_text: key_parent_id ? null : key_parent_text,
                key_parent_id: key_parent_id || null,
                lock_type,
                goal_time: goal_time || null,
                goal_pages: goal_pages || null,
                goal_episodes: goal_episodes || null,
                completed_time: 0,
                pages_completed: 0,
                completed: false,
                episodes_completed: 0,
                user_id: session.user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error) {
        console.error('Error adding lock:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 