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
import { Trash2, X, Loader2, Plus, ArrowUp, ArrowDown, MoveRight, Users, ExternalLink, ShoppingCart, Zap, XCircle, ListChecks } from 'lucide-react';
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import MediaTypeIcon from "@/components/ui/media-type-icon";
import TimeCostChart from "@/components/progress/TImeCostChart";
import ProgressChart from "@/components/progress/ProgressChart";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/loading/loading-screen";
import JustWatchLink from '@/components/streaming/JustWatchLink';
import TmdbWatchProviders from '@/components/streaming/TmdbWatchProviders';
import BookResources from "@/components/books/BookResources";
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
import AffiliateDisclosure from '@/components/legal/AffiliateDisclosure';
import { fetchGmgLinksForGames } from "@/components/gmg/GmgLinkFetcher";
import { Textarea } from "@/components/ui/textarea";
import { getAdLinks } from '@/components/dashboard/server/AdLinks';
import StagingTask from '@/app/@search/components/StagingTask';

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
    const [visualSortOption, setVisualSortOption] = useState("queue");
    const [lockedItems, setLockedItems] = useState([]);
    const [activeChart, setActiveChart] = useState("time");
    const router = useRouter();
    const [affiliateLink, setAffiliateLink] = useState(null);
    const [isLoadingAffiliate, setIsLoadingAffiliate] = useState(false);
    const [editingNotes, setEditingNotes] = useState({});
    const [savingNotes, setSavingNotes] = useState(false);
    const [isRandomizing, setIsRandomizing] = useState(false);
    const sortIntervalRef = useRef(null);
    const [adData, setAdData] = useState([]);
    const [visibleAdIds, setVisibleAdIds] = useState([]);
    const [showTaskStaging, setShowTaskStaging] = useState(false);

    // For optimistic update revert
    const mediaItemsBeforeUpdateRef = useRef(null);

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

    // Extracted data loading function
    const loadDashboardData = async () => {
        if (status === "authenticated" && session) {
            try {
                setLoading(true);
                console.log('Fetching media items with session:', {
                    userEmail: session?.user?.email,
                    userId: session?.user?.id,
                    hasToken: !!session?.access_token
                });

                const mediaResponse = await fetch('/api/media-items');
                const mediaData = await mediaResponse.json();

                if (mediaData.error) {
                    console.error('Supabase Error:', {
                        message: mediaData.error,
                        details: mediaData.details,
                        code: mediaData.details?.code,
                        hint: mediaData.details?.hint
                    });
                    throw new Error(mediaData.error);
                }

                let processedMediaItems = [];
                if (mediaData.items) {
                    const gameItems = mediaData.items.filter(item => item.media_type === 'game');
                    if (gameItems.length > 0) {
                        const gmgLinks = await fetchGmgLinksForGames(gameItems);
                        processedMediaItems = mediaData.items.map(item => {
                            if (item.media_type === 'game') {
                                const lowerCaseTitle = item.title.toLowerCase();
                                const linkData = gmgLinks[lowerCaseTitle] || null;
                                return { ...item, gmg_link: linkData, has_gmg: !!linkData };
                            }
                            return item;
                        });
                    } else {
                        processedMediaItems = mediaData.items;
                    }
                    setMediaItems(processedMediaItems);
                } else {
                    setMediaItems([]); // Ensure mediaItems is an array even if no items
                }

                const fetchedAdData = await getAdLinks();
                setAdData(fetchedAdData);
                setVisibleAdIds(fetchedAdData.map(ad => ad.id));

                console.log('Dashboard data loaded/reloaded.');

            } catch (error) {
                console.error('Error in loadDashboardData:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                // Potentially set an error state here to show in UI
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        // Initial data fetch and on session change
        loadDashboardData();
    }, [status, session]); // Dependencies remain the same

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

    useEffect(() => {
        async function getAffiliateLink() {
            if (expandedId) {
                const currentItem = mediaItems.find(item => item.id === expandedId);
                if (currentItem && currentItem.media_type === 'game') {
                    setIsLoadingAffiliate(true);
                    try {
                        const response = await fetch(`/api/gmg/affiliate-link?title=${encodeURIComponent(currentItem.title)}`);
                        const data = await response.json();
                        setAffiliateLink(data.link);
                    } catch (error) {
                        console.error('Error fetching affiliate link:', error);
                    } finally {
                        setIsLoadingAffiliate(false);
                    }
                } else {
                    setAffiliateLink(null);
                }
            } else {
                setAffiliateLink(null);
            }
        }

        getAffiliateLink();
    }, [expandedId, mediaItems]);

    const getMaxValue = (item) => {
        switch (item.media_type) {
            case 'book':
                return item.books?.page_count || 0;
            case 'movie':
                return item.user_media_progress?.duration || item.movies?.runtime || 0;
            case 'tv':
                // For TV, max value is total episodes based on total duration and avg runtime
                const totalDuration = item.user_media_progress?.duration || 0;
                const avgRuntime = item.tv_shows?.average_runtime || 30;
                return avgRuntime > 0 ? Math.ceil(totalDuration / avgRuntime) : 0;
            case 'game':
                return item.user_media_progress?.duration || 0;
            case 'task':
                return item.tasks?.unit_range || 1; // Max value for task units
            default:
                return 100;
        }
    };

    const optimisticallyUpdateMediaItemProgress = (itemId, newProgressDetails) => {
        mediaItemsBeforeUpdateRef.current = [...mediaItems]; // Store current state for potential revert
        setMediaItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        user_media_progress: {
                            ...item.user_media_progress,
                            completed_duration: newProgressDetails.completed_duration,
                            pages_completed: newProgressDetails.pages_completed,
                            units_completed: newProgressDetails.units_completed,
                            completed: newProgressDetails.completed,
                            // Recalculate episodes_completed if it's a TV show based on new completed_duration
                            episodes_completed: item.media_type === 'tv'
                                ? Math.floor(newProgressDetails.completed_duration / (item.tv_shows?.average_runtime || 30))
                                : item.user_media_progress?.episodes_completed,
                        }
                    }
                    : item
            )
        );
    };

    const reconcileMediaItemUpdate = (updatedItemFromServer) => {
        setMediaItems(prevItems =>
            prevItems.map(item =>
                item.id === updatedItemFromServer.id ? updatedItemFromServer : item
            )
        );
        mediaItemsBeforeUpdateRef.current = null; // Clear stored state as update is confirmed
        console.log('Item reconciled with server data:', updatedItemFromServer.id);
    };

    const revertMediaItemProgressUpdate = (itemId) => {
        if (mediaItemsBeforeUpdateRef.current) {
            setMediaItems(mediaItemsBeforeUpdateRef.current);
            toast.error("Failed to update progress. Changes have been reverted.");
            console.log('Progress update reverted for item:', itemId);
        }
        mediaItemsBeforeUpdateRef.current = null; // Clear stored state
    };

    // New handler for generic optimistic updates (e.g., adding a lock)
    const optimisticallyUpdateItem = (updatedItemData) => {
        if (!mediaItemsBeforeUpdateRef.current) { // Store only if not already stored by another op
            mediaItemsBeforeUpdateRef.current = [...mediaItems];
        }
        setMediaItems(prevItems =>
            prevItems.map(item =>
                item.id === updatedItemData.id ? updatedItemData : item
            )
        );
        console.log('Item optimistically updated:', updatedItemData.id);
    };

    // New handler for reverting generic item updates
    const revertGenericItemUpdate = (itemId, actionDescription = "update item") => {
        if (mediaItemsBeforeUpdateRef.current) {
            setMediaItems(mediaItemsBeforeUpdateRef.current);
            toast.error(`Failed to ${actionDescription}. Changes have been reverted.`);
            console.log(`Generic update reverted for item: ${itemId}, action: ${actionDescription}`);
        }
        mediaItemsBeforeUpdateRef.current = null; // Clear stored state
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
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .sort((a, b) => a.media_type.localeCompare(b.media_type));
            case "category":
                return activeItems
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .sort((a, b) => a.category.localeCompare(b.category));
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

        // Check if this item is actively locked (has at least one non-completed lock)
        const isActivelyLocked = item.locked_items && item.locked_items.some(lock => !lock.completed);
        if (isActivelyLocked) {
            return "shadow-[0_0_20px_-1px_rgba(255,0,0,0.6)] hover:shadow-[0_0_25px_0px_rgba(255,0,0,0.8)]";
        }

        // Check if this item is specifically required to unlock something (that isn't completed)
        const isSpecificRequirement = allLocks.some(lock =>
            !lock.completed &&
            lock.lock_type === 'specific' &&
            lock.key_parent_id === item.id
        );
        if (isSpecificRequirement) {
            return "shadow-[0_0_20px_-1px_rgba(163,71,255,0.6)] hover:shadow-[0_0_25px_0px_rgba(163,71,255,0.8)]";
        }

        // Check if this item can contribute to any category/type locks (that aren't completed)
        const canContribute = allLocks.some(lock =>
            !lock.completed &&
            (lock.lock_type === 'media_type' || lock.lock_type === 'category') &&
            lock.key_parent_text?.toLowerCase() === (lock.lock_type === 'media_type' ? item.media_type : item.category)?.toLowerCase()
        );
        if (canContribute) {
            return "shadow-[0_0_20px_-1px_rgba(0,149,255,0.6)] hover:shadow-[0_0_25px_0px_rgba(0,149,255,0.8)]";
        }

        // Debug logs
        console.log('getItemGlow Check:', {
            id: item.id,
            title: item.title,
            media_type: item.media_type,
            hasGmgLinkProp: item.hasOwnProperty('gmg_link'), // Does the prop exist?
            gmgLinkValue: item.gmg_link, // What is its value?
            isTruthy: !!item.gmg_link, // How does the condition evaluate?
            isActivelyLocked, // Include previous checks for context
            isSpecificRequirement,
            canContribute
        });

        // Check for GMG link (only if not actively locked or a key)
        if (!isActivelyLocked && !isSpecificRequirement && !canContribute && item.media_type === 'game' && item.gmg_link) {
            return "shadow-[0_0_20px_-1px_rgba(0,255,0,0.6)] hover:shadow-[0_0_25px_0px_rgba(0,255,0,0.8)]";
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

    // Function to handle changes in the notes textarea
    const handleNotesChange = (itemId, value) => {
        setEditingNotes(prev => ({
            ...prev,
            [itemId]: value
        }));
    };

    // Function to save notes
    const handleSaveNotes = async (itemId) => {
        if (!editingNotes.hasOwnProperty(itemId)) {
            console.log("No changes to save for notes on item:", itemId);
            return; // Nothing to save if not edited
        }

        const notesToSave = editingNotes[itemId];
        setSavingNotes(true); // Start loading indicator

        try {
            const response = await fetch(`/api/media-items/${itemId}/notes`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notes: notesToSave }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save notes');
            }

            // Update local state immediately for better UX
            setMediaItems(prevItems =>
                prevItems.map(item =>
                    item.id === itemId
                        ? {
                            ...item,
                            user_media_progress: {
                                ...item.user_media_progress,
                                notes: notesToSave,
                            },
                        }
                        : item
                )
            );

            // Clear the specific item from editing state after successful save
            setEditingNotes(prev => {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            });

            toast.success("Notes saved successfully!");

        } catch (error) {
            console.error('Error saving notes:', error);
            toast.error(error.message || "Failed to save notes");
        } finally {
            setSavingNotes(false); // Stop loading indicator
        }
    };

    // --- UPDATED: Randomizer Function ---
    const handleRandomize = () => {
        if (isRandomizing) return;

        setIsRandomizing(true);
        // Keep the current visual sort option displayed
        // setVisualSortOption(sortOption); // No longer needed, keep it as is

        const sortOptionsCycle = ['queue', 'title', 'media-type', 'category'];
        let cycleIndex = 0;
        const intervalTime = 250; // ms between sort changes - slowed down slightly
        const cycles = 3; // Number of sort animations to show
        const cycleDuration = intervalTime * cycles; // Total animation duration

        // Start cycling through actual sort options for animation effect
        sortIntervalRef.current = setInterval(() => {
            // Cycle through options, skipping the currently displayed one initially for better effect
            let nextIndex = cycleIndex % sortOptionsCycle.length;
            let nextSortOption = sortOptionsCycle[nextIndex];
            // If the next option is the same as the visually selected one, try the one after that
            if (nextSortOption === visualSortOption && sortOptionsCycle.length > 1) {
                nextIndex = (cycleIndex + 1) % sortOptionsCycle.length;
                nextSortOption = sortOptionsCycle[nextIndex];
            }

            console.log(`Animating sort to: ${nextSortOption}`); // Debug log
            setSortOption(nextSortOption); // Update sorting logic state only
            cycleIndex++;
        }, intervalTime);

        // After the cycle duration, stop cycling and pick a random item
        setTimeout(() => {
            clearInterval(sortIntervalRef.current); // Stop the interval

            // Filter out actively locked items
            const eligibleItems = mediaItems.filter(item =>
                !(item.locked_items && item.locked_items.some(lock => !lock.completed))
            );

            if (eligibleItems.length === 0) {
                toast.info("No eligible items found for randomization!", {
                    description: "All items might be locked."
                });
                setSortOption('queue'); // Reset logical sort
                setVisualSortOption('queue'); // Reset visual sort
                setIsRandomizing(false);
                return;
            }

            // Select a random item
            const randomIndex = Math.floor(Math.random() * eligibleItems.length);
            const selectedItem = eligibleItems[randomIndex];

            console.log("Randomly selected item:", selectedItem.title);

            // Expand the selected item
            setExpandedId(selectedItem.id);

            // Reset both sort options and randomization state
            setSortOption('queue');
            setVisualSortOption('queue');
            setIsRandomizing(false);

        }, cycleDuration + 50); // Add slight delay after last interval clears
    };

    // Cleanup interval on component unmount
    useEffect(() => {
        return () => {
            if (sortIntervalRef.current) {
                clearInterval(sortIntervalRef.current);
            }
        };
    }, []);

    // --- RENAME: Handler to dismiss an ad ---
    const handleDismissAd = (adId, event) => {
        event.stopPropagation(); // Prevent card click when dismissing
        setVisibleAdIds(prevIds => prevIds.filter(id => id !== adId));
    };

    // Filter ad links based on visibility state
    const visibleAds = adData.filter(ad => visibleAdIds.includes(ad.id));

    const handleTaskAdded = async () => {
        setShowTaskStaging(false); // Close the modal
        toast.info("Refreshing queue to include new task...");
        await loadDashboardData(); // Reload all dashboard data
        toast.success("Queue refreshed!");
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
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <h1 className="text-2xl font-bold">
                            MediaQueue
                        </h1>

                        {/* Randomizer Button */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        onClick={handleRandomize}
                                        disabled={isRandomizing || mediaItems.length === 0}
                                        variant="outline"
                                        className="bg-purple-600 hover:bg-purple-700 text-white border-purple-700 hover:border-purple-800"
                                    >
                                        {isRandomizing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Zap className="mr-2 h-4 w-4" />
                                        )}
                                        Infinite Improbability Drive
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Engage the drive! (Selects a random unlocked item)</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Sorting Controls */}
                        <div className="flex items-center gap-4">
                            {/* Mobile Sort Dropdown (Needs similar logic if you want to prevent visual change) */}
                            <div className="block sm:hidden">
                                <Select
                                    value={visualSortOption}
                                    onValueChange={(value) => {
                                        if (!isRandomizing) {
                                            setSortOption(value);
                                            setVisualSortOption(value);
                                        }
                                    }}
                                    disabled={isRandomizing}
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

                            {/* --- UPDATED: Desktop Radio Group --- */}
                            <RadioGroup
                                defaultValue="queue"
                                value={visualSortOption}
                                onValueChange={(value) => {
                                    if (!isRandomizing) {
                                        setSortOption(value);
                                        setVisualSortOption(value);
                                    }
                                }}
                                className="hidden sm:flex space-x-4"
                                disabled={isRandomizing}
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
                                {/* --- UPDATED: Render Visible Ads --- */}
                                {visibleAds.map((ad) => ( // Use visibleAds
                                    <motion.div
                                        key={ad.id} // Use ad.id
                                        layout // Enable layout animation
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className={`${styles.mediaCard} relative group border-2 border-yellow-500 shadow-lg shadow-yellow-500/30`} // Promo styling
                                    >
                                        <a
                                            href={ad.href} // Use ad.href
                                            target="_blank"
                                            rel="noopener noreferrer sponsored"
                                            className="block w-full h-full"
                                            aria-label={ad.alt} // Use ad.alt
                                        >
                                            <Card className="overflow-hidden h-full">
                                                <div className={styles.mediaContent}>
                                                    <div className={styles.posterWrapper}>
                                                        <Image
                                                            src={ad.image} // Use ad.image
                                                            alt={ad.alt}
                                                            width={160}
                                                            height={160}
                                                            className="object-cover rounded w-20 h-20"
                                                            // Consider adding unoptimized prop check for placeholders
                                                            unoptimized={ad.image.includes('_placeholder') || !ad.image.startsWith('/')}
                                                        />
                                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:flex items-center justify-center p-2 hidden">
                                                            <p className="text-white text-xs text-center font-medium line-clamp-2">{ad.title}</p> {/* Use ad.title */}
                                                        </div>
                                                        <Badge variant="destructive" className="absolute top-1 left-1 text-xs px-1.5 py-0.5">Ad</Badge>
                                                    </div>
                                                    <div className="sm:hidden flex flex-1 justify-between items-center">
                                                        <h2 className="text-sm font-medium line-clamp-2">{ad.title}</h2> {/* Use ad.title */}
                                                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-1" />
                                                    </div>
                                                </div>
                                            </Card>
                                        </a>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-0 right-0 h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-full z-10"
                                            onClick={(e) => handleDismissAd(ad.id, e)} // Use handleDismissAd and ad.id
                                            aria-label={`Dismiss ${ad.title} promotion`} // Use ad.title
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                ))}
                                {/* --- END UPDATED --- */}

                                {/* Render User's Media Items (no changes needed here) */}
                                {getSortedMediaItems().map((item) => {
                                    console.log('Item GMG data:', {
                                        id: item.id,
                                        mediaType: item.media_type,
                                        gmgLink: item.gmg_link,
                                        hasGmg: item.media_type === 'game' && item.gmg_link
                                    });

                                    return (
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
                                                <div
                                                    className={styles.mediaContent}
                                                    data-locked={item.is_locked}
                                                    data-is-key={item.is_key}
                                                    data-has-gmg={item.has_gmg ? 'true' : undefined}
                                                >
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
                                                        {item.media_type === 'task' && !item.poster_path ? (
                                                            <div className="w-20 h-20 grid place-items-center bg-muted rounded">
                                                                <ListChecks className="h-10 w-10 text-muted-foreground" />
                                                            </div>
                                                        ) : (
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
                                                        )}
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
                                    );
                                })}
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
                                {/* Add Task Button */}
                                <Link href="#" onClick={() => setShowTaskStaging(true)} className={styles.mediaCard}>
                                    <Card className="overflow-hidden group relative">
                                        <div className={styles.mediaContent}>
                                            <div className={styles.posterWrapper}>
                                                <div className="w-20 h-20 grid place-items-center bg-blue-600 rounded">
                                                    <Plus className="h-8 w-8 text-white" />
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
                                                    <div className="relative h-full flex items-center justify-center">
                                                        <h2 className="text-white text-sm text-center font-medium">
                                                            Add New Task
                                                        </h2>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Add mobile-only title */}
                                            <div className="sm:hidden flex flex-1 justify-between items-center">
                                                <h2 className="text-sm font-medium">
                                                    Add New Task
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
                            defaultValue="time"
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
                                            {/* Bento box layout for details */}
                                            <div className={styles.detailsBentoContainer}>
                                                {/* Progress section - full width */}
                                                <div className={styles.progressSection}>
                                                    <ProgressSection
                                                        item={item}
                                                        onUpdateClick={(itemToUpdate) => {
                                                            setSelectedItem(itemToUpdate);
                                                            setUpdateModalOpen(true);
                                                        }}
                                                        allCategories={allCategories}
                                                        mediaItems={mediaItems}
                                                        incompleteItems={mediaItems.filter(i => !i.user_media_progress?.completed)}
                                                        // Pass the new set of handlers for optimistic updates
                                                        onOptimisticItemUpdate={optimisticallyUpdateItem}
                                                        onServerConfirmedItemUpdate={reconcileMediaItemUpdate}
                                                        onItemUpdateError={(itemId) => revertGenericItemUpdate(itemId, "add lock requirements")}
                                                    />
                                                </div>

                                                {/* Details grid in first bento box */}
                                                <div className={styles.bentoBox}>
                                                    <div className={styles.detailsGrid}>
                                                        <div className={styles.detailItem}>
                                                            <div className={styles.detailLabel}>Category</div>
                                                            <div className={styles.detailValue}>{item.category}</div>
                                                        </div>

                                                        <div className={styles.detailItem}>
                                                            <div className={styles.detailLabel}>Type</div>
                                                            <div className={styles.detailValue}>
                                                                {item.media_type === 'tv' ? 'TV Show' :
                                                                    item.media_type === 'movie' ? 'Movie' :
                                                                        item.media_type === 'book' ? 'Book' : 'Game'}
                                                            </div>
                                                        </div>

                                                        {/* Media specific details based on media type */}
                                                        {item.media_type === 'movie' && (
                                                            <>
                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Duration</div>
                                                                    <div className={styles.detailValue}>{item.user_media_progress?.duration} min</div>
                                                                </div>

                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Director</div>
                                                                    <div className={styles.detailValue}>{item.movies?.director || 'Unknown'}</div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {item.media_type === 'tv' && (
                                                            <>
                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Episodes</div>
                                                                    <div className={styles.detailValue}>{item.tv_shows?.total_episodes || '?'}</div>
                                                                </div>

                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Episode Length</div>
                                                                    <div className={styles.detailValue}>{item.tv_shows?.average_runtime || '?'} min</div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {item.media_type === 'book' && (
                                                            <>
                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Pages</div>
                                                                    <div className={styles.detailValue}>{item.books?.page_count || '?'}</div>
                                                                </div>

                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Author</div>
                                                                    <div className={styles.detailValue}>{item.books?.authors || 'Unknown'}</div>
                                                                </div>
                                                            </>
                                                        )}

                                                        {item.media_type === 'game' && (
                                                            <>
                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Playtime</div>
                                                                    <div className={styles.detailValue}>{Math.round((item.user_media_progress?.duration || 0) / 60)} hours</div>
                                                                </div>

                                                                <div className={styles.detailItem}>
                                                                    <div className={styles.detailLabel}>Platform</div>
                                                                    <div className={styles.detailValue}>{item.games?.platforms || 'Various'}</div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* External links in second bento box */}
                                                <div className={styles.bentoBox}>
                                                    <div className={styles.externalLinksContainer}>
                                                        {/* Media-specific headings */}
                                                        {item.media_type === 'game' ? (
                                                            <h3 className="flex items-center gap-1 text-sm">
                                                                <ShoppingCart className="h-4 w-4" /> Buy Now!
                                                            </h3>
                                                        ) : (
                                                            <h3 className="flex items-center gap-1">
                                                                <ExternalLink className="h-4 w-4" /> External Links
                                                            </h3>
                                                        )}

                                                        {(item.media_type === 'movie' || item.media_type === 'tv') && (
                                                            <div className="mt-1 mb-1 space-y-2">
                                                                <h3 className="text-sm font-medium text-muted-foreground">Where to Watch</h3>
                                                                <TmdbWatchProviders
                                                                    tmdbId={item.movies?.tmdb_id || item.tv_shows?.tmdb_id}
                                                                    mediaType={item.media_type}
                                                                    title={item.title}
                                                                />
                                                                {(item.movies?.tmdb_id || item.tv_shows?.tmdb_id) && (
                                                                    <a
                                                                        href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(item.title)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer nofollow"
                                                                        className="text-xs text-muted-foreground hover:text-foreground underline inline-flex items-center gap-1"
                                                                    >
                                                                        See all options on JustWatch <ExternalLink className="h-3 w-3" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}

                                                        {item.media_type === 'book' && (
                                                            <div className="mt-1 mb-1">
                                                                <BookResources
                                                                    title={item.title}
                                                                    author={item.books?.authors}
                                                                    isbn={item.books?.isbn || item.books?.isbn13 || item.books?.isbn10}
                                                                />
                                                            </div>
                                                        )}

                                                        {item.media_type === 'game' && (
                                                            <>
                                                                {isLoadingAffiliate ? (
                                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                                        Finding deals...
                                                                    </div>
                                                                ) : affiliateLink ? (
                                                                    <>
                                                                        <a
                                                                            href={affiliateLink.affiliate_link}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={styles.affiliateLink}
                                                                        >
                                                                            <div className={styles.affiliateLinkContent}>
                                                                                <Image
                                                                                    src="/images/Green-Man-Gaming-logo_RGB_Dark-BG.png"
                                                                                    alt="Green Man Gaming"
                                                                                    width={80}
                                                                                    height={22}
                                                                                    className={styles.affiliateLogo}
                                                                                />
                                                                            </div>
                                                                            <span className={styles.affiliatePrice}>
                                                                                ${affiliateLink.price}
                                                                            </span>
                                                                        </a>
                                                                        <AffiliateDisclosure minimal={true} />
                                                                    </>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">No store links available</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* New Bento Box for Notes */}
                                            <div className={styles.bentoBox}>
                                                <h3 className="text-sm font-medium mb-2">Notes</h3>
                                                <Textarea
                                                    placeholder="Add your notes here..."
                                                    value={editingNotes[item.id] ?? item.user_media_progress?.notes ?? ''}
                                                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                                    className="min-h-[80px] text-sm" // Adjust height as needed
                                                    disabled={savingNotes}
                                                />
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card close
                                                        handleSaveNotes(item.id);
                                                    }}
                                                    disabled={savingNotes || !editingNotes.hasOwnProperty(item.id)} // Disable if saving or no changes
                                                    className="mt-2 float-right" // Position button
                                                >
                                                    {savingNotes ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        'Save Notes'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.descriptionWrapper}>
                                        <div className={styles.description}>
                                            {item.description}
                                        </div>
                                    </div>

                                    {/* Action Buttons - Now wrapped in a container for centering */}
                                    <div className={styles.actionButtonsContainer}>
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
                        // If an update was attempted and failed, revert might have already happened.
                        // If modal is closed WITHOUT saving, ensure any lingering revert ref is cleared.
                        if (mediaItemsBeforeUpdateRef.current && selectedItem && mediaItemsBeforeUpdateRef.current.find(i => i.id === selectedItem.id)) {
                            // Check if selectedItem still exists in ref, implying it might not have been processed by reconcile/revert for THIS modal instance
                            // This logic might be tricky if multiple modals/updates can be concurrent (they can't here)
                            // For safety, let's clear it if the modal for selectedItem is closing.
                            mediaItemsBeforeUpdateRef.current = null;
                        }
                    }}
                    item={selectedItem}
                    onOptimisticUpdate={optimisticallyUpdateMediaItemProgress}
                    onServerConfirmedUpdate={reconcileMediaItemUpdate}
                    onUpdateError={revertMediaItemProgressUpdate}
                    refreshData={async () => {
                        // This refreshData might not be strictly necessary if optimistic updates + reconciliation work well.
                        // Consider removing if full item data is consistently returned and reconciled.
                        // For now, let's keep it as a fallback or for scenarios not covered by item-specific updates.
                        const mediaResponse = await fetch('/api/media-items');
                        const mediaData = await mediaResponse.json();
                        if (mediaData.items) {
                            // Simplified, assuming fetchGmgLinksForGames and ad data are handled elsewhere or not critical for this refresh path
                            setMediaItems(mediaData.items);
                        }
                    }}
                    key={selectedItem.id} // Ensure modal re-renders with fresh state if item changes
                />
            )}
            {/* StagingTask Modal */}
            {showTaskStaging && (
                <StagingTask
                    open={showTaskStaging}
                    onClose={() => setShowTaskStaging(false)}
                    allCategories={allCategories}
                    refreshQueue={handleTaskAdded}
                />
            )}
        </>
    );
}