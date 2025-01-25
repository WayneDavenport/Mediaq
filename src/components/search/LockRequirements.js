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

const LockRequirements = ({ form, incompleteItems, allCategories, calculateReadingTime, userId }) => {
    console.log('LockRequirements received incompleteItems:', incompleteItems);

    React.useEffect(() => {
        const value = form.watch('key_parent');
        if (!value) return;

        const numericValue = parseInt(value);
        const selectedItem = incompleteItems.find(i => Number(i.id) === numericValue);

        if (!isNaN(numericValue) && selectedItem) {
            form.setValue('key_parent_id', numericValue);
            form.setValue('key_parent_text', null);
        } else {
            form.setValue('key_parent_id', null);
            form.setValue('key_parent_text', value);
        }
    }, [form.watch('key_parent')]);

    // Add this new useEffect to handle goal_time updates
    React.useEffect(() => {
        const keyParent = form.watch('key_parent');
        const goalValue = form.watch(['goal_pages', 'goal_episodes', 'goal_time']);
        if (!keyParent) return;

        const numericValue = parseInt(keyParent);
        const selectedItem = incompleteItems.find(i => Number(i.id) === numericValue);

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
                                                const numericValue = parseInt(field.value);
                                                const selectedItem = incompleteItems.find(i => Number(i.id) === numericValue);
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
                                                <SelectItem key={item.id} value={item.id.toString()}>
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
                                const numericValue = parseInt(keyParent);
                                const selectedItem = incompleteItems.find(i => Number(i.id) === numericValue);

                                if (!selectedItem) {
                                    switch (keyParent) {
                                        case 'Book':
                                            return 'goal_pages';
                                        case 'Game':
                                            return 'goal_time';
                                        case 'Show':
                                            return 'goal_time';
                                        case 'Movie':
                                        default:
                                            return 'goal_time';
                                    }
                                }

                                switch (selectedItem.media_type) {
                                    case 'book':
                                        return 'goal_pages';
                                    case 'tv':
                                        return 'goal_episodes';
                                    default:
                                        return 'goal_time';
                                }
                            })()}
                            render={({ field }) => {
                                const keyParent = form.watch('key_parent');
                                const numericValue = parseInt(keyParent);
                                const selectedItem = incompleteItems.find(i => Number(i.id) === numericValue);
                                console.log('Selected item:', selectedItem);

                                let max = 240;
                                let label = 'Time to Complete (minutes)';
                                let valueText = `${field.value} minutes`;

                                if (!selectedItem) {
                                    if (keyParent === 'Book') {
                                        max = 1000;
                                        label = 'Pages to Complete';
                                        valueText = `${field.value} pages (${calculateReadingTime(field.value)} minutes)`;
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
                                        case 'movie':
                                            console.log('Movie progress:', selectedItem.user_media_progress);
                                            // Add null checks and fallbacks
                                            const movieProgress = selectedItem.user_media_progress || {};
                                            const movieDuration = movieProgress.duration || selectedItem.movies?.runtime || 240;
                                            max = movieDuration;
                                            label = 'Time to Complete (minutes)';
                                            valueText = `${field.value} minutes`;
                                            break;
                                        case 'game':
                                            // Add null checks for games too
                                            const gameProgress = selectedItem.user_media_progress || {};
                                            const gameDuration = gameProgress.duration || selectedItem.games?.average_playtime || 100;
                                            max = gameDuration * 60;
                                            label = 'Time to Complete (hours)';
                                            const hours = (field.value / 60).toFixed(1);
                                            valueText = `${hours} hours (${field.value} minutes)`;
                                            break;
                                        default:
                                            // Safe fallback for any other types
                                            const defaultProgress = selectedItem.user_media_progress || {};
                                            max = defaultProgress.duration || 240;
                                            label = 'Time to Complete (minutes)';
                                            valueText = `${field.value} minutes`;
                                    }
                                }

                                console.log('Calculated max:', max);
                                console.log('Selected media type:', selectedItem?.media_type);

                                return (
                                    <FormItem>
                                        <FormLabel>{label}</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <Slider
                                                    value={[field.value]}
                                                    onValueChange={([value]) => field.onChange(value)}
                                                    max={max}
                                                    step={1}
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