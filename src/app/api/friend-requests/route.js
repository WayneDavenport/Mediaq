import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const body = await request.json();
        console.log('Friend request body:', body); // Debug log

        // Check if receiverId exists in the request body
        if (!body.receiverId) {
            console.error('Missing receiverId in request body:', body);
            return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
        }

        const receiverId = body.receiverId;

        // Check if friend request already exists
        const { data: existingRequest, error: checkError } = await supabase
            .from('friend_requests')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
            .not('status', 'eq', 'declined');

        if (checkError) throw checkError;

        if (existingRequest && existingRequest.length > 0) {
            return NextResponse.json({ error: 'Friend request already exists' }, { status: 400 });
        }

        // Create friend request
        const { error: insertError } = await supabase
            .from('friend_requests')
            .insert({
                sender_id: session.user.id,
                receiver_id: receiverId,
                status: 'pending'
            });

        if (insertError) throw insertError;

        // Create notification for the receiver
        const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
                type: 'friend_request',
                sender_id: session.user.id,
                receiver_id: receiverId,
                message: 'sent you a friend request',
                is_read: false
            });

        if (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Continue even if notification creation fails
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error sending friend request:', error);
        return NextResponse.json(
            { error: 'Failed to send friend request', details: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get pending friend requests for the current user
        const { data: requests, error } = await supabase
            .from('friend_requests')
            .select(`
                *,
                sender:sender_id(id, username, email),
                receiver:receiver_id(id, username, email)
            `)
            .eq('status', 'pending')
            .eq('receiver_id', session.user.id);

        if (error) throw error;

        return NextResponse.json({ requests });

    } catch (error) {
        console.error('Get friend requests error:', error);
        return NextResponse.json(
            { error: 'Failed to get friend requests' },
            { status: 500 }
        );
    }
} 