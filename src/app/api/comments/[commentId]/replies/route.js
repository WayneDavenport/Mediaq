import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Create a reply to a comment
export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content } = await request.json();
        const replyId = uuidv4(); // Generate UUID for new reply

        const { data: reply, error } = await supabase
            .from('comment_replies')
            .insert({
                id: replyId,
                comment_id: params.commentId,
                content,
                user_id: session.user.id
            })
            .select(`
                *,
                user:users(
                    id,
                    username
                )
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ reply });
    } catch (error) {
        console.error('Error creating reply:', error);
        return NextResponse.json(
            { error: 'Failed to create reply' },
            { status: 500 }
        );
    }
} 