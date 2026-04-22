import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createUserSupabaseClient } from '@/lib/supabaseUserClient';

// PUT request to update user settings
export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createUserSupabaseClient(session.user.id, session.user.email);

    try {
        const { username, reading_speed, first_name, last_name } = await request.json();

        // Update user in database
        const { data, error } = await supabase
            .from('users')
            .update({
                username,
                reading_speed,
                first_name,
                last_name,
            })
            .eq('id', session.user.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Failed to update settings' },
            { status: 500 }
        );
    }
}
