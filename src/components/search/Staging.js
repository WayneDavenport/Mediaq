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
import LockRequirements from './LockRequirements';
import { toast } from 'sonner';

const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];
const READING_SPEED = 200; // Average reading speed in words per minute

const formSchema = z.object({
    // Base media item fields
    title: z.string().min(1, "Title is required"),
    media_type: z.string(),
    category: z.string().min(1, "Category is required"),
    description: z.string(),
    genres: z.array(z.string()).optional(),
    poster_path: z.string().optional(),
    backdrop_path: z.string().optional(),

    // Lock fields
    locked: z.boolean().default(false),
    key_parent: z.string().optional(),
    key_parent_id: z.string().uuid().nullable().optional(),
    key_parent_text: z.string().nullable().optional(),
    lock_type: z.enum(['specific', 'category', 'media_type']).optional(),
    goal_time: z.number().min(0).optional(),
    goal_pages: z.number().min(0).optional(),
    goal_episodes: z.number().min(0).optional(),

    // Progress fields
    duration: z.number().min(0),
    queue_number: z.number().nullable().optional(),
    completed_duration: z.number().min(0).optional(),
    completed: z.boolean().optional(),
    /* completed_timestampz: z.string().nullable().optional(), */
    pages_completed: z.number().nullable().optional(),
    episodes_completed: z.number().nullable().optional(),


    /*Media-specific fields (all optional since they depend on media_type. 
      Progress related fields for tv and books are in progress) */

    // Books
    authors: z.array(z.string()).optional(),
    average_rating: z.number().optional(),
    categories: z.array(z.string()).optional(),
    estimated_reading_time: z.number().optional(),
    google_books_id: z.string().optional(),
    isbn: z.string().optional(),
    language: z.string().optional(),
    page_count: z.number().optional(),
    preview_link: z.string().optional(),
    published_date: z.string().optional(),
    publisher: z.string().optional(),
    ratings_count: z.number().optional(),
    reading_speed: z.number().optional(),

    // Movies
    director: z.string().optional(),
    original_language: z.string().optional(),
    release_date: z.string().optional(),
    tmdb_id: z.number().optional(),
    vote_average: z.number().optional(),

    // TV Shows
    average_runtime: z.number().optional(),
    episode_run_times: z.number().optional(),
    seasons: z.number().optional(),
    total_episodes: z.number().optional(),

    // Video Games
    achievements_count: z.number().nullable().optional(),
    average_playtime: z.number().nullable().optional(),
    esrb_rating: z.string().nullable().optional(),
    metacritic: z.number().nullable().optional(),
    platforms: z.string().nullable().optional(),
    publishers: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    rating_count: z.number().nullable().optional(),
    rawg_id: z.number().optional(),
    website: z.string().nullable().optional(),
}).refine(data => {
    if (data.locked) {
        // Ensure key_parent_id XOR key_parent_text exists
        const hasKeyParentId = data.key_parent_id !== null && data.key_parent_id !== undefined;
        const hasKeyParentText = data.key_parent_text !== null && data.key_parent_text !== undefined;
        const validParentKey = (hasKeyParentId && !hasKeyParentText) || (!hasKeyParentId && hasKeyParentText);

        // Ensure lock_type matches the key parent type
        const validLockType =
            (hasKeyParentId && data.lock_type === 'specific') ||
            (!hasKeyParentId && ['category', 'media_type'].includes(data.lock_type));

        return validParentKey && validLockType;
    }
    return true;
}, {
    message: "Invalid lock configuration. Check parent keys and lock type.",
    path: ["locked", "key_parent_id", "key_parent_text", "lock_type"],
});

const Staging = () => {
    const { data: session } = useSession();
    const stagingItem = useSearchStore((state) => state.stagingItem);
    const clearStagingItem = useSearchStore((state) => state.clearStagingItem);
    const [incompleteItems, setIncompleteItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [customCategory, setCustomCategory] = useState('');
    const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);
    const [nextQueueNumber, setNextQueueNumber] = useState(null);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            media_type: '',
            category: 'General',
            description: '',
            poster_path: '',
            backdrop_path: '',
            locked: false,
            key_parent: "",
            key_parent_id: null,
            key_parent_text: null,
            lock_type: null,
            goal_time: 0,
            goal_pages: 0,
            goal_episodes: 0,
            genres: [],
            duration: 0,
            queue_number: null,
            completed_duration: 0,
            completed: false,
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
                console.log('Fetched incomplete items:', data.items);
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
            console.log('Staging Item Data:', stagingItem);
            const formData = {
                // Base media item data
                title: stagingItem.title,
                media_type: stagingItem.media_type,
                category: stagingItem.category || 'General',
                description: stagingItem.description,
                poster_path: stagingItem.poster_path,
                backdrop_path: stagingItem.backdrop_path,
                genres: stagingItem.genres || [],

                // Lock fields
                locked: false,
                key_parent_id: null,
                key_parent_text: null,
                goal_time: 0,
                goal_pages: 0,
                goal_episodes: 0,

                // Progress fields
                duration: stagingItem.duration,
                queue_number: null,
                completed_duration: 0,
                completed: false,

                // Media-specific fields (spread all fields from stagingItem)
                ...stagingItem
            };
            console.log('Setting form data:', formData);
            form.reset(formData);
        }
    }, [stagingItem, form]);

    useEffect(() => {
        const fetchNextQueueNumber = async () => {
            try {
                const response = await fetch('/api/media-items/queue-number');
                const data = await response.json();
                setNextQueueNumber(data.nextQueueNumber);
            } catch (error) {
                console.error('Error fetching next queue number:', error);
            }
        };

        fetchNextQueueNumber();
    }, []);

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
        try {
            setIsLoading(true);

            // Add the queue number to the submission data
            const submissionData = {
                ...data,
                queue_number: nextQueueNumber
            };

            const response = await fetch('/api/media-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                throw new Error('Failed to add item');
            }

            const result = await response.json();
            console.log('Media item created:', result);

            // If the item should be locked, create the lock
            if (data.locked && data.createLock) {
                console.log('Attempting to create lock...'); // Debug lock creation attempt
                try {
                    await data.createLock(result.data.id);
                    console.log('Lock created successfully');
                } catch (error) {
                    console.error('Failed to create lock:', error);
                    toast.error('Item added but lock creation failed', {
                        description: error.message
                    });
                }
            } else {
                console.log('Skipping lock creation:', {
                    locked: data.locked,
                    hasCreateLock: !!data.createLock
                }); // Debug why lock creation was skipped
            }

            toast.success(`${data.title} added to your queue!`, {
                description: data.locked ? 'Item added with lock requirements' : 'Item added successfully'
            });

            clearStagingItem();
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error('Failed to add item', {
                description: error.message
            });
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
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log('Form submit event triggered');
                            console.log('Form errors:', form.formState.errors);
                            form.handleSubmit(onSubmit)(e);
                        }}
                        className="space-y-6"
                    >
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

                            {stagingItem.genres && stagingItem.genres.length > 0 && (
                                <div className="col-span-2">
                                    <FormLabel>Genres</FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        {stagingItem.genres.join(', ')}
                                    </p>
                                </div>
                            )}

                            <LockRequirements
                                form={form}
                                incompleteItems={incompleteItems}
                                calculateReadingTime={calculateReadingTime}
                                allCategories={allCategories}
                                userId={session?.user?.id}
                            />
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearStagingItem}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                onClick={() => console.log('Submit button clicked')}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    'Add to Queue'
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default Staging;