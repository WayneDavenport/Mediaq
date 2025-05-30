'use client';

import React from 'react';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectGroup,
    SelectItem,
} from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";

const formatGameTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return {
        hours,
        minutes: remainingMinutes,
        display: `${hours}h ${remainingMinutes}m`
    };
};

const LockRequirements = ({ form, incompleteItems, allCategories, calculateReadingTime, userId }) => {
    console.log('LockRequirements received incompleteItems:', incompleteItems);

    React.useEffect(() => {
        const value = form.watch('key_parent');
        if (!value) return;

        // Check if the value is a UUID (for specific items)
        const selectedItem = incompleteItems.find(i => i.id === value);

        if (selectedItem) {
            // If a specific media item is selected
            form.setValue('key_parent_id', value); // Use the UUID directly
            form.setValue('key_parent_text', null);
            form.setValue('lock_type', 'specific');
        } else {
            // If a category or media type is selected
            form.setValue('key_parent_id', null);
            form.setValue('key_parent_text', value);
            form.setValue('lock_type', allCategories.includes(value) ? 'category' : 'media_type');
        }
    }, [form.watch('key_parent')]);

    // For tasks: get selected task and unit info
    const keyParent = form.watch('key_parent');
    const selectedTask = keyParent && incompleteItems.find(i => i.id === keyParent && i.media_type === 'task');
    const unitName = selectedTask?.tasks?.unit_name || 'units';
    const unitRange = selectedTask?.tasks?.unit_range || 10000;

    // Add this function to handle lock creation
    const createLock = async (mediaItemId) => {
        if (!form.watch('locked')) return;

        const lockData = {
            media_item_id: mediaItemId,
            key_parent: form.watch('key_parent'),
            key_parent_id: form.watch('key_parent_id'),
            key_parent_text: form.watch('key_parent_text'),
            goal_time: form.watch('goal_time') || 0,
            goal_pages: form.watch('goal_pages') || 0,
            goal_episodes: form.watch('goal_episodes') || 0,
            goal_units: form.watch('goal_units') || 0,
        };

        console.log('Creating lock with data:', lockData); // Debug log

        try {
            const response = await fetch('/api/media-items/add-lock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(lockData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Lock creation failed:', errorData); // Debug log
                throw new Error(errorData.error || 'Failed to create lock');
            }

            const result = await response.json();
            console.log('Lock created successfully:', result); // Debug log
            return result;
        } catch (error) {
            console.error('Error creating lock:', error);
            throw error;
        }
    };

    // Add createLock to form context so it can be called after media item creation
    React.useEffect(() => {
        console.log('Setting createLock function in form'); // Debug log
        form.setValue('createLock', createLock);
    }, [form]);

    // Add this new useEffect to handle goal_time updates
    React.useEffect(() => {
        const keyParent = form.watch('key_parent');
        const goalValue = form.watch(['goal_pages', 'goal_episodes', 'goal_time']);
        if (!keyParent) return;

        const selectedItem = incompleteItems.find(i => i.id === keyParent);

        if (!selectedItem) {
            if (keyParent === 'Book') {
                form.setValue('goal_time', calculateReadingTime(goalValue[0]));
            }
        } else {
            switch (selectedItem.media_type) {
                case 'book':
                    form.setValue('goal_time', calculateReadingTime(goalValue[0]));
                    break;
                case 'tv':
                    const tvData = selectedItem.tv_shows;
                    const episodeDuration = tvData?.average_runtime || selectedItem.duration || 30;
                    form.setValue('goal_time', goalValue[1] * episodeDuration);
                    break;
                case 'movie':
                case 'game':
                    form.setValue('goal_time', goalValue[2]);
                    break;
            }
        }
    }, [form.watch('key_parent'), form.watch('goal_pages'), form.watch('goal_episodes'), form.watch('goal_time')]);

    return (
        <>
            <FormField
                control={form.control}
                name="locked"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <FormLabel className="text-base">
                                Lock Requirements
                            </FormLabel>
                            <FormDescription>
                                Set completion requirements for this item
                            </FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            {form.watch('locked') && (
                <>
                    <Controller
                        control={form.control}
                        name="key_parent"
                        defaultValue=""
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Key Parent</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || ""}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue>
                                            {(() => {
                                                if (!field.value) return "Select Key Parent";
                                                const selectedItem = incompleteItems.find(i => i.id === field.value);
                                                return selectedItem ? selectedItem.title : field.value;
                                            })()}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup label="Media Types">
                                            {['Book', 'Show', 'Movie', 'Game'].map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectGroup label="Categories">
                                            {allCategories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectGroup label="Your Media Items">
                                            {incompleteItems.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.title}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {form.watch('key_parent') && (
                        <FormField
                            control={form.control}
                            name={(() => {
                                const keyParent = form.watch('key_parent');
                                const selectedItem = incompleteItems.find(i => i.id === keyParent);

                                if (!selectedItem) {
                                    switch (keyParent) {
                                        case 'Book': return 'goal_pages';
                                        case 'Game': return 'goal_time';
                                        case 'Show': return 'goal_time';
                                        case 'Movie':
                                        default: return 'goal_time';
                                    }
                                }

                                switch (selectedItem.media_type) {
                                    case 'book': return 'goal_pages';
                                    case 'tv': return 'goal_episodes';
                                    case 'task': return 'goal_units';
                                    default: return 'goal_time';
                                }
                            })()}
                            render={({ field }) => {
                                const keyParent = form.watch('key_parent');
                                const selectedItem = incompleteItems.find(i => i.id === keyParent);
                                console.log('Selected item:', selectedItem);

                                let max = 240;
                                let label = 'Time to Complete (minutes)';
                                let valueText = `${field.value} minutes`;
                                let step = 1;

                                if (!selectedItem) {
                                    if (keyParent === 'Book') {
                                        max = 1000;
                                        label = 'Pages to Complete';
                                        valueText = `${field.value} pages (${calculateReadingTime(field.value)} minutes)`;
                                    } else if (keyParent === 'Game') {
                                        max = 6000; // 100 hours for generic games
                                        step = 15;  // 15-minute increments
                                    }
                                } else {
                                    switch (selectedItem.media_type) {
                                        case 'book':
                                            const bookData = selectedItem.books;
                                            max = bookData?.page_count || 1000;
                                            label = 'Pages to Complete';
                                            valueText = `${field.value} pages (${calculateReadingTime(field.value)} minutes)`;
                                            break;
                                        case 'tv':
                                            const tvData = selectedItem.tv_shows;
                                            max = tvData?.total_episodes || 24;
                                            label = 'Episodes to Complete';
                                            const episodeDuration = tvData?.average_runtime || selectedItem.duration || 30;
                                            valueText = `${field.value} episodes (${field.value * episodeDuration} minutes)`;
                                            break;
                                        case 'game':
                                            const gameProgress = selectedItem.user_media_progress || {};
                                            const gameDuration = gameProgress.duration || selectedItem.games?.average_playtime || 100;
                                            max = gameDuration;  // Keep max in minutes
                                            label = 'Time to Complete';
                                            const gameTime = formatGameTime(field.value);
                                            valueText = gameTime.display;
                                            step = 15; // 15-minute increments for games
                                            break;
                                        case 'movie':
                                            const movieProgress = selectedItem.user_media_progress || {};
                                            const movieDuration = movieProgress.duration || selectedItem.movies?.runtime || 240;
                                            max = movieDuration;
                                            label = 'Time to Complete (minutes)';
                                            valueText = `${field.value} minutes`;
                                            break;
                                        case 'task':
                                            // Custom unit goal for tasks
                                            return (
                                                <FormItem>
                                                    <FormLabel>{unitName.charAt(0).toUpperCase() + unitName.slice(1)} Goal</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={unitRange}
                                                            value={field.value || ''}
                                                            onChange={e => field.onChange(Number(e.target.value))}
                                                            placeholder={`Number of ${unitName}...`}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Max: {unitRange} {unitName}</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        default:
                                            const defaultProgress = selectedItem.user_media_progress || {};
                                            max = defaultProgress.duration || 240;
                                            valueText = `${field.value} minutes`;
                                    }
                                }

                                return (
                                    <FormItem>
                                        <FormLabel>{label}</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Slider
                                                    value={[field.value]}
                                                    onValueChange={([value]) => field.onChange(value)}
                                                    max={max}
                                                    step={step}
                                                />
                                                <div className="text-sm text-muted-foreground">
                                                    {valueText}
                                                </div>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                );
                            }}
                        />
                    )}
                </>
            )}
        </>
    );
};

export default LockRequirements; 