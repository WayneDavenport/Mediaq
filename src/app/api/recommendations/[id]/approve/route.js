import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';
import crypto from 'crypto';

export async function POST(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the recommendation
        const { data: recommendation, error: recError } = await supabase
            .from('user_recommendations')
            .select('*, sender:sender_id(*)')
            .eq('id', id)
            .eq('receiver_id', session.user.id)
            .single();

        if (recError) throw recError;
        if (!recommendation) {
            return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
        }

        const rec = recommendation.media_item_data;

        // Generate a UUID in the same way as media-items route.js
        const newItemId = crypto.randomUUID();
        console.log('Generated UUID for new item:', newItemId);

        console.log('Raw recommendation data:', JSON.stringify(recommendation, null, 2));
        console.log('Raw games data:', JSON.stringify(rec.games, null, 2));

        // Get next queue number
        const { data: queueData, error: queueError } = await supabase
            .from('user_media_progress')
            .select('queue_number')
            .eq('user_id', session.user.id)
            .order('queue_number', { ascending: false })
            .limit(1);

        if (queueError) throw queueError;

        const nextQueueNumber = (queueData?.[0]?.queue_number || 0) + 1;

        // Calculate estimated duration based on media type
        const duration = rec.media_type === 'game'
            ? (parseInt(rec.games?.average_playtime) || 0) * 60
            : rec.media_type === 'movie'
                ? (parseInt(rec.movies?.runtime) || 0)
                : 0;

        // First, insert media_items with explicit UUID
        const mediaItemInsert = {
            id: newItemId, // Explicitly set the UUID
            title: rec.title,
            media_type: rec.media_type,
            description: rec.description,
            poster_path: rec.poster_path,
            backdrop_path: rec.backdrop_path,
            category: rec.category,
            genres: typeof rec.genres === 'string' ? rec.genres : JSON.stringify(rec.genres || []),
            user_id: session.user.id,
            user_email: session.user.email
        };

        // Insert the media item
        const { data: mediaItemData, error: mediaError } = await supabase
            .from('media_items')
            .insert([mediaItemInsert])
            .select()
            .single();

        if (mediaError) {
            console.error('Media item insert error:', mediaError);
            throw mediaError;
        }

        // Insert media type specific data with the new ID
        if (rec.media_type === 'game' && rec.games) {
            const gamesData = {
                id: newItemId,
                user_id: session.user.id,
                achievements_count: rec.games?.achievements_count != null ?
                    parseInt(rec.games.achievements_count) : null,
                average_playtime: rec.games?.average_playtime != null ?
                    parseInt(rec.games.average_playtime) : null,
                esrb_rating: rec.games?.esrb_rating || null,
                genres: typeof rec.genres === 'string' ? rec.genres : JSON.stringify(rec.genres || []),
                metacritic: rec.games?.metacritic != null ?
                    parseInt(rec.games.metacritic) : null,
                platforms: rec.games?.platforms || null,
                publishers: rec.games?.publishers || null,
                rating: rec.games?.rating != null ?
                    parseFloat(rec.games.rating) : null,
                rating_count: rec.games?.rating_count != null ?
                    parseInt(rec.games.rating_count) : null,
                rawg_id: rec.games?.rawg_id != null ?
                    parseInt(rec.games.rawg_id) : null,
                release_date: rec.games?.release_date || null,
                website: rec.games?.website || null
            };

            console.log('Games data to insert:', gamesData);

            const { error: gamesError } = await supabase
                .from('games')
                .insert([gamesData]);

            if (gamesError) {
                console.error('Games insert error:', gamesError);
                throw gamesError;
            }
        } else if (rec.media_type === 'movie' && rec.movies) {
            const movieData = {
                id: newItemId,
                user_id: session.user.id,
                runtime: parseInt(rec.movies.runtime) || 0,
                tmdb_id: parseInt(rec.movies.tmdb_id) || null,
                release_date: rec.movies.release_date || null,
                vote_average: parseFloat(rec.movies.vote_average) || 0,
                director: rec.movies.director || '',
                original_language: rec.movies.original_language || ''
            };

            const { error: movieError } = await supabase
                .from('movies')
                .insert([movieData]);

            if (movieError) {
                console.error('Movie insert error:', movieError);
                throw movieError;
            }
        } else if (rec.media_type === 'book' && rec.books) {
            const bookData = {
                id: newItemId,
                user_id: session.user.id,
                authors: rec.books.authors,
                average_rating: rec.books.average_rating,
                categories: rec.books.categories,
                estimated_reading_time: rec.books.estimated_reading_time,
                google_books_id: rec.books.google_books_id,
                isbn: rec.books.isbn,
                language: rec.books.language,
                page_count: parseInt(rec.books.page_count) || 0,
                preview_link: rec.books.preview_link,
                published_date: rec.books.published_date,
                publisher: rec.books.publisher,
                ratings_count: rec.books.ratings_count,
                reading_speed: rec.books.reading_speed
            };

            const { error: bookError } = await supabase
                .from('books')
                .insert([bookData]);

            if (bookError) {
                console.error('Book insert error:', bookError);
                throw bookError;
            }
        }

        // Then, insert progress data with the new ID
        const progressData = {
            id: newItemId,
            user_id: session.user.id,
            completed: false,
            completed_duration: 0,
            completed_timestampz: null,
            duration: duration,
            episodes_completed: 0,
            pages_completed: 0,
            queue_number: nextQueueNumber
        };

        const { error: progressError } = await supabase
            .from('user_media_progress')
            .insert([progressData]);

        if (progressError) {
            console.error('Progress insert error:', progressError);
            throw progressError;
        }

        // Update recommendation status
        await supabase
            .from('user_recommendations')
            .update({ status: 'accepted' })
            .eq('id', id);

        // Create notification
        await supabase
            .from('notifications')
            .insert({
                type: 'recommendation_accepted',
                sender_id: session.user.id,
                receiver_id: recommendation.sender_id,
                media_item_id: newItemId, // Use the new ID
                message: `accepted your recommendation of ${rec.title}`,
                is_read: false
            });

        return NextResponse.json({
            success: true,
            data: mediaItemData
        });

    } catch (error) {
        console.error('Error approving recommendation:', error);
        return NextResponse.json({
            error: error.message,
            details: error.details || 'No additional details'
        }, { status: 500 });
    }
} 