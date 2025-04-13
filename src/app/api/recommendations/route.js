import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        // Get current user's session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch recommendations for the current user
        const { data: recommendations, error } = await supabase
            .from('user_recommendations')
            .select(`
                *,
                sender:sender_id(
                    username,
                    avatar_url
                )
            `)
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ recommendations });

    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { friendId, mediaItemData, message } = body;

        // Validate required fields
        if (!friendId || !mediaItemData) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Parse genres if it's a string
        let parsedGenres;
        try {
            parsedGenres = typeof mediaItemData.genres === 'string'
                ? JSON.parse(mediaItemData.genres)
                : mediaItemData.genres;
        } catch (e) {
            parsedGenres = [];
        }

        // Basic media data without nested objects
        const formattedMediaData = {
            id: mediaItemData.id,
            title: mediaItemData.title,
            media_type: mediaItemData.media_type,
            description: mediaItemData.description,
            poster_path: mediaItemData.poster_path,
            backdrop_path: mediaItemData.backdrop_path,
            category: mediaItemData.category,
            genres: parsedGenres
        };

        // Add media-specific data based on type
        if (mediaItemData.media_type === 'game' && mediaItemData.games) {
            formattedMediaData.games = {
                average_playtime: mediaItemData.games.average_playtime || 0,
                rating: mediaItemData.games.rating || 0,
                rawg_id: mediaItemData.games.rawg_id || null,
                platforms: mediaItemData.games.platforms || '',
                publishers: mediaItemData.games.publishers || '',
                metacritic: mediaItemData.games.metacritic || 0,
                esrb_rating: mediaItemData.games.esrb_rating || ''
            };
        } else if (mediaItemData.media_type === 'movie' && mediaItemData.movies) {
            formattedMediaData.movies = {
                runtime: mediaItemData.movies.runtime || 0,
                tmdb_id: mediaItemData.movies.tmdb_id || null,
                release_date: mediaItemData.movies.release_date || null
            };
        }

        // Convert the entire object to a string and back to ensure valid JSON
        const validJsonData = JSON.parse(JSON.stringify(formattedMediaData));

        // Create the recommendation
        const { data: recommendation, error } = await supabase
            .from('user_recommendations')
            .insert({
                sender_id: session.user.id,
                receiver_id: friendId,
                media_item_data: validJsonData,
                message: message || null,
                status: 'pending'
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        // --- Remove/Comment out redundant notification creation ---
        /*
        // Create notification
        await supabase
            .from('notifications')
            .insert({
                type: 'recommendation',
                sender_id: session.user.id,
                receiver_id: friendId,
                media_item_id: mediaItemData.id,
                message: `recommended ${mediaItemData.title} to you`,
                is_read: false
            });
        */
        console.log('Skipped creating redundant text notification for receiver upon recommendation.');
        // --- End removal ---

        return NextResponse.json({ recommendation });

    } catch (error) {
        console.error('Error creating recommendation:', error);
        return NextResponse.json({
            error: error.message,
            details: error.details || 'No additional details'
        }, { status: 500 });
    }
} 