import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function DELETE(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        const { error } = await supabase
            .from('media_items')
            .delete()
            .eq('id', id)
            .eq('user_email', session.user.email);  // Ensure user can only delete their own items

        if (error) throw error;

        return NextResponse.json({ message: 'Item deleted successfully' });

    } catch (error) {
        console.error('Error deleting item:', error);
        return NextResponse.json(
            { error: 'Failed to delete item' },
            { status: 500 }
        );
    }
}

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = params;
        const { data, error } = await supabase
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
            .eq('id', id)
            .eq('user_id', session.user.id) // Ensure user can only fetch their own items
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // PGRST116: "The result contains 0 rows"
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            throw error;
        }
        if (!data) { // Should be caught by PGRST116, but as a fallback
            return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }

        // Normalize locked_items to always be an array
        const transformedItem = {
            ...data,
            locked_items: data.locked_items ? (Array.isArray(data.locked_items) ? data.locked_items : [data.locked_items]) : [],
            // Ensure user_media_progress is an object, not an array (since it's a one-to-one via fkey)
            user_media_progress: Array.isArray(data.user_media_progress) ? data.user_media_progress[0] : data.user_media_progress,
            // Ensure type-specific data is an object, not an array
            books: Array.isArray(data.books) ? data.books[0] : data.books,
            movies: Array.isArray(data.movies) ? data.movies[0] : data.movies,
            tv_shows: Array.isArray(data.tv_shows) ? data.tv_shows[0] : data.tv_shows,
            games: Array.isArray(data.games) ? data.games[0] : data.games,
            tasks: Array.isArray(data.tasks) ? data.tasks[0] : data.tasks,
        };

        return NextResponse.json(transformedItem);
    } catch (error) {
        console.error('Error fetching item:', error);
        return NextResponse.json(
            { error: 'Failed to fetch item', details: error.message },
            { status: 500 }
        );
    }
} 