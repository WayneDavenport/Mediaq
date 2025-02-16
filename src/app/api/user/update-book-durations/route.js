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
        const { reading_speed } = await request.json();

        // First, get all book media items for the user
        const { data: books, error: fetchError } = await supabase
            .from('media_items')
            .select(`
                id,
                books!inner(page_count),
                user_media_progress!inner(completed)
            `)
            .eq('user_id', session.user.id)
            .eq('media_type', 'book')
            .eq('user_media_progress.completed', false);

        if (fetchError) throw fetchError;

        // Update durations for each book
        const updates = books.map(book => ({
            id: book.id,
            user_id: session.user.id,
            duration: Math.round(book.books.page_count / reading_speed)
        }));

        const { error: updateError } = await supabase
            .from('user_media_progress')
            .upsert(
                updates.map(update => ({
                    id: update.id,
                    user_id: update.user_id,
                    duration: update.duration
                }))
            );

        if (updateError) throw updateError;

        return NextResponse.json({ success: true, updatedCount: updates.length });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Failed to update book durations' },
            { status: 500 }
        );
    }
} 