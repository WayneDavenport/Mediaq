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
                media_items (
                    id,
                    title,
                    media_type
                ),
                comments (
                    id,
                    content,
                    user:users (username)
                ),
                comment_replies (
                    id,
                    content,
                    user:users (username)
                )
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
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
            .in('id', notificationIds);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating notifications:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
} 