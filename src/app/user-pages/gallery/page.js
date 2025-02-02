'use client'

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import MediaModal from '@/components/gallery/MediaModal';

export default function GalleryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [mediaItems, setMediaItems] = useState([]);
    const [friendsQueues, setFriendsQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchData = async () => {
            if (status === "authenticated") {
                try {
                    // Fetch user's media items
                    const mediaResponse = await fetch('/api/media-items');
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
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchData();
    }, [status]);

    if (status === 'unauthenticated') {
        router.push('/');
        return null;
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

    const handleCardClick = (item, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = window.innerWidth / 2 - (rect.left + rect.width / 2);
        const centerY = window.innerHeight / 2 - (rect.top + rect.height / 2);
        setCardPosition({ x: -centerX, y: -centerY });
        setSelectedItem(item);
    };

    const MediaRow = ({ title, items }) => (
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
                                    onClick={(e) => handleCardClick(item, e)}
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

    if (loading) {
        return <div>Loading...</div>;
    }

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
            </div>
            {/* Friend Zone Section */}
            {friendsQueues.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-3xl font-bold mb-6">Friend Zone</h2>
                    {friendsQueues.map((friendQueue) => (
                        <MediaRow
                            key={friendQueue.friend_id}
                            title={`${friendQueue.friend_user_name}'s Queue`}
                            items={friendQueue.items}
                        />
                    ))}
                </div>
            )}

            <MediaModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                cardPosition={cardPosition}
            />
        </>
    );
}
