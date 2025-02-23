'use client'

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import MediaModal from '@/components/gallery/MediaModal';
import Link from 'next/link';
import { toast } from 'sonner';

function GalleryContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [mediaItems, setMediaItems] = useState([]);
    const [friendsQueues, setFriendsQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
    const [isFriendItem, setIsFriendItem] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCommentId, setSelectedCommentId] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (status === "authenticated") {
                try {
                    // Fetch user's media items
                    const mediaResponse = await fetch('/api/media-items');
                    console.log(mediaResponse);
                    const mediaData = await mediaResponse.json();
                    if (mediaData.items) {
                        setMediaItems(mediaData.items);
                    }

                    // Fetch friends' queues
                    const friendsResponse = await fetch('/api/friends/queues');
                    const friendsData = await friendsResponse.json();
                    if (friendsData.queues) {
                        setFriendsQueues(friendsData.queues);
                    }

                    // Fetch recommendations
                    const recsResponse = await fetch('/api/recommendations');
                    const recsData = await recsResponse.json();
                    setRecommendations(recsData.recommendations);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [status]);

    useEffect(() => {
        const mediaId = searchParams.get('mediaId');
        const commentId = searchParams.get('commentId');

        if (mediaId) {
            // First check user's media items
            let item = mediaItems.find(item => item.id === mediaId);

            // If not found in user's items, check friend queues
            if (!item) {
                for (const friendQueue of friendsQueues) {
                    item = friendQueue.items.find(i => i.id === mediaId);
                    if (item) {
                        setIsFriendItem(true);
                        break;
                    }
                }
            }

            if (item) {
                setSelectedItem(item);
                setModalOpen(true);

                // If there's a commentId, pass it to the MediaModal
                if (commentId) {
                    setSelectedCommentId(commentId);
                }
            }
        }
    }, [searchParams, mediaItems, friendsQueues]);

    if (status === 'unauthenticated') {
        router.push('/');
        return null;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    // Add this check for empty state
    if (mediaItems.length === 0) {
        return (
            <div className="container max-w-2xl mx-auto p-4 text-center space-y-4">
                <h1 className="text-3xl font-bold">Media Gallery</h1>
                <p className="text-muted-foreground">
                    Your gallery is empty. Discover and add media items to start building your collection.
                </p>
                <Link
                    href="/user-pages/search"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Start Searching
                </Link>
            </div>
        );
    }

    // Separate queued and unqueued items
    const queuedItems = mediaItems
        .filter(item => item.user_media_progress?.queue_number)
        .sort((a, b) => a.user_media_progress.queue_number - b.user_media_progress.queue_number);

    const unqueuedItems = mediaItems.filter(item => !item.user_media_progress?.queue_number);

    const groupedByType = mediaItems.reduce((acc, item) => {
        const type = item.media_type?.charAt(0).toUpperCase() + item.media_type?.slice(1) || 'Other';
        if (!acc[type]) acc[type] = [];
        acc[type].push(item);
        return acc;
    }, {});

    const groupedByCategory = mediaItems.reduce((acc, item) => {
        // Get categories from both category field and parsed genres
        const categories = new Set();
        if (item.category) categories.add(item.category);

        // Parse genres if it exists and is a string
        /*
        if (item.genres && typeof item.genres === 'string') {
            try {
                const genreArray = JSON.parse(item.genres);
                genreArray.forEach(genre => categories.add(genre));
            } catch (e) {
                console.error('Error parsing genres:', e);
            }
        }
        */

        // Add to all relevant category groups
        categories.forEach(category => {
            if (!acc[category]) acc[category] = [];
            acc[category].push(item);
        });

        return acc;
    }, {});

    const handleCardClick = (item, event, isFromFriend = false) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = window.innerWidth / 2 - (rect.left + rect.width / 2);
        const centerY = window.innerHeight / 2 - (rect.top + rect.height / 2);
        setCardPosition({ x: -centerX, y: -centerY });
        setSelectedItem(item);
        setIsFriendItem(isFromFriend);
    };
    const handleApproveRecommendation = async (recommendationId) => {
        try {
            const response = await fetch(`/api/recommendations/${recommendationId}/approve`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Failed to approve recommendation');

            // Refresh data
            fetchData();
            toast.success('Added to your collection!');
        } catch (error) {
            toast.error('Failed to add item');
            console.error(error);
        }
    };

    const MediaRow = ({ title, items, isFriendQueue = false, isRecommendation = false }) => (
        <div className="py-4">
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <Carousel className="w-full max-w-screen-xl mx-auto">
                <CarouselContent className="-ml-4">
                    {items.map((item) => {
                        // Get the appropriate image URL based on media type
                        let imageUrl;
                        if (item.media_type === 'book') {
                            imageUrl = item.poster_path; // Direct Google Books URL
                        } else if (item.media_type === 'game') {
                            imageUrl = item.poster_path; // Direct RAWG URL
                        } else {
                            // TMDB path needs the base URL
                            imageUrl = item.poster_path ?
                                `https://image.tmdb.org/t/p/w500${item.poster_path}` :
                                null;
                        }

                        return (
                            <CarouselItem key={item.id} className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4">
                                <Card
                                    className="cursor-pointer"
                                    onClick={(e) => handleCardClick(item, e, isFriendQueue)}
                                >
                                    <CardContent
                                        className="flex aspect-[2/3] items-center justify-center p-6 relative"
                                        style={{
                                            backgroundImage: imageUrl ?
                                                `url(${imageUrl})` :
                                                'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <div className="text-white text-center">
                                                <h3 className="font-semibold">{item.title}</h3>
                                                <p className="text-sm text-gray-300">
                                                    {item.media_type?.charAt(0).toUpperCase() + item.media_type?.slice(1)}
                                                </p>
                                                {item.user_media_progress?.queue_number && (
                                                    <p className="text-sm text-gray-300">
                                                        Queue: {item.user_media_progress.queue_number}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    );

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">My Media Gallery</h1>

                {/* Queue Row */}
                {queuedItems.length > 0 && (
                    <MediaRow
                        title="Queue"
                        items={queuedItems}
                    />
                )}

                {/* Unqueued Row */}
                {unqueuedItems.length > 0 && (
                    <MediaRow
                        title="Unqueued Items"
                        items={unqueuedItems}
                    />
                )}


                {/* Media Type Sections */}
                {Object.entries(groupedByType).map(([type, items]) => (
                    <MediaRow
                        key={type}
                        title={`${type}s`}
                        items={items}
                    />
                ))}

                {/* Category Sections */}
                {Object.entries(groupedByCategory).map(([category, items]) => (
                    <MediaRow
                        key={category}
                        title={category}
                        items={items}
                    />
                ))}

                {/* Friend Zone Section */}
                {friendsQueues.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-3xl font-bold mb-6">Friend Zone</h2>
                        {friendsQueues.map((friendQueue) => (
                            <MediaRow
                                key={friendQueue.friend_id}
                                title={`${friendQueue.friend_user_name}'s Queue`}
                                items={friendQueue.items}
                                isFriendQueue={true}
                            />
                        ))}
                    </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <MediaRow
                        title="Recommended by Friends"
                        items={recommendations.map(rec => ({
                            ...rec.media_item_data,
                            recommendedBy: rec.sender_name,
                            recommendationId: rec.id
                        }))}
                        isRecommendation={true}
                    />
                )}
            </div>

            <MediaModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => {
                    setSelectedItem(null);
                    setIsFriendItem(false);
                    setSelectedCommentId(null);
                }}
                cardPosition={cardPosition}
                isFriendItem={isFriendItem}
                selectedCommentId={selectedCommentId}
            />
        </>
    );
}

export default function Gallery() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GalleryContent />
        </Suspense>
    );
}