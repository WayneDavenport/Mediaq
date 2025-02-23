'use client'
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useId } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { useOutsideClick } from "@/hooks/use-outside-click";
import styles from './styles.module.css';
import { Badge } from "@/components/ui/badge";
import UpdateProgressModal from "@/components/progress/UpdateProgressModal";
import { Button } from "@/components/ui/button";
import ProgressSection from "@/components/progress/ProgressSection";
import { Trash2, X, Loader2, Plus, ArrowUp, ArrowDown, MoveRight, Users, ExternalLink } from 'lucide-react';
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import MediaTypeIcon from "@/components/ui/media-type-icon";
import TimeCostChart from "@/components/progress/TImeCostChart";
import ProgressChart from "@/components/progress/ProgressChart";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading/loading-screen";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ToasterProvider } from "@/components/providers/toaster-provider"

const PRESET_CATEGORIES = ['Fun', 'Learning', 'Hobby', 'Productivity', 'General'];

export default function Dashboard() {
    const { data: session, status } = useSession();
    const [expandedId, setExpandedId] = useState(null);
    const [mediaItems, setMediaItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allCategories, setAllCategories] = useState(PRESET_CATEGORIES);
    const ref = useRef(null);
    const [updateModalOpen, setUpdateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const id = useId();
    const [sortOption, setSortOption] = useState("queue");
    const [lockedItems, setLockedItems] = useState([]);
    const [activeChart, setActiveChart] = useState("progress");
    const router = useRouter();

    useOutsideClick(ref, (event) => {
        // Check if the click is within a Select/dropdown component
        const isSelectClick = event.target.closest('[role="combobox"]') ||
            event.target.closest('[role="listbox"]') ||
            event.target.closest('[role="option"]') ||
            event.target.closest('[data-radix-select-viewport]');

        if (!isSelectClick) {
            setExpandedId(null);
        }
    });

    useEffect(() => {
        const fetchMediaItems = async () => {
            if (status === "authenticated") {
                try {
                    const response = await fetch('/api/media-items');
                    const data = await response.json();
                    if (data.items) {
                        console.log('Fetched media items:', data.items);
                        setMediaItems(data.items);
                    }
                } catch (error) {
                    console.error('Error fetching media items:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchMediaItems();
    }, [status]);

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

        if (status === "authenticated") {
            fetchCategories();
        }
    }, [status]);

    useEffect(() => {
        if (expandedId) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setExpandedId(null);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [expandedId]);

    const handleProgressUpdate = (newProgress) => {
        setMediaItems(items =>
            items.map(item =>
                item.id === selectedItem.id
                    ? {
                        ...item,
                        user_media_progress: {
                            ...item.user_media_progress,
                            completed_duration: newProgress,
                            completed: newProgress >= getMaxValue(item),
                            episodes_completed: selectedItem.media_type === 'tv'
                                ? Math.floor(newProgress / (selectedItem.tv_shows?.average_runtime || 30))
                                : item.user_media_progress?.episodes_completed,
                            pages_completed: selectedItem.media_type === 'book'
                                ? newProgress
                                : item.user_media_progress?.pages_completed
                        }
                    }
                    : item
            )
        );
    };

    const getMaxValue = (item) => {
        switch (item.media_type) {
            case 'book':
                return item.books?.page_count || 0;
            case 'movie':
                return item.user_media_progress?.duration || item.movies?.runtime || 0;
            case 'tv':
                return item.user_media_progress?.duration || 0;
            case 'game':
                return item.user_media_progress?.duration || 0;
            default:
                return 100;
        }
    };

    const handleDelete = async (itemId) => {
        if (!confirm("Are you sure you want to delete this item and all associated comments and locks? This action cannot be undone.")) {
            return;
        }

        try {
            const response = await fetch(`/api/media-items/${itemId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete item');
            }

            setMediaItems(items => items.filter(item => item.id !== itemId));
            setExpandedId(null);
            toast.success("Item deleted successfully");
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error("Failed to delete item");
        }
    };

    const getSortedMediaItems = () => {
        // Filter out completed items from the queue
        const activeItems = mediaItems.filter(item => !item.user_media_progress?.completed);

        switch (sortOption) {
            case "queue":
                return activeItems.sort((a, b) =>
                    (a.user_media_progress?.queue_number || 0) - (b.user_media_progress?.queue_number || 0)
                );

            case "title":
                return activeItems.sort((a, b) =>
                    a.title.localeCompare(b.title)
                );

            case "media-type":
                return activeItems
                    .sort((a, b) => a.title.localeCompare(b.title)) // First sort by title
                    .sort((a, b) => a.media_type.localeCompare(b.media_type)); // Then by media type

            case "category":
                return activeItems
                    .sort((a, b) => a.title.localeCompare(b.title)) // First sort by title
                    .sort((a, b) => a.category.localeCompare(b.category)); // Then by category

            default:
                return activeItems;
        }
    };

    // Get all locked items across all media items
    const getAllLockedItems = () => {
        return mediaItems.reduce((acc, item) => {
            if (item.locked_items && item.locked_items.length > 0) {
                return [...acc, ...item.locked_items];
            }
            return acc;
        }, []);
    };

    const getItemGlow = (item) => {
        const allLocks = getAllLockedItems();

        // Debug logs
        console.log('Checking glow for item:', item.id);
        console.log('Lock types:', allLocks.map(lock => ({
            id: lock.id,
            type: lock.lock_type,
            key_parent_id: lock.key_parent_id,
            media_item_id: lock.media_item_id
        })));

        // Check if this item is locked (if it has locked_items)
        if (item.locked_items && item.locked_items.length > 0) {
            return "shadow-[0_0_20px_-1px_rgba(255,0,0,0.6)] hover:shadow-[0_0_25px_0px_rgba(255,0,0,0.8)]";
        }

        // Check if this item is specifically required to unlock something
        const isSpecificRequirement = allLocks.some(lock =>
            lock.lock_type === 'specific' &&
            lock.key_parent_id === item.id  // Changed from media_item_id to key_parent_id
        );
        if (isSpecificRequirement) {
            return "shadow-[0_0_20px_-1px_rgba(163,71,255,0.6)] hover:shadow-[0_0_25px_0px_rgba(163,71,255,0.8)]";
        }

        // Check if this item can contribute to any category/type locks
        const canContribute = allLocks.some(lock =>
            lock.lock_type === 'media_type' &&
            lock.key_parent_text === item.media_type
        );
        if (canContribute) {
            return "shadow-[0_0_20px_-1px_rgba(0,149,255,0.6)] hover:shadow-[0_0_25px_0px_rgba(0,149,255,0.8)]";
        }

        return "";
    };

    const handleMoveToTop = async (itemId) => {
        try {
            // Update through API route
            const response = await fetch(`/api/media-items/${itemId}/queue-position`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ position: 'top' })
            });

            if (!response.ok) throw new Error('Failed to update queue position');

            // Refresh the items
            const refreshResponse = await fetch('/api/media-items');
            const data = await refreshResponse.json();
            if (data.items) setMediaItems(data.items);

            toast.success("Moved to top of queue");
        } catch (error) {
            console.error('Error updating queue:', error);
            toast.error("Failed to update queue");
        }
    };

    const handleMoveToBottom = async (itemId) => {
        try {
            const response = await fetch(`/api/media-items/${itemId}/queue-position`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ position: 'bottom' })
            });

            if (!response.ok) throw new Error('Failed to update queue position');

            // Refresh the items
            const refreshResponse = await fetch('/api/media-items');
            const data = await refreshResponse.json();
            if (data.items) setMediaItems(data.items);

            toast.success("Moved to bottom of queue");
        } catch (error) {
            console.error('Error updating queue:', error);
            toast.error("Failed to update queue");
        }
    };

    const handleCustomQueueNumber = async (itemId, newPosition) => {
        try {
            const response = await fetch(`/api/media-items/${itemId}/queue-position`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ position: newPosition })
            });

            if (!response.ok) throw new Error('Failed to update queue position');

            // Refresh the items
            const refreshResponse = await fetch('/api/media-items');
            const data = await refreshResponse.json();
            if (data.items) setMediaItems(data.items);

            toast.success("Queue position updated");
        } catch (error) {
            console.error('Error updating queue:', error);
            toast.error("Failed to update queue");
        }
    };

    if (status === "loading" || loading) {
        return <LoadingScreen />;
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>;
    }

    if (mediaItems.length === 0) {
        return (
            <div className="container max-w-2xl mx-auto p-4 text-center space-y-4">
                <h1 className="text-2xl font-bold">Welcome to MediaQueue!</h1>
                <p className="text-muted-foreground">
                    Welcome to your Mediaq Dashboard! Here you can organize your media, track your progress, and get much more. Your queue is currently empty. Get started by adding some movies, books, TV shows, or games to track.
                </p>
                <Link
                    href="/user-pages/search"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Search for Media
                </Link>
            </div>
        );
    }

    return (
        <>
            <ToasterProvider />
            <AnimatePresence>
                {expandedId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-[50]`}
                        onClick={() => setExpandedId(null)}
                    />
                )}
            </AnimatePresence>

            <motion.div className={styles.dashboardContainer}>
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">
                            MediaQueue
                        </h1>
                        {/* Mobile Sort Dropdown */}
                        <div className="block sm:hidden">
                            <Select
                                value={sortOption}
                                onValueChange={setSortOption}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="queue">Queue Order</SelectItem>
                                    <SelectItem value="title">Title</SelectItem>
                                    <SelectItem value="media-type">Media Type</SelectItem>
                                    <SelectItem value="category">Category</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Desktop Radio Group */}
                        <RadioGroup
                            defaultValue="queue"
                            value={sortOption}
                            onValueChange={setSortOption}
                            className="hidden sm:flex space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="queue" id="queue" />
                                <Label htmlFor="queue">Queue Order</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="title" id="title" />
                                <Label htmlFor="title">Title</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="media-type" id="media-type" />
                                <Label htmlFor="media-type">Media Type</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="category" id="category" />
                                <Label htmlFor="category">Category</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className={styles.mediaGrid}>
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, index) => (
                                    <SkeletonCard key={index} />
                                ))}
                            </div>
                        ) : (
                            <>
                                {getSortedMediaItems().map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layoutId={`card-${item.id}-${id}`}
                                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                        className={cn(
                                            styles.mediaCard,
                                            getItemGlow(item)
                                        )}
                                    >
                                        <Card className="overflow-hidden group relative">
                                            <div className={styles.mediaContent}>
                                                <motion.div
                                                    layoutId={`image-${item.id}-${id}`}
                                                    className={styles.posterWrapper}
                                                >
                                                    {/* Queue number and category badges - visible on all screen sizes */}
                                                    {sortOption === "queue" && (
                                                        <motion.div
                                                            className={styles.categoryLabel}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        >
                                                            <Badge variant="secondary">
                                                                #{item.user_media_progress?.queue_number || '?'}
                                                            </Badge>
                                                        </motion.div>
                                                    )}

                                                    {sortOption === "category" && (
                                                        <motion.div
                                                            className={styles.categoryLabel}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        >
                                                            {item.category}
                                                        </motion.div>
                                                    )}

                                                    {/* Title and media-type badges - desktop only */}
                                                    {sortOption === "title" && (
                                                        <motion.div
                                                            className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs z-10 hidden sm:block"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        >
                                                            <Badge variant="secondary" className="max-w-[120px] truncate" title={item.title}>
                                                                {item.title}
                                                            </Badge>
                                                        </motion.div>
                                                    )}
                                                    {sortOption === "media-type" && (
                                                        <motion.div
                                                            className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded text-xs z-10 hidden sm:block"
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                        >
                                                            <MediaTypeIcon type={item.media_type} className="h-4 w-4" />
                                                        </motion.div>
                                                    )}

                                                    {/* Rest of the content */}
                                                    <Image
                                                        src={(() => {
                                                            switch (item.media_type) {
                                                                case 'movie':
                                                                case 'tv':
                                                                    return item.poster_path
                                                                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                                                        : '/images/placeholder.jpg';
                                                                case 'book':
                                                                    return item.poster_path || '/images/placeholder.jpg';
                                                                case 'game':
                                                                    return item.poster_path || '/images/placeholder.jpg';
                                                                default:
                                                                    return '/images/placeholder.jpg';
                                                            }
                                                        })()}
                                                        alt={item.title}
                                                        width={160}
                                                        height={160}
                                                        className="object-cover rounded w-20 h-20"
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
                                                        <div className="relative h-full flex flex-col">
                                                            <div className="flex-1 flex items-center justify-center p-2">
                                                                <h2 className="text-white text-sm text-center font-medium line-clamp-2">
                                                                    {sortOption === "title" ? item.category : item.title}
                                                                </h2>
                                                            </div>
                                                            <div className="absolute bottom-1 right-1">
                                                                {sortOption === "media-type" ? (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="h-4 w-4 flex items-center justify-center"
                                                                    >
                                                                        #{item.user_media_progress?.queue_number || '?'}
                                                                    </Badge>
                                                                ) : (
                                                                    <MediaTypeIcon
                                                                        type={item.media_type}
                                                                        className="text-white drop-shadow-md h-4 w-4 opacity-100"
                                                                    />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                                {/* Add mobile-only title and icon */}
                                                <div className="sm:hidden flex flex-1 justify-between items-center">
                                                    <motion.h2
                                                        layoutId={`title-${item.id}-${id}`}
                                                        className="text-sm font-medium line-clamp-2"
                                                    >
                                                        {item.title}
                                                    </motion.h2>
                                                    <MediaTypeIcon
                                                        type={item.media_type}
                                                        className="h-4 w-4 opacity-100"
                                                    />
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                                <Link href="/user-pages/search" className={styles.mediaCard}>
                                    <Card className="overflow-hidden group relative">
                                        <div className={styles.mediaContent}>
                                            <div className={styles.posterWrapper}>
                                                <div className="w-20 h-20 grid place-items-center bg-muted rounded">
                                                    <Plus className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
                                                    <div className="relative h-full flex items-center justify-center">
                                                        <h2 className="text-white text-sm text-center font-medium">
                                                            Add New Media
                                                        </h2>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Add mobile-only title */}
                                            <div className="sm:hidden flex flex-1 justify-between items-center">
                                                <h2 className="text-sm font-medium">
                                                    Add New Media
                                                </h2>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className={styles.chartContainer}>
                    <div className="flex justify-end mb-4">
                        <Select
                            defaultValue="progress"
                            onValueChange={(value) => setActiveChart(value)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select chart type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="progress">Progress Overview</SelectItem>
                                <SelectItem value="time">Time Investment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeChart}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeChart === "progress" ? (
                                <ProgressChart
                                    mediaItems={mediaItems}
                                    sortOption={sortOption}
                                />
                            ) : (
                                <TimeCostChart
                                    mediaItems={mediaItems}
                                    sortOption={sortOption}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {expandedId && (
                    <div className="fixed inset-0 grid place-items-center z-[51]">
                        <motion.div
                            ref={ref}
                            layoutId={`card-${expandedId}-${id}`}
                            className={`${styles.expandedCard} bg-background border shadow-lg rounded-lg overflow-hidden`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.15 }
                            }}
                        >
                            {mediaItems.map(item => item.id === expandedId && (
                                <Card key={item.id} className={styles.expandedCardInner}>
                                    <div className="flex justify-between items-start mb-4">
                                        <motion.h2
                                            layoutId={`title-${item.id}-${id}`}
                                            className={styles.expandedTitle}
                                        >
                                            {item.title}
                                        </motion.h2>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedId(null);
                                            }}
                                            className="hover:bg-gray-200 dark:hover:bg-gray-700"
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Close</span>
                                        </Button>
                                    </div>
                                    <div className={styles.expandedContent}>
                                        <motion.div
                                            layoutId={`image-${item.id}-${id}`}
                                            className={styles.expandedPoster}
                                        >
                                            <Image
                                                src={(() => {
                                                    switch (item.media_type) {
                                                        case 'movie':
                                                        case 'tv':
                                                            return item.poster_path
                                                                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                                                : '/images/placeholder.jpg';
                                                        case 'book':
                                                            return item.poster_path || '/images/placeholder.jpg';
                                                        case 'game':
                                                            return item.poster_path || '/images/placeholder.jpg';
                                                        default:
                                                            return '/images/placeholder.jpg';
                                                    }
                                                })()}
                                                alt={item.title}
                                                width={240}
                                                height={360}
                                                className="object-cover rounded"
                                                priority
                                            />
                                        </motion.div>
                                        <div className={styles.expandedDetails}>
                                            <div className={styles.progressSection}>
                                                <ProgressSection
                                                    item={item}
                                                    onUpdateClick={(item) => {
                                                        setSelectedItem(item);
                                                        setUpdateModalOpen(true);
                                                    }}
                                                    allCategories={allCategories}
                                                    mediaItems={mediaItems}
                                                    incompleteItems={mediaItems.filter(i => !i.user_media_progress?.completed)}
                                                />
                                            </div>

                                            <div className={styles.detailsGrid}>
                                                <div>
                                                    <span className="font-semibold">Category:</span> {item.category}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Type:</span> {item.media_type}
                                                </div>
                                                {item.media_type === 'movie' && (
                                                    <>
                                                        <div>
                                                            <span className="font-semibold">Duration:</span> {item.user_media_progress?.duration} min
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Director:</span> {item.movies?.director}
                                                        </div>
                                                    </>
                                                )}
                                                {item.media_type === 'tv' && (
                                                    <>
                                                        <div>
                                                            <span className="font-semibold">Episodes:</span> {item.tv_shows?.total_episodes}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Seasons:</span> {item.tv_shows?.seasons}
                                                        </div>
                                                    </>
                                                )}
                                                {item.media_type === 'book' && (
                                                    <>
                                                        <div>
                                                            <span className="font-semibold">Pages:</span> {item.books?.page_count}
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Author:</span> {
                                                                item.books?.authors ?
                                                                    (typeof item.books.authors === 'string'
                                                                        ? JSON.parse(item.books.authors).join(', ')
                                                                        : item.books.authors.join(', ')
                                                                    )
                                                                    : 'Unknown Author'
                                                            }
                                                        </div>
                                                    </>
                                                )}
                                                {item.media_type === 'game' && (
                                                    <>
                                                        <div>
                                                            <span className="font-semibold">Playtime:</span> {item.games?.average_playtime} hours
                                                        </div>
                                                        <div>
                                                            <span className="font-semibold">Rating:</span> {item.games?.metacritic || 'N/A'}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.descriptionWrapper}>
                                        <div className={styles.description}>
                                            {item.description}
                                        </div>
                                    </div>
                                    <div className={styles.utilitySection}>
                                        {/* External Links Placeholder */}
                                        <div className="flex gap-2 mb-4 p-2 border rounded-md">
                                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">External Links Coming Soon</span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMoveToTop(item.id);
                                                            }}
                                                        >
                                                            <ArrowUp className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Move to Top of Queue</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMoveToBottom(item.id);
                                                            }}
                                                        >
                                                            <ArrowDown className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Move to Bottom of Queue</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="outline" size="icon">
                                                                    <MoveRight className="h-4 w-4" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-40">
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium text-sm">Queue Position</h4>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        max={mediaItems.length}
                                                                        placeholder="Enter position"
                                                                        onChange={(e) => {
                                                                            e.stopPropagation();
                                                                            handleCustomQueueNumber(item.id, parseInt(e.target.value));
                                                                        }}
                                                                    />
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Set Custom Queue Position</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/user-pages/gallery?mediaId=${item.id}`);
                                                            }}
                                                        >
                                                            <Users className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Open in Gallery for Social Features</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(item.id);
                                                            }}
                                                            className="hover:bg-destructive/90"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Delete Item</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {selectedItem && (
                <UpdateProgressModal
                    isOpen={updateModalOpen}
                    onClose={() => {
                        setUpdateModalOpen(false);
                        setSelectedItem(null);
                    }}
                    item={selectedItem}
                    onUpdate={(newProgress) => {
                        handleProgressUpdate(newProgress);
                    }}
                    refreshData={async () => {
                        // Add a refreshData function if needed
                        // This could fetch updated data from the server
                    }}
                    key={selectedItem.id}
                />
            )}
        </>
    );
}