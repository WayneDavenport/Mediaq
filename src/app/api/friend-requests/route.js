import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        console.log('Starting friend request creation...');
        const body = await request.json();
        console.log('Request body:', body);

        const { receiver_id, sender_id, status } = body;

        if (!receiver_id) {
            console.log('Missing receiver_id');
            return NextResponse.json(
                { error: 'Receiver ID is required' },
                { status: 400 }
            );
        }

        // Get current user's session
        const session = await getServerSession(authOptions);
        console.log('Session:', session);

        if (!session) {
            console.log('No session found');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify that the sender_id matches the session user
        if (sender_id !== session.user.id) {
            console.log('Sender ID mismatch:', { sender_id, sessionUserId: session.user.id });
            return NextResponse.json(
                { error: 'Unauthorized: Sender ID mismatch' },
                { status: 403 }
            );
        }

        console.log('Checking for existing request...');
        // Check if request already exists
        const { data: existingRequests, error: checkError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_id', session.user.id)
            .eq('receiver_id', receiver_id);

        console.log('Existing request check:', { existingRequests, checkError });

        if (checkError) {
            console.error('Error checking existing request:', checkError);
            throw checkError;
        }

        if (existingRequests && existingRequests.length > 0) {
            return NextResponse.json(
                { error: 'Friend request already sent' },
                { status: 400 }
            );
        }

        console.log('Creating new friend request...');
        // Create new friend request
        const { data, error: insertError } = await supabase
            .from('friend_requests')
            .insert([{
                sender_id: session.user.id,
                receiver_id: receiver_id,
                status: 'pending'
            }])
            .select();

        if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
        }

        console.log('Friend request created successfully:', data);
        return NextResponse.json({
            message: 'Friend request sent successfully',
            request: data[0] // Return the first (and only) inserted record
        });

    } catch (error) {
        console.error('Friend request error:', error);
        return NextResponse.json(
            {
                error: 'Failed to send friend request',
                details: error.message,
                stack: error.stack
            },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        // Get current user's session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get only pending friend requests for the current user
        const { data: requests, error } = await supabase
            .from('friend_requests')
            .select(`
                *,
                sender:sender_id(id, username, email),
                receiver:receiver_id(id, username, email)
            `)
            .eq('status', 'pending')  // Only get pending requests
            .or(`receiver_id.eq.${session.user.id}`); // Only get requests sent to the current user

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