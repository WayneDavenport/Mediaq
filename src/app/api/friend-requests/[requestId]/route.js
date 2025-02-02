import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function DELETE(request, { params }) {
    try {
        const { requestId } = params;

        // Get current user's session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify the request belongs to the current user
        const { data: friendRequest, error: fetchError } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError) throw fetchError;

        if (!friendRequest) {
            return NextResponse.json(
                { error: 'Friend request not found' },
                { status: 404 }
            );
        }

        if (friendRequest.receiver_id !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to modify this request' },
                { status: 403 }
            );
        }

        // Delete the request
        const { error: deleteError } = await supabase
            .from('friend_requests')
            .delete()
            .eq('id', requestId);

        if (deleteError) throw deleteError;

        return NextResponse.json({
            message: 'Friend request declined successfully'
        });

    } catch (error) {
        console.error('Delete friend request error:', error);
        return NextResponse.json(
            { error: 'Failed to decline friend request' },
            { status: 500 }
        );
    }
}

export async function POST(request, { params }) {
    try {
        const { requestId } = params;
        console.log('Processing request ID:', requestId);

        // Get current user's session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify and get the friend request with sender and receiver info
        const { data: friendRequest, error: fetchError } = await supabase
            .from('friend_requests')
            .select(`
                *,
                sender:sender_id(username),
                receiver:receiver_id(username)
            `)
            .eq('id', requestId)
            .single();

        console.log('Friend request data:', friendRequest);
        console.log('Fetch error:', fetchError);

        if (fetchError) throw fetchError;

        if (!friendRequest) {
            return NextResponse.json(
                { error: 'Friend request not found' },
                { status: 404 }
            );
        }

        if (friendRequest.receiver_id !== session.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to modify this request' },
                { status: 403 }
            );
        }

        // Update request status to accepted
        const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Create friend entries for both users
        const { error: friendError } = await supabase
            .from('friends')
            .insert([
                {
                    user_id: friendRequest.receiver_id,
                    friend_id: friendRequest.sender_id,
                    friend_user_name: friendRequest.sender.username
                },
                {
                    user_id: friendRequest.sender_id,
                    friend_id: friendRequest.receiver_id,
                    friend_user_name: friendRequest.receiver.username
                }
            ]);

        if (friendError) {
            console.error('Error creating friend entries:', friendError);
            throw friendError;
        }

        return NextResponse.json({
            message: 'Friend request accepted successfully'
        });

    } catch (error) {
        console.error('Accept friend request error:', error);
        return NextResponse.json(
            { error: 'Failed to accept friend request', details: error.message },
            { status: 500 }
        );
    }
} 