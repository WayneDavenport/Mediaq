'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import MediaModal from '../gallery/MediaModal';

export default function CompletedSection() {
    const [completedItems, setCompletedItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCompletedItems();
    }, []);

    const fetchCompletedItems = async () => {
        try {
            const response = await fetch('/api/media-items/completed');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setCompletedItems(data.items);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleItemUpdate = async (itemId, newData) => {
        try {
            const response = await fetch(`/api/media-items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newData)
            });
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    if (isLoading) return <div>Loading completed items...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Completed</h2>
            <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                    {completedItems.map((item) => {
                        const imageUrl = item.poster_path ?
                            (item.media_type === 'book' || item.media_type === 'game') ?
                                item.poster_path :
                                `https://image.tmdb.org/t/p/w500${item.poster_path}` :
                            null;

                        return (
                            <Card
                                key={item.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setSelectedItem(item)}
                            >
                                <CardContent className="p-4 flex items-center space-x-4">
                                    <div
                                        className="w-16 h-24 bg-cover bg-center rounded"
                                        style={{
                                            backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                                            backgroundColor: !imageUrl ? 'gray' : undefined
                                        }}
                                    />
                                    <div className="flex-1">
                                        <h3 className="font-semibold line-clamp-1">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {item.media_type}
                                        </p>
                                        {item.user_media_progress?.completed_at && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Completed {formatDistanceToNow(
                                                    new Date(item.user_media_progress.completed_at),
                                                    { addSuffix: true }
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </ScrollArea>

            <MediaModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                cardPosition={{ x: 0, y: 0 }}
            />
        </div>
    );
} 