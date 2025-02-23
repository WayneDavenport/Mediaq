'use client';

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function UpdateProgressModal({
    isOpen,
    onClose,
    item,
    onUpdate,
    refreshData
}) {
    const { data: session } = useSession();
    const userReadingSpeed = session?.user?.reading_speed || 0.667;
    const [progress, setProgress] = useState(0);
    const [showCompleteAlert, setShowCompleteAlert] = useState(false);
    const [isMarkingComplete, setIsMarkingComplete] = useState(false);
    const [affectedItems, setAffectedItems] = useState([]);
    const [showAffectedItemsAlert, setShowAffectedItemsAlert] = useState(false);
    const [completedLocks, setCompletedLocks] = useState([]);
    const [showCompletionAlert, setShowCompletionAlert] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (item.media_type === 'book') {
            setProgress(item.user_media_progress?.pages_completed || 0);
        } else if (item.media_type === 'tv') {
            // For TV shows, convert minutes to episodes
            const episodeCount = Math.floor((item.user_media_progress?.completed_duration || 0) / (item.tv_shows?.average_runtime || 30));
            setProgress(episodeCount);
        } else {
            // For other media types, show minutes completed
            setProgress(item.user_media_progress?.completed_duration || 0);
        }
    }, [item]);

    const getMaxValue = () => {
        switch (item.media_type) {
            case 'book':
                return item.books?.page_count || 0;
            case 'tv':
                // Max episodes based on total duration divided by average episode length
                return Math.ceil((item.user_media_progress?.duration || 0) / (item.tv_shows?.average_runtime || 30));
            case 'movie':
                return item.user_media_progress?.duration || item.movies?.runtime || 0;
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
        setIsLoading(true);
        try {
            let updateData = {
                id: item.id,
                media_type: item.media_type,
                category: item.category,
                initial_duration: item.user_media_progress?.completed_duration || 0,
                initial_pages: item.user_media_progress?.pages_completed || 0
            };

            if (item.media_type === 'book') {
                updateData.pages_completed = progress;
                updateData.completed_duration = Math.round(progress / userReadingSpeed);
                updateData.completed = markAsComplete || progress >= (item.books?.page_count || 0);
            } else if (item.media_type === 'tv') {
                // Convert episodes to minutes
                const episodeLength = item.tv_shows?.average_runtime || 30;
                updateData.completed_duration = progress * episodeLength;
                updateData.completed = markAsComplete || progress >= getMaxValue();
            } else {
                updateData.completed_duration = progress;
                updateData.completed = markAsComplete || progress >= (item.user_media_progress?.duration || 0);
            }

            console.log('Sending update:', updateData);

            const response = await fetch('/api/media-items/progress', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update progress');
            }

            const result = await response.json();

            toast.success('Progress updated successfully', {
                description: getDisplayValue()
            });

            if (result.easterEggMessage) {
                toast.info(result.easterEggMessage, {
                    duration: 6000,
                    style: {
                        background: '#f0f0f0',
                        border: '2px dashed #666',
                        fontFamily: 'monospace'
                    }
                });
            }

            if (result.affectedItems?.length > 0) {
                const completed = result.affectedItems.filter(item => item.completed);
                const affected = result.affectedItems.filter(item => !item.completed);

                if (completed.length > 0) {
                    setCompletedLocks(completed);
                    setShowCompletionAlert(true);
                } else if (affected.length > 0) {
                    setAffectedItems(affected);
                    setShowAffectedItemsAlert(true);
                } else {
                    onUpdate(progress);
                    onClose();
                }
            }
            setShowCompleteAlert(false);
            setIsMarkingComplete(false);

        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error(error.message || "Failed to update progress");
        } finally {
            setIsLoading(false);
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
                <DialogContent className="fixed z-[1001]">
                    <DialogHeader>
                        <DialogTitle>Update Progress</DialogTitle>
                        <DialogDescription>
                            Adjust your progress for {item.title}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>
                                    {item.media_type === 'book' ? 'Pages Read' :
                                        item.media_type === 'tv' ? 'Episodes Watched' :
                                            'Time Completed (minutes)'}
                                </Label>
                                <div className="flex items-center space-x-2">
                                    <Slider
                                        value={[progress]}
                                        onValueChange={([value]) => setProgress(value)}
                                        max={getMaxValue()}
                                        step={item.media_type === 'tv' ? 1 : 1}
                                    />
                                    <div className="w-20 text-right">
                                        {item.media_type === 'book'
                                            ? `${progress}/${item.books?.page_count} pages`
                                            : item.media_type === 'tv'
                                                ? `${progress}/${getMaxValue()} eps`
                                                : `${progress}/${item.user_media_progress?.duration} min`}
                                    </div>
                                </div>
                                {item.media_type === 'tv' && (
                                    <div className="text-sm text-muted-foreground">
                                        Total time: {progress * (item.tv_shows?.average_runtime || 30)} minutes
                                    </div>
                                )}
                                {item.media_type === 'book' && (
                                    <div className="text-sm text-muted-foreground">
                                        Estimated time: {Math.round(progress / userReadingSpeed)} minutes
                                    </div>
                                )}
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
                            <Button onClick={handleSaveClick} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Save Progress'
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showCompleteAlert} onOpenChange={setShowCompleteAlert}>
                <AlertDialogContent className="fixed z-[1002]">
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
                <AlertDialogContent className="fixed z-[1002]">
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

            <AlertDialog open={showCompletionAlert} onOpenChange={setShowCompletionAlert}>
                <AlertDialogContent className="fixed z-[1002]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>🎉 Congratulations!</AlertDialogTitle>
                        <AlertDialogDescription>
                            You've unlocked the following items:
                            <ul className="list-disc pl-6 mt-2">
                                {completedLocks.map((item, index) => (
                                    <li key={index} className="text-sm">
                                        {item.title}
                                    </li>
                                ))}
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => {
                            setShowCompletionAlert(false);
                            if (affectedItems.length > 0) {
                                setShowAffectedItemsAlert(true);
                            } else {
                                onUpdate(progress);
                                onClose();
                            }
                        }}>
                            Continue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 