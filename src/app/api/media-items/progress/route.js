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
            initial_duration,
            completed,
            episodes_completed,
            initial_episodes,
            pages_completed,
            initial_pages,
            media_type,
            category
        } = await request.json();

        // Calculate progress differences
        const timeDiff = completed_duration - initial_duration;
        const episodesDiff = episodes_completed - initial_episodes;
        const pagesDiff = pages_completed - initial_pages;

        // First, update the progress for the current item
        const updateData = {
            completed_duration,
            completed
        };

        if (episodes_completed !== undefined) {
            updateData.episodes_completed = episodes_completed;
        }
        if (pages_completed !== undefined) {
            updateData.pages_completed = pages_completed;
        }

        const { error: progressError } = await supabase
            .from('user_media_progress')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', session.user.id);

        if (progressError) throw progressError;

        // Fetch any locked items that need to be updated
        const { data: lockedItems, error: lockFetchError } = await supabase
            .from('locked_items')
            .select(`
                *,
                media_items!locked_items_id_fkey (
                    id,
                    title,
                    media_type,
                    category
                )
            `)
            .or(`key_parent_id.eq.${id},key_parent_text.eq.${media_type},key_parent_text.eq.${category}`)
            .eq('user_id', session.user.id);

        if (lockFetchError) throw lockFetchError;

        const affectedItems = [];

        // Update each locked item's completion tracking
        for (const lockedItem of lockedItems) {
            const lockUpdateData = {
                completed_time: (lockedItem.completed_time || 0) + timeDiff
            };

            // Add media-specific progress tracking
            let progressValue = timeDiff;
            switch (media_type) {
                case 'book':
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + pagesDiff;
                    progressValue = pagesDiff;
                    break;
                case 'tv':
                    lockUpdateData.episodes_completed = (lockedItem.episodes_completed || 0) + episodesDiff;
                    progressValue = episodesDiff;
                    break;
            }

            // Update the locked item
            const { error: lockUpdateError } = await supabase
                .from('locked_items')
                .update(lockUpdateData)
                .eq('id', lockedItem.id)
                .eq('user_id', session.user.id);

            if (lockUpdateError) throw lockUpdateError;

            // Add to affected items list
            affectedItems.push({
                title: lockedItem.media_items.title,
                progress: progressValue
            });
        }

        return NextResponse.json({
            success: true,
            affectedItems: affectedItems
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
} 