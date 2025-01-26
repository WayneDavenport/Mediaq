'use client';

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function UpdateProgressModal({
    isOpen,
    onClose,
    item,
    onUpdate
}) {
    const [progress, setProgress] = useState(item.user_media_progress?.completed_duration || 0);

    const getMaxValue = () => {
        switch (item.media_type) {
            case 'book':
                return item.books?.page_count || 0;
            case 'movie':
                return item.user_media_progress?.duration || item.movies?.runtime || 0;
            case 'tv':
                return item.user_media_progress?.duration || 0;
            case 'game':
                return item.user_media_progress?.duration || 0;
            default:
                return 100;
        }
    };

    const getDisplayValue = () => {
        const max = getMaxValue();
        const percentage = max > 0 ? Math.round((progress / max) * 100) : 0;

        switch (item.media_type) {
            case 'book':
                return `${progress} pages (${percentage}%)`;
            case 'movie':
                return `${progress} minutes (${percentage}%)`;
            case 'tv':
                const episodes = Math.floor(progress / (item.tv_shows?.average_runtime || 30));
                return `${episodes} episodes - ${progress} minutes (${percentage}%)`;
            case 'game':
                const hours = (progress / 60).toFixed(1);
                return `${hours} hours (${percentage}%)`;
            default:
                return `${percentage}%`;
        }
    };

    const handleUpdate = async () => {
        try {
            const updateData = {
                id: item.id,
                completed_duration: progress,
                completed: progress >= getMaxValue()
            };

            // Add media-specific completion tracking
            if (item.media_type === 'tv') {
                updateData.episodes_completed = Math.floor(progress / (item.tv_shows?.average_runtime || 30));
            } else if (item.media_type === 'book') {
                updateData.pages_completed = progress; // For books, progress directly represents pages
            }

            const response = await fetch('/api/media-items/progress', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                throw new Error('Failed to update progress');
            }

            onUpdate(progress);
            onClose();
        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update Progress</DialogTitle>
                    <DialogDescription>
                        Adjust your progress for {item.title}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="space-y-4">
                        <Slider
                            value={[progress]}
                            onValueChange={([value]) => setProgress(value)}
                            max={getMaxValue()}
                            step={1}
                            className="w-full"
                        />
                        <div className="text-center text-sm text-muted-foreground">
                            {getDisplayValue()}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdate}>
                        Save Progress
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 