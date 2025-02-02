import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// Get comments for a media item
export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const mediaItemId = new URL(request.url).searchParams.get('mediaItemId');
        if (!mediaItemId) {
            return NextResponse.json(
                { error: 'Media item ID is required' },
                { status: 400 }
            );
        }

        // Fetch comments with user info and replies
        const { data: comments, error: commentsError } = await supabase
            .from('comments')
            .select(`
                *,
                user:user_id (
                    id,
                    username
                ),
                replies:comment_replies (
                    id,
                    created_at,
                    content,
                    user:user_id (
                        id,
                        username
                    )
                )
            `)
            .eq('media_item_id', mediaItemId)
            .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        return NextResponse.json({ comments });

    } catch (error) {
        console.error('Get comments error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch comments' },
            { status: 500 }
        );
    }
}

// Create a new comment
export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { media_item_id, content } = await request.json();

        if (!media_item_id || !content) {
            return NextResponse.json(
                { error: 'Media item ID and content are required' },
                { status: 400 }
            );
        }

        // Create the comment
        const { data: comment, error: insertError } = await supabase
            .from('comments')
            .insert({
                media_item_id,
                user_id: session.user.id,
                content
            })
            .select(`
                *,
                user:user_id (
                    id,
                    username
                )
            `)
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            message: 'Comment created successfully',
            comment: { ...comment, replies: [] }
        });

    } catch (error) {
        console.error('Create comment error:', error);
        return NextResponse.json(
            { error: 'Failed to create comment' },
            { status: 500 }
        );
    }
} 