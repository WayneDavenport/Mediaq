import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';



/* 
Note: You might want to consider using a database transaction 
to ensure all inserts succeed or fail together. 
Here's how you could modify the POST to use a transaction:

//  Inside the POST try block

const { data: mediaItem, error: mediaError } = await supabase.rpc('create_media_item', {
    base_data: {
        title: data.title,
        media_type: data.media_type,
        // ... other base fields
    },
    type_data: {
        // Fields specific to the media type (books, movies, etc.)
        ...data
    },
    progress_data: {
        queue_number: data.queue_number,
        duration: data.duration,
        completed_duration: 0,
        completed: false
    }
});
//You would need to create a corresponding PostgreSQL function in Supabase
to handle the transaction, but this would ensure data consistency.

 */
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();
        console.log('Received data:', data); // Debug log

        // First, insert the base media item
        const { data: mediaItem, error: mediaError } = await supabase
            .from('media_items')
            .insert({
                title: data.title,
                media_type: data.media_type,
                category: data.category,
                description: data.description,
                genres: data.genres,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
                user_id: session.user.id,
                user_email: session.user.email,
            })
            .select()
            .single();

        if (mediaError) throw mediaError;

        // Determine the duration based on media type
        let duration = data.duration || 0;
        if (data.media_type === 'movie') {
            // For movies, use the runtime from TMDB
            duration = data.runtime || data.duration || 120;
        } else if (data.media_type === 'game') {
            // For games, convert hours to minutes
            duration = (data.average_playtime || data.duration || 4) * 60;
        }

        // Insert into the appropriate media type table
        switch (data.media_type) {
            case 'book':
                const { error: bookError } = await supabase
                    .from('books')
                    .insert({
                        id: mediaItem.id,
                        authors: data.authors,
                        average_rating: data.average_rating,
                        categories: data.categories,
                        estimated_reading_time: data.estimated_reading_time,
                        google_books_id: data.google_books_id,
                        isbn: data.isbn,
                        language: data.language,
                        page_count: data.page_count,
                        preview_link: data.preview_link,
                        published_date: data.published_date,
                        publisher: data.publisher,
                        ratings_count: data.ratings_count,
                        reading_speed: data.reading_speed,
                        user_id: session.user.id,
                    });
                if (bookError) throw bookError;
                break;

            case 'movie':
                const { error: movieError } = await supabase
                    .from('movies')
                    .insert({
                        id: mediaItem.id,
                        director: data.director,
                        original_language: data.original_language,
                        release_date: data.release_date,
                        tmdb_id: data.tmdb_id,
                        vote_average: data.vote_average,
                        runtime: duration,
                        user_id: session.user.id,
                    });
                if (movieError) throw movieError;
                break;

            case 'game':
                const { error: gameError } = await supabase
                    .from('games')
                    .insert({
                        id: mediaItem.id,
                        achievements_count: data.achievements_count,
                        average_playtime: data.average_playtime,
                        esrb_rating: data.esrb_rating,
                        genres: data.genres,
                        metacritic: data.metacritic,
                        platforms: data.platforms,
                        publishers: data.publishers,
                        rating: data.rating,
                        rating_count: data.rating_count,
                        rawg_id: data.rawg_id,
                        release_date: data.release_date,
                        website: data.website,
                        user_id: session.user.id,
                    });
                if (gameError) throw gameError;
                break;

            case 'tv':
                const { error: tvError } = await supabase
                    .from('tv_shows')
                    .insert({
                        id: mediaItem.id,
                        average_runtime: data.average_runtime,
                        episode_run_times: data.episode_run_times,
                        original_language: data.original_language,
                        release_date: data.release_date,
                        seasons: data.seasons,
                        tmdb_id: data.tmdb_id,
                        total_episodes: data.total_episodes,
                        vote_average: data.vote_average,
                        user_id: session.user.id,
                    });
                if (tvError) throw tvError;
                break;


        }

        // Create progress tracking entry with the correct duration
        const { error: progressError } = await supabase
            .from('user_media_progress')
            .insert({
                id: mediaItem.id,
                queue_number: data.queue_number,
                duration: duration, // Use the determined duration
                completed_duration: 0,
                completed: false,
                user_id: session.user.id,
            });

        if (progressError) throw progressError;

        // Add lock logic here
        if (data.locked) {
            const { error: lockError } = await supabase
                .from('locked_items')
                .insert({
                    id: mediaItem.id,
                    key_parent_text: data.key_parent_text || '',
                    lock_type: data.lock_type || 'specific_item',
                    key_parent_id: data.key_parent_id,
                    goal_time: data.goal_time || 0,
                    goal_pages: data.goal_pages || 0,
                    goal_episodes: data.goal_episodes || 0,
                    completed_time: 0,
                    pages_completed: 0,
                    episodes_completed: 0,
                    user_id: session.user.id
                });

            if (lockError) {
                console.error('Lock Error:', lockError);
                throw lockError;
            }
        }

        return NextResponse.json({ success: true, data: mediaItem });

    } catch (error) {
        console.error('Error creating media item:', error);
        return NextResponse.json(
            { error: 'Failed to create media item' },
            { status: 500 }
        );
    }
}

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
            .eq('completed', false)
            .order('queue_number', { ascending: true });

        if (error) throw error;

        // Transform the data to flatten the structure
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
                    queue_number: item.queue_number,
                    completed_duration: item.completed_duration,
                    duration: item.duration,
                    episodes_completed: item.episodes_completed,
                    pages_completed: item.pages_completed,
                    completed: item.completed
                }
            }));

        return NextResponse.json({ items: transformedItems });

    } catch (error) {
        console.error('Error fetching media items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch media items' },
            { status: 500 }
        );
    }
}