import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function POST(request) {
    const session = await getServerSession(authOptions);

    // Log session data to see what we're getting
    console.log('Session data:', {
        user: session?.user,
        email: session?.user?.email,
    });

    // Check if user is authenticated and has the admin email
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'No user email found' }, { status: 401 });
    }

    // Add your Google email as admin
    const ADMIN_EMAILS = [
        'wayne86davenport@gmail.com'  // Your Google email
    ];

    if (!ADMIN_EMAILS.includes(session.user.email)) {
        return NextResponse.json({
            error: 'Unauthorized',
            userEmail: session.user.email
        }, { status: 401 });
    }

    try {
        // Get all items, ordered by user_id, queue_number, and created_at
        const { data: allItems, error: fetchError } = await supabase
            .from('user_media_progress')
            .select('id, queue_number, created_at, user_id')
            .order('user_id', { ascending: true })
            .order('queue_number', { ascending: true, nullsLast: true })
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        let updatedCount = 0;
        let currentNumber = 1;
        let currentUserId = null;

        // Update each item with sequential numbers, resetting for each user
        for (const item of allItems) {
            // Reset counter when switching to a new user
            if (currentUserId !== item.user_id) {
                currentNumber = 1;
                currentUserId = item.user_id;
            }

            if (item.queue_number !== currentNumber) {
                const { error: updateError } = await supabase
                    .from('user_media_progress')
                    .update({ queue_number: currentNumber })
                    .eq('id', item.id);

                if (updateError) throw updateError;
                updatedCount++;
            }
            currentNumber++;
        }

        const uniqueUsers = new Set(allItems.map(item => item.user_id)).size;

        return NextResponse.json({
            success: true,
            updatedCount,
            totalItems: allItems.length,
            usersFixed: uniqueUsers
        });

    } catch (error) {
        console.error('Error fixing queue numbers:', error);
        return NextResponse.json(
            { error: 'Failed to fix queue numbers' },
            { status: 500 }
        );
    }
} 