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
    DialogDescription,
} from "@/components/ui/dialog";
import {
    RadioGroup,
    RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { LoadingScreen } from "@/components/loading/loading-screen";
import { COMMON_GENRES, MEDIA_SPECIFIC_GENRES, GAME_GENRE_DURATIONS } from '../lib/genres';
import { MultipleSelector } from '@/components/ui/multiple-selector';
import React from 'react';
import { validateCategory, PROTECTED_CATEGORIES } from "@/lib/utils";
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, PlusCircle, Plus, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];
const READING_SPEED = 250; // Average reading speed in words per minute
const DEFAULT_WORDS_PER_PAGE = 300; // Average words per page
const DEFAULT_READING_SPEED_PAGES = 0.667; // Default pages per minute (200wpm/300words per page)

const formSchema = z.object({
    // Base media item fields
    title: z.string().min(1, "Title is required"),
    media_type: z.string(),
    category: z.string().min(1, "Category is required"),
    description: z.string().optional().nullable().default(""),
    genres: z.any().optional(),  // Change from array validation to any (completely optional)
    poster_path: z.string().optional().nullable().default(""),
    backdrop_path: z.string().optional().nullable().default(""),

    // Make all other fields more permissive
    locked: z.boolean().default(false),
    key_parent: z.string().optional().nullable(),
    key_parent_id: z.string().optional().nullable(),
    key_parent_text: z.string().optional().nullable(),
    lock_type: z.string().optional().nullable(), // Changed from enum to string
    goal_time: z.number().optional().default(0),
    goal_pages: z.number().optional().default(0),
    goal_episodes: z.number().optional().default(0),

    // Progress fields
    duration: z.number().optional().default(0),
    queue_number: z.number().optional().nullable(),
    completed_duration: z.number().optional().default(0),
    completed: z.boolean().optional().default(false),
    pages_completed: z.number().optional().nullable(),
    episodes_completed: z.number().optional().nullable(),

    // Make all media-specific fields optional and nullable
    authors: z.array(z.string()).optional().nullable(),
    average_rating: z.number().optional().nullable(),
    categories: z.array(z.string()).optional().nullable(),
    estimated_reading_time: z.number().optional().nullable(),
    google_books_id: z.string().optional().nullable(),
    isbn: z.string().optional().nullable(),
    language: z.string().optional().nullable(),
    page_count: z.number().optional().nullable(),
    preview_link: z.string().optional().nullable(),
    published_date: z.string().optional().nullable(),
    publisher: z.string().optional().nullable(),
    ratings_count: z.number().optional().nullable(),
    reading_speed: z.number().optional().nullable(),
    director: z.string().optional().nullable(),
    original_language: z.string().optional().nullable(),
    release_date: z.string().optional().nullable(),
    tmdb_id: z.number().optional().nullable(),
    vote_average: z.number().optional().nullable(),
    average_runtime: z.number().optional().nullable(),
    episode_run_times: z.number().optional().nullable(),
    seasons: z.number().optional().nullable(),
    total_episodes: z.number().optional().nullable(),
    achievements_count: z.number().optional().nullable(),
    average_playtime: z.number().optional().nullable(),
    esrb_rating: z.string().optional().nullable(),
    metacritic: z.number().optional().nullable(),
    platforms: z.string().optional().nullable(),
    publishers: z.string().optional().nullable(),
    rating: z.number().optional().nullable(),
    rating_count: z.number().optional().nullable(),
    rawg_id: z.number().optional().nullable(),
    website: z.string().optional().nullable(),
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
    const [durationHours, setDurationHours] = useState(2); // Default 2 hours
    const [validationErrors, setValidationErrors] = useState({});
    const [expandedSections, setExpandedSections] = useState({
        basic: true,
        details: false,
        lock: false
    });
    const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
    const [genreDialogOpen, setGenreDialogOpen] = useState(false);
    const [genreInput, setGenreInput] = useState('');

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

    // Add a watch for the media_type to conditionally render fields
    const mediaType = form.watch('media_type');

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

            // Create form data with proper defaults for nullable fields
            const formData = {
                // Base media item data
                title: stagingItem.title || "",
                media_type: stagingItem.media_type || "",
                category: stagingItem.category || 'General',
                description: stagingItem.description || "",
                poster_path: stagingItem.poster_path || "",
                backdrop_path: stagingItem.backdrop_path || "",
                genres: stagingItem.genres || [],

                // Lock fields
                locked: false,
                key_parent_id: null,
                key_parent_text: null,
                goal_time: 0,
                goal_pages: 0,
                goal_episodes: 0,

                // Progress fields
                duration: stagingItem.duration || 0,
                queue_number: null,
                completed_duration: 0,
                completed: false,

                // Media-specific fields (spread all fields from stagingItem)
                ...stagingItem
            };

            // Check for missing data
            const missingData = checkRequiredData(formData);
            if (missingData.required) {
                console.log("Initial load - Missing required data:", missingData);
                setDialogMessage(
                    stagingItem.media_type === 'tv' ? `No episode length found for "${stagingItem.title}". Please specify the average episode duration.` :
                        stagingItem.media_type === 'book' ? `No page count found for "${stagingItem.title}". Please specify the number of pages.` :
                            stagingItem.media_type === 'movie' ? `No duration found for "${stagingItem.title}". Please specify the movie length.` :
                                `No playtime found for "${stagingItem.title}". Please specify the estimated completion time.`
                );
                setShowDurationDialog(true);
            }

            console.log('Setting form data:', formData);
            form.reset(formData);
        }
    }, [stagingItem, form]);

    // Update validateFormData to remove genre validation
    const validateFormData = (data) => {
        const errors = {};

        // Check for required duration based on media type
        if (data.media_type === 'movie' || data.media_type === 'tv' || data.media_type === 'game') {
            if (!data.duration || data.duration <= 0) {
                errors.duration = `Please enter the ${data.media_type === 'movie' ? 'runtime' :
                    data.media_type === 'tv' ? 'total runtime' :
                        'estimated completion time'
                    } for this ${data.media_type}.`;
            }
        } else if (data.media_type === 'book') {
            if (!data.page_count || data.page_count <= 0) {
                errors.page_count = "Please enter the number of pages for this book.";
            }
        }

        // Add other validations as needed
        if (!data.title || data.title.trim() === '') {
            errors.title = "Title is required";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Add this function to check if the form is valid for submission
    const isFormValid = () => {
        const formData = form.getValues();
        const missingData = checkRequiredData(formData);

        // Log validation state for debugging
        console.log("Form validation check:", {
            formData: formData,
            missingData: missingData,
            formState: form.formState
        });

        // The form is valid if there's no missing required data
        return !missingData.required;
    };

    // Update the onSubmit function to add more logging
    const onSubmit = async (data) => {
        console.log("Form submission triggered with data:", data);

        // Check for missing required data first
        const missingData = checkRequiredData(data);
        if (missingData.required) {
            console.log("Missing required data, opening dialog:", missingData);
            setDialogMessage(
                data.media_type === 'tv' ? `Please enter the episode length for this TV show.` :
                    data.media_type === 'book' ? `Please enter the number of pages for this book.` :
                        data.media_type === 'movie' ? `Please enter the runtime for this movie.` :
                            `Please enter the estimated completion time for this game.`
            );
            setShowDurationDialog(true);
            return; // Stop submission until dialog is handled
        }

        try {
            // Clean up any null values
            const cleanData = {
                ...data,
                backdrop_path: data.backdrop_path || "",
                poster_path: data.poster_path || "",
                description: data.description || ""
            };

            console.log("All required data present, proceeding with submission:", cleanData);
            setIsLoading(true);

            // Add the queue number
            const submissionData = {
                ...cleanData,
                queue_number: nextQueueNumber
            };

            console.log("Sending API request with data:", submissionData);

            // Make the API call with detailed error handling
            const response = await fetch('/api/media-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                // Try to get detailed error message
                const errorText = await response.text();
                console.error("API Error Response:", {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText
                });

                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.message || 'Server error');
                } catch (e) {
                    throw new Error(`Failed to add item: ${response.status} ${response.statusText}`);
                }
            }

            const result = await response.json();
            console.log('Media item created successfully:', result);

            // Rest of your existing code for locks and success handling
            // ... existing code ...

            toast.success(`${data.title} added to your queue!`);
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

    // Create a new component for the duration slider with hours and minutes display
    const DurationSelector = () => {
        const mediaType = form.getValues('media_type');

        // Skip if not applicable
        if (!['movie', 'tv', 'game'].includes(mediaType)) {
            return null;
        }

        const durationLabel = {
            'movie': 'Movie Runtime',
            'tv': 'TV Show Total Runtime',
            'game': 'Estimated Completion Time'
        }[mediaType] || 'Duration';

        // Calculate minutes from hours
        const minutes = hoursToMinutes(durationHours);

        return (
            <div className={`space-y-2 ${validationErrors.duration ? 'error-highlight' : ''}`}>
                <div className="flex justify-between items-center">
                    <FormLabel>{durationLabel}</FormLabel>
                    <span className="text-sm text-muted-foreground">
                        {durationHours.toFixed(1)} hours ({minutes} minutes)
                    </span>
                </div>

                <Slider
                    value={[durationHours]}
                    min={0.5}
                    max={24}
                    step={0.5}
                    onValueChange={(values) => {
                        const hours = values[0];
                        setDurationHours(hours);

                        // Update the form with minutes
                        const minutes = hoursToMinutes(hours);
                        form.setValue('duration', minutes);

                        // Clear validation error if present
                        if (validationErrors.duration) {
                            const newErrors = { ...validationErrors };
                            delete newErrors.duration;
                            setValidationErrors(newErrors);
                        }
                    }}
                />

                {validationErrors.duration && (
                    <p className="text-sm text-destructive">{validationErrors.duration}</p>
                )}
            </div>
        );
    };

    // Replace the renderDurationInfo function
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
                        <FormDescription>
                            Based on {session?.user?.reading_speed ? 'your' : 'an average'} reading speed
                        </FormDescription>
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

    // Add CSS for error highlighting
    const errorStyles = `
        .error-highlight {
            box-shadow: 0 0 0 2px rgb(239, 68, 68);
            padding: 8px;
            border-radius: 6px;
            background-color: rgba(239, 68, 68, 0.05);
        }
        
        .error-highlight input,
        .error-highlight textarea,
        .error-highlight .select-trigger {
            border-color: rgb(239, 68, 68);
        }
    `;

    const handleCustomCategoryAdd = () => {
        const trimmedCategory = customCategory.trim();
        if (!trimmedCategory) return;

        if (!validateCategory(trimmedCategory)) {
            toast.error(
                "Cannot use media type as category", {
                description: "Warning: Naming categories after media types causes unintended paradox. Not recommended unless facing Gozer the Gozerian (Maybe try a variation)"
            });
            return;
        }

        if (!allCategories.includes(trimmedCategory)) {
            setAllCategories(prev => [...prev, trimmedCategory]);
            // Immediately set the form value to the new category
            form.setValue('category', trimmedCategory);
            toast.success(`Added "${trimmedCategory}" category`);
        } else {
            // If category already exists, just select it
            form.setValue('category', trimmedCategory);
        }

        // Reset custom category input and hide it
        setCustomCategory('');
        setIsAddingCustomCategory(false);
    };

    // Handle input keypress events for the custom category field
    const handleCustomCategoryKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCustomCategoryAdd();
        }
    };

    const calculateReadingTime = (pages, userReadingSpeed) => {
        // If user has a custom reading speed, use that
        if (userReadingSpeed) {
            return Math.round(pages / userReadingSpeed);
        }

        // Otherwise use the default calculation
        return Math.round(pages / DEFAULT_READING_SPEED_PAGES);
    };

    const checkRequiredData = (data) => {
        console.log("Checking required data for:", data);

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
                    defaults: [200, 300, 400],
                    current: data.page_count || 300
                };
            case 'movie':
                return {
                    required: !data.duration,
                    type: 'duration',
                    defaults: [90, 120, 150],
                    current: data.duration || 120
                };
            case 'game':
                return {
                    required: !data.duration,
                    type: 'duration',
                    defaults: [600, 1200, 2400], // 10, 20, 40 hours in minutes
                    current: data.duration || 1200
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
                        description: `Set to ${Math.round(selectedValue / 60)} hours`
                    });
                    break;
            }

            // Just close the dialog and DON'T submit the form
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
        }, [mediaType, title, missingData?.required]);

        if (!missingData?.required || !mediaType) {
            return null;
        }

        return (
            <Dialog
                open={showDurationDialog}
                onOpenChange={(open) => {
                    console.log("Dialog open state changing to:", open);
                    if (!open && form.getValues('duration')) {
                        setShowDurationDialog(false);
                        setDialogMessage('');
                    } else {
                        setShowDurationDialog(open);
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
                                                mediaType === 'game' ? `${Math.round(value / 60)} hours to complete` :
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
                                        // If this is for games and user is inputting hours, convert to minutes
                                        if (mediaType === 'game') {
                                            const hours = parseFloat(e.target.value);
                                            const minutes = Math.round(hours * 60);
                                            setSelectedValue(minutes.toString());
                                        } else {
                                            setSelectedValue(e.target.value);
                                        }
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

    // Log genre structure for debugging
    useEffect(() => {
        console.log("Common Genres Structure:", COMMON_GENRES);
        console.log("Media Specific Genres:", MEDIA_SPECIFIC_GENRES);
    }, []);

    // Enhanced GenreSelector with better format handling
    const GenreSelector = () => {
        const mediaType = form.getValues('media_type');
        const selectedGenres = form.watch('genres') || [];

        console.log("Current selected genres:", selectedGenres);

        // Combine genres and handle both string and object formats
        const availableGenres = React.useMemo(() => {
            const mediaSpecificGenres = MEDIA_SPECIFIC_GENRES[mediaType] || [];
            const allGenres = [...COMMON_GENRES, ...mediaSpecificGenres];

            // Normalize genres to ensure consistent structure
            return allGenres.map(genre => {
                // If genre is a string, convert to object
                if (typeof genre === 'string') {
                    return { label: genre, value: genre.toLowerCase() };
                }
                // If genre is already an object with value/label
                if (genre && typeof genre === 'object') {
                    // Ensure both label and value exist
                    return {
                        label: genre.label || genre.value || genre.name || String(genre),
                        value: genre.value || genre.label || genre.name || String(genre)
                    };
                }
                // Fallback for any other case
                return { label: String(genre), value: String(genre) };
            });
        }, [mediaType]);

        const handleSelectGenre = (genreValue) => {
            // For custom input, create a properly formatted genre object
            if (typeof genreValue === 'string') {
                const existingGenre = availableGenres.find(g =>
                    g.value === genreValue || g.label.toLowerCase() === genreValue.toLowerCase()
                );

                if (existingGenre) {
                    // Use existing genre object if found
                    if (!selectedGenres.some(g => g.value === existingGenre.value)) {
                        form.setValue('genres', [...selectedGenres, existingGenre]);
                    }
                } else {
                    // Create new genre object for custom input
                    const newGenre = {
                        label: genreValue,
                        value: genreValue.toLowerCase().replace(/\s+/g, '_')
                    };
                    form.setValue('genres', [...selectedGenres, newGenre]);
                }
            }
            setGenreInput('');
        };

        const handleRemoveGenre = (genreValue) => {
            form.setValue('genres', selectedGenres.filter(g => {
                if (typeof g === 'string') return g !== genreValue;
                return g.value !== genreValue;
            }));
        };

        // Helper to safely get label/value from potentially inconsistent genre format
        const getGenreLabel = (genre) => {
            if (typeof genre === 'string') return genre;
            if (genre && typeof genre === 'object') {
                return genre.label || genre.value || genre.name || "Genre";
            }
            return "Genre";
        };

        const getGenreValue = (genre) => {
            if (typeof genre === 'string') return genre;
            if (genre && typeof genre === 'object') {
                return genre.value || genre.label || genre.name || String(genre);
            }
            return String(genre);
        };

        return (
            <FormField
                control={form.control}
                name="genres"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Genres</FormLabel>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {selectedGenres.map((genre, index) => (
                                <Badge
                                    key={`genre-${index}-${getGenreValue(genre)}`}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {getGenreLabel(genre)}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleRemoveGenre(getGenreValue(genre))}
                                    >
                                        <X className="h-3 w-3" />
                                        <span className="sr-only">Remove {getGenreLabel(genre)}</span>
                                    </Button>
                                </Badge>
                            ))}
                            {selectedGenres.length === 0 && (
                                <div className="text-sm text-muted-foreground">No genres selected</div>
                            )}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setGenreDialogOpen(true)}
                            className="w-full justify-start text-left font-normal"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add genres...
                        </Button>

                        <Dialog open={genreDialogOpen} onOpenChange={setGenreDialogOpen}>
                            <DialogContent className="dialog-content sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Select Genres</DialogTitle>
                                </DialogHeader>
                                <div className="py-4">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Input
                                            value={genreInput}
                                            onChange={(e) => setGenreInput(e.target.value)}
                                            placeholder="Search or add custom genre..."
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (genreInput.trim()) {
                                                    handleSelectGenre(genreInput.trim());
                                                }
                                            }}
                                            disabled={!genreInput.trim()}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                                        {availableGenres
                                            .filter(genre => {
                                                const genreLabel = getGenreLabel(genre).toLowerCase();
                                                const input = genreInput.toLowerCase();

                                                // Check if genre is already selected
                                                const isSelected = selectedGenres.some(g =>
                                                    getGenreValue(g) === getGenreValue(genre)
                                                );

                                                return genreLabel.includes(input) && !isSelected;
                                            })
                                            .map((genre, index) => (
                                                <Button
                                                    key={`available-${index}-${getGenreValue(genre)}`}
                                                    type="button"
                                                    variant="ghost"
                                                    className="w-full justify-start text-left py-3"
                                                    onClick={() => {
                                                        handleSelectGenre(getGenreValue(genre));
                                                    }}
                                                >
                                                    {getGenreLabel(genre)}
                                                </Button>
                                            ))}
                                        {/* ...no results message... */}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
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
            <style>{errorStyles}</style>
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className={styles.stagingForm}>
                        {/* Basic Information Section */}
                        <div className={styles.formSection}>
                            <button
                                type="button"
                                onClick={() => toggleSection('basic')}
                                className={styles.sectionToggle}
                            >
                                <h3 className={styles.sectionTitle}>Basic Information</h3>
                                {expandedSections.basic ? <ChevronUp /> : <ChevronDown />}
                            </button>

                            {expandedSections.basic && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className={styles.sectionContent}
                                >
                                    {/* Basic form fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Title field */}
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

                                        {/* Enhanced Category field */}
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    {!isAddingCustomCategory ? (
                                                        <>
                                                            <Select
                                                                onValueChange={field.onChange}
                                                                value={field.value}
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Select category" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectGroup>
                                                                        {allCategories.map((cat) => (
                                                                            <SelectItem key={cat} value={cat}>
                                                                                {cat}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectGroup>
                                                                </SelectContent>
                                                            </Select>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="mt-1"
                                                                onClick={() => setIsAddingCustomCategory(true)}
                                                            >
                                                                <PlusCircle className="h-4 w-4 mr-1" />
                                                                Add custom category
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    value={customCategory}
                                                                    onChange={(e) => setCustomCategory(e.target.value)}
                                                                    onKeyPress={handleCustomCategoryKeyPress}
                                                                    placeholder="Enter custom category"
                                                                    className="flex-1"
                                                                    autoFocus
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    onClick={handleCustomCategoryAdd}
                                                                    disabled={!customCategory.trim()}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setIsAddingCustomCategory(false);
                                                                    setCustomCategory('');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    )}
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Description field with full-width class */}
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem className="full-width-mobile">
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Enter a description"
                                                        {...field}
                                                        value={field.value || ''}
                                                        className="min-h-[100px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {/* Genres selector */}
                                    <GenreSelector />
                                </motion.div>
                            )}
                        </div>

                        {/* Media Details Section */}
                        <div className={styles.formSection}>
                            <button
                                type="button"
                                onClick={() => toggleSection('details')}
                                className={styles.sectionToggle}
                            >
                                <h3 className={styles.sectionTitle}>Media Details</h3>
                                {expandedSections.details ? <ChevronUp /> : <ChevronDown />}
                            </button>

                            {expandedSections.details && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className={styles.sectionContent}
                                >
                                    {/* Media type specific fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Fields common to all media types */}
                                        <FormField
                                            control={form.control}
                                            name="genres"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Genres</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} value={field.value || ''} />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Comma-separated list of genres
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Book-specific fields */}
                                        {mediaType === 'book' && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="authors"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Author(s)</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="page_count"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Page Count</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="isbn"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>ISBN</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="publisher"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Publisher</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* Movie-specific fields */}
                                        {mediaType === 'movie' && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="runtime"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Runtime (minutes)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="director"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Director</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="release_date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Release Date</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="vote_average"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Rating</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.1"
                                                                    min="0"
                                                                    max="10"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>Rating out of 10</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* TV-specific fields */}
                                        {mediaType === 'tv' && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="seasons"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Seasons</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="total_episodes"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Total Episodes</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="average_runtime"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Episode Runtime (min)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="release_date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>First Air Date</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}

                                        {/* Game-specific fields */}
                                        {mediaType === 'game' && (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="platforms"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Platforms</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Comma-separated list of platforms
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="publishers"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Publisher(s)</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="average_playtime"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Average Playtime (min)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    {...field}
                                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                    value={field.value || ''}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="release_date"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Release Date</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Lock genre Section */}
                        <div className={styles.formSection}>
                            <button
                                type="button"
                                onClick={() => toggleSection('lock')}
                                className={styles.sectionToggle}
                            >
                                <h3 className={styles.sectionTitle}>Lock Requirements</h3>
                                {expandedSections.lock ? <ChevronUp /> : <ChevronDown />}
                            </button>

                            {expandedSections.lock && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className={styles.sectionContent}
                                >
                                    <LockRequirements
                                        form={form}
                                        incompleteItems={incompleteItems}
                                        allCategories={allCategories}
                                        calculateReadingTime={calculateReadingTime}
                                        userId={session?.user?.id}
                                    />
                                </motion.div>
                            )}
                        </div>

                        {/* Submit section */}
                        <div className={styles.submitSection}>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adding to Queue...
                                    </>
                                ) : (
                                    'Add to Queue'
                                )}
                            </Button>
                        </div>

                        {/* Dialogs as before */}
                    </form>
                </Form>
                <DurationDialog />
            </CardContent>
        </Card>
    );
};

export default Staging;