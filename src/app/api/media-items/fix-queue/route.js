import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // First, get all items with null queue_number, ordered by created_at
        const { data: nullQueueItems, error: fetchError } = await supabase
            .from('user_media_progress')
            .select('id, created_at')
            .is('queue_number', null)
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        // Get the highest existing queue number
        const { data: maxQueueData, error: maxQueueError } = await supabase
            .from('user_media_progress')
            .select('queue_number')
            .not('queue_number', 'is', null)
            .order('queue_number', { ascending: false })
            .limit(1);

        if (maxQueueError) throw maxQueueError;

        // Start numbering after the highest existing number, or at 1 if no existing numbers
        let nextNumber = maxQueueData && maxQueueData.length > 0
            ? maxQueueData[0].queue_number + 1
            : 1;

        // Update each item with a new queue number
        for (const item of nullQueueItems) {
            const { error: updateError } = await supabase
                .from('user_media_progress')
                .update({ queue_number: nextNumber })
                .eq('id', item.id);

            if (updateError) throw updateError;
            nextNumber++;
        }

        return NextResponse.json({
            success: true,
            updatedCount: nullQueueItems.length
        });

    } catch (error) {
        console.error('Error fixing queue numbers:', error);
        return NextResponse.json(
            { error: 'Failed to fix queue numbers' },
            { status: 500 }
        );
    }
} 