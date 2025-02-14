import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Create a reply to a comment
export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content } = await request.json();
        const replyId = uuidv4();

        // Get the original comment and media item details
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .select(`
                *,
                user:users(id, username),
                media_items(id, title, user_id)
            `)
            .eq('id', params.commentId)
            .single();

        if (commentError) throw commentError;

        // Create the reply
        const { data: reply, error: replyError } = await supabase
            .from('comment_replies')
            .insert({
                id: replyId,
                comment_id: params.commentId,
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

        if (replyError) throw replyError;

        // Create notification for the comment owner (if it's not their own reply)
        if (comment.user_id !== session.user.id) {
            const { error: notificationError } = await supabase
                .from('notifications')
                .insert({
                    id: uuidv4(),
                    sender_id: session.user.id,
                    receiver_id: comment.user_id,
                    type: 'reply',
                    media_item_id: comment.media_item_id,
                    comment_id: params.commentId,
                    reply_id: replyId,
                    message: `${session.user.username} replied to your comment on ${comment.media_items.title}`,
                    is_read: false
                });

            if (notificationError) {
                console.error('Error creating notification for comment owner:', notificationError);
            }
        }

        // Also notify the media item owner if different from comment owner and reply owner
        if (comment.media_items.user_id !== session.user.id &&
            comment.media_items.user_id !== comment.user_id) {
            const { error: ownerNotificationError } = await supabase
                .from('notifications')
                .insert({
                    id: uuidv4(),
                    sender_id: session.user.id,
                    receiver_id: comment.media_items.user_id,
                    type: 'reply',
                    media_item_id: comment.media_item_id,
                    comment_id: params.commentId,
                    reply_id: replyId,
                    message: `${session.user.username} replied to a comment on your media item: ${comment.media_items.title}`,
                    is_read: false
                });

            if (ownerNotificationError) {
                console.error('Error creating notification for media owner:', ownerNotificationError);
            }
        }

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        );
    }
} 