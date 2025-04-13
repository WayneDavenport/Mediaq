'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Comments from './Comments';
import { useSession } from "next-auth/react";
import { toast } from 'sonner';
import CategorySelectDialog from './CategorySelectDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import JustWatchLink from '@/components/streaming/JustWatchLink';
import TmdbWatchProviders from '@/components/streaming/TmdbWatchProviders';
import BookResources from '@/components/books/BookResources';
import GameResources from '@/components/resources/GameResources';
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";


const MediaModal = ({ item, isOpen, onClose, cardPosition, isFriendItem = false, isRecommendation = false }) => {
    const [isPending, startTransition] = useTransition();
    const { data: session } = useSession();
    const [isAdding, setIsAdding] = useState(false);
    const [nextQueueNumber, setNextQueueNumber] = useState(null);
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [recommendationMessage, setRecommendationMessage] = useState('');
    const [showRecommendDialog, setShowRecommendDialog] = useState(false);
    const [friends, setFriends] = useState([]);
    const [recommendationStatus, setRecommendationStatus] = useState(item?.status || 'pending');

    useEffect(() => {
        if (isFriendItem && isOpen) {
            fetchNextQueueNumber();
        }
    }, [isFriendItem, isOpen]);

    useEffect(() => {
        if (isOpen && isFriendItem) {
            setIsAdding(false);
            setShowCategoryDialog(false);
        }
    }, [isOpen, isFriendItem]);

    useEffect(() => {
        const fetchFriends = async () => {
            const response = await fetch('/api/friends');
            const data = await response.json();
            if (data.friends) {
                setFriends(data.friends);
            }
        };
        fetchFriends();
    }, []);

    const fetchNextQueueNumber = async () => {
        try {
            const response = await fetch('/api/media-items/queue-number');
            const data = await response.json();
            setNextQueueNumber(data.nextQueueNumber);
        } catch (error) {
            console.error('Error fetching next queue number:', error);
            toast.error('Error preparing queue position');
        }
    };

    const handleAddToQueue = async (category) => {
        if (!nextQueueNumber) {
            toast.error('Unable to determine queue position');
            return;
        }

        setIsAdding(true);
        try {
            // Format the data based on media type
            let formattedData = {
                ...item,
                queue_number: nextQueueNumber,
                user_email: session.user.email,
                category: category
            };

            // Add media type specific data
            switch (item.media_type) {
                case 'book':
                    console.log('Book data:', {
                        page_count: item.books?.page_count,
                        reading_speed: session.user.reading_speed,
                        calculated_duration: item.books?.page_count ?
                            Math.ceil(item.books.page_count / (session.user.reading_speed || 1)) : 0
                    });

                    formattedData = {
                        ...formattedData,
                        authors: typeof item.books?.authors === 'string' ?
                            item.books.authors : // keep as string if it already is
                            JSON.stringify(item.books?.authors), // stringify if it's an array
                        average_rating: item.books?.average_rating,
                        categories: typeof item.books?.categories === 'string' ?
                            item.books.categories : // keep as string if it already is
                            JSON.stringify(item.books?.categories), // stringify if it's an array
                        google_books_id: item.books?.google_books_id,
                        isbn: item.books?.isbn,
                        language: item.books?.language,
                        page_count: item.books?.page_count,
                        preview_link: item.books?.preview_link,
                        published_date: item.books?.published_date,
                        publisher: item.books?.publisher,
                        ratings_count: item.books?.ratings_count,
                        reading_speed: Math.round(session.user.reading_speed || 1),
                        duration: item.books?.page_count ?
                            Math.ceil(item.books.page_count / (session.user.reading_speed || 1)) : 0,
                        estimated_reading_time: item.books?.page_count ?
                            Math.ceil(item.books.page_count / (session.user.reading_speed || 1)) : 0
                    };
                    console.log('Formatted book data:', formattedData);
                    break;

                case 'tv':
                    formattedData = {
                        ...formattedData,
                        average_runtime: item.tv_shows?.episode_run_time,
                        episode_run_times: item.tv_shows?.episode_run_times,
                        original_language: item.tv_shows?.original_language,
                        release_date: item.tv_shows?.first_air_date,
                        seasons: item.tv_shows?.number_of_seasons,
                        tmdb_id: (item.tv_shows?.tmdb_id),
                        total_episodes: item.tv_shows?.number_of_episodes,
                        vote_average: item.tv_shows?.vote_average,
                        duration: (item.tv_shows?.episode_run_time || 30) * (item.tv_shows?.number_of_episodes || 1)
                    };
                    break;

                case 'movie':
                    formattedData = {
                        ...formattedData,
                        director: item.movies?.director,
                        original_language: item.movies?.original_language,
                        release_date: item.movies?.release_date,
                        tmdb_id: Number(item.movies?.tmdb_id),
                        vote_average: Number(item.movies?.vote_average),
                        runtime: Number(item.movies?.runtime),
                        duration: Number(item.movies?.runtime) || 120
                    };
                    break;

                case 'game':
                    console.log('Processing game data in modal:', item);

                    formattedData = {
                        ...formattedData,
                        media_type: 'game',
                        // Keep game data flat at root level
                        achievements_count: parseInt(item.games?.achievements_count),
                        average_playtime: parseInt(item.games?.average_playtime),
                        esrb_rating: item.games?.esrb_rating,
                        genres: typeof item.genres === 'string' ?
                            item.genres :
                            JSON.stringify(item.genres || []),
                        metacritic: parseInt(item.games?.metacritic),
                        platforms: item.games?.platforms,
                        publishers: item.games?.publishers,
                        rating: parseFloat(item.games?.rating),
                        rating_count: parseInt(item.games?.rating_count),
                        rawg_id: parseInt(item.games?.rawg_id),
                        release_date: item.games?.release_date,
                        website: item.games?.website,
                        duration: (parseInt(item.games?.average_playtime) || 4) * 60
                    };

                    console.log('Formatted game data:', formattedData);
                    break;
            }

            const response = await fetch('/api/media-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formattedData)
            });

            if (!response.ok) {
                throw new Error('Failed to add item');
            }

            toast.success('Item added to your queue!');
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to add item');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddClick = useCallback(() => {
        setShowCategoryDialog(true);
    }, []);

    const handleRecommend = async (friendId, message) => {
        try {
            console.log('Sending recommendation:', { friendId, message, mediaItemData: item }); // Debug log
            const response = await fetch('/api/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    friendId,
                    mediaItemData: item,
                    message
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to send recommendation');
            }

            toast.success('Recommendation sent!');
            setShowRecommendDialog(false);
        } catch (error) {
            toast.error(error.message);
            console.error('Recommendation error:', error);
        }
    };

    const handleRejectRecommendation = async (recommendationId) => {
        try {
            const response = await fetch(`/api/recommendations/${recommendationId}/reject`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to reject recommendation');
            }

            setRecommendationStatus('rejected');
            toast.success('Recommendation rejected');
            onClose();
        } catch (error) {
            toast.error('Failed to reject recommendation');
            console.error('Error rejecting recommendation:', error);
        }
    };

    const handleApproveRecommendation = async (recommendationId) => {
        try {
            setIsAdding(true);
            const response = await fetch(`/api/recommendations/${recommendationId}/approve`, {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Failed to approve recommendation');
            }

            setRecommendationStatus('accepted');
            toast.success('Recommendation accepted and added to your queue!', {
                duration: 3000,
                position: 'bottom-right',
            });
            onClose(); // Close the modal after successful approval
        } catch (error) {
            toast.error('Failed to approve recommendation');
            console.error('Error approving recommendation:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const RecommendDialog = () => {
        const [localSelectedFriend, setLocalSelectedFriend] = useState('');
        const [localMessage, setLocalMessage] = useState('');

        const handleSubmit = () => {
            if (!localSelectedFriend) {
                toast.error('Please select a friend');
                return;
            }
            handleRecommend(localSelectedFriend, localMessage);
            setLocalSelectedFriend('');
            setLocalMessage('');
        };

        return (
            <Dialog
                open={showRecommendDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowRecommendDialog(false);
                        setLocalSelectedFriend('');
                        setLocalMessage('');
                    }
                }}
            >
                <DialogContent
                    className="sm:max-w-[425px]"
                    aria-describedby="recommend-dialog-description"
                >
                    <DialogHeader>
                        <DialogTitle>Recommend to Friend</DialogTitle>
                        <p
                            id="recommend-dialog-description"
                            className="text-sm text-muted-foreground"
                        >
                            Share "{item.title}" with a friend
                        </p>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="friend-select">Select Friend</Label>
                            <Select
                                value={localSelectedFriend}
                                onValueChange={setLocalSelectedFriend}
                                aria-required="true"
                            >
                                <SelectTrigger
                                    id="friend-select"
                                    aria-label="Select a friend to recommend to"
                                >
                                    <SelectValue placeholder="Choose a friend" />
                                </SelectTrigger>
                                <SelectContent>
                                    {friends.map(friend => (
                                        <SelectItem
                                            key={friend.friend_id}
                                            value={friend.friend_id}
                                        >
                                            {friend.friend_user_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="recommendation-message">Message (optional)</Label>
                            <Textarea
                                id="recommendation-message"
                                value={localMessage}
                                onChange={(e) => setLocalMessage(e.target.value)}
                                placeholder="Add a personal message..."
                                rows={3}
                                aria-label="Add a personal message to your recommendation"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleSubmit}
                            disabled={!localSelectedFriend}
                            aria-label={!localSelectedFriend ?
                                "Send recommendation - Select a friend first" :
                                "Send recommendation"
                            }
                        >
                            Send Recommendation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    useEffect(() => {
        if (isRecommendation && recommendationStatus !== 'pending') {
            onClose();
        }
    }, [recommendationStatus, isRecommendation, onClose]);

    useEffect(() => {
        // Reset recommendation status when a new item is selected
        if (item) {
            setRecommendationStatus(item.status || 'pending');
        }
    }, [item]);

    const showToast = (message, type = 'success') => {
        toast[type](message, {
            duration: 3000,
            position: 'bottom-right',
        });
    };

    if (!item) return null;

    // Debug logging
    console.log('Full item data:', item);
    console.log('Description:', item.description);
    console.log('Media type:', item.media_type);
    console.log('Media specific data:', {
        movies: item.movies,
        books: item.books,
        tv_shows: item.tv_shows,
        games: item.games
    });
    console.log('Progress data:', item.user_media_progress);
    console.log('Genres:', item.genres);
    console.log('Category:', item.category);

    const isLocked = item.locked_items && item.locked_items.length > 0;
    const lockData = isLocked ? item.locked_items[0] : null;

    const parseAuthors = (authors) => {
        try {
            return JSON.parse(authors).join(', ');
        } catch {
            return authors;
        }
    };

    const parseGenres = (genres) => {
        try {
            return JSON.parse(genres);
        } catch {
            return [];
        }
    };

    const renderMediaSpecificDetails = () => {
        console.log('Rendering media specific details for:', item.media_type);
        switch (item.media_type) {
            case 'movie':
                console.log('Movie details:', item.movies);
                return item.movies ? (
                    <>
                        <p><span className="font-semibold">Director:</span> {item.movies.director || 'N/A'}</p>
                        <p><span className="font-semibold">Release Date:</span> {item.movies.release_date ? new Date(item.movies.release_date).toLocaleDateString() : 'N/A'}</p>
                        <p><span className="font-semibold">Runtime:</span> {item.movies.runtime || 'N/A'} minutes</p>
                        <p><span className="font-semibold">Rating:</span> {item.movies.vote_average ? `${item.movies.vote_average}/10` : 'N/A'}</p>
                    </>
                ) : null;
            case 'book':
                return item.books ? (
                    <>
                        <p><span className="font-semibold">Authors:</span> {parseAuthors(item.books.authors)}</p>
                        <p><span className="font-semibold">Language:</span> {item.books.language || 'N/A'}</p>
                        <p><span className="font-semibold">Pages:</span> {item.books.page_count || 'N/A'}</p>
                    </>
                ) : null;
            case 'tv':
                return item.tv_shows ? (
                    <>
                        <p><span className="font-semibold">First Air Date:</span> {item.tv_shows.first_air_date ? new Date(item.tv_shows.first_air_date).toLocaleDateString() : 'N/A'}</p>
                        <p><span className="font-semibold">Episodes:</span> {item.tv_shows.number_of_episodes || 'N/A'}</p>
                        <p><span className="font-semibold">Rating:</span> {item.tv_shows.vote_average ? `${item.tv_shows.vote_average}/10` : 'N/A'}</p>
                    </>
                ) : null;
            case 'game':
                return item.games ? (
                    <>
                        <p><span className="font-semibold">Release Date:</span> {item.games.release_date ? new Date(item.games.release_date).toLocaleDateString() : 'N/A'}</p>
                        <p><span className="font-semibold">Rating:</span> {item.games.rating ? `${item.games.rating}/5` : 'N/A'}</p>
                        <p><span className="font-semibold">Playtime:</span> {item.games.playtime || 'N/A'} hours</p>
                    </>
                ) : null;
            default:
                return null;
        }
    };

    const renderActionButtons = () => (
        <div className="absolute right-4 top-4 z-10 flex gap-2">
            {!isFriendItem && !isRecommendation && (
                <Button
                    variant="outline"
                    onClick={() => setShowRecommendDialog(true)}
                >
                    Recommend
                </Button>
            )}
            {isFriendItem && (
                <Button
                    variant="default"
                    onClick={handleAddClick}
                    disabled={isAdding}
                >
                    {isAdding ? 'Adding...' : 'Add to My Queue'}
                </Button>
            )}
            {isRecommendation && recommendationStatus === 'pending' && (
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        onClick={() => handleApproveRecommendation(item.recommendationId)}
                    >
                        Accept
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => handleRejectRecommendation(item.recommendationId)}
                    >
                        Reject
                    </Button>
                </div>
            )}
            <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );

    const getModalGlow = (item) => {
        if (item.media_type === 'game' && item.gmg_link) {
            return "shadow-[0_0_20px_-1px_rgba(0,255,0,0.6)] hover:shadow-[0_0_25px_0px_rgba(0,255,0,0.8)]";
        }
        return "";
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{
                                ...cardPosition,
                                opacity: 0,
                                scale: 0.75,
                            }}
                            animate={{
                                x: 0,
                                y: 0,
                                opacity: 1,
                                scale: 1,
                                transition: {
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                    duration: 0.5
                                }
                            }}
                            exit={{
                                opacity: 0,
                                transition: {
                                    duration: 0.2,
                                    ease: "easeOut"
                                }
                            }}
                            className={`relative w-full max-w-2xl mx-auto bg-background rounded-lg overflow-hidden flex flex-col ${getModalGlow(item)}`}
                            style={{ maxHeight: '90vh' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {renderActionButtons()}

                            <div className="relative h-[200px] sm:h-[250px] flex-shrink-0">
                                <div
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{
                                        backgroundImage: item.poster_path ?
                                            `url(${item.media_type === 'book' || item.media_type === 'game'
                                                ? item.poster_path
                                                : `https://image.tmdb.org/t/p/w500${item.poster_path}`
                                            })` : 'none'
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                            </div>

                            <ScrollArea className="flex-1 overflow-y-auto">
                                <div className="p-6">
                                    <div className="space-y-4">
                                        <h2 className="text-2xl font-bold">{item.title}</h2>

                                        {/* Show locked status if item is locked */}
                                        {isLocked && (
                                            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
                                                <p className="font-semibold">
                                                    Locked behind: {
                                                        lockData.key_parent_id
                                                            ? "Another media item"
                                                            : lockData.key_parent_text
                                                    }
                                                </p>
                                            </div>
                                        )}

                                        {/* Debug info */}
                                        <div className="text-xs text-muted-foreground">
                                            <p>Media Type: {item.media_type}</p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                                                {item.media_type?.charAt(0).toUpperCase() + item.media_type?.slice(1)}
                                            </span>
                                            {item.category && (
                                                <span className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                                                    {item.category}
                                                </span>
                                            )}
                                            {item.genres && typeof item.genres === 'string' &&
                                                parseGenres(item.genres).map(genre => (
                                                    <span key={genre} className="px-2 py-1 bg-primary/10 rounded-full text-sm">
                                                        {genre}
                                                    </span>
                                                ))
                                            }
                                        </div>

                                        {/* Description section */}
                                        <div className="space-y-2">
                                            <p className="font-semibold">Description:</p>
                                            {item.description ? (
                                                <p className="text-muted-foreground whitespace-pre-wrap">
                                                    {item.description}
                                                </p>
                                            ) : (
                                                <p className="text-muted-foreground italic">
                                                    No description available
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {renderMediaSpecificDetails()}
                                        </div>

                                        {item.user_media_progress && (
                                            <div className="pt-4 border-t space-y-2">
                                                <p className="font-semibold">Duration:</p>
                                                <p>{item.user_media_progress.duration} minutes</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add the External Links section here */}
                                    <div className="mt-6 border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Where to Find</h3>
                                        <div className="space-y-4">
                                            {(item.media_type === 'movie' || item.media_type === 'tv') && (
                                                <TmdbWatchProviders
                                                    tmdbId={item.media_type === 'movie' ? item.movies?.tmdb_id : item.tv_shows?.tmdb_id}
                                                    mediaType={item.media_type}
                                                    title={item.title}
                                                    className="w-full"
                                                />
                                            )}

                                            {item.media_type === 'book' && (
                                                <BookResources
                                                    title={item.title}
                                                    author={item.books?.authors}
                                                    isbn={item.books?.isbn || item.books?.isbn13 || item.books?.isbn10}
                                                    className="w-full"
                                                />
                                            )}

                                            {item.media_type === 'game' && (
                                                <GameResources
                                                    title={item.title}
                                                    gmgLinkData={item.gmg_link}
                                                    className="w-full"
                                                />
                                            )}

                                            {/* Add full disclosure if any affiliate links are present */}
                                            {item.media_type === 'game' && (
                                                <AffiliateDisclosure />
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Comments section */}
                                    <div className="mt-6 border-t pt-6">
                                        <h3 className="text-lg font-semibold mb-4">Comments</h3>
                                        {session && (
                                            <Comments
                                                mediaItemId={item.id}
                                                currentUser={session.user}
                                            />
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CategorySelectDialog
                isOpen={showCategoryDialog}
                onClose={() => setShowCategoryDialog(false)}
                onConfirm={handleAddToQueue}
            />
            <RecommendDialog />
        </>
    );
};

export default MediaModal; 