'use client';

import { Badge } from "@/components/ui/badge";

export default function ProgressDisplay({ item }) {
    const isLocked = item.locked_items && item.locked_items.length > 0;
    const lockData = isLocked ? item.locked_items[0] : null;

    const getProgressDisplay = () => {
        if (isLocked) {
            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">Lock Progress</h3>
                        <Badge variant="secondary">Locked</Badge>
                    </div>

                    <div>
                        <span className="font-semibold">Locked Behind:</span> {
                            lockData.key_parent_id !== null
                                ? lockData.parent?.title
                                : lockData.key_parent_text
                        }
                    </div>

                    <div>
                        <span className="font-semibold">Time Completed:</span> {lockData.completed_time || 0} minutes
                    </div>

                    {item.media_type === 'book' && (
                        <>
                            <div>
                                <span className="font-semibold">Pages Read:</span> {lockData.pages_completed || 0}
                                {lockData.goal_pages && (
                                    <span> / {lockData.goal_pages} pages</span>
                                )}
                            </div>
                        </>
                    )}

                    {item.media_type === 'tv' && (
                        <>
                            <div>
                                <span className="font-semibold">Episodes Watched:</span> {lockData.episodes_completed || 0}
                                {lockData.goal_episodes && (
                                    <span> / {lockData.goal_episodes} episodes</span>
                                )}
                            </div>
                        </>
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
                <h3 className="text-lg font-semibold">Progress</h3>

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