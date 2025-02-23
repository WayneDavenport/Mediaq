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
        // Get the highest queue number for this specific user
        const { data, error } = await supabase
            .from('user_media_progress')
            .select('queue_number')
            .eq('user_id', session.user.id)  // Filter by user_id
            .order('queue_number', { ascending: false })
            .limit(1);

        if (error) throw error;

        // If no items in queue for this user, start at 1, otherwise increment highest number
        const nextQueueNumber = data && data.length > 0 && data[0].queue_number
            ? data[0].queue_number + 1
            : 1;

        console.log('Generated next queue number for user:', {
            userId: session.user.id,
            nextQueueNumber
        });

        return NextResponse.json({ nextQueueNumber });
    } catch (error) {
        console.error('Error getting next queue number:', error);
        return NextResponse.json(
            { error: 'Failed to get next queue number' },
            { status: 500 }
        );
    }
} 