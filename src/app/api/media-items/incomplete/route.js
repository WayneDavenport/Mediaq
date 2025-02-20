import { NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { data, error } = await supabase
            .from('media_items')
            .select(`
                *,
                user_media_progress(*),
                books(*),
                movies(*),
                tv_shows(*),
                games(*)
            `)
            .eq('user_email', session.user.email)
            .eq('user_media_progress.completed', false);

        if (error) throw error;

        return NextResponse.json({ items: data });

    } catch (error) {
        console.error('Error fetching incomplete items:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incomplete items' },
            { status: 500 }
        );
    }
}