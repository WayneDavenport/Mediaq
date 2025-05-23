'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProgressDisplay({ item, onUpdateClick, mediaItems = [] }) {
    console.log('Item in ProgressDisplay:', JSON.stringify(item, null, 2));
    // Convert locked_items to array if it's an object
    const normalizedLockedItems = item.locked_items && !Array.isArray(item.locked_items)
        ? [item.locked_items]
        : item.locked_items;

    const isLocked = normalizedLockedItems && normalizedLockedItems.length > 0;
    const lockData = isLocked ? normalizedLockedItems[0] : null;

    const capitalizeFirstLetter = (string) => {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const shouldShowBookGoals = () => {
        if (!lockData) return false;
        return (
            item.media_type === 'book' ||
            (lockData.key_parent_text === 'book' && !lockData.key_parent_id)
        );
    };

    const getParentTitle = (parentId) => {
        if (!mediaItems) return 'Unknown';
        const parentItem = mediaItems.find(item => item.id === parentId);
        return parentItem?.title || 'Unknown';
    };

    const getProgressDisplay = () => {
        if (isLocked) {
            // Don't show lock info if it's completed
            if (lockData.completed) {
                return getRegularProgressDisplay();
            }

            return (
                <div className="space-y-2 shadow-[0_0_20px_-1px_rgba(255,0,0,0.6)]  rounded-lg p-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">Lock Progress</h3>
                            <Badge variant="destructive">Locked</Badge>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateClick(item)}
                            disabled={true}
                            className="opacity-50 cursor-not-allowed shadow-[0_0_10px_-1px_rgba(255,0,0,0.4)]"
                        >
                            Update Progress
                        </Button>
                    </div>

                    <div>
                        <span className="font-semibold">Locked Behind:</span> {
                            lockData.key_parent_id !== null
                                ? getParentTitle(lockData.key_parent_id)
                                : capitalizeFirstLetter(lockData.key_parent_text)
                        }
                    </div>

                    <div>
                        <span className="font-semibold">Time Completed:</span> {lockData.completed_time || 0} minutes
                    </div>

                    {shouldShowBookGoals() && (
                        <div>
                            <span className="font-semibold">Pages Read:</span> {lockData.pages_completed || 0}
                            {lockData.goal_pages && (
                                <span> / {lockData.goal_pages} pages</span>
                            )}
                        </div>
                    )}

                    {lockData.goal_time && (
                        <div>
                            <span className="font-semibold">Time Goal:</span> {lockData.goal_time} minutes
                        </div>
                    )}
                </div>
            );
        }

        return getRegularProgressDisplay();
    };

    const getRegularProgressDisplay = () => {
        // Regular progress display for unlocked items
        return (
            <div className="space-y-2 p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Progress</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateClick(item)}
                    >
                        Update Progress
                    </Button>
                </div>

                {item.media_type === 'book' && (
                    <>
                        <div>
                            <span className="font-semibold">Pages Read:</span> {
                                item.user_media_progress?.pages_completed || 0
                            } / {item.books?.page_count || '?'} pages
                        </div>
                        <div>
                            <span className="font-semibold">Estimated Time:</span> {
                                Math.round((item.user_media_progress?.duration || 0) / 60)
                            } hours
                        </div>
                    </>
                )}

                {item.media_type === 'movie' && (
                    <div>
                        <span className="font-semibold">Watched:</span> {
                            item.user_media_progress?.completed_duration || 0
                        } / {item.user_media_progress?.duration || item.movies?.runtime || '?'} minutes
                    </div>
                )}

                {item.media_type === 'tv' && (
                    <>
                        <div>
                            <span className="font-semibold">Episodes Watched:</span> {
                                item.user_media_progress?.episodes_completed || 0
                            } / {item.tv_shows?.total_episodes || '?'}
                        </div>
                        <div>
                            <span className="font-semibold">Time Watched:</span> {
                                item.user_media_progress?.completed_duration || 0
                            } / {item.user_media_progress?.duration || '?'} minutes
                        </div>
                    </>
                )}

                {item.media_type === 'game' && (
                    <div>
                        <span className="font-semibold">Time Played:</span> {
                            Math.round((item.user_media_progress?.completed_duration || 0) / 60)
                        } / {
                            Math.round((item.user_media_progress?.duration || 0) / 60)
                        } hours
                    </div>
                )}

                {item.media_type === 'task' && (
                    <>
                        <div>
                            <span className="font-semibold">{item.tasks?.unit_name ? capitalizeFirstLetter(item.tasks.unit_name) : 'Units'} Completed:</span> {
                                item.user_media_progress?.units_completed || 0
                            } / {item.tasks?.unit_range || '?'} {item.tasks?.unit_name || 'units'}
                        </div>
                        <div>
                            <span className="font-semibold">Time Spent:</span> {
                                item.user_media_progress?.completed_duration || 0
                            } / {item.user_media_progress?.duration || '?'} minutes
                        </div>
                    </>
                )}

                <div>
                    <span className="font-semibold">Status:</span> {
                        item.user_media_progress?.completed ? 'Completed' : 'In Progress'
                    }
                </div>
            </div>
        );
    };

    return getProgressDisplay();
} 