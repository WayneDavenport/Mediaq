import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Fetching completed items for user:', session.user.id);

        const { data: items, error } = await supabase
            .from('user_media_progress')
            .select(`
                media_items (
                    id,
                    title,
                    media_type,
                    poster_path,
                    description,
                    books (
                        page_count
                    ),
                    movies (
                        runtime
                    ),
                    tv_shows (
                        average_runtime
                    )
                ),
                completed_duration,
                duration,
                episodes_completed,
                pages_completed,
                completed,
                created_at
            `)
            .eq('user_id', session.user.id)
            .eq('completed', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        console.log('Raw items:', items);

        // Transform the data to match the expected structure
        const transformedItems = items
            .filter(item => item.media_items) // Filter out any null items
            .map(item => ({
                id: item.media_items.id,
                title: item.media_items.title,
                media_type: item.media_items.media_type,
                poster_path: item.media_items.poster_path,
                description: item.media_items.description,
                books: item.media_items.books,
                movies: item.media_items.movies,
                tv_shows: item.media_items.tv_shows,
                user_media_progress: {
                    completed_duration: item.completed_duration,
                    duration: item.duration,
                    episodes_completed: item.episodes_completed,
                    pages_completed: item.pages_completed,
                    completed: item.completed,
                    completed_at: item.created_at
                }
            }));

        console.log('Transformed items:', transformedItems);

        return NextResponse.json({ items: transformedItems });

    } catch (error) {
        console.error('Detailed error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch completed items', details: error.message },
            { status: 500 }
        );
    }
} 