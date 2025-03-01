import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// DELETE a specific notification
export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify the notification belongs to the current user before deleting
        const { data: notification, error: fetchError } = await supabase
            .from('notifications')
            .select('*')
            .eq('id', id)
            .eq('receiver_id', session.user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching notification:', fetchError);
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        // Delete the notification
        const { error: deleteError } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('receiver_id', session.user.id);

        if (deleteError) {
            console.error('Error deleting notification:', deleteError);
            return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in notification deletion:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Mark a notification as read
export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update the notification to mark as read
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('receiver_id', session.user.id);

        if (error) {
            console.error('Error marking notification as read:', error);
            return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error in notification update:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 