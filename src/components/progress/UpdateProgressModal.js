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
    onOptimisticUpdate,
    onServerConfirmedUpdate,
    onUpdateError
}) {
    const { data: session } = useSession();
    const userReadingSpeed = session?.user?.reading_speed || 0.667;
    const [progress, setProgress] = useState(0);
    const [taskUnitValue, setTaskUnitValue] = useState(0);
    const [taskDuration, setTaskDuration] = useState(0);
    const [showCompleteAlert, setShowCompleteAlert] = useState(false);
    const [showAffectedItemsAlert, setShowAffectedItemsAlert] = useState(false);
    const [newlyUnlockedItemsForAlert, setNewlyUnlockedItemsForAlert] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (item.media_type === 'book') {
            setProgress(item.user_media_progress?.pages_completed || 0);
        } else if (item.media_type === 'tv') {
            const episodeCount = Math.floor((item.user_media_progress?.completed_duration || 0) / (item.tv_shows?.average_runtime || 30));
            setProgress(episodeCount);
        } else if (item.media_type === 'task') {
            setTaskUnitValue(item.user_media_progress?.units_completed || 0);
            setTaskDuration(item.user_media_progress?.completed_duration || 0);
        } else {
            setProgress(item.user_media_progress?.completed_duration || 0);
        }
    }, [item]);

    const getMaxValue = () => {
        switch (item.media_type) {
            case 'book':
                return item.books?.page_count || 0;
            case 'tv':
                return Math.ceil((item.user_media_progress?.duration || 0) / (item.tv_shows?.average_runtime || 30));
            case 'movie':
                return item.user_media_progress?.duration || item.movies?.runtime || 0;
            case 'game':
                return item.user_media_progress?.duration || 0;
            case 'task':
                return item.tasks?.unit_range || 1;
            default:
                return 100;
        }
    };

    const getDisplayValueForToast = (currentProgressDetails) => {
        const max = getMaxValue();
        const percentage = max > 0 ? Math.round(((item.media_type === 'task' ? currentProgressDetails.units_completed : currentProgressDetails.progress_value) / max) * 100) : 0;
        switch (item.media_type) {
            case 'book':
                return `${currentProgressDetails.pages_completed} pages (${percentage}%)`;
            case 'movie':
                return `${currentProgressDetails.completed_duration} minutes (${percentage}%)`;
            case 'tv':
                const episodes = Math.floor(currentProgressDetails.completed_duration / (item.tv_shows?.average_runtime || 30));
                return `${episodes} episodes - ${currentProgressDetails.completed_duration} minutes (${percentage}%)`;
            case 'game':
                const hours = (currentProgressDetails.completed_duration / 60).toFixed(1);
                return `${hours} hours (${percentage}%)`;
            case 'task':
                return `${currentProgressDetails.units_completed} / ${item.tasks?.unit_range || 1} ${item.tasks?.unit_name || 'units'} (${percentage}%)\n${currentProgressDetails.completed_duration} / ${(item.user_media_progress?.duration || 60)} min`;
            default:
                return `${percentage}%`;
        }
    };

    const handleMarkComplete = () => {
        setIsLoading(true);
        const maxValue = getMaxValue();
        if (item.media_type === 'task') {
            setTaskUnitValue(maxValue);
            setTaskDuration(item.user_media_progress?.duration || item.tasks?.expected_duration || 60);
            handleUpdate(true);
        } else if (item.media_type === 'tv') {
            setProgress(maxValue);
            handleUpdate(true);
        } else {
            setProgress(maxValue);
            handleUpdate(true);
        }
    };

    const handleSaveClick = () => {
        const maxValue = getMaxValue();
        let isAtMaxValue = false;
        if (item.media_type === 'task') {
            isAtMaxValue = taskUnitValue === maxValue;
        } else {
            isAtMaxValue = progress === maxValue;
        }

        if (isAtMaxValue) {
            setShowCompleteAlert(true);
        } else {
            handleUpdate(false);
        }
    };

    const handleUpdate = async (markAsComplete = false) => {
        if (!item || !onOptimisticUpdate || !onServerConfirmedUpdate || !onUpdateError) return;
        setIsLoading(true);

        let optimisticProgressDetails = {};
        let apiUpdateData = {
            id: item.id,
            media_type: item.media_type,
            category: item.category,
            initial_duration: item.user_media_progress?.completed_duration || 0,
            initial_pages: item.user_media_progress?.pages_completed || 0,
            initial_units: item.user_media_progress?.units_completed || 0,
        };

        if (item.media_type === 'book') {
            const currentPages = markAsComplete ? getMaxValue() : progress;
            optimisticProgressDetails = {
                pages_completed: currentPages,
                completed_duration: Math.round(currentPages / userReadingSpeed),
                completed: markAsComplete || currentPages >= getMaxValue(),
                units_completed: item.user_media_progress?.units_completed,
            };
            apiUpdateData.pages_completed = optimisticProgressDetails.pages_completed;
            apiUpdateData.completed_duration = optimisticProgressDetails.completed_duration;
            apiUpdateData.completed = optimisticProgressDetails.completed;
        } else if (item.media_type === 'tv') {
            const currentEpisodes = markAsComplete ? getMaxValue() : progress;
            const episodeLength = item.tv_shows?.average_runtime || 30;
            optimisticProgressDetails = {
                completed_duration: currentEpisodes * episodeLength,
                completed: markAsComplete || currentEpisodes >= getMaxValue(),
                pages_completed: item.user_media_progress?.pages_completed,
                units_completed: item.user_media_progress?.units_completed,
            };
            apiUpdateData.completed_duration = optimisticProgressDetails.completed_duration;
            apiUpdateData.completed = optimisticProgressDetails.completed;
        } else if (item.media_type === 'task') {
            const currentUnits = markAsComplete ? getMaxValue() : taskUnitValue;
            const currentTaskDuration = markAsComplete ? (item.user_media_progress?.duration || item.tasks?.expected_duration || 60) : taskDuration;
            optimisticProgressDetails = {
                units_completed: currentUnits,
                completed_duration: currentTaskDuration,
                completed: markAsComplete || currentUnits >= getMaxValue(),
                pages_completed: item.user_media_progress?.pages_completed,
            };
            apiUpdateData.units_completed = optimisticProgressDetails.units_completed;
            apiUpdateData.completed_duration = optimisticProgressDetails.completed_duration;
            apiUpdateData.completed = optimisticProgressDetails.completed;
        } else {
            const currentDuration = markAsComplete ? getMaxValue() : progress;
            optimisticProgressDetails = {
                completed_duration: currentDuration,
                completed: markAsComplete || currentDuration >= getMaxValue(),
                pages_completed: item.user_media_progress?.pages_completed,
                units_completed: item.user_media_progress?.units_completed,
            };
            apiUpdateData.completed_duration = optimisticProgressDetails.completed_duration;
            apiUpdateData.completed = optimisticProgressDetails.completed;
        }

        optimisticProgressDetails.progress_value = item.media_type === 'task' ? taskUnitValue : progress;

        onOptimisticUpdate(item.id, optimisticProgressDetails);

        try {
            console.log('Sending update to API:', apiUpdateData);
            const response = await fetch('/api/media-items/progress', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiUpdateData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Failed to update progress from server');
            }

            const result = await response.json();
            console.log('Received from server:', result);

            onServerConfirmedUpdate(result.updatedItem);

            toast.success('Progress updated successfully', {
                description: getDisplayValueForToast(optimisticProgressDetails)
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

            if (result.newlyUnlockedItems && result.newlyUnlockedItems.length > 0) {
                setNewlyUnlockedItemsForAlert(result.newlyUnlockedItems);
                setShowAffectedItemsAlert(true);
            } else {
                onClose();
            }
            setShowCompleteAlert(false);

        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error(error.message || "Failed to update progress");
            onUpdateError(item.id);
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
            if (item.media_type === 'task') {
                setTaskUnitValue(Math.floor(maxValue * 0.99) || (maxValue > 1 ? maxValue - 1 : 0));
            } else {
                setProgress(Math.floor(maxValue * 0.99) || (maxValue > 1 ? maxValue - 1 : 0));
            }
            handleUpdate(false);
        }
    };

    const handleNewlyUnlockedItemsAlertClose = () => {
        setShowAffectedItemsAlert(false);
        setNewlyUnlockedItemsForAlert([]);
        onClose();
    };

    const handleTaskSliderChange = (val) => {
        const unitValue = val[0];
        setTaskUnitValue(unitValue);
        const range = item.tasks?.unit_range || 1;
        const totalExpectedDuration = item.user_media_progress?.duration || item.tasks?.expected_duration || 60;
        const proportionalDuration = range > 0 ? Math.round((unitValue / range) * totalExpectedDuration) : 0;
        setTaskDuration(proportionalDuration);
    };

    const handleTaskDurationChange = (val) => {
        const newDuration = val[0] * 60;
        setTaskDuration(newDuration);
        const range = item.tasks?.unit_range || 1;
        const totalExpectedDuration = item.user_media_progress?.duration || item.tasks?.expected_duration || 60;
        const proportionalUnit = totalExpectedDuration > 0 ? Math.round((newDuration / totalExpectedDuration) * range) : 0;
        setTaskUnitValue(proportionalUnit > range ? range : proportionalUnit);
    };

    if (!isOpen || !item) return null;

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
                                {item.media_type === 'task' ? (
                                    <>
                                        <Label>{item.tasks?.unit_name || 'Units'} Completed</Label>
                                        <div className="flex items-center space-x-2">
                                            <Slider
                                                value={[taskUnitValue]}
                                                onValueChange={handleTaskSliderChange}
                                                max={item.tasks?.unit_range || 1}
                                                min={0}
                                                step={1}
                                                disabled={isLoading}
                                            />
                                            <div className="w-32 text-right tabular-nums">
                                                {taskUnitValue} / {item.tasks?.unit_range || '-'} {item.tasks?.unit_name || 'units'}
                                            </div>
                                        </div>
                                        <Label>Time Spent (minutes)</Label>
                                        <div className="flex items-center space-x-2">
                                            <Slider
                                                value={[taskDuration]}
                                                onValueChange={([value]) => setTaskDuration(value)}
                                                max={item.user_media_progress?.duration || item.tasks?.expected_duration || 60}
                                                min={0}
                                                step={1}
                                                disabled={isLoading}
                                            />
                                            <div className="w-32 text-right tabular-nums">
                                                {taskDuration} / {item.user_media_progress?.duration || item.tasks?.expected_duration || '-'} min
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
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
                                                step={1}
                                                disabled={isLoading}
                                            />
                                            <div className="w-24 text-right tabular-nums">
                                                {item.media_type === 'book'
                                                    ? `${progress}/${getMaxValue()} pages`
                                                    : item.media_type === 'tv'
                                                        ? `${progress}/${getMaxValue()} eps`
                                                        : `${progress}/${getMaxValue()} min`}
                                            </div>
                                        </div>
                                        {item.media_type === 'tv' && (
                                            <div className="text-sm text-muted-foreground">
                                                Total time: {progress * (item.tv_shows?.average_runtime || 30)} minutes
                                            </div>
                                        )}
                                        {item.media_type === 'book' && (
                                            <div className="text-sm text-muted-foreground">
                                                Estimated reading time for current pages: {Math.round(progress / userReadingSpeed)} minutes
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between space-x-2 pt-4">
                        <Button
                            variant="secondary"
                            onClick={handleMarkComplete}
                            className="bg-green-500 hover:bg-green-600 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Mark as Complete
                        </Button>
                        <div className="flex space-x-2">
                            <Button variant="outline" onClick={onClose} disabled={isLoading}>
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
                        <AlertDialogCancel onClick={() => handleCompleteAlertResponse(false)} disabled={isLoading}>
                            Set to 99% & Save
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCompleteAlertResponse(true)} disabled={isLoading}>
                            Yes, mark as complete & Save
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showAffectedItemsAlert} onOpenChange={setShowAffectedItemsAlert}>
                <AlertDialogContent className="fixed z-[1002]">
                    <AlertDialogHeader>
                        <AlertDialogTitle>🎉 Items Unlocked!</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your progress has unlocked the following items:
                            <ul className="list-disc pl-6 mt-2 max-h-48 overflow-y-auto">
                                {newlyUnlockedItemsForAlert.map((unlockedItem, index) => (
                                    <li key={index} className="text-sm">
                                        {unlockedItem.title}
                                    </li>
                                ))}
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={handleNewlyUnlockedItemsAlertClose}>
                            OK
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
} 