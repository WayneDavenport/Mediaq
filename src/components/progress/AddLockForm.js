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
    const userReadingSpeed = session?.user?.reading_speed || 30; // Default to 30 pages per 30 minutes
    const methods = useForm();
    const { register, handleSubmit, watch, setValue } = methods;

    const handleKeyParentChange = (value) => {
        setValue('key_parent', value);
    };

    const selectedKeyParent = watch('key_parent');
    const numericValue = parseInt(selectedKeyParent);
    const selectedItem = incompleteItems.find(i => Number(i.id) === numericValue);
    const isCategory = allCategories.includes(selectedKeyParent);
    const isMediaType = ['Movie', 'Book', 'Show', 'Game'].includes(selectedKeyParent);

    // Watch both time and pages for books
    const goalTime = watch('goal_time');
    const goalPages = watch('goal_pages');

    // Update corresponding value when either changes for books
    useEffect(() => {
        const isBook = selectedKeyParent === 'Book';
        if (isBook) {
            if (goalTime && !goalPages) {
                setValue('goal_pages', calculatePagesFromTime(goalTime, userReadingSpeed));
            }
            if (goalPages && !goalTime) {
                setValue('goal_time', calculateReadingTime(goalPages, userReadingSpeed));
            }
        }
    }, [goalTime, goalPages, selectedKeyParent, setValue, userReadingSpeed]);

    // For TV shows, update time based on episodes
    const goalEpisodes = watch('goal_episodes');
    useEffect(() => {
        const isTV = selectedKeyParent === 'Show';
        if (isTV && goalEpisodes) {
            setValue('goal_time', calculateTVDuration(goalEpisodes));
        }
    }, [goalEpisodes, selectedKeyParent, setValue]);

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label>Lock Type</Label>
                    <Select onValueChange={handleKeyParentChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select lock type..." />
                        </SelectTrigger>
                        <SelectContent>
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
                                <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {(selectedItem?.media_type === 'book' || selectedKeyParent === 'Book' || (isCategory && selectedItem?.media_type === 'book')) && (
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
                            Reading speed: {userReadingSpeed} pages per 30 minutes
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Estimated time: {calculateReadingTime(goalPages, userReadingSpeed) || 0} minutes
                        </div>
                    </div>
                )}

                {(selectedItem?.media_type === 'tv' || selectedKeyParent === 'Show' || (isCategory && selectedItem?.media_type === 'tv')) && (
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

                {(selectedKeyParent === 'Movie' || selectedKeyParent === 'Game' ||
                    (isCategory && selectedItem?.media_type !== 'book' && selectedItem?.media_type !== 'tv')) && (
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