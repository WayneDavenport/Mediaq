import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import supabase from '@/lib/supabaseClient';

export async function PUT(request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const {
            id,
            completed_duration,
            completed,
            episodes_completed,
            pages_completed
        } = await request.json();

        const updateData = {
            completed_duration,
            completed
        };

        // Add media-specific completion tracking
        if (episodes_completed !== undefined) {
            updateData.episodes_completed = episodes_completed;
        }
        if (pages_completed !== undefined) {
            updateData.pages_completed = pages_completed;
        }

        const { error } = await supabase
            .from('user_media_progress')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
} 