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

        const { data: items, error } = await supabase
            .from('user_media_progress')
            .select(`
                *,
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
                )
            `)
            .eq('user_id', session.user.id)
            .eq('completed', true)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const transformedItems = items
            .filter(item => item.media_items)
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
                    completed_at: item.updated_at
                }
            }));

        return NextResponse.json({ items: transformedItems });

    } catch (error) {
        console.error('Error fetching completed items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch completed items' },
            { status: 500 }
        );
    }
} 