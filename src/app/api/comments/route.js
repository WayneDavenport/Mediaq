import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Get comments for a media item
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaItemId = searchParams.get('mediaItemId');

    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:users(id, username),
                replies:comment_replies(
                    id,
                    content,
                    created_at,
                    user:users(id, username)
                )
            `)
            .eq('media_item_id', mediaItemId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// Create a new comment
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { media_item_id, content } = await request.json();
        const commentId = uuidv4();

        // First, get the media item details and owner
        const { data: mediaItem, error: mediaError } = await supabase
            .from('media_items')
            .select(`
                title, 
                user_id,
                user:users!media_items_user_id_fkey (id)
            `)
            .eq('id', media_item_id)
            .single();

        if (mediaError) {
            console.error('Error fetching media item:', mediaError);
            throw mediaError;
        }

        console.log('Media item with user:', mediaItem);

        // Create the comment
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .insert({
                id: commentId,
                media_item_id,
                content,
                user_id: session.user.id
            })
            .select(`
                *,
                user:users(
                    id,
                    username
                )
            `)
            .single();

        if (commentError) {
            console.error('Error creating comment:', commentError);
            throw commentError;
        }

        console.log('Created comment:', comment);

        // Create notification only if the media item owner exists and it's not the commenter
        if (mediaItem.user && mediaItem.user_id !== session.user.id) {
            console.log('Creating notification for:', {
                mediaItemOwner: mediaItem.user_id,
                commenter: session.user.id,
                mediaTitle: mediaItem.title
            });

            const { data: notification, error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    id: uuidv4(),
                    sender_id: session.user.id,
                    receiver_id: mediaItem.user_id,
                    type: 'comment',
                    media_item_id,
                    comment_id: commentId,
                    message: `${session.user.username} commented on your media item: ${mediaItem.title}`,
                    is_read: false
                })
                .select();

            if (notificationError) {
                console.error('Error creating notification:', notificationError);
                // Don't throw the error, just log it
                // This way the comment still gets created even if notification fails
            } else {
                console.log('Created notification:', notification);
            }
        } else {
            console.log('No notification created - user not found or commenting on own media item');
        }

        return NextResponse.json({ comment });
    } catch (error) {
        console.error('Error in comment creation process:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
} 