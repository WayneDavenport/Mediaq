import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select(`
                *,
                user:users!notifications_sender_id_fkey (
                    id,
                    username
                )
            `)
            .eq('receiver_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Raw notifications:', notifications);

        // No need to format, just return the data with the joined user information
        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// Mark notifications as read
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { notificationIds } = await request.json();

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .in('id', notificationIds)
            .eq('receiver_id', session.user.id); // Ensure user can only mark their own notifications

        if (error) throw error;

        return NextResponse.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notifications as read' },
            { status: 500 }
        );
    }
} 