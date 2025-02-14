import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    try {
        const body = await request.json();
        const { receiver_id } = body;

        if (!receiver_id) {
            return NextResponse.json(
                { error: 'Receiver ID is required' },
                { status: 400 }
            );
        }

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if request already exists
        const { data: existingRequests, error: checkError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('sender_id', session.user.id)
            .eq('receiver_id', receiver_id)
            .eq('status', 'pending');

        if (checkError) throw checkError;

        if (existingRequests?.length > 0) {
            return NextResponse.json(
                { error: 'Friend request already sent' },
                { status: 400 }
            );
        }

        // Create new friend request
        const { data, error: insertError } = await supabase
            .from('friend_requests')
            .upsert({
                sender_id: session.user.id,
                receiver_id: receiver_id,
                status: 'pending'
            })
            .select();

        if (insertError) throw insertError;

        return NextResponse.json({
            message: 'Friend request sent successfully',
            request: data[0]
        });

    } catch (error) {
        console.error('Friend request error:', error);
        return NextResponse.json(
            { error: 'Failed to send friend request' },
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