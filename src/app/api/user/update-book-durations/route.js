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
        const { reading_speed, update_generic_locks_by = 'maintain_pages' } = await request.json();

        // First update specific book locks (key_parent_id)
        const { data: specificBookLocks, error: fetchError } = await supabase
            .from('locked_items')
            .select(`
                id,
                key_parent_id,
                pages_completed,
                goal_time,
                media_items!key_parent_id(
                    books!inner(page_count)
                )
            `)
            .not('key_parent_id', 'is', null)
            .eq('user_id', session.user.id);

        if (fetchError) throw fetchError;

        // Update goal_time for specific book locks based on remaining pages
        for (const lock of specificBookLocks) {
            const totalPages = lock.media_items.books.page_count;
            const remainingPages = totalPages - (lock.pages_completed || 0);
            const newGoalTime = Math.round(remainingPages / reading_speed);

            const { error: updateError } = await supabase
                .from('locked_items')
                .update({ goal_time: newGoalTime })
                .eq('id', lock.id)
                .eq('user_id', session.user.id);

            if (updateError) throw updateError;
        }

        // Handle generic book locks (key_parent_text = 'book')
        const { data: genericBookLocks, error: genericFetchError } = await supabase
            .from('locked_items')
            .select('id, goal_time, goal_pages')
            .eq('key_parent_text', 'book')
            .eq('user_id', session.user.id);

        if (genericFetchError) throw genericFetchError;

        // Update generic book locks based on user preference
        for (const lock of genericBookLocks) {
            let updates = {};

            if (update_generic_locks_by === 'maintain_pages' && lock.goal_pages) {
                // Update time based on existing pages
                updates.goal_time = Math.round(lock.goal_pages / reading_speed);
            } else if (update_generic_locks_by === 'maintain_time' && lock.goal_time) {
                // Update pages based on existing time
                updates.goal_pages = Math.round(lock.goal_time * reading_speed);
            }

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('locked_items')
                    .update(updates)
                    .eq('id', lock.id)
                    .eq('user_id', session.user.id);

                if (updateError) throw updateError;
            }
        }

        return NextResponse.json({
            success: true,
            specificLocksUpdated: specificBookLocks.length,
            genericLocksUpdated: genericBookLocks.length
        });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Failed to update book durations' },
            { status: 500 }
        );
    }
} 