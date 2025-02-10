import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// Get comments for a media item
export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mediaItemId = searchParams.get('mediaItemId');

    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select(`
                *,
                user:users(id, username),
                replies:comment_replies(
                    id,
                    content,
                    created_at,
                    user:users(id, username)
                )
            `)
            .eq('media_item_id', mediaItemId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ comments });
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// Create a new comment
export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { media_item_id, content } = await request.json();

        const { data: comment, error } = await supabase
            .from('comments')
            .insert({
                media_item_id,
                content,
                user_id: session.user.id
            })
            .select(`
                *,
                user:users(
                    id,
                    username,
                    email
                    
                )
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ comment });
    } catch (error) {
        console.error('Error creating comment:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
} 