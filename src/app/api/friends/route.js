import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all friends for the current user
        const { data: friends, error } = await supabase
            .from('friends')
            .select(`
                friend_id,
                friend_user_name
            `)
            .eq('user_id', session.user.id);

        if (error) throw error;

        return NextResponse.json({ friends });

    } catch (error) {
        console.error('Error fetching friends:', error);
        return NextResponse.json(
            { error: 'Failed to fetch friends' },
            { status: 500 }
        );
    }
} 