import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request, { params }) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = params.userId;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Fetch user's media items
        const { data: mediaItems, error: mediaError } = await supabase
            .from('media_items')
            .select('*')
            .eq('user_id', userId);

        if (mediaError) {
            console.error('Error fetching media items:', mediaError);
            throw mediaError;
        }

        // For each media item, fetch related data
        const mediaItemsWithDetails = await Promise.all(
            mediaItems.map(async (item) => {
                // Fetch user_media_progress for this item
                const { data: progressData, error: progressError } = await supabase
                    .from('user_media_progress')
                    .select('*')
                    .eq('id', item.id)
                    .single();

                if (progressError && progressError.code !== 'PGRST116') {
                    console.error('Error fetching progress:', progressError);
                }

                // Fetch media-specific data based on media_type
                let specificData = null;
                let specificError = null;

                if (item.media_type === 'movie') {
                    const { data, error } = await supabase
                        .from('movies')
                        .select('*')
                        .eq('id', item.id)
                        .single();
                    specificData = data;
                    specificError = error;
                } else if (item.media_type === 'tv') {
                    const { data, error } = await supabase
                        .from('tv_shows')
                        .select('*')
                        .eq('id', item.id)
                        .single();
                    specificData = data;
                    specificError = error;
                } else if (item.media_type === 'book') {
                    const { data, error } = await supabase
                        .from('books')
                        .select('*')
                        .eq('id', item.id)
                        .single();
                    specificData = data;
                    specificError = error;
                } else if (item.media_type === 'game') {
                    const { data, error } = await supabase
                        .from('games')
                        .select('*')
                        .eq('id', item.id)
                        .single();
                    specificData = data;
                    specificError = error;
                }

                if (specificError && specificError.code !== 'PGRST116') {
                    console.error(`Error fetching ${item.media_type} data:`, specificError);
                }

                // Fetch comments for this media item
                const { data: comments, error: commentsError } = await supabase
                    .from('comments')
                    .select('*, user:users(username, email)')
                    .eq('media_item_id', item.id);

                if (commentsError) {
                    console.error('Error fetching comments:', commentsError);
                }

                // Return the item with all related data
                return {
                    ...item,
                    progress: progressData || null,
                    specific_data: specificData || null,
                    comments: comments || []
                };
            })
        );

        return NextResponse.json({
            success: true,
            mediaItems: mediaItemsWithDetails || []
        });

    } catch (error) {
        console.error('Error fetching user media items:', error);
        return NextResponse.json({
            error: 'Failed to fetch user media items',
            details: error.message
        }, { status: 500 });
    }
} 