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
            goal_episodes,
            goal_units
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
                goal_units: goal_units || null,
                completed_time: 0,
                pages_completed: 0,
                completed: false,
                episodes_completed: 0,
                user_id: session.user.id
            })
            .select()
            .single();

        if (error) throw error;

        // Instead of returning just the lock, fetch and return the parent media item
        // with all its details, including the newly added lock.
        const { data: updatedParentItem, error: fetchError } = await supabase
            .from('media_items')
            .select(`
                *,
                locked_items!locked_items_id_fkey(*),
                user_media_progress!user_media_progress_id_fkey(*),
                books(*),
                movies(*),
                tv_shows(*),
                games(*),
                tasks(*)
            `)
            .eq('id', media_item_id) // The ID of the item to which the lock was added
            .eq('user_id', session.user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching parent item after adding lock:', fetchError);
            // If fetching the parent fails, we might have an orphaned lock or inconsistent state.
            // For now, re-throw to indicate a problem post-lock creation.
            throw fetchError;
        }

        if (!updatedParentItem) {
            return NextResponse.json({ error: 'Parent item not found after adding lock' }, { status: 404 });
        }

        // Normalize the fetched parent item before returning
        const transformedParentItem = {
            ...updatedParentItem,
            locked_items: updatedParentItem.locked_items ? (Array.isArray(updatedParentItem.locked_items) ? updatedParentItem.locked_items : [updatedParentItem.locked_items]) : [],
            user_media_progress: Array.isArray(updatedParentItem.user_media_progress) ? updatedParentItem.user_media_progress[0] : updatedParentItem.user_media_progress,
            books: Array.isArray(updatedParentItem.books) ? updatedParentItem.books[0] : updatedParentItem.books,
            movies: Array.isArray(updatedParentItem.movies) ? updatedParentItem.movies[0] : updatedParentItem.movies,
            tv_shows: Array.isArray(updatedParentItem.tv_shows) ? updatedParentItem.tv_shows[0] : updatedParentItem.tv_shows,
            games: Array.isArray(updatedParentItem.games) ? updatedParentItem.games[0] : updatedParentItem.games,
            tasks: Array.isArray(updatedParentItem.tasks) ? updatedParentItem.tasks[0] : updatedParentItem.tasks,
        };

        return NextResponse.json({ success: true, data: transformedParentItem });

    } catch (error) {
        console.error('Error adding lock:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 