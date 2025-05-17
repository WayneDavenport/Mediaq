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

        // First, insert the base media item with UUID
        const { data: mediaItem, error: mediaError } = await supabase
            .from('media_items')
            .insert({
                id: crypto.randomUUID(), // Explicitly generate a UUID
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
            // For games, duration should already be in minutes from the frontend
            duration = data.average_playtime || data.duration || 240; // default 4 hours in minutes
        } else if (data.media_type === 'tv') {
            // For TV shows, use the average runtime
            duration = data.average_runtime || data.duration || 0;
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

            case 'task': {
                // Insert into tasks table
                const { error: taskError } = await supabase
                    .from('tasks')
                    .insert({
                        id: mediaItem.id,
                        due_date: data.due_date || null,
                        user_id: session.user.id,
                        unit_name: data.unit_name || null,
                        unit_range: data.unit_range || null,
                    });
                if (taskError) throw taskError;
                break;
            }
        }

        // Update progress tracking with UUID
        const { error: progressError } = await supabase
            .from('user_media_progress')
            .insert({
                id: mediaItem.id,
                queue_number: data.queue_number,
                duration: duration,
                completed_duration: 0,
                notes: data.notes,
                /* completed_timestampz: null, */
                completed: false,

                user_id: session.user.id,
            });

        if (progressError) throw progressError;

        // Update lock data with UUID
        if (data.locked) {
            // Determine lock type
            let lock_type;
            if (data.key_parent_id) {
                lock_type = 'specific';
            } else if (['movie', 'book', 'tv', 'game'].includes(data.key_parent_text?.toLowerCase())) {
                lock_type = 'media_type';
            } else {
                lock_type = 'category';
            }

            const { error: lockError } = await supabase
                .from('locked_items')
                .insert({
                    id: mediaItem.id,
                    key_parent_id: data.key_parent_id,
                    key_parent_text: data.key_parent_text || '',
                    lock_type,
                    goal_time: data.goal_time || 0,
                    goal_pages: data.goal_pages || 0,
                    goal_episodes: data.goal_episodes || 0,
                    goal_units: data.goal_units || 0, // Added for tasks
                    completed_time: 0,
                    completed: false,
                    pages_completed: 0,
                    episodes_completed: 0,
                    units_completed: 0, // Added for tasks
                    user_id: session.user.id
                });

            if (lockError) {
                console.error('Lock Error:', lockError);
                throw lockError;
            }
        }

        // Fetch the newly created item with all its details to return
        const { data: newItemWithDetails, error: fetchError } = await supabase
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
            .eq('id', mediaItem.id)
            .eq('user_id', session.user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching newly created item:', fetchError);
            // If fetching fails, we might still want to return the basic mediaItem 
            // or handle this more gracefully depending on requirements.
            // For now, let's re-throw to indicate a problem post-creation.
            throw fetchError;
        }

        // Normalize the fetched item before returning
        const transformedNewItem = {
            ...newItemWithDetails,
            locked_items: newItemWithDetails.locked_items ? (Array.isArray(newItemWithDetails.locked_items) ? newItemWithDetails.locked_items : [newItemWithDetails.locked_items]) : [],
            user_media_progress: Array.isArray(newItemWithDetails.user_media_progress) ? newItemWithDetails.user_media_progress[0] : newItemWithDetails.user_media_progress,
            books: Array.isArray(newItemWithDetails.books) ? newItemWithDetails.books[0] : newItemWithDetails.books,
            movies: Array.isArray(newItemWithDetails.movies) ? newItemWithDetails.movies[0] : newItemWithDetails.movies,
            tv_shows: Array.isArray(newItemWithDetails.tv_shows) ? newItemWithDetails.tv_shows[0] : newItemWithDetails.tv_shows,
            games: Array.isArray(newItemWithDetails.games) ? newItemWithDetails.games[0] : newItemWithDetails.games,
            tasks: Array.isArray(newItemWithDetails.tasks) ? newItemWithDetails.tasks[0] : newItemWithDetails.tasks,
        };

        return NextResponse.json({ success: true, data: transformedNewItem });

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
        console.log('Session data:', {
            exists: !!session,
            user: session?.user,
            email: session?.user?.email,
            id: session?.user?.id
        });

        if (!session) {
            console.log('No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Log before Supabase query
        console.log('Attempting Supabase query for user:', session.user.id);

        // Get active items and their locks - specify the foreign key relationship
        const { data: items, error } = await supabase
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
            .eq('user_id', session.user.id);

        // Log query results
        console.log('Supabase query results:', {
            hasError: !!error,
            errorDetails: error,
            itemCount: items?.length,
            firstItem: items?.[0]
        });

        // Optionally get completed locks
        const { data: completedLocks, error: completedLocksError } = await supabase
            .from('completed_locks')
            .select('*')
            .eq('user_id', session.user.id);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // Transform the data to flatten the structure and normalize locked_items
        const transformedItems = items.map(item => ({
            ...item,
            locked_items: item.locked_items ? (Array.isArray(item.locked_items) ? item.locked_items : [item.locked_items]) : []
        }));

        console.log('Final transformed data:', {
            itemCount: transformedItems.length,
            hasCompletedLocks: !!completedLocks?.length
        });

        return NextResponse.json({ items: transformedItems });

    } catch (error) {
        console.error('Error in GET function:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return NextResponse.json(
            { error: 'Failed to fetch media items', details: error.message },
            { status: 500 }
        );
    }
}