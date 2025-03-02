import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// List of admin emails that can access this endpoint
const ADMIN_EMAILS = ['wayne86davenport@gmail.com'];

export async function POST(request) {
    try {
        // Check if user is authenticated and is an admin
        const session = await getServerSession(authOptions);

        if (!session?.user?.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body to check for options
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            // If body parsing fails, assume it's an empty body
            body = {};
        }

        const { testUsersOnly = false, userId = null } = body;

        // Get test users if needed
        let testUserIds = [];
        if (testUsersOnly) {
            const { data: testUsers, error: testUsersError } = await supabase
                .from('users')
                .select('id')
                .ilike('email', '%@testmail.io');

            if (testUsersError) {
                console.error('Error fetching test users:', testUsersError);
                throw testUsersError;
            }

            testUserIds = testUsers.map(user => user.id);

            if (testUserIds.length === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'No test users found',
                    affectedUsers: 0
                });
            }
        }

        // Clear friend requests
        let requestsQuery = supabase.from('friend_requests').delete();

        if (testUsersOnly) {
            requestsQuery = requestsQuery.or(`sender_id.in.(${testUserIds.join(',')}),receiver_id.in.(${testUserIds.join(',')})`);
        } else if (userId) {
            requestsQuery = requestsQuery.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        } else {
            requestsQuery = requestsQuery.neq('id', 'placeholder'); // Delete all rows
        }

        const { error: requestsError } = await requestsQuery;

        if (requestsError) {
            console.error('Error clearing friend requests:', requestsError);
            throw requestsError;
        }

        // Clear friendships
        let friendsQuery = supabase.from('friends').delete();

        if (testUsersOnly) {
            friendsQuery = friendsQuery.or(`user_id.in.(${testUserIds.join(',')}),friend_id.in.(${testUserIds.join(',')})`);
        } else if (userId) {
            friendsQuery = friendsQuery.or(`user_id.eq.${userId},friend_id.eq.${userId}`);
        } else {
            friendsQuery = friendsQuery.neq('id', 'placeholder'); // Delete all rows
        }

        const { error: friendsError } = await friendsQuery;

        if (friendsError) {
            console.error('Error clearing friendships:', friendsError);
            throw friendsError;
        }

        // Clear social notifications
        let notificationsQuery = supabase
            .from('notifications')
            .delete()
            .in('type', ['friend_request', 'friend_request_accepted']);

        if (testUsersOnly) {
            notificationsQuery = notificationsQuery.or(`sender_id.in.(${testUserIds.join(',')}),receiver_id.in.(${testUserIds.join(',')})`);
        } else if (userId) {
            notificationsQuery = notificationsQuery.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        }

        const { error: notificationsError } = await notificationsQuery;

        if (notificationsError) {
            console.error('Error clearing notifications:', notificationsError);
            throw notificationsError;
        }

        return NextResponse.json({
            success: true,
            affectedUsers: testUsersOnly ? testUserIds.length : null
        });

    } catch (error) {
        console.error('Error clearing social data:', error);
        return NextResponse.json({
            error: 'Failed to clear social data',
            details: error.message
        }, { status: 500 });
    }
} 