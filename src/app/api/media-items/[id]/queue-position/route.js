import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function PUT(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { position } = await request.json();
        const itemId = params.id;

        // Get all user's items sorted by queue number
        const { data: items, error: fetchError } = await supabase
            .from('user_media_progress')
            .select('id, queue_number')
            .eq('user_id', session.user.id)
            .order('queue_number', { ascending: true });

        if (fetchError) throw fetchError;

        let newQueueNumber;
        let updatesPromises = [];

        if (position === 'top') {
            // Move to position 1 and shift others down
            newQueueNumber = 1;
            updatesPromises = items.map((item) =>
                supabase
                    .from('user_media_progress')
                    .update({
                        queue_number: item.id === itemId ? 1 : item.queue_number + 1
                    })
                    .eq('id', item.id)
            );

        } else if (position === 'bottom') {
            // Get current position of the item
            const currentItem = items.find(item => item.id === itemId);
            if (!currentItem) throw new Error('Item not found');

            const currentPosition = currentItem.queue_number;
            console.log('Moving item from position:', currentPosition, 'to bottom:', items.length);

            // Move to last position and shift others up
            updatesPromises = items.map((item) => {
                let newPosition = item.queue_number;

                if (item.id === itemId) {
                    // Target item goes to bottom
                    newPosition = items.length;
                } else if (item.queue_number > currentPosition && item.queue_number <= items.length) {
                    // Only items between current position and target position move down
                    newPosition = item.queue_number - 1;
                }
                // All other items stay the same

                console.log(`Item ${item.id}: ${item.queue_number} -> ${newPosition}`);

                return supabase
                    .from('user_media_progress')
                    .update({ queue_number: newPosition })
                    .eq('id', item.id);
            });

        } else if (typeof position === 'number') {
            // Validate position
            if (position < 1 || position > items.length) {
                return NextResponse.json(
                    { error: `Position must be between 1 and ${items.length}` },
                    { status: 400 }
                );
            }

            const currentItem = items.find(item => item.id === itemId);
            const currentPosition = currentItem?.queue_number;

            // Reorder items
            items.forEach((item) => {
                let newPosition = item.queue_number;

                if (position > currentPosition) {
                    // Moving down
                    if (item.queue_number > currentPosition && item.queue_number <= position) {
                        newPosition--;
                    }
                } else {
                    // Moving up
                    if (item.queue_number >= position && item.queue_number < currentPosition) {
                        newPosition++;
                    }
                }

                if (item.id === itemId) {
                    newPosition = position;
                }

                updatesPromises.push(
                    supabase
                        .from('user_media_progress')
                        .update({ queue_number: newPosition })
                        .eq('id', item.id)
                );
            });
        }

        // Execute all updates
        if (updatesPromises.length > 0) {
            await Promise.all(updatesPromises);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error updating queue position:', error);
        return NextResponse.json(
            { error: 'Failed to update queue position' },
            { status: 500 }
        );
    }
} 