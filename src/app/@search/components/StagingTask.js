import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import styles from './staging.module.css';

const MAX_UNIT_RANGE = 10000;

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    unit_name: z.string().min(1, "Unit name is required"),
    unit_range: z.number().min(1, "Must be at least 1").max(MAX_UNIT_RANGE, `Max is ${MAX_UNIT_RANGE}`),
    duration: z.number().min(1, "Duration required"),
    notes: z.string().optional().nullable(),
    queue_number: z.number().optional().nullable(),
});

export default function StagingTask({ open, onClose, allCategories, refreshQueue }) {
    const [isLoading, setIsLoading] = useState(false);
    const [durationHours, setDurationHours] = useState(1);
    const [unitValue, setUnitValue] = useState(1);
    const [error, setError] = useState(null);
    const [nextQueueNumber, setNextQueueNumber] = useState(null);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            category: allCategories?.[0] || 'General',
            unit_name: '',
            unit_range: 1,
            duration: 60,
            notes: '',
            queue_number: null,
        },
    });

    useEffect(() => {
        if (open) {
            const fetchNextQueueNumber = async () => {
                try {
                    setIsLoading(true);
                    const response = await fetch('/api/media-items/queue-number');
                    if (!response.ok) {
                        throw new Error('Failed to fetch next queue number');
                    }
                    const data = await response.json();
                    setNextQueueNumber(data.nextQueueNumber);
                    form.setValue('queue_number', data.nextQueueNumber);
                    console.log('Fetched next queue number:', data.nextQueueNumber);
                } catch (e) {
                    console.error('Error fetching next queue number:', e.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchNextQueueNumber();
        }
    }, [open, form]);

    const handleSliderChange = ([val]) => {
        const range = form.getValues('unit_range') || 1;
        setUnitValue(val);
        const totalDuration = durationHours * 60;
        const proportionalDuration = Math.round((val / range) * totalDuration);
        form.setValue('duration', proportionalDuration);
    };

    const handleDurationChange = (hours) => {
        setDurationHours(hours);
        const range = form.getValues('unit_range') || 1;
        const proportionalValue = Math.round((form.getValues('duration') / (hours * 60)) * range);
        setUnitValue(proportionalValue);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            const payload = {
                ...data,
                media_type: 'task',
                queue_number: nextQueueNumber,
            };
            const response = await fetch('/api/media-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to add task');
            }
            if (refreshQueue) refreshQueue();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <Card className={styles.stagingCard} style={{ minWidth: 350, maxWidth: 420 }}>
                <CardHeader>
                    <CardTitle>Add Task</CardTitle>
                    <CardDescription>Add a general task to your queue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} autoFocus />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {allCategories?.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Custom Unit Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. reps, forms, calls, miles" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="unit_range"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit Range (max value)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={MAX_UNIT_RANGE}
                                                {...field}
                                                onChange={e => {
                                                    const val = Math.max(1, Math.min(MAX_UNIT_RANGE, Number(e.target.value)));
                                                    field.onChange(val);
                                                    setUnitValue(val);
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div>
                                <FormLabel>Progress</FormLabel>
                                <Slider
                                    value={[unitValue]}
                                    min={1}
                                    max={form.getValues('unit_range') || 1}
                                    step={1}
                                    onValueChange={handleSliderChange}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span>{unitValue} / {form.getValues('unit_range') || 1} {form.getValues('unit_name') || 'units'}</span>
                                    <span>{form.getValues('duration') || 0} min</span>
                                </div>
                            </div>
                            <div>
                                <FormLabel>Duration (hours)</FormLabel>
                                <Slider
                                    value={[durationHours]}
                                    min={0.1}
                                    max={24}
                                    step={0.1}
                                    onValueChange={([val]) => handleDurationChange(val)}
                                />
                                <div className="flex justify-between text-xs mt-1">
                                    <span>{durationHours.toFixed(1)} hours</span>
                                    <span>{Math.round(durationHours * 60)} min</span>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} placeholder="Optional notes..." />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <div className="text-red-500 text-sm">{error}</div>}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                    Add Task
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
} 