import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get outgoing friend requests
        const { data, error } = await supabase
            .from('friend_requests')
            .select(`
                *,
                receiver:receiver_id(id, username, email)
            `)
            .eq('sender_id', session.user.id)
            .eq('status', 'pending');

        if (error) throw error;

        return NextResponse.json({ requests: data });

    } catch (error) {
        console.error('Error fetching outgoing friend requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch outgoing friend requests' },
            { status: 500 }
        );
    }
} 