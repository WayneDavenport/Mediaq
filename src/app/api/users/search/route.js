import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        const searchTerm = new URL(request.url).searchParams.get('term');
        if (!searchTerm) {
            return NextResponse.json(
                { error: 'Search term is required' },
                { status: 400 }
            );
        }

        // Get current user's session
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Search for users by email or username
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, username')
            .or(`email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
            .neq('id', session.user.id) // Exclude current user
            .limit(10);

        if (error) throw error;

        // Get existing friend requests for these users
        const { data: existingRequests, error: requestsError } = await supabase
            .from('friend_requests')
            .select('receiver_id, status')
            .eq('sender_id', session.user.id)
            .in('receiver_id', users.map(user => user.id));

        if (requestsError) throw requestsError;

        // Merge friend request status with user data
        const usersWithRequestStatus = users.map(user => ({
            ...user,
            requestSent: existingRequests?.some(request =>
                request.receiver_id === user.id &&
                request.status === 'pending'
            ),
            isFriend: existingRequests?.some(request =>
                request.receiver_id === user.id &&
                request.status === 'accepted'
            )
        }));

        return NextResponse.json({ users: usersWithRequestStatus });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Failed to search users' },
            { status: 500 }
        );
    }
} 