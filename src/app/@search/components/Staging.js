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
import styles from './staging.module.css';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/loading/loading-screen";

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
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [showDurationDialog, setShowDurationDialog] = useState(false);
    const [customDuration, setCustomDuration] = useState('');
    const [dialogMessage, setDialogMessage] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);

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
            } finally {
                setIsLoadingCategories(false);
            }
        };

        const fetchIncompleteItems = async () => {
            try {
                const response = await fetch('/api/media-items/incomplete');
                const data = await response.json();
                setIncompleteItems(data.items);
            } catch (error) {
                console.error('Failed to fetch incomplete items:', error);
            }
        };

        const fetchNextQueueNumber = async () => {
            try {
                const response = await fetch('/api/media-items/queue-number');
                const data = await response.json();
                setNextQueueNumber(data.nextQueueNumber);
            } catch (error) {
                console.error('Error fetching next queue number:', error);
            }
        };

        const initialize = async () => {
            try {
                await Promise.all([
                    fetchCategories(),
                    fetchIncompleteItems(),
                    fetchNextQueueNumber()
                ]);
            } catch (error) {
                console.error('Error initializing:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        initialize();
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

            const missingData = checkRequiredData(formData);
            if (missingData.required) {
                setShowDurationDialog(true);
            }

            console.log('Setting form data:', formData);
            form.reset(formData);
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

    const checkRequiredData = (data) => {
        switch (data.media_type) {
            case 'tv':
                return {
                    required: !data.average_runtime || !data.total_episodes,
                    type: 'episode_length',
                    defaults: [20, 30, 45, 60],
                    current: data.average_runtime || 30
                };
            case 'book':
                return {
                    required: !data.page_count,
                    type: 'page_count',
                    defaults: [200],
                    current: data.page_count || 200
                };
            case 'movie':
                return {
                    required: !data.duration,
                    type: 'duration',
                    defaults: [120],
                    current: data.duration || 120
                };
            case 'game':
                return {
                    required: !data.duration,
                    type: 'duration',
                    defaults: [2400], // 40 hours in minutes
                    current: data.duration || 2400
                };
            default:
                return { required: false };
        }
    };

    const DurationDialog = () => {
        const mediaType = form.getValues('media_type');
        const missingData = checkRequiredData(form.getValues());
        const title = form.getValues('title');
        const [selectedValue, setSelectedValue] = useState(
            (missingData?.current || missingData?.defaults[0])?.toString()
        );

        const handleDurationSelect = () => {
            if (!selectedValue) return;

            switch (mediaType) {
                case 'tv':
                    form.setValue('average_runtime', parseInt(selectedValue));
                    form.setValue('duration', parseInt(selectedValue) * form.getValues('total_episodes'));
                    toast.success('Episode length set', {
                        description: `Set to ${selectedValue} minutes per episode`
                    });
                    break;
                case 'book':
                    form.setValue('page_count', parseInt(selectedValue));
                    form.setValue('duration', calculateReadingTime(parseInt(selectedValue)));
                    toast.success('Page count set', {
                        description: `Set to ${selectedValue} pages`
                    });
                    break;
                case 'movie':
                    form.setValue('duration', parseInt(selectedValue));
                    toast.success('Duration set', {
                        description: `Set to ${selectedValue} minutes`
                    });
                    break;
                case 'game':
                    form.setValue('duration', parseInt(selectedValue));
                    toast.success('Playtime set', {
                        description: `Set to ${selectedValue / 60} hours`
                    });
                    break;
            }
            setShowDurationDialog(false);
            setDialogMessage('');
        };

        useEffect(() => {
            if (mediaType && missingData?.required) {
                switch (mediaType) {
                    case 'tv':
                        setDialogMessage(`No episode length found for "${title}". Please specify the average episode duration.`);
                        break;
                    case 'book':
                        setDialogMessage(`No page count found for "${title}". Please specify the number of pages.`);
                        break;
                    case 'movie':
                        setDialogMessage(`No duration found for "${title}". Please specify the movie length.`);
                        break;
                    case 'game':
                        setDialogMessage(`No playtime found for "${title}". Please specify the estimated completion time.`);
                        break;
                }
            }
        }, [mediaType, title]);

        if (!missingData?.required || !mediaType) {
            return null;
        }

        return (
            <Dialog
                open={showDurationDialog}
                onOpenChange={(open) => {
                    if (!open && form.getValues('duration')) {
                        setShowDurationDialog(false);
                        setDialogMessage('');
                    }
                }}
            >
                <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>
                            {mediaType === 'tv' ? 'Episode Length' :
                                mediaType === 'book' ? 'Page Count' :
                                    'Duration'}
                        </DialogTitle>
                        {dialogMessage && (
                            <p className="text-sm text-muted-foreground mt-2">
                                {dialogMessage}
                            </p>
                        )}
                    </DialogHeader>

                    <div className="py-4">
                        <RadioGroup
                            value={selectedValue}
                            onValueChange={setSelectedValue}
                        >
                            {missingData.defaults.map(value => (
                                <div key={value} className="flex items-center space-x-2">
                                    <RadioGroupItem value={value.toString()} id={`duration-${value}`} />
                                    <Label htmlFor={`duration-${value}`}>
                                        {mediaType === 'tv' ? `${value} minutes per episode` :
                                            mediaType === 'book' ? `${value} pages` :
                                                mediaType === 'game' ? `${value / 60} hours to complete` :
                                                    `${value} minutes`}
                                    </Label>
                                </div>
                            ))}
                            <div className="flex items-center space-x-2 mt-2">
                                <RadioGroupItem value="custom" id="duration-custom" />
                                <Input
                                    type="number"
                                    placeholder={`Custom ${mediaType === 'tv' ? 'minutes per episode' :
                                            mediaType === 'book' ? 'pages' :
                                                mediaType === 'game' ? 'hours' :
                                                    'minutes'
                                        }`}
                                    value={customDuration}
                                    onChange={(e) => {
                                        setCustomDuration(e.target.value);
                                        setSelectedValue(e.target.value);
                                    }}
                                />
                            </div>
                        </RadioGroup>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleDurationSelect}>
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    const renderDurationInfo = () => {
        const mediaType = form.getValues('media_type');
        const duration = form.getValues('duration');
        const pageCount = form.getValues('page_count');
        const episodeLength = form.getValues('average_runtime');
        const totalEpisodes = form.getValues('total_episodes');

        if (!mediaType) return null;

        return (
            <div className="space-y-2 mt-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold">Duration Details</h3>
                {mediaType === 'tv' && (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Episode Length: {episodeLength} minutes
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Total Episodes: {totalEpisodes}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Total Time: {duration} minutes ({Math.round(duration / 60)} hours)
                        </p>
                    </>
                )}
                {mediaType === 'book' && (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Pages: {pageCount}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Estimated Reading Time: {duration} minutes ({Math.round(duration / 60)} hours)
                        </p>
                    </>
                )}
                {mediaType === 'movie' && (
                    <p className="text-sm text-muted-foreground">
                        Runtime: {duration} minutes ({Math.round(duration / 60)} hours)
                    </p>
                )}
                {mediaType === 'game' && (
                    <p className="text-sm text-muted-foreground">
                        Estimated Completion Time: {duration} minutes ({Math.round(duration / 60)} hours)
                    </p>
                )}
            </div>
        );
    };

    if (isInitializing || !stagingItem) {
        return (
            <Card className={styles.stagingCard}>
                <LoadingScreen />
            </Card>
        );
    }

    return (
        <Card className={styles.stagingCard}>
            <CardHeader className={styles.stagingHeader}>
                <CardTitle className={styles.stagingTitle}>
                    Review and Customize
                </CardTitle>
                <CardDescription className={styles.stagingDescription}>
                    Customize your media item and set any locks or requirements
                </CardDescription>
            </CardHeader>
            <CardContent className={styles.stagingContent}>
                <Form {...form}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log('Form submit event triggered');
                            console.log('Form errors:', form.formState.errors);
                            form.handleSubmit(onSubmit)(e);
                        }}
                        className={styles.formGrid}
                    >
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className={styles.formField}>
                                    <FormLabel className={styles.formLabel}>Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage className={styles.errorMessage} />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem className={styles.categoryWrapper}>
                                    <FormLabel className={styles.formLabel}>Category</FormLabel>
                                    {isLoadingCategories ? (
                                        <div className={styles.skeletonInput} />
                                    ) : (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className={styles.categorySelect}
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
                                    )}
                                    <FormMessage className={styles.errorMessage} />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className={styles.descriptionWrapper}>
                                    <FormLabel className={styles.formLabel}>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className={styles.descriptionField}
                                        />
                                    </FormControl>
                                    <FormMessage className={styles.errorMessage} />
                                </FormItem>
                            )}
                        />

                        {stagingItem.genres && stagingItem.genres.length > 0 && (
                            <div className={styles.genreList}>
                                {stagingItem.genres.map((genre) => (
                                    <span key={genre} className={styles.genreTag}>
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        <LockRequirements
                            form={form}
                            incompleteItems={incompleteItems}
                            calculateReadingTime={calculateReadingTime}
                            allCategories={allCategories}
                            userId={session?.user?.id}
                            className={styles.fullWidth}
                        />

                        {renderDurationInfo()}

                        <div className={styles.formActions}>
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
                <DurationDialog />
            </CardContent>
        </Card>
    );
};

export default Staging;