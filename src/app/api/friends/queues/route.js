import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // First, get all friends
        const { data: friends, error: friendsError } = await supabase
            .from('friends')
            .select('friend_id, friend_user_name')
            .eq('user_id', session.user.id);

        if (friendsError) throw friendsError;

        // Then, get queued items for each friend
        const friendQueues = await Promise.all(
            friends.map(async (friend) => {
                const { data: items, error: itemsError } = await supabase
                    .from('user_media_progress')
                    .select(`
                        *,
                        media_items (
                            id,
                            title,
                            media_type,
                            poster_path,
                            description,
                            category,
                            genres,
                            backdrop_path,
                            books:books(*),
                            movies:movies(*),
                            tv_shows:tv_shows(*),
                            games:games(*)
                        )
                    `)
                    .eq('user_id', friend.friend_id)
                    .not('queue_number', 'is', null)
                    .order('queue_number');

                if (itemsError) throw itemsError;

                return {
                    friend_id: friend.friend_id,
                    friend_user_name: friend.friend_user_name,
                    items: items
                        .filter(item => item.media_items) // Filter out any null items
                        .map(item => ({
                            ...item.media_items,
                            id: item.media_items.id,
                            user_media_progress: {
                                id: item.id,
                                queue_number: item.queue_number,
                                duration: item.duration,
                                completed_duration: item.completed_duration,
                                completed: item.completed,
                                pages_completed: item.pages_completed,
                                episodes_completed: item.episodes_completed
                            }
                        }))
                };
            })
        );

        return NextResponse.json({ queues: friendQueues });

    } catch (error) {
        console.error('Error fetching friend queues:', error);
        return NextResponse.json(
            { error: 'Failed to fetch friend queues' },
            { status: 500 }
        );
    }
} 