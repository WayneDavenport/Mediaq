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
            pages_completed,
            initial_pages,
            media_type,
            category
        } = await request.json();

        // Calculate differences
        const timeDiff = completed_duration - initial_duration;
        const pagesDiff = pages_completed - initial_pages;

        console.log('Progress update:', {
            initial: {
                duration: initial_duration,
                pages: initial_pages
            },
            new: {
                duration: completed_duration,
                pages: pages_completed
            },
            differences: {
                timeDiff,
                pagesDiff
            }
        });

        // First, update the progress for the current item
        const updateData = {
            completed_duration,
            completed
        };

        if (media_type === 'book') {
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
        const newlyCompletedItems = [];

        // Update each locked item's completion tracking
        for (const lockedItem of lockedItems) {
            if (lockedItem.completed) {
                console.log(`Skipping already completed lock: ${lockedItem.id} for item ${lockedItem.media_items?.title}`);
                continue;
            }

            console.log('Processing lock:', {
                lockId: lockedItem.id,
                currentProgress: {
                    time: lockedItem.completed_time || 0,
                    pages: lockedItem.pages_completed || 0
                },
                keyParentId: lockedItem.key_parent_id,
                keyParentText: lockedItem.key_parent_text,
                triggeringItemId: id,
                triggeringMediaType: media_type,
                triggeringCategory: category,
            });

            const lockUpdateData = {};
            let relevantDiff = false;

            if (lockedItem.key_parent_id === id) {
                relevantDiff = true;
                if (media_type === 'book') {
                    lockUpdateData.pages_completed = pages_completed;
                    lockUpdateData.completed_time = completed_duration;
                } else {
                    lockUpdateData.completed_time = completed_duration;
                }
            } else if (lockedItem.lock_type === 'media_type' && lockedItem.key_parent_text === media_type) {
                relevantDiff = true;
                if (media_type === 'book') {
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + pagesDiff;
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                } else {
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                }
            } else if (lockedItem.lock_type === 'category' && lockedItem.key_parent_text === category) {
                relevantDiff = true;
                if (media_type === 'book') {
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + pagesDiff;
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                } else {
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                }
            }

            if (!relevantDiff) {
                console.log(`Skipping irrelevant lock update for lock ID: ${lockedItem.id}`);
                continue;
            }

            console.log('Lock update calculation:', {
                lockId: lockedItem.id,
                newValues: lockUpdateData,
                goalPages: lockedItem.goal_pages,
                goalTime: lockedItem.goal_time
            });

            const isNowCompleted = media_type === 'book' && lockedItem.goal_pages > 0
                ? (lockUpdateData.pages_completed >= lockedItem.goal_pages)
                : lockedItem.goal_time > 0
                    ? (lockUpdateData.completed_time >= lockedItem.goal_time)
                    : false;

            lockUpdateData.completed = isNowCompleted;
            if (isNowCompleted) {
                lockUpdateData.lock_completed_timestampz = new Date().toISOString();
            }

            const { error: lockUpdateError } = await supabase
                .from('locked_items')
                .update(lockUpdateData)
                .eq('id', lockedItem.id)
                .eq('user_id', session.user.id);

            if (lockUpdateError) throw lockUpdateError;

            if (isNowCompleted) {
                newlyCompletedItems.push({
                    title: lockedItem.media_items.title,
                    completed: true
                });
            }
        }

        return NextResponse.json({
            success: true,
            affectedItems: newlyCompletedItems
        });

    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress', details: error.message },
            { status: 500 }
        );
    }
} 