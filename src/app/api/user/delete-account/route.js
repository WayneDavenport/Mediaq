import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { confirmationEmail } = await request.json();

        // Verify the email matches
        if (confirmationEmail !== session.user.email) {
            return NextResponse.json(
                { error: 'Email does not match. Account deletion cancelled.' },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        // Delete all user data in order (respecting foreign key constraints)
        // Using service role client to bypass RLS for cleanup

        // 1. Delete comments made by the user
        const { error: commentsError } = await supabase
            .from('comments')
            .delete()
            .eq('user_id', userId);

        if (commentsError) {
            console.error('Error deleting comments:', commentsError);
            throw new Error('Failed to delete user comments');
        }

        // 2. Delete user recommendations (both sent and received)
        const { error: recommendationsError } = await supabase
            .from('user_recommendations')
            .delete()
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (recommendationsError) {
            console.error('Error deleting recommendations:', recommendationsError);
            throw new Error('Failed to delete user recommendations');
        }

        // 3. Delete notifications (both sent and received)
        const { error: notificationsError } = await supabase
            .from('notifications')
            .delete()
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (notificationsError) {
            console.error('Error deleting notifications:', notificationsError);
            throw new Error('Failed to delete user notifications');
        }

        // 4. Delete friend requests (both sent and received)
        const { error: friendRequestsError } = await supabase
            .from('friend_requests')
            .delete()
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

        if (friendRequestsError) {
            console.error('Error deleting friend requests:', friendRequestsError);
            throw new Error('Failed to delete friend requests');
        }

        // 5. Delete friendships (both directions)
        const { error: friendsError } = await supabase
            .from('friends')
            .delete()
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

        if (friendsError) {
            console.error('Error deleting friends:', friendsError);
            throw new Error('Failed to delete friendships');
        }

        // 6. Delete tasks
        const { error: tasksError } = await supabase
            .from('tasks')
            .delete()
            .eq('user_id', userId);

        if (tasksError) {
            console.error('Error deleting tasks:', tasksError);
            throw new Error('Failed to delete user tasks');
        }

        // 7. Delete user media progress
        const { error: progressError } = await supabase
            .from('user_media_progress')
            .delete()
            .eq('user_id', userId);

        if (progressError) {
            console.error('Error deleting progress:', progressError);
            throw new Error('Failed to delete user progress');
        }

        // 8. Delete locked items
        const { error: lockedItemsError } = await supabase
            .from('locked_items')
            .delete()
            .eq('user_id', userId);

        if (lockedItemsError) {
            console.error('Error deleting locked items:', lockedItemsError);
            throw new Error('Failed to delete locked items');
        }

        // 9. Delete media items
        const { error: mediaItemsError } = await supabase
            .from('media_items')
            .delete()
            .eq('user_id', userId);

        if (mediaItemsError) {
            console.error('Error deleting media items:', mediaItemsError);
            throw new Error('Failed to delete media items');
        }

        // 10. Finally, delete the user account
        const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (userError) {
            console.error('Error deleting user:', userError);
            throw new Error('Failed to delete user account');
        }

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Account deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete account' },
            { status: 500 }
        );
    }
}
