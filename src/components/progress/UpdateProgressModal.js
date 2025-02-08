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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UpdateProgressModal({
    isOpen,
    onClose,
    item,
    onUpdate,
    refreshData
}) {
    const [progress, setProgress] = useState(item.user_media_progress?.completed_duration || 0);
    const [showCompleteAlert, setShowCompleteAlert] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [affectedItems, setAffectedItems] = useState([]);
    const [showAffectedItemsAlert, setShowAffectedItemsAlert] = useState(false);

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

    const handleMarkComplete = () => {
        setIsMarkingComplete(true);
        const maxValue = getMaxValue();
        setProgress(maxValue);
        handleUpdate(true);
    };

    const handleSaveClick = () => {
        const maxValue = getMaxValue();
        if (progress === maxValue) {
            setShowCompleteAlert(true);
        } else {
            handleUpdate(false);
        }
    };

    const handleUpdate = async (markAsComplete = false) => {
        try {
            const updateData = {
                id: item.id,
                completed_duration: progress,
                initial_duration: item.user_media_progress?.completed_duration || 0,
                completed: markAsComplete,
                media_type: item.media_type,
                category: item.category
            };

            if (item.media_type === 'tv') {
                const newEpisodes = Math.floor(progress / (item.tv_shows?.average_runtime || 30));
                const initialEpisodes = item.user_media_progress?.episodes_completed || 0;
                updateData.episodes_completed = newEpisodes;
                updateData.initial_episodes = initialEpisodes;
            } else if (item.media_type === 'book') {
                updateData.pages_completed = progress;
                updateData.initial_pages = item.user_media_progress?.pages_completed || 0;
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

            const result = await response.json();

            if (result.affectedItems?.length > 0) {
                setAffectedItems(result.affectedItems);
                setShowAffectedItemsAlert(true);
            } else {
                onUpdate(progress);
                await refreshData();
                onClose();
                setShowCompleteAlert(false);
                setIsMarkingComplete(false);
            }

        } catch (error) {
            console.error('Error updating progress:', error);
        }
    };

    const handleCompleteAlertResponse = (shouldComplete) => {
        setShowCompleteAlert(false);
        if (shouldComplete) {
            handleUpdate(true);
        } else {
            const maxValue = getMaxValue();
            const newProgress = Math.floor(maxValue * 0.99);
            setProgress(newProgress);
            handleUpdate(false);
        }
    };

    const handleAffectedItemsAlertClose = () => {
        setShowAffectedItemsAlert(false);
        onUpdate(progress);
        onClose();
        setShowCompleteAlert(false);
        setIsMarkingComplete(false);
    };

    return (
        <>
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

                    <div className="flex justify-between space-x-2">
                        <Button
                            variant="secondary"
                            onClick={handleMarkComplete}
                            className="bg-green-500 hover:bg-green-600 text-white"
                        >
                            Mark as Complete
                        </Button>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveClick}>
                                Save Progress
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showCompleteAlert} onOpenChange={setShowCompleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Complete?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You've reached 100% progress. Would you like to mark this item as complete?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleCompleteAlertResponse(false)}>
                            Cancel (set to 99%)
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCompleteAlertResponse(true)}>
                            Yes, mark as complete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showAffectedItemsAlert} onOpenChange={setShowAffectedItemsAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lock Progress Updated</AlertDialogTitle>
                        <AlertDialogDescription>
                            The following locked items had their progress updated:
                        </AlertDialogDescription>
                        <ul className="list-disc pl-6 mt-2">
                            {affectedItems.map((affectedItem, index) => (
                                <li key={index} className="text-sm">
                                    {affectedItem.title}
                                    {affectedItem.progress && (
                                        <span className="text-muted-foreground">
                                            {' '}(+{affectedItem.progress} {
                                                item.media_type === 'book' ? 'pages' :
                                                    item.media_type === 'tv' ? 'episodes' :
                                                        'minutes'
                                            })
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleAffectedItemsAlertClose}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 