import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

// Create a reply to a comment
export async function POST(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { commentId } = params;
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json(
                { error: 'Content is required' },
                { status: 400 }
            );
        }

        // Verify the comment exists
        const { data: comment, error: commentError } = await supabase
            .from('comments')
            .select()
            .eq('id', commentId)
            .single();

        if (commentError) {
            return NextResponse.json(
                { error: 'Comment not found' },
                { status: 404 }
            );
        }

        // Create the reply
        const { data: reply, error: insertError } = await supabase
            .from('comment_replies')
            .insert({
                comment_id: commentId,
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
            message: 'Reply created successfully',
            reply
        });

    } catch (error) {
        console.error('Create reply error:', error);
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        );
    }
} 