import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function DELETE(request, { params }) {
    try {
        const { id } = params; // This is the receiver_id
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete the friend request
        const { error } = await supabase
            .from('friend_requests')
            .delete()
            .eq('sender_id', session.user.id)
            .eq('receiver_id', id)
            .eq('status', 'pending');

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error cancelling friend request:', error);
        return NextResponse.json(
            { error: 'Failed to cancel friend request' },
            { status: 500 }
        );
    }
} 