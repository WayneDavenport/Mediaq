import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// Accept a friend request
export async function POST(request, { params }) {
    try {
        const { id } = params; // This is the sender_id
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('Accepting friend request from sender ID:', id);
        console.log('Current user ID:', session.user.id);

        // First, get both users' information to get their usernames
        const { data: senderData, error: senderError } = await supabase
            .from('users')
            .select('username')
            .eq('id', id)
            .single();

        if (senderError) {
            console.error('Error fetching sender data:', senderError);
            throw senderError;
        }

        const { data: receiverData, error: receiverError } = await supabase
            .from('users')
            .select('username')
            .eq('id', session.user.id)
            .single();

        if (receiverError) {
            console.error('Error fetching receiver data:', receiverError);
            throw receiverError;
        }

        if (!senderData?.username || !receiverData?.username) {
            console.error('Missing username data:', { sender: senderData, receiver: receiverData });
            return NextResponse.json({ error: 'User data not found' }, { status: 404 });
        }

        console.log('Sender username:', senderData.username);
        console.log('Receiver username:', receiverData.username);

        // Update the friend request status
        const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('sender_id', id)
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending');

        if (updateError) {
            console.error('Error updating friend request:', updateError);
            throw updateError;
        }

        // Create friend connections for both users with usernames
        const friendsData = [
            {
                user_id: session.user.id,
                friend_id: id,
                friend_user_name: senderData.username // Add the sender's username
            },
            {
                user_id: id,
                friend_id: session.user.id,
                friend_user_name: receiverData.username // Add the current user's username
            }
        ];

        console.log('Creating friend connections:', friendsData);

        const { data: friendsResult, error: friendsError } = await supabase
            .from('friends')
            .insert(friendsData)
            .select();

        if (friendsError) {
            console.error('Error creating friend connections:', friendsError);
            throw friendsError;
        }

        console.log('Friend connections created:', friendsResult);

        // Delete the friend request notification
        const { error: notificationError } = await supabase
            .from('notifications')
            .delete()
            .eq('type', 'friend_request')
            .eq('sender_id', id)
            .eq('receiver_id', session.user.id);

        if (notificationError) {
            console.error('Error deleting notification:', notificationError);
            // Continue even if notification deletion fails
        }

        // Create a notification for the sender that their request was accepted
        const { error: newNotificationError } = await supabase
            .from('notifications')
            .insert({
                type: 'friend_request_accepted',
                sender_id: session.user.id,
                receiver_id: id,
                message: `accepted your friend request`,
                is_read: false,
                created_at: new Date().toISOString() // Ensure we have a fresh timestamp
            });

        if (newNotificationError) {
            console.error('Error creating acceptance notification:', newNotificationError);
            // Continue even if notification creation fails
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error accepting friend request:', error);
        return NextResponse.json({
            error: 'Failed to accept friend request',
            details: error.message,
            code: error.code
        }, { status: 500 });
    }
}

// Decline a friend request
export async function DELETE(request, { params }) {
    try {
        const { id } = params; // This is the sender_id
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete the friend request
        const { error } = await supabase
            .from('friend_requests')
            .delete()
            .eq('sender_id', id)
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending');

        if (error) throw error;

        // Delete the friend request notification
        const { error: notificationError } = await supabase
            .from('notifications')
            .delete()
            .eq('type', 'friend_request')
            .eq('sender_id', id)
            .eq('receiver_id', session.user.id);

        if (notificationError) {
            console.error('Error deleting notification:', notificationError);
            // Continue even if notification deletion fails
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error declining friend request:', error);
        return NextResponse.json(
            { error: 'Failed to decline friend request' },
            { status: 500 }
        );
    }
} 