import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

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

        console.log('Raw recommendation data:', JSON.stringify(recommendation, null, 2));
        console.log('Raw games data:', JSON.stringify(rec.games, null, 2));

        // Base media data
        const mediaData = {
            id: rec.id,
            title: rec.title,
            media_type: rec.media_type,
            description: rec.description,
            poster_path: rec.poster_path,
            backdrop_path: rec.backdrop_path,
            category: rec.category,
            genres: Array.isArray(rec.genres) ? rec.genres :
                typeof rec.genres === 'string' ? JSON.parse(rec.genres) : []
        };

        // Handle games data specifically
        if (rec.media_type === 'game') {
            console.log('Processing game data:', rec);
            console.log('Games object:', rec.games); // Debug log

            const gamesData = {
                id: rec.id,
                user_id: session.user.id,
                // Access values from rec.games instead of rec
                achievements_count: rec.games?.achievements_count != null ?
                    parseInt(rec.games.achievements_count) : null,
                average_playtime: rec.games?.average_playtime != null ?
                    parseInt(rec.games.average_playtime) : null,
                esrb_rating: rec.games?.esrb_rating || null,
                genres: rec.genres, // This one is correct at root level
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
                id: rec.id,
                runtime: parseInt(rec.movies.runtime) || 0,
                tmdb_id: parseInt(rec.movies.tmdb_id) || null,
                release_date: rec.movies.release_date || null,
                vote_average: parseFloat(rec.movies.vote_average) || 0,
                director: rec.movies.director || '',
                original_language: rec.movies.original_language || ''
            };
            mediaData.movies = movieData;
        }

        // Get next queue number
        const { data: queueData, error: queueError } = await supabase
            .from('user_media_progress')
            .select('queue_number')
            .eq('user_id', session.user.id)
            .order('queue_number', { ascending: false })
            .limit(1);

        if (queueError) throw queueError;

        const nextQueueNumber = (queueData?.[0]?.queue_number || 0) + 1;

        // Add progress-related fields
        const progressData = {
            completed: false,
            completed_duration: 0,
            completed_timestampz: null,
            duration: rec.media_type === 'game'
                ? (parseInt(rec.games?.average_playtime) || 0) * 60
                : rec.media_type === 'movie'
                    ? (parseInt(rec.movies?.runtime) || 0)
                    : 0,
            episodes_completed: null,
            pages_completed: null,
            queue_number: nextQueueNumber
        };

        // Combine all data
        const finalData = {
            ...mediaData,
            ...progressData,
            user_id: session.user.id,
            user_email: session.user.email
        };

        console.log('Final data structure:', JSON.stringify(finalData, null, 2));

        // First, insert the media item
        const { data: mediaItemData, error: mediaError } = await supabase
            .from('media_items')
            .insert([finalData])
            .select()
            .single();

        if (mediaError) throw mediaError;

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
                media_item_id: mediaData.id,
                message: `accepted your recommendation of ${mediaData.title}`,
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