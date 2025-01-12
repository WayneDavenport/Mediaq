'use client';
import { useState, useEffect } from 'react';
import useSearchStore from '@/store/searchStore';
import { useSession } from 'next-auth/react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];
const READING_SPEED = 200; // Average reading speed in words per minute

const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    duration: z.number().min(0),
    category: z.string().min(1, "Category is required"),
    media_type: z.string(),
    description: z.string(),
    poster_path: z.string().optional(),
    backdrop_path: z.string().optional(),
    locked: z.boolean().default(false),
    key_parent: z.string().optional(),
    goal_time: z.number().min(0).optional(),
    goal_pages: z.number().min(0).optional(),
    goal_episodes: z.number().min(0).optional(),
    additional: z.record(z.any()).optional(),
});

const Staging = () => {
    const { data: session } = useSession();
    const stagingItem = useSearchStore((state) => state.stagingItem);
    const clearStagingItem = useSearchStore((state) => state.clearStagingItem);
    const [incompleteItems, setIncompleteItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: stagingItem?.title || '',
            duration: stagingItem?.duration || 0,
            category: 'General',
            media_type: stagingItem?.media_type || '',
            description: stagingItem?.description || '',
            poster_path: stagingItem?.poster_path || '',
            backdrop_path: stagingItem?.backdrop_path || '',
            locked: false,
            key_parent: '',
            goal_time: 0,
            goal_pages: 0,
            goal_episodes: 0,
            additional: stagingItem?.additional || {},
        },
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/media-items/categories');
                const data = await response.json();
                if (data.categories) {
                    const uniqueCategories = Array.from(new Set([...PRESET_CATEGORIES, ...data.categories]));
                    setAllCategories(uniqueCategories);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        const fetchIncompleteItems = async () => {
            try {
                const response = await fetch('/api/media-items/incomplete');
                const data = await response.json();
                console.log('Incomplete Items:', data.items);
                setIncompleteItems(data.items);
            } catch (error) {
                console.error('Failed to fetch incomplete items:', error);
            }
        };

        fetchCategories();
        fetchIncompleteItems();
    }, []);

    useEffect(() => {
        if (stagingItem) {
            form.reset({
                ...stagingItem,
                locked: false,
                key_parent: '',
                goal_time: 0,
                goal_pages: 0,
                goal_episodes: 0,
            });
        }
    }, [stagingItem, form]);

    const handleCustomCategoryAdd = (newCategory) => {
        if (newCategory && !allCategories.includes(newCategory)) {
            setAllCategories(prevCategories => [...prevCategories, newCategory]);
            form.setValue('category', newCategory);
            setCustomCategory('');
        }
    };

    const calculateReadingTime = (pages) => {
        const wordsPerPage = 300; // Average words per page
        const totalWords = pages * wordsPerPage;
        return Math.round(totalWords / READING_SPEED);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/media-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    user_email: session?.user?.email,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to add item');
            }

            clearStagingItem();
        } catch (error) {
            console.error('Error adding item:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!stagingItem) return null;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Review and Customize</CardTitle>
                <CardDescription>
                    Customize your media item and set any locks or requirements
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
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
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select or enter a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {allCategories.map((category) => (
                                                        <SelectItem key={category} value={category}>
                                                            {category}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>

                                                <SelectSeparator />

                                                <div className="p-2">
                                                    <Input
                                                        placeholder="Enter custom category..."
                                                        value={customCategory}
                                                        onChange={(e) => setCustomCategory(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleCustomCategoryAdd(customCategory.trim());
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                    <FormField
                                        control={form.control}
                                        name="key_parent"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Key Parent</FormLabel>
                                                <Select
                                                    onValueChange={field.onChange}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Key Parent" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup label="Media Types">
                                                            {['Book', 'Show', 'Movie'].map((type) => (
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
                                                const selectedItem = incompleteItems.find(i => i.id === form.watch('key_parent'));
                                                switch (selectedItem?.media_type) {
                                                    case 'book':
                                                        return 'goal_pages';
                                                    case 'tv':
                                                        return 'goal_episodes';
                                                    default:
                                                        return 'goal_time';
                                                }
                                            })()}
                                            render={({ field }) => {
                                                const selectedItem = incompleteItems.find(i => i.id === form.watch('key_parent'));
                                                console.log('Selected Item:', selectedItem);
                                                console.log('Key Parent:', form.watch('key_parent'));
                                                if (!selectedItem) return null;

                                                let max = 0;
                                                let label = '';
                                                let valueText = '';

                                                switch (selectedItem.media_type) {
                                                    case 'book':
                                                        max = selectedItem.additional?.page_count || 1000;
                                                        label = 'Pages to Complete';
                                                        valueText = `${field.value} pages (${calculateReadingTime(field.value)} minutes)`;
                                                        break;
                                                    case 'tv':
                                                        max = selectedItem.additional?.total_episodes || 24;
                                                        label = 'Episodes to Complete';
                                                        valueText = `${field.value} episodes (${field.value * selectedItem.duration} minutes)`;
                                                        break;
                                                    default:
                                                        max = selectedItem.duration || 240;
                                                        label = 'Time to Complete (minutes)';
                                                        valueText = `${field.value} minutes`;
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
                        </div>

                        <CardFooter className="px-0 flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearStagingItem}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add to Queue'
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default Staging;