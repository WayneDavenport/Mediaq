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
import { Trash2, X } from 'lucide-react';
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import MediaTypeIcon from "@/components/ui/media-type-icon";
import ProgressChart from "@/components/progress/ProgressChart";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

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
        const sorted = [...mediaItems];

        switch (sortOption) {
            case "queue":
                return sorted.sort((a, b) =>
                    (a.user_media_progress?.queue_number || 0) - (b.user_media_progress?.queue_number || 0)
                );

            case "title":
                return sorted.sort((a, b) =>
                    a.title.localeCompare(b.title)
                );

            case "media-type":
                return sorted
                    .sort((a, b) => a.title.localeCompare(b.title)) // First sort by title
                    .sort((a, b) => a.media_type.localeCompare(b.media_type)); // Then by media type

            case "category":
                return sorted
                    .sort((a, b) => a.title.localeCompare(b.title)) // First sort by title
                    .sort((a, b) => a.category.localeCompare(b.category)); // Then by category

            default:
                return sorted;
        }
    };

    if (status === "loading" || loading) {
        return <div>Loading...</div>;
    }

    if (status === "unauthenticated") {
        return <div>Access Denied</div>;
    }

    if (mediaItems.length === 0) {
        return (
            <div className="container max-w-2xl mx-auto p-4 text-center space-y-4">
                <h1 className="text-2xl font-bold">Welcome to MediaQueue!</h1>
                <p className="text-muted-foreground">
                    Your queue is empty. Start by adding some movies, books, TV shows, or games to track.
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
                        {getSortedMediaItems().map((item) => (
                            <motion.div
                                key={item.id}
                                layoutId={`card-${item.id}-${id}`}
                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                className={styles.mediaCard}
                            >
                                <Card className="overflow-hidden group relative">
                                    <div className={styles.mediaContent}>
                                        <motion.div
                                            layoutId={`image-${item.id}-${id}`}
                                            className={styles.posterWrapper}
                                        >
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
                                                            {item.title}
                                                        </h2>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1">
                                                        <MediaTypeIcon
                                                            type={item.media_type}
                                                            className="text-white drop-shadow-md h-4 w-4 opacity-100"
                                                        />
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
                    </div>
                </div>

                <div className={styles.chartContainer}>
                    <ProgressChart
                        mediaItems={mediaItems}
                        sortOption={sortOption}
                    />
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
                                            <span className="sr-only">Delete item</span>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Link href="/user-pages/search">
                <Button>
                    Add Media
                </Button>
            </Link>
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