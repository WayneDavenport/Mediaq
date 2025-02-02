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
                        queue_number,
                        media_items (
                            id,
                            title,
                            media_type,
                            poster_path,
                            description
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
                            user_media_progress: {
                                queue_number: item.queue_number
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