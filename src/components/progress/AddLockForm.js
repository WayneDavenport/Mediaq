'use client';

import { useForm, FormProvider } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { calculateReadingTime, calculatePagesFromTime, calculateTVDuration } from '@/lib/mediaCalculations';
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AddLockForm({ onSubmit, allCategories, incompleteItems }) {
    const { data: session } = useSession();
    const userReadingSpeed = session?.user?.reading_speed || 0.667;
    const methods = useForm();
    const { register, handleSubmit, watch, setValue } = methods;

    // Add this logging
    useEffect(() => {
        console.log('Incomplete items:', incompleteItems);
    }, [incompleteItems]);

    const handleKeyParentChange = (value) => {
        console.log('Selected value:', value);
        setValue('key_parent', value);

        if (value && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            // If value is a UUID (item ID)
            console.log('Setting UUID:', value);
            setValue('key_parent_id', value);  // Don't parse as integer
            setValue('key_parent_text', null);

            // Find the selected item to determine media type
            const selectedItem = incompleteItems.find(item => item.id === value);  // Direct comparison
            console.log('Selected item:', selectedItem);
            if (selectedItem) {
                setValue('media_type', selectedItem.media_type);
            }
        } else {
            // If value is a string (media type or category)
            setValue('key_parent_id', null);
            if (['Movie', 'Book', 'Show', 'Game'].includes(value)) {
                setValue('key_parent_text', value.toLowerCase());
                setValue('media_type', value.toLowerCase());
            } else if (allCategories.includes(value)) {
                setValue('key_parent_text', 'category');
            }
        }
    };

    const selectedKeyParent = watch('key_parent');
    const mediaType = watch('media_type');
    const goalTime = watch('goal_time');
    const goalPages = watch('goal_pages');
    const goalEpisodes = watch('goal_episodes');

    // Update corresponding value when either changes for books
    useEffect(() => {
        if (mediaType === 'book') {
            if (goalTime && !goalPages) {
                setValue('goal_pages', calculatePagesFromTime(goalTime, userReadingSpeed));
            }
            if (goalPages && !goalTime) {
                setValue('goal_time', calculateReadingTime(goalPages, userReadingSpeed));
            }
        }
    }, [goalTime, goalPages, mediaType, setValue, userReadingSpeed]);

    // For TV shows, update time based on episodes
    useEffect(() => {
        if (mediaType === 'show' && goalEpisodes) {
            setValue('goal_time', calculateTVDuration(goalEpisodes));
        }
    }, [goalEpisodes, mediaType, setValue]);

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit((data) => {
                const formData = {
                    ...data,
                    key_parent_id: data.key_parent_id || null,
                    key_parent_text: data.key_parent_id ? null : data.key_parent_text
                };
                onSubmit(formData);
            })} className="space-y-4">
                <div className="space-y-2 relative z-50">
                    <Label>Lock Type</Label>
                    <Select onValueChange={handleKeyParentChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select lock type..." />
                        </SelectTrigger>
                        <SelectContent
                            position="popper"
                            className="z-[100]"
                            sideOffset={4}
                            align="start"
                        >
                            <SelectItem value="Movie">Movie</SelectItem>
                            <SelectItem value="Book">Book</SelectItem>
                            <SelectItem value="Show">TV Show</SelectItem>
                            <SelectItem value="Game">Game</SelectItem>
                            {allCategories.map(category => (
                                <SelectItem key={category} value={category}>
                                    {category}
                                </SelectItem>
                            ))}
                            {incompleteItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {(mediaType === 'book') && (
                    <div className="space-y-2">
                        <Label>Pages Goal</Label>
                        <Input
                            type="number"
                            {...register('goal_pages', {
                                valueAsNumber: true,
                                onChange: (e) => {
                                    const pages = parseInt(e.target.value);
                                    if (pages) {
                                        setValue('goal_time', calculateReadingTime(pages, userReadingSpeed));
                                    }
                                }
                            })}
                            placeholder="Number of pages..."
                        />
                        <div className="text-sm text-muted-foreground">
                            Reading speed: {userReadingSpeed.toFixed(2)} pages per minute
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Estimated time: {calculateReadingTime(goalPages, userReadingSpeed) || 0} minutes
                        </div>
                    </div>
                )}

                {(mediaType === 'show') && (
                    <div className="space-y-2">
                        <Label>Episodes Goal</Label>
                        <Input
                            type="number"
                            {...register('goal_episodes', {
                                valueAsNumber: true,
                                onChange: (e) => {
                                    const episodes = parseInt(e.target.value);
                                    if (episodes) {
                                        setValue('goal_time', calculateTVDuration(episodes));
                                    }
                                }
                            })}
                            placeholder="Number of episodes..."
                        />
                        <div className="text-sm text-muted-foreground">
                            Estimated watch time: {calculateTVDuration(goalEpisodes) || 0} minutes
                        </div>
                    </div>
                )}

                {(mediaType === 'movie' || mediaType === 'game') && (
                    <div className="space-y-2">
                        <Label>Time Goal (minutes)</Label>
                        <Input
                            type="number"
                            {...register('goal_time', { valueAsNumber: true })}
                            placeholder="Time in minutes..."
                        />
                    </div>
                )}

                <Button type="submit" className="w-full">
                    Add Lock
                </Button>
            </form>
        </FormProvider>
    );
} 