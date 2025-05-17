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
            units_completed,
            initial_units,
            media_type,
            category
        } = await request.json();

        // Calculate differences
        const timeDiff = completed_duration - initial_duration;
        const pagesDiff = pages_completed - initial_pages;
        const unitsDiff = (units_completed || 0) - (initial_units || 0);

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
        if (media_type === 'task') {
            updateData.units_completed = units_completed;
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
                } else if (media_type === 'task') {
                    lockUpdateData.pages_completed = units_completed;
                    lockUpdateData.completed_time = completed_duration;
                } else {
                    lockUpdateData.completed_time = completed_duration;
                }
            } else if (lockedItem.lock_type === 'media_type' && lockedItem.key_parent_text === media_type) {
                relevantDiff = true;
                if (media_type === 'book') {
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + pagesDiff;
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                } else if (media_type === 'task') {
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + unitsDiff;
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                } else {
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                }
            } else if (lockedItem.lock_type === 'category' && lockedItem.key_parent_text === category) {
                relevantDiff = true;
                if (media_type === 'book') {
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + pagesDiff;
                    lockUpdateData.completed_time = (lockedItem.completed_time || 0) + timeDiff;
                } else if (media_type === 'task') {
                    lockUpdateData.pages_completed = (lockedItem.pages_completed || 0) + unitsDiff;
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
                goalTime: lockedItem.goal_time,
                goalUnits: lockedItem.goal_units
            });

            let isNowCompleted = false;
            if (media_type === 'book' && lockedItem.goal_pages > 0) {
                isNowCompleted = lockUpdateData.pages_completed >= lockedItem.goal_pages;
            } else if (media_type === 'task' && lockedItem.goal_units > 0) {
                isNowCompleted = lockUpdateData.pages_completed >= lockedItem.goal_units;
            } else if (lockedItem.goal_time > 0) {
                isNowCompleted = lockUpdateData.completed_time >= lockedItem.goal_time;
            }

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

        // Fetch the updated primary media item with all its details
        const { data: updatedItemData, error: fetchError } = await supabase
            .from('media_items')
            .select(`
                *,
                locked_items!locked_items_id_fkey(*),
                user_media_progress!user_media_progress_id_fkey(*),
                books(*),
                movies(*),
                tv_shows(*),
                games(*),
                tasks(*)
            `)
            .eq('id', id) // 'id' here is the media_item_id from the request body
            .eq('user_id', session.user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching updated item after progress update:', fetchError);
            // If fetching fails, we might still want to return a success status but indicate item couldn't be fetched
            // For now, let's re-throw to indicate a problem post-update.
            throw fetchError;
        }

        if (!updatedItemData) {
            // This case should ideally not happen if the progress update above succeeded
            return NextResponse.json({ error: 'Updated item not found after progress update' }, { status: 404 });
        }

        // Normalize the fetched item before returning
        const transformedItem = {
            ...updatedItemData,
            locked_items: updatedItemData.locked_items ? (Array.isArray(updatedItemData.locked_items) ? updatedItemData.locked_items : [updatedItemData.locked_items]) : [],
            user_media_progress: Array.isArray(updatedItemData.user_media_progress) ? updatedItemData.user_media_progress[0] : updatedItemData.user_media_progress,
            books: Array.isArray(updatedItemData.books) ? updatedItemData.books[0] : updatedItemData.books,
            movies: Array.isArray(updatedItemData.movies) ? updatedItemData.movies[0] : updatedItemData.movies,
            tv_shows: Array.isArray(updatedItemData.tv_shows) ? updatedItemData.tv_shows[0] : updatedItemData.tv_shows,
            games: Array.isArray(updatedItemData.games) ? updatedItemData.games[0] : updatedItemData.games,
            tasks: Array.isArray(updatedItemData.tasks) ? updatedItemData.tasks[0] : updatedItemData.tasks,
        };

        return NextResponse.json({
            success: true,
            // The primary item that was updated, with all its fresh details
            updatedItem: transformedItem,
            // You can still include newlyCompletedItems if the frontend needs this specific list explicitly
            newlyUnlockedItems: newlyCompletedItems
        });

    } catch (error) {
        console.error('Error updating progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress', details: error.message },
            { status: 500 }
        );
    }
} 