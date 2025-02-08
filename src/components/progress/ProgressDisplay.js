'use client';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ProgressDisplay({ item, onUpdateClick, mediaItems = [] }) {
    console.log('Item in ProgressDisplay:', JSON.stringify(item, null, 2));
    const isLocked = item.locked_items && item.locked_items.length > 0;
    const lockData = isLocked ? item.locked_items[0] : null;

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
            return (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">Lock Progress</h3>
                            <Badge variant="secondary">Locked</Badge>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateClick(item)}
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

        // Regular progress display for unlocked items
        return (
            <div className="space-y-2">
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