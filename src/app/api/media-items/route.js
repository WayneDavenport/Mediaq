import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await request.json();

        // First, insert the media item
        const { data: mediaItem, error: mediaError } = await supabase
            .from('media_items')
            .insert({
                title: data.title,
                media_type: data.media_type,
                category: data.category,
                duration: data.duration,
                completed_duration: 0,
                percent_complete: 0,
                completed: false,
                description: data.description,
                poster_path: data.poster_path,
                backdrop_path: data.backdrop_path,
                queue_number: null,
                additional: data.additional,
                user_email: session.user.email,
            })
            .select()
            .single();

        if (mediaError) throw mediaError;

        // If the item should be locked, create a lock
        if (data.locked && mediaItem) {
            const lockData = {
                locked_item: mediaItem.id,
                key_parent: data.key_parent,
                key_item: data.key_item || null,
                goal_time: data.goal_time || null,
                goal_pages: data.goal_pages || null,
                goal_episodes: data.goal_episodes || null,
                time_complete: 0,
                percent_complete: 0,
                pages_complete: 0,
                episodes_complete: 0,
            };

            const { error: lockError } = await supabase
                .from('locked_item')
                .insert(lockData);

            if (lockError) throw lockError;
        }

        return NextResponse.json({ success: true, data: mediaItem });

    } catch (error) {
        console.error('Error creating media item:', error);
        return NextResponse.json(
            { error: 'Failed to create media item' },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const mediaType = searchParams.get('mediaType');

    try {
        let query = supabase
            .from('media_items')
            .select(`
                *,
                locked_item (*)
            `)
            .eq('user_email', session.user.email);

        if (category) {
            query = query.eq('category', category);
        }

        if (mediaType) {
            query = query.eq('media_type', mediaType);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ items: data });

    } catch (error) {
        console.error('Error fetching media items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch media items' },
            { status: 500 }
        );
    }
}