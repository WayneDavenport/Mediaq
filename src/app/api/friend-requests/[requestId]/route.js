import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function DELETE(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Delete the request
        const { error: deleteError } = await supabase
            .from('friend_requests')
            .delete()
            .eq('sender_id', params.requestId)
            .eq('receiver_id', session.user.id)
            .eq('status', 'pending');

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
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get the friend request details
        const { data: friendRequest, error: fetchError } = await supabase
            .from('friend_requests')
            .select(`
                *,
                sender:sender_id(username),
                receiver:receiver_id(username)
            `)
            .eq('receiver_id', session.user.id)
            .eq('sender_id', params.requestId)
            .eq('status', 'pending')
            .single();

        if (fetchError) throw fetchError;

        if (!friendRequest) {
            return NextResponse.json(
                { error: 'Friend request not found' },
                { status: 404 }
            );
        }

        // Update request status to accepted
        const { error: updateError } = await supabase
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('sender_id', params.requestId)
            .eq('receiver_id', session.user.id);

        if (updateError) throw updateError;

        // Create friend entries for both users
        const { error: friendError } = await supabase
            .from('friends')
            .insert([
                {
                    user_id: session.user.id,
                    friend_id: friendRequest.sender_id,
                    friend_user_name: friendRequest.sender.username
                },
                {
                    user_id: friendRequest.sender_id,
                    friend_id: session.user.id,
                    friend_user_name: friendRequest.receiver.username
                }
            ]);

        if (friendError) throw friendError;

        return NextResponse.json({
            message: 'Friend request accepted successfully'
        });

    } catch (error) {
        console.error('Accept friend request error:', error);
        return NextResponse.json(
            { error: 'Failed to accept friend request' },
            { status: 500 }
        );
    }
} 