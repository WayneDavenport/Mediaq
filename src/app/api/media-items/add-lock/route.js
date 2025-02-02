import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const {
            media_item_id,
            key_parent,
            goal_time,
            goal_pages,
            goal_episodes
        } = await request.json();

        // Convert key_parent to id or text
        const numericValue = parseInt(key_parent);
        const isCategory = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'].includes(key_parent);
        const mediaTypes = ['Movie', 'Book', 'Show', 'Game'];

        let keyParentText = null;
        let keyParentId = null;

        if (!isNaN(numericValue)) {
            keyParentId = numericValue;
        } else if (mediaTypes.includes(key_parent)) {
            keyParentText = key_parent.toLowerCase();
        } else {
            keyParentText = key_parent;
        }

        const { error } = await supabase
            .from('locked_items')
            .insert({
                id: media_item_id,
                user_id: session.user.id,
                key_parent_id: keyParentId,
                key_parent_text: keyParentText,
                goal_time,
                goal_pages,
                goal_episodes,
                completed_time: 0,
                pages_completed: 0,
                episodes_completed: 0
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding lock:', error);
        return NextResponse.json(
            { error: 'Failed to add lock' },
            { status: 500 }
        );
    }
} 